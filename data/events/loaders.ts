import type { EventBody } from "./index";

/**
 * Bảng nạp nội dung sự kiện.
 *
 * Dùng `import()` với đường dẫn tĩnh để bundler tách mỗi sự kiện thành
 * một chunk riêng. Chunk đó CHỈ được tải về sau khi người xem đã mở khoá,
 * nên nội dung thư không nằm trong bundle của trang chủ.
 *
 * Thêm sự kiện mới: thêm một dòng ở đây.
 */
const loaders: Record<string, () => Promise<{ body: EventBody }>> = {
  "thu-dau": () => import("./thu-dau"),
  "mua-20-10": () => import("./mua-20-10"),
};

/** Nội dung của sự kiện, hoặc null nếu sự kiện chưa có nội dung. */
export async function loadEventBody(
  id: string,
): Promise<EventBody | null> {
  const loader = loaders[id];
  if (!loader) return null;
  const module = await loader();
  return module.body;
}

/** Sự kiện này đã có nội dung để đọc chưa. */
export function hasEventBody(id: string): boolean {
  return Boolean(loaders[id]);
}
