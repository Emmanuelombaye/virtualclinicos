import { Logo } from "@/components/brand/Logo";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { peekResetToken } from "@/lib/services/password";
import Link from "next/link";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = await peekResetToken(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#EFF4FF_0%,#F1F5F9_45%,#FFFFFF_100%)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-vco-border bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
        <div className="mb-6 flex justify-center">
          <Logo size={40} />
        </div>
        <h1 className="text-center text-xl font-semibold text-vco-ink">
          Choose a new password
        </h1>
        {!valid ? (
          <div className="mt-6 text-center text-sm">
            <p className="text-[#B42318]">This reset link is invalid or expired.</p>
            <Link
              href="/forgot-password"
              className="mt-3 inline-block font-semibold text-[#1E40FF]"
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-center text-sm text-vco-muted">
              Resetting password for {valid.user.email}
            </p>
            <ResetPasswordForm token={token} />
          </>
        )}
      </div>
    </div>
  );
}
