/**
 * Một breakpoint duy nhất cho cả CSS lẫn JS.
 *
 * `wide` = màn hình rộng (từ 768px) HOẶC đang nằm ngang. Mọi thứ còn
 * lại — portrait và hẹp — được xếp theo trục dọc.
 *
 * Tailwind đọc hằng số này qua `extend.screens.wide`, nên class `wide:`
 * và hook `useMediaQuery` không bao giờ lệch nhau.
 */
export const WIDE_QUERY = "(min-width: 768px), (orientation: landscape)";
