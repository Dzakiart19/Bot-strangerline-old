/**
 * lib/platforms/chatib/config.js
 * Semua konstanta spesifik platform Chatib (app.chatib.chat).
 *
 * Reverse-engineered dari:
 *   - https://chatib.chat/               → landing page, form login inline JS
 *   - https://app.chatib.chat/enter      → login "anonim" (username+gender+age+country, tanpa email)
 *   - https://app.chatib.chat/app/       → SPA, bundle /public/dist/js/{socket,app,attachments}.min.js
 *
 * Catatan arsitektur PENTING (beda dari platform lain di project ini):
 * Chatib BUKAN sistem random-match 1-on-1. Setelah connect socket, server
 * broadcast daftar SEMUA user yang sedang online lewat event "existing_users"
 * dan "new_user" (lobby publik) — siapapun bisa emit "send_message" langsung
 * ke user_id siapapun yang online, tanpa proses match/persetujuan dulu.
 * Jadi bot ini memilih SATU target acak dari daftar online lalu menyapa
 * duluan, bukan menunggu di-pasangkan oleh server.
 */

"use strict";

module.exports = {
  // ── Endpoints ──────────────────────────────────────────────────────────────
  APP_ORIGIN:    "https://app.chatib.chat",
  ENTER_PATH:    "/enter",              // GET ?handle=&gender=&age=&country= → set cookie jwt+session, redirect ke /app/
  WS_SERVER:     "https://app.chatib.chat",
  SOCKET_PATH:   "/socket.io/",

  // ── Browser headers ──────────────────────────────────────────────────────────
  ORIGIN:        "https://app.chatib.chat",
  REFERER:       "https://chatib.chat/",
  USER_AGENT:    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0.0.0 Safari/537.36",

  // ── Data login "anonim" (bebas isi, tidak diverifikasi — tanpa email) ───────
  GENDER_POOL:   ["male", "female"],
  AGE_MIN:       21,
  AGE_MAX:       40,
  COUNTRY:       "US",

  // ── Pesan yang dikirim bot ──────────────────────────────────────────────────
  MESSAGE_GREET:   "Hi, nice to meet you.",
  MESSAGE_GOODBYE: "Have a nice day.",

  // ── Timing (ms) ────────────────────────────────────────────────────────────
  DELAY_SEND_MS:    600,    // jeda sebelum kirim sapa setelah target dipilih
  DELAY_GOODBYE_MS: 500,    // jeda sebelum kirim pamit setelah dapat balasan
  DELAY_END_MS:     1200,   // jeda setelah kirim pamit sebelum end chat
  WAIT_USERS_MS:    20000,  // timeout tunggu ada user lain online (existing_users/new_user)
  WAIT_REPLY_MS:    30000,  // timeout tunggu balasan dari target
  LOOP_DELAY_MS:    1500,   // jeda antar sesi

  // ── Socket.io options ──────────────────────────────────────────────────────
  SOCKET_TIMEOUT_MS:   20000,
  SEND_TIMEOUT_MS:     5000,
  REQUEST_TIMEOUT_MS:  12000,
};
