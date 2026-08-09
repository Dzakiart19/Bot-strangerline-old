/**
 * lib/platforms/silly/guest.js
 * Membuat sesi guest di SillyChat.
 *
 * Flow:
 *   POST /api/auth/guest-token → { token, userId }
 *   Token (JWT exp ~5 menit) dipakai sebagai query param saat konek WS:
 *   wss://silly.chat/ws?token=<token>
 */

"use strict";

const cfg = require("./config");

async function createGuest() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${cfg.BASE_URL}${cfg.TOKEN_API_PATH}`, {
      method:  "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Origin":       cfg.ORIGIN,
        "Referer":      cfg.REFERER,
        "User-Agent":   cfg.USER_AGENT,
      },
      body: JSON.stringify({}),
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`REQUEST_TIMEOUT: SillyChat tidak merespons dalam ${cfg.REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limited (429) — tunggu sebentar");
    if (res.status === 403) throw new Error("ACCESS_BLOCKED: SillyChat menolak guest-token dari lingkungan ini (HTTP 403)");
    throw new Error(`HTTP ${res.status} dari ${cfg.TOKEN_API_PATH}`);
  }

  const data = await res.json();
  if (!data.token) throw new Error("token tidak ada di response guest-token");

  return {
    token:       data.token,
    userId:      data.userId,
    displayName: `guest_${data.userId?.slice(0, 8) || "unknown"}`,
  };
}

module.exports = { createGuest };
