"use client";

import { motion } from "framer-motion";
import { FALLING_LOOPS, type FallingPetal } from "@/lib/flower";

interface DaisyPetalsProps {
  petals: FallingPetal[];
  /** Người dùng yêu cầu giảm chuyển động: cánh đứng yên. */
  reducedMotion: boolean;
}

/**
 * Lớp cánh hoa rơi lơ lửng phía trên vườn hoa.
 *
 * Mỗi cánh rơi từ trên xuống, trôi ngang qua lại, xoay chậm và mờ dần
 * khi chạm đáy. Trễ âm nghĩa là cánh **đã ở giữa đường rơi** ngay khi
 * hiện ra — không có đoạn "đứng chờ rồi mới rơi".
 */
export default function DaisyPetals({
  petals,
  reducedMotion,
}: DaisyPetalsProps) {
  if (reducedMotion) {
    return (
      <div
        aria-hidden="true"
        className="daisy-petals pointer-events-none absolute inset-0 overflow-hidden"
      >
        {petals.map((petal, i) => (
          <div
            key={i}
            className="absolute top-0 block"
            style={{ left: `${petal.left}%`, top: `${petal.restY}%`, width: petal.size }}
          >
            <svg viewBox="0 0 100 100" className="block h-auto w-full" role="presentation">
              <g transform={`rotate(${petal.rotation} 50 50)`}>
                <ellipse cx="50" cy="27" rx="15" ry="27" fill={petal.color} />
              </g>
            </svg>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="daisy-petals pointer-events-none absolute inset-0 overflow-hidden"
    >
      {petals.map((petal, i) => (
        <div
          key={i}
          className="absolute top-0 block"
          style={{ left: `${petal.left}%`, width: petal.size }}
        >
          <motion.svg
            viewBox="0 0 100 100"
            className="block h-auto w-full"
            role="presentation"
            initial={{ y: "-12vh", opacity: 0 }}
            animate={{
              y: ["-12vh", "30vh", "75vh", "112vh"],
              opacity: [0, 0.85, 0.85, 0],
              rotate: [0, 140, 280, 420],
            }}
            transition={{
              duration: petal.duration / 1000,
              repeat: FALLING_LOOPS ? Infinity : 0,
              ease: "linear",
              times: [0, 0.12, 0.85, 1],
              delay: petal.delay / 1000,
            }}
          >
            <motion.g
              initial={{ x: "0vw" }}
              animate={{ x: ["0vw", `${petal.drift}vw`, "0vw"] }}
              transition={{
                duration: petal.duration / 1000,
                repeat: FALLING_LOOPS ? Infinity : 0,
                ease: "easeInOut",
                times: [0, 0.5, 1],
                delay: petal.delay / 1000,
              }}
            >
              <g transform={`rotate(${petal.rotation} 50 50)`}>
                <ellipse cx="50" cy="27" rx="15" ry="27" fill={petal.color} />
              </g>
            </motion.g>
          </motion.svg>
        </div>
      ))}
    </div>
  );
}
