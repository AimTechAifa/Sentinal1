import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/utils";
import logoSrc from "@/public/sentinel-logo.png";

const LOGO_SRC = logoSrc as StaticImageData;

type SentinelLogoProps = {
  /** full — sidebar expanded / login; icon — collapsed sidebar shield crop; hero — login marketing panel */
  variant?: "full" | "icon" | "hero";
  className?: string;
  priority?: boolean;
};

const VARIANTS = {
  full: { width: 220, height: 88, imgClass: "h-[52px] w-auto max-w-[220px] object-contain object-left" },
  icon: { width: 80, height: 80, imgClass: "h-10 w-10 object-cover object-[12%_center] scale-[2.2]" },
  hero: { width: 360, height: 360, imgClass: "h-auto w-full max-w-[320px] object-contain drop-shadow-2xl" },
} as const;

export function SentinelLogo({ variant = "full", className, priority }: SentinelLogoProps) {
  const v = VARIANTS[variant];

  if (variant === "icon") {
    return (
      <div
        className={cn(
          "relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[var(--border)]",
          className
        )}
        aria-hidden
      >
        <Image
          src={LOGO_SRC}
          alt=""
          fill
          sizes="40px"
          unoptimized
          className="object-cover object-[50%_18%] scale-[2.35]"
          priority={priority}
        />
      </div>
    );
  }

  return (
    <Image
      src={LOGO_SRC}
      alt="Sentinel Release Management"
      width={v.width}
      height={v.height}
      unoptimized
      className={cn(v.imgClass, className)}
      priority={priority}
    />
  );
}

export { logoSrc as LOGO_PATH };
