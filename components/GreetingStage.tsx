"use client";

import { useEffect, useState } from "react";
import DaisyField from "@/components/patterns/daisy";
import { loadGreeting } from "@/data/events/loaders";
import { themeFor } from "@/data/events";
import type { EventMeta, EventTheme, GreetingBody } from "@/data/events";

type CSSVars = React.CSSProperties & Record<`--${string}`, string | undefined>;

/**
 * Sự kiện dạng lời chúc: sau khi mở khoá, người xem thấy một cảnh
 * chúc giữa màn hình, có hoa. Không có thư, không có ghi âm.
 */
export default function GreetingStage({ event }: { event: EventMeta }) {
  const [greeting, setGreeting] = useState<GreetingBody | null>(null);
  const [missing, setMissing] = useState(false);
  const theme = themeFor(event);

  useEffect(() => {
    let active = true;

    void loadGreeting(event.id).then((loaded) => {
      if (!active) return;
      if (loaded) {
        setGreeting(loaded);
      } else {
        setMissing(true);
      }
    });

    return () => {
      active = false;
    };
  }, [event.id]);

  return (
    <main
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-event-base"
      style={themeVars(theme)}
    >
      <DaisyField />

      {/* Lớp mờ phía sau chữ: hoa vẫn thấy rõ, nhưng dòng chúc đọc được. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(closest-side,rgba(247,244,237,0.8),rgba(247,244,237,0.42),transparent)]" />

      <div className="relative z-10 px-6 text-center">
        {missing ? (
          <p className="font-serif text-3xl font-light italic text-event-ink sm:text-4xl">
            Sự kiện này đang được chuẩn bị.
          </p>
        ) : greeting ? (
          <p className="font-serif text-[clamp(1.75rem,8.5vw,4.5rem)] font-light italic leading-tight text-event-ink">
            {greeting.text}
          </p>
        ) : null}
      </div>
    </main>
  );
}

function themeVars(theme: EventTheme): CSSVars {
  return {
    "--event-base": theme.base,
    "--event-surface": theme.surface,
    "--event-ink": theme.ink,
    "--event-muted": theme.muted,
    "--event-accent": theme.accent,
    "--event-accent-2": theme.accent2,
  };
}
