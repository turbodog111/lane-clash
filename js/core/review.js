// Review edits: changes to the question bank suggested in the Tabularium (answer review) screen.
// Pure logic, no DOM or storage, so tools/apply-review.js can use it in Node too.
//
// An edit is { op, pid, key?, index?, tier?, text?, alias?, note?, status, at }:
//   tier    move an answer to another rarity tier          { key, tier }      (drill item: { index, tier })
//   alias   accept another spelling of an answer           { key, alias }     (drill item: { index, alias })
//   add     accept a new answer                            { text, tier }
//   remove  stop accepting an answer (it's wrong)          { key }            (drill item: { index })
//   note    a comment on the question, for Claude to read  { note }
// `key` is the answer's normalised first spelling (RA.norm), the same key its id uses.
// status: 'open' (not yet written into the data files), 'applied', or 'dismissed'.
(function (RA) {
  const R = {};
  const forms = (item) => item.split('/').map((x) => x.trim()).filter(Boolean);
  const safe = (s) => String(s).replace(/[^A-Za-z0-9_.~:@+-]/g, '').slice(0, 80) || 'x';

  // A stable document id, so repeating the same change overwrites rather than piles up.
  R.docId = (e) => {
    const target = e.index != null ? 'i' + e.index : e.key || RA.norm(e.text || '');
    const parts = { tier: [target], alias: [target, RA.norm(e.alias || '')], add: [RA.norm(e.text || '')], remove: [target], note: [] }[e.op] || [Date.now()];
    return [e.op, e.pid, ...parts].map(safe).join('~');
  };

  // Split an open prompt's tier strings into arrays of items.
  R.tiersOf = (src) => {
    const t = {};
    for (let tier = 1; tier <= 5; tier++) t[tier] = (src.t[tier] || '').split(',').map((x) => x.trim()).filter(Boolean);
    return t;
  };
  R.find = (tiers, key) => {
    for (let tier = 1; tier <= 5; tier++) {
      const i = tiers[tier].findIndex((item) => forms(item).some((f) => RA.norm(f) === key));
      if (i >= 0) return { tier, i };
    }
    return null;
  };

  // Returns an edited copy of `src` (or src itself when no edit touches it).
  R.applyToSrc = (src, edits) => {
    const mine = edits.filter((e) => e.pid === src.id && e.status !== 'dismissed' && e.op !== 'note').sort((a, b) => (a.at || 0) - (b.at || 0));
    if (!mine.length) return src;
    if (src.kind === 'drill') {
      const items = src.items.map((it) => ({ ...it }));
      for (const e of mine) {
        const it = items[e.index];
        if (!it) continue;
        if (e.op === 'tier' && e.tier >= 1 && e.tier <= 5) it.tier = e.tier;
        else if (e.op === 'alias' && e.alias && !forms(it.a).some((f) => RA.norm(f) === RA.norm(e.alias))) it.a += '/' + e.alias.trim();
        else if (e.op === 'remove') it.off = true;
      }
      return { ...src, items };
    }
    const tiers = R.tiersOf(src);
    for (const e of mine) {
      if (e.op === 'add') {
        const text = String(e.text || '').trim();
        if (text && !R.find(tiers, RA.norm(text)) && tiers[e.tier]) tiers[e.tier].push(text.replace(/,/g, ' '));
        continue;
      }
      const at = R.find(tiers, e.key);
      if (!at) continue;
      if (e.op === 'tier' && tiers[e.tier]) tiers[e.tier].push(...tiers[at.tier].splice(at.i, 1));
      else if (e.op === 'alias' && e.alias && !R.find(tiers, RA.norm(e.alias))) tiers[at.tier][at.i] += '/' + e.alias.trim().replace(/,/g, ' ');
      else if (e.op === 'remove') tiers[at.tier].splice(at.i, 1);
    }
    const t = {};
    for (let tier = 1; tier <= 5; tier++) t[tier] = tiers[tier].join(', ');
    return { ...src, t };
  };

  // Rebuild every prompt with the given edits applied.
  R.rebuild = (edits) => {
    const list = edits.filter((e) => e.status === 'open');
    RA.buildAll(list.length ? (src) => R.applyToSrc(src, list) : undefined);
  };

  RA.Review = R;
})(window.RA = window.RA || {});
