"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect không chạy trên server và React sẽ cảnh báo. Dùng
 * useEffect ở phía server để tránh cảnh báo, còn phía client thì dùng
 * useLayoutEffect để giá trị đã đo được áp dụng trước lần vẽ đầu tiên
 * (không nháy layout).
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
