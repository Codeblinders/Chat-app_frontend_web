// -------------------- TCP over WebSocket --------------------
export function connectWebSocket({ serverIp, username, onMessage, onOpen, onClose, onError }) {
  const ws = new WebSocket(`ws://${serverIp}:8080/ws`);
  const activeUsers = new Set();

  ws.onopen = () => {
    console.log(`🌐 [WebSocket] Connected to ws://${serverIp}:8080`);
    ws.send(JSON.stringify({ type: "join", username }));
    onOpen?.();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // 👥 Handle user list updates
      if (data.type === "users") {
        activeUsers.clear();
        (data.list || []).forEach((u) => activeUsers.add(u));
        onMessage?.({ type: "users", list: [...activeUsers] });
        return;
      }

      // Ignore self-messages
      if (data.type === "chat" && data.sender === username) return;

      // 📁 Handle file chunk transfer
      if (data.type === "file_chunk") {
        const bytes = Uint8Array.from(atob(data.chunk), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: data.mime || "application/octet-stream" });
        onMessage?.({
          type: "file",
          sender: data.sender,
          filename: data.filename,
          blob,
          ts: Date.now(),
        });
        return;
      }

      onMessage?.(data);
    } catch (e) {
      console.error("❌ [WebSocket] Message parse error:", e);
    }
  };

  ws.onclose = () => {
    console.warn("🔌 [WebSocket] Disconnected");
    onClose?.();
  };

  ws.onerror = (err) => {
    console.error("❗ [WebSocket] Error:", err);
    onError?.(err);
  };

  // ---- Custom helpers ----
  ws.sendMessage = (msg) => {
    if (ws.readyState === WebSocket.OPEN)
      ws.send(JSON.stringify({ ...msg, sender: username }));
  };

  ws.sendTyping = () => {
    if (ws.readyState === WebSocket.OPEN)
      ws.send(JSON.stringify({ type: "typing", sender: username }));
  };

  ws.sendFile = async (file) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    const buffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    ws.send(
      JSON.stringify({
        type: "file_chunk",
        sender: username,
        filename: file.name,
        chunk: base64,
        mime: file.type,
      })
    );
  };

  // 🧩 Safe close wrapper (no recursion)
  ws._safeClose = () => {
    try {
      if (ws.readyState === WebSocket.OPEN)
        ws.send(JSON.stringify({ type: "leave", username }));
    } catch (_) {}
    try {
      ws.onclose = null;
      ws.close();
    } catch (_) {}
  };

  return ws;
}

export async function connectWebRTC({
  serverIp,
  username,
  room = "default",
  onMessage,
  onOpen,
  onClose,
  onError,
}) {
  console.log(`🌐 [WebRTC] Connecting to signaling at ${serverIp}:8081/signal ...`);

  // If an old signaling WS exists in the page, close it first to avoid duplicates
  try {
    if (window._signalSocket && window._signalSocket.readyState === WebSocket.OPEN) {
      console.warn("⚠️ Closing existing signaling socket to prevent duplicates");
      try { window._signalSocket.close(); } catch (_) {}
      window._signalSocket = null;
    }
  } catch (_) {}

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  let dc = null;
  let signalWs = null;
  let makingOffer = false;
  let ignoreOffer = false;
  let polite = false; // deterministic tie-break will be assigned when peer join occurs
  const fileBuffer = {};

  // ---------------- DataChannel wiring ----------------
  function wireDataChannel(channel) {
    dc = channel;
    dc.onopen = () => {
      console.log("✅ [WebRTC] DataChannel opened");
      onOpen?.();
    };
    dc.onclose = () => {
      console.warn("🔌 [WebRTC] DataChannel closed");
      onClose?.();
    };
    dc.onerror = (err) => {
      console.error("❗ [WebRTC] DataChannel error:", err);
      onError?.(err);
    };
    dc.onmessage = (e) => {
      // messages from remote peers
      try {
        const data = JSON.parse(e.data);
        if (data.type === "file_chunk") {
          if (!fileBuffer[data.filename]) fileBuffer[data.filename] = [];
          fileBuffer[data.filename].push(...data.chunk);
          if (data.end) {
            const blob = new Blob([new Uint8Array(fileBuffer[data.filename])]);
            delete fileBuffer[data.filename];
            onMessage?.({
              type: "file",
              sender: data.sender,
              filename: data.filename,
              blob,
              ts: Date.now(),
            });
          }
          return;
        }
        // ignore our own reflected messages if any
        if (data.sender !== username) onMessage?.(data);
      } catch (err) {
        console.error("❌ [WebRTC] parse error on datachannel message:", err);
      }
    };
  }

  // handle incoming datachannel (remote side)
  pc.ondatachannel = (ev) => {
    console.log("🎯 [WebRTC] Remote DataChannel detected:", ev.channel.label);
    wireDataChannel(ev.channel);
  };

  // create local datachannel
  const localDC = pc.createDataChannel("chat", { ordered: true });
  wireDataChannel(localDC);

  // ---------------- ICE handling ----------------
  pc.onicecandidate = ({ candidate }) => {
    if (!candidate) return;
    if (signalWs && signalWs.readyState === WebSocket.OPEN) {
      signalWs.send(JSON.stringify({ type: "ice", candidate, room, username }));
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log("🌍 [WebRTC] ICE state:", pc.iceConnectionState);
  };

  pc.onconnectionstatechange = () => {
    console.log("🔗 [WebRTC] connectionState:", pc.connectionState);
    // optionally call onClose/onOpen if needed based on connectionState
  };

  // ---------------- Signaling WebSocket ----------------
  signalWs = new WebSocket(`ws://${serverIp}:8081/signal`);
  window._signalSocket = signalWs;

  // send join once socket opens
  signalWs.onopen = async () => {
    console.log("🔌 [SignalWS] connected, joining room:", room);
    try {
      signalWs.send(JSON.stringify({ type: "join", room, username }));
    } catch (err) {
      console.warn("signal send join failed:", err);
    }
  };

  signalWs.onclose = () => {
    console.warn("🔌 [SignalWS] closed");
    try {
      dc?._safeClose?.();
    } catch (_) {}
    onClose?.();
  };

  signalWs.onerror = (err) => {
    console.error("❌ [SignalWS] error:", err);
    onError?.(err);
  };

  // helper: safely add candidate (ignore nulls/invalid)
  async function safeAddIce(cand) {
    if (!cand) return;
    try {
      await pc.addIceCandidate(cand);
    } catch (e) {
      // sometimes candidates arrive at incorrect times; log but continue
      console.warn("⚠️ addIceCandidate failed:", e);
    }
  }

  // ---------------- Signaling message handler ----------------
  signalWs.onmessage = async (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch (e) {
      console.warn("⚠️ Non-JSON signal message:", ev.data);
      return;
    }

    // Presence / user-list events (frontend expects these)
    if (msg.type === "users") {
      onMessage?.({ type: "users", list: msg.list });
      return;
    }
    if (msg.type === "peer-joined") {
      // UI notification + tie-break will be used below
      onMessage?.({ type: "join", username: msg.username });
      // continue to logic below so we may initiate offer
    }
    if (msg.type === "peer-left") {
      onMessage?.({ type: "leave", username: msg.username });
      return;
    }

    const desc = msg.sdp ? new RTCSessionDescription(msg.sdp) : null;

    try {
      // When a peer joins, deterministically decide polite/impolite and (optionally) create offer
      if (msg.type === "peer-joined" && msg.username !== username) {
        console.log("👥 Peer joined:", msg.username);
        // deterministic tie-break so both peers don't try simultaneously in the same way
        polite = username > msg.username;
        // create offer in a controlled manner
        try {
          makingOffer = true;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          signalWs.send(JSON.stringify({ type: "offer", room, username, sdp: pc.localDescription }));
        } finally {
          makingOffer = false;
        }
        return;
      }

      // OFFER received
      if (msg.type === "offer" && msg.username !== username) {
        const offerCollision = makingOffer || pc.signalingState !== "stable";
        ignoreOffer = !polite && offerCollision;
        if (ignoreOffer) {
          console.warn("🚫 Ignoring incoming offer (glare) — polite:", polite, "collision:", offerCollision);
          return;
        }

        console.log("📨 Received offer from", msg.username);
        await pc.setRemoteDescription(desc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        signalWs.send(JSON.stringify({ type: "answer", room, username, sdp: pc.localDescription }));
        return;
      }

      // ANSWER received
      if (msg.type === "answer" && msg.username !== username) {
        console.log("📨 Received answer from", msg.username);
        // only set remote description if it makes sense for current signalingState
        try {
          await pc.setRemoteDescription(desc);
        } catch (e) {
          console.warn("⚠️ setRemoteDescription(answer) failed (possible race):", e);
        }
        return;
      }

      // ICE candidate relay
      if (msg.type === "ice" && msg.username !== username) {
        await safeAddIce(msg.candidate);
        return;
      }

    } catch (err) {
      console.error("⚠️ Signaling error:", err);
    }
  };

  // ---------------- DataChannel send helpers ----------------
  function ensureDC() {
    if (!dc) {
      // no datachannel established yet; still return a stub that buffers? for now, just warn
      console.warn("⚠️ DataChannel not open yet");
    }
    return dc;
  }

  localDC.sendMessage = (msg) => {
    const ch = ensureDC();
    if (ch?.readyState === "open") ch.send(JSON.stringify({ ...msg, sender: username }));
  };
  localDC.sendTyping = () => {
    const ch = ensureDC();
    if (ch?.readyState === "open") ch.send(JSON.stringify({ type: "typing", sender: username }));
  };
  localDC.sendFile = async (file) => {
    const ch = ensureDC();
    if (!ch || ch.readyState !== "open") throw new Error("DataChannel not open");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const chunkSize = 16000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      ch.send(
        JSON.stringify({
          type: "file_chunk",
          sender: username,
          filename: file.name,
          chunk: Array.from(chunk),
          end: i + chunkSize >= bytes.length,
        })
      );
      await new Promise((r) => setTimeout(r, 5));
    }
  };

  // safe close helper
  localDC._safeClose = () => {
    try {
      if (dc) dc.close();
    } catch (_) {}
    try {
      pc.close();
    } catch (_) {}
    try {
      if (signalWs && signalWs.readyState === WebSocket.OPEN) signalWs.close();
    } catch (_) {}
  };

  // return the localDC as the "connection object" used by the rest of the app
  return localDC;
}
