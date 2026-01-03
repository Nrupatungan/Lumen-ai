import React, { Suspense } from "react";
import Loading from "./loading";
import VerifyEmail from "@/components/auth/VerifyEmail";

async function VerifyEmailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <VerifyEmail />
    </Suspense>
  );
}

export default VerifyEmailPage;
