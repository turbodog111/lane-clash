# Lane Clash Remaster — Vision (draft 2)

> **Title: TBD.** We pick it once the combat and roguelite loop feel right.
> Status: **proposed**. ❓ marks an open decision.
> The original prototype lives on `archive/v0.1.5-prototype` and `archive/v0.4.1-functionality`.

**One line:** a real-time lane-combat **roguelite**. Fight a chain of AI opponents in short battles, drafting and upgrading your units along the way, inside a world that knows it's a simulation.

---

## 1. Why Clash Royale works (and what we take from it)

| # | What makes it appealing | What we do with it |
|---|---|---|
| 1 | **One input, deep decisions.** You only ever place a card at a spot and a moment, so *what / where / when* is the whole game. No hand speed needed, but the strategy keeps going deeper. | Keep exactly this. Placement precision and timing are the skill. |
| 2 | **Every interaction is a trade.** Elixir makes every exchange measurable: killing a 5-cost push with 3 elixir *feels* like winning, even before a tower falls. | Make trades visible: show a **"+2 Compute"** pop when you out-trade the enemy. That number is the fun. |
| 3 | **Defense becomes offense.** Units that survive defending walk across the river as a free counter-push. It's the most satisfying moment in the genre. | Design units and upgrades that reward this (e.g. upgrades that trigger "after defending"). |
| 4 | **A readable counter web.** Swarm beats big single-target hitters, splash beats swarm, and so on. Counters are *soft*, so skill can overturn a bad matchup. | Explicit traits (§3) so counters are learnable rules, not memorized special cases. |
| 5 | **Two lanes = pressure and punishment.** Commit to one lane and the other is open. | Keep two lanes. Several upgrades and opponents play on lane-switching. |
| 6 | **Cycle and information.** Knowing which cards they have left ("their splash spell is gone, push now") is a mind game. | Against an AI, make the information *readable*: you always see the enemy's **next card**, and some upgrades reveal more. |
| 7 | **A match has an arc.** Calm opening, then double elixir, then overtime. Tension builds on schedule. | Same arc, compressed into ~2.5 min so a run has many battles. |
| 8 | **Characters with one clear job.** Every unit has a silhouette, a personality and a role you can read in half a second. | Every unit gets one job, one silhouette, one sound. |
| 9 | **Your deck is self-expression.** Beatdown, control, siege, bait, cycle: players identify with an archetype. | In a roguelite this gets *better*: you build a new archetype every run. |
| 10 | **Partial victory.** Taking one tower in a loss still feels like progress. | Damage dealt matters across the run (Integrity, §5). |

**What we drop:** card levels bought with time or money, chest timers, trophy grinding, and paywalls. Those are why Clash Royale players burn out.

**What we lose by going single-player:** reading a human opponent. We replace it with **AI opponents that have personalities**, visible intent (their next card), and **elite/boss opponents that bend the rules**.

### What roguelites add on top
- **Broken combos.** Finding a synergy that wrecks a boss is the roguelite high (Slay the Spire, Balatro, Hades).
- **Every run is different.** Different drafts, different maps, different enemies.
- **Risk/reward choices between fights.** Elite or safe path? Upgrade or heal?
- **Losing is learning.** Runs are short and you come back knowing more, not owing a grind.

**The fusion:** Clash Royale's hook is **trade efficiency**; the roguelite hook is **synergy**. Our upgrades should *change the trades*: a 2-cost unit that, after two upgrades, beats 5-cost units is the payoff.

---

## 2. The battle

### Arena
- Portrait arena; you're at the bottom.
- Two lanes, each crossing **the Seam** (the river) on one **Link** (bridge).
- Each side has **1 Core** (king tower) and **2 Sentries** (crossbow towers, long range).
- The Core wakes when it's hit or when a Sentry falls. Until then it doesn't shoot.

### Compute (in-battle currency)
- Every unit and spell costs **Compute** (1–7). Max 10, start at 5, +1 every 2.5s.
- **Overclock:** the final 60s gives 2× Compute.
- **Hand:** 3 cards in hand plus a visible next card, drawn from your run deck (6 cards at the start, growing to ~10–14). ❓

### Match arc (~2.5 min)
| Phase | Time | What happens |
|---|---|---|
| Opening | 0:00–1:30 | Normal Compute. Probing, trading, first pushes. |
| Overclock | 1:30–2:30 | 2× Compute. Big pushes. |
| Sudden death | up to +30s | The first structure to fall decides it. |

### Winning a battle
- **Destroy the enemy Core** → **decisive win**, bonus rewards.
- **Time runs out** → more Sentries standing wins; ties go to the side with more Core HP left.

---

## 3. Combat rules: the counter web

Every unit is defined by a handful of stats plus **traits**. Traits *are* the counter system.

**Stats:** Cost · HP · Damage · Attack speed · Range · Move speed (slow/med/fast) · Count · Targets (ground / ground+air / structures only)

| Trait | Rule | Countered by |
|---|---|---|
| **Swarm** | Many weak bodies | Splash |
| **Splash** | Damages everything in a small area | High-HP single units; ranged units outranging it |
| **Armored** | Each hit taken −8 damage | Heavy hitters, Corrupt |
| **Corrupt** | Ignores Armor, +50% damage vs Mainline | High-HP Legacy units |
| **Hover** | Flies; melee can't hit it | Ranged / anti-air |
| **Siege** | Only targets structures, ignores units | Swarms, distraction buildings |
| **Charge** | Speeds up after a short run; first hit deals 2× | Freeze, swarm interrupts |
| **Shield** | Extra HP layer that blocks one big hit's overflow | Fast multi-hit units |
| **Spawner** | Building that periodically creates units | Siege, spells |
| **Building** | Stationary, decays over time, pulls enemy units | Siege that outranges it |
| **Stealth** | Invisible (untargetable) until it first attacks | Splash, structures once revealed |

Readable shapes in the web: **Swarm > big single hitter > Armored > Swarm**, **Splash > Swarm**, **Hover > melee**, and **Siege is your win condition, but needs support**.

---

## 4. Units (Scripts)

Three factions, each with its own play style and its own drawn-in-code look. **Every run can draft from all three**; your starting Operator (§6) just sets your opening deck.

Each unit has **3 tiers**: **I** (base) → **II** (choose A *or* B) → **III** (mastery of the branch you chose). Upgrades last for the current run only.

### ⚔️ Legacy: *old-iteration assets*
Medieval, honest, cost-efficient. **Faction theme:** formations; they're stronger together.

| Unit | Cost | Role | II-A | II-B |
|---|---|---|---|---|
| **Warden** | 2 | Melee mini-tank, single target | *Bulwark:* gains Shield | *Duelist:* +40% attack speed, heals on kill |
| **Longshots** | 2 | 2 archers, ranged, hits air | *Volley:* 3 archers | *Piercing:* arrows pass through a line |
| **Bannerman** | 3 | Weak support; nearby allies +25% attack speed | *War Drum:* aura also +speed | *Last Stand:* on death, allies gain Shield |
| **Cavalier** | 4 | Charge, fast melee | *Lancer:* charge hit stuns | *Outrider:* charges again after each kill |
| **Shieldwall** | 4 | 3 Armored footmen, slow | *Phalanx:* +Armor while adjacent | *Taunt:* enemies must target them |
| **Trebuchet** | 5 | Building, Siege, very long range | *Firepots:* splash + burn | *Counterweight:* fires 2× as often, shorter life |

### 🤖 Mainline: *the current build*
Robots. Expensive, Armored, hit hard. **Faction theme: Compile.** Two copies of the same Mainline unit meeting in a lane merge into their bigger form.

| Unit | Cost | Role | II-A | II-B |
|---|---|---|---|---|
| **Arc Bot** | 2 | Short-range chain lightning (hits 3 targets) | *Capacitor:* chains to 5 | *Grounded:* stuns its first target |
| **Drone Swarm** | 3 | 4 Hover drones, fast, fragile | *Kamikaze:* explode on death | *Escort:* +1 drone, shields allies below |
| **Mini-MEGA** | 3 | Armored melee bruiser, heavy hits | *Overcharged:* every 3rd hit splashes | *Reinforced:* +Armor, slower |
| **Railgun** | 4 | Building, huge single shots that pierce | *Overheat:* fires faster, decays faster | *Sniper:* +50% range |
| **Shredder** | 5 | Armored melee splash | *Vortex:* pulls enemies in | *Spin-up:* damage ramps the longer it fights |
| **MEGA** | 6 | Siege tank: structures only, huge HP, Armored. Or Compile 2 Mini-MEGAs | *Cannon Arm:* ranged siege | *Juggernaut:* immune to stun/freeze |

### 👾 Null: *corrupted data that won't stay deleted*
Glitchy. Swarms, tricks, and value from dying. **Faction theme: death fuels them.**

| Unit | Cost | Role | II-A | II-B |
|---|---|---|---|---|
| **Fork Bomb** | 2 | On death splits into 2 smaller copies (2 generations) | *Recursive:* 3 generations | *Volatile:* each split explodes |
| **Zombie Processes** | 3 | Swarm of 6, Corrupt | *Horde:* 9 zombies | *Infectious:* kills raise a new zombie |
| **Phantom** | 3 | Stealth assassin, high damage | *Backstab:* first hit ×3 | *Blink:* teleports to a new target on kill |
| **Memory Leak** | 4 | Hover, Siege; drains structures slowly but can't be slowed | *Overflow:* speeds up as it drains | *Persistent:* returns once after dying |
| **Null Spawner** | 5 | Spawner of Zombie Processes | *Rapid:* spawns faster | *Infected Tomb:* releases a horde when destroyed |

### ✨ Commands (spells, any faction)
These are the simulation-bending cards.

| Command | Cost | Effect | II-A | II-B |
|---|---|---|---|---|
| **Ping** | 1 | Tiny damage + resets attacks (interrupts Charge) | *Echo:* hits twice | *Trace:* reveals enemy hand for 5s |
| **Breakpoint** | 2 | Freezes everything in an area for 2s (both sides) | *Selective:* enemies only | *Extended:* 3.5s |
| **Purge** | 4 | Area damage | *Wide:* bigger area | *Executable:* +100% damage vs Swarm |
| **Overclock** | 3 | Allies in area +40% speed and attack speed for 5s | *Sustained:* 8s | *Burst:* +80% for 3s |
| **Rollback** | 5 | Everything in the area snaps back to its state 3s ago (HP, position, even the dead) | *Precise:* only affects your units | *Long:* rewinds 5s |
| **Fork** | 5 | Duplicates a friendly unit at 50% HP | *Clean Copy:* 75% HP | *Inherit:* copy keeps upgrades... and buffs |

---

## 5. The run

### Structure
- A run is **3 Sectors**. Each Sector is a branching map of ~8 nodes ending in a **boss**.
- About **12–15 battles per run**, roughly 45–60 minutes total.

| Node | What it is |
|---|---|
| ⚔️ **Battle** | Standard AI opponent |
| 🔥 **Firewall** (elite) | Harder opponent with a gimmick; always drops a Patch |
| 🛒 **Exchange** | Shop: buy units, upgrades, Patches; remove a card |
| 🛠️ **Compiler** | Upgrade one unit for free |
| 💾 **Restore Point** | Repair Integrity, *or* upgrade a unit |
| ❓ **Anomaly** | Random event, often a gamble ("Sacrifice a card, upgrade two") |
| 👑 **Boss** | Sector boss with a rule-breaking ability |

### Integrity: your run's health
Your Core's HP **carries through the whole run** (it starts at 3000).
- Damage your Core takes in a battle *stays*.
- Losing a battle on time costs a flat −500 Integrity, but the run goes on.
- **Integrity reaches 0 → the run ends.**
- Sentries rebuild for free each battle.

That's the roguelite tension: a sloppy win now hurts you three fights later. It also makes partial progress count (§1, row 10).

### Bits: in-run currency
| Source | Bits |
|---|---|
| Each win | +25 |
| Each enemy Sentry destroyed | +10 |
| Decisive win (Core destroyed) | +30 |
| Positive Compute trade total for the battle | up to +15 |

Bits spend only at the Exchange and reset when the run ends. There's **no currency outside a run**.

### Rewards after a battle
Pick one:
- a **new unit** (choose 1 of 3), or
- an **upgrade**: tier up a unit you own, or
- **Bits**.

Elites and bosses also drop a **Patch**.

### Patches (run-wide passives: the combo engines)
| Patch | Effect |
|---|---|
| **Recycler** | When one of your units dies, gain 0.3 Compute |
| **Cold Start** | Your first card each battle is free |
| **Formation Protocol** | Legacy units deployed together start with Shield |
| **Overflow** | Compute can go to 12 |
| **Garbage Collector** | Your Swarm units' deaths damage nearby enemies |
| **Lane Lock** | Enemy units can't switch lanes; yours gain +15% damage in the lane you've played more |
| **Hotswap** | Your next card is always the cheapest in your deck |
| **Admin Rights** | Commands cost 1 less; your deck can hold at most 10 cards |

**Example build:** Null Operator → draft a second Fork Bomb → upgrade Fork Bomb to *Volatile* → find **Recycler** and **Garbage Collector**. Now a 2-Compute card refunds itself while blowing up the enemy's push. That's the "I broke it" moment.

### Opponents
- **Standard opponents:** each an AI Operator with a personality and a deck you can **scout before the fight** (*Rusher, Turtle, Splitter, Siege*).
- **Firewalls (elites):** a gimmick each, for example:
  - *Triple Sentry*: an extra Sentry sits on the Seam
  - *Mirror*: plays a copy of your deck
  - *Overclocked*: 2× Compute the whole match
- **Bosses:**
  - **The Gatekeeper** (Sector 1): Links closed for the first 30s; armored Sentries.
  - **The Hive** (Sector 2): a free Zombie wave every 20s; kill the Spawner Sentries to stop it.
  - **The Admin** (Sector 3): plays Rollback and Breakpoint against you, and at 50% Core HP pushes a **Hotfix** that changes the rules mid-fight.

---

## 6. Operators & meta progression

You pick an **Operator** at the start of each run. It sets your starting deck and one passive; every run drafts from all factions.

| Operator | Starting deck | Passive |
|---|---|---|
| **Castellan** (Legacy) | Warden ×2, Longshots ×2, Bannerman, Purge | Sentries +25% HP |
| **Engineer** (Mainline) | Mini-MEGA ×2, Arc Bot, Drone Swarm, Warden, Ping | Compile costs nothing extra: merged units keep both units' upgrades |
| **Glitch** (Null) | Zombie Processes, Fork Bomb ×2, Phantom, Longshots, Breakpoint | 15% chance a dying unit returns as a zombie |

**Meta progression is horizontal only, never more power:**
- **Unlocks** add new units and Patches to the reward pool, and add new Operators.
- **Clearance levels** (a difficulty ladder, like Slay the Spire's Ascension): beat a run to unlock the next harder modifier.
- **Codex:** lore and stats for everything you've met.

---

## 7. Art & feel (all drawn in code)
- **Factions look different at a glance:**
  - Legacy: chunky pixel style
  - Mainline: clean vector with glowing visors
  - Null: jittery and RGB-split
- **Sides:** cyan outline for you, magenta for the enemy.
- **Arena:** dark grid floor, a glowing Seam, light-bridge Links.
- **Feedback:**
  - hit flashes, knockback, screen shake on Core hits
  - units dissolve into pixels on death
  - a "+2" trade pop
  - a CRT glitch flash on Commands
- **Sound:** synthesized blips, thuds and zaps, one per unit.

## 8. Tech (short)
TypeScript + Vite, Canvas 2D, hosted on GitHub Pages. Battle logic runs on a fixed tick with seeded randomness, so Rollback, replays and an AI-vs-AI balance tester all work. All units, upgrades and Patches live in data files, and the Codex is generated from them.

---

## 9. Build order
1. **Combat core.** Arena, Compute, 6 units (Warden, Longshots, Mini-MEGA, Zombie Processes, Arc Bot, Purge), traits, one AI. *Done when a single battle is fun on its own.*
2. **Full roster.** All units, Commands, upgrade tiers, art and sound pass.
3. **The run.** Map, nodes, Integrity, Bits, rewards, Patches, 3 bosses.
4. **Depth.** Operators, opponent personalities, Clearance levels, balance tester, more content.

## 10. Open questions ❓
1. **Integrity:** Core HP carrying through the run (proposed), or should losing a battle simply end the run?
2. **Air units (Hover):** in or out? It adds counter depth but also complexity.
3. **Hand:** 3 + next (proposed) or 4 + next?
4. **Match length:** ~2.5 min (proposed) or closer to Clash Royale's 3–5?
5. **Roster:** any unit here you love or hate? Anything from the old game you want back exactly as it was?
