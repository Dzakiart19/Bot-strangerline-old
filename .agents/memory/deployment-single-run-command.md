---
name: Deployment run command for multi-bot project
description: Why this project needs a launcher script instead of running one bot directly in deployment.
---

Replit deployment (`[deployment]` in .replit) executes exactly ONE run command in production —
unlike dev, where the "Project" workflow runs all bot workflows in parallel. Pointing deployment's
`run` at a single bot script (e.g. `node bot/strangerline-bot.js`) means only that one bot goes live
after publish, even though all 4 run fine in dev.

**Why:** dev workflows and production deployment are configured independently; workflows never
carry over to the deployment run command.

**How to apply:** use a launcher (`bot/start-all.js`) that reads `lib/core/platforms-registry.js`
and spawns every bot as a child process with its own PORT, then point `[deployment].run` at the
launcher. The launcher infers each script path by convention (`bot/<key>-bot.js`) instead of a
hardcoded map, so adding a platform only needs a new `platforms-registry.js` entry + matching file
— no launcher edit.

`vm` is the technically-ideal target for always-running background loops with in-memory state, but
this project intentionally stays on `autoscale` because the user is on the free tier (no `vm`
access) and pings `/health` via an external cronjob to keep the instance warm. Known tradeoff:
autoscale can still scale to zero between cron pings (a brief cold start) and, under real
concurrent traffic, could spin up a second instance running its own independent copy of all 4 bots
(doubled activity, stats split per instance) — acceptable here since traffic is just the cron hit.
