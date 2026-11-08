// Screens, input and per-frame rendering. Game rules live in js/core/run.js.
(function (RA) {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tierName = (t) => RA.TIERS[t].n.toLowerCase();
  const tierFull = (t) => `${RA.TIERS[t].n} (${RA.TIERS[t].en})`;
  const chip = (text, tier, extra = '') => `<span class="chip t${tier}"${extra}>${esc(text)}</span>`;
  const marked = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<mark>$1</mark>');
  const gradus = (n) => `Gradus ${RA.roman(n)} (floor ${n})`;
  // English for the Latin category labels used in open questions.
  const CAT_EN = {
    Animalia: 'animals', Corpus: 'the body', 'Di Immortales': 'the gods', Locutiones: 'phrases', Numeri: 'numbers', Fasti: 'the calendar',
    Grammatica: 'grammar', Derivata: 'English derivatives', Familia: 'family', Colores: 'colours', Imperatores: 'emperors', Domus: 'the house',
    Cibus: 'food', Militia: 'the army', Auctores: 'authors', Aeneis: 'the Aeneid', Sidera: 'the stars', Mores: 'values', 'Orbis Romanus': 'the Roman world',
  };
  const catLabel = (c) => (CAT_EN[c] ? `${c} (${CAT_EN[c]})` : c);

  const mem = RA.Memory;
  mem.load();
  RA.Audio.setMuted(mem.data.muted);

  const screens = { title: $('scrTitle'), run: $('scrRun'), end: $('scrEnd'), codex: $('scrCodex'), help: $('scrHelp'), schola: $('scrSchola'), review: $('scrReview') };
  const input = $('answer');
  let run = null, screen = 'title', paused = false, awayPause = false, lastMode = { mode: 'open' };
  let partEls = [], lastHud = '';

  function show(name) {
    if (editsDirty && name !== 'run' && name !== 'end') { editsDirty = false; RA.Review.rebuild(Object.values(RA.Store.edits)); }
    for (const k in screens) screens[k].hidden = k !== name;
    screen = name;
    window.scrollTo(0, 0);
    if (name === 'title') renderTitle();
    if (name === 'codex') renderCodex();
    if (name === 'schola') renderSchola();
    if (name === 'review') RA.reviewUI.render();
    if (name === 'run') requestAnimationFrame(() => RA.Art.resize());
  }

  // ── Title ────────────────────────────────────────────────────────
  function renderTitle() {
    $('titleSibyl').textContent = RA.Sibyl.greeting(mem.data, mem.prevLastSeen);
    const d = mem.data;
    const found = Object.values(d.found).reduce((s, l) => s + l.length, 0);
    const total = [...RA.prompts, ...RA.scholaPrompts].reduce((s, p) => s + p.answers.length, 0);
    const rows = [
      ['Deepest descent', d.best ? gradus(d.best) : 'Not yet'],
      ['Class mode best', d.bestSchola ? gradus(d.bestSchola) : 'Not yet'],
      ['Words found', `${found} of ${total}`],
      ['Rarest word', d.bestAnswer ? `<span class="t${d.bestAnswer.tier}">${esc(d.bestAnswer.text)}</span>` : 'None yet'],
    ];
    $('records').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  }

  // ── Class mode setup ─────────────────────────────────────────────
  function selectedUnits() {
    const saved = mem.data.scholaUnits;
    return new Set(saved && saved.length ? saved : RA.schola.map((u) => u.id));
  }
  function renderSchola() {
    const sel = selectedUnits();
    $('unitList').innerHTML = RA.schola.map((u) => {
      const items = u.prompts.reduce((s, p) => s + p.answers.length, 0);
      const drills = u.prompts.filter((p) => p.kind === 'drill').length;
      return `<label class="unit">
        <input type="checkbox" id="unit-${u.id}" data-unit="${u.id}" ${sel.has(u.id) ? 'checked' : ''}>
        <span class="unit-body">
          <span class="unit-title">${esc(u.la)} <span class="paren">(${esc(u.title.toLowerCase())})</span></span>
          <span class="unit-meta">${u.prompts.length - drills} open question${u.prompts.length - drills === 1 ? '' : 's'} · ${drills} drill${drills === 1 ? '' : 's'} · ${items} answers</span>
          <span class="unit-src">from ${u.src.map(esc).join(', ')}</span>
        </span>
      </label>`;
    }).join('');
    $('scholaRecord').textContent = mem.data.bestSchola ? `Your class-mode record: ${gradus(mem.data.bestSchola)}.` : '';
  }
  function scholaPool() {
    const ids = [...document.querySelectorAll('#unitList input:checked')].map((c) => c.dataset.unit);
    mem.data.scholaUnits = ids; mem.save();
    return { ids, pool: RA.scholaPrompts.filter((p) => ids.includes(p.unit)) };
  }

  // ── Starting and ending ──────────────────────────────────────────
  function startRun(opts = lastMode) {
    RA.Audio.unlock();
    if (editsDirty) { editsDirty = false; RA.Review.rebuild(Object.values(RA.Store.edits)); }
    // Prompt objects are rebuilt when review edits arrive, so look the class pool up fresh.
    if (opts.units) opts = { ...opts, pool: RA.scholaPrompts.filter((p) => opts.units.includes(p.unit)) };
    lastMode = opts;
    run = new RA.Run(mem.data, undefined, opts);
    paused = false;
    $('scrPause').hidden = true; $('scrBoon').hidden = true;
    $('feedback').innerHTML = '';
    $('scrRun').classList.toggle('schola', opts.mode === 'schola');
    show('run');
    drain();
    renderBoonStrip();
    input.value = '';
    setTimeout(() => input.focus(), 30);
  }

  function endRun(abandoned) {
    const line = abandoned ? 'You turned back. The dead will keep your place.' : RA.Sibyl.death(run, mem.data);
    mem.record(run, abandoned);
    $('endEyebrow').textContent = (abandoned ? 'You left the descent at' : 'Your descent ends at') + (run.mode === 'schola' ? ' · class mode' : '');
    $('endFloor').textContent = RA.roman(run.floor);
    $('endFloorN').textContent = `(floor ${run.floor})`;
    $('endSibyl').textContent = line;
    const s = run.stats;
    const rarest = s.best ? `<span class="t${s.best.tier}">${esc(s.best.text)}</span>` : 'None';
    const tiers = [5, 4, 3].filter((t) => s.tiers[t]).map((t) => `<span class="t${t}">${s.tiers[t]}× ${tierName(t)}</span>`).join(', ') || 'None';
    $('endStats').innerHTML = [
      ['Answers', s.answers], ['Damage dealt', s.dmg], [run.mode === 'schola' ? 'Hardest right answer' : 'Rarest word', rarest], ['Rare finds', tiers],
    ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('endMissed').innerHTML = run.missed(4).map(({ p, given, missed, drill }) => drill ? `
      <div class="missed-row">
        <div class="q">${marked(p.q)} <span class="paren">(drill)</span></div>
        <div class="lineup"><span class="lab">Right</span>${given.length ? `<span class="muted">${given.length} item${given.length > 1 ? 's' : ''}</span>` : '<span class="muted">none yet</span>'}</div>
        ${missed.length ? `<ul class="drill-missed">${missed.map((a) => `<li>${marked(a.q)} <span class="arrow">→</span> ${chip(a.text, a.tier)}${a.note ? ` <span class="muted">${esc(a.note)}</span>` : ''}</li>`).join('')}</ul>` : '<div class="lineup"><span class="lab">Missed</span><span class="muted">nothing</span></div>'}
      </div>` : `
      <div class="missed-row">
        <div class="q">${esc(p.q)}</div>
        <div class="lineup"><span class="lab">You said</span>${given.length ? given.map((a) => chip(a.text, a.tier)).join('') : '<span class="muted">nothing</span>'}</div>
        <div class="lineup"><span class="lab">Also right</span>${missed.map((a) => chip(a.text, a.tier, ` title="${tierFull(a.tier)}"`)).join('') || '<span class="muted">you found them all</span>'}</div>
      </div>`).join('');
    renderRejected();
    $('scrPause').hidden = true; $('scrBoon').hidden = true;
    show('end');
    setTimeout(() => $('btnAgain').focus(), 50);
  }

  function renderRejected() {
    const list = run.rejected.slice(-12);
    $('endRejectedWrap').hidden = !list.length;
    $('endRejected').innerHTML = list.map((r, i) => {
      const t = r.targets[0], p = RA.promptById[t.pid];
      const where = p ? (t.q ? `${marked(p.q)}: ${marked(t.q)}` : esc(p.q)) : '';
      return `<li><b class="bad">${esc(r.text)}</b> <span class="muted">for</span> ${where}
        <button type="button" class="linkish" data-flag="${i}">It should count</button></li>`;
    }).join('');
  }
  $('endRejected').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-flag]');
    if (!b || !run) return;
    const r = run.rejected.slice(-12)[Number(b.dataset.flag)];
    r.targets.forEach((t) => RA.Store.logReject(t, r.text, true));
    b.replaceWith(Object.assign(document.createElement('span'), { className: 'muted', textContent: '· flagged for review' }));
  });

  // Review edits change the question bank; rebuild it, but never in the middle of a run.
  let editsDirty = false, editSig = '';
  RA.Store.on(() => {
    const sig = Object.entries(RA.Store.edits).filter(([, e]) => e.status === 'open').map(([id, e]) => id + e.at).sort().join('|');
    if (sig === editSig) return;
    editSig = sig;
    if (screen === 'run' || screen === 'end') { editsDirty = true; return; }
    RA.Review.rebuild(Object.values(RA.Store.edits));
    if (screen === 'title') renderTitle();
  });

  // ── Events from the run ──────────────────────────────────────────
  function sibyl(line) { if (line) $('sibylText').textContent = line; }
  function drain() {
    while (run && run.events.length) handle(run.events.shift());
  }
  function handle(e) {
    switch (e.type) {
      case 'floor':
        RA.Art.setEnemy(e.enemy, e.floor);
        buildEnemy(); buildParts();
        sibyl(RA.Sibyl.floor(e.enemy, e.floor));
        RA.Audio.floor();
        break;
      case 'hit': {
        RA.Art.hit(e.part, e.dmg, e.tier, e.text);
        RA.Audio.hit(e.tier);
        const notes = [];
        if (e.typo) notes.push(`you wrote “${esc(e.typed)}”`);
        if (e.worn) notes.push('worn: one tier weaker');
        if (e.fed) notes.push('fed the Harpy');
        if (e.healed) notes.push(`+${e.healed} health`);
        if (e.mult.length) notes.push(e.mult.join(' · '));
        if (e.firstEver && e.tier >= 3) notes.push('new to your Codex');
        const what = e.q ? `<span class="muted">${marked(e.q)}</span> → ` : '';
        $('feedback').innerHTML = `${what}<span class="t${e.tier}">${esc(e.text)}</span><span class="tier t${e.tier}">${esc(tierFull(e.tier))}</span><b>−${e.dmg}</b> <span class="why">${notes.join(' · ')}</span>`;
        const pe = partEls[e.part];
        if (pe && !run.enemy.parts[e.part].drill) pe.given.insertAdjacentHTML('beforeend', chip(e.text, e.tier));
        if (pe) renderHint(e.part);
        sibyl(RA.Sibyl.hit(e));
        updateRuleLine();
        break;
      }
      case 'reject': {
        RA.Audio.reject();
        input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
        const msg = { invalid: 'not a right answer here', dup: 'already said this run', sphinx: 'out of alphabetical order', tantalus: 'too short', judge: 'first letter already used', echo: 'Echo repeats it (used in a past run)', toll: 'too common for Charon' }[e.reason];
        $('feedback').innerHTML = `<span class="bad">${esc(e.text)}</span> <span class="why">${msg}</span>`;
        if (e.reason === 'invalid' && e.targets) e.targets.forEach((t) => RA.Store.logReject(t, e.text));
        sibyl(RA.Sibyl.reject(e));
        break;
      }
      case 'reveal':
        $('feedback').innerHTML = `<span class="why">Skipped:</span> <span class="muted">${marked(e.q)}</span> → <b class="reveal">${esc(e.a)}</b>${e.note ? ` <span class="why">${esc(e.note)}</span>` : ''}`;
        break;
      case 'next':
        renderPart(e.part);
        if (e.exhausted) sibyl('You found every answer to that one. A new question.');
        break;
      case 'strike':
        RA.Art.strike(); RA.Audio.strike();
        sibyl(RA.Sibyl.strike(run));
        updateRuleLine();
        break;
      case 'blocked': RA.Art.text('Aegis (blocked)', RA.C.gold); RA.Audio.blocked(); break;
      case 'revive': RA.Art.text('Ramus Aureus (Golden Bough)', RA.C.gold); RA.Audio.revive(); sibyl(RA.Sibyl.revive()); break;
      case 'partDown': RA.Audio.partDown(); if (partEls[e.part]) partEls[e.part].card.classList.add('down'); break;
      case 'clear':
        RA.Art.defeat(); RA.Audio.clear(); sibyl(RA.Sibyl.clear(e));
        setTimeout(showBoon, 900);
        break;
      case 'boon': RA.Audio.boon(); renderBoonStrip(); break;
      case 'hint': RA.Audio.hint(); renderHint(e.part); break;
      case 'muta': RA.Audio.muta(); buildParts(); break;
      case 'dead': RA.Audio.dead(); RA.Art.defeat(true); setTimeout(() => endRun(false), 1300); break;
    }
  }

  // ── Building the fight view ──────────────────────────────────────
  function buildEnemy() {
    const en = run.enemy;
    $('enemyName').textContent = en.name;
    $('enemyEn').textContent = '(' + en.en + ')' + (en.boss ? ' · guardian' : '');
    $('enemyRules').innerHTML = en.rules.map((r) => `<span class="rule${r === en.mutated ? ' mut' : ''}" title="${esc(RA.RULES[r].text)}">${RA.RULES[r].label}</span>`).join('');
    $('btnRespice').hidden = !en.rules.includes('gorgo');
    $('hudFloor').textContent = RA.roman(run.floor);
    $('hudFloorN').textContent = `(floor ${run.floor})`;
    $('hudZone').textContent = RA.Art.zone(run.floor).label;
  }

  function partHTML(p, i, n) {
    const it = run.current(p);
    const head = n > 1 ? `<span>Caput ${RA.roman(i + 1)} (head ${i + 1})</span>` : '';
    let meta, instr, q, note;
    if (it) {
      const done = p.drill.i, total = p.drill.order.length;
      meta = head || `<span>drill · item ${done + 1} of ${total}</span>`;
      instr = it.sub || p.prompt.q;
      q = marked(it.q);
      note = '';
    } else {
      meta = head || `<span>level ${RA.roman(p.prompt.lvl)} · ${p.prompt.answers.length} answers</span>`;
      instr = '';
      q = esc(p.prompt.q);
      note = p.prompt.note;
    }
    return `
      <article class="part${p.alive ? '' : ' down'}${it ? ' drill' : ''}">
        <div class="cat"><span>${esc(catLabel(p.prompt.cat))}</span>${meta}</div>
        ${instr ? `<div class="instr">${marked(instr)}</div>` : ''}
        <div class="q">${q}</div>
        ${note ? `<div class="note">${esc(note)}</div>` : ''}
        <div class="hint" hidden></div>
        <div class="meters">
          <div class="meter"><span class="lbl"><span>enemy life</span><span class="num hp-txt"></span></span><div class="bar hp-bar"><i></i></div></div>
          <div class="meter"><span class="lbl"><span>bite (it attacks in)</span><span class="num bite-txt"></span></span><div class="bar bite-bar"><i></i></div></div>
        </div>
        <div class="given">${it ? '' : p.given.map((id) => { const a = p.prompt.answers.find((x) => x.id === id); return a ? chip(a.text, a.tier) : ''; }).join('')}</div>
      </article>`;
  }
  function refs(card) {
    return {
      card, q: card.querySelector('.q'), hint: card.querySelector('.hint'),
      hpFill: card.querySelector('.hp-bar i'), hpTxt: card.querySelector('.hp-txt'),
      bite: card.querySelector('.bite-bar'), biteFill: card.querySelector('.bite-bar i'), biteTxt: card.querySelector('.bite-txt'),
      given: card.querySelector('.given'),
    };
  }
  function buildParts() {
    const el = $('parts');
    const parts = run.enemy.parts;
    el.classList.toggle('many', parts.length > 1);
    el.innerHTML = parts.map((p, i) => partHTML(p, i, parts.length)).join('') + '<p class="rule-line" id="ruleLine"></p>';
    partEls = [...el.querySelectorAll('.part')].map(refs);
    parts.forEach((_, i) => renderHint(i));
    updateRuleLine();
    updateMutaLabel();
  }
  function renderPart(i) {
    const old = partEls[i];
    if (!old) return buildParts();
    const tmp = document.createElement('div');
    tmp.innerHTML = partHTML(run.enemy.parts[i], i, run.enemy.parts.length);
    const card = tmp.firstElementChild;
    old.card.replaceWith(card);
    partEls[i] = refs(card);
    renderHint(i);
    updateMutaLabel();
  }
  function updateMutaLabel() {
    const anyDrill = run.enemy.parts.some((p) => p.alive && run.current(p));
    $('mutaLabel').textContent = anyDrill ? 'Skip (shows the answer, costs 4s)' : 'New question (costs 4s)';
  }

  function renderHint(i) {
    const p = run.enemy.parts[i], pe = partEls[i];
    if (!pe) return;
    if (!p.hint) { pe.hint.hidden = true; return; }
    const h = p.hint;
    pe.hint.hidden = false;
    pe.hint.innerHTML = `<span class="hint-lbl">hint</span> ${esc(h.first)} ${'_ '.repeat(Math.max(0, h.len - 1))}<small>${h.len} letters · <span class="t${h.tier}">${esc(tierFull(h.tier))}</span></small>`;
  }

  function updateRuleLine() {
    const el = $('ruleLine');
    if (!el || !run) return;
    const en = run.enemy, st = en.st;
    const drills = en.parts.some((p) => p.drill);
    const bits = en.rules.map((r) => {
      let s = `${RA.RULES[r].label}: ${RA.RULES[r].text}`;
      if (r === 'sphinx' && st.lastText) s += ` Next must come after “${st.lastText}”.`;
      if (r === 'tantalus' && st.lastLen) s += ` Next must be longer than ${st.lastLen} letters.`;
      if (r === 'judge' && st.letters.size) s += ` Used: ${[...st.letters].map((l) => l.toUpperCase()).sort().join(' ')}.`;
      if (drills && ['sphinx', 'tantalus', 'judge', 'toll', 'harpy'].includes(r)) s += ' (Drills are exempt.)';
      return s;
    });
    el.textContent = bits.join(' ');
  }

  function renderBoonStrip() {
    if (!run) return;
    $('boonStrip').innerHTML = (run.mode === 'schola' ? '<span class="mode-chip">Schola (class mode)</span>' : '') + Object.entries(run.boons).map(([id, n]) => {
      const b = RA.BOONS[id];
      return `<span class="boon-chip" title="${esc(b.title + ': ' + b.text)}">${esc(b.god)} (${esc(b.title.toLowerCase())})${n > 1 ? ' ×' + n : ''}</span>`;
    }).join('');
    input.classList.toggle('blind', !!run.boons.bacchus);
  }

  function showBoon() {
    if (!run || run.phase !== 'boon') return;
    $('boonFloor').textContent = `${RA.roman(run.floor)} (floor ${run.floor})`;
    $('boonChoices').innerHTML = run.offer.map((id, i) => {
      const b = RA.BOONS[id], n = run.boons[id];
      return `<button class="boon" type="button" data-i="${i}">
        <span class="god"><span>${esc(b.god)}</span><kbd>${i + 1}</kbd></span>
        <span class="name">${esc(b.title)}</span>
        <span class="txt">${esc(b.text)}</span>
        ${n ? `<span class="owned">You have this ×${n}. Taking it again stacks.</span>` : ''}
      </button>`;
    }).join('');
    $('scrBoon').hidden = false;
    const first = $('boonChoices').querySelector('.boon');
    if (first) first.focus();
  }
  function chooseBoon(i) {
    if (!run || !run.chooseBoon(i)) return;
    $('scrBoon').hidden = true;
    drain();
    input.value = '';
    input.focus();
  }

  // ── Per-frame updates ────────────────────────────────────────────
  function updateLive() {
    const hud = `${run.anima}|${run.maxAnima}|${run.folia}|${run.boughs}`;
    if (hud !== lastHud) {
      lastHud = hud;
      $('animaTxt').textContent = `${Math.max(0, Math.round(run.anima))} / ${run.maxAnima}`;
      $('animaFill').style.width = (100 * Math.max(0, run.anima) / run.maxAnima) + '%';
      $('hudFolia').querySelector('b').textContent = run.folia;
      $('hudBough').querySelector('b').textContent = run.boughs;
      $('btnFolium').disabled = run.folia <= 0;
    }
    let petrified = false;
    run.enemy.parts.forEach((p, i) => {
      const pe = partEls[i];
      if (!pe) return;
      pe.hpFill.style.width = (100 * p.hp / p.maxHp) + '%';
      pe.hpTxt.textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
      const frac = p.alive ? Math.max(0, p.timer / p.interval) : 0;
      pe.biteFill.style.width = (100 * frac) + '%';
      pe.biteTxt.textContent = p.alive ? `${Math.ceil(p.timer)}s` : '—';
      pe.bite.classList.toggle('urgent', p.alive && p.timer < 3);
      const vis = run.promptVisible(p);
      if (!vis) petrified = true;
      pe.q.classList.toggle('stone', !vis);
    });
    RA.Art.set('petrified', petrified);
  }

  // ── Codex ────────────────────────────────────────────────────────
  function codexSection(title, prompts, d) {
    let found = 0, total = 0;
    const met = [], unmet = [];
    for (const p of prompts) {
      const ids = new Set(d.found[p.id] || []);
      found += ids.size; total += p.answers.length;
      (ids.size ? met : unmet).push([p, ids]);
    }
    const rows = met.map(([p, ids]) => {
      const got = p.answers.filter((a) => ids.has(a.id)).sort((a, b) => b.tier - a.tier || a.text.localeCompare(b.text));
      const per = [1, 2, 3, 4, 5].map((t) => {
        const all = p.answers.filter((a) => a.tier === t).length;
        return all ? `<span class="t${t}">${tierName(t)} ${got.filter((a) => a.tier === t).length}/${all}</span>` : '';
      }).join('');
      const body = p.kind === 'drill'
        ? `<ul class="drill-missed">${got.map((a) => `<li>${marked(a.q)} <span class="arrow">→</span> ${chip(a.text, a.tier)}</li>`).join('')}</ul>`
        : `<div class="given">${got.map((a) => chip(a.text + ((d.used[a.id] || 0) >= 3 ? ' · worn' : ''), a.tier)).join('')}</div>`;
      return `<details class="codex-row"><summary><span class="q">${marked(p.q)}${p.kind === 'drill' ? ' <span class="paren">(drill)</span>' : ''}</span><span class="ct">${ids.size} / ${p.answers.length}</span></summary>
        <div class="tierline">${per}</div>${body}</details>`;
    }).join('') + (unmet.length ? `<div class="codex-row muted">${unmet.length} more question${unmet.length > 1 ? 's' : ''} not met yet: ${[...new Set(unmet.map(([p]) => catLabel(p.cat)))].join(', ')}.</div>` : '');
    return { html: `<h3>${title} <span class="ct-total">${found} / ${total}</span></h3>${rows}`, found, total };
  }
  function renderCodex() {
    const d = mem.data;
    const a = codexSection('All Latin <span class="paren">(Descend mode)</span>', RA.prompts, d);
    const b = codexSection('Schola <span class="paren">(class mode)</span>', RA.scholaPrompts, d);
    $('codexList').innerHTML = a.html + b.html;
    $('codexSummary').textContent = `${a.found + b.found} of ${a.total + b.total} answers found. Each run adds the answers you gave.`;
  }

  // ── Wiring ───────────────────────────────────────────────────────
  $('btnDescend').addEventListener('click', () => startRun({ mode: 'open' }));
  $('btnSchola').addEventListener('click', () => show('schola'));
  $('btnScholaGo').addEventListener('click', () => {
    const { ids, pool } = scholaPool();
    if (!ids.length) { $('scholaRecord').textContent = 'Pick at least one topic first.'; return; }
    startRun({ mode: 'schola', pool, units: ids });
  });
  $('btnScholaAll').addEventListener('click', () => document.querySelectorAll('#unitList input').forEach((c) => { c.checked = true; }));
  $('btnAgain').addEventListener('click', () => startRun());
  $('btnHelp').addEventListener('click', () => show('help'));
  $('btnCodex').addEventListener('click', () => show('codex'));
  $('btnReview').addEventListener('click', () => show('review'));
  $('btnToTitle').addEventListener('click', () => show('title'));
  document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => show('title')));
  $('answerForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!run || paused) return;
    const v = input.value;
    run.submit(v);
    input.value = '';
    drain();
  });
  $('btnFolium').addEventListener('click', () => { if (run && !paused) { run.folium(); drain(); input.focus(); } });
  $('btnMuta').addEventListener('click', () => { if (run && !paused) { run.muta(); drain(); input.focus(); } });
  $('btnRespice').addEventListener('click', () => { if (run && !paused) { run.respice(); drain(); input.focus(); } });
  $('btnPause').addEventListener('click', () => setPaused(true));
  $('btnQuit').addEventListener('click', () => setPaused(true));
  $('btnResume').addEventListener('click', () => setPaused(false));
  $('btnPauseQuit').addEventListener('click', () => { if (run) endRun(true); });
  function syncMute() {
    $('btnMute').textContent = RA.Audio.muted ? 'Sound off' : 'Sound on';
    $('btnMute').setAttribute('aria-pressed', String(RA.Audio.muted));
  }
  $('btnMute').addEventListener('click', () => {
    RA.Audio.setMuted(!RA.Audio.muted); mem.data.muted = RA.Audio.muted; mem.save(); syncMute();
  });
  syncMute();
  $('boonChoices').addEventListener('click', (ev) => {
    const b = ev.target.closest('.boon');
    if (b) chooseBoon(Number(b.dataset.i));
  });
  $('btnForget').addEventListener('click', () => { $('forgetConfirm').hidden = false; });
  $('btnForgetNo').addEventListener('click', () => { $('forgetConfirm').hidden = true; });
  $('btnForgetYes').addEventListener('click', () => { mem.reset(); $('forgetConfirm').hidden = true; renderCodex(); });

  function setPaused(p) {
    if (!run || screen !== 'run' || run.phase === 'dead') return;
    paused = p;
    $('scrPause').hidden = !p;
    if (p) $('btnResume').focus(); else input.focus();
  }

  document.addEventListener('keydown', (ev) => {
    if (screen === 'run' && run) {
      if (!$('scrBoon').hidden && ['1', '2', '3'].includes(ev.key)) { ev.preventDefault(); chooseBoon(Number(ev.key) - 1); return; }
      if (ev.key === 'Escape') { ev.preventDefault(); setPaused(!paused); return; }
      if (paused || run.phase !== 'fight') return;
      if (ev.key === 'Tab') { ev.preventDefault(); run.muta(); drain(); input.focus(); return; }
      if (ev.key === '?') { ev.preventDefault(); run.folium(); drain(); return; }
      if (ev.key === 'ArrowUp') { ev.preventDefault(); run.respice(); drain(); return; }
      if (document.activeElement !== input && ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey) input.focus();
    } else if (screen === 'end' && ev.key === 'Enter' && document.activeElement?.tagName !== 'BUTTON') {
      ev.preventDefault(); startRun();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === 'run' && run && run.phase === 'fight' && !paused) { setPaused(true); awayPause = true; }
    else if (!document.hidden && awayPause) { awayPause = false; sibyl(RA.Sibyl.hidden()); }
  });

  // Help table rows
  const anim = RA.promptById.animalia;
  $('tierRows').innerHTML = [1, 2, 3, 4, 5].map((t) => {
    const ex = anim.answers.filter((a) => a.tier === t).slice(0, 2).map((a) => a.text).join(', ');
    return `<tr><td class="t${t}">${RA.TIERS[t].n}</td><td>${RA.TIERS[t].en}</td><td class="num">${RA.TIERS[t].dmg}</td><td><i>${esc(ex)}</i></td></tr>`;
  }).join('');

  // ── Loop ─────────────────────────────────────────────────────────
  RA.Art.init($('stageCanvas'));
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    try {
      if (screen === 'run' && run) {
        if (!paused && run.phase === 'fight' && $('scrBoon').hidden) run.tick(dt);
        drain();
        updateLive();
        RA.Art.draw(t, run, dt);
      } else if (screen === 'title') {
        RA.Art.drawTitle($('titleCanvas'), t, dt);
      }
    } catch (err) { console.error(err); }
    requestAnimationFrame(frame);
  }
  show('title');
  requestAnimationFrame(frame);
  RA.ui = { get run() { return run; }, startRun, chooseBoon, show };
})(window.RA = window.RA || {});
