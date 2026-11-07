// What the Sibyl remembers between descents. Lives in this browser's localStorage only.
(function (RA) {
  const KEY = 'raraAvis.memory.v1';
  const blank = () => ({
    v: 1, runs: 0, best: 0, bestAnswer: null, abandoned: 0, totalAnswers: 0,
    used: {},   // answer id → number of past runs it was used in
    found: {},  // prompt id → [answer ids ever given]
    firstSeen: Date.now(), lastSeen: 0, lastFloor: 0, muted: false,
  });

  const Memory = {
    data: blank(),
    prevLastSeen: 0,
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) this.data = Object.assign(blank(), JSON.parse(raw));
      } catch (e) { /* storage unavailable: play without memory */ }
      this.prevLastSeen = this.data.lastSeen;
      this.data.lastSeen = Date.now();
      this.save();
      return this.data;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
    },
    // Called when a run ends (death or abandon).
    record(run, abandoned) {
      const d = this.data;
      d.runs++;
      if (abandoned) d.abandoned++;
      d.lastFloor = run.floor;
      d.best = Math.max(d.best, run.floor);
      d.totalAnswers += run.stats.answers;
      const b = run.stats.best;
      if (b && (!d.bestAnswer || b.tier > d.bestAnswer.tier)) d.bestAnswer = b;
      for (const id of run.used) {
        d.used[id] = (d.used[id] || 0) + 1;
        const pid = id.split(':')[0];
        const list = d.found[pid] || (d.found[pid] = []);
        if (!list.includes(id)) list.push(id);
      }
      this.save();
    },
    reset() { this.data = blank(); this.save(); },
  };

  RA.Memory = Memory;
})(window.RA = window.RA || {});
