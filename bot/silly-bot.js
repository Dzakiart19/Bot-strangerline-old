/**
 * bot/silly-bot.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Entry point utama — hanya berisi main loop.
 * Semua logika platform ada di lib/platforms/silly/.
 * Semua shared infra ada di lib/core/.
 *
 * Jalankan:
 *   PORT=3001 node bot/silly-bot.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use strict";

const { startServer }                    = require("../lib/core/server");
const { log, sleep, C }                  = require("../lib/core/logger");
const { stats, pushEvent }               = require("../lib/core/stats");
const { nextDelayMs }                    = require("../lib/core/retry");
const { config, createGuest, runSession } = require("../lib/platforms/silly");

// ── Start web server (monitoring + health + api/stats) ────────────────────────
startServer("SillyChat Bot");

// ── Banner ────────────────────────────────────────────────────────────────────
console.log(`${C.bold}${C.magenta}`);
console.log("  ███████╗██╗██╗     ██╗  ██╗   ██╗ ██████╗██╗  ██╗ █████╗ ████████╗");
console.log("  ██╔════╝██║██║     ██║  ╚██╗ ██╔╝██╔════╝██║  ██║██╔══██╗╚══██╔══╝");
console.log("  ███████╗██║██║     ██║   ╚████╔╝ ██║     ███████║███████║   ██║   ");
console.log("  ╚════██║██║██║     ██║    ╚██╔╝  ██║     ██╔══██║██╔══██║   ██║   ");
console.log("  ███████║██║███████╗███████╗██║   ╚██████╗██║  ██║██║  ██║   ██║   ");
console.log("  ╚══════╝╚═╝╚══════╝╚══════╝╚═╝    ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ");
console.log(`${C.reset}${C.cyan}  Platform : silly.chat/text-chat${C.reset}`);
console.log();

// ── Main loop ─────────────────────────────────────────────────────────────────
async function main() {
  while (true) {
    stats.totalSessions++;
    stats.currentSession = stats.totalSessions;
    let delayAfterSession = config.LOOP_DELAY_MS;

    log("INFO", "━".repeat(52));
    log("INFO", `  SESI #${stats.totalSessions}  |  Match: ${stats.totalMatches}  Reply: ${stats.totalReplies}  Error: ${stats.totalErrors}`);
    log("INFO", "━".repeat(52));

    try {
      log("BOT", "Membuat guest baru (token auth)...");
      const guest = await createGuest();
      log("SUCCESS", `Guest: ${guest.displayName}  (${guest.userId})`);
      pushEvent("new_session", `Sesi #${stats.totalSessions} — ${guest.displayName}`);

      const reason = await runSession(guest);
      log("INFO", `Sesi #${stats.totalSessions} selesai → "${reason}"`);
      pushEvent("end_session", `Sesi #${stats.totalSessions} selesai: ${reason}`);

    } catch (err) {
      log("ERROR", `Sesi #${stats.totalSessions} error: ${err.message}`);
      stats.totalErrors++;
      stats.lastErrorAt  = Date.now();
      stats.lastErrorMsg = err.message;
      pushEvent("error", `Sesi #${stats.totalSessions}: ${err.message}`);
      delayAfterSession = nextDelayMs(config.LOOP_DELAY_MS, err.message);
      log("WARN", `Retry berikutnya dalam ${Math.ceil(delayAfterSession / 1000)}s`);
    }

    stats.status = "idle";
    await sleep(delayAfterSession);
  }
}

main().catch((err) => {
  log("ERROR", "FATAL: " + err.message);
  process.exit(1);
});
