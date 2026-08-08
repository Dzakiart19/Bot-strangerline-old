/**
 * lib/platforms/y99/config.js
 * Konstanta spesifik platform Y99.in (y99.in/web/).
 *
 * Reverse-engineered dari:
 *   - https://y99.in/web/static/js/app.ea2c15d91b040cedc940.js (bundle SPA Vue)
 *   - WS server: wss://api1.y99.in:8443 (socket.io)
 *
 * Catatan arsitektur:
 *   Y99 adalah room-based group chat (bukan random 1-on-1).
 *   Flow: connect socket → emit "authenticate" (guest) → on "auth_success"
 *         → emit "joinRoom" → on "joinRoomAfterSuccess" → emit "listen_send"
 *   Room 9736 = Australia public room.
 *
 *   Auth event yang ditemukan di bundle:
 *     emit: "authenticate", "joinRoom", "listen_send"
 *     on:   "auth_success", "auth_invalid", "joinRoomAfterSuccess", "new_messages"
 */

"use strict";

module.exports = {
  // ── WebSocket server ────────────────────────────────────────────────────────
  WS_SERVER:    "https://api1.y99.in:8443",
  SOCKET_PATH:  "/socket.io/",

  // ── Origin headers ──────────────────────────────────────────────────────────
  ORIGIN:       "https://y99.in",
  REFERER:      "https://y99.in/web/",
  USER_AGENT:   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36",

  // ── Room IDs ────────────────────────────────────────────────────────────────
  // 9736 = Australia public room; tambahkan room lain di sini bila perlu
  ROOM_IDS:     [9736],

  // ── Guest identity pools ────────────────────────────────────────────────────
  ADJECTIVES:   ["Cool","Quick","Bold","Smart","Chill","Sharp","Bright","Slick","Fast","Wild"],
  NOUNS:        ["Fox","Bear","Wolf","Hawk","Lion","Tiger","Eagle","Shark","Panda","Viper"],
  GENDER_POOL:  ["male", "female"],
  AGE_MIN:      20,
  AGE_MAX:      38,

  // ── Pesan promo yang dikirim ke room ────────────────────────────────────────
  MESSAGE_TEXT: "Want free adult videos? Check out https://vidorey.web.app — huge collection, no sign-up needed 🔥",

  // ── Timing (ms) ────────────────────────────────────────────────────────────
  CONNECT_TIMEOUT_MS:  15000,  // timeout sambung ke socket
  AUTH_TIMEOUT_MS:     10000,  // timeout tunggu auth_success setelah authenticate
  JOIN_TIMEOUT_MS:     10000,  // timeout tunggu joinRoomAfterSuccess
  SEND_INTERVAL_MS:    45000,  // kirim pesan ke room setiap 45 detik
  RECONNECT_DELAY_MS:  5000,   // jeda sebelum reconnect setelah disconnect
  LOOP_DELAY_MS:       3000,   // jeda antar sesi baru
};
