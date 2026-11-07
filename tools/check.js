// Validates the prompt bank and exercises the run engine headlessly.
// Usage: node tools/check.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
global.window = global;
for (const f of ['js/data/prompts.js', 'js/data/bestiary.js', 'js/core/match.js', 'js/core/run.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
}
const RA = global.RA;
let problems = 0;
const fail = (m) => { problems++; console.log('✗ ' + m); };

// 1. Data: duplicate answers inside a prompt, empty tiers, ids.
const ids = new Set();
for (const src of RA.PROMPT_SRC) {
  if (ids.has(src.id)) fail(`duplicate prompt id ${src.id}`);
  ids.add(src.id);
  const seen = new Map();
  for (let t = 1; t <= 5; t++) {
    if (!src.t[t]) fail(`${src.id}: tier ${t} empty`);
    for (const item of (src.t[t] || '').split(',')) {
      for (const form of item.split('/')) {
        const k = RA.norm(form);
        if (!k) continue;
        if (seen.has(k) && seen.get(k) !== item.trim()) fail(`${src.id}: "${form.trim()}" appears twice (tier ${t})`);
        seen.set(k, item.trim());
      }
    }
  }
}
const p = RA.prompts;
console.log(`prompts: ${p.length} (lvl1 ${p.filter(x=>x.lvl===1).length}, lvl2 ${p.filter(x=>x.lvl===2).length}, lvl3 ${p.filter(x=>x.lvl===3).length})`);
console.log(`answers: ${p.reduce((s,x)=>s+x.answers.length,0)}`);

// 2. Matching spot checks.
const m = (pid, s, typo = true) => { const r = RA.match(RA.promptById[pid], s, typo); return r ? r.a.text + (r.typo ? ' (typo)' : '') : null; };
const expect = (pid, s, want) => { const got = m(pid, s); if (got !== want) fail(`match ${pid} "${s}" → ${got}, expected ${want}`); };
expect('dei', 'Jupiter', 'Iuppiter');
expect('dei', 'iovis', null);
expect('verba1', 'amare', 'amo');
expect('verba1', 'hortari', 'hortor');
expect('verba2', 'monere', 'moneo');
expect('verba2', 'vereri', 'tueor' === 'x' ? '' : 'vereor');
expect('imperatores', 'Marcus Aurelius', 'Marcus Aurelius');
expect('imperatores', 'pertinax', 'Pertinax');
expect('locutiones', 'Et cetera', 'et cetera');
expect('locutiones', 'e.g.', 'exempli gratia');
expect('portare', 'transports', 'transport');
expect('animalia', 'Elephantus', 'elephantus');
expect('animalia', 'elefantus', 'elephantus (typo)');
expect('animalia', 'dog', null);
expect('mensis', 'Iānuārius', 'Ianuarius');
expect('sidera', 'ursa major', 'Ursa Maior');

// 3. Simulated runs with a bot that knows a fraction of answers.
function sim(knowRate, seed, pace = 2.2, miss = 0) {
  const run = new RA.Run({ used: {}, found: {} }, seed);
  let guard = 0;
  while (run.phase !== 'dead' && guard++ < 20000) {
    if (run.phase === 'boon') { run.chooseBoon(0); continue; }
    run.tick(pace);
    if (run.phase !== 'fight') continue;
    const part = run.enemy.parts.find((x) => x.alive);
    const left = part.prompt.answers.filter((a) => !run.used.has(a.id) && (a.tier <= 2 || Math.random() < knowRate));
    const st = run.enemy.st, R = run.enemy.rules;
    const ok = left.filter((a) => {
      const k = RA.norm(a.text);
      if (R.includes('sphinx') && st.lastKey && k <= st.lastKey) return false;
      if (R.includes('tantalus') && k.length <= st.lastLen) return false;
      if (R.includes('judge') && st.letters.has(k[0])) return false;
      if (R.includes('toll') && a.tier < 3) return false;
      return true;
    });
    if (Math.random() < miss) { run.submit('nescio'); run.events.length = 0; continue; }
    if (!ok.length || Math.random() < 0.05) { run.muta(); continue; }
    run.submit(ok[Math.floor(Math.random() * ok.length)].text);
    run.events.length = 0;
  }
  return run.floor;
}
for (const [rate, pace, miss, who] of [[0.05, 6, 0.25, 'beginner'], [0.2, 4.5, 0.15, 'Latin student'], [0.5, 3.5, 0.1, 'Latin teacher'], [0.6, 2.2, 0, 'perfect bot']]) {
  const floors = Array.from({ length: 40 }, (_, i) => sim(rate, i + 1, pace, miss));
  floors.sort((a, b) => a - b);
  console.log(`${who.padEnd(14)} (knows ${Math.round(rate * 100)}% rare, ${pace}s/answer) → median floor ${floors[20]}, best ${floors[39]}`);
}
console.log(problems ? `${problems} problem(s)` : 'all checks passed');
process.exit(problems ? 1 : 0);
