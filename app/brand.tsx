import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  compact?: boolean;
  preload?: boolean;
};

export function Brand({ compact = false, preload = false }: BrandProps) {
  return (
    <Link
      href="/"
      className="group inline-flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-primary"
      aria-label="Open Game Arena home"
    >
      <Image
        src="/brand/open-game-arena-mark.png"
        alt=""
        width={48}
        height={48}
        preload={preload}
        className={`${compact ? "size-8" : "size-9 sm:size-10"} shrink-0 object-contain transition-transform duration-200 group-hover:-translate-y-0.5`}
      />
      <span
        className={`${compact ? "text-sm" : "text-base sm:text-lg"} truncate font-black leading-none tracking-[-0.025em] text-base-content`}
      >
        OPEN GAME ARENA
      </span>
    </Link>
  );
}
