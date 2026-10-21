"use client";

import Link from "next/link";
import DaisyField from "@/components/patterns/daisy";
import type { EventCoverProps } from "./types";

/**
 * Cover của `mua-20-10` — một vườn hoa cúc tràn màn hình.
 *
 * Hoàn toàn khác cover của thư: sáng, nhiều màu, hoa mọc dần. Không có
 * khung, không có card — chỉ một bề mặt giấy và hoa.
 */
export default function Mua2010Cover({ event, isActive }: EventCoverProps) {
  const dateLabel = event.dateLabel ?? event.date;

  return (
    <Link
      href={`/e/${event.id}`}
      tabIndex={isActive ? 0 : -1}
      className="group relative flex h-full w-full items-center justify-center overflow-hidden"
    >
      <DaisyField />

      {/* Lớp mờ phía sau chữ: hoa vẫn thấy rõ, nhưng dòng chúc đọc được. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(closest-side,rgba(247,244,237,0.8),rgba(247,244,237,0.42),transparent)]" />

      <div className="relative z-10 flex max-w-2xl flex-col items-center gap-7 px-6 text-center">
        {dateLabel ? (
          <span className="font-sans text-sm text-event-muted">{dateLabel}</span>
        ) : null}

        <h2 className="font-serif text-5xl font-light italic leading-tight text-event-ink sm:text-6xl md:text-7xl">
          {event.occasion}
        </h2>

        <p className="max-w-md font-sans text-sm leading-relaxed text-event-muted">
          {event.preview}
        </p>

        <span className="font-sans text-sm text-event-accent underline-offset-4 group-hover:underline">
          Mở sự kiện
        </span>
      </div>
    </Link>
  );
}
