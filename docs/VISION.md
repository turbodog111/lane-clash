# RUNTIME — Vision (draft 1)

> Working title. The repo stays `lane-clash` until we pick a final name.
> Status: **proposed**. Anything marked ❓ is an open decision.
> The original prototype is preserved on `archive/v0.1.5-prototype` and `archive/v0.4.1-functionality`.

---

## 1. The pitch

**Everyone knows the world is a simulation.** Nobody knows who's running it.
Disputes aren't settled with wars anymore; they're settled in **Arenas**: sandboxed instances the Sim spins up on request.
Two **Operators** load their **Loadouts** of **Scripts**, spend **Compute** to run them, and fight to crash the other side's **Core**.

When an Arena closes, the Sim discards it, logs the result, and starts another **Iteration**.

It's real-time lane combat in the same genre as Clash Royale, built on three pillars:

1. **Skill over stats.** Every Script has the same stats for every player, forever. No levels, no upgrades, no pay-to-win.
2. **Iterate, don't grind.** You progress by playing *runs* (see §5), not by repeating matches for currency. There is no money anywhere in the game.
3. **The simulation is the gimmick.** The best cards don't just hit things. They *edit the simulation*: rewind it, pause it, fork it, patch it.

---

## 2. Vocabulary (rebrand map)

| Old (prototype) | New | Notes |
|---|---|---|
| Elixir | **Compute** | 10-cell bar, +1 per 2.8s; doubles during Overclock |
| Card | **Script** | "Run a script" = deploy |
| Deck | **Loadout** | 8 Scripts |
| Troop / unit | **Construct** | Anything with HP that walks |
| Spell | **Command** | Instant effects that edit the sim |
| King Tower | **Core** | Lose it, lose the match |
| Crossbow tower | **Sentry** | Keeps the crossbow DNA: long-range bolt turret |
| River | **the Seam** | The boundary between two memory allocations |
| Bridges | **Links** | The only way across the Seam |
| Player | **Operator** | |
| Death | **Deallocated** | Constructs dissolve into pixels |
| Overtime | **Overclock** | Final minute: 2× Compute |
| Encyclopedia | **Codex** | Generated from game data, never typed by hand |
| Update Log | **Patch Notes** | Doubles as in-world lore |

---

## 3. Factions: the old units, reimagined

The prototype mixed knights, robots and skeletons. Instead of hiding that, the lore *explains* it:
the Sim has run many iterations, and leftover assets from old ones still exist.

### Legacy: *assets from earlier iterations*
Medieval-looking because they **are** old: rendered at low resolution in chunky pixels. Cheap, reliable, honest.
- **Warden** (2): melee bruiser. *(was Knight)*
- **Longshots** (2): pair of ranged units. *(was Archers)*
- ideas: Shieldwall (tank), Bannerman (aura buff)

### Mainline: *the current build*
Clean vector machines with a glowing visor. Expensive, powerful, and they can **Compile** (see §4).
- **Mini-MEGA** (3): slow, hard-hitting bot. *(kept: it's an original name)*
- **MEGA** (5): heavy war machine. Also reachable by compiling two Mini-MEGAs.
- ideas: Drone Swarm, Railgun turret (building)

### Null: *corrupted and deleted data that refuses to stay gone*
Jittering, RGB-split, glitchy. Swarms and disruption.
- **Zombie Processes** (4): swarm of 8 weak Constructs that **corrupt machines** (bonus damage to Mainline). *(was Skeleton Army; keeps your original "counters MEGA" idea, now as a rule instead of a special case)*
- ideas: Memory Leak (slowly drains a Sentry), Phantom (invisible until it attacks)

### Commands: *direct edits to the simulation* (faction-neutral)
| Command | Cost | Effect |
|---|---|---|
| **Breakpoint** | 2 | Freezes everything in a circle for 2s, both sides |
| **Purge** | 3 | Area damage |
| **Overclock** | 3 | Friendly Constructs in an area gain +40% speed and attack speed for 5s |
| **Rollback** | 4 | Everything in a circle snaps back to its state 3s ago: HP, position, even the dead |
| **Fork** | 5 | Duplicates one friendly Construct at 50% HP |

Rollback and Fork are the signature cards. No other game in the genre can do them cleanly, but a deterministic sim (§8) makes them cheap to build.

---

## 4. Signature mechanics (what makes it *not* Clash Royale)

1. **Commands that edit the sim**: Rollback, Fork, Breakpoint (above).
2. **Compile.** Two of the same Mainline Construct meeting in the same lane merge into their upgraded form (2× Mini-MEGA → MEGA). Spending 6 Compute on a 5-Compute unit sounds bad, until you realize the enemy has to kill *both* Mini-MEGAs before they meet.
3. **Hotfixes.** At 2:00 the Sim announces a patch with 10s warning, and it applies to both sides. Examples: "Links widened", "Left lane: Constructs +20% speed", "Commands cost 1 less", "the Seam is frozen: walk anywhere". Every match plays out a little differently, and the Patch Notes voice gets to be funny.
4. **Lanes are threads.** Two lanes, two Links each, the Seam in the middle. Lane discipline from the original v0.1 is back: Constructs commit to a lane and only fight what's in it, so *which lane you play in* is the core decision.
5. **Render fidelity is the art style.** Each faction is drawn in a different "rendering mode" (pixel / vector / glitch), so you can read a crowded fight at a glance.

---

## 5. Modes & progression ("iterative free-to-play")

**No currency. No card levels. No energy timers. No loot boxes.** Nothing is for sale.

### Iterations (main single-player mode, roguelite)
A **run** is a chain of ~8 Arenas against AI Operators, ending with a boss Operator.
- Start with a small 6-Script Loadout.
- After each win, pick 1 of 3 rewards: a new Script, or a **Patch**: a run-only modifier like "Wardens gain +1 range" or "Rollback costs 3".
- Lose and the run ends. The world resets; the Sim starts a new Iteration.
- **What carries over between runs:** Scripts you've *discovered* (unlocked for every mode), Codex lore entries, cosmetics. **Never raw power.**

This is the "iterative" loop: every run is short (~25 min), different, and teaches you something.

### Skirmish
Any Loadout vs. an AI Operator you choose (personality + difficulty). Everything you've discovered is available.

### Daily Seed
Same seed, same Hotfixes, same pre-built Loadout for everyone that day. Pure skill puzzle. Shareable result string, Wordle-style.

### Versus (later)
Real-time PvP. Everything unlocked, all stats equal.

### Unlock pacing
The whole roster should be discoverable within ~10–15 hours of Iterations. After that, progression means mastery: per-Script challenges, cosmetic render modes (wireframe, CRT, monochrome), and Codex lore.

---

## 6. AI Operators

Difficulty comes from **how the AI plays**, never from stat boosts.
- Reads lanes: defends where it's being pushed, attacks where you're weak.
- Manages Compute: saves up for combos, punishes overspending.
- Counter-plays: Purge into swarms, Zombie Processes into MEGAs.
- **Personalities** (each a named character with a Loadout and a voice):
  - *Rusher*: cheap pressure
  - *Turtle*: defend, then counter-push
  - *Splitter*: hits both lanes at once
  - *Glitch*: Null faction, chaos
  - *the Admin*: final boss, plays Commands

A headless sim runs thousands of AI-vs-AI matches to report win rates per Script, so we balance with data instead of guessing.

---

## 7. Look & feel

- **Arena:** dark void with a faint grid, a glowing Seam, Links drawn as light-bridges. The prototype's navy palette carries over.
- **Sides:** cyan (you) vs. magenta (opponent).
- **All art procedural** (drawn in code). That gives one consistent style, no generated-art mismatch, and no resemblance to any other game's card frames.
- **Feedback:** hit flashes, pixel-dissolve on death, screen shake on Core hits, a CRT-style "glitch" when a Command fires.
- **Sound:** synthesized with WebAudio (chiptune-adjacent blips and bass hits). Tiny, consistent, no asset files.
- **Platform:** phone-first portrait layout that also plays well with a mouse.

---

## 8. Technical foundation

| Decision | Choice | Why |
|---|---|---|
| Language | TypeScript | The codebase will grow; types catch balance-data mistakes |
| Build | Vite | Instant dev server, static output |
| Rendering | Canvas 2D (PixiJS only if needed) | Procedural art doesn't need a heavy engine |
| Simulation | **Deterministic**, fixed 30 ticks/s, seeded RNG, no `Math.random` in sim code | Needed for Rollback, replays, Daily Seed, headless balancing, and future PvP |
| Sim isolation | `sim/` has zero DOM imports; runs in the browser, Node, or a Worker | Headless AI-vs-AI testing |
| Content | All Scripts, Hotfixes and Operators defined in data files | The Codex is generated, so it can never drift |
| Persistence | `localStorage` (discoveries, settings) | No accounts, no server |
| Tests | Vitest on the sim | |
| Hosting | GitHub Pages via Actions, installable as a PWA | Free, playable on a phone from a link |

---

## 9. Roadmap

| Phase | Goal | Done when |
|---|---|---|
| **0. Vision** | This doc | Open questions answered |
| **1. Foundation** | New TS project; deterministic sim; Arena render; Warden, Longshots, Mini-MEGA, MEGA, Zombie Processes, Purge; basic AI; one full match | Playable on GitHub Pages from a phone |
| **2. Identity** | Breakpoint, Rollback, Fork, Overclock; Compile; Hotfixes; art and sound pass; Codex | It feels like *its own game* |
| **3. Iterations** | Roguelite runs, Patches, discovery unlocks, boss Operator | A run is fun to replay |
| **4. Depth** | AI personalities, balance harness, Daily Seed, more Scripts per faction | |
| **5. Versus** | PvP | |

---

## 10. Open questions ❓

1. **Title.** Candidates: *RUNTIME*, *ITERATION*, *FORKED*, *OVERCLOCK*, or keep *Lane Clash*.
2. **What "iterative" means to you.** Roguelite runs (§5)? A game that ships frequent patches? Both?
3. **Tone.** Mysterious and serious (who runs the Sim?), or dry and funny (sarcastic Patch Notes, Operators who know they're NPCs)?
4. **Factions.** Is Legacy / Mainline / Null the right trio? Should every Loadout mix factions freely, or should factions matter?
5. **Art.** Fully procedural as proposed, or do you want drawn/generated character art in a *new* style?
6. **Hand size.** Prototype: 2. Genre standard: 4. Proposal: **3 in hand + next-up preview**, from a Loadout of 8.
7. **Platform priority.** Phone-first portrait, or desktop-first?
