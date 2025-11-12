// src/ChatRoot.jsx
import React, { useState, useEffect } from "react";
import App from "./App";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatRoot() {
  // session form
  const [form, setForm] = useState({
    username: "",
    serverIp: "13.232.133.38",
    protocol: "tcp",
  });
  const [loggedIn, setLoggedIn] = useState(false);

  // theme state: reuse same localStorage key used in App ("reach_theme")
  const [theme, setTheme] = useState(() => localStorage.getItem("reach_theme") || "dark");

  useEffect(() => {
    const saved = localStorage.getItem("reach_chat_session");
    if (saved) {
      const data = JSON.parse(saved);
      setForm(data);
      setLoggedIn(true);
    }
  }, []);

  // sync html class (same logic as App.jsx)
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

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.username.trim()) {
      alert("Please enter a username!");
      return;
    }
    localStorage.setItem("reach_chat_session", JSON.stringify(form));
    setLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("reach_chat_session");
    setLoggedIn(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden text-main">
      {/* subtle animated bubble background (colors come from CSS variables) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-orb -top-20 -left-32 w-96 h-96" />
        <div className="bg-orb bottom-0 right-0 w-[32rem] h-[32rem]" />
        {/* a few floating accent orbs */}
        <div className="orb-small left-10 top-40" />
        <div className="orb-small right-20 top-24" />
      </div>

      {/* top-right theme toggle */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
        <button
          aria-label="Toggle theme"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          className="bg-glass px-3 py-2 rounded-lg border"
          style={{ borderColor: "var(--glass-border)" }}
        >
          {theme === "dark" ? "🌞 Light" : "🌙 Dark"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!loggedIn ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.46, ease: "easeOut" }}
            className="w-full max-w-md bg-glass border p-8 rounded-3xl relative z-10"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <div className="text-center mb-6">
              <motion.h1
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="text-3xl font-extrabold"
                style={{
                  background: "linear-gradient(90deg, var(--accent-1), var(--accent-2))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Reach Chat
              </motion.h1>
              <p className="text-sm text-muted mt-2">Connect securely and start chatting instantly ⚡</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm mb-2 text-muted font-medium">Username</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg text-sm outline-none border"
                  style={{
                    background: "var(--panel-surface-2)",
                    borderColor: "var(--glass-border)",
                    color: "var(--text-main)",
                  }}
                  placeholder="Enter your username"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-muted font-medium">Server IP</label>
                <input
                  type="text"
                  name="serverIp"
                  value={form.serverIp}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg text-sm outline-none border"
                  style={{
                    background: "var(--panel-surface-2)",
                    borderColor: "var(--glass-border)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-muted font-medium">Protocol</label>
                <select
                  name="protocol"
                  value={form.protocol}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg text-sm outline-none border"
                  style={{
                    background: "var(--panel-surface-2)",
                    borderColor: "var(--glass-border)",
                    color: "var(--text-main)",
                  }}
                >
                  <option value="tcp">TCP (WebSocket)</option>
                  <option value="udp">UDP (WebRTC)</option>
                </select>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="w-full py-3 rounded-lg font-semibold shadow-lg border"
                style={{
                  background: "linear-gradient(90deg, var(--accent-1), var(--accent-2))",
                  color: "#fff",
                  borderColor: "var(--glass-border)",
                }}
              >
                Connect
              </motion.button>
            </form>

            <div className="mt-6 text-xs text-center text-muted">Secure connection enabled • Encrypted chat powered by Reach Chat</div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.36 }}
            className="w-full h-full"
          >
            <App
              username={form.username}
              serverIp={form.serverIp}
              protocol={form.protocol}
              onLogout={handleLogout}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
