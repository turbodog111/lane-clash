# Multiplayer: free options (research, 2026-11-09)

Nothing here is built yet. This compares ways to add multiplayer at no cost, and recommends an order.

## First: where friends would play
- **The Claude artifact link** works only for people signed in to claude.ai whom you've shared it with.
- **For classmates without accounts:** host the same files on **GitHub Pages**. It's free for a public repository. The game has no build step, so turning Pages on is the only setup.

## What kind of multiplayer
| Mode | What it is | Needs |
|---|---|---|
| **Challenge seed** | You finish a run and share a code. A friend plays the *same* floors, enemies and questions. Compare depth. | Nothing (async) |
| **Daily descent** | Everyone gets the same run each day (Krillion's daily ritual). Share a result line. | Nothing (async); a leaderboard needs storage |
| **Duel** | Two players face the same question live. Each answer hits the other player, and an answer your opponent already gave is *taken*. Rarity is the weapon. | Live connection |
| **Class race** | A teacher opens a room. Everyone gets the same class-mode drills, with a live leaderboard on the board. | Live connection + host view |
| **Co-op descent** | 2–4 players fight one enemy with a shared answer pool, so nobody can repeat a teammate's answer. | Live connection |

## Free technical options
| Option | Cost / limits | Good | Bad |
|---|---|---|---|
| **Seeded runs (no network)** | Free forever | Works everywhere, even offline and from `file://`. Tiny build. | Not live |
| **Artifact `room` + `db` (inside Claude)** | Free | Already available to this artifact: live events, presence, shared leaderboard. No setup. | Only for signed-in claude.ai users you share with |
| **[Trystero](https://github.com/dmotz/trystero) on GitHub Pages** (peer-to-peer WebRTC, matched through public Nostr/MQTT/BitTorrent networks) | Free; no server and no account | Rooms, broadcast, small code | School networks can block WebRTC or the relays. No persistent leaderboard. Easy to cheat (fine among friends). |
| **[Firebase Realtime Database](https://firebase.google.com/docs/database/usage/limits) (Spark plan)** | Free; 100 simultaneous connections | Reliable live sync and leaderboards. Works through most school firewalls (plain HTTPS/WebSocket). | Needs a Google project. Public config, so security rules must be written carefully. |
| **[Supabase](https://supabase.com/docs/guides/realtime/limits) free tier** | Free; 200 concurrent realtime connections | Live channels plus a Postgres leaderboard | [Pauses after 7 days of low activity](https://supabase.com/docs/guides/platform/free-project-pausing) |
| **[Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing) (Workers Free)** | Free plan includes SQLite-backed Durable Objects | A real game server: it can check answers, which stops cheating. WebSockets with hibernation. | The most code to write and deploy |

## Recommendation
1. **Build now:**
   - challenge seeds;
   - the daily descent;
   - a shareable result line, e.g. `Rara Avis · Daily 2026-11-09 · Gradus XII · 3 rarissimus`.

   It needs no infrastructure, works for everyone, and is the foundation for everything else: live modes need both players to see the same questions, which is exactly what seeding provides.
2. **Then live play:**
   - **Duels and class races:** Trystero on GitHub Pages, with zero accounts and zero cost.
   - **If a school network blocks it:** switch the transport to Firebase Spark. Trystero can also use Firebase or Supabase for matchmaking, so the switch is mostly a configuration change.
3. **Only if cheating or scale matters:** a Cloudflare Durable Object as an authoritative server.
