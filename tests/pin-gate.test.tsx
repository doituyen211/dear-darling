import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import PinGate from "@/components/PinGate";
import { EVENT_PIN_HASHES, PIN_HASH, sessionScopeFor } from "@/data/security";

// Mã PIN thật của sự kiện đầu tiên. Sự kiện 20/10 dùng chung mã này.
const LEGACY_PIN = "230105";

const typePin = async (pin: string) => {
  const user = userEvent.setup();
  // input[type=password] không có implicit role, nên phải tìm theo label.
  const inputs = screen.getAllByLabelText(/Chữ số \d+ trong 6/);
  await user.click(inputs[0]);
  await user.type(inputs[0], pin);
};

describe("PinGate — hành vi cũ (không truyền prop)", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("hiện màn hình khoá trước khi mở khoá", () => {
    render(
      <PinGate>
        <p>nội dung bí mật</p>
      </PinGate>,
    );

    expect(
      screen.getByText("Nhập mã để tiếp tục."),
    ).toBeInTheDocument();
    expect(screen.queryByText("nội dung bí mật")).not.toBeInTheDocument();
  });

  it("mở khoá khi nhập đúng mã", async () => {
    render(
      <PinGate>
        <p>nội dung bí mật</p>
      </PinGate>,
    );

    await typePin(LEGACY_PIN);

    await waitFor(() => {
      expect(screen.getByText("nội dung bí mật")).toBeInTheDocument();
    });
  });

  it("giữ nguyên copy lỗi khi nhập sai mã", async () => {
    render(
      <PinGate>
        <p>nội dung bí mật</p>
      </PinGate>,
    );

    await typePin("999999");

    await waitFor(() => {
      expect(
        screen.getByText("Mã chưa đúng, thử lại nhé."),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("nội dung bí mật")).not.toBeInTheDocument();
  });

  it("ghi sessionStorage bằng khoá cũ", async () => {
    render(
      <PinGate>
        <p>nội dung bí mật</p>
      </PinGate>,
    );

    await typePin(LEGACY_PIN);

    await waitFor(() => {
      expect(sessionStorage.getItem("letter-unlocked")).toBe("true");
    });
  });

  it("vẫn khoá lại sau khi tải lại trang", async () => {
    const { unmount } = render(
      <PinGate>
        <p>nội dung bí mật</p>
      </PinGate>,
    );

    await typePin(LEGACY_PIN);
    await waitFor(() => {
      expect(sessionStorage.getItem("letter-unlocked")).toBe("true");
    });

    unmount();
    render(
      <PinGate>
        <p>nội dung bí mật</p>
      </PinGate>,
    );

    expect(screen.queryByText("nội dung bí mật")).not.toBeInTheDocument();
    expect(
      screen.getByText("Nhập mã để tiếp tục."),
    ).toBeInTheDocument();
  });
});

describe("PinGate — sự kiện dùng chung mã", () => {
  const EVENT_ID = "mua-20-10";
  const pinHash = EVENT_PIN_HASHES[EVENT_ID];

  beforeEach(() => {
    sessionStorage.clear();
  });

  it("sự kiện 20/10 mở khoá bằng chung mã với thư cũ", async () => {
    render(
      <PinGate
        pinHash={pinHash}
        sessionScope={sessionScopeFor(EVENT_ID, pinHash)}
      >
        <p>nội dung 20/10</p>
      </PinGate>,
    );

    await typePin(LEGACY_PIN);

    await waitFor(() => {
      expect(screen.getByText("nội dung 20/10")).toBeInTheDocument();
    });
  });

  it("mã sai vẫn bị từ chối", async () => {
    render(
      <PinGate
        pinHash={pinHash}
        sessionScope={sessionScopeFor(EVENT_ID, pinHash)}
      >
        <p>nội dung 20/10</p>
      </PinGate>,
    );

    await typePin("999999");

    await waitFor(() => {
      expect(
        screen.getByText("Mã chưa đúng, thử lại nhé."),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText("nội dung 20/10")).not.toBeInTheDocument();
  });

  it("dùng chung khoá session với thư cũ", async () => {
    render(
      <PinGate
        pinHash={pinHash}
        sessionScope={sessionScopeFor(EVENT_ID, pinHash)}
      >
        <p>nội dung 20/10</p>
      </PinGate>,
    );

    await typePin(LEGACY_PIN);

    await waitFor(() => {
      expect(sessionStorage.getItem("letter-unlocked")).toBe("true");
    });
  });
});

describe("PinGate — dữ liệu mã", () => {
  it("giữ nguyên hash của sự kiện đầu tiên", () => {
    expect(PIN_HASH).toBe(
      "f65f33d1e35fba10db8dcada091ba6b1cdba86ea908c30d8b310f74158a15741",
    );
    expect(EVENT_PIN_HASHES["thu-dau"]).toBe(PIN_HASH);
  });

  it("sự kiện 20/10 dùng chung mã với thư cũ", () => {
    expect(EVENT_PIN_HASHES["mua-20-10"]).toBe(PIN_HASH);
  });

  it("không lưu mã PIN dạng rõ trong source", () => {
    expect(PIN_HASH).not.toContain(LEGACY_PIN);
    expect(EVENT_PIN_HASHES["mua-20-10"]).not.toContain(LEGACY_PIN);
  });
});
