// Where review edits and rejected guesses are kept.
// Inside the published Claude artifact: the artifact's shared database, so Claude can read them.
// Opened as a plain file: this browser's localStorage, with an export button.
(function (RA) {
  const LOCAL_KEY = 'raraAvis.review.v1';
  const S = {
    mode: 'local',          // 'local' | 'shared'
    canEdit: true,          // may change the question bank (owner / editors in shared mode)
    canLog: true,           // may record rejected guesses
    edits: {}, rejects: {},
    loading: false, error: '',
  };
  const subs = new Set();
  const changed = () => subs.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  S.on = (f) => { subs.add(f); return () => subs.delete(f); };

  let db = null;
  function loadLocal() {
    try {
      const d = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
      S.edits = d.edits || {}; S.rejects = d.rejects || {};
    } catch (e) { S.edits = {}; S.rejects = {}; }
  }
  function saveLocal() {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify({ edits: S.edits, rejects: S.rejects })); } catch (e) { /* storage blocked */ }
  }
  loadLocal();

  // One write at a time per document.
  const queues = new Map();
  function queued(path, fn) {
    const prev = queues.get(path) || Promise.resolve();
    const next = prev.catch(() => {}).then(fn);
    queues.set(path, next);
    next.finally(() => { if (queues.get(path) === next) queues.delete(path); });
    return next;
  }

  S.putEdit = async (e) => {
    const id = RA.Review.docId(e);
    const doc = { ...e, status: e.status || 'open', at: Date.now() };
    S.edits[id] = doc;
    changed();
    if (S.mode === 'shared') {
      try { await queued('edits/' + id, () => db.collection('edits').doc(id).set(doc)); }
      catch (err) { S.error = 'Could not save that change (' + (err.code || 'error') + ').'; delete S.edits[id]; changed(); throw err; }
    } else saveLocal();
    return id;
  };
  S.delEdit = async (id) => {
    const old = S.edits[id];
    delete S.edits[id];
    changed();
    if (S.mode === 'shared') {
      try { await queued('edits/' + id, () => db.collection('edits').doc(id).delete()); }
      catch (err) { S.edits[id] = old; S.error = 'Could not undo that change.'; changed(); }
    } else saveLocal();
  };

  // A guess the game didn't accept. target: { pid, index? } (index for drill items).
  S.rejectId = (target, text) => [target.pid, target.index != null ? 'i' + target.index : '', RA.norm(text).slice(0, 60) || 'x']
    .filter(Boolean).map((s) => String(s).replace(/[^A-Za-z0-9_.~:@+-]/g, '')).join('~');
  S.logReject = (target, text, flag = false) => {
    if (!S.canLog || !RA.norm(text)) return;
    const id = S.rejectId(target, text);
    const write = async () => {
      let cur = S.rejects[id];
      if (S.mode === 'shared') {
        const snap = await db.collection('rejects').doc(id).get();
        if (snap.exists) cur = snap.data();
      }
      const doc = {
        pid: target.pid, index: target.index != null ? target.index : null, text: String(text).trim().slice(0, 80),
        n: (cur ? cur.n || 0 : 0) + (flag ? 0 : 1), last: Date.now(), flag: !!(flag || (cur && cur.flag)),
        status: cur && cur.status === 'done' ? 'done' : cur && cur.status === 'dismissed' && !flag ? 'dismissed' : 'new',
      };
      S.rejects[id] = doc;
      if (S.mode === 'shared') await db.collection('rejects').doc(id).set(doc);
      else { saveLocal(); changed(); }
    };
    return queued('rejects/' + id, write).catch((err) => {
      if (err && err.code === 'invalid_argument') S.canLog = false;   // this viewer may not write
    });
  };
  S.setReject = (id, patch) => {
    const cur = S.rejects[id];
    if (!cur) return;
    const doc = { ...cur, ...patch };
    S.rejects[id] = doc;
    changed();
    if (S.mode === 'shared') return queued('rejects/' + id, () => db.collection('rejects').doc(id).set(doc)).catch(() => {});
    saveLocal();
  };

  // Rejected guesses are only needed on the review screen; subscribe when it first opens.
  let rejectsUnsub = null;
  S.watchRejects = () => {
    if (S.mode !== 'shared' || rejectsUnsub) return;
    rejectsUnsub = () => {};
    S.loading = true;
    const timer = setTimeout(() => { S.error = 'The shared review list can’t be reached yet; what you see may be out of date.'; changed(); }, 10000);
    rejectsUnsub = db.collection('rejects').onSnapshot((snap) => {
      S.rejects = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
      if (!snap.metadata.fromCache) { clearTimeout(timer); S.loading = false; if (S.error.startsWith('The shared')) S.error = ''; }
      changed();
    }, (err) => { clearTimeout(timer); S.loading = false; S.error = 'Rejected guesses could not be loaded (' + err.code + ').'; changed(); });
  };

  S.exportJSON = () => JSON.stringify({ exported: new Date().toISOString(), edits: Object.entries(S.edits).map(([id, e]) => ({ id, ...e })), rejects: Object.entries(S.rejects).map(([id, r]) => ({ id, ...r })) }, null, 2);

  // Connect to the artifact database when the page runs inside Claude.
  S.ready = (async () => {
    if (!(window.claude && typeof window.claude.use === 'function')) return;
    try { db = await window.claude.use('db'); } catch (e) { db = null; }
    if (!db) return;
    let user = null;
    try { user = await window.claude.use('user'); } catch (e) { user = null; }
    S.mode = 'shared';
    S.edits = {}; S.rejects = {};
    if (user) {
      try { S.canEdit = await user.canEdit(); } catch (e) { S.canEdit = false; }
      try { const w = await user.can('data.write'); if (w === false) S.canLog = false; } catch (e) { /* unknown: let writes decide */ }
    } else S.canEdit = false;
    const timer = setTimeout(() => { if (S.loading) { S.error = 'The shared review list can’t be reached yet.'; changed(); } }, 10000);
    S.loading = true;
    db.collection('edits').onSnapshot((snap) => {
      S.edits = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
      if (!snap.metadata.fromCache) { clearTimeout(timer); S.loading = false; }
      changed();
    }, (err) => { clearTimeout(timer); S.loading = false; S.error = 'Review changes could not be loaded (' + err.code + ').'; changed(); });
    changed();
  })();

  RA.Store = S;
})(window.RA = window.RA || {});
