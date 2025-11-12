// src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import { connectWebSocket, connectWebRTC } from "./Utils/network";
import ChatBubble from "./components/ChatBubble";
import InputBar from "./components/InputBar";
import SideBar from "./components/SideBar";
import ToastContainer from "./components/ToastContainer";
import { motion, AnimatePresence } from "framer-motion";

export default function App({ username, serverIp, protocol, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("disconnected");
  const [isTyping, setIsTyping] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [users, setUsers] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem("reach_theme") || "dark");

  const netRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem("reach_theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!chatRef.current) return;
    chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  function showToast({ message, type = "info", duration = 3500 }) {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type, duration }]);
  }
  function removeToast(id) { setToasts((p) => p.filter((t) => t.id !== id)); }
  const pushMessage = (m) => setMessages((p) => [...p, { ...m, ts: Date.now() }]);

  useEffect(() => {
    if (!username || !serverIp || !protocol) return;
    if (netRef.current) return;
    startConnection();
    return () => {
      try { netRef.current?._safeClose?.(); } catch {}
      netRef.current = null;
      setStatus("disconnected");
      setUsers([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, serverIp, protocol]);

  async function startConnection() {
    setStatus("connecting");
    try {
      const handlers = {
        onMessage: (m) => {
  if (m.type === "users") return setUsers(m.list || []);
  if (m.sender === username) return; // prevent self-duplicates


  if (m.type === "join" || m.type === "leave") {
    setUsers((prev) => {
      const s = new Set(prev);
      if (m.type === "join") s.add(m.username);
      else s.delete(m.username);
      return [...s];
    });
    return pushMessage({
      type: "system",
      text: `${m.username} ${m.type === "join" ? "joined" : "left"} the chat`,
    });
  }

  if (m.type === "typing" && m.sender !== username) {
    setIsTyping(true);
    clearTimeout(window._typingTimeout);
    window._typingTimeout = setTimeout(() => setIsTyping(false), 1600);
    return;
  }

  // 🚫 Prevent duplicates (ignore self-echo)
  if (m.sender === username) return;

  // ✅ Handle incoming files
  if (m.type === "file" || m.type === "file_chunk") {
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(m.filename || "");
    const fileUrl = m.fileUrl || (m.blob ? URL.createObjectURL(m.blob) : null);
    pushMessage({
      type: "file",
      sender: m.sender,
      filename: m.filename,
      fileUrl,
      isImage,
      ts: Date.now(),
    });
    return;
  }

  pushMessage(m);
},

        onOpen: () => {
          setStatus("connected");
          showToast({ message: "✅ Connected", type: "success" });
        },
        onClose: () => {
          setStatus("disconnected");
          showToast({ message: "🔌 Disconnected", type: "warning" });
          setUsers([]);
        },
        onError: (err) => {
          setStatus("error");
          showToast({ message: `❌ ${err.message}`, type: "error" });
        },
      };

      const client = protocol === "tcp"
        ? connectWebSocket({ serverIp, username, ...handlers })
        : await connectWebRTC({ serverIp, username, ...handlers });

      netRef.current = client;
    } catch (err) {
      console.error("connect failed", err);
      setStatus("error");
      showToast({ message: `Connect failed: ${err.message}`, type: "error" });
    }
  }

  async function handleSend(text) {
    const conn = netRef.current;
    if (!conn) return showToast({ message: "⚠️ Not connected" });
    const payload = { type: "chat", sender: username, text };
    try {
      conn.sendMessage(payload);
      pushMessage(payload);
    } catch (e) {
      showToast({ message: "Send failed", type: "error" });
    }
  }

  const handleDisconnect = () => {
    try { netRef.current?._safeClose?.(); } catch {}
    netRef.current = null;
    setStatus("disconnected");
    setUsers([]);
    showToast({ message: "🔌 Disconnected", type: "warning" });
  };

  const handleExit = () => {
    try { netRef.current?._safeClose?.(); } catch {}
    localStorage.removeItem("reach_chat_session");
    onLogout && onLogout();
  };
  // Add this helper function above the return()
const addToast = (message, type = "info") => {
  const id = Date.now();
  setToasts((prev) => [...prev, { id, message, type }]);
  setTimeout(() => removeToast(id), 3000); // auto-remove in 3 seconds
};


  return (
  <div className="text-main transition-all duration-300">
    {/* Header */}
    <header className="app-header flex items-center justify-between">
      {/* Logo + Chat Title */}
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300, damping: 12 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md"
          style={{
            background: "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
            color: "#fff",
          }}
        >
          RC
        </motion.div>

        <div>
          <div className="font-extrabold text-lg tracking-tight">Reach Chat</div>
          <div className="text-muted text-xs sm:text-sm">
            {username} • {status}
          </div>
        </div>
      </div>

      {/* Header Buttons */}
      <div className="flex items-center gap-3 sm:gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          aria-label="Toggle theme"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          className="bg-glass transition-all duration-300"
          style={{
            padding: "8px 10px",
            borderRadius: 12,
            border: "1px solid var(--glass-border)",
            color: "var(--text-main)",
            backdropFilter: "blur(6px)",
          }}
        >
          {theme === "dark" ? "🌞 Light" : "🌙 Dark"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleExit}
          className="send-btn shadow-md"
        >
          Exit
        </motion.button>
      </div>
    </header>

    {/* Sidebar */}
    <aside className="app-sidebar">
      <SideBar
        username={username}
        serverIp={serverIp}
        protocol={protocol}
        status={status}
        users={users}
        onDisconnect={handleDisconnect}
        onConnect={startConnection}
      />
    </aside>

    {/* Main Chat Area */}
    <main className="app-main">
      <div ref={chatRef} className="chat-body">
        <div className="messages-inner">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                className="bubble-glow"
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <ChatBubble message={m} me={m.sender === username} />
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted mt-2"
            >
              Someone is typing...
            </motion.div>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="chat-input-bar border-t border-[var(--glass-border)] bg-[var(--panel-surface)] backdrop-blur-sm">
        <div className="w-full max-w-[1100px] mx-auto">
          <InputBar
  onSend={handleSend}
onFile={async (file) => {
  try {
    // 🚨 60 MB limit
    if (file.size > 60 * 1024 * 1024) {
      addToast("❌ File too large (limit 60 MB)", "error");
      return;
    }

    // ✅ Check connection before sending
    if (!netRef.current || netRef.current.readyState !== WebSocket.OPEN) {
      addToast("⚠️ Not connected to server", "warning");
      return;
    }

    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

    // ✅ Local preview (base64)
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;

      // Show immediately in sender chat
      const localMsg = {
        type: "file",
        sender: username,
        filename: file.name,
        fileUrl: base64,
        isImage,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, localMsg]);
      addToast(`📤 Uploading ${file.name}...`, "info");

      // ✅ Send via WebSocket safely in chunks
      if (netRef.current?.sendFile) {
        await netRef.current.sendFile(file);
      } else if (netRef.current?.sendMessage) {
        // Fallback for old servers
        netRef.current.sendMessage({
          type: "file_chunk",
          sender: username,
          filename: file.name,
          chunk: base64.split(",")[1],
          mime: file.type,
          end: true,
        });
      }

      addToast(`✅ Sent ${file.name}`, "success");
    };

    reader.readAsDataURL(file);
  } catch (err) {
    console.error("File send failed:", err);
    addToast("❌ File send failed", "error");
  }
}}


/>


        </div>
      </div>
    </main>

    {/* Toasts */}
    <ToastContainer toasts={toasts} removeToast={removeToast} />
  </div>
);
}