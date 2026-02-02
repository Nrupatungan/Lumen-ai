if (process.env.NODE_ENV !== "production") {
  const { config } = await import("dotenv");
  config();
}

if(!process.env.FRONTEND_URL) {
   throw new Error(`Missing required env var: FRONTEND_URL`);
}
