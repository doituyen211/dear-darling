"use client";

import {
  ClipboardEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PIN_HASH } from "@/data/security";

const CODE_LENGTH = 6;
// Ghi nhớ trạng thái "đã mở khóa" trong phiên trình duyệt hiện tại, để
// người xem không phải nhập lại mã mỗi khi họ chuyển trang/refresh
// trong cùng một lượt truy cập. Đóng tab lại thì sẽ khóa lại từ đầu.
// Muốn tắt hẳn tính năng "nhớ", xem ghi chú ở SESSION_KEY bên dưới.
const SESSION_KEY = "letter-unlocked";

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  // null = đang kiểm tra sessionStorage; tránh nháy màn hình khóa lên
  // rồi tắt ngay khi trang vừa tải nếu đã mở khóa từ trước.
  const [checked, setChecked] = useState(false);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Nếu muốn KHÔNG nhớ trạng thái mở khóa (luôn hỏi lại mã mỗi lần
    // vào trang), xoá khối if bên dưới và chỉ giữ setChecked(true).
    // if (sessionStorage.getItem(SESSION_KEY) === "true") {
    //   setUnlocked(true);
    // }
    setChecked(true);
  }, []);

  useEffect(() => {
    if (!unlocked && checked) {
      inputRefs.current[0]?.focus();
    }
  }, [unlocked, checked]);

  const focusIndex = (i: number) => {
    inputRefs.current[i]?.focus();
    inputRefs.current[i]?.select();
  };

  const handleChange = (i: number, value: string) => {
    const clean = value.replace(/[^0-9]/g, "");
    if (!clean) {
      const next = [...digits];
      next[i] = "";
      setDigits(next);
      return;
    }
    // Nếu người dùng gõ nhanh và ô nhận nhiều hơn 1 ký tự, chỉ giữ ký
    // tự cuối cùng.
    const char = clean.slice(-1);
    const next = [...digits];
    next[i] = char;
    setDigits(next);
    setError(false);

    if (i < CODE_LENGTH - 1) {
      focusIndex(i + 1);
    } else {
      // Đã điền đủ 6 ô — tự động kiểm tra.
      void verify(next);
    }
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      focusIndex(i - 1);
    } else if (e.key === "ArrowLeft" && i > 0) {
      focusIndex(i - 1);
    } else if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) {
      focusIndex(i + 1);
    } else if (e.key === "Enter") {
      void verify(digits);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    setError(false);
    if (pasted.length === CODE_LENGTH) {
      void verify(next);
    } else {
      focusIndex(pasted.length);
    }
  };

  const verify = async (code: string[]) => {
    if (code.some((d) => d === "")) return;
    setVerifying(true);
    const hash = await sha256Hex(code.join(""));
    setVerifying(false);

    if (hash === PIN_HASH) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setUnlocked(true);
    } else {
      setError(true);
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  // Chưa kiểm tra xong sessionStorage: không render gì để tránh nháy
  // màn hình khóa.
  if (!checked) return null;

  if (unlocked) return <>{children}</>;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-900 via-ink-950 to-black" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-candle-gold/10 blur-[120px] animate-glow-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8 px-6 text-center"
      >
        <h1 className="font-serif text-2xl font-light italic text-candle-light sm:text-3xl">
          Nhập mã để tiếp tục.
        </h1>

        <motion.div
          animate={error ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex gap-2 sm:gap-3"
          role="group"
          aria-label="Nhập mã PIN 6 chữ số"
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              disabled={verifying}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              aria-label={`Chữ số ${i + 1} trong 6`}
              className={`h-12 w-10 rounded-lg border bg-white/5 text-center font-sans text-xl text-candle-light outline-none transition-colors sm:h-14 sm:w-12 ${
                error
                  ? "border-red-400/60"
                  : "border-candle-muted/30 focus:border-candle-gold/70"
              }`}
            />
          ))}
        </motion.div>

        <AnimatePresence>
          {error ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-sans text-sm text-red-300/80"
            >
              Mã chưa đúng, thử lại nhé.
            </motion.p>
          ) : (
            <p className="font-sans text-sm text-candle-muted">
              Mã gồm 6 chữ số.
            </p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
