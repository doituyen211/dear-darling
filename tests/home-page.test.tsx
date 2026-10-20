import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";
import { publishedEvents } from "@/data/events";

describe("trang chủ", () => {
  it("hiện carousel các sự kiện đã công khai", () => {
    render(<Home />);

    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(
      screen.getAllByRole("group", { hidden: true }),
    ).toHaveLength(publishedEvents.length);
  });

  it("không chứa bất kỳ nội dung thư nào trước khi xác thực", () => {
    const { container } = render(<Home />);

    expect(container.textContent).not.toContain("Trần Phương Diệu");
    expect(container.textContent).not.toContain("Hôm nay là ngày của");
  });

  it("không kích hoạt được PIN gate ở trang chủ", () => {
    render(<Home />);

    expect(
      screen.queryByText("Nhập mã để tiếp tục."),
    ).not.toBeInTheDocument();
  });
});
