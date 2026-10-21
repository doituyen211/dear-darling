"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PinGate from "@/components/PinGate";
import MessageSequence from "@/components/MessageSequence";
import FinalAudio from "@/components/FinalAudio";
import GreetingStage from "@/components/GreetingStage";
import { loadEventBody } from "@/data/events/loaders";
import type { EventBody, EventMeta } from "@/data/events";

type Stage = "letter" | "audio";

interface EventExperienceProps {
  /** Metadata của sự kiện (không chứa nội dung thư). */
  event: EventMeta;
  /** Mã băm PIN của sự kiện. Bỏ trống thì dùng mã mặc định. */
  pinHash?: string;
  /** Khoá session riêng của sự kiện. */
  sessionScope?: string;
}

/**
 * Trải nghiệm đầy đủ của một sự kiện: màn hình nhập mã, rồi phần nội
 * dung của sự kiện.
 *
 * Phần nội dung chỉ được mount SAU khi PinGate đã mở khoá, nên nội dung
 * của sự kiện chỉ được tải về (dynamic import) sau khi người xem đã gõ
 * đúng mã.
 *
 * Sự kiện dạng thư đi qua `EventStages`; sự kiện dạng lời chúc đi qua
 * `GreetingStage`.
 */
export default function EventExperience({
  event,
  pinHash,
  sessionScope,
}: EventExperienceProps) {
  return (
    <PinGate pinHash={pinHash} sessionScope={sessionScope}>
      {event.experience === "greeting" ? (
        <GreetingStage event={event} />
      ) : (
        <EventStages eventId={event.id} />
      )}
    </PinGate>
  );
}

function EventStages({ eventId }: { eventId: string }) {
  const [body, setBody] = useState<EventBody | null>(null);
  const [missing, setMissing] = useState(false);
  const [stage, setStage] = useState<Stage>("letter");

  useEffect(() => {
    let active = true;

    void loadEventBody(eventId).then((loaded) => {
      if (!active) return;
      if (loaded) {
        setBody(loaded);
      } else {
        setMissing(true);
      }
    });

    return () => {
      active = false;
    };
  }, [eventId]);

  const hasLetter = Boolean(body && body.lines.length > 0);

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-ink-950">
      {/* Quiet background: a warm gradient wash plus a single soft
        glow behind the text, like a lamp on a desk. Nothing here
        competes with the words. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-900 via-ink-950 to-black" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-candle-gold/10 blur-[120px] animate-glow-pulse" />

      <div className="relative z-10 flex w-full flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {missing || !hasLetter ? (
            <StageNotice
              key="missing"
              text="Sự kiện này đang được chuẩn bị."
            />
          ) : body === null ? (
            <StageNotice key="loading" text="Đang mở…" />
          ) : stage === "letter" ? (
            <MessageSequence
              key="letter"
              messages={body.lines}
              onComplete={() => setStage("audio")}
            />
          ) : body.audio ? (
            <FinalAudio
              key="audio"
              src={body.audio.src}
              type={body.audio.type}
            />
          ) : (
            <StageNotice
              key="no-audio"
              text="Bản ghi âm đang được chuẩn bị."
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function StageNotice({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full max-w-md flex-col items-center gap-4 px-6 text-center"
    >
      <p className="font-serif text-2xl font-light italic text-candle-light sm:text-3xl">
        {text}
      </p>
    </motion.div>
  );
}
