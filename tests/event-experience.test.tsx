import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import EventExperience from "@/components/EventExperience";
import { getEventById } from "@/data/events";
import { EVENT_PIN_HASHES, sessionScopeFor } from "@/data/security";

const LEGACY_PIN = "230105";
const EVENT_20_10_PIN = "201020";

const typePin = async (pin: string) => {
  const user = userEvent.setup();
  const inputs = screen.getAllByLabelText(/Chữ số \d+ trong 6/);
  await user.click(inputs[0]);
  await user.type(inputs[0], pin);
};

const renderEvent = (eventId: string) => {
  const event = getEventById(eventId)!;
  const pinHash = EVENT_PIN_HASHES[eventId];

  return render(
    <EventExperience
      event={event}
      pinHash={pinHash}
      sessionScope={sessionScopeFor(eventId, pinHash)}
    />,
  );
};

describe("EventExperience", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("chưa mở khoá thì không hiện nội dung thư", async () => {
    renderEvent("thu-dau");

    await waitFor(() => {
      expect(
        screen.getByText("Nhập mã để tiếp tục."),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByLabelText("Gửi em Trần Phương Diệu,"),
    ).not.toBeInTheDocument();
  });

  it("mở khoá đúng mã thì hiện dòng thư đầu tiên", async () => {
    renderEvent("thu-dau");

    await typePin(LEGACY_PIN);

    // GSAP tách dòng thư thành từng ký tự, nhưng giữ `aria-label` trên
    // thẻ cha — nên tìm theo label là cách ổn định nhất.
    await waitFor(
      () => {
        expect(
          screen.getByLabelText("Gửi em Trần Phương Diệu,"),
        ).toBeInTheDocument();
      },
      { timeout: 4000 },
    );
  });

  it("mở khoá bằng mã riêng cho sự kiện 20/10", async () => {
    renderEvent("mua-20-10");

    await typePin(EVENT_20_10_PIN);

    await waitFor(
      () => {
        expect(
          screen.getByLabelText("Hôm nay là ngày của những người con gái."),
        ).toBeInTheDocument();
      },
      { timeout: 4000 },
    );
  });

  it("báo sự kiện đang chuẩn bị khi chưa có nội dung", async () => {
    const event = {
      id: "chua-co",
      occasion: "Sắp tới",
      title: "Sắp tới",
      preview: "Sắp tới",
      status: "coming-soon" as const,
      requiresPin: false,
      order: 99,
      published: false,
    };

    render(<EventExperience event={event} />);

    await typePin(LEGACY_PIN);

    await waitFor(() => {
      expect(
        screen.getByText("Sự kiện này đang được chuẩn bị."),
      ).toBeInTheDocument();
    });
  });
});
