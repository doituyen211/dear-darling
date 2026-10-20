"use client";

import Link from "next/link";
import type { EventMeta } from "@/data/events";

interface EventCardProps {
  event: EventMeta;
  /** Chỉ sự kiện đang hiện mới bấm/link được. */
  isActive: boolean;
}

export default function EventCard({ event, isActive }: EventCardProps) {
  const dateLabel = event.dateLabel ?? event.date;

  return (
    <Link
      href={`/e/${event.id}`}
      tabIndex={isActive ? 0 : -1}
      className="group flex h-full w-full flex-col items-center justify-center gap-[clamp(0.75rem,2.5vh,1.25rem)] rounded-[1.75rem] border border-candle-muted/15 bg-white/[0.025] px-6 py-[clamp(1.5rem,5vh,2.5rem)] text-center transition-colors duration-500 hover:border-candle-gold/45 focus-visible:border-candle-gold/70 sm:px-10"
    >
      {dateLabel ? (
        <span className="font-sans text-sm text-candle-muted">{dateLabel}</span>
      ) : null}

      <h2 className="w-full font-serif text-3xl font-light italic leading-tight text-candle-light sm:text-4xl">
        {event.occasion}
      </h2>

      <p className="w-full max-w-sm font-sans text-sm leading-relaxed text-candle-muted/90">
        {event.preview}
      </p>

      {event.requiresPin ? (
        <span className="inline-flex items-center gap-2 font-sans text-xs text-candle-muted">
          <LockIcon />
          Có mã bảo vệ
        </span>
      ) : null}

      <span
        className="mt-1 inline-flex items-center gap-2 font-sans text-sm"
        style={{ color: "var(--event-accent, #c9a876)" }}
      >
        Mở sự kiện
        <span aria-hidden="true" className="transition-transform duration-500 group-hover:translate-x-1">
          →
        </span>
      </span>
    </Link>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}
