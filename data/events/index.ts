/**
 * Danh sách sự kiện — CHỈ chứa metadata công khai.
 *
 * File này được import bởi trang chủ (carousel), nơi người xem có thể
 * xem trước khi nhập mã. Vì vậy nó tuyệt đối KHÔNG được chứa nội dung
 * thư, cũng KHÔNG được import bất kỳ module nội dung nào — nếu không,
 * toàn bộ chữ trong thư sẽ nằm trong bundle của trang chủ.
 *
 * Nội dung thật của từng sự kiện nằm ở `data/events/<id>.ts` và chỉ được
 * tải về (qua dynamic import) sau khi người xem đã mở khoá.
 *
 * Thêm một sự kiện mới:
 *   1. Tạo `data/events/<id>.ts` export `body: EventBody`.
 *   2. Thêm một entry vào `events` bên dưới.
 *   3. Đăng ký loader trong `data/events/loaders.ts`.
 */

export type EventStatus = "ready" | "coming-soon" | "draft";

/**
 * Một thế giới màu cho một sự kiện.
 *
 * **Opt-in.** Sự kiện không khai báo `theme` thì giữ nguyên màu cũ và
 * không được đặt vào wrapper theme — đó là trường hợp của `thu-dau`, sự
 * kiện đầu tiên, để đường đọc thư của nó không đổi một dòng nào.
 *
 * Giá trị ở đây là màu thật, không phải class — wrapper ghi chúng vào các
 * biến `--event-*` và các class `*-event-*` đọc từ đó.
 */
export interface EventTheme {
  /** Nền trang. */
  base: string;
  /** Bề mặt phụ (panel, mảnh giấy). */
  surface: string;
  /** Chữ chính. */
  ink: string;
  /** Chữ phụ. */
  muted: string;
  /** Màu nhấn chính. */
  accent: string;
  /** Màu nhấn phụ — cánh hoa, chi tiết thứ cấp. */
  accent2: string;
  /** Họa tiết nền. `none` = không dùng. */
  pattern: "petal" | "contour" | "dots" | "none";
}

export interface EventMeta {
  /** Slug ổn định, dùng làm URL: /e/<id>. Đổi id = đổi URL cũ. */
  id: string;
  /** Tên dịp, hiển thị lớn trên card. */
  occasion: string;
  /** Tiêu đề đầy đủ, dùng cho <title> và metadata. */
  title: string;
  /** Ngày ISO (YYYY-MM-DD). Bỏ trống nếu sự kiện không có ngày. */
  date?: string;
  /** Nhãn ngày hiển thị, ghi đè format mặc định. */
  dateLabel?: string;
  /**
   * Một dòng ngắn mô tả sự kiện, an toàn để hiện TRƯỚC khi xác thực.
   * TUYỆT ĐỐI không được chứa nội dung thư — xem `tests/events-registry.test.ts`.
   */
  preview: string;
  /** Đường dẫn ảnh trong /public. */
  cover?: string;
  /** Màu nhấn riêng của sự kiện, dùng qua biến CSS --event-accent. */
  accent?: string;
  /**
   * Thế giới màu riêng của sự kiện. Bỏ trống thì giữ nguyên màu cũ
   * (dành cho sự kiện đầu tiên).
   */
  theme?: EventTheme;
  /** ready: có nội dung để đọc. coming-soon: còn đang chuẩn bị. */
  status: EventStatus;
  /** Sự kiện này có cần mã để mở không. */
  requiresPin: boolean;
  /** Số nhỏ hiển thị trước. */
  order: number;
  /** Có hiện trên trang chủ không. */
  published: boolean;
}

/** Nội dung thật của một sự kiện — chỉ được tải sau khi mở khoá. */
export interface EventBody {
  /** Các dòng của thư, hiện lần lượt. */
  lines: string[];
  /** File ghi âm đi kèm. Bỏ trống nếu sự kiện chưa có recording. */
  audio?: { src: string; type: string };
}

export const events: EventMeta[] = [
  {
    id: "mua-20-10",
    occasion: "Mùa 20/10",
    title: "Ngày của những người con gái",
    date: "2026-10-20",
    dateLabel: "20/10",
    preview: "Một ngày để ghi nhớ, và một món quà nhỏ chỉ dành riêng cho em.",
    accent: "#d08c8c",
    status: "ready",
    requiresPin: true,
    order: 0,
    published: true,
  },
  {
    id: "thu-dau",
    occasion: "Thư gửi em",
    title: "Thư gửi em",
    preview: "Một thư dài, và một giọng nói chỉ dành cho em.",
    status: "ready",
    requiresPin: true,
    order: 1,
    published: true,
  },
];

/** Sự kiện đang công khai, đã sắp xếp theo thứ tự hiển thị. */
export const publishedEvents: EventMeta[] = events
  .filter((event) => event.published)
  .sort((a, b) => a.order - b.order);

export function getEventById(id: string): EventMeta | undefined {
  return events.find((event) => event.id === id);
}
