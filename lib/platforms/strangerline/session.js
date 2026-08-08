/**
 * lib/platforms/strangerline/session.js
 * Satu sesi chat di StrangerLine: konek → match → sapa → pamit → end.
 *
 * Flow (reverse-engineered dari /chat/assets/index-CU_9hME1.js):
 *   1. io(WS_SERVER, { path: "/chat/socket.io/", transports: ["websocket"] })
 *   2. on("connect")         → emit "authenticate" { guestId, displayName, locale, deviceId }
 *   3. on("matchStatusSync") → emit "joinMatchQueue" { guestId, preferences, interests }
 *   4. on("matchFound")      → emit "sendMessage" { matchId, message, messageType, ... }
 *   5. on("newMessage")      → emit "sendMessage" goodbye → setTimeout finish()
 *   6. finish()              → emit "endMatch" { matchId } → socket.disconnect()
 */

"use strict";

const { io }  = require("socket.io-client");
const { v4: uuidv4 } = require("uuid");

const cfg         = require("./config");
const { stats, pushEvent } = require("../../core/stats");
const { log }     = require("../../core/logger");

/**
 * Jalankan satu sesi chat penuh.
 * @param {{ guestId: string, displayName: string, deviceId: string }} guest
 * @returns {Promise<string>} alasan selesai (got-reply, match-timeout, dsb)
 */
function runSession(guest) {
  return new Promise((resolve) => {
    let socket;
    let matchId       = null;
    let matched       = false;  // guard: matchFound jangan proses dua kali
    let messageSent   = false;  // pesan sapa sudah terkirim
    let goodbyeSent   = false;  // pesan pamit sudah terkirim
    let done          = false;
    let matchTimer    = null;
    let replyTimer    = null;
    let searchStarted = false;

    // ── Selesaikan sesi & bersihkan resource ─────────────────────────────────
    function finish(reason) {
      if (done) return;
      done = true;
      clearTimeout(matchTimer);
      clearTimeout(replyTimer);
      stats.status = "idle";

      try {
        if (matchId && socket?.connected) {
          socket.emit("endMatch", { matchId });
          socket.emit("leaveMatchQueue");
        }
      } catch (_) {}

      setTimeout(() => {
        try { socket?.disconnect(); } catch (_) {}
        resolve(reason);
      }, 400);
    }

    // ── Helper: emit sendMessage ──────────────────────────────────────────────
    function sendMsg(text, label) {
      const tempClientId = Date.now().toString() + "-" + Math.random().toString(36).slice(2, 7);
      socket.timeout(cfg.SEND_TIMEOUT_MS).emit(
        "sendMessage",
        { matchId, message: text, messageType: "text", isEphemeral: false, tempClientId },
        (err) => {
          if (err) log("WARN", `${label} timeout/error:`, String(err));
          else     log("BOT", `${label} terkirim (ack ok)`);
        }
      );
      stats.totalMsgSent++;
      log("BOT", `→ ${label}: "${text}"`);
    }

    // ── Mulai cari partner ────────────────────────────────────────────────────
    function startSearch() {
      if (searchStarted || done) return;
      searchStarted = true;

      socket.emit("joinMatchQueue", {
        guestId:     guest.guestId,
        preferences: {},
        interests:   [],
      });
      log("BOT", "joinMatchQueue dikirim — mencari partner...");
      stats.status = "searching";
      pushEvent("search", `Sesi #${stats.currentSession} mencari partner...`);

      matchTimer = setTimeout(() => {
        if (!matchId) {
          log("WARN", `Tidak dapat match dalam ${cfg.WAIT_MATCH_MS / 1000}s`);
          stats.totalNoMatch++;
          pushEvent("warn", `Sesi #${stats.currentSession}: no match timeout`);
          finish("match-timeout");
        }
      }, cfg.WAIT_MATCH_MS);
    }

    // ── Koneksi Socket.io ─────────────────────────────────────────────────────
    log("INFO", `Konek sebagai ${guest.displayName} (${guest.guestId})`);
    stats.status = "connecting";

    socket = io(cfg.WS_SERVER, {
      path:            cfg.SOCKET_PATH,
      transports:      ["websocket"],
      withCredentials: true,
      reconnection:    false,
      timeout:         cfg.SOCKET_TIMEOUT_MS,
      extraHeaders: {
        "Origin":     cfg.ORIGIN,
        "Referer":    cfg.REFERER,
        "User-Agent": cfg.USER_AGENT,
      },
    });

    // ── connect ───────────────────────────────────────────────────────────────
    socket.on("connect", () => {
      log("SUCCESS", `Terhubung — socket.id=${socket.id}`);
      stats.status = "authenticating";
      socket.emit("authenticate", {
        guestId:     guest.guestId,
        displayName: guest.displayName,
        locale:      "en",
        deviceId:    guest.deviceId,
      });
    });

    // Server kirim ini setelah authenticate → langsung join queue
    socket.on("matchStatusSync", (d) => {
      log("INFO", "matchStatusSync", JSON.stringify(d || {}).slice(0, 60));
      if (!matchId && !done) startSearch();
    });

    // Fallback: kalau 3 detik tidak ada event, paksa join
    socket.on("initialized", () => startSearch());
    setTimeout(() => {
      if (!searchStarted && !done && socket.connected) {
        log("WARN", "Fallback: paksa joinMatchQueue");
        startSearch();
      }
    }, 3000);

    // ── matchFound ────────────────────────────────────────────────────────────
    socket.on("matchFound", (data) => {
      if (done || matched) return;
      matched = true;
      clearTimeout(matchTimer);

      matchId = data?.matchId;
      const partnerName = data?.partnerName || "stranger";
      stats.totalMatches++;
      stats.lastMatchAt = Date.now();
      stats.status = "matched";
      log("SUCCESS", `✓ MATCH! matchId=${matchId} | partner=${partnerName}`);
      pushEvent("match", `Partner: ${partnerName} | matchId: ${matchId.slice(0, 8)}…`);

      // Kirim sapa setelah jeda kecil
      setTimeout(() => {
        if (done) return;
        sendMsg(cfg.MESSAGE_GREET, "Sapa");
        pushEvent("send", `Sapa dikirim ke ${partnerName}`);
        messageSent = true;

        replyTimer = setTimeout(() => {
          log("WARN", `Tidak ada balasan dalam ${cfg.WAIT_REPLY_MS / 1000}s`);
          stats.totalNoReply++;
          pushEvent("warn", `Sesi #${stats.currentSession}: no reply timeout`);
          finish("no-reply-timeout");
        }, cfg.WAIT_REPLY_MS);
      }, cfg.DELAY_SEND_MS);
    });

    // ── newMessage ────────────────────────────────────────────────────────────
    socket.on("newMessage", (data) => {
      if (done) return;
      const text     = data?.message || "(media)";
      const senderId = data?.senderGuestId || data?.senderId || "";
      if (senderId === guest.guestId) return; // abaikan pesan dari diri sendiri

      stats.totalReplies++;
      stats.lastReplyAt = Date.now();
      log("MSG", `Stranger: "${text.slice(0, 120)}"`, `[replies: ${stats.totalReplies}]`);
      pushEvent("reply", `Reply dari partner: "${text.slice(0, 80)}"`);

      if (messageSent && !goodbyeSent) {
        goodbyeSent = true;
        clearTimeout(replyTimer);

        setTimeout(() => {
          if (done) return;
          sendMsg(cfg.MESSAGE_GOODBYE, "Pamit");
          pushEvent("send", "Pamit dikirim ke partner");
          setTimeout(() => finish("goodbye-sent"), cfg.DELAY_END_MS);
        }, cfg.DELAY_GOODBYE_MS);
      }
    });

    // ── Events terminasi dari server ──────────────────────────────────────────
    socket.on("matchEnded",         (d) => {
      log("INFO", "matchEnded", JSON.stringify(d || {}).slice(0, 80));
      finish("match-ended");
    });
    socket.on("partnerLeft",         () => finish("partner-left"));
    socket.on("partnerDisconnected", () => finish("partner-disconnected"));

    // ── userBlocked / userBanned ──────────────────────────────────────────────
    socket.onAny((event, ...args) => {
      if (event === "userBlocked" || event === "userBanned") {
        stats.totalBlocked++;
        log("WARN", `[${event}]`, JSON.stringify(args).slice(0, 100));
        pushEvent("blocked", `${event}: ${JSON.stringify(args).slice(0, 80)}`);
      }
    });

    // ── Error & disconnect ────────────────────────────────────────────────────
    socket.on("connect_error", (err) => {
      log("ERROR", `Koneksi gagal: ${err.message}`);
      stats.totalErrors++;
      stats.lastErrorAt  = Date.now();
      stats.lastErrorMsg = err.message;
      pushEvent("error", `connect_error: ${err.message}`);
      finish("connect-error");
    });

    socket.on("disconnect", (reason) => {
      log("WARN", `Disconnect: ${reason}`);
      if (!done) finish("disconnect");
    });

    socket.on("error", (err) => {
      log("ERROR", "Socket error:", String(err));
      stats.totalErrors++;
      stats.lastErrorMsg = String(err);
      pushEvent("error", String(err));
    });
  });
}

module.exports = { runSession };
