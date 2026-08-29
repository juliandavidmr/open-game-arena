"use client";

import { gsap } from "gsap";
import { useLayoutEffect, useRef } from "react";
import styles from "./hero.module.css";

export type HeroProps = {
  tagline: string;
  claim: string;
  createLabel: string;
  creatingLabel: string;
  alternativeLabel: string;
  busy: boolean;
  onCreate: () => void | Promise<void>;
};

const squares = Array.from({ length: 64 }, (_, index) => index);

function Knight() {
  return (
    <svg viewBox="0 0 96 112" role="presentation">
      <path d="M25 92h55v12H16c0-6 3-10 9-12Z" />
      <path d="M27 84c3-17 12-27 26-36-9 1-17-1-23-7 4-17 17-29 38-36l-2 13c13 9 18 25 12 39-4 10-12 16-20 23l-2 4H27Z" />
      <path className={styles.pieceCutout} d="m50 21 12 8-15 3 3-11Z" />
      <circle className={styles.pieceCutout} cx="62" cy="39" r="3" />
    </svg>
  );
}

function Rook() {
  return (
    <svg viewBox="0 0 96 112" role="presentation">
      <path d="M19 8h14v13h10V8h14v13h10V8h14v27l-9 9 7 44H17l7-44-5-9V8Z" />
      <path d="M12 92h72v12H12z" />
      <path className={styles.pieceCutout} d="M31 48h34l2 8H29l2-8Z" />
    </svg>
  );
}

export function Hero({
  tagline,
  claim,
  createLabel,
  creatingLabel,
  alternativeLabel,
  busy,
  onCreate,
}: HeroProps) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!root.current) return;

    const context = gsap.context(() => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        intro
          .fromTo(`[data-hero-copy]`, { y: 28 }, { y: 0, duration: 0.8 })
          .fromTo(
            `[data-title-line]`,
            {
              yPercent: 110,
              rotate: 2,
              clipPath: "inset(0 0 100% 0)",
            },
            {
              yPercent: 0,
              rotate: 0,
              clipPath: "inset(0 0 0% 0)",
              duration: 0.85,
              stagger: 0.1,
              ease: "expo.out",
            },
            "<0.1",
          )
          .fromTo(
            `[data-hero-action]`,
            { y: 18 },
            { y: 0, duration: 0.55, stagger: 0.08 },
            "-=0.35",
          )
          .fromTo(
            `[data-board]`,
            { y: 60, rotateX: 18, rotateZ: 5, scale: 0.9 },
            {
              y: 0,
              rotateX: 0,
              rotateZ: 0,
              scale: 1,
              duration: 1.15,
              ease: "expo.out",
            },
            0.15,
          )
          .fromTo(
            `[data-square]`,
            { scale: 0.72 },
            {
              scale: 1,
              duration: 0.28,
              stagger: { amount: 0.55, grid: [8, 8], from: "center" },
            },
            0.3,
          )
          .fromTo(
            `[data-piece="knight"]`,
            { xPercent: -80, yPercent: 45, rotate: -18 },
            {
              xPercent: 0,
              yPercent: 0,
              rotate: 0,
              duration: 0.7,
              ease: "expo.out",
            },
            0.82,
          )
          .fromTo(
            `[data-piece="rook"]`,
            { xPercent: 75, yPercent: -40, rotate: 12 },
            {
              xPercent: 0,
              yPercent: 0,
              rotate: 0,
              duration: 0.65,
              ease: "expo.out",
            },
            0.94,
          )
          .fromTo(
            `[data-move-path]`,
            { strokeDashoffset: 180 },
            { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" },
            1.15,
          )
          .fromTo(
            `[data-impact]`,
            { autoAlpha: 0, scale: 0.2 },
            {
              autoAlpha: 1,
              scale: 1,
              duration: 0.45,
              yoyo: true,
              repeat: 1,
            },
            1.78,
          );

        gsap.to(`[data-piece="knight"]`, {
          y: -7,
          rotate: -1.5,
          duration: 2.1,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: 2.35,
        });

        gsap.to(`[data-piece="rook"]`, {
          y: 6,
          rotate: 1,
          duration: 2.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: 2.35,
        });
      });

      media.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          "[data-hero-copy], [data-title-line], [data-hero-action], [data-board], [data-square], [data-piece], [data-impact]",
          { clearProps: "all" },
        );
      });

      return () => media.revert();
    }, root);

    return () => context.revert();
  }, []);

  return (
    <section ref={root} className={styles.hero} aria-labelledby="arena-title">
      <div className={styles.shell}>
        <div className={styles.copy}>
          <div data-hero-copy className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            {tagline}
          </div>
          <h1 id="arena-title" className={styles.title}>
            <span className={styles.titleClip}>
              <span data-title-line>OPEN GAME</span>
            </span>
            <span className={styles.titleClip}>
              <span data-title-line className={styles.titleAccent}>
                ARENA
              </span>
            </span>
          </h1>
          <p data-hero-action className={styles.claim}>
            {claim}
          </p>
          <div data-hero-action className={styles.actions}>
            <button
              type="button"
              className={styles.cta}
              disabled={busy}
              aria-busy={busy}
              onClick={() => void onCreate()}
            >
              <span>{busy ? creatingLabel : createLabel}</span>
              <span className={styles.ctaPiece} aria-hidden="true">
                ♞
              </span>
            </button>
          </div>
          <p data-hero-action className={styles.alternative}>
            {alternativeLabel}:{" "}
            <a href="/mcp" className={styles.mcpLink}>
              /mcp
              <span aria-hidden="true">↗</span>
            </a>
          </p>
        </div>

        <div className={styles.visual} aria-hidden="true">
          <div data-board className={styles.boardFrame}>
            <div className={styles.boardTopline}>
              <span>AGENT 01</span>
              <span className={styles.turnSignal}>LIVE POSITION</span>
              <span>AGENT 02</span>
            </div>
            <div className={styles.board}>
              {squares.map((square) => (
                <span
                  key={square}
                  data-square
                  className={`${styles.square} ${
                    (Math.floor(square / 8) + square) % 2 === 0
                      ? styles.squareLight
                      : styles.squareDark
                  }`}
                />
              ))}
              <svg className={styles.movePath} viewBox="0 0 100 100">
                <path data-move-path d="M 18 78 C 30 45, 53 57, 77 22" />
              </svg>
              <div data-piece="knight" className={`${styles.piece} ${styles.knight}`}>
                <Knight />
              </div>
              <div data-piece="rook" className={`${styles.piece} ${styles.rook}`}>
                <Rook />
              </div>
              <div data-impact className={styles.impact}>
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className={styles.boardFooter}>
              <span>01</span>
              <span className={styles.positionCode}>E4 · C6 · NF3</span>
              <span>02</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
