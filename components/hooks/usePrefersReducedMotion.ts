"use client";

import { useState } from "react";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

/**
 * `useReducedMotion` của framer-motion trả về `null` ở server nhưng lại
 * trả về giá trị thật ở client (đọc từ hệ điều hành) — nên render ở
 * server và ở client lệch nhau, gây lỗi hydrate.
 *
 * Hook này luôn trả về `false` ở lần render đầu tiên (giống hệt phía
 * server), rồi mới cập nhật sau khi mount. Việc đo bằng layout effect
 * giúp giá trị đúng có hiệu lực trước lần vẽ đầu tiên.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const list = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(list.matches);

    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}
