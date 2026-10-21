import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("mounts a component and exposes jsdom + RTL", () => {
    render(<p>Xin chào</p>);
    expect(screen.getByText("Xin chào")).toBeInTheDocument();
  });

  it("provides a controllable matchMedia", () => {
    expect(window.matchMedia("(min-width: 768px)").matches).toBe(false);
  });
});
