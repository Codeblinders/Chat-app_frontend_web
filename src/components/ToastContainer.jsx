import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ToastContainer({ toasts, removeToast }) {
  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => removeToast(t.id), t.duration || 3500));
    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

  const typeColors = {
    success: "from-emerald-400 to-green-600",
    error: "from-red-500 to-pink-600",
    warning: "from-yellow-400 to-amber-500",
    info: "from-indigo-500 to-purple-600",
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className={`px-4 py-3 rounded-xl shadow-2xl text-sm text-white bg-gradient-to-r ${typeColors[t.type] || typeColors.info} border border-white/8 backdrop-blur-md flex items-center gap-3`}
          >
            {t.icon && <div className="text-lg">{t.icon}</div>}
            <div className="flex-1 leading-tight">{t.message}</div>
            <button onClick={() => removeToast(t.id)} className="text-xs text-white/80 hover:text-white/100">Dismiss</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ======================================================
   Export default convenience (if user prefers default imports)
   ====================================================== */
