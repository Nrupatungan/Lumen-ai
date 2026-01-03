import { AuthCard } from "@/components/auth/AuthCard";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <AuthCard title="Create Account">
      <SignUpForm />
    </AuthCard>
  );
}
