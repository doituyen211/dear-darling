import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DaisyField from "@/components/patterns/daisy";
import { events, type EventTheme } from "@/data/events";

describe("DaisyField", () => {
  it("sinh đủ số bông hoa theo lưới", () => {
    render(<DaisyField columns={6} rows={6} />);

    expect(document.querySelectorAll(".daisy")).toHaveLength(36);
  });

  it("mỗi bông có đúng 5 cánh", () => {
    const { container } = render(<DaisyField columns={1} rows={1} />);

    expect(container.querySelectorAll("ellipse")).toHaveLength(5);
    expect(container.querySelector("circle")).not.toBeNull();
  });

  it("dựng ra y hệt nhau mỗi lần render (không lệch hydrate)", () => {
    const first = render(<DaisyField />);
    const second = render(<DaisyField />);

    expect(first.container.innerHTML).toBe(second.container.innerHTML);
  });

  it("không đưa nội dung nào ra ngoài", () => {
    render(<DaisyField />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("hệ theme theo sự kiện", () => {
  it("chỉ là opt-in: sự kiện đầu tiên không khai báo theme", () => {
    const first = events.find((event) => event.id === "thu-dau");

    expect(first).toBeDefined();
    expect(first!.theme).toBeUndefined();
  });

  it("theme chỉ chứa màu và họa tiết, không chứa nội dung", () => {
    const theme: EventTheme = {
      base: "#f7f4ed",
      surface: "#fcfbf8",
      ink: "#1c1c1c",
      muted: "#5f5f5d",
      accent: "#d6556e",
      accent2: "#e8a2b0",
      pattern: "petal",
    };

    expect(Object.keys(theme).sort()).toEqual(
      [
        "accent",
        "accent2",
        "base",
        "ink",
        "muted",
        "pattern",
        "surface",
      ].sort(),
    );
  });
});
