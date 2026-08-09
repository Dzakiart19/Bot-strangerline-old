/**
 * lib/core/platforms-registry.js
 * Daftar semua platform bot yang berjalan di project ini.
 *
 * Dashboard monitor (public/monitor.html) membaca daftar ini lewat
 * GET /api/stats/all untuk menampilkan SEMUA platform sekaligus,
 * apa pun port yang sedang dibuka user di preview.
 *
 * Untuk menambah platform baru: cukup tambah satu baris di sini —
 * tidak perlu ubah kode dashboard lagi.
 */

"use strict";

module.exports = [
  { key: "strangerline", name: "StrangerLine Bot", port: 5000 },
  { key: "opentalk",     name: "OpenTalk Bot",     port: 8000 },
  { key: "yapping",      name: "Yapping Bot",      port: 3002 },
];
