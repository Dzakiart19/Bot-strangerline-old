/**
 * lib/platforms/strangerline/config.js
 * Semua konstanta spesifik platform StrangerLine.
 * Edit file ini saja ketika URL, pesan, atau timing berubah.
 */

"use strict";

module.exports = {
  // ── Endpoints ──────────────────────────────────────────────────────────────
  WS_SERVER:     "https://ws.strangerline.io",
  SOCKET_PATH:   "/chat/socket.io/",
  API_BASE:      "https://strangerline.io/chat/api",

  // ── Browser headers (wajib agar server tidak reject) ───────────────────────
  ORIGIN:        "https://strangerline.io",
  REFERER:       "https://strangerline.io/chat/",
  USER_AGENT:    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36",

  // ── Pesan yang dikirim bot ──────────────────────────────────────────────────
  MESSAGE_GREET:   "Seeking discreet adult content? Vidorey offers a vast collection of free XXX videos and porn movies, updated daily. Stream instantly, no registration needed. Your private pleasure awaits: https://vidorey.web.app",
  MESSAGE_GOODBYE: "have fun",

  // ── Timing (ms) ────────────────────────────────────────────────────────────
  DELAY_SEND_MS:    600,   // jeda sebelum kirim pesan pertama setelah match
  DELAY_GOODBYE_MS: 500,   // jeda sebelum kirim pamit setelah dapat balasan
  DELAY_END_MS:     1200,  // jeda setelah kirim pamit sebelum end chat
  WAIT_MATCH_MS:    45000, // timeout tunggu match
  WAIT_REPLY_MS:    30000, // timeout tunggu balasan
  LOOP_DELAY_MS:    1500,  // jeda antar sesi

  // ── Socket.io options ──────────────────────────────────────────────────────
  SOCKET_TIMEOUT_MS:   20000,
  SEND_TIMEOUT_MS:     5000,
};
