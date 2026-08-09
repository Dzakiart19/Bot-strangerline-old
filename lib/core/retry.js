"use strict";

/**
 * Decide how long the main loop should wait after a session attempt.
 * External platforms may temporarily block or rate-limit a source; retrying
 * every few milliseconds only makes that condition worse.
 */
function nextDelayMs(baseDelay, errorMessage = "") {
  const message = String(errorMessage).toLowerCase();

  if (message.includes("429") || message.includes("rate limit")) {
    return Math.max(baseDelay, 60_000);
  }

  if (
    message.includes("access_blocked") ||
    message.includes("403") ||
    message.includes("banned") ||
    message.includes("blocked")
  ) {
    return Math.max(baseDelay, 120_000);
  }

  if (
    message.includes("timeout") ||
    message.includes("econn") ||
    message.includes("websocket error") ||
    message.includes("connect_error")
  ) {
    return Math.max(baseDelay, 15_000);
  }

  return baseDelay;
}

module.exports = { nextDelayMs };