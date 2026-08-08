/**
 * lib/platforms/y99/guest.js
 * Buat identitas guest acak untuk Y99.
 *
 * Y99 tidak butuh HTTP login — autentikasi dilakukan langsung lewat socket
 * dengan event "authenticate" + {username, isGuest: true}. Fungsi ini
 * hanya menghasilkan data identitas acak yang dikirim ke socket.
 */

"use strict";

const { v4: uuidv4 } = require("uuid");
const cfg = require("./config");

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomUsername() {
  const adj  = pick(cfg.ADJECTIVES);
  const noun = pick(cfg.NOUNS);
  const num  = Math.floor(Math.random() * 9999);
  return `${adj}${noun}${num}`;
}

/**
 * Buat identitas guest baru.
 * @returns {{ username: string, gender: string, age: number, deviceId: string }}
 */
function createGuest() {
  return {
    username: randomUsername(),
    gender:   pick(cfg.GENDER_POOL),
    age:      cfg.AGE_MIN + Math.floor(Math.random() * (cfg.AGE_MAX - cfg.AGE_MIN + 1)),
    deviceId: uuidv4(),
  };
}

module.exports = { createGuest };
