import type { EventBody, GreetingBody } from "./index";

/**
 * Bảng nạp nội dung sự kiện.
 *
 * Dùng `import()` với đường dẫn tĩnh để bundler tách mỗi sự kiện thành
 * một chunk riêng. Chunk đó CHỈ được tải về sau khi người xem đã mở khoá,
 * nên nội dung của sự kiện không nằm trong bundle của trang chủ.
 *
 * Mỗi sự kiện thuộc một trong hai dạng:
 *   - `letter`   — `body` (các dòng thư + ghi âm)
 *   - `greeting` — `greeting` (một dòng chúc)
 *
 * Thêm sự kiện mới: thêm một dòng vào bảng tương ứng.
 */
const letterLoaders: Record<string, () => Promise<{ body: EventBody }>> = {
  "thu-dau": () => import("./thu-dau"),
};

const greetingLoaders: Record<
  string,
  () => Promise<{ greeting: GreetingBody }>
> = {
  "mua-20-10": () => import("./mua-20-10"),
};

/** Nội dung thư của sự kiện, hoặc null nếu sự kiện không dạng thư. */
export async function loadEventBody(id: string): Promise<EventBody | null> {
  const loader = letterLoaders[id];
  if (!loader) return null;
  const module = await loader();
  return module.body;
}

/** Lời chúc của sự kiện, hoặc null nếu sự kiện không dạng chúc. */
export async function loadGreeting(
  id: string,
): Promise<GreetingBody | null> {
  const loader = greetingLoaders[id];
  if (!loader) return null;
  const module = await loader();
  return module.greeting;
}

/** Sự kiện này đã có nội dung để hiện chưa (thư hoặc lời chúc). */
export function hasEventContent(id: string): boolean {
  return id in letterLoaders || id in greetingLoaders;
}
