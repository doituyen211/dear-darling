"use client";

import { motion } from "framer-motion";

export default function FinalAudio() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full max-w-md flex-col items-center gap-6 px-6 text-center"
    >
      <h1 className="font-serif text-2xl font-light italic text-candle-light sm:text-3xl">
        Anh gửi cái này đến cho em.
      </h1>

      <audio
        controls
        preload="none"
        className="w-full max-w-sm rounded-full"
        aria-label="A short recorded message"
      >
        <source src="/audio/message.m4a" type="audio/mpeg" />
        Your browser doesn&rsquo;t support the audio element. You can download
        the recording from /audio/message.m4a instead.
      </audio>

      <p className="font-sans text-sm text-candle-muted">
        Khi em sẵn sàng, hãy nhấn nghe.
      </p>
    </motion.div>
  );
}
