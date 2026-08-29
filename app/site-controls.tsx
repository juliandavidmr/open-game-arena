"use client";

import { useEffect, useRef } from "react";

export function LanguageControl() {
  const languageSelect = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const savedLanguage = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("oga-language="))
      ?.split("=")[1];
    const resolvedLanguage =
      savedLanguage === "es" || savedLanguage === "en"
        ? savedLanguage
        : navigator.language.toLowerCase().startsWith("es")
          ? "es"
          : "en";
    if (languageSelect.current) languageSelect.current.value = resolvedLanguage;
  }, []);

  function changeLanguage(language: string) {
    document.cookie = `oga-language=${language};path=/;max-age=31536000;samesite=lax`;
    location.reload();
  }

  return (
    <select
      ref={languageSelect}
      aria-label="Language"
      className="select select-sm"
      defaultValue="en"
      onChange={(event) => changeLanguage(event.target.value)}
    >
      <option value="en">EN</option>
      <option value="es">ES</option>
    </select>
  );
}

export function ThemeControl() {
  const themeController = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("oga-theme");
    const resolvedTheme =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    if (themeController.current) themeController.current.checked = resolvedTheme === "dark";
    document.documentElement.dataset.theme = resolvedTheme;
  }, []);

  function changeTheme(dark: boolean) {
    const nextTheme = dark ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("oga-theme", nextTheme);
  }

  return (
    <label className="toggle text-base-content" title="Toggle color theme">
      <input
        ref={themeController}
        type="checkbox"
        value="dark"
        className="theme-controller"
        aria-label="Theme"
        onChange={(event) => changeTheme(event.target.checked)}
      />
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeWidth="2"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </g>
      </svg>
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeWidth="2"
          fill="none"
          stroke="currentColor"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </g>
      </svg>
    </label>
  );
}
