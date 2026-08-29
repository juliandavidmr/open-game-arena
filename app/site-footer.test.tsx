// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SiteFooter } from "./site-footer";

afterEach(cleanup);

describe("SiteFooter", () => {
  it("uses the daisyUI footer composition and exposes the information routes", () => {
    const { container } = render(<SiteFooter />);
    const footer = container.querySelector("footer");

    expect(footer?.classList.contains("footer")).toBe(true);
    expect(footer?.classList.contains("sm:footer-horizontal")).toBe(true);
    expect(screen.getByRole("combobox", { name: "Language" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "About / Acerca de" }).getAttribute("href")).toBe(
      "/about",
    );
    expect(screen.getByRole("link", { name: "Privacy / Privacidad" }).getAttribute("href")).toBe(
      "/privacy",
    );
  });
});
