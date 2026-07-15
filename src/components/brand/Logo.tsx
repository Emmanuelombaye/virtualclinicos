import { cn } from "@/lib/ui";

type LogoProps = {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

/** Brand mark — plain img to `public/logo.svg` (no Tailwind / next/image quirks). */
export function LogoMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt="VirtualClinicOS"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      style={{ width: size, height: size, display: "block" }}
    />
  );
}

export function Logo({
  className,
  size = 32,
  showWordmark = true,
  wordmarkClassName,
}: LogoProps) {
  return (
    <div
      className={cn("flex items-center gap-2.5", className)}
      data-testid="vco-logo"
    >
      <LogoMark size={size} />
      {showWordmark ? (
        <span
          className={cn(
            "text-[15px] font-semibold tracking-tight text-vco-ink",
            wordmarkClassName,
          )}
          style={{ color: "#0F172A" }}
        >
          VirtualClinic
          <span style={{ color: "#2E5BFF" }}>OS</span>
        </span>
      ) : null}
    </div>
  );
}
