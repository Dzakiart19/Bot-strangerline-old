/**
 * lib/platforms/opentalk/config.js
 * Semua konstanta spesifik platform OpenTalk (mode text).
 * Edit file ini saja ketika URL, pesan, atau timing berubah.
 *
 * Hasil recon: lihat opentalk.club/text/ — API/WS server ada di domain
 * terpisah rtc.opentalk.club, socket.io namespace "/web".
 */

"use strict";

module.exports = {
  // ── Endpoints ──────────────────────────────────────────────────────────────
  WS_SERVER:        "https://rtc.opentalk.club",
  SOCKET_NAMESPACE: "/web",              // io(`${WS_SERVER}${SOCKET_NAMESPACE}`, ...)
  SOCKET_PATH:      "/socket.io/",       // path default socket.io (bukan /web/socket.io/)
  API_BASE:         "https://rtc.opentalk.club",

  // ── Browser headers (wajib agar server tidak reject) ───────────────────────
  ORIGIN:      "https://opentalk.club",
  REFERER:     "https://opentalk.club/text/",
  USER_AGENT:  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36",

  // ── Preferensi sesi chat (dikirim di event "start") ────────────────────────
  MODE:          "text",
  INTERESTS:     [],
  GENDER:        null,   // gender diri sendiri — tidak diketahui, biarkan null
  WANT_GENDER:   null,   // filter gender partner — null = semua (fitur premium jika diisi)
  WANT_CONTINENT: null,
  NSFW_OPT_IN:   false,

  // ── Pesan yang dikirim bot ──────────────────────────────────────────────────
  MESSAGE_GREET:   "Hi, nice to meet you.",
  MESSAGE_GOODBYE: "Have a nice day.",

  // ── Timing (ms) ────────────────────────────────────────────────────────────
  DELAY_SEND_MS:    600,   // jeda sebelum kirim pesan pertama setelah match
  DELAY_GOODBYE_MS: 500,   // jeda sebelum kirim pamit setelah dapat balasan
  DELAY_END_MS:     1200,  // jeda setelah kirim pamit sebelum end chat
  WAIT_MATCH_MS:    45000, // timeout tunggu match
  WAIT_REPLY_MS:    30000, // timeout tunggu balasan
  LOOP_DELAY_MS:    1500,  // jeda antar sesi

  // ── Socket.io options ──────────────────────────────────────────────────────
  SOCKET_TRANSPORTS:   ["websocket", "polling"],
  SOCKET_TIMEOUT_MS:   20000,
  SEND_TIMEOUT_MS:     5000,

  // ── Auth token ─────────────────────────────────────────────────────────────
  TOKEN_REFRESH_MARGIN_MS: 60000, // token expiresIn 900s — refresh kalau sisa < ini
};
