/**
 * lib/platforms/strangerline/guest.js
 * Membuat guest session anonim di StrangerLine.
 *
 * Endpoint: POST /chat/api/guest/get-or-create
 * Response: { success: true, guest: { guestId, displayName, ... } }
 *
 * Reverse-engineered dari /chat/assets/index-CU_9hME1.js:
 *   - guestId format: "Guest_xxxxxxxx"
 *   - localId: UUID v4 random, disimpan di localStorage di browser
 *   - displayName: nama yang ditampilkan ke partner
 */

"use strict";

const { v4: uuidv4 } = require("uuid");
const cfg = require("./config");

const ADJECTIVES = ["Cool","Smart","Bold","Chill","Quick","Sharp","Slick","Wild","Bright","Fast"];
const NOUNS      = ["Fox","Wolf","Bear","Hawk","Lion","Tiger","Eagle","Shark","Panda","Snake"];

function randomDisplayName() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = Math.floor(Math.random() * 9999);
  return `${adj}${noun}${num}`;
}

/**
 * Buat atau ambil guest session dari server.
 * @returns {{ guestId: string, displayName: string, deviceId: string }}
 */
async function createGuest() {
  const displayName = randomDisplayName();
  const localId     = uuidv4();

  const res = await fetch(`${cfg.API_BASE}/guest/get-or-create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":   cfg.USER_AGENT,
      "Origin":       cfg.ORIGIN,
      "Referer":      cfg.REFERER,
    },
    body: JSON.stringify({ displayName, localId }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} dari /guest/get-or-create`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error("Guest create gagal: " + JSON.stringify(data));
  }

  return {
    guestId:     data.guest.guestId,
    displayName: data.guest.displayName,
    deviceId:    uuidv4(), // device ID unik per sesi
  };
}

module.exports = { createGuest };
