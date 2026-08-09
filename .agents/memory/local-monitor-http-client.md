---
name: Local monitor HTTP client
description: Proxy stats antarbot harus menghindari Node fetch untuk port tertentu di environment Replit.
---

Proxy dashboard antarproses menggunakan HTTP client native Node, bukan `fetch()`/undici, karena undici menerapkan forbidden-port list dan menolak port internal 6000 sebagai “bad port”.

**Why:** Y99 benar-benar listen dan bisa diakses curl/HTTP native, tetapi `fetch("http://127.0.0.1:6000")` gagal sehingga dashboard salah menampilkan Y99 offline.

**How to apply:** Saat agregator memanggil service lokal pada port non-standar, gunakan `node:http` dengan timeout dan parsing JSON; verifikasi endpoint gabungan setelah restart semua proses.