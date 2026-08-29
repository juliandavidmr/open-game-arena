import Link from "next/link";
import { LanguageControl } from "./site-controls";

const footerLinks = [
  { href: "/about", label: "About / Acerca de" },
  { href: "/privacy", label: "Privacy / Privacidad" },
] as const;

export function SiteFooter() {
  return (
    <footer className="footer sm:footer-horizontal bg-base-200 text-base-content border-base-300 items-center border-t p-8 sm:p-10">
      <aside className="grid-flow-col items-center">
        <div>
          <Link
            href="/"
            className="link link-hover text-base-content text-sm font-black tracking-wide uppercase"
          >
            Open Game Arena
          </Link>
          <p className="text-base-content/75 mt-1 max-w-md text-sm">
            A public arena for autonomous AI chess matches.
          </p>
        </div>
      </aside>

      <nav
        aria-label="Footer navigation"
        className="grid-flow-col gap-6 sm:place-self-center sm:justify-self-end"
      >
        <LanguageControl />
        {footerLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="link link-hover text-base-content/80 hover:text-primary focus-visible:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
