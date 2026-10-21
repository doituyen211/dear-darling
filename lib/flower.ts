import { seeded } from "@/lib/random";

/**
 * Dữ liệu và nhịp thời gian của vườn hoa.
 *
 * Mọi vị trí, cỡ, màu và trễ đều sinh từ `seeded(index)` nên server và
 * client dựng ra y hệt nhau, không lệch hydrate.
 */

// ── Màu ───────────────────────────────────────────────────────────────
// Lẫn lộn như hoa ngoài đời. Đây là nơi duy nhất trong giao diện được
// phép dùng màu no bão hòa.
export const PETAL_COLORS = [
  "var(--flower-blue)",
  "var(--flower-red)",
  "var(--flower-purple)",
  "var(--flower-yellow)",
  "var(--flower-pink)",
];

/** Màu nhịp hoa. */
export const FLOWER_CENTER_COLOR = "var(--flower-center)";

/** 5 cánh, mỗi cánh lệch 72°. */
export const PETAL_ANGLES = [0, 72, 144, 216, 288];

// ── Nhịp thời gian ────────────────────────────────────────────────────

/** Thời gian một cánh mở hết. */
export const PETAL_OPEN_MS = 520;

/** Trễ giữa hai cánh cùng một bông. */
export const PETAL_STAGGER_MS = 90;

/** Trễ giữa hai bông. */
export const FLOWER_STAGGER_MS = 130;

/** Đường cong mở cánh: vồng nhẹ rồi định lại. */
export const PETAL_EASE: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

/** Đường cong của nhịp hoa, mềm hơn cánh. */
export const CENTER_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Số cánh rơi lơ lửng phía trên vườn hoa. */
export const FALLING_PETAL_COUNT = 12;

/** Một cánh rơi mất tối thiểu / tối đa bao lâu (ms). */
export const FALLING_MIN_MS = 14000;
export const FALLING_MAX_MS = 22000;

/**
 * Cánh rơi có lặp vô hạn không.
 *
 * `true`  — vườn hoa đứng yên sau khi nở, nhưng các cánh rơi vẫn trôi
 *           nhẹ vô hạn (trang luôn có chút sự sống).
 * `false` — mọi thứ dừng hẳn sau một lượt rơi; lớp cánh rơi sẽ trống
 *           trong những lần mở sau.
 */
export const FALLING_LOOPS = true;

/** Trần cỡ bông hoa theo `vmin`, để màn hình rộng không phóng bông to khổng lồ. */
export const FLOWER_SIZE_MAX_VMIN = 22;

// ── Dữ liệu sinh ra ───────────────────────────────────────────────────

export interface FlowerCell {
  /** Lệch ngang trong ô, tính theo % cỡ bông. */
  offsetX: number;
  /** Lệch dọc trong ô, tính theo % cỡ bông. */
  offsetY: number;
  /** Cỡ bông, tính theo % ô. */
  size: number;
  /** Trễ mở cánh đầu tiên, tính bằng giây. */
  delay: number;
  /** Màu cánh. */
  color: string;
}

/**
 * Một ô trong lưới hoa. Bông thứ `i` mở sau `i` bông trước, nên cả
 * vườn hoa nở từ trên xuống như một làn sóng.
 */
export function flowerCells(count: number): FlowerCell[] {
  return Array.from({ length: count }, (_, i) => ({
    offsetX: (seeded(i, 1) - 0.5) * 50,
    offsetY: (seeded(i, 2) - 0.5) * 50,
    size: 100 + seeded(i, 3) * 24,
    delay: (i * FLOWER_STAGGER_MS) / 1000,
    // Màu ngẫu nhiên thay vì `i % 5` — chia hết 5 sẽ tạo vân sọc
    // nhìn thấy được trong lưới.
    color: PETAL_COLORS[Math.floor(seeded(i, 6) * PETAL_COLORS.length)],
  }));
}

export interface FallingPetal {
  /** Vị trí ngang ban đầu, % bề rộng màn hình. */
  left: number;
  /** Vị trí dọc khi đứng yên, % chiều cao màn hình. */
  restY: number;
  /** Độ trôi ngang, tính bằng `vw`. */
  drift: number;
  /** Thời gian rơi hết màn hình, ms. */
  duration: number;
  /** Trễ âm — để cánh đã ở giữa đường rơi ngay khi xuất hiện. */
  delay: number;
  /** Cỡ cánh, px. */
  size: number;
  /** Góc xoay sẵn của cánh. */
  rotation: number;
  color: string;
}

/** Lớp cánh rơi lơ lửng phía trên vườn hoa. */
export function fallingPetals(count: number): FallingPetal[] {
  return Array.from({ length: count }, (_, i) => {
    const duration =
      FALLING_MIN_MS + seeded(i, 13) * (FALLING_MAX_MS - FALLING_MIN_MS);

    return {
      left: seeded(i, 11) * 100,
      restY: 10 + seeded(i, 18) * 80,
      drift: (seeded(i, 12) - 0.5) * 26,
      duration,
      delay: -seeded(i, 14) * duration,
      size: 18 + seeded(i, 15) * 22,
      rotation: seeded(i, 16) * 360,
      color: PETAL_COLORS[Math.floor(seeded(i, 17) * PETAL_COLORS.length)],
    };
  });
}
