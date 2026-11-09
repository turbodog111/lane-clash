// Validates the prompt bank and exercises the run engine headlessly.
// Usage: node tools/check.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
global.window = global;
for (const f of ['js/data/prompts.js', 'js/data/plurals.js', 'js/data/schola.js', 'js/data/bestiary.js', 'js/core/match.js', 'js/core/review.js', 'js/core/run.js']) {
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
  for (let t = 1; t <= RA.MAXT; t++) {
    if (!src.t[t] && t <= 3) fail(`${src.id}: tier ${t} empty`);
    if (!(t in src.t)) fail(`${src.id}: no tier ${t} line`);
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
// Class content: every drill item needs an answer and a tier; open prompts need at least one answer.
for (const u of RA.schola) for (const pr of u.prompts) {
  if (ids.has(pr.id)) fail(`duplicate prompt id ${pr.id}`);
  ids.add(pr.id);
  if (!pr.answers.length) fail(`${pr.id}: no answers`);
  for (const a of pr.answers) {
    if (!a.keys.length) fail(`${pr.id}: item "${a.q || a.text}" has no accepted answer`);
    if (!(a.tier >= 1 && a.tier <= RA.MAXT)) fail(`${pr.id}: item "${a.q || a.text}" has tier ${a.tier}`);
  }
}
console.log(`class units: ${RA.schola.length}, questions: ${RA.scholaPrompts.length}, items/answers: ${RA.scholaPrompts.reduce((s, x) => s + x.answers.length, 0)}`);
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
expect('s-usus-abl', 'ablative of means', 'means');
expect('s-usus-abl', 'Instrument', 'means');
expect('s-usus-gen', 'partitive genitive', 'partitive');
expect('s-gradus-formae', 'saevissimus', null);
const item = (pid, i) => RA.promptById[pid].answers[i];
const end = RA.promptById['s-terminationes'].answers.find((a) => a.q === '1st declension (feminine) · genitive plural');
if (!RA.matchItem(end, '-ārum') || !RA.matchItem(end, 'arum') || RA.matchItem(end, 'orum')) fail('ending drill matching');
const sup = RA.promptById['s-gradus-adi'].answers.find((a) => a.q.startsWith('Superlative of ācer (m'));
if (!RA.matchItem(sup, 'acerrimus') || RA.matchItem(sup, 'acerrimum')) fail('degree drill must be exact');

// Plurals count as the singular in noun questions.
for (const [pid, typed, want] of [['animalia', 'canes', 'canis'], ['animalia', 'boves', 'bos'], ['corpus', 'ossa', 'os'], ['corpus', 'ora', 'os'], ['decl3', 'itinera', 'iter'], ['decl1', 'puellae', 'puella'], ['familia', 'coniuges', 'coniunx']]) {
  if (RA.match(RA.promptById[pid], typed, false)?.a.text !== want) fail(`plural ${typed} should count as ${want} in ${pid}`);
}
{
  const none = new Set(RA.NO_PLURAL.split(/[ |]/).concat(RA.NO_PLURAL.split('|')).map(RA.norm));
  const pl = new Set(Object.keys(RA.PLURALS).map(RA.norm));
  for (const src of RA.PROMPT_SRC.filter((s) => s.pl)) for (const a of RA.promptById[src.id].answers) {
    if (!pl.has(RA.norm(a.forms[0])) && !none.has(RA.norm(a.forms[0]))) fail(`${src.id}: no plural listed for ${a.text} (add it to js/data/plurals.js, or to NO_PLURAL)`);
  }
}
if (RA.match(RA.promptById.dei, 'Iunones', false)) fail('plurals must not apply to questions without pl');
for (const src of RA.PROMPT_SRC.filter((s) => s.pl)) {
  const p = RA.promptById[src.id];
  for (const a of p.answers) {
    if (!a.plurals) continue;
    for (const k of a.plurals.map(RA.norm)) if (p.map.get(k) !== a && !a.keys.slice(0, a.forms.length).includes(k) && process.env.PLURALS) console.log(`  note: ${src.id}: plural ${k} of ${a.text} already means ${p.map.get(k).text}`);
  }
}

// Review overlay: edits change matching, and leave the source untouched.
{
  const E = [
    { op: 'tier', pid: 'animalia', key: 'canis', tier: 3, status: 'open', at: 1 },
    { op: 'alias', pid: 'animalia', key: 'lupus', alias: 'lupa', status: 'open', at: 2 },
    { op: 'add', pid: 'animalia', text: 'basiliscus', tier: 4, status: 'open', at: 3 },
    { op: 'remove', pid: 'animalia', key: 'ursus', status: 'open', at: 4 },
    { op: 'alias', pid: 's-terminationes', index: 0, alias: 'xyz', status: 'open', at: 5 },
    { op: 'remove', pid: 's-terminationes', index: 1, status: 'open', at: 6 },
  ];
  RA.Review.rebuild(E);
  const an = RA.promptById.animalia, td = RA.promptById['s-terminationes'];
  if (RA.match(an, 'canis')?.a.tier !== 3) fail('review: tier edit');
  if (RA.match(an, 'lupa')?.a.text !== 'lupus') fail('review: alias edit');
  if (RA.match(an, 'basiliscus')?.a.tier !== 4) fail('review: add edit');
  if (RA.match(an, 'ursus', false)) fail('review: remove edit');
  if (!RA.matchItem(td.answers.find((a) => a.index === 0), 'xyz')) fail('review: drill alias');
  if (td.answers.some((a) => a.index === 1)) fail('review: drill remove keeps ids');
  if (RA.PROMPT_SRC[0].t[4].includes('basiliscus') || !RA.PROMPT_SRC[0].t[1].includes('canis')) fail('review: source mutated');
  if (RA.Review.docId(E[1]) !== 'alias~animalia~lupus~lupa') fail('review: doc id');
  RA.Review.rebuild([]);
  if (RA.match(RA.promptById.animalia, 'canis')?.a.tier !== 1) fail('review: rebuild without edits');
}

// 3. Simulated runs with a bot that knows a fraction of answers.
// knowRate is either a number (knows every tier 1-2 answer, and that share of rarer ones) or a
// per-tier array [_, t1 … t6]: the chance it knows each answer, decided once per run (like a person).
function sim(knowRate, seed, pace = 2.2, miss = 0, mode = 'open') {
  const run = new RA.Run({ used: {}, found: {} }, seed, mode === 'schola' ? { mode, pool: RA.scholaPrompts } : {});
  const known = new Map();
  const knows = (a) => {
    if (!Array.isArray(knowRate)) return a.tier <= 2 || Math.random() < knowRate;
    if (!known.has(a.id)) known.set(a.id, Math.random() < knowRate[a.tier]);
    return known.get(a.id);
  };
  let guard = 0;
  while (run.phase !== 'dead' && guard++ < 20000) {
    if (run.phase === 'boon') { run.chooseBoon(0); continue; }
    run.tick(pace);
    if (run.phase !== 'fight') continue;
    const part = run.enemy.parts.find((x) => x.alive);
    const cur = run.current(part);
    if (cur) {
      const kr = Array.isArray(knowRate) ? knowRate[3] : knowRate;
      if (Array.isArray(knowRate) ? !knows(cur) || Math.random() < miss : Math.random() < miss + (cur.tier - 1) * (0.5 - kr) * 0.25) run.submit('nescio');
      else run.submit(cur.keys[0]);
      run.events.length = 0;
      continue;
    }
    const left = part.prompt.answers.filter((a) => !run.used.has(a.id) && knows(a));
    const st = run.enemy.st, R = run.enemy.rules;
    const ok = left.filter((a) => {
      const k = RA.norm(a.text);
      if (R.includes('sphinx') && st.lastKey && k <= st.lastKey) return false;
      if (R.includes('tantalus') && k.length <= st.lastLen) return false;
      if (R.includes('judge') && st.letters.has(k[0])) return false;
      if (R.includes('toll') && a.tier < (run.mode === 'schola' ? 2 : 3)) return false;
      return true;
    });
    if (Math.random() < miss) { run.submit('nescio'); run.events.length = 0; continue; }
    if (!ok.length || Math.random() < 0.05) { run.muta(); continue; }
    run.submit(ok[Math.floor(Math.random() * ok.length)].text);
    run.events.length = 0;
  }
  return run.floor;
}
// "Human" profiles: realistic knowledge and pace (a person thinks, types, and makes mistakes).
for (const [rate, pace, miss, who] of [[[0, 0.35, 0.12, 0.03, 0.01, 0, 0], 10, 0.35, 'human: new'], [[0, 0.6, 0.3, 0.1, 0.03, 0.01, 0.005], 8, 0.3, 'human: student'], [[0, 0.85, 0.6, 0.3, 0.1, 0.03, 0.02], 6, 0.2, 'human: strong']]) {
  const floors = Array.from({ length: 60 }, (_, i) => sim(rate, i + 1, pace, miss));
  floors.sort((a, b) => a - b);
  const past5 = floors.filter((f) => f > 5).length / floors.length;
  if (process.env.HIST) { const h = {}; floors.forEach((f) => (h[f] = (h[f] || 0) + 1)); console.log('  deaths by floor', JSON.stringify(h)); }
  console.log(`${who.padEnd(14)} (${pace}s/attempt, ${Math.round(miss * 100)}% wrong) → median floor ${floors[30]}, best ${floors[59]}, beats Gradus V ${Math.round(past5 * 100)}%`);
}
for (const [rate, pace, miss, who] of [[0.05, 6, 0.25, 'beginner'], [0.2, 4.5, 0.15, 'Latin student'], [0.5, 3.5, 0.1, 'Latin teacher'], [0.6, 2.2, 0, 'perfect bot']]) {
  const floors = Array.from({ length: 40 }, (_, i) => sim(rate, i + 1, pace, miss));
  floors.sort((a, b) => a - b);
  console.log(`${who.padEnd(14)} (knows ${Math.round(rate * 100)}% rare, ${pace}s/answer) → median floor ${floors[20]}, best ${floors[39]}`);
}
for (const [rate, pace, miss, who] of [[[0, 0.75, 0.55, 0.4, 0.25, 0.15, 0.1], 9, 0.1, 'class: human student'], [[0, 0.95, 0.85, 0.7, 0.55, 0.4, 0.3], 7, 0.05, 'class: human strong'], [0.2, 4.5, 0.15, 'class: student'], [0.5, 3.5, 0.05, 'class: teacher']]) {
  const floors = Array.from({ length: 40 }, (_, i) => sim(rate, i + 1, pace, miss, 'schola'));
  floors.sort((a, b) => a - b);
  console.log(`${who.padEnd(20)} → median floor ${floors[20]}, best ${floors[39]}`);
}
console.log(problems ? `${problems} problem(s)` : 'all checks passed');
process.exit(problems ? 1 : 0);
