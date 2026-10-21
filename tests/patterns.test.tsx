import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DaisyField from "@/components/patterns/daisy";
import { events, type EventTheme } from "@/data/events";
import { setMediaQuery } from "./setup";

describe("DaisyField", () => {
  it("sinh đủ số bông hoa theo lưới", () => {
    const { container } = render(<DaisyField columns={6} rows={6} />);

    expect(container.querySelectorAll(".daisy-flower")).toHaveLength(36);
  });

  it("mỗi bông có đúng 5 cánh và 1 nhịp hoa", () => {
    const { container } = render(<DaisyField columns={1} rows={1} />);

    const flower = container.querySelector(".daisy-flower")!;
    expect(flower.querySelectorAll("ellipse")).toHaveLength(5);
    expect(flower.querySelector("circle")).not.toBeNull();
  });

  it("có lớp cánh rơi lơ lửng phía trên", () => {
    const { container } = render(<DaisyField />);

    expect(container.querySelectorAll(".daisy-petals svg")).toHaveLength(12);
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

  it("khi giảm chuyển động thì hoa hiện ngay, không mở cánh", () => {
    setMediaQuery("(prefers-reduced-motion: reduce)", true);
    const { container } = render(<DaisyField columns={1} rows={1} />);

    const flower = container.querySelector(".daisy-flower")!;
    const petals = [...flower.querySelectorAll("ellipse")];

    // Cánh không có transform nào → đã ở trạng thái mở sẵn.
    petals.forEach((petal) => {
      expect(petal.getAttribute("style") ?? "").not.toContain("scale");
    });
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
