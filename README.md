# Rara Avis *(working title)*

A Latin descent into the Underworld. The Sibyl asks questions ("Name a Roman emperor", "Name an English word from *videre*") and **every correct answer is an attack. The rarer the answer, the harder it hits.** *Augustus* barely scratches a shade; *Pertinax* hits like a truck.

It's an endless, skill-only roguelike: no levels, no currency, nothing to grind. What carries over between descents is what you've learned, plus a Sibyl who remembers you.

## Play

Open `index.html` in a browser. No build step and no server needed; double-clicking the file works.
(To host it: enable GitHub Pages on this branch, or serve the folder with any static server.)

| Key | Action |
|---|---|
| `Enter` | Submit an answer |
| `Tab` | New question (costs 4s); in a drill, skip to the next item |
| `?` | Use a Sibyl's leaf (hint) |
| `↑` | Glance at a question the Gorgon has hidden (costs 2s) |
| `Esc` | Pause |
| `1` `2` `3` | Choose a gift of the gods |

## How it plays

- **Rarity tiers:** Vulgaris (common) 10 · Insolitus (uncommon) 18 · Rarus (rare) 30 · Rarissimus (very rare) 45 · Arcanus (obscure) 65 · Rara Avis (one in a million) 90 damage.
  - Each question is shaped like a pyramid: roughly 28% / 26% / 20% / 14% / 8% / 4%.
  - Rara Avis is hand-picked: at most 6 answers per question, and at most 1 for questions with fewer than 20 answers.
- **Forms that also count:**
  - noun plurals (*canes* for *canis*)
  - female animals (*lupa* for *lupus*)
  - feminine and neuter adjectives, including colours and numbers (*alba*, *prima*, *duae*)
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

## Schola (class mode)

Class mode is the same game, with the questions restricted to **class material**. Currently that's the five handouts: Case Uses, the Declension Endings chart and its blank version, Adjectives, and Adverbs. Enemies, rules, gifts, worn words and records all work exactly as in the main game, and your stats count in both modes. You pick which topics to include. The handouts give two kinds of question:

- **Open questions** ("Name a use of the ablative case") have many right answers; rarer ones hit harder.
- **Drills** ("2nd declension (masculine) · genitive plural") have exactly one right answer, and the spelling must be exact. Each right answer hits and the next item appears; `Tab` skips to the next item. The end screen lists the items you missed, with their answers.

Rules that pick *which* answer you may give (the Sphinx's alphabetical order, Tantalus, Minos, the Harpy, Charon's toll, Echo) skip drill items, because a drill item has only one right answer.

Class content lives in `js/data/schola.js`, one *unit* per topic, each listing the handout(s) it came from:

```js
{ id: 'vocab-1', title: 'Vocabulary set 1', la: 'Verba I', src: ['Vocab_1.pdf'], prompts: [
  { id: 's-v1-meanings', kind: 'drill', lvl: 1, cat: 'Verba (vocabulary)', q: 'Give the English meaning',
    items: [ { q: 'arma, armōrum (n. pl.)', a: 'arms/weapons', tier: 1 } ] },
] }
```

## Tabularium (answer review)

The **Tabularium (review answers)** button on the title screen opens a review screen for tuning the question bank:

- **Questions:** every question with all its accepted answers, grouped by rarity tier. Click an answer to change its tier, accept another spelling, or remove it. You can also add missing answers and leave a note on any question.
- **Rejected guesses:** every guess the game didn't accept, most frequent first. Accept one at a tier, link it as a spelling of an existing answer, or dismiss it. At the end of each descent you can flag guesses you think should have counted.
- **Your changes:** everything you've changed, with undo.

Changes take effect in the game straight away. In the published artifact they're kept in the artifact's shared database, where Claude reads them. Opened from a file, they're kept in your browser; use **Export** to save a JSON file. To write them into the source:

```
node tools/apply-review.js review.json
```

This updates `js/data/prompts.js` in place and lists anything (notes, class-mode questions) that has to be changed by hand.

## Project layout

```
index.html            page shell
css/style.css         styles (single dark "red-figure vase" look)
js/data/prompts.js    the question bank: every accepted answer with its rarity tier
js/data/schola.js     class-mode content from the handouts (open questions + drills)
js/data/bestiary.js   enemies, rules, gifts
js/core/match.js      answer normalisation + matching (macrons, j/i, u/v, small typos)
js/core/run.js        the game rules (pure logic, runs in Node too)
js/core/review.js     review edits (re-tier, spellings, new/removed answers) applied over the question bank
js/core/memory.js     what persists between descents (localStorage)
js/core/sibyl.js      the Sibyl's lines
js/art.js             all art, drawn in code on <canvas>
js/audio.js           synthesized sound (WebAudio, no files)
js/store.js           where review edits and rejected guesses are saved (artifact database or localStorage)
js/ui.js              screens, input, rendering
js/review-ui.js       the Tabularium (answer review) screen
tools/check.js        validates the question bank and simulates runs at different skill levels
tools/apply-review.js writes review edits into js/data/prompts.js
tools/bundle.js       inlines everything into one HTML file
docs/VISION.md        design direction and idea log
```

### Adding questions

Add an entry to `js/data/prompts.js`:

```js
{ id: 'flumina', lvl: 2, lang: 'la', cat: 'Orbis Romanus', q: 'Name a river, by its Latin name',
  t: { 1: 'Tiberis, Nilus', 2: 'Rhenus, Danuvius/Danubius', 3: '…', 4: '…', 5: '…', 6: '…' } },
```

Tiers run from 1 (common) to 6 (one in a million; keep it to a handful). Use `/` for alternate spellings; the first spelling is the one shown. Then run `node tools/check.js` to catch duplicates. (Or use the Tabularium screen, which is quicker for small fixes.)

## History

The original *Lane Clash* prototypes are preserved on the `archive/v0.1.5-prototype` and `archive/v0.4.1-functionality` branches.
