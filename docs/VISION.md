# Vision (draft 3): new direction

> **Title: TBD.** Status: **ideas captured, nothing built yet.**
> - Draft 2 (lane combat inspired by Clash Royale) is retired. It's still in git history at commit `30fb3f4`.
> - The original prototype lives on `archive/v0.1.5-prototype` and `archive/v0.4.1-functionality`.

---

## 0. Prototype 1: *Rara Avis* (built 2026-11-07)

The first playable slice of §3, focused on **Latin + Krillion's spirit**. Krillion's core joy is kept (open prompts, rarer valid answers score more), but the structure is our own:

| | Krillion | Rara Avis |
|---|---|---|
| Format | 7 daily prompts, one answer each | Endless descent; each enemy holds a question, and you fire answers at it until it falls |
| Pressure | Per-prompt timer | The enemy **bites** on a timer; wrong answers and repeats hurry it |
| Content | General trivia | Latin only: vocabulary, grammar, derivatives, gods, emperors, the *Aeneid*, the Roman world (36 questions, ~2,400 answers) |
| Rarity | From players' answer frequency | Hand-tiered, plus **worn words**: answers you lean on across descents lose a tier |
| Variety | New prompts daily | Enemy **rules** (Harpy, Sphinx, Echo, Gorgon, Tantalus), guardians, gifts of the gods, rules mixing deeper down |
| Theme | Ocean depth | *Aeneid* VI: the Sibyl of Cumae guides you down to Avernus; she remembers you between descents (the DDLC thread) |

What's still open from §8: tone, the Host's identity (currently the Sibyl), answer checking beyond curated lists, title. *Rara avis* is Juvenal's "rare bird" (a black swan, which is also the top rarity tier). It's a working title only.

### Prototype 1.1 (same day): class mode and graphics
- **Schola (class mode).** Built from turbodog111's handouts: case uses, declension endings, adjectives, adverbs. It adds **drills** (one exact answer per item) next to open questions, with topic selection and a separate record. The remaining handouts, vocabulary sets and passages still need to be added (24 files total; 5 received so far).
- **Underworld zones** that change with depth: Vestibulum → Styx → Tartarus → Elysium → Ultra (beyond the map).
- **Effects:** answers fly at the enemy as glowing text; *Rara Avis* answers summon Juvenal's black swan; enemies shatter into terracotta shards; title cards for bosses and new zones; a Sibyl scene on the title screen.
- **UI clarity:** every Latin label carries its English in parentheses, e.g. Gradus (floor), Anima (health), Folia (hints), Munera deorum (gifts of the gods).

### Prototype 1.2 (2026-11-08): easier start, answer review
- **Difficulty:** turbodog111 reached only Gradus V. The simulation bots were too optimistic (they knew every common answer instantly), so `tools/check.js` now also simulates *human* players with per-word knowledge, thinking time and mistakes. Retuned:
  - enemies have less life (48 base, slower growth)
  - enemies bite more slowly at first (every 22s, tightening to 7s)
  - bites hurt less (6 damage at first)
  - more healing between floors (15)
  - Cerberus's heads each bite softer
  - the first guardian is weaker

  A simulated student now usually gets past floor 5 (median floor 10).
- **Tabularium (answer review):** turbodog111 reviews tiers, spellings and answers in the game itself, and every rejected guess is logged for review. Edits apply immediately as an overlay. Claude bakes them into the data with `tools/apply-review.js` and marks them applied.

### Prototype 1.3 (2026-11-09): six tiers, pyramid rarity
- **Answer review with turbodog111:**
  - Six tiers, with **Arcanus (obscure)** added below Rara Avis.
  - Every question is reshaped into a pyramid (about 28 / 26 / 20 / 14 / 8 / 4%).
  - Rara Avis answers are hand-picked and capped: 6 per question at most, and 1 for small questions. That cut 307 Rara Avis answers to about 100.
- **Rules agreed:**
  - Plurals count (*canes* = *canis*).
  - Female forms count as the male answer (*lupa* = *lupus*).
  - Adjectives accept every gender (*alba* = *albus*).
  - Answers you can guess from English (*hippopotamus*) are never top-tier.
- **Rebalanced** for the flatter damage the pyramid gives: enemy base life is now 36, and the first guardian is weaker.

### Prototype 1.4 (2026-11-09): class mode is just a content filter
- turbodog111 found class mode too educational. It now plays exactly like the main game; only the questions differ, and they're limited to the handouts.
- **Removed:** gentler enemies, second tries, mastery tracking, mistake review and untimed practice.
- **Stats** (deepest descent, rarest answer, words found) now count in every mode.
- Multiplayer is shelved. The research is kept in `docs/MULTIPLAYER.md`.

---

## 1. Executive decisions (turbodog111, 2026-11-07)

1. **Drop all Clash Royale inspiration.** No lanes, elixir, towers, troop cards or deploy-a-unit combat.
2. **Entirely skill-based.** No stat progression, no grinding, no currency, no money. You get better; your account doesn't.
3. **A roguelike.** Runs, permadeath, a different run every time.
4. **No end, and it keeps surprising.** Endless depth; the game should still be doing new things after many hours.

---

## 2. Idea log (raw, so nothing is lost)

| Idea | Where it came from | Notes |
|---|---|---|
| **The world is a simulation** that knows it's a simulation | Draft 1 | Still fits; arguably fits better now |
| **A game that knows it's a game** | *Doki Doki Literature Club* | DDLC is what started turbodog111's AI journey: building a Monika, writing their own story, and later naming their Christian AI project after one of its characters. What to take: a character aware of the player, the game changing itself between plays, the fourth wall as a mechanic. **Use an original character and story, not DDLC's.** |
| **Krillion-style prompts** | [krillion.io](https://krillion.io) | Daily browser trivia: open-ended prompts ("name a …"), a short timer, and **rarer valid answers score more**. Points become *depth* in meters. |
| **Category-only prompts** | turbodog111's Latin teacher | A Krillion-like game where every prompt is from one category you pick (Latin, Bible, science…). |
| Code-drawn art | Draft 2 | Still the plan |
| Patch Notes as lore, a Codex, a Daily Seed | Drafts 1–2 | Still fit |
| Rollback / Breakpoint / Fork / Ping | Draft 2 Commands | Reusable as **limited-use powers** (§4) |

---

## 3. The combined concept (proposal)

> **A typing roguelike of rare answers.** A self-aware simulation tests you with prompts. Every answer is an attack, and the rarer it is, the harder it hits. Descend forever; the deeper you go, the stranger the rules get, and the thing running the simulation starts paying attention to *you*.

How each idea fits in:
- **Krillion** gives the core action: prompt → type an answer → rarity decides the power.
- **The Latin teacher's idea** gives **category runs**: pick a category before a run, and deep knowledge of that category is your skill.
- **The roguelike** gives runs, escalating danger, run-only rule modifiers and powers, and permadeath.
- **DDLC** gives the surprise engine: the Host, a self-aware character who remembers your runs and starts rewriting the game.
- **Endless** gives depth: there's no final floor, only your record.

### Why it's entirely skill-based
Knowledge breadth, recall speed, and risk decisions (which Mods to take, when to use a power, whether to gamble on a rare answer). Nothing carries over between runs except **what you've learned** and the story you've uncovered.

---

## 4. How a run plays

### The core moment (≈10–20 seconds)
1. A **prompt** appears: *"Name a Roman emperor."*
2. A **timer** runs. You type an answer.
3. The answer is checked:
   - **invalid**, or
   - **valid** with a **rarity tier**: Common → Uncommon → Rare → Ultra-rare → One-in-a-million.
4. Rarity sets **damage**: *Augustus* barely scratches the enemy; *Pertinax* hits like a truck.
5. You can't repeat an answer within a run.

### Combat is answering
Each **layer** has an **enemy**: a corrupted process with HP and an attack timer (that's your time pressure). Answers damage it. When its timer fires, you lose Integrity.

The variety comes from **enemy rules**:

| Enemy | Rule |
|---|---|
| **Echo** | Immune to any answer you've used in a past run |
| **Purist** | Only Rare or better answers hurt it |
| **Leech** | Heals when you give a Common answer |
| **Sorter** | Your answers must go in alphabetical order |
| **Mimic** | Copies your last answer, so you can't reuse its first letter |
| **Swarm** | Five tiny enemies, five prompts at once, one shared timer |

### Integrity (health)
- Wrong answers, blanks and enemy attacks cost **Integrity**.
- Ultra-rare answers restore a little.
- Integrity reaches 0 → run over. Your **depth** is your score.

### Between layers: pick 1 of 3 **Mods** (run-only rules)
| Mod | Effect |
|---|---|
| **Alliteration** | ×2 if your answer starts with the same letter as your last one |
| **Chain** | Each answer must start with the last letter of the previous one; ×3 damage |
| **Speed Demon** | Answers within 4s deal ×1.5, but timers are 20% shorter |
| **Polyglot** | Latin answers count double *(a nod to the Latin teacher)* |
| **Wager** | Before answering, call your rarity tier; hit it for ×3, miss it and take damage |
| **Minimalist** | Answers of 5 letters or fewer deal ×2 |

### Powers (limited uses per run)
Repurposed from draft 2's Commands:
- **Rollback:** retry a prompt you missed
- **Breakpoint:** freeze the timer for 5s
- **Fork:** submit two answers and keep the better one
- **Ping:** reveal how many valid answers exist, or the first letter of a rare one

### Glitches (the surprise layer, more common the deeper you go)
- **Display glitches:** vowels vanish from the prompt; the prompt shows up scrambled or backwards.
- **Timer and input glitches:** the timer runs in a different direction; your keyboard swaps two letters.
- **Rule glitches:** the category switches mid-layer; the Host lies about one prompt, and you have to notice.

### Bosses every 10 layers
Rule-breaking set pieces. Examples:
- **"Name 6 in 30 seconds, all Rare or better."**
- **"The Host answers too.** Anything she says first is taken."

---

## 5. Categories (the Latin teacher's idea)

- **Mixed:** prompts from everything (the default).
- **Category-locked runs:** Latin, Bible, Science, Geography, History, Music, Games… Each has its own records.
- **Custom packs:** anyone (a teacher, a friend) writes a simple text or JSON list of prompts and answers, and the game plays it as a category. Good for classrooms.

**How rarity gets decided:** curated answer lists with rarity tiers for each category. On top of that, **the Sim remembers**: answers you've used in past runs slowly lose value *for you*. You're always pushed to learn new answers, which is what makes it endless *and* skill-building.

**Daily Seed:** the same prompts for everyone each day, with a shareable result. That's the Krillion-style daily ritual, inside our game.

---

## 6. The Host: the DDLC layer that makes it surprising

- An **original** character who runs the simulation. She knows it's a simulation, knows it's a game, and knows **you** are a player.
- **She remembers** (stored in the browser):
  - your past runs, your best and worst answers
  - how long you've been gone, what time of day it is
  - whether you quit a run halfway
- **Her behavior shifts with depth and across many runs:**
  - curious at first, then invested
  - eventually she starts **editing the game herself**: new rules, fake patch notes, hidden categories, the interface itself changing
- **Lore unfolds in fragments across runs:** why the Sim exists, what the Host is, what's at the bottom. This is the long-term surprise that makes "no end" meaningful.
- **Optional AI layer (later, not required):** an AI model could voice the Host live and judge open-ended answers. That ties back to turbodog111's AI background. The game must work fully without it.

---

## 7. Alternatives considered

| Direction | Why it's not the lead proposal |
|---|---|
| **B. An action roguelike** (no prompts) with a meta-narrative Host | Drops the Krillion and Latin teacher ideas entirely |
| **C. A mix of microgames:** action, puzzles and prompts in rapid rotation | Very surprising, but the skill gets spread thin and it's a lot to build |

The lead proposal (§3) is the only one that uses **every** idea in the log. Parts of C, such as an occasional non-typing micro-challenge, could still show up as Glitches.

---

## 8. Open questions for next session ❓

1. **Combat is answering:** does typed answers as attacks feel right, or should prompts sit alongside a separate action game?
2. **Tone:** DDLC is psychological horror. How dark should the Host get? One option: unsettling and mysterious, ultimately hopeful.
3. **The Host:** name, personality, and should she stay fully separate from turbodog111's Christian AI project?
4. **First categories:** Latin? Bible? General knowledge?
5. **Answer checking:** curated lists only (simple, offline), or an optional AI judge later?
6. **Title:** decide once the concept is locked.

**Proposed first build** (when we're back): one playable run, with
- a General and a Latin category
- 3 enemy types, 6 Mods, 2 powers
- a basic Host with a handful of memory-aware lines
