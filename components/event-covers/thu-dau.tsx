"use client";

import Link from "next/link";
import type { EventCoverProps } from "./types";

/**
 * Cover của `thu-dau` — trang tựa của bức thư.
 *
 * Cùng một thế giới tối và vệt sáng ấm với trang đọc thư, nên người xem
 * không cảm thấy đổi chủ đề khi bước từ trang chủ sang trang thư.
 */
export default function ThuDauCover({ event, isActive }: EventCoverProps) {
  return (
    <Link
      href={`/e/${event.id}`}
      tabIndex={isActive ? 0 : -1}
      className="group relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      {/* Quiet background: a warm gradient wash plus a single soft
        glow behind the text, like a lamp on a desk. Nothing here
        competes with the words. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-900 via-ink-950 to-black" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-candle-gold/10 blur-[120px] animate-glow-pulse" />

      <div className="relative z-10 flex max-w-2xl flex-col items-center gap-7">
        <span
          aria-hidden="true"
          className="h-px w-20 bg-candle-muted/40"
        />

        <h2 className="font-serif text-5xl font-light italic leading-tight text-candle-light sm:text-6xl md:text-7xl">
          {event.occasion}
        </h2>

        <p className="max-w-md font-sans text-sm leading-relaxed text-candle-muted">
          {event.preview}
        </p>

        <span className="font-sans text-sm text-candle-gold underline-offset-4 group-hover:underline">
          Mở sự kiện
        </span>
      </div>
    </Link>
  );
}
