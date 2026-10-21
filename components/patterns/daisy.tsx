"use client";

import { useMemo } from "react";
import DaisyFlower from "@/components/patterns/daisy-flower";
import DaisyPetals from "@/components/patterns/daisy-petals";
import { usePrefersReducedMotion } from "@/components/hooks/usePrefersReducedMotion";
import {
  FALLING_PETAL_COUNT,
  FLOWER_SIZE_MAX_VMIN,
  fallingPetals,
  flowerCells,
} from "@/lib/flower";

interface DaisyFieldProps {
  /** Số cột của lưới hoa. */
  columns?: number;
  /** Số hàng của lưới hoa. */
  rows?: number;
  className?: string;
}

/**
 * Một vườn hoa cúc 5 cánh phủ kín màn hình.
 *
 * Hai lớp chuyển động:
 *  1. **Vườn hoa** — 36 bông, mở **từng cánh một**, theo hàng từ trên
 *     xuống, và **đứng yên** khi nở xong.
 *  2. **Cánh rơi** — 12 cánh lơ lửng phía trên, rơi chậm và trôi ngang.
 *
 * Vị trí, cỡ, màu và trễ đều sinh từ `seeded(index)` nên server và client
 * dựng ra y hệt nhau, không lệch hydrate.
 */
export default function DaisyField({
  columns = 6,
  rows = 6,
  className = "",
}: DaisyFieldProps) {
  const reducedMotion = usePrefersReducedMotion();
  const cells = useMemo(() => flowerCells(columns * rows), [columns, rows]);
  const petals = useMemo(() => fallingPetals(FALLING_PETAL_COUNT), []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {cells.map((cell, i) => (
          <div key={i} className="flex items-center justify-center">
            <div
              style={{
                // Cỡ theo ô, nhưng trần theo vmin để màn hình rộng không
                // phóng bông hoa ra khổng lồ.
                width: `min(${cell.size.toFixed(0)}%, ${FLOWER_SIZE_MAX_VMIN}vmin)`,
                transform: `translate(${cell.offsetX.toFixed(1)}%, ${cell.offsetY.toFixed(1)}%)`,
              }}
            >
              <DaisyFlower cell={cell} reducedMotion={reducedMotion} />
            </div>
          </div>
        ))}
      </div>

      <DaisyPetals petals={petals} reducedMotion={reducedMotion} />
    </div>
  );
}
