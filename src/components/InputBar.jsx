// src/components/InputBar.jsx
import { useState } from "react";
import { motion } from "framer-motion";

export default function InputBar({ onSend, onFile, onTyping }) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) onFile(f);
    e.target.value = "";
  };

  return (
    <div className="w-full p-3 border rounded-xl backdrop-blur-md flex items-center gap-3"
         style={{ background: "var(--panel-surface)", borderColor: "var(--glass-border)" }}>
      <input id="revamped-file-input" type="file" onChange={handleFile} className="hidden" />

      <button
        onClick={() => document.getElementById("revamped-file-input").click()}
        aria-label="attach file"
        className="p-2 rounded-lg hover:scale-105 transition-transform"
        style={{ color: "var(--text-main)", background: "var(--panel-surface-2)", border: "1px solid var(--glass-border)" }}
      >
        📎
      </button>

      <div className="flex-1 relative">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping && onTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Share a file or type a message..."
          className="w-full rounded-lg px-4 py-3 text-sm outline-none border"
          style={{
            background: "transparent",
            borderColor: "transparent",
            color: "var(--text-main)",
          }}
        />
        <div className="pointer-events-none absolute right-3 top-3 text-[11px]" style={{ color: "var(--text-muted)" }}>press Enter to send</div>
      </div>

      <button
        onClick={handleSubmit}
        className="px-4 py-2 rounded-lg hover:scale-[1.02] transition-transform font-semibold"
        style={{
          background: "linear-gradient(90deg, var(--accent-1), var(--accent-2))",
          color: "#fff",
          border: "1px solid var(--glass-border)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
        }}
      >
        Send
      </button>
    </div>
  );
}
