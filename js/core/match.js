// Answer normalisation, prompt building and matching. No DOM here.
(function (RA) {
  RA.TIERS = [
    null,
    { n: 'Vulgaris',   en: 'common',          dmg: 10, cls: 't1' },
    { n: 'Insolitus',  en: 'uncommon',        dmg: 18, cls: 't2' },
    { n: 'Rarus',      en: 'rare',            dmg: 30, cls: 't3' },
    { n: 'Rarissimus', en: 'very rare',       dmg: 50, cls: 't4' },
    { n: 'Rara Avis',  en: 'one in a million', dmg: 80, cls: 't5' },
  ];

  // Lower-case, strip accents and macrons, j→i, v→u, drop everything but letters and digits.
  RA.norm = function (s) {
    return String(s || '')
      .toLowerCase()
      .replace(/æ/g, 'ae').replace(/œ/g, 'oe')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/j/g, 'i').replace(/v/g, 'u')
      .replace(/[^a-z0-9]/g, '');
  };

  const GEN = {
    v1: (w) => (/or$/.test(w) ? [w.replace(/or$/, 'ari')] : /o$/.test(w) ? [w.replace(/o$/, 'are')] : []),
    v2: (w) => (/eor$/.test(w) ? [w.replace(/eor$/, 'eri')] : /eo$/.test(w) ? [w.replace(/eo$/, 'ere')] : []),
  };

  const splitForms = (str) => str.split('/').map((x) => x.trim()).filter(Boolean);

  RA.buildPrompt = function (src) {
    const p = { id: src.id, lvl: src.lvl, lang: src.lang, cat: src.cat, q: src.q, note: src.note || '', kind: src.kind || 'open',
                exact: !!src.exact || src.kind === 'drill', answers: [], map: new Map() };
    if (p.kind === 'drill') {
      src.items.forEach((it, i) => {
        const forms = splitForms(it.a);
        const keys = [...new Set(forms.map(RA.norm))].filter(Boolean);
        p.answers.push({ q: it.q, sub: it.sub || '', note: it.note || '', text: it.show || forms[0], first: forms[0].replace(/^-/, ''), tier: it.tier, keys, id: p.id + ':' + i, prompt: p.id, index: i });
      });
      p.keys = [];
      return p;
    }
    for (let tier = 1; tier <= 5; tier++) {
      const line = src.t[tier];
      if (!line) continue;
      for (const item of line.split(',')) {
        const forms = splitForms(item);
        if (!forms.length) continue;
        const extra = src.gen ? forms.flatMap(GEN[src.gen]) : [];
        const keys = [...new Set([...forms, ...extra].map(RA.norm))].filter(Boolean);
        const a = { text: forms[0], tier, keys, id: p.id + ':' + keys[0], prompt: p.id };
        p.answers.push(a);
        for (const k of keys) if (!p.map.has(k)) p.map.set(k, a);
      }
    }
    p.keys = [...p.map.keys()];
    return p;
  };

  // Drill items: exact match only (in grammar, one letter is the whole point).
  RA.matchItem = function (item, raw) {
    const key = RA.norm(raw);
    return key && item.keys.includes(key) ? { a: item, typo: false } : null;
  };

  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let rowMin = i;
      for (let j = 1; j <= b.length; j++) {
        const c = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        cur.push(c);
        if (c < rowMin) rowMin = c;
      }
      if (rowMin > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }
  RA.lev = lev;

  // Returns { a: answer, typo: bool } or null.
  RA.match = function (p, raw, allowTypo = true) {
    const key = RA.norm(raw);
    if (!key) return null;
    if (p.map.has(key)) return { a: p.map.get(key), typo: false };
    if (p.lang === 'en') {
      for (const k of [key.replace(/es$/, ''), key.replace(/s$/, '')]) {
        if (k !== key && p.map.has(k)) return { a: p.map.get(k), typo: false };
      }
    }
    if (allowTypo && !p.exact && key.length >= 5) {
      const max = key.length >= 9 ? 2 : 1;
      let best = null, bd = max + 1;
      for (const k of p.keys) {
        if (k.length < 4) continue;
        const d = lev(key, k, max);
        if (d < bd) { bd = d; best = p.map.get(k); }
      }
      if (best && bd <= max) return { a: best, typo: true };
    }
    return null;
  };

  RA.roman = function (n) {
    if (n <= 0) return 'N';
    const t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let s = '';
    for (const [v, r] of t) while (n >= v) { s += r; n -= v; }
    return s;
  };

  RA.prompts = RA.PROMPT_SRC.map(RA.buildPrompt);
  RA.schola = (RA.SCHOLA_UNITS || []).map((u) => ({ ...u, prompts: u.prompts.map(RA.buildPrompt) }));
  RA.scholaPrompts = RA.schola.flatMap((u) => u.prompts.map((p) => Object.assign(p, { unit: u.id })));
  RA.promptById = Object.fromEntries([...RA.prompts, ...RA.scholaPrompts].map((p) => [p.id, p]));
})(window.RA = window.RA || {});
