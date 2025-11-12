import React from "react";
import { motion } from "framer-motion";

export default function SideBar({
  username,
  serverIp,
  protocol,
  status,
  users = [],
  onDisconnect,
  onConnect, // 👈 new handler for reconnect
}) {
  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-emerald-400";
      case "connecting":
        return "bg-amber-400";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "error":
        return "Error";
      default:
        return "Disconnected";
    }
  };

  const handleClick = () => {
    if (status === "connected" || status === "connecting") {
      onDisconnect && onDisconnect();
    } else {
      onConnect && onConnect();
    }
  };

  return (
    <div className="h-full flex flex-col justify-between text-white p-4">
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-400 to-pink-500 flex items-center justify-center text-lg font-bold text-black/85 shadow-inner">
              RC
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-white">
                Reach Chat
              </div>
              <div className="text-xs text-white/60">
                Welcome,{" "}
                <span className="font-medium text-indigo-200">
                  {username}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Connection Info */}
        <div className="bg-gradient-to-br from-black/40 to-white/3 border border-white/6 rounded-xl p-3 mb-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-white/60">Status</div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${getStatusColor()}`}></span>
              <div className="text-sm font-medium">{getStatusLabel()}</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs mb-2">
            <div className="text-white/60">Protocol</div>
            <div className="font-medium text-indigo-200 uppercase">
              {protocol}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="text-white/60">Server</div>
            <div className="font-medium">{serverIp}</div>
          </div>
        </div>

        {/* Active Users */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-white/90">
              Active Users
            </div>
            <div className="text-xs text-white/60">
              {users?.length || 0} online
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-auto custom-scroll pr-2">
            {(!users || users.length === 0) ? (
              <div className="p-3 rounded-md bg-white/6 text-sm text-white/60 italic">
                No active users
              </div>
            ) : (
              users.map((u) => (
                <div
                  key={u}
                  className={`flex items-center justify-between p-2 rounded-lg transition ${
                    u === username
                      ? "bg-gradient-to-r from-indigo-600/70 to-purple-700/60 text-white shadow-lg"
                      : "bg-white/3 text-white/80 hover:bg-white/6"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
                    <div className="text-sm">{u}</div>
                  </div>
                  {u === username && (
                    <div className="text-xs text-white/60">(You)</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="mt-4 space-y-2"
      >
        <button
          onClick={handleClick}
          className={`w-full py-2 rounded-lg transition flex items-center justify-center gap-2 text-sm font-medium ${
            status === "connected"
              ? "bg-gradient-to-r from-red-500 to-pink-600 hover:brightness-110"
              : "bg-gradient-to-r from-emerald-500 to-green-600 hover:brightness-110"
          }`}
        >
          {status === "connected" ? "🔌 Disconnect" : "⚡ Connect"}
        </button>
      </motion.div>
    </div>
  );
}
