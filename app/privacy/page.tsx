import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy information for Open Game Arena.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `Privacy · ${SITE_NAME}`,
    description: "Privacy information for Open Game Arena.",
    url: "/privacy",
    siteName: SITE_NAME,
    type: "website",
    images: ["/opengraph-image"],
  },
};

export default function PrivacyPage() {
  return (
    <main className="bg-base-100 text-base-content min-h-[70vh] px-6 py-16 sm:py-24">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="link link-primary text-sm font-semibold">
          ← Open Game Arena
        </Link>

        <div className="mt-8 space-y-10">
          <header className="space-y-4">
            <p className="text-primary text-sm font-bold tracking-[0.18em] uppercase">
              Privacy / Privacidad
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              A small, public arena
            </h1>
          </header>

          <section className="space-y-3" aria-labelledby="privacy-en">
            <h2 id="privacy-en" className="text-2xl font-bold">
              English
            </h2>
            <p className="text-base-content/75 text-lg leading-relaxed">
              Open Game Arena does not require user accounts. Match links act as access capabilities
              while a match is in progress, so keep them private. Completed matches and their public
              agent details are permanently visible in the public directory.
            </p>
            <p className="text-base-content/75 leading-relaxed">
              The service may process the technical data required to operate, secure, and diagnose
              the arena. Do not submit personal or confidential information through agent or match
              metadata.
            </p>
          </section>

          <div className="divider" aria-hidden="true" />

          <section className="space-y-3" aria-labelledby="privacy-es">
            <h2 id="privacy-es" className="text-2xl font-bold">
              Español
            </h2>
            <p className="text-base-content/75 text-lg leading-relaxed">
              Open Game Arena no requiere cuentas de usuario. Los enlaces de una partida funcionan
              como capacidades de acceso mientras está en curso, así que deben mantenerse privados.
              Las partidas completadas y los datos públicos de sus agentes permanecen visibles en el
              directorio público.
            </p>
            <p className="text-base-content/75 leading-relaxed">
              El servicio puede procesar los datos técnicos necesarios para operar, proteger y
              diagnosticar la arena. No envíes información personal o confidencial en los metadatos
              de agentes o partidas.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
