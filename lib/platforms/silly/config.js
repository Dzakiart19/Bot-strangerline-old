/**
 * lib/platforms/silly/config.js
 * Semua konstanta spesifik platform SillyChat (silly.chat/text-chat).
 *
 * Hasil recon: Next.js + Cloudflare. Menggunakan native WebSocket (bukan socket.io).
 * Auth: POST /api/auth/guest-token → { token, userId }
 * WS:   wss://silly.chat/ws?token=<token>
 * Protocol: JSON messages dengan field { feature, type, ... }
 * Feature text-chat selalu pakai feature="text".
 */

"use strict";

module.exports = {
  // ── Endpoints ──────────────────────────────────────────────────────────────
  BASE_URL:        "https://silly.chat",
  WS_URL:          "wss://silly.chat/ws",
  TOKEN_API_PATH:  "/api/auth/guest-token",

  // ── Browser headers ────────────────────────────────────────────────────────
  ORIGIN:     "https://silly.chat",
  REFERER:    "https://silly.chat/text-chat",
  USER_AGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36",

  // ── Protocol ───────────────────────────────────────────────────────────────
  FEATURE:    "text",   // feature name untuk text-chat
  JOIN_MODE:  "global", // mode join queue

  // ── Pesan yang dikirim bot ──────────────────────────────────────────────────
  MESSAGE_GREET:   "Hi, nice to meet you.",
  MESSAGE_GOODBYE: "Have a nice day.",

  // ── Timing (ms) ────────────────────────────────────────────────────────────
  DELAY_SEND_MS:    800,
  DELAY_GOODBYE_MS: 500,
  DELAY_END_MS:     1200,
  WAIT_MATCH_MS:    45000,
  WAIT_REPLY_MS:    30000,
  LOOP_DELAY_MS:    1500,

  // ── WebSocket options ──────────────────────────────────────────────────────
  WS_TIMEOUT_MS:  20000,
  SEND_TIMEOUT_MS: 5000,
  REQUEST_TIMEOUT_MS: 12000,
};
