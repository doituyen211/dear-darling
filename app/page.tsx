"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import MessageSequence from "@/components/MessageSequence";
import FinalAudio from "@/components/FinalAudio";
import PinGate from "@/components/PinGate";
import { messages } from "@/data/messages";

type Stage = "letter" | "audio";

export default function Home() {
  const [stage, setStage] = useState<Stage>("letter");

  return (
    <PinGate>
      <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-ink-950">
        {/* Quiet background: a warm gradient wash plus a single soft
          glow behind the text, like a lamp on a desk. Nothing here
          competes with the words. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-900 via-ink-950 to-black" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-candle-gold/10 blur-[120px] animate-glow-pulse" />

        <div className="relative z-10 flex w-full flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {stage === "letter" ? (
              <MessageSequence
                key="letter"
                messages={messages}
                onComplete={() => setStage("audio")}
              />
            ) : (
              <FinalAudio key="audio" />
            )}
          </AnimatePresence>
        </div>
      </main>
    </PinGate>
  );
}
