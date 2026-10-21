import { seeded } from "@/lib/random";

interface DaisyFieldProps {
  /** Số cột của lưới hoa. */
  columns?: number;
  /** Số hàng của lưới hoa. */
  rows?: number;
  className?: string;
}

/** Màu hoa — lẫn lộn như hoa ngoài đời, không dùng màu no bão hòa. */
const PETAL_COLORS = [
  "var(--flower-blue)",
  "var(--flower-red)",
  "var(--flower-purple)",
  "var(--flower-yellow)",
  "var(--flower-pink)",
];

/**
 * Một vườn hoa cúc 5 cánh phủ kín màn hình.
 *
 * Các bông mọc ra từ từ, xếp theo một lưới rồi lệch nhẹ quanh ô của
 * mình, nên cả màn hình được phủ dần thay vì hiện ra cùng một lúc.
 *
 * Vị trí, cỡ, màu và thứ tự nở đều sinh từ `seeded(index)` nên server
 * và client dựng ra y hệt nhau, không lệch hydrate.
 */
export default function DaisyField({
  columns = 6,
  rows = 6,
  className = "",
}: DaisyFieldProps) {
  const count = columns * rows;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 grid overflow-hidden ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        const jitterX = (seeded(i, 1) - 0.5) * 0.5;
        const jitterY = (seeded(i, 2) - 0.5) * 0.5;
        const size = 100 + seeded(i, 3) * 24;
        const delay = (i / count) * 5 + seeded(i, 4) * 0.5;
        const color = PETAL_COLORS[i % PETAL_COLORS.length];

        return (
          <div key={i} className="flex items-center justify-center">
            <div
              style={{
                // Cỡ theo ô, nhưng trần theo vmin để màn hình rộng không
                // phóng bông hoa ra khổng lồ.
                width: `min(${size.toFixed(0)}%, 22vmin)`,
                transform: `translate(${(jitterX * 100).toFixed(1)}%, ${(
                  jitterY * 100
                ).toFixed(1)}%)`,
              }}
            >
              <div
                className="daisy"
                style={{ animationDelay: `${delay.toFixed(2)}s` }}
              >
                <DaisySvg color={color} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DaisySvg({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="block h-auto w-full"
      role="presentation"
    >
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="50"
          cy="27"
          rx="14"
          ry="26"
          fill={color}
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="13" fill="var(--flower-center)" />
    </svg>
  );
}
