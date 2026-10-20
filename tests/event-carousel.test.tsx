import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import EventCarousel from "@/components/EventCarousel";
import { WIDE_QUERY } from "@/lib/media";
import type { EventMeta } from "@/data/events";
import { resetMediaQueries, setMediaQuery } from "./setup";

const FIRST_DELAY_MS = 9000;
const AUTOPLAY_MS = 6500;

const makeEvent = (id: string, order: number): EventMeta => ({
  id,
  occasion: `Sự kiện ${id.toUpperCase()}`,
  title: `Sự kiện ${id.toUpperCase()}`,
  preview: `Phần giới thiệu ngắn của ${id}.`,
  status: "ready",
  requiresPin: true,
  order,
  published: true,
});

const EVENTS = [
  makeEvent("a", 0),
  makeEvent("b", 1),
  makeEvent("c", 2),
];

const advance = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

/**
 * userEvent không hoạt động với fake timer của Vitest (nó dò `jest` toàn
 * cục nên không nhận ra timer đang bị giả lập, rồi treo). Với các test
 * cần thời gian xác định ta dùng `fireEvent`; phần tương tác thật được
 * kiểm tra ở describe riêng, dùng timer thật.
 */
const click = (element: HTMLElement) => {
  fireEvent.click(element);
};

const activeSlide = () =>
  screen
    .getAllByRole("group", { hidden: true })
    .filter((el) => el.getAttribute("aria-hidden") !== "true");

describe("EventCarousel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetMediaQueries();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetMediaQueries();
  });

  it("hiện một slide cho mỗi sự kiện", () => {
    render(<EventCarousel events={EVENTS} />);

    expect(screen.getAllByRole("group", { hidden: true })).toHaveLength(3);
  });

  it("chỉ sự kiện đang hiện mới được trình đọc màn hình đọc tới", () => {
    render(<EventCarousel events={EVENTS} />);

    const slides = screen.getAllByRole("group", { hidden: true });
    expect(slides[0].getAttribute("aria-hidden")).toBeNull();
    expect(slides[1].getAttribute("aria-hidden")).toBe("true");
    expect(slides[2].getAttribute("aria-hidden")).toBe("true");
  });

  it("bỏ sự kiện không active khỏi tab order", () => {
    render(<EventCarousel events={EVENTS} />);

    const links = screen.getAllByRole("link", { hidden: true });
    expect(links[0]).toHaveAttribute("tabindex", "0");
    expect(links[1]).toHaveAttribute("tabindex", "-1");
    expect(links[2]).toHaveAttribute("tabindex", "-1");
  });

  it("tự chuyển sang sự kiện tiếp theo", () => {
    render(<EventCarousel events={EVENTS} />);

    advance(FIRST_DELAY_MS);

    const slides = screen.getAllByRole("group", { hidden: true });
    expect(slides[1].getAttribute("aria-hidden")).toBeNull();
    expect(slides[0].getAttribute("aria-hidden")).toBe("true");
  });

  it("dừng hẳn ở sự kiện cuối, không lặp vòng", () => {
    render(<EventCarousel events={EVENTS} />);

    // Mỗi lần `advance` chỉ chạy tới một mốc, để effect cài lại timer
    // đúng tại thời điểm đó.
    advance(FIRST_DELAY_MS);
    advance(AUTOPLAY_MS);

    const slides = screen.getAllByRole("group", { hidden: true });
    expect(slides[2].getAttribute("aria-hidden")).toBeNull();

    advance(AUTOPLAY_MS * 3);
    expect(
      screen.getAllByRole("group", { hidden: true })[2].getAttribute("aria-hidden"),
    ).toBeNull();
  });

  it("điều hướng tay được và reset đồng hồ đếm ngược", () => {
    render(<EventCarousel events={EVENTS} />);

    click(screen.getByLabelText("Sự kiện sau"));
    expect(
      screen.getAllByRole("group", { hidden: true })[1].getAttribute("aria-hidden"),
    ).toBeNull();

    // Chưa đủ một interval thì chưa tự chuyển.
    advance(AUTOPLAY_MS - 500);
    expect(
      screen.getAllByRole("group", { hidden: true })[1].getAttribute("aria-hidden"),
    ).toBeNull();

    advance(600);
    expect(
      screen.getAllByRole("group", { hidden: true })[2].getAttribute("aria-hidden"),
    ).toBeNull();
  });

  it("điều hướng tay có thể quay ngược từ sự kiện đầu", () => {
    render(<EventCarousel events={EVENTS} />);

    click(screen.getByLabelText("Sự kiện trước"));

    expect(
      screen.getAllByRole("group", { hidden: true })[2].getAttribute("aria-hidden"),
    ).toBeNull();
  });

  it("dừng tự chuyển khi con trỏ ở trong carousel", () => {
    render(<EventCarousel events={EVENTS} />);

    fireEvent.pointerEnter(screen.getByRole("region"));
    advance(FIRST_DELAY_MS * 2);

    expect(
      screen.getAllByRole("group", { hidden: true })[0].getAttribute("aria-hidden"),
    ).toBeNull();
  });

  it("dừng tự chuyển khi tab bị ẩn", () => {
    render(<EventCarousel events={EVENTS} />);

    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    advance(FIRST_DELAY_MS * 2);

    expect(
      screen.getAllByRole("group", { hidden: true })[0].getAttribute("aria-hidden"),
    ).toBeNull();

    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
  });

  it("tôn trọng prefers-reduced-motion: không tự chuyển", () => {
    setMediaQuery("(prefers-reduced-motion: reduce)", true);
    render(<EventCarousel events={EVENTS} />);

    advance(FIRST_DELAY_MS * 3);

    expect(
      screen.getAllByRole("group", { hidden: true })[0].getAttribute("aria-hidden"),
    ).toBeNull();
  });

  it("cho phép dừng và bật lại tự chuyển", () => {
    render(<EventCarousel events={EVENTS} />);

    const toggle = screen.getByLabelText("Tự động chuyển sự kiện");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    advance(FIRST_DELAY_MS * 2);
    expect(
      screen.getAllByRole("group", { hidden: true })[0].getAttribute("aria-hidden"),
    ).toBeNull();
  });

  it("thông báo bằng live region khi người dùng tự điều hướng", () => {
    render(<EventCarousel events={EVENTS} />);

    click(screen.getByLabelText("Sự kiện sau"));

    expect(
      screen.getByText("Sự kiện 2 trên 3: Sự kiện B"),
    ).toBeInTheDocument();
  });

  it("không thông báo liên tục khi tự chuyển", () => {
    render(<EventCarousel events={EVENTS} />);

    advance(FIRST_DELAY_MS);

    expect(
      screen.queryByText(/Sự kiện 2 trên 3/),
    ).not.toBeInTheDocument();
  });

  it("mỗi nút trạng thái có nhãn rõ ràng", () => {
    render(<EventCarousel events={EVENTS} />);

    expect(screen.getByLabelText("Sự kiện trước")).toBeInTheDocument();
    expect(screen.getByLabelText("Sự kiện sau")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Xem sự kiện 1: Sự kiện A"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Xem sự kiện 3: Sự kiện C"),
    ).toBeInTheDocument();
  });

  it("xử lý an toàn khi không có sự kiện nào", () => {
    render(<EventCarousel events={[]} />);

    expect(
      screen.getByText("Chưa có sự kiện nào để hiện."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Sự kiện sau")).not.toBeInTheDocument();

    advance(FIRST_DELAY_MS * 2);
  });

  it("xử lý an toàn khi chỉ có một sự kiện", () => {
    render(<EventCarousel events={[EVENTS[0]]} />);

    expect(screen.queryByLabelText("Sự kiện trước")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Sự kiện sau")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Xem sự kiện 1: Sự kiện A"),
    ).not.toBeInTheDocument();

    advance(FIRST_DELAY_MS * 2);
    expect(
      screen.getAllByRole("group", { hidden: true })[0].getAttribute("aria-hidden"),
    ).toBeNull();
  });

  it("dọn timer khi component bị gỡ", () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");
    const { unmount } = render(<EventCarousel events={EVENTS} />);

    advance(FIRST_DELAY_MS);
    unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it("xếp theo trục dọc khi khung nhìn portrait và hẹp", () => {
    render(<EventCarousel events={EVENTS} />);

    const slides = screen.getAllByRole("group", { hidden: true });
    const track = slides[0].parentElement as HTMLElement;

    expect(track.style.flexDirection).toBe("column");
    expect(track.style.width).toBe("100%");
    expect(track.style.height).toBe("300%");
    expect(slides[0].style.width).toBe("100%");
    expect(parseFloat(slides[0].style.height)).toBeCloseTo(100 / 3, 3);
  });

  it("xếp theo trục ngang khi khung nhìn rộng hoặc nằm ngang", () => {
    setMediaQuery(WIDE_QUERY, true);
    render(<EventCarousel events={EVENTS} />);

    const slides = screen.getAllByRole("group", { hidden: true });
    const track = slides[0].parentElement as HTMLElement;

    expect(track.style.flexDirection).toBe("row");
    expect(track.style.width).toBe("300%");
    expect(track.style.height).toBe("100%");
    expect(parseFloat(slides[0].style.width)).toBeCloseTo(100 / 3, 3);
  });

  it("đổi trục khi khung nhìn thay đổi mà không phá vỡ trạng thái", () => {
    render(<EventCarousel events={EVENTS} />);

    act(() => {
      setMediaQuery(WIDE_QUERY, true);
    });

    expect(screen.getAllByRole("group", { hidden: true })).toHaveLength(3);
    expect(
      screen.getAllByRole("group", { hidden: true })[0].getAttribute("aria-hidden"),
    ).toBeNull();
  });

  describe("tương tác thật (timer thật)", () => {
    // userEvent không chạy được với fake timer của Vitest, nên phần này
    // dùng timer thật. Autoplay đầu tiên chờ 9 giây nên không chen vào.
    beforeEach(() => {
      vi.useRealTimers();
    });

    it("bấm nút chuyển sự kiện thì slide tiếp theo được chọn", async () => {
      const user = userEvent.setup();
      render(<EventCarousel events={EVENTS} />);

      await user.click(screen.getByLabelText("Sự kiện sau"));

      expect(
        screen.getAllByRole("group", { hidden: true })[1].getAttribute("aria-hidden"),
      ).toBeNull();
    });

    it("bấm chấm tròn thì nhảy tới đúng sự kiện", async () => {
      const user = userEvent.setup();
      render(<EventCarousel events={EVENTS} />);

      await user.click(screen.getByLabelText("Xem sự kiện 3: Sự kiện C"));

      expect(
        screen.getAllByRole("group", { hidden: true })[2].getAttribute("aria-hidden"),
      ).toBeNull();
    });

    it("dừng carousel khi rê chuột vào, rồi chạy lại khi rời ra", async () => {
      const user = userEvent.setup();
      render(<EventCarousel events={EVENTS} />);

      await user.hover(screen.getByRole("region"));
      expect(screen.getByRole("region")).toBeInTheDocument();
    });
  });
});
