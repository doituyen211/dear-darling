import type { EventMeta } from "@/data/events";

/**
 * Props của một cover — bố cục toàn màn hình đại diện cho một sự kiện
 * ở trang chủ.
 *
 * Mỗi sự kiện có một cover riêng (`components/event-covers/<id>.tsx`),
 * nên hai sự kiện không bao giờ trông giống nhau. Cover chỉ nhận
 * metadata công khai; nó không biết gì về nội dung thư.
 */
export interface EventCoverProps {
  event: EventMeta;
  /** Chỉ sự kiện đang hiện mới bấm/link được. */
  isActive: boolean;
}
