"use client";

import { motion } from "framer-motion";
import {
  CENTER_EASE,
  FLOWER_CENTER_COLOR,
  PETAL_ANGLES,
  PETAL_EASE,
  PETAL_OPEN_MS,
  PETAL_STAGGER_MS,
  type FlowerCell,
} from "@/lib/flower";

/**
 * Một bông hoa cúc 5 cánh, mở **từng cánh một**.
 *
 * Cánh được xoay tĩnh bằng thuộc tính `transform` của thẻ `<g>` bọc ngoài.
 * Nhờ vậy phần `transform` mà framer-motion ghi vào không ghi đè mất góc
 * xoay.
 *
 * Về điểm co: với thẻ SVG như `<ellipse>`, framer-motion **tự tính**
 * `transformOrigin` theo tâm của riêng ellipse (`calcSVGTransformOrigin`
 * trong `render/svg/utils/build-attrs.mjs`) — mặc định là 50%/50% của
 * bounding box, tức (50,27), tức tâm của ellipse chứ không phải tâm hoa.
 *
 * Muốn pivot ở tâm hoa thì phải đưa `originX`/`originY` vào **target của
 * `animate`** (chúng được đọc từ motion values, không phải từ props):
 * `calcOrigin` trả nguyên chuỗi nên "50px 50px" được giữ đúng ý.
 */
const PETAL_ORIGIN = { originX: "50px", originY: "50px" } as const;

interface DaisyFlowerProps {
  cell: FlowerCell;
  /** Người dùng yêu cầu giảm chuyển động: hoa hiện ngay, không mở. */
  reducedMotion: boolean;
}

export default function DaisyFlower({
  cell,
  reducedMotion,
}: DaisyFlowerProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="daisy-flower block h-auto w-full"
      role="presentation"
    >
      {PETAL_ANGLES.map((angle, index) => (
        <g key={angle} transform={`rotate(${angle} 50 50)`}>
          {reducedMotion ? (
            <ellipse cx="50" cy="27" rx="14" ry="26" fill={cell.color} />
          ) : (
            <motion.ellipse
              cx="50"
              cy="27"
              rx="14"
              ry="26"
              fill={cell.color}
              initial={{ scaleY: 0, ...PETAL_ORIGIN }}
              animate={{ scaleY: 1, ...PETAL_ORIGIN }}
              transition={{
                delay: cell.delay + (index * PETAL_STAGGER_MS) / 1000,
                duration: PETAL_OPEN_MS / 1000,
                ease: PETAL_EASE,
              }}
            />
          )}
        </g>
      ))}

      {reducedMotion ? (
        <circle cx="50" cy="50" r="13" fill={FLOWER_CENTER_COLOR} />
      ) : (
        <motion.circle
          cx="50"
          cy="50"
          r="13"
          fill={FLOWER_CENTER_COLOR}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: cell.delay,
            duration: 0.4,
            ease: CENTER_EASE,
          }}
        />
      )}
    </svg>
  );
}
