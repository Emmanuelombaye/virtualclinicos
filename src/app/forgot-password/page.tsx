import { Logo } from "@/components/brand/Logo";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#EFF4FF_0%,#F1F5F9_45%,#FFFFFF_100%)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-vco-border bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
        <div className="mb-6 flex justify-center">
          <Logo size={40} />
        </div>
        <h1 className="text-center text-xl font-semibold text-vco-ink">
          Forgot password
        </h1>
        <p className="mt-1 text-center text-sm text-vco-muted">
          We&apos;ll email a one-hour reset link if the account exists.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
