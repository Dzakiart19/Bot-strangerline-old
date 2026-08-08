/**
 * lib/platforms/y99/session.js
 * Satu sesi bot di Y99.in — connect → auth → join room → kirim pesan berkala.
 *
 * Flow (reverse-engineered dari app.ea2c15d91b040cedc940.js):
 *   1. io(WS_SERVER, { path: "/socket.io/", transports: ["websocket"] })
 *   2. on("connect")              → emit "authenticate" { username, isGuest: true, gender, age }
 *   3. on("getting_masked_auth")  → (server minta challenge) → emit "authenticate" lagi dengan maskedAuth
 *   4. on("auth_success")         → emit "joinRoom" { room_id: 9736 }
 *   5. on("joinRoomAfterSuccess") → mulai interval kirim "listen_send"
 *   6. on("new_messages")         → catat balasan (stats.totalReplies++)
 *   7. socket.on("disconnect")    → resolve sesi, bot loop akan reconnect
 *
 * Pesan dikirim setiap SEND_INTERVAL_MS ke room; tidak ada target spesifik
 * karena Y99 adalah group room (bukan 1-on-1 random).
 */

"use strict";

const https    = require("https");
const { io }   = require("socket.io-client");
const cfg      = require("./config");
const { stats, pushEvent } = require("../../core/stats");
const { log }  = require("../../core/logger");

// TLS agent yang mengizinkan self-signed cert (api1.y99.in:8443 kemungkinan pakai self-signed)
const tlsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Jalankan satu sesi Y99: connect → auth → join → broadcast.
 * @param {{ username: string, gender: string, age: number, deviceId: string }} guest
 * @param {number} roomId  - ID room yang akan dimasuki (default: cfg.ROOM_IDS[0])
 * @returns {Promise<string>} alasan selesai
 */
function runSession(guest, roomId) {
  roomId = roomId || cfg.ROOM_IDS[0];

  return new Promise((resolve) => {
    let socket;
    let done        = false;
    let joined      = false;
    let sendTimer   = null;
    let authTimer   = null;
    let joinTimer   = null;
    let maskedToken = null;

    function finish(reason) {
      if (done) return;
      done = true;
      clearTimeout(authTimer);
      clearTimeout(joinTimer);
      clearInterval(sendTimer);
      stats.status = "idle";
      log("INFO", `[y99] sesi selesai: ${reason}`);
      try { socket?.disconnect(); } catch (_) {}
      resolve(reason);
    }

    function sendPromo() {
      if (!socket?.connected || !joined) return;
      try {
        socket.emit("listen_send", {
          msg:     cfg.MESSAGE_TEXT,
          room_id: roomId,
        });
        stats.totalMsgSent++;
        log("BOT", `[y99] → room ${roomId}: "${cfg.MESSAGE_TEXT.substring(0, 60)}..."`);
        pushEvent("sent");
      } catch (err) {
        log("WARN", `[y99] gagal kirim listen_send: ${err.message}`);
      }
    }

    // ── Buat koneksi socket ─────────────────────────────────────────────────
    try {
      socket = io(cfg.WS_SERVER, {
        path:       cfg.SOCKET_PATH,
        transports: ["websocket"],
        timeout:    cfg.CONNECT_TIMEOUT_MS,
        reconnection: false,
        agent:      tlsAgent,
        extraHeaders: {
          "Origin":     cfg.ORIGIN,
          "Referer":    cfg.REFERER,
          "User-Agent": cfg.USER_AGENT,
        },
      });
    } catch (err) {
      log("ERROR", `[y99] io() gagal: ${err.message}`);
      stats.totalErrors++;
      return resolve("io-init-error");
    }

    // ── connect ─────────────────────────────────────────────────────────────
    socket.on("connect", () => {
      log("INFO", `[y99] connected sid=${socket.id} (${guest.username}), kirim authenticate...`);
      stats.totalSessions++;
      stats.status = "searching";

      authTimer = setTimeout(() => {
        log("WARN", "[y99] timeout menunggu auth_success");
        stats.totalErrors++;
        finish("auth-timeout");
      }, cfg.AUTH_TIMEOUT_MS);

      socket.emit("authenticate", {
        username: guest.username,
        gender:   guest.gender,
        age:      guest.age,
        isGuest:  true,
        deviceId: guest.deviceId,
      });
    });

    // ── getting_masked_auth (server minta challenge response) ───────────────
    socket.on("getting_masked_auth", (data) => {
      log("INFO", `[y99] getting_masked_auth: ${JSON.stringify(data).substring(0, 120)}`);
      maskedToken = (typeof data === "object") ? (data?.token || data?.masked_auth || data?.auth || data) : data;

      socket.emit("authenticate", {
        username:   guest.username,
        gender:     guest.gender,
        age:        guest.age,
        isGuest:    true,
        deviceId:   guest.deviceId,
        maskedAuth: maskedToken,
        auth:       maskedToken,
      });
    });

    // ── auth_success ─────────────────────────────────────────────────────────
    socket.on("auth_success", (data) => {
      clearTimeout(authTimer);
      log("INFO", `[y99] auth_success: ${JSON.stringify(data).substring(0, 120)}`);
      stats.status = "matched";

      joinTimer = setTimeout(() => {
        log("WARN", "[y99] timeout menunggu joinRoomAfterSuccess");
        stats.totalErrors++;
        finish("join-timeout");
      }, cfg.JOIN_TIMEOUT_MS);

      socket.emit("joinRoom", {
        room_id: roomId,
        roomId:  roomId,
        roomid:  roomId,
      });
    });

    // ── PARTIALLY_AUTHENTICATED ──────────────────────────────────────────────
    socket.on("PARTIALLY_AUTHENTICATED", (data) => {
      clearTimeout(authTimer);
      log("INFO", `[y99] PARTIALLY_AUTHENTICATED: ${JSON.stringify(data).substring(0, 120)}`);
      socket.emit("joinRoom", { room_id: roomId, roomId: roomId, roomid: roomId });
    });

    // ── auth_invalid ─────────────────────────────────────────────────────────
    socket.on("auth_invalid", (data) => {
      clearTimeout(authTimer);
      log("WARN", `[y99] auth_invalid: ${JSON.stringify(data).substring(0, 120)}`);
      stats.totalErrors++;
      finish("auth-invalid");
    });

    // ── NOT_AUTHENTICATED ────────────────────────────────────────────────────
    socket.on("NOT_AUTHENTICATED", (data) => {
      clearTimeout(authTimer);
      log("WARN", `[y99] NOT_AUTHENTICATED: ${JSON.stringify(data).substring(0, 120)}`);
      stats.totalErrors++;
      finish("not-authenticated");
    });

    // ── joinRoomAfterSuccess ─────────────────────────────────────────────────
    socket.on("joinRoomAfterSuccess", (data) => {
      clearTimeout(joinTimer);
      joined = true;
      log("INFO", `[y99] bergabung ke room ${roomId} berhasil`);
      stats.status = "active";
      pushEvent("match");

      sendPromo();
      sendTimer = setInterval(sendPromo, cfg.SEND_INTERVAL_MS);
    });

    // ── new_messages ─────────────────────────────────────────────────────────
    socket.on("new_messages", (data) => {
      const msgs = Array.isArray(data) ? data : (data?.messages || [data]);
      for (const m of msgs) {
        const sender = m?.username || m?.user || m?.sender || "?";
        const text   = m?.msg || m?.message || m?.text || "";
        if (!text) continue;
        if (sender !== guest.username) {
          stats.totalReplies++;
          stats.lastReplyAt = Date.now();
          log("CHAT", `[y99] ← ${sender}: "${String(text).substring(0, 80)}"`);
          pushEvent("reply");
        }
      }
    });

    socket.on("new_messages_t", (data) => {
      if (data?.username && data.username !== guest.username) {
        stats.totalReplies++;
        stats.lastReplyAt = Date.now();
        log("CHAT", `[y99] ← ${data.username}: "${String(data.msg || "").substring(0, 80)}"`);
        pushEvent("reply");
      }
    });

    // ── connect_error ────────────────────────────────────────────────────────
    socket.on("connect_error", (err) => {
      const detail = err?.description || err?.message || String(err);
      log("ERROR", `[y99] connect_error: ${err.message} | detail: ${JSON.stringify(detail).substring(0, 200)}`);
      stats.totalErrors++;
      stats.lastErrorAt  = Date.now();
      stats.lastErrorMsg = err.message;
      finish("connect-error");
    });

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      log("INFO", `[y99] disconnected: ${reason}`);
      finish(`disconnect:${reason}`);
    });

    // ── debug: log event tak dikenal ─────────────────────────────────────────
    socket.onAny((event, ...args) => {
      const KNOWN = new Set([
        "connect","connect_error","disconnect",
        "getting_masked_auth","auth_success","auth_invalid",
        "NOT_AUTHENTICATED","PARTIALLY_AUTHENTICATED",
        "joinRoomAfterSuccess","new_messages","new_messages_t",
      ]);
      if (!KNOWN.has(event)) {
        log("DEBUG", `[y99] event: ${event} ${JSON.stringify(args).substring(0, 180)}`);
      }
    });
  });
}

module.exports = { runSession };
