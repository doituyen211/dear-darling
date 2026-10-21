"use client";

import { motion } from "framer-motion";

interface FinalAudioProps {
  /** Đường dẫn file ghi âm trong /public. */
  src: string;
  /** MIME type của file, để trình duyệt đoán đúng định dạng. */
  type?: string;
}

export default function FinalAudio({
  src,
  type = "audio/mp4",
}: FinalAudioProps) {
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
        preload="metadata"
        className="w-full max-w-sm rounded-full"
        aria-label="A short recorded message"
      >
        <source src={src} type={type} />
        Your browser doesn&rsquo;t support the audio element. You can download
        the recording from {src} instead.
      </audio>

      <p className="font-sans text-sm text-candle-muted">
        Khi em sẵn sàng, hãy nhấn nghe.
      </p>
    </motion.div>
  );
}
