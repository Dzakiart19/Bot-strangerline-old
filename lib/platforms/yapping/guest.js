/**
 * lib/platforms/yapping/guest.js
 * Membuat sesi guest di Yapping.
 *
 * Flow (reverse-engineered dari yapping.me/chat):
 *   1. GET /chat  → server otomatis set cookie: device_token, token (JWT),
 *      userd (JWT). Username sudah ada di JWT — tidak perlu registrasi.
 *   2. POST /api/user/gender { gender } → wajib, atau join_match_queue
 *      ditolak dengan error GENDER_REQUIRED. Response set cookie baru
 *      (token & userd) dengan field gender terisi — cookie ini yang harus
 *      dipakai untuk koneksi socket.io berikutnya.
 */

"use strict";

const cfg = require("./config");

/** Decode payload JWT tanpa verifikasi signature (kita hanya butuh baca field). */
function decodeJwtPayload(jwt) {
  const part = jwt.split(".")[1];
  const padded = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(part.length + ((4 - (part.length % 4)) % 4), "=");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

/** Gabungkan Set-Cookie[] jadi satu Cookie header, override nama yang sama. */
function mergeCookies(jar, setCookieHeaders) {
  for (const raw of setCookieHeaders || []) {
    const pair = raw.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

function cookieHeaderFrom(jar) {
  return Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
}

async function createGuest() {
  const jar = new Map();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.REQUEST_TIMEOUT_MS);

  try {
    // ── 1. Ambil cookie sesi awal (device_token, token, userd) ───────────────
    const pageRes = await fetch(`${cfg.BASE_URL}${cfg.CHAT_PAGE_PATH}`, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": cfg.USER_AGENT,
        "Referer": cfg.REFERER,
      },
    });
    mergeCookies(jar, pageRes.headers.getSetCookie());

    if (pageRes.status >= 300 && pageRes.status < 400) {
      const location = pageRes.headers.get("location") || "";
      if (location.includes("/banned")) {
        throw new Error(`ACCESS_BLOCKED: Yapping mengarahkan sesi ke ${location}`);
      }
      throw new Error(`HTTP ${pageRes.status} redirect saat GET ${cfg.CHAT_PAGE_PATH}`);
    }
    if (!pageRes.ok) {
      throw new Error(`HTTP ${pageRes.status} saat GET ${cfg.CHAT_PAGE_PATH}`);
    }

    const tokenCookie = jar.get("token");
    if (!tokenCookie) {
      throw new Error("ACCESS_BLOCKED: cookie 'token' tidak diberikan oleh Yapping");
    }
    const payload = decodeJwtPayload(tokenCookie);
    const username = payload.username;
    if (!username) {
      throw new Error("Response Yapping tidak berisi username");
    }

    // ── 2. Set gender (wajib sebelum join_match_queue) ──────────────────────
    const genderRes = await fetch(`${cfg.BASE_URL}${cfg.GENDER_API_PATH}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "User-Agent":   cfg.USER_AGENT,
        "Origin":       cfg.ORIGIN,
        "Referer":      cfg.REFERER,
        "Cookie":       cookieHeaderFrom(jar),
      },
      body: JSON.stringify({ gender: cfg.MY_GENDER }),
    });
    if (!genderRes.ok) {
      const errBody = await genderRes.json().catch(() => ({}));
      throw new Error(`HTTP ${genderRes.status} dari ${cfg.GENDER_API_PATH}: ${errBody.error || genderRes.statusText}`);
    }
    mergeCookies(jar, genderRes.headers.getSetCookie());

    return {
      username,
      cookieHeader: cookieHeaderFrom(jar),
      createdAt: Date.now(),
      displayName: username,
    };
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`REQUEST_TIMEOUT: Yapping tidak merespons dalam ${cfg.REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { createGuest };
