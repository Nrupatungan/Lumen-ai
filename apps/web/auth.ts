import NextAuth, { Account, type NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { api } from "@/lib/apiClient";
import jwt from "jsonwebtoken";
import { JWT } from "next-auth/jwt";

const authResult = NextAuth({
  providers: [
    GitHub,
    Google,

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        try {
          const res = await api.post("/users/login", credentials);
          return res.data.user ?? null;
        } catch {
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  cookies: {
    sessionToken: {
      name: "__Secure-authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "none", // 👈 REQUIRED for cross-subdomain
        secure: true, // 👈 REQUIRED for SameSite=none
        path: "/",
        domain: ".lumen-ai.space", // 👈 THIS IS THE FIX
      },
    },
  },

  jwt: {
    encode: async ({ token }) => {
      return jwt.sign(token!, process.env.AUTH_SECRET!, {
        algorithm: "HS256",
      });
    },

    decode: async ({ token }) => {
      try {
        return jwt.verify(token!, process.env.AUTH_SECRET!, {
          algorithms: ["HS256"],
        }) as JWT;
      } catch {
        return null;
      }
    },
  },

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "credentials") return true;

      try {
        const res = await api.post("/users/oauth-login", {
          provider: account?.provider,
          providerAccountId: account?.providerAccountId,
          email: profile?.email,
          name: profile?.name,
          image: profile?.picture,
        });

        (account as Account).backendUser = res.data.user;
        return true;
      } catch {
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      if ((account as Account)?.backendUser) {
        const u = (account as Account).backendUser;
        token.id = u.id;
        token.role = u.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/sign-in",
  },

  secret: process.env.AUTH_SECRET,
});

export const auth: NextAuthResult["auth"] = authResult.auth;
export const handlers: NextAuthResult["handlers"] = authResult.handlers;
export const signIn: NextAuthResult["signIn"] = authResult.signIn;
export const signOut: NextAuthResult["signOut"] = authResult.signOut;
