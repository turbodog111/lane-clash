// The descent: one run of the game. Pure logic. The UI calls tick/submit/etc. and drains run.events.
(function (RA) {
  const BASE_HP = 60, HP_GROW = 0.17, BOSS_HP = 3.0;
  const MUTABLE_RULES = ['fury', 'harpy', 'echo', 'sphinx', 'gorgo', 'tantalus'];

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class Run {
    constructor(mem, seed) {
      this.mem = mem || { used: {}, found: {} };
      this.rng = mulberry32(seed == null ? (Date.now() & 0x7fffffff) : seed);
      this.floor = 0;
      this.maxAnima = 100;
      this.anima = 100;
      this.folia = 3;
      this.boughs = 1;
      this.boons = {};
      this.used = new Set();          // answer ids used this run
      this.usedPrompts = new Set();
      this.seen = [];                 // [{pid, given: []}]
      this.events = [];
      this.stats = { answers: 0, invalid: 0, dmg: 0, tiers: [0, 0, 0, 0, 0, 0], best: null, typos: 0, worn: 0 };
      this.streak = 0;
      this.lastKey = '';
      this.lastTime = -99;
      this.time = 0;
      this.phase = 'fight';
      this.offer = [];
      this.lastEnemy = null;
      this.nextFloor();
    }

    emit(e) { this.events.push(e); }
    pick(arr) { return arr[Math.floor(this.rng() * arr.length)]; }
    weighted(items) {
      const total = items.reduce((s, it) => s + it.w, 0);
      let r = this.rng() * total;
      for (const it of items) { if ((r -= it.w) <= 0) return it.v; }
      return items[items.length - 1].v;
    }

    // ── Floors & enemies ────────────────────────────────────────────
    nextFloor() {
      const n = ++this.floor;
      let id;
      if (n % 5 === 0) id = RA.BOSS_ORDER[(n / 5 - 1) % RA.BOSS_ORDER.length];
      else {
        const pool = Object.entries(RA.ENEMIES).filter(([k, e]) => !e.boss && e.min <= n && k !== this.lastEnemy);
        // Newly unlocked enemies are likelier, so each new one gets introduced promptly.
        id = this.weighted(pool.map(([k, e]) => ({ v: k, w: e.min >= n - 1 ? 4 : 1 })));
      }
      this.lastEnemy = id;
      const e = RA.ENEMIES[id];
      const rules = [...e.rules];
      let mutated = null;
      const deepChance = e.boss ? (n > 15 ? 1 : 0) : n >= 11 ? Math.min(0.65, (n - 10) * 0.08) : 0;
      if (deepChance && this.rng() < deepChance) {
        const options = MUTABLE_RULES.filter((r) => !rules.includes(r) && !(rules.includes('heads') && r === 'gorgo'));
        mutated = this.pick(options);
        rules.push(mutated);
      }
      const furyMut = mutated === 'fury';
      const sat = Math.pow(1.2, this.boons.saturnus || 0);
      const hp = BASE_HP * (1 + HP_GROW * (n - 1)) * Math.pow(1.04, n - 1) * e.hp * (e.boss ? BOSS_HP : 1) * (furyMut ? 0.75 : 1);
      const interval = Math.max(6.5, 17 - 0.35 * (n - 1)) * e.speed * (furyMut ? 0.62 : 1) * sat;
      const dmg = Math.round((8 + 1.4 * (n - 1)) * Math.pow(1.02, n - 1) * (e.boss ? 1.25 : 1));

      const heads = rules.includes('heads') ? 3 : 1;
      this.enemy = {
        id, name: e.name, en: e.en, boss: !!e.boss, rules, mutated, dmg,
        st: { lastKey: '', lastText: '', lastLen: 0, letters: new Set() },
        parts: [],
      };
      for (let i = 0; i < heads; i++) {
        const php = Math.round(hp * (heads > 1 ? 0.42 : 1));
        const iv = interval * (heads > 1 ? 1.35 : 1);
        const part = { hp: php, maxHp: php, interval: iv, timer: iv + 2 + i * (iv / 3), alive: true, given: [], hint: null };
        this.enemy.parts.push(part);
        this.assignPrompt(part);
      }
      this.iunoBlocks = this.boons.iuno || 0;
      this.emit({ type: 'floor', floor: n, enemy: this.enemy });
    }

    allowedLevels() {
      const n = this.floor;
      if (n <= 3) return [{ v: 1, w: 1 }];
      if (n <= 7) return [{ v: 1, w: 1 }, { v: 2, w: 1.6 }];
      return [{ v: 1, w: 0.6 }, { v: 2, w: 1.2 }, { v: 3, w: 1.8 }];
    }

    assignPrompt(part) {
      const active = new Set((this.enemy?.parts || []).filter((p) => p.prompt).map((p) => p.prompt.id));
      let pool = [];
      for (let tries = 0; tries < 2 && !pool.length; tries++) {
        const lvl = this.weighted(this.allowedLevels());
        pool = RA.prompts.filter((p) => p.lvl <= lvl && !this.usedPrompts.has(p.id) && !active.has(p.id));
        const exact = pool.filter((p) => p.lvl === lvl);
        if (exact.length) pool = exact;
      }
      if (!pool.length) {
        this.usedPrompts.clear();
        pool = RA.prompts.filter((p) => !active.has(p.id));
      }
      const p = this.pick(pool);
      this.usedPrompts.add(p.id);
      part.prompt = p;
      part.shownAt = this.time;
      part.peekUntil = 0;
      part.hint = null;
      part.firstAnswered = false;
      let rec = this.seen.find((s) => s.pid === p.id);
      if (!rec) { rec = { pid: p.id, given: [] }; this.seen.push(rec); }
      part.rec = rec;
      if (this.boons.apollo) this.makeHint(part);
    }

    // ── Time ────────────────────────────────────────────────────────
    tick(dt) {
      if (this.phase !== 'fight') return;
      this.time += dt;
      for (const part of this.enemy.parts) {
        if (!part.alive) continue;
        part.timer -= dt;
        if (part.timer <= 0) {
          part.timer += part.interval;
          this.strike(part);
          if (this.phase !== 'fight') return;
        }
      }
    }

    strike(part) {
      if (this.iunoBlocks > 0) {
        this.iunoBlocks--;
        this.emit({ type: 'blocked', part: this.enemy.parts.indexOf(part) });
        return;
      }
      const dmg = this.enemy.dmg;
      this.anima -= dmg;
      if (this.enemy.rules.includes('tantalus')) this.enemy.st.lastLen = 0;
      this.emit({ type: 'strike', dmg, part: this.enemy.parts.indexOf(part) });
      if (this.anima <= 0) {
        if (this.boughs > 0) {
          this.boughs--;
          this.anima = Math.round(this.maxAnima * 0.4);
          this.emit({ type: 'revive' });
        } else {
          this.anima = 0;
          this.phase = 'dead';
          this.emit({ type: 'dead' });
        }
      }
    }

    penalty(seconds) {
      for (const p of this.enemy.parts) if (p.alive) p.timer = Math.max(0.05, p.timer - seconds);
    }

    // ── Answers ─────────────────────────────────────────────────────
    submit(raw) {
      if (this.phase !== 'fight') return null;
      const text = String(raw || '').trim();
      if (!RA.norm(text)) return null;
      const alive = this.enemy.parts.filter((p) => p.alive);
      let hit = null, part = null;
      for (const typo of [false, true]) {
        for (const p of alive) {
          const m = RA.match(p.prompt, text, typo);
          if (m) { hit = m; part = p; break; }
        }
        if (hit) break;
      }
      const reject = (reason, extra = {}, pen = 1) => {
        if (pen) this.penalty(pen);
        this.streak = 0;
        const ev = { type: 'reject', reason, text: hit ? hit.a.text : text, ...extra };
        this.emit(ev);
        return ev;
      };
      if (!hit) {
        this.stats.invalid++;
        return reject('invalid', {}, this.boons.neptunus ? 0 : 2);
      }
      const a = hit.a;
      if (this.used.has(a.id)) return reject('dup');

      const rules = this.enemy.rules, st = this.enemy.st;
      const key = RA.norm(a.text);
      if (rules.includes('sphinx') && st.lastKey && key <= st.lastKey) return reject('sphinx', { after: st.lastText });
      if (rules.includes('tantalus') && key.length <= st.lastLen) return reject('tantalus', { len: st.lastLen });
      if (rules.includes('judge') && st.letters.has(key[0])) return reject('judge', { letter: key[0].toUpperCase() });
      if (rules.includes('echo') && (this.mem.used[a.id] || 0) > 0) return reject('echo', {}, 0);

      let tier = a.tier, worn = false;
      if ((this.mem.used[a.id] || 0) >= 3 && tier > 1) { tier--; worn = true; }
      if (rules.includes('toll') && tier < 3) return reject('toll', { tier }, 0);

      // Accepted.
      this.used.add(a.id);
      part.given.push(a.id);
      part.rec.given.push(a.id);
      st.lastKey = key; st.lastText = a.text; st.lastLen = key.length; st.letters.add(key[0]);

      const B = this.boons, mult = [];
      let dmg = RA.TIERS[tier].dmg;
      const mul = (f, why) => { dmg *= f; mult.push(why); };
      if (hit.typo) mul(0.8, 'typo');
      if (B.minerva && tier >= 3) mul(1 + 0.4 * B.minerva, 'Minerva');
      if (B.mercurius && this.time - this.lastTime <= 3) mul(1 + 0.5 * B.mercurius, 'Mercurius');
      if (B.ianus && this.lastKey && key[0] === this.lastKey[this.lastKey.length - 1]) mul(1 + B.ianus, 'Ianus');
      if (B.vulcanus && key.length <= 5) mul(1 + 0.6 * B.vulcanus, 'Vulcanus');
      if (B.diana && !part.firstAnswered) mul(1 + B.diana, 'Diana');
      if (B.pluto) { if (tier === 1) mul(0, 'Pluto'); else mul(1.6, 'Pluto'); }
      if (B.bacchus) mul(1.35, 'Bacchus');
      this.streak++;
      if (B.mars && this.streak % 4 === 0) mul(2 + 0.5 * B.mars, 'Mars');
      if (B.fortuna) mul(0.5 + 2 * this.rng(), 'Fortuna');
      let fed = 0;
      if (rules.includes('harpy') && tier === 1) { fed = 8; dmg = 0; }
      dmg = Math.round(dmg);

      part.hp = Math.min(part.maxHp, part.hp - dmg + fed);
      part.firstAnswered = true;
      if (part.hint && part.hint.id === a.id) part.hint = null;
      let healed = 0;
      if (B.vesta && tier >= 3) healed = Math.min(this.maxAnima - this.anima, 3 * B.vesta);
      this.anima += healed;

      this.lastKey = key; this.lastTime = this.time;
      const s = this.stats;
      s.answers++; s.dmg += dmg; s.tiers[tier]++;
      if (hit.typo) s.typos++;
      if (worn) s.worn++;
      if (!s.best || tier > s.best.tier || (tier === s.best.tier && key.length > RA.norm(s.best.text).length)) {
        s.best = { text: a.text, tier, q: part.prompt.q };
      }
      const ev = { type: 'hit', text: a.text, typed: text, tier, baseTier: a.tier, dmg, typo: hit.typo, worn, mult, fed, healed,
                   part: this.enemy.parts.indexOf(part), firstEver: !(this.mem.found[a.prompt] || []).includes(a.id) };
      this.emit(ev);
      if (part.hp <= 0) {
        part.hp = 0; part.alive = false;
        this.emit({ type: 'partDown', part: this.enemy.parts.indexOf(part) });
        if (this.enemy.parts.every((p) => !p.alive)) this.clearFloor();
      }
      return ev;
    }

    // ── Tools ───────────────────────────────────────────────────────
    muta() {
      if (this.phase !== 'fight') return false;
      for (const p of this.enemy.parts) if (p.alive) this.assignPrompt(p);
      this.penalty(4);
      this.streak = 0;
      this.emit({ type: 'muta' });
      return true;
    }

    makeHint(part) {
      const left = part.prompt.answers.filter((a) => !this.used.has(a.id));
      if (!left.length) return null;
      const maxTier = Math.max(...left.map((a) => a.tier));
      const want = Math.min(maxTier, 3 + Math.floor(this.rng() * 2));
      const cands = left.filter((a) => a.tier >= want);
      const a = this.pick(cands.length ? cands : left);
      const letters = RA.norm(a.text);
      part.hint = { id: a.id, first: a.text[0].toUpperCase(), len: letters.length, tier: a.tier };
      return part.hint;
    }

    folium() {
      if (this.phase !== 'fight' || this.folia <= 0) return false;
      const part = this.enemy.parts.find((p) => p.alive && !p.hint);
      if (!part) return false;
      if (!this.makeHint(part)) return false;
      this.folia--;
      this.emit({ type: 'hint', part: this.enemy.parts.indexOf(part) });
      return true;
    }

    respice() {
      if (this.phase !== 'fight' || !this.enemy.rules.includes('gorgo')) return false;
      for (const p of this.enemy.parts) if (p.alive) p.peekUntil = this.time + 2.5;
      this.penalty(2);
      this.emit({ type: 'respice' });
      return true;
    }

    promptVisible(part) {
      if (!this.enemy.rules.includes('gorgo')) return true;
      return this.time - part.shownAt < 4 || this.time < part.peekUntil;
    }

    // ── Between floors ──────────────────────────────────────────────
    clearFloor() {
      const heal = Math.min(5, this.maxAnima - this.anima);
      this.anima += heal;
      const boss = this.enemy.boss;
      if (boss) this.folia += 1;
      this.phase = 'boon';
      this.offer = this.rollOffer();
      this.emit({ type: 'clear', floor: this.floor, boss, heal });
    }

    rollOffer() {
      const hurt = this.anima < this.maxAnima * 0.6;
      const items = Object.entries(RA.BOONS)
        .filter(([id, b]) => !(b.unique && this.boons[id]))
        .map(([id, b]) => ({ v: id, w: id === 'requies' ? (hurt ? 3 : 0.4) : id === 'proserpina' ? 0.35 : 1 }));
      const out = [];
      while (out.length < 3 && items.length) {
        const id = this.weighted(items);
        out.push(id);
        items.splice(items.findIndex((it) => it.v === id), 1);
      }
      return out;
    }

    chooseBoon(i) {
      if (this.phase !== 'boon') return false;
      const id = this.offer[i];
      if (!id) return false;
      if (id === 'ceres') { this.maxAnima += 25; this.anima += 25; this.boons.ceres = (this.boons.ceres || 0) + 1; }
      else if (id === 'requies') this.anima = Math.min(this.maxAnima, this.anima + 40);
      else if (id === 'proserpina') this.boughs++;
      else if (id === 'sibylla') this.folia += 3;
      else this.boons[id] = (this.boons[id] || 0) + 1;
      this.emit({ type: 'boon', id });
      this.phase = 'fight';
      this.nextFloor();
      return true;
    }

    // Answers worth learning from the prompts you faced (for the end screen).
    missed(limit = 4) {
      return this.seen.map((s) => {
        const p = RA.promptById[s.pid];
        const left = p.answers.filter((a) => !this.used.has(a.id));
        const take = (tier, n) => {
          const pool = left.filter((a) => a.tier === tier);
          const out = [];
          while (out.length < n && pool.length) out.push(pool.splice(Math.floor(this.rng() * pool.length), 1)[0]);
          return out;
        };
        // A mix worth learning: a couple of rare words, then the truly obscure.
        let missed = [...take(3, 1), ...take(4, 2), ...take(5, 1)];
        if (missed.length < limit) missed.push(...take(2, limit - missed.length));
        return { p, given: s.given.map((id) => p.answers.find((a) => a.id === id)).filter(Boolean), missed: missed.slice(0, limit) };
      });
    }
  }

  RA.Run = Run;
})(window.RA = window.RA || {});
