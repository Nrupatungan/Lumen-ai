import { auth } from "@/auth";
import { SignInForm } from "@/components/auth/SignInForm";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const session = await auth();

  if (session) redirect("/");

  return <SignInForm />;
}
