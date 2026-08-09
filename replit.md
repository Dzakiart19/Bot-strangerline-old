# Multi-Platform Chat Bot

A Node.js project that runs automated bots across 6 random-chat platforms simultaneously.

## Stack
- **Runtime:** Node.js
- **Dependencies:** express, node-fetch, socket.io-client, uuid, ws

## Bots & Ports

| Bot | Platform | Port | Run Command |
|-----|----------|------|-------------|
| StrangerLine | strangerline.io | 5000 | `node bot/strangerline-bot.js` |
| OpenTalk | opentalk.club | 8000 | `PORT=8000 node bot/opentalk-bot.js` |
| Yapping | yapping.me | 3002 | `PORT=3002 node bot/yapping-bot.js` |
| SillyChat | silly.chat | 3001 | `PORT=3001 node bot/silly-bot.js` |
| Chatib | app.chatib.chat | 3003 | `PORT=3003 node bot/chatib-bot.js` |
| Y99 | y99.chat | 6000 | `PORT=6000 node bot/y99-bot.js` |

Each bot exposes:
- `GET /health` — health check
- `GET /api/stats` — session statistics

## Project Structure
```
bot/           # Entry points for each platform
lib/
  core/        # Shared infrastructure (server, logger, stats)
  platforms/   # Per-platform logic (config, guest, session)
public/        # Static assets for dashboard
```

## Running
Each bot runs as a separate workflow. Install dependencies first:
```
npm install
```

Then start workflows from the Replit interface.

## User Preferences
- Keep bots in separate workflows, one per platform.
