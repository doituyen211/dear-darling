import type { ComponentType } from "react";
import Link from "next/link";
import type { EventMeta } from "@/data/events";
import Mua2010Cover from "./mua-20-10";
import ThuDauCover from "./thu-dau";
import type { EventCoverProps } from "./types";

/**
 * Bản đồ cover theo id sự kiện.
 *
 * Thêm một sự kiện mới có cover riêng: thêm một file
 * `components/event-covers/<id>.tsx` và một dòng ở đây. Sự kiện không
 * có cover sẽ rơi về `FallbackCover`, nên trang chủ không bao giờ trống.
 *
 * Bản đồ này nằm phía client vì carousel là client component và cover
 * chứa `<Link>`; nó không chứa nội dung thư.
 */
export const covers: Record<string, ComponentType<EventCoverProps>> = {
  "thu-dau": ThuDauCover,
  "mua-20-10": Mua2010Cover,
};

/** Cover dự phòng cho sự kiện chưa có cover riêng. */
export function FallbackCover({ event, isActive }: EventCoverProps) {
  return (
    <Link
      href={`/e/${event.id}`}
      tabIndex={isActive ? 0 : -1}
      className="group flex h-full w-full flex-col items-center justify-center gap-5 bg-event-base px-6 text-center"
    >
      <h2 className="font-serif text-5xl font-light italic text-event-ink">
        {event.occasion}
      </h2>
      <p className="max-w-md font-sans text-sm text-event-muted">
        {event.preview}
      </p>
      <span className="font-sans text-sm text-event-accent underline-offset-4 group-hover:underline">
        Mở sự kiện
      </span>
    </Link>
  );
}

export function coverFor(event: EventMeta): ComponentType<EventCoverProps> {
  return covers[event.id] ?? FallbackCover;
}
