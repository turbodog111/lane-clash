// Writes review edits (from the Tabularium screen) into js/data/prompts.js.
// Usage: node tools/apply-review.js <review.json> [--dry]
//   review.json: the screen's "Export changes" file, or { edits: [{ id, op, pid, ... }] } read from the artifact database.
// Open-question edits for prompts.js are written in place. Notes, drills and class-mode (schola.js) edits are listed
// for hand-editing, since that data is partly generated from tables. Prints the ids it applied, to mark them 'applied'.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
global.window = global;
for (const f of ['js/data/prompts.js', 'js/data/plurals.js', 'js/data/schola.js', 'js/core/match.js', 'js/core/review.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
}
const RA = global.RA;
const file = process.argv[2];
if (!file) { console.log('usage: node tools/apply-review.js <review.json> [--dry]'); process.exit(1); }
const dry = process.argv.includes('--dry');
const input = JSON.parse(fs.readFileSync(file, 'utf8'));
const edits = (Array.isArray(input) ? input : input.edits || []).filter((e) => (e.status || 'open') === 'open');

const promptsPath = path.join(root, 'js/data/prompts.js');
let text = fs.readFileSync(promptsPath, 'utf8');
const applied = [], manual = [];
const byPid = new Map();
for (const e of edits) { if (!byPid.has(e.pid)) byPid.set(e.pid, []); byPid.get(e.pid).push(e); }

for (const [pid, list] of byPid) {
  const src = RA.PROMPT_SRC.find((s) => s.id === pid);
  const notes = list.filter((e) => e.op === 'note');
  manual.push(...notes);
  const changes = list.filter((e) => e.op !== 'note');
  if (!changes.length) continue;
  if (!src) { manual.push(...changes); continue; }
  const next = RA.Review.applyToSrc(src, changes);
  const start = text.indexOf(`id: '${pid}'`);
  const end = text.indexOf('\n    },', start);
  if (start < 0 || end < 0) { manual.push(...changes); continue; }
  let block = text.slice(start, end);
  for (let t = 1; t <= RA.MAXT; t++) {
    const val = next.t[t] || '';
    if (/'/.test(val)) { console.log(`! ${pid} tier ${t}: contains a quote, skipped`); continue; }
    const re = new RegExp(`(\\n\\s*)${t}: '[^']*',`);
    if (re.test(block)) block = block.replace(re, (_, ind) => `${ind}${t}: '${val}',`);
    else console.log(`! ${pid}: no tier ${t} line found`);
    if (!val) console.log(`! ${pid}: tier ${t} is now empty`);
  }
  text = text.slice(0, start) + block + text.slice(end);
  applied.push(...changes);
}

if (!dry) fs.writeFileSync(promptsPath, text);
const say = (e) => `${e.op} ${e.pid} ${e.key ?? (e.index != null ? '#' + e.index : '')} ${e.tier ?? ''} ${e.alias ?? e.text ?? e.note ?? ''}`.replace(/\s+/g, ' ').trim();
console.log(`${dry ? 'would apply' : 'applied'} ${applied.length} edit(s) to js/data/prompts.js`);
applied.forEach((e) => console.log('  ✓ ' + say(e)));
if (manual.length) { console.log(`${manual.length} to handle by hand:`); manual.forEach((e) => console.log('  • ' + say(e))); }
console.log('APPLIED_IDS ' + JSON.stringify(applied.map((e) => e.id).filter(Boolean)));
