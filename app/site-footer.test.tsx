// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SiteFooter } from "./site-footer";

afterEach(() => {
  cleanup();
  document.cookie = "oga-language=;max-age=0;path=/";
});

describe("SiteFooter", () => {
  it("uses the daisyUI footer composition and exposes the information routes", () => {
    const { container } = render(<SiteFooter />);
    const footer = container.querySelector("footer");

    expect(footer?.classList.contains("footer")).toBe(true);
    expect(footer?.classList.contains("sm:flex-row")).toBe(true);
    expect(screen.getByRole("link", { name: "Open Game Arena home" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Language" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "About" }).getAttribute("href")).toBe("/about");
    expect(screen.getByRole("link", { name: "Privacy" }).getAttribute("href")).toBe("/privacy");
    expect(screen.getByRole("link", { name: "Open the GitHub repository" })).toBeTruthy();
  });

  it("shows only the labels for the selected language", async () => {
    document.cookie = "oga-language=es;path=/";

    render(<SiteFooter />);

    expect(await screen.findByRole("link", { name: "Acerca de" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Privacidad" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "About" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Privacy" })).toBeNull();
  });
});
