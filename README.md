# Rara Avis *(working title)*

A Latin descent into the Underworld. The Sibyl asks questions ("Name a Roman emperor", "Name an English word from *videre*") and **every correct answer is an attack. The rarer the answer, the harder it hits.** *Augustus* barely scratches a shade; *Pertinax* hits like a truck.

It's an endless, skill-only roguelike: no levels, no currency, nothing to grind. What carries over between descents is what you've learned, plus a Sibyl who remembers you.

## Play

Open `index.html` in a browser. No build step and no server needed; double-clicking the file works.
(To host it: enable GitHub Pages on this branch, or serve the folder with any static server.)

| Key | Action |
|---|---|
| `Enter` | Submit an answer |
| `Tab` | New question (costs 4s) |
| `?` | Use a Sibyl's leaf (hint) |
| `↑` | Glance at a question the Gorgon has hidden (costs 2s) |
| `Esc` | Pause |
| `1` `2` `3` | Choose a gift of the gods |

## How it plays

- **Rarity tiers:** Vulgaris 10 · Insolitus 18 · Rarus 30 · Rarissimus 50 · Rara Avis 80 damage.
- **The enemy bites on a timer.** Wrong answers and repeats hurry it, so answering fast with common words competes with digging for a rare one.
- **Enemies bring rules:**
  - Harpy: feeds on common words
  - Sphinx: alphabetical order
  - Echo: ignores words from past descents
  - Gorgon: hides the question
  - Tantalus: each word longer than the last
  - Fury: fast
- **Guardians every fifth Gradus:** Cerberus (three questions at once), Charon (rare coin only), Minos (no repeated first letters). Past Gradus X, enemies start borrowing each other's rules.
- **Gifts of the gods** after each floor change how you score. For example, Ianus doubles damage for chaining last letter to first; Vulcanus rewards short words; Pluto zeroes common words but boosts everything else.
- **Worn words:** an answer you've used in 3+ past descents hits one tier weaker. Keep learning new ones.
- **Codex** tracks every word you've found. The end screen shows rare answers you *could* have given.

## Project layout

```
index.html            page shell
css/style.css         styles (single dark "red-figure vase" look)
js/data/prompts.js    the question bank: every accepted answer with its rarity tier
js/data/bestiary.js   enemies, rules, gifts
js/core/match.js      answer normalisation + matching (macrons, j/i, u/v, small typos)
js/core/run.js        the game rules (pure logic, runs in Node too)
js/core/memory.js     what persists between descents (localStorage)
js/core/sibyl.js      the Sibyl's lines
js/art.js             all art, drawn in code on <canvas>
js/audio.js           synthesized sound (WebAudio, no files)
js/ui.js              screens, input, rendering
tools/check.js        validates the question bank and simulates runs at different skill levels
tools/bundle.js       inlines everything into one HTML file
docs/VISION.md        design direction and idea log
```

### Adding questions

Add an entry to `js/data/prompts.js`:

```js
{ id: 'flumina', lvl: 2, lang: 'la', cat: 'Orbis Romanus', q: 'Name a river, by its Latin name',
  t: { 1: 'Tiberis, Nilus', 2: 'Rhenus, Danuvius/Danubius', 3: '…', 4: '…', 5: '…' } },
```

Tiers run from 1 (common) to 5 (one in a million). Use `/` for alternate spellings; the first spelling is the one shown. Then run `node tools/check.js` to catch duplicates.

## History

The original *Lane Clash* prototypes are preserved on the `archive/v0.1.5-prototype` and `archive/v0.4.1-functionality` branches.
