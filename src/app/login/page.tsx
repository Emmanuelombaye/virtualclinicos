import { Logo } from "@/components/brand/Logo";
import { DEMO_LOGIN_HINTS } from "@/lib/auth/users";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#EFF4FF_0%,#F1F5F9_45%,#FFFFFF_100%)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-vco-border bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
        <div className="mb-6 flex justify-center">
          <Logo size={40} />
        </div>
        <h1 className="text-center text-xl font-semibold text-vco-ink">
          Sign in to VirtualClinicOS
        </h1>
        <p className="mt-1 text-center text-sm text-vco-muted">
          Demo password for all accounts: <b>demo</b>
        </p>
        {sp.reset ? (
          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-800">
            Password updated — sign in with your new password.
          </p>
        ) : null}

        <LoginForm />

        <div className="mt-6 border-t border-vco-border pt-4">
          <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            Quick pick
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600">
            {DEMO_LOGIN_HINTS.map((u) => (
              <li key={u.email} className="flex justify-between gap-2">
                <span>
                  {u.name}{" "}
                  <span className="text-xs text-slate-400">
                    ({u.role.toUpperCase()})
                  </span>
                </span>
                <span className="truncate text-xs text-slate-400">{u.email}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
