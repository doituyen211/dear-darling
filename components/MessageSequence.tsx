"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SplitText from "./SplitText";

interface MessageSequenceProps {
  messages: string[];
  /** Fired once, after the last message has finished fading out. */
  onComplete: () => void;
}

type Phase = "revealing" | "holding" | "exiting";

// How long a fully-revealed sentence sits on screen before it fades.
const HOLD_MS = 2700;
// How long the fade-out itself takes.
const EXIT_MS = 700;
// A brief breath of empty space between one sentence leaving and the
// next arriving, so the pacing reads as natural rather than mechanical.
const PAUSE_MS = 450;

export default function MessageSequence({
  messages,
  onComplete,
}: MessageSequenceProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("revealing");
  const prefersReducedMotion = useReducedMotion();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  // Called by SplitText once every character of the current sentence
  // has finished animating in.
  const handleRevealed = useCallback(() => {
    setPhase("holding");
    const hold = prefersReducedMotion ? 900 : HOLD_MS;
    const t = setTimeout(() => setPhase("exiting"), hold);
    timers.current.push(t);
  }, [prefersReducedMotion]);

  // Called once the fade-out animation for the current sentence ends.
  const handleExited = useCallback(() => {
    const isLast = index === messages.length - 1;
    const pause = prefersReducedMotion ? 150 : PAUSE_MS;
    const t = setTimeout(() => {
      if (isLast) {
        onComplete();
      } else {
        setIndex((i) => i + 1);
        setPhase("revealing");
      }
    }, pause);
    timers.current.push(t);
  }, [index, messages.length, onComplete, prefersReducedMotion]);

  const exitDuration = (prefersReducedMotion ? 200 : EXIT_MS) / 1000;

  return (
    <div className="relative flex min-h-[40vh] w-full items-center justify-center px-6 text-center">
      <AnimatePresence mode="wait" onExitComplete={handleExited}>
        {phase !== "exiting" ? (
          <motion.div
            key={index}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: exitDuration, ease: "easeInOut" }}
          >
            <SplitText
              text={messages[index]}
              className="font-serif text-3xl font-light leading-relaxed text-candle-light sm:text-4xl md:text-5xl"
              delay={100}
              duration={0.5}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
              onLetterAnimationComplete={handleRevealed}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
