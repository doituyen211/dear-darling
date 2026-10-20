import { messages } from "@/data/messages";
import type { EventBody } from "./index";

/**
 * Sự kiện đầu tiên — thư gửi em, kèm recording.
 *
 * Nội dung thư vẫn nằm trong `data/messages.ts` (không di chuyển, không
 * sửa một chữ nào) để lịch sử của thư được giữ nguyên. File này chỉ
 * là lớp bọc cho cùng một kiểu dữ liệu với các sự kiện mới.
 */
export const body: EventBody = {
  lines: messages,
  audio: { src: "/audio/message.m4a", type: "audio/mp4" },
};
