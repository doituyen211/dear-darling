import type { Metadata } from "next";
import EventCarousel from "@/components/EventCarousel";
import { publishedEvents } from "@/data/events";

export const metadata: Metadata = {
  title: "Cho em",
  description: "Những dịp anh đã chuẩn bị cho em.",
};

/**
 * Trang chủ là lớp duyệt sự kiện: công khai, chỉ hiện metadata.
 * Nội dung thư của từng sự kiện nằm sau PIN gate ở route /e/<id>.
 */
export default function Home() {
  return <EventCarousel events={publishedEvents} />;
}
