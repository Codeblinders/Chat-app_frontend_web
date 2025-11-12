// src/components/ChatBubble.jsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";

export default function ChatBubble({ message, me }) {
  const isSystem = message.type === "system";
  const timestamp = useMemo(
    () =>
      new Date(message.ts || Date.now()).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [message.ts]
  );

  if (isSystem) {
    return (
      <div className="w-full flex justify-center my-2">
        <div className="text-xs px-3 py-1 rounded-full bg-glass border text-muted">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      whileHover={{ scale: 1.01 }}
      className={`flex ${me ? "justify-end" : "justify-start"} px-2 py-1`}
    >
      <div
        className={`max-w-[65%] sm:max-w-[70%] p-2 sm:p-3 rounded-2xl border transition-all duration-200`}
        style={{
          borderColor: "var(--glass-border)",
          background: me
            ? "linear-gradient(135deg, var(--accent-1), var(--accent-2))"
            : "var(--panel-surface-2)",
          color: me ? "#fff" : "var(--text-main)",
          boxShadow: me
            ? "0 4px 14px rgba(124,58,237,0.25)"
            : "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,100,150,0.8), rgba(120,70,255,0.7))",
              color: "#fff",
            }}
          >
            {message.sender?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <span className="text-sm font-semibold">{message.sender}</span>
        </div>

        <div className="text-sm leading-snug break-words mb-1">
  {message.type === "file" ? (
    (() => {
      const isImage =
        message.isImage ||
        /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(message.filename || "");
      const fileUrl =
        message.fileUrl ||
        (message.blob ? URL.createObjectURL(message.blob) : null);

      return isImage ? (
        <img
          src={fileUrl}
          alt={message.filename}
          className="max-w-[300px] rounded-xl shadow-md cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={() => window.open(fileUrl, "_blank")}
        />
      ) : (
        <a
          href={fileUrl}
          download={message.filename}
          className="flex items-center gap-2 text-blue-400 underline hover:text-blue-600"
        >
          📎 {message.filename}
        </a>
      );
    })()
  ) : (
    message.text
  )}
</div>




        <div
          className="text-[10px] text-right"
          style={{
            color: me ? "rgba(255,255,255,0.7)" : "var(--text-muted)",
          }}
        >
          {timestamp}
        </div>
      </div>
    </motion.div>
  );
}
