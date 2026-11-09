// Tabularium (answer review): browse every question, re-tier answers, add spellings and answers,
// and sort through guesses the game rejected. Edits apply to the game at once (js/core/review.js)
// and are kept by js/store.js until Claude writes them into the data files.
(function (RA) {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const marked = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<mark>$1</mark>');
  const tierFull = (t) => `${RA.TIERS[t].n} (${RA.TIERS[t].en})`;
  const S = RA.Store, R = RA.Review;
  const TIERS6 = () => Array.from({ length: RA.MAXT }, (_, i) => i + 1);

  let tab = 'questions', pid = null, selKey = null, query = '', showHandled = false, showDrills = false;
  try { const saved = JSON.parse(localStorage.getItem('raraAvis.reviewView') || '{}'); tab = saved.tab || tab; pid = saved.pid || null; } catch (e) { /* ignore */ }
  const remember = () => { try { localStorage.setItem('raraAvis.reviewView', JSON.stringify({ tab, pid })); } catch (e) { /* ignore */ } };

  // Source prompt (unedited) by id, for showing what changed.
  function srcById(id) {
    for (const s of RA.PROMPT_SRC) if (s.id === id) return s;
    for (const u of RA.SCHOLA_UNITS || []) for (const s of u.prompts) if (s.id === id) return s;
    return null;
  }
  const editsFor = (id) => Object.entries(S.edits).filter(([, e]) => e.pid === id && e.status !== 'dismissed');
  const allPrompts = () => [...RA.prompts, ...RA.scholaPrompts];

  // ── Status line ─────────────────────────────────────────────────
  function status() {
    const bits = [];
    if (S.mode === 'shared') bits.push(S.canEdit ? 'Changes are saved with this artifact, where Claude can read them.' : 'You can look, but only the owner and editors can change answers here. Rejected guesses are still recorded.');
    else bits.push('Changes are saved in this browser only. Use “Export” on the Your changes tab to send them to Claude.');
    if (S.loading) bits.push('Loading…');
    if (S.error) bits.push(`<span class="bad">${esc(S.error)}</span>`);
    $('revStatus').innerHTML = bits.join(' ');
    const open = Object.values(S.edits).filter((e) => e.status === 'open').length;
    const rej = Object.values(S.rejects).filter((r) => r.status === 'new' && (r.index == null || r.flag || showDrills)).length;
    $('revTabRejects').textContent = `Rejected guesses (${rej})`;
    $('revTabChanges').textContent = `Your changes (${open})`;
  }

  // ── Questions tab ───────────────────────────────────────────────
  function pickerHTML() {
    const q = RA.norm(query);
    const match = (p) => !q || RA.norm(p.q + ' ' + p.cat + ' ' + p.id).includes(q) || p.answers.some((a) => a.keys.some((k) => k.includes(q)) || (a.q && RA.norm(a.q).includes(q)));
    const groups = [['All Latin, level I', RA.prompts.filter((p) => p.lvl === 1)], ['All Latin, level II', RA.prompts.filter((p) => p.lvl === 2)], ['All Latin, level III', RA.prompts.filter((p) => p.lvl === 3)],
      ...RA.schola.map((u) => [`Schola: ${u.la} (${u.title.toLowerCase()})`, u.prompts])];
    let html = '';
    for (const [label, list] of groups) {
      const hits = list.filter(match);
      if (!hits.length) continue;
      html += `<div class="rev-group"><div class="rev-group-lbl">${esc(label)}</div>${hits.map((p) => {
        const n = editsFor(p.id).filter(([, e]) => e.status === 'open').length;
        return `<button type="button" class="rev-q${p.id === pid ? ' on' : ''}" data-act="pick" data-pid="${p.id}"><span>${marked(p.q)}${p.kind === 'drill' ? ' <span class="paren">(drill)</span>' : ''}</span><span class="rev-n">${p.answers.length}${n ? ` · <b>${n} change${n > 1 ? 's' : ''}</b>` : ''}</span></button>`;
      }).join('')}</div>`;
    }
    return html || '<p class="muted">No question or answer matches that.</p>';
  }

  function tierButtons(cur, attrs) {
    return `<span class="tier-btns">${TIERS6().map((t) => `<button type="button" class="tb t${t}${t === cur ? ' on' : ''}" data-tier="${t}" ${attrs} title="${tierFull(t)}">${t}</button>`).join('')}</span>`;
  }

  function openPromptHTML(p) {
    const src = srcById(p.id);
    const origTier = new Map();
    if (src && src.t) for (let t = 1; t <= RA.MAXT; t++) for (const item of (src.t[t] || '').split(',')) { const f = item.split('/')[0].trim(); if (f) origTier.set(RA.norm(f), t); }
    const mine = editsFor(p.id);
    const removed = mine.filter(([, e]) => e.op === 'remove' && e.status === 'open');
    const note = (mine.find(([, e]) => e.op === 'note') || [])[1];
    const ro = !S.canEdit;
    const sel = selKey && p.answers.find((a) => a.keys[0] === selKey);
    let html = '';
    for (let t = 1; t <= RA.MAXT; t++) {
      const list = p.answers.filter((a) => a.tier === t).sort((a, b) => a.text.localeCompare(b.text));
      html += `<div class="rev-tier"><div class="rev-tier-lbl"><span class="t${t}">${tierFull(t)}</span> <span class="muted">${RA.TIERS[t].dmg} damage · ${list.length}</span></div><div class="rev-chips">${list.map((a) => {
        const k = a.keys[0], was = origTier.get(k);
        const moved = was && was !== t, added = !was;
        const extra = a.forms.length - 1;
        return `<button type="button" class="chip t${t} rev-chip${k === selKey ? ' sel' : ''}${moved || added ? ' changed' : ''}" data-act="sel" data-key="${k}">${esc(a.text)}${extra ? `<small> +${extra}</small>` : ''}${moved ? `<small> (was ${was})</small>` : added ? '<small> (new)</small>' : ''}</button>`;
      }).join('') || '<span class="muted">none</span>'}</div>
      ${sel && sel.tier === t ? answerEditorHTML(p, sel, ro) : ''}</div>`;
    }
    if (removed.length) html += `<p class="rev-removed">Removed: ${removed.map(([id, e]) => `<span class="strike">${esc(e.answer || e.key)}</span> <button type="button" class="linkish" data-act="undo" data-id="${id}">undo</button>`).join(', ')}</p>`;
    if (!ro) html += `<form class="rev-add" data-act="add">
        <label>Add a right answer <input name="text" type="text" autocomplete="off" spellcheck="false" placeholder="e.g. ${esc(p.lang === 'en' ? 'a word' : 'verbum')}"></label>
        <label>Tier <select name="tier">${TIERS6().map((t) => `<option value="${t}"${t === 3 ? ' selected' : ''}>${t} · ${RA.TIERS[t].n} (${RA.TIERS[t].en})</option>`).join('')}</select></label>
        <button class="btn small primary" type="submit">Add</button>
      </form>`;
    html += noteHTML(p, note, ro);
    return html;
  }

  function answerEditorHTML(p, a, ro) {
    const spellings = a.forms.length > 1 ? `<span class="muted">Accepted spellings: ${esc(a.forms.join(', '))}</span>` : '<span class="muted">One accepted spelling.</span>';
    const pl = a.plurals ? ` <span class="muted">· also counts: ${esc(a.plurals.join(', '))}</span>` : '';
    if (ro) return `<div class="rev-editor">${spellings}${pl}</div>`;
    return `<div class="rev-editor" data-key="${a.keys[0]}">
      <div><b>${esc(a.text)}</b> ${spellings}${pl}</div>
      <div class="rev-row"><span class="lab">Rarity</span>${tierButtons(a.tier, `data-act="tier" data-key="${a.keys[0]}"`)}</div>
      <form class="rev-row" data-act="alias" data-key="${a.keys[0]}"><span class="lab">Also accept</span><input name="alias" type="text" autocomplete="off" spellcheck="false" placeholder="another spelling or form"><button class="btn small" type="submit">Add spelling</button></form>
      <div class="rev-row"><button type="button" class="btn small danger" data-act="remove" data-key="${a.keys[0]}" data-answer="${esc(a.text)}">Not right here: remove</button></div>
    </div>`;
  }

  function drillPromptHTML(p) {
    const src = srcById(p.id);
    const mine = editsFor(p.id).filter(([, e]) => e.status === 'open');
    const removed = mine.filter(([, e]) => e.op === 'remove');
    const ro = !S.canEdit;
    const rows = p.answers.map((a) => {
      const orig = src && src.items[a.index];
      const changed = mine.some(([, e]) => e.index === a.index);
      return `<tr class="${changed ? 'changed' : ''}">
        <td>${marked(a.q)}${a.sub ? `<div class="muted">${esc(a.sub)}</div>` : ''}</td>
        <td><b>${esc(a.text)}</b>${a.forms.length > 1 || a.forms[0] !== a.text ? `<div class="muted">accepts ${esc(a.forms.join(' / '))}</div>` : ''}</td>
        <td>${ro ? a.tier : tierButtons(a.tier, `data-act="tier" data-index="${a.index}"`)}${orig && orig.tier !== a.tier ? `<div class="muted">was ${orig.tier}</div>` : ''}</td>
        <td>${ro ? '' : `<form class="rev-inline" data-act="alias" data-index="${a.index}"><input name="alias" type="text" autocomplete="off" spellcheck="false" placeholder="also accept…" aria-label="Also accept for ${esc(a.q)}"><button class="btn small" type="submit">Add</button></form>
          <button type="button" class="linkish danger" data-act="remove" data-index="${a.index}" data-answer="${esc(a.q + ' → ' + a.text)}">remove item</button>`}</td>
      </tr>`;
    }).join('');
    let html = `<p class="muted">Drill items need exact answers. The number is difficulty (1 easy … 5 hard): easier items come first in a drill, and harder ones hit harder.</p>
      <div class="rev-table-wrap"><table class="rev-table"><thead><tr><th>Item</th><th>Answer</th><th>Difficulty</th><th>Fix</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    if (removed.length) html += `<p class="rev-removed">Removed: ${removed.map(([id, e]) => `<span class="strike">${marked(e.answer || 'item ' + e.index)}</span> <button type="button" class="linkish" data-act="undo" data-id="${id}">undo</button>`).join(', ')}</p>`;
    html += noteHTML(p, (editsFor(p.id).find(([, e]) => e.op === 'note') || [])[1], ro);
    return html;
  }

  function noteHTML(p, note, ro) {
    if (ro) return note ? `<p class="rev-note-ro"><b>Note:</b> ${esc(note.note)}</p>` : '';
    return `<form class="rev-note" data-act="note">
      <label for="revNote">Note for Claude about this question <span class="paren">(wording, missing answers, anything)</span></label>
      <textarea id="revNote" name="note" rows="2" placeholder="e.g. “Accept plurals”, “Tier 1 is too generous”">${esc(note ? note.note : '')}</textarea>
      <button class="btn small" type="submit">Save note</button>${note ? ' <span class="muted">saved</span>' : ''}
    </form>`;
  }

  function renderQuestions() {
    $('revList').innerHTML = pickerHTML();
    const p = pid && RA.promptById[pid];
    if (!p) { $('revBody').innerHTML = '<p class="muted rev-empty">Pick a question to see every answer it accepts.</p>'; return; }
    $('revBody').innerHTML = `<div class="rev-head">
        <div class="cat"><span>${esc(p.cat)}</span><span>${p.kind === 'drill' ? 'drill' : 'open question'} · level ${RA.roman(p.lvl)} · <code>${esc(p.id)}</code></span></div>
        <h3 class="q">${marked(p.q)}</h3>${p.note ? `<div class="note">${esc(p.note)}</div>` : ''}
      </div>${p.kind === 'drill' ? drillPromptHTML(p) : openPromptHTML(p)}`;
  }

  // ── Rejected guesses tab ────────────────────────────────────────
  function nearest(p, text) {
    const k = RA.norm(text);
    return p.answers.map((a) => ({ a, d: Math.min(...a.keys.map((x) => RA.lev(k, x, 6))) })).sort((x, y) => x.d - y.d);
  }
  function renderRejects() {
    S.watchRejects();
    const rows = Object.entries(S.rejects).filter(([, r]) => (showHandled || r.status === 'new') && (showDrills || r.index == null || r.flag))
      .sort(([, a], [, b]) => (b.flag - a.flag) || (b.n - a.n) || (b.last - a.last));
    const ro = !S.canEdit;
    $('revRejectList').innerHTML = rows.length ? rows.map(([id, r]) => {
      const p = RA.promptById[r.pid];
      if (!p) return '';
      const item = r.index != null ? p.answers.find((a) => a.index === r.index) : null;
      const where = item ? `${marked(p.q)}: ${marked(item.q)} <span class="muted">(answer: ${esc(item.text)})</span>` : marked(p.q);
      let acts = '';
      if (!ro && r.status === 'new') {
        if (r.index != null) acts = `<button type="button" class="btn small primary" data-act="rj-alias-item" data-id="${id}">Accept as another right answer</button>`;
        else {
          const near = nearest(p, r.text).slice(0, 12);
          acts = `<span class="rev-row"><span class="lab">Accept at tier</span>${tierButtons(0, `data-act="rj-add" data-id="${id}"`)}</span>
            <form class="rev-row" data-act="rj-alias" data-id="${id}"><span class="lab">or a spelling of</span><select name="key">${near.map(({ a }) => `<option value="${a.keys[0]}">${esc(a.text)}</option>`).join('')}</select><button class="btn small" type="submit">Link</button></form>`;
        }
        acts += ` <button type="button" class="btn small ghost" data-act="rj-dismiss" data-id="${id}">Wrong: dismiss</button>`;
      } else if (r.status !== 'new') acts = `<span class="muted">${r.status === 'done' ? 'accepted' : 'dismissed'}</span>${ro ? '' : ` <button type="button" class="linkish" data-act="rj-reopen" data-id="${id}">reopen</button>`}`;
      return `<div class="rev-reject${r.flag ? ' flagged' : ''}">
        <div><b class="guess">${esc(r.text)}</b> <span class="muted">×${r.n || 1}</span>${r.flag ? ' <span class="flag">flagged: “should count”</span>' : ''}</div>
        <div class="where">${where}</div>
        <div class="acts">${acts}</div>
      </div>`;
    }).join('') : `<p class="muted">${S.loading ? 'Loading…' : 'No rejected guesses yet. Every guess the game doesn’t accept is collected here, so you can tell whether it should have counted.'}</p>`;
  }

  // ── Changes tab ─────────────────────────────────────────────────
  function describe(e) {
    const p = RA.promptById[e.pid];
    const q = p ? p.q : e.pid;
    const what = {
      tier: () => `${esc(e.answer || e.key)} → tier ${e.tier} (${esc(RA.TIERS[e.tier].n)})`,
      alias: () => `accept <b>${esc(e.alias)}</b> as a spelling of ${esc(e.answer || e.key)}`,
      add: () => `new answer <b>${esc(e.text)}</b> at tier ${e.tier}`,
      remove: () => `remove ${marked(e.answer || e.key)}`,
      note: () => `note: “${esc(e.note)}”`,
    }[e.op];
    return `<span class="muted">${marked(q)}:</span> ${what ? what() : esc(e.op)}`;
  }
  function renderChanges() {
    const rows = Object.entries(S.edits).sort(([, a], [, b]) => (b.at || 0) - (a.at || 0));
    $('revChangeList').innerHTML = rows.length ? `<ul class="rev-changes">${rows.map(([id, e]) => `<li class="${e.status}">${describe(e)}
      ${e.status === 'open' ? (S.canEdit ? ` <button type="button" class="linkish" data-act="undo" data-id="${id}">undo</button>` : '') : ` <span class="muted">(${e.status === 'applied' ? 'written into the game files' : e.status})</span>`}</li>`).join('')}</ul>` : '<p class="muted">No changes yet.</p>';
    $('revExport').hidden = S.mode === 'shared';
    $('revSharedNote').hidden = S.mode !== 'shared';
  }

  // ── Render & tabs ───────────────────────────────────────────────
  function render() {
    if ($('scrReview').hidden) return;
    status();
    for (const [k, el] of [['questions', 'revQuestions'], ['rejects', 'revRejects'], ['changes', 'revChanges']]) {
      $(el).hidden = tab !== k;
      $('revTab' + k[0].toUpperCase() + k.slice(1)).setAttribute('aria-selected', String(tab === k));
    }
    if (tab === 'questions') renderQuestions();
    else if (tab === 'rejects') renderRejects();
    else renderChanges();
  }
  // Keep typed-but-unsent text when a live update re-renders.
  function renderKeepingFocus() {
    const a = document.activeElement;
    if (a && $('scrReview').contains(a) && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT')) { status(); return; }
    render();
  }
  S.on(renderKeepingFocus);

  const save = (e) => S.putEdit(e).then(() => { RA.Review.rebuild(Object.values(S.edits)); render(); }, () => render());

  $('scrReview').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-act]');
    if (!b || b.tagName === 'FORM') return;
    const act = b.dataset.act, p = pid && RA.promptById[pid];
    if (act === 'tab') { tab = b.dataset.tab; remember(); render(); return; }
    if (act === 'pick') { pid = b.dataset.pid; selKey = null; remember(); render(); $('revBody').scrollIntoView({ block: 'nearest' }); return; }
    if (act === 'sel') { selKey = selKey === b.dataset.key ? null : b.dataset.key; render(); return; }
    if (act === 'undo') { S.delEdit(b.dataset.id).then(() => { RA.Review.rebuild(Object.values(S.edits)); render(); }); return; }
    if (!S.canEdit) return;
    if (act === 'tier' && p) {
      const tier = Number(b.dataset.tier);
      if (b.dataset.index != null) save({ op: 'tier', pid, index: Number(b.dataset.index), tier, answer: (p.answers.find((a) => a.index === Number(b.dataset.index)) || {}).q });
      else save({ op: 'tier', pid, key: b.dataset.key, tier, answer: (p.answers.find((a) => a.keys[0] === b.dataset.key) || {}).text });
    } else if (act === 'remove' && p) {
      if (b.dataset.index != null) save({ op: 'remove', pid, index: Number(b.dataset.index), answer: b.dataset.answer });
      else { selKey = null; save({ op: 'remove', pid, key: b.dataset.key, answer: b.dataset.answer }); }
    } else if (act.startsWith('rj-')) {
      const id = b.dataset.id, r = S.rejects[id];
      if (!r) return;
      if (act === 'rj-dismiss') S.setReject(id, { status: 'dismissed' });
      else if (act === 'rj-reopen') S.setReject(id, { status: 'new' });
      else if (act === 'rj-add') { save({ op: 'add', pid: r.pid, text: r.text, tier: Number(b.dataset.tier) }); S.setReject(id, { status: 'done' }); }
      else if (act === 'rj-alias-item') {
        const q = RA.promptById[r.pid], it = q && q.answers.find((a) => a.index === r.index);
        save({ op: 'alias', pid: r.pid, index: r.index, alias: r.text, answer: it ? it.q : '' });
        S.setReject(id, { status: 'done' });
      }
    }
  });

  $('scrReview').addEventListener('submit', (ev) => {
    const f = ev.target.closest('form[data-act]');
    if (!f) return;
    ev.preventDefault();
    if (!S.canEdit) return;
    const act = f.dataset.act, p = pid && RA.promptById[pid], data = new FormData(f);
    if (act === 'add' && p) {
      const text = String(data.get('text') || '').trim();
      if (!RA.norm(text)) return;
      const dup = p.answers.find((a) => a.keys.includes(RA.norm(text)));
      if (dup) { selKey = dup.keys[0]; render(); return; }
      save({ op: 'add', pid, text, tier: Number(data.get('tier')) });
    } else if (act === 'alias' && p) {
      const alias = String(data.get('alias') || '').trim();
      if (!RA.norm(alias)) return;
      if (f.dataset.index != null) {
        const it = p.answers.find((a) => a.index === Number(f.dataset.index));
        save({ op: 'alias', pid, index: Number(f.dataset.index), alias, answer: it ? it.q : '' });
      } else {
        const a = p.answers.find((x) => x.keys[0] === f.dataset.key);
        save({ op: 'alias', pid, key: f.dataset.key, alias, answer: a ? a.text : '' });
      }
    } else if (act === 'note' && p) {
      const note = String(data.get('note') || '').trim();
      const existing = editsFor(pid).find(([, e]) => e.op === 'note');
      if (!note && existing) S.delEdit(existing[0]).then(render);
      else if (note) save({ op: 'note', pid, note });
    } else if (act === 'rj-alias') {
      const id = f.dataset.id, r = S.rejects[id];
      const q = r && RA.promptById[r.pid];
      const a = q && q.answers.find((x) => x.keys[0] === data.get('key'));
      if (!a) return;
      save({ op: 'alias', pid: r.pid, key: a.keys[0], alias: r.text, answer: a.text });
      S.setReject(id, { status: 'done' });
    }
  });

  let searchTimer = 0;
  $('revSearch').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { query = $('revSearch').value; $('revList').innerHTML = pickerHTML(); }, 120);
  });
  $('revShowHandled').addEventListener('change', () => { showHandled = $('revShowHandled').checked; render(); });
  $('revShowDrills').addEventListener('change', () => { showDrills = $('revShowDrills').checked; render(); });
  $('revExport').addEventListener('click', () => {
    const blob = new Blob([S.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'rara-avis-review.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    $('revExportText').hidden = false;
    $('revExportText').value = S.exportJSON();
  });

  RA.reviewUI = { render, open(id) { if (id) { pid = id; tab = 'questions'; } render(); } };
})(window.RA = window.RA || {});
