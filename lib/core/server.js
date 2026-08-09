/**
 * lib/core/server.js
 * Express web server shared by all platforms.
 *
 * Mounts:
 *   GET /         → public/monitor.html
 *   GET /health   → {"status":"ok", ...} — for cronjob keep-alive
 *   GET /api/stats → full JSON stats
 */

"use strict";

const express  = require("express");
const http     = require("http");
const path     = require("path");
const { stats } = require("./stats");
const { log }    = require("./logger");
const REGISTRY   = require("./platforms-registry");

const PORT       = process.env.PORT ? parseInt(process.env.PORT) : 5000;
const PUBLIC_DIR = path.join(__dirname, "../../public");
const PROXY_TIMEOUT_MS = 2500;

/**
 * Ambil JSON dari http://127.0.0.1:<port><path> dengan timeout,
 * dipakai untuk mengintip proses bot platform lain di container yang sama.
 */
async function fetchLocal(port, urlPath) {
  // Do not use fetch() here: undici follows the browser forbidden-port list
  // and rejects port 6000 as "bad port", even though the local bot is healthy.
  return await new Promise((resolve, reject) => {
    const req = http.get({
      hostname: "127.0.0.1",
      port,
      path: urlPath,
      headers: { Accept: "application/json" },
    }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error("Invalid JSON response"));
        }
      });
    });

    req.setTimeout(PROXY_TIMEOUT_MS, () => {
      req.destroy(new Error("Local request timeout"));
    });
    req.on("error", reject);
  });
}

function startServer(platformName) {
  if (platformName) stats.platform = platformName;
  const app = express();

  app.use(express.static(PUBLIC_DIR));

  app.get("/health", async (_req, res) => {
    const results = await Promise.all(
      REGISTRY.map(async (entry) => {
        try {
          const data = await fetchLocal(entry.port, "/api/stats");
          return {
            key:      entry.key,
            name:     entry.name,
            port:     entry.port,
            online:   true,
            uptime:   Math.floor((Date.now() - data.startTime) / 1000),
            sessions: data.totalSessions,
            matches:  data.totalMatches,
            replies:  data.totalReplies,
            errors:   data.totalErrors,
            status:   data.status,
          };
        } catch {
          return { key: entry.key, name: entry.name, port: entry.port, online: false };
        }
      })
    );
    const allOnline = results.every((p) => p.online);
    res.status(allOnline ? 200 : 207).json({
      status:    allOnline ? "ok" : "partial",
      platforms: results,
    });
  });

  app.get("/api/stats", (_req, res) => {
    res.json({
      ...stats,
      uptimeSeconds: Math.floor((Date.now() - stats.startTime) / 1000),
    });
  });

  // Gabungan stats semua platform yang terdaftar di platforms-registry.js —
  // dipakai dashboard supaya satu halaman bisa menampilkan semua bot
  // sekaligus, terlepas dari port mana yang sedang dibuka user.
  app.get("/api/stats/all", async (_req, res) => {
    const results = await Promise.all(
      REGISTRY.map(async (entry) => {
        try {
          const data = await fetchLocal(entry.port, "/api/stats");
          return { key: entry.key, name: entry.name, port: entry.port, online: true, stats: data };
        } catch (err) {
          return { key: entry.key, name: entry.name, port: entry.port, online: false, error: err.message };
        }
      })
    );
    res.json({ platforms: results });
  });

  // Proxy health-check per platform lewat satu URL yang stabil, supaya
  // cronjob/UptimeRobot tidak perlu tahu port internal tiap bot.
  app.get("/proxy/:key/health", async (req, res) => {
    const entry = REGISTRY.find((p) => p.key === req.params.key);
    if (!entry) return res.status(404).json({ status: "unknown_platform" });
    try {
      const data = await fetchLocal(entry.port, "/health");
      res.json(data);
    } catch (err) {
      res.status(502).json({ status: "offline", error: err.message });
    }
  });

  app.get("/", (_req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "monitor.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    log("SUCCESS", `Web server → http://0.0.0.0:${PORT}`);
    log("SUCCESS", `Health     → http://0.0.0.0:${PORT}/health`);
    log("SUCCESS", `Stats      → http://0.0.0.0:${PORT}/api/stats`);
  });
}

module.exports = { startServer };
