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
  replayLabel: string;
  busy: boolean;
  onCreate: () => void | Promise<void>;
};

type CreateMatchCtaProps = {
  label: string;
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

export function CreateMatchCta({ label, busy, onCreate }: CreateMatchCtaProps) {
  return (
    <button
      type="button"
      className={styles.cta}
      disabled={busy}
      aria-busy={busy}
      onClick={() => void onCreate()}
    >
      <span>{label}</span>
      <span className={styles.ctaPiece} aria-hidden="true">
        ♞
      </span>
    </button>
  );
}

export function Hero({
  tagline,
  claim,
  createLabel,
  creatingLabel,
  alternativeLabel,
  replayLabel,
  busy,
  onCreate,
}: HeroProps) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!root.current) return;

    const context = gsap.context(() => {
      const media = gsap.matchMedia();

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const board = root.current?.querySelector<HTMLElement>("[data-board]");
        const knight = root.current?.querySelector<HTMLElement>('[data-piece="knight"]');
        const rook = root.current?.querySelector<HTMLElement>('[data-piece="rook"]');
        const movePath = root.current?.querySelector<SVGPathElement>("[data-move-path]");
        const impact = root.current?.querySelector<HTMLElement>("[data-impact]");
        if (!board || !knight || !rook || !movePath || !impact) return;

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

        const rotateX = gsap.quickTo(board, "rotationX", {
          duration: 0.35,
          ease: "power3.out",
        });
        const rotateY = gsap.quickTo(board, "rotationY", {
          duration: 0.35,
          ease: "power3.out",
        });
        const pieceX = gsap.quickTo("[data-piece]", "x", {
          duration: 0.35,
          ease: "power3.out",
        });
        const pieceY = gsap.quickTo("[data-piece]", "y", {
          duration: 0.35,
          ease: "power3.out",
        });

        const resetTilt = () => {
          rotateX(0);
          rotateY(0);
          pieceX(0);
          pieceY(0);
          board.style.setProperty("--pointer-x", "50%");
          board.style.setProperty("--pointer-y", "50%");
        };
        const tiltBoard = (event: PointerEvent) => {
          const bounds = board.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width;
          const y = (event.clientY - bounds.top) / bounds.height;
          rotateX((0.5 - y) * 7);
          rotateY((x - 0.5) * 7);
          pieceX((x - 0.5) * 8);
          pieceY((y - 0.5) * 8);
          board.style.setProperty("--pointer-x", `${x * 100}%`);
          board.style.setProperty("--pointer-y", `${y * 100}%`);
        };

        let replay: gsap.core.Timeline | undefined;
        const replayMove = () => {
          replay?.kill();
          replay = gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .set(movePath, { strokeDashoffset: 180 })
            .set(impact, { autoAlpha: 0, scale: 0.3 })
            .to(knight, { x: 18, y: -22, rotate: 4, duration: 0.38 })
            .to(movePath, { strokeDashoffset: 0, duration: 0.48, ease: "power2.inOut" }, 0)
            .to(rook, { x: -8, y: 7, rotate: -2, duration: 0.28 }, 0.26)
            .to(impact, { autoAlpha: 1, scale: 1, duration: 0.22 }, 0.32)
            .to(impact, { autoAlpha: 0, scale: 1.3, duration: 0.2 })
            .to([knight, rook], { x: 0, y: 0, rotate: 0, duration: 0.34 }, "<");
        };

        board.addEventListener("pointermove", tiltBoard);
        board.addEventListener("pointerleave", resetTilt);
        board.addEventListener("click", replayMove);

        return () => {
          replay?.kill();
          board.removeEventListener("pointermove", tiltBoard);
          board.removeEventListener("pointerleave", resetTilt);
          board.removeEventListener("click", replayMove);
        };
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
            <CreateMatchCta
              label={busy ? creatingLabel : createLabel}
              busy={busy}
              onCreate={onCreate}
            />
          </div>
          <p data-hero-action className={styles.alternative}>
            {alternativeLabel}:{" "}
            <a href="/mcp" className={styles.mcpLink}>
              /mcp
              <span aria-hidden="true">↗</span>
            </a>
          </p>
        </div>

        <div className={styles.visual}>
          <button type="button" data-board className={styles.boardFrame} aria-label={replayLabel}>
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
          </button>
        </div>
      </div>
    </section>
  );
}
