/**
 * bot/y99-bot.js
 * Main loop bot untuk Y99.in (y99.in/web/).
 *
 * Setiap sesi:
 *   1. Buat identitas guest acak
 *   2. Connect socket ke wss://api1.y99.in:8443
 *   3. Authenticate sebagai guest
 *   4. Join room 9736 (Australia) — atau room lain dari config.ROOM_IDS
 *   5. Kirim pesan promo setiap SEND_INTERVAL_MS
 *   6. Bila disconnect/error → buat sesi baru setelah RECONNECT_DELAY_MS
 *
 * Jalankan: PORT=3004 node bot/y99-bot.js
 */

"use strict";

const { config, createGuest, runSession } = require("../lib/platforms/y99");
const { stats }      = require("../lib/core/stats");
const { log }        = require("../lib/core/logger");
const { startServer } = require("../lib/core/server");
const { nextDelayMs } = require("../lib/core/retry");

// Inisialisasi stats global
stats.platform  = "y99";
stats.status    = "idle";

// ── Mulai web server stats ──────────────────────────────────────────────────
startServer("Y99 Bot");

// ── Main loop ───────────────────────────────────────────────────────────────
async function mainLoop() {
  let sessionCount = 0;
  // Rotasi room IDs bila ada lebih dari satu
  let roomIndex = 0;

  while (true) {
    sessionCount++;
    let delayAfterSession = config.RECONNECT_DELAY_MS;
    const guest  = createGuest();
    const roomId = config.ROOM_IDS[roomIndex % config.ROOM_IDS.length];
    roomIndex++;

    log("INFO", `[y99] Sesi #${sessionCount} — guest: ${guest.username}, room: ${roomId}`);

    try {
      const reason = await runSession(guest, roomId);
      log("INFO", `[y99] Sesi #${sessionCount} selesai (${reason}). Stats: sent=${stats.totalMsgSent}, replies=${stats.totalReplies}, errors=${stats.totalErrors}`);
      delayAfterSession = nextDelayMs(config.RECONNECT_DELAY_MS, reason);
      if (delayAfterSession > config.RECONNECT_DELAY_MS) {
        log("WARN", `[y99] Retry berikutnya dalam ${Math.ceil(delayAfterSession / 1000)}s`);
      }
    } catch (err) {
      log("ERROR", `[y99] Sesi #${sessionCount} error tak tertangani: ${err.message}`);
      stats.totalErrors++;
      delayAfterSession = nextDelayMs(config.RECONNECT_DELAY_MS, err.message);
      log("WARN", `[y99] Retry berikutnya dalam ${Math.ceil(delayAfterSession / 1000)}s`);
    }

    stats.status = "idle";
    await new Promise((r) => setTimeout(r, delayAfterSession));
  }
}

mainLoop().catch((err) => {
  log("ERROR", `[y99] mainLoop crash: ${err.message}`);
  process.exit(1);
});
