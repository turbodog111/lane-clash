import { addHitFX, updateFX } from './fx.js';

export function createGameState(canvas) {
  const W = canvas.width, H = canvas.height;
  const config = {
    W, H,
    riverY: H / 2, riverH: 100,
    lanesX: [W * 0.33, W * 0.67],
    bridgeW: 120, bridgeH: 118,
    ELIXIR_MAX: 10,
    ELIXIR_PER_SEC: 0.5,   // 1 per 2s
  };

  const state = {
    canvas, config,
    towers: [],
    units: [],
    projectiles: [],
    particles: [],
    floatDMG: [],
    elixir: { blue: 5, red: 5 },

    // NOTE: Archers range reduced to 120.
    cards: [
      { id:'knight',   name:'Knight',    cost:2, img:'assets/Knight.png',    count:1, hp:100, dmg:20, atk:1.0, range:22,  speed:60, radius:13, type:'melee' },
      { id:'archers',  name:'Archers',   cost:2, img:'assets/Archers.png',   count:2, hp:60,  dmg:15, atk:0.5, range:120, speed:90, radius:10, type:'ranged' },
      { id:'minimega', name:'Mini-MEGA', cost:3, img:'assets/Mini-MEGA.png', count:1, hp:300, dmg:80, atk:1.5, range:26,  speed:45, radius:15, type:'melee' },
    ],
    deckOrder: shuffle([0,1,2]),
    hand: [], selectedHandSlot: null,

    onElixirChange: () => {},
    rebuildCardBar: () => {},

    // --- Simple Red AI ---
    ai: {
      enabled: true,
      timer: 2.5,             // time to next decision
      minInterval: 2.4,
      maxInterval: 4.2,
      aggression: 1.0,        // 1.0 = normal, >1 = more frequent
    },
  };
  state.hand = [ state.deckOrder[0], state.deckOrder[1] ];

  // Towers
  const k = (side,x,y)=>({type:'king', side, x, y, r:26, hp:2000, maxHp:2000, rof:1.0, range:260, cd:0, awake:false});
  const x = (side,x,y)=>({type:'xbow', side, x, y, r:16,  hp:1000, maxHp:1000, rof:1.0, range:300, cd:0});
  state.towers.push(
    k('blue', W/2, H-100),
    x('blue', config.lanesX[0], H-190),
    x('blue', config.lanesX[1], H-190),
    k('red',  W/2, 100),
    x('red',  config.lanesX[0], 190),
    x('red',  config.lanesX[1], 190),
  );

  return state;
}

/* ----------------- Update Loop ----------------- */
export function update(state, dt) {
  const { ELIXIR_MAX, ELIXIR_PER_SEC } = state.config;
  // regen both sides (AI needs elixir too)
  state.elixir.blue = Math.min(ELIXIR_MAX, state.elixir.blue + ELIXIR_PER_SEC * dt);
  state.elixir.red  = Math.min(ELIXIR_MAX, state.elixir.red  + ELIXIR_PER_SEC * dt);
  state.onElixirChange();

  // Red AI
  aiUpdate(state, dt);

  // Towers
  for (const t of state.towers) towerAI(state, t, dt);

  // Units
  for (const u of state.units) unitUpdate(state, u, dt);
  for (let i = state.units.length - 1; i >= 0; i--) if (state.units[i].hp <= 0) state.units.splice(i, 1);

  // Projectiles + FX
  updateProjectiles(state, dt);
  updateFX(state, dt);
}

/* ----------------- Input/Deploy (Blue) ----------------- */
export function tryDeployAt(state, mx, my) {
  const { riverY, riverH, lanesX, H } = state.config;
  const halfMin = riverY + riverH/2 + 20, halfMax = H - 40;
  if (my < halfMin || my > halfMax) return false;

  const laneX = Math.abs(mx - lanesX[0]) < Math.abs(mx - lanesX[1]) ? lanesX[0] : lanesX[1];
  const spawnY = Math.max(halfMin+10, Math.min(halfMax, my));

  const slot = state.selectedHandSlot;
  if (slot === null) return false;
  const idx = state.hand[slot];
  const card = state.cards[idx];
  if (!card || state.elixir.blue < card.cost) return false;

  state.elixir.blue -= card.cost;
  spawnUnits(state, 'blue', card, laneX, spawnY);
  rotateAfterPlay(state, idx, slot);
  state.selectedHandSlot = null;
  state.onElixirChange();
  return true;
}

export function rotateAfterPlay(state, playedIdx, slot) {
  state.deckOrder = state.deckOrder.filter(i => i !== playedIdx).concat([playedIdx]);
  const next = state.deckOrder.find(i => !state.hand.includes(i));
  if (next !== undefined) state.hand[slot] = next;
  state.rebuildCardBar();
}

/* ----------------- AI (Red) ----------------- */
function aiUpdate(state, dt){
  const ai = state.ai;
  if (!ai.enabled) return;
  ai.timer -= dt * ai.aggression;
  if (ai.timer > 0) return;

  // Choose a card the AI can afford
  const affordable = state.cards
    .map((c, i) => ({c, i}))
    .filter(({c}) => c.cost <= state.elixir.red);

  if (affordable.length === 0){
    // Not enough elixir; wait a bit and try again soon
    ai.timer = 0.8;
    return;
  }

  // Very light heuristic: heavier cards a bit more likely if player is pushing
  const blueUnits = state.units.filter(u => u.side==='blue').length;
  affordable.sort((a,b) => (b.c.cost + Math.random()*0.3) - (a.c.cost + Math.random()*0.3 + blueUnits*0.01));
  const pick = affordable[0];

  const { lanesX, riverY, riverH } = state.config;
  const laneX = Math.random() < 0.5 ? lanesX[0] : lanesX[1];
  // Red half spawn band (top)
  const topMin = 40, topMax = riverY - riverH/2 - 20;
  const y = randRange(topMin+20, topMax-10);

  state.elixir.red -= pick.c.cost;
  spawnUnits(state, 'red', pick.c, laneX, y);

  // Schedule next decision
  ai.timer = randRange(ai.minInterval, ai.maxInterval);
}

/* ----------------- Mechanics ----------------- */
function spawnUnits(state, side, card, laneX, y) {
  for (let i=0;i<card.count;i++){
    const off=(card.count>1?(i===0?-12:12):0);
    state.units.push({
      side, x: laneX + off, y, laneX, // lane anchor; may drift AFTER crossing
      hp: card.hp, maxHp: card.hp, dmg: card.dmg, atk: card.atk, cd:0,
      range: card.range, speed: card.speed, radius: card.radius,
      kind: card.id, type: card.type
    });
  }
}
function spawnBolt(state, from, target, dmg=30, spd=360) {
  const ang = Math.atan2(target.y - from.y, target.x - from.x);
  state.projectiles.push({ x: from.x, y: from.y, vx: Math.cos(ang), vy: Math.sin(ang), spd, dmg, target });
}

function towerAI(state, t, dt) {
  if (t.hp <= 0) return;
  if (t.type === 'king' && !t.awake) return;
  t.cd -= dt; if (t.cd > 0) return;

  let candidates = enemyUnits(state, t.side);
  if (t.type === 'xbow'){
    const band = xbowBandFor(state, t);
    candidates = candidates.filter(e => e.y >= band.yMin && e.y <= band.yMax);
  }
  candidates = candidates.filter(e => dist(t,e) < t.range);

  if (!candidates.length){
    let ets = enemyTowers(state, t.side);
    if (t.type === 'xbow'){
      const band = xbowBandFor(state, t);
      ets = ets.filter(e => e.y >= band.yMin && e.y <= band.yMax);
    }
    ets = ets.filter(e => dist(t,e) < t.range);
    candidates = ets;
  }

  let best=null, bestD=1e9;
  for (const e of candidates){ const d = dist(t,e); if (d < bestD){ best=e; bestD=d; } }
  if (best){
    const dmg = (t.type==='king'?50:30);
    spawnBolt(state, t, best, dmg, (t.type==='king'?340:380));
    t.cd = t.rof;
  }
}

/* ----------------- PATHING (bridge-respecting) ----------------- */
function unitUpdate(state, u, dt) {
  if (u.hp <= 0) return;

  const foe = enemySideOf(u.side);
  const laneCrossbow = aliveCrossbowOn(state, foe, u.laneX);
  let struct = laneCrossbow || kingOf(state, foe);

  const { riverY, riverH } = state.config;
  const crossed = (u.side==='blue') ? (u.y < riverY - riverH/2)
                                     : (u.y > riverY + riverH/2);
  const lockLane = !crossed; // while on own side OR inside river band

  // Desired lane anchor:
  let desiredLaneX = u.laneX;
  if (struct?.type === 'king' && crossed) {
    // Pull toward king ONLY after crossing.
    desiredLaneX = struct.x;
  }
  // Smoothly move lane anchor
  u.laneX += (desiredLaneX - u.laneX) * Math.min(1, dt * 2.5);

  // Acquire targets near us (units first, then structures if in range)
  let close = enemyUnits(state, u.side)
    .filter(e => dist(u,e) <= (u.type==='melee' ? (u.radius + e.radius + 2) : u.range));
  if (!close.length && struct){
    const inR = dist(u,struct) <= (u.type==='melee' ? (u.radius + struct.r + 2) : u.range);
    if (inR) close = [struct];
  }

  let best=null, bestD=1e9;
  for (const e of close){ const d=dist(u,e); if (d<bestD){ best=e; bestD=d; } }

  const moveTarget = best || struct;
  if (moveTarget){
    const dx = moveTarget.x - u.x, dy = moveTarget.y - u.y, len = Math.hypot(dx,dy) || 1;
    let nx = dx/len, ny = dy/len;

    const tgtR = ('r' in moveTarget) ? moveTarget.r : moveTarget.radius;
    const need = (u.type==='melee') ? (tgtR + u.radius + 2) : u.range;
    const dNow = dist(u, moveTarget);

    if (dNow > need){
      const step = u.speed * dt;
      const s = (dNow - step < need) ? Math.max(0, dNow - need) : step;

      // while lockLane, forbid lateral motion (keep to bridge)
      let stepX = nx * s;
      let stepY = ny * s;
      if (lockLane) stepX = 0;

      u.x += stepX;
      u.y += stepY;
    }
  } else {
    // No target: proceed along lane (blue up, red down)
    u.y += (u.side==='blue' ? -1 : 1) * u.speed * dt;
  }

  // Keep glued to lane; stronger pull while lockLane (before/inside river)
  const lanePull = lockLane ? 20 : 6;
  u.x += (u.laneX - u.x) * Math.min(1, dt * lanePull);

  // Attack timings
  u.cd -= dt;
  if (best && u.cd<=0){ dealDamage(state, best, u.dmg); u.cd = u.atk; }
  else if (!best && struct && u.cd<=0){
    const d = dist(u, struct), need = (u.type==='melee') ? (struct.r + u.radius + 2) : u.range;
    if (d <= need){ dealDamage(state, struct, u.dmg); u.cd = u.atk; }
  }
}

function updateProjectiles(state, dt){
  const list = state.projectiles;
  for (const p of list){
    const tgt = p.target;
    if (!tgt || tgt.hp <= 0) { p.dead = true; continue; }
    const dirx = tgt.x - p.x, diry = tgt.y - p.y, len = Math.hypot(dirx, diry) || 1;
    p.vx = dirx/len; p.vy = diry/len;
    p.x += p.vx * p.spd * dt; p.y += p.vy * p.spd * dt;
    const rT = ('r' in tgt) ? tgt.r : tgt.radius;
    if (Math.hypot(tgt.x - p.x, tgt.y - p.y) <= (rT+6)){ dealDamage(state, tgt, p.dmg); p.dead = true; }
  }
  for (let i=list.length-1;i>=0;i--) if (list[i].dead) list.splice(i,1);
}

function dealDamage(state, target, amount){
  if (!target || target.hp<=0) return;
  target.hp -= amount;
  const rT = ('r' in target) ? target.r : target.radius;
  addHitFX(state, target.x, target.y - (rT*0.4), amount, '#ffd166');
  if (target.type === 'king' && !target.awake){ target.awake = true; }
}

/* ----------------- Helpers ----------------- */
function enemySideOf(s){ return s==='blue' ? 'red' : 'blue'; }
function kingOf(state, s){ return state.towers.find(t => t.type==='king' && t.side===s); }
function enemyUnits(state, s){ return state.units.filter(u => u.side !== s && u.hp>0); }
function enemyTowers(state, s){ return state.towers.filter(t => t.side !== s && t.hp>0); }
function aliveCrossbowOn(state, s, laneX){
  const list = state.towers.filter(t => t.type==='xbow' && t.side===s && t.hp>0);
  if (!list.length) return null;
  return list.reduce((best, t)=> Math.abs(t.x-laneX)<Math.abs(best.x-laneX)? t:best, list[0]);
}
function xbowBandFor(state, t){
  const { riverY, riverH, H } = state.config;
  return (t.side==='blue') ? { yMin: riverY + riverH/2, yMax: H } : { yMin: 0, yMax: riverY - riverH/2 };
}
function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
function shuffle(a){ const arr=a.slice(); for(let i=arr.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function randRange(a,b){ return a + Math.random()*(b-a); }

export const labelFor = k => k==='knight'?'K':k==='archers'?'Ar':'MM';
