// Screens, input and per-frame rendering. Game rules live in js/core/run.js.
(function (RA) {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tierName = (t) => RA.TIERS[t].n.toLowerCase();
  const chip = (text, tier, extra = '') => `<span class="chip t${tier}"${extra}>${esc(text)}</span>`;

  const mem = RA.Memory;
  mem.load();
  RA.Audio.setMuted(mem.data.muted);

  const screens = { title: $('scrTitle'), run: $('scrRun'), end: $('scrEnd'), codex: $('scrCodex'), help: $('scrHelp') };
  const input = $('answer');
  let run = null, screen = 'title', paused = false, pendingBoon = false, awayPause = false;
  let partEls = [], lastHud = '';

  function show(name) {
    for (const k in screens) screens[k].hidden = k !== name;
    screen = name;
    window.scrollTo(0, 0);
    if (name === 'title') renderTitle();
    if (name === 'codex') renderCodex();
    if (name === 'run') requestAnimationFrame(() => RA.Art.resize());
  }

  // ── Title ────────────────────────────────────────────────────────
  function renderTitle() {
    $('titleSibyl').textContent = RA.Sibyl.greeting(mem.data, mem.prevLastSeen);
    const d = mem.data;
    const found = Object.values(d.found).reduce((s, l) => s + l.length, 0);
    const total = RA.prompts.reduce((s, p) => s + p.answers.length, 0);
    const rows = [
      ['Deepest descent', d.best ? 'Gradus ' + RA.roman(d.best) : 'Not yet'],
      ['Descents', String(d.runs)],
      ['Words found', `${found} of ${total}`],
      ['Rarest word', d.bestAnswer ? `<span class="t${d.bestAnswer.tier}">${esc(d.bestAnswer.text)}</span>` : 'None yet'],
    ];
    $('records').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  }

  // ── Starting and ending ──────────────────────────────────────────
  function startRun() {
    RA.Audio.unlock();
    run = new RA.Run(mem.data);
    paused = false; pendingBoon = false;
    $('scrPause').hidden = true; $('scrBoon').hidden = true;
    $('feedback').innerHTML = '';
    show('run');
    drain();
    renderBoonStrip();
    input.value = '';
    setTimeout(() => input.focus(), 30);
  }

  function endRun(abandoned) {
    const line = abandoned ? 'You turned back. The dead will keep your place.' : RA.Sibyl.death(run, mem.data);
    mem.record(run, abandoned);
    $('endEyebrow').textContent = abandoned ? 'You left the descent at' : 'Your descent ends at';
    $('endFloor').textContent = RA.roman(run.floor);
    $('endSibyl').textContent = line;
    const s = run.stats;
    const rarest = s.best ? `<span class="t${s.best.tier}">${esc(s.best.text)}</span>` : 'None';
    const tiers = [5, 4, 3].filter((t) => s.tiers[t]).map((t) => `<span class="t${t}">${s.tiers[t]}× ${tierName(t)}</span>`).join(', ') || 'None';
    $('endStats').innerHTML = [
      ['Answers', s.answers], ['Damage dealt', s.dmg], ['Rarest word', rarest], ['Rare finds', tiers],
    ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('endMissed').innerHTML = run.missed(4).map(({ p, given, missed }) => `
      <div class="missed-row">
        <div class="q">${esc(p.q)}</div>
        <div class="lineup"><span class="lab">You said</span>${given.length ? given.map((a) => chip(a.text, a.tier)).join('') : '<span class="muted">nothing</span>'}</div>
        <div class="lineup"><span class="lab">Also true</span>${missed.map((a) => chip(a.text, a.tier, ` title="${tierName(a.tier)}"`)).join('') || '<span class="muted">you found them all</span>'}</div>
      </div>`).join('');
    $('scrPause').hidden = true; $('scrBoon').hidden = true;
    show('end');
    setTimeout(() => $('btnAgain').focus(), 50);
  }

  // ── Events from the run ──────────────────────────────────────────
  function sibyl(line) { if (line) $('sibylText').textContent = line; }
  function drain() {
    while (run && run.events.length) handle(run.events.shift());
  }
  function handle(e) {
    switch (e.type) {
      case 'floor':
        RA.Art.setEnemy(e.enemy);
        buildEnemy(); buildParts();
        sibyl(RA.Sibyl.floor(e.enemy, e.floor));
        RA.Audio.floor();
        break;
      case 'hit': {
        RA.Art.hit(e.part, e.dmg, e.tier);
        RA.Audio.hit(e.tier);
        const notes = [];
        if (e.typo) notes.push(`you wrote “${esc(e.typed)}”`);
        if (e.worn) notes.push('worn: one tier weaker');
        if (e.fed) notes.push('fed the Harpy');
        if (e.healed) notes.push(`+${e.healed} anima`);
        if (e.mult.length) notes.push(e.mult.join(' · '));
        if (e.firstEver && e.tier >= 3) notes.push('new to your Codex');
        $('feedback').innerHTML = `<span class="t${e.tier}">${esc(e.text)}</span><span class="tier t${e.tier}">${tierName(e.tier)}</span><b>−${e.dmg}</b> <span class="why">${notes.join(' · ')}</span>`;
        const pe = partEls[e.part];
        if (pe) pe.given.insertAdjacentHTML('beforeend', chip(e.text, e.tier));
        if (pe && run.enemy.parts[e.part]) renderHint(e.part);
        sibyl(RA.Sibyl.hit(e));
        updateRuleLine();
        break;
      }
      case 'reject': {
        RA.Audio.reject();
        input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
        const msg = { invalid: 'not an answer here', dup: 'already said', sphinx: 'out of order', tantalus: 'too short', judge: 'letter already used', echo: 'Echo repeats it', toll: 'too common for Charon' }[e.reason];
        $('feedback').innerHTML = `<span class="bad">${esc(e.text)}</span> <span class="why">${msg}</span>`;
        sibyl(RA.Sibyl.reject(e));
        break;
      }
      case 'strike':
        RA.Art.strike(); RA.Audio.strike();
        sibyl(RA.Sibyl.strike(run));
        updateRuleLine();
        break;
      case 'blocked': RA.Art.text('Aegis', RA.C.gold); RA.Audio.blocked(); break;
      case 'revive': RA.Art.text('Ramus Aureus', RA.C.gold); RA.Audio.revive(); sibyl(RA.Sibyl.revive()); break;
      case 'partDown': RA.Audio.partDown(); if (partEls[e.part]) partEls[e.part].card.classList.add('down'); break;
      case 'clear':
        RA.Art.defeat(); RA.Audio.clear(); sibyl(RA.Sibyl.clear(e));
        pendingBoon = true;
        setTimeout(showBoon, 750);
        break;
      case 'boon': RA.Audio.boon(); renderBoonStrip(); break;
      case 'hint': RA.Audio.hint(); renderHint(e.part); break;
      case 'muta': RA.Audio.muta(); buildParts(); break;
      case 'dead': RA.Audio.dead(); setTimeout(() => endRun(false), 1100); break;
    }
  }

  // ── Building the fight view ──────────────────────────────────────
  function buildEnemy() {
    const en = run.enemy;
    $('enemyName').textContent = en.name;
    $('enemyEn').textContent = en.en + (en.boss ? ' · guardian' : '');
    $('enemyRules').innerHTML = en.rules.map((r) => `<span class="rule${r === en.mutated ? ' mut' : ''}">${RA.RULES[r].label}</span>`).join('');
    $('btnRespice').hidden = !en.rules.includes('gorgo');
    $('hudFloor').textContent = RA.roman(run.floor);
  }

  function buildParts() {
    const el = $('parts');
    const parts = run.enemy.parts;
    el.classList.toggle('many', parts.length > 1);
    el.innerHTML = parts.map((p, i) => `
      <article class="part${p.alive ? '' : ' down'}">
        <div class="cat"><span>${esc(p.prompt.cat)}</span><span>${parts.length > 1 ? 'Caput ' + RA.roman(i + 1) : RA.roman(p.prompt.lvl) + ' · ' + p.prompt.answers.length + ' answers'}</span></div>
        <div class="q">${esc(p.prompt.q)}</div>
        ${p.prompt.note ? `<div class="note">${esc(p.prompt.note)}</div>` : ''}
        <div class="hint" hidden></div>
        <div class="meters">
          <div class="meter"><span class="lbl"><span>life</span><span class="num hp-txt"></span></span><div class="bar hp-bar"><i></i></div></div>
          <div class="meter"><span class="lbl"><span>bite</span><span class="num bite-txt"></span></span><div class="bar bite-bar"><i></i></div></div>
        </div>
        <div class="given">${p.given.map((id) => { const a = p.prompt.answers.find((x) => x.id === id); return a ? chip(a.text, a.tier) : ''; }).join('')}</div>
      </article>`).join('') + '<p class="rule-line" id="ruleLine"></p>';
    partEls = [...el.querySelectorAll('.part')].map((card) => ({
      card, q: card.querySelector('.q'), hint: card.querySelector('.hint'),
      hpFill: card.querySelector('.hp-bar i'), hpTxt: card.querySelector('.hp-txt'),
      bite: card.querySelector('.bite-bar'), biteFill: card.querySelector('.bite-bar i'), biteTxt: card.querySelector('.bite-txt'),
      given: card.querySelector('.given'),
    }));
    parts.forEach((_, i) => renderHint(i));
    updateRuleLine();
  }

  function renderHint(i) {
    const p = run.enemy.parts[i], pe = partEls[i];
    if (!pe) return;
    if (!p.hint) { pe.hint.hidden = true; return; }
    const h = p.hint;
    pe.hint.hidden = false;
    pe.hint.innerHTML = `${esc(h.first)} ${'_ '.repeat(Math.max(0, h.len - 1))}<small>${h.len} letters · <span class="t${h.tier}">${tierName(h.tier)}</span></small>`;
  }

  function updateRuleLine() {
    const el = $('ruleLine');
    if (!el || !run) return;
    const en = run.enemy, st = en.st;
    const bits = en.rules.map((r) => {
      let s = RA.RULES[r].text;
      if (r === 'sphinx' && st.lastText) s += ` Next must come after “${st.lastText}”.`;
      if (r === 'tantalus' && st.lastLen) s += ` Next must be longer than ${st.lastLen} letters.`;
      if (r === 'judge' && st.letters.size) s += ` Used: ${[...st.letters].map((l) => l.toUpperCase()).sort().join(' ')}.`;
      return s;
    });
    el.textContent = bits.join(' ');
  }

  function renderBoonStrip() {
    if (!run) return;
    $('boonStrip').innerHTML = Object.entries(run.boons).map(([id, n]) => {
      const b = RA.BOONS[id];
      return `<span class="boon-chip" title="${esc(b.text)}">${esc(b.god)}${n > 1 ? ' ×' + n : ''}</span>`;
    }).join('');
    input.classList.toggle('blind', !!run.boons.bacchus);
  }

  function showBoon() {
    if (!run || run.phase !== 'boon') return;
    pendingBoon = false;
    $('boonFloor').textContent = RA.roman(run.floor);
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
      pe.biteTxt.textContent = p.alive ? `in ${Math.ceil(p.timer)}s` : '—';
      pe.bite.classList.toggle('urgent', p.alive && p.timer < 3);
      const vis = run.promptVisible(p);
      if (!vis) petrified = true;
      pe.q.classList.toggle('stone', !vis);
    });
    RA.Art.set('petrified', petrified);
  }

  // ── Codex ────────────────────────────────────────────────────────
  function renderCodex() {
    const d = mem.data;
    let found = 0, total = 0;
    const met = [], unmet = [];
    for (const p of RA.prompts) {
      const ids = new Set(d.found[p.id] || []);
      found += ids.size; total += p.answers.length;
      (ids.size ? met : unmet).push([p, ids]);
    }
    $('codexList').innerHTML = met.map(([p, ids]) => {
      const got = p.answers.filter((a) => ids.has(a.id)).sort((a, b) => b.tier - a.tier || a.text.localeCompare(b.text));
      const per = [1, 2, 3, 4, 5].map((t) => `<span class="t${t}">${tierName(t)} ${got.filter((a) => a.tier === t).length}/${p.answers.filter((a) => a.tier === t).length}</span>`).join('');
      return `<details class="codex-row"><summary><span class="q">${esc(p.q)}</span><span class="ct">${ids.size} / ${p.answers.length}</span></summary>
        <div class="tierline">${per}</div>
        <div class="given">${got.map((a) => chip(a.text + ((d.used[a.id] || 0) >= 3 ? ' · worn' : ''), a.tier)).join('')}</div></details>`;
    }).join('') + (unmet.length ? `<div class="codex-row muted">${unmet.length} more question${unmet.length > 1 ? 's' : ''} waiting deeper down: ${[...new Set(unmet.map(([p]) => p.cat))].join(', ')}.</div>` : '');
    $('codexSummary').textContent = `${found} of ${total} words found across ${RA.prompts.length} questions. Each descent adds the answers you gave.`;
  }

  // ── Wiring ───────────────────────────────────────────────────────
  $('btnDescend').addEventListener('click', startRun);
  $('btnAgain').addEventListener('click', startRun);
  $('btnHelp').addEventListener('click', () => show('help'));
  $('btnCodex').addEventListener('click', () => show('codex'));
  $('btnToTitle').addEventListener('click', () => show('title'));
  document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => show('title')));
  $('answerForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!run || paused) return;
    run.submit(input.value);
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
  $('btnMute').addEventListener('click', () => {
    const m = !RA.Audio.muted;
    RA.Audio.setMuted(m); mem.data.muted = m; mem.save();
    $('btnMute').setAttribute('aria-pressed', String(m));
  });
  $('btnMute').setAttribute('aria-pressed', String(RA.Audio.muted));
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
        RA.Art.draw(t, run);
      } else if (screen === 'title') {
        RA.Art.drawTitle($('titleCanvas'), t);
      }
    } catch (err) { console.error(err); }
    requestAnimationFrame(frame);
  }
  show('title');
  requestAnimationFrame(frame);
  RA.ui = { get run() { return run; }, startRun, chooseBoon, show };
})(window.RA = window.RA || {});
