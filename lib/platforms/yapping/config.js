/**
 * lib/platforms/yapping/config.js
 * Semua konstanta spesifik platform Yapping (yapping.me/chat).
 * Edit file ini saja ketika URL, pesan, atau timing berubah.
 *
 * Hasil recon: app SvelteKit, socket.io di origin yang sama (yapping.me),
 * default namespace "/", default path "/socket.io/". Auth berbasis cookie
 * JWT (token, userd, device_token) yang di-set otomatis oleh server saat
 * GET /chat pertama kali — tidak ada endpoint register/login terpisah.
 * Gender wajib diset lewat REST sebelum join_match_queue, kalau tidak
 * server balas error "GENDER_REQUIRED".
 */

"use strict";

module.exports = {
  // ── Endpoints ──────────────────────────────────────────────────────────────
  BASE_URL:        "https://yapping.me",
  CHAT_PAGE_PATH:  "/chat",
  GENDER_API_PATH: "/api/user/gender",
  SOCKET_PATH:     "/socket.io/",   // namespace default "/" — tidak perlu sub-path

  // ── Browser headers (wajib agar server tidak reject) ───────────────────────
  ORIGIN:      "https://yapping.me",
  REFERER:     "https://yapping.me/chat",
  USER_AGENT:  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36",

  // ── Preferensi sesi chat ─────────────────────────────────────────────────────
  MY_GENDER:      "male",   // gender diri sendiri — wajib diisi sebelum matching
  WANT_GENDER:    "both",   // filter gender partner — "both" = semua
  INTERESTS:      [],
  IS_PAID_USER:   0,

  // ── Pesan yang dikirim bot ──────────────────────────────────────────────────
  MESSAGE_GREET:   "Hi, nice to meet you.",
  MESSAGE_GOODBYE: "Have a nice day.",

  // ── Timing (ms) ────────────────────────────────────────────────────────────
  DELAY_JOIN_QUEUE_MS: 500,   // jeda setelah identify_user sebelum join_match_queue
  DELAY_SEND_MS:       800,   // jeda sebelum kirim pesan pertama setelah match
  DELAY_GOODBYE_MS:    500,   // jeda sebelum kirim pamit setelah dapat balasan
  DELAY_END_MS:        1200,  // jeda setelah kirim pamit sebelum tutup koneksi
  WAIT_MATCH_MS:       45000, // timeout tunggu match
  WAIT_REPLY_MS:       30000, // timeout tunggu balasan
  LOOP_DELAY_MS:       1500,  // jeda antar sesi
  REQUEST_TIMEOUT_MS:  12000, // cegah guest request menggantung selamanya

  // ── Socket.io options ──────────────────────────────────────────────────────
  SOCKET_TRANSPORTS: ["websocket", "polling"],
  SOCKET_TIMEOUT_MS: 20000,
  SEND_TIMEOUT_MS:   5000,
};
