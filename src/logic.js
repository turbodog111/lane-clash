import { addHitFX, updateFX } from './fx.js';

export function createGameState(canvas) {
  const W = canvas.width, H = canvas.height;
  const config = {
    W, H,
    riverY: H / 2, riverH: 100,
    lanesX: [W * 0.33, W * 0.67],
    bridgeW: 120, bridgeH: 118,
    ELIXIR_MAX: 10,
    ELIXIR_PER_SEC: 0.5, // 1 per 2s
    tile: 40,
    riverMargin: 2,
    bridgeCorridorFactor: 0.45,
    defendCorridor: 40,
    kingThreatRadius: 240,
  };

  const state = {
    canvas, config,
    towers: [],
    units: [],
    projectiles: [],
    particles: [],
    floatDMG: [],
    elixir: { blue: 5, red: 5 },
    winner: null,

    cards: [
      { id:'knight',   name:'Knight',    cost:2, img:'assets/Knight.png',    count:1, hp:100, dmg:20, atk:1.0, range:22,  speed:60, radius:13, type:'melee' },
      { id:'archers',  name:'Archers',   cost:2, img:'assets/Archers.png',   count:2, hp:60,  dmg:10, atk:0.75, range:120, speed:90, radius:10, type:'ranged' },
      { id:'minimega', name:'Mini-MEGA', cost:3, img:'assets/Mini-MEGA.png', count:1, hp:300, dmg:80, atk:1.5, range:26,  speed:45, radius:15, type:'melee' },
    ],

    deckOrder: shuffle([0,1,2]),
    hand: [], selectedHandSlot: null,

    onElixirChange: () => {},
    rebuildCardBar: () => {},
    showPlacementOverlay: false,

    ai: {
      enabled: true,
      timer: 2.5,
      minInterval: 2.4,
      maxInterval: 4.2,
      aggression: 1.0,
      deckOrder: shuffle([0,1,2]),
      hand: [],
    },

    nav: null,
    canPlaceCell: () => false,
  };

  state.hand = [ state.deckOrder[0], state.deckOrder[1] ];
  state.ai.hand = [ state.ai.deckOrder[0], state.ai.deckOrder[1] ];

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

  buildNav(state);

  // blue half only & walkable
  state.canPlaceCell = (cx, cy) => {
    if (!inBounds(state, cx, cy)) return false;
    const { riverY, riverH } = state.config;
    const { y } = cellCenter(state, cx, cy);
    const blueMin = riverY + riverH/2 + 20;
    const blueMax = state.config.H - 40;
    if (y < blueMin || y > blueMax) return false;
    return state.nav.walk[cy][cx] === 1;
  };

  return state;
}

/* ----------------- Update Loop ----------------- */
export function update(state, dt) {
  if (state.winner) { updateFX(state, dt); return; }

  const { ELIXIR_MAX, ELIXIR_PER_SEC } = state.config;
  state.elixir.blue = Math.min(ELIXIR_MAX, state.elixir.blue + ELIXIR_PER_SEC * dt);
  state.elixir.red  = Math.min(ELIXIR_MAX, state.elixir.red  + ELIXIR_PER_SEC * dt);
  state.onElixirChange();

  aiUpdate(state, dt);

  for (const t of state.towers) towerAI(state, t, dt);
  for (const u of state.units) unitUpdate(state, u, dt);
  for (let i = state.units.length - 1; i >= 0; i--) if (state.units[i].hp <= 0) state.units.splice(i, 1);

  updateProjectiles(state, dt);
  updateFX(state, dt);

  const kBlue = kingOf(state,'blue'), kRed = kingOf(state,'red');
  if (kBlue && kBlue.hp <= 0 && !state.winner) state.winner = 'red';
  if (kRed  && kRed.hp  <= 0 && !state.winner) state.winner = 'blue';
}

/* ----------------- Player Deploy (snap to grid) ----------------- */
export function tryDeployAt(state, mx, my) {
  const cell = cellFromWorld(state, mx, my);
  if (!cell) return false;
  const { cx, cy } = cell;
  if (!state.canPlaceCell(cx, cy)) return false;

  const slot = state.selectedHandSlot;
  if (slot === null) return false;
  const idx = state.hand[slot];
  const card = state.cards[idx];
  if (!card || state.elixir.blue < card.cost) return false;

  const { x, y } = cellCenter(state, cx, cy);
  state.elixir.blue -= card.cost;
  spawnUnits(state, 'blue', card, cx, cy, x, y);
  rotateAfterPlay(state, idx, slot);
  state.selectedHandSlot = null;
  state.showPlacementOverlay = false;
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
  const ai = state.ai; if (!ai.enabled) return;
  ai.timer -= dt * ai.aggression;
  if (ai.timer > 0) return;

  const affordable = ai.hand
    .map((idx, slot) => ({ idx, slot, card: state.cards[idx] }))
    .filter(({card}) => card.cost <= state.elixir.red);

  if (affordable.length === 0) { ai.timer = 0.8; return; }

  const blueUnits = state.units.filter(u => u.side==='blue').length;
  affordable.sort((a,b)=>(b.card.cost+Math.random()*0.25)-(a.card.cost+Math.random()*0.25+blueUnits*0.01));
  const choice = affordable[0];

  const spot = randomRedSpawnCell(state);
  if (!spot){ ai.timer = 1.0; return; }

  state.elixir.red -= choice.card.cost;
  const { cx, cy } = spot;
  const { x, y } = cellCenter(state, cx, cy);
  spawnUnits(state, 'red', choice.card, cx, cy, x, y);
  aiRotateAfterPlay(state, choice.idx, choice.slot);

  ai.timer = randRange(ai.minInterval, ai.maxInterval);
}
function aiRotateAfterPlay(state, playedIdx, slot){
  const ai = state.ai;
  ai.deckOrder = ai.deckOrder.filter(i => i !== playedIdx).concat([playedIdx]);
  const next = ai.deckOrder.find(i => !ai.hand.includes(i));
  if (next !== undefined) ai.hand[slot] = next;
}

/* ----------------- Mechanics ----------------- */
function spawnUnits(state, side, card, cx, cy, x, y) {
  const laneIndex = getLaneIndex(state, x);
  for (let i=0;i<card.count;i++){
    const off=(card.count>1?(i===0?-12:12):0);
    const unit = {
      side, x: x + off, y,
      cx, cy,
      homeLaneX: state.config.lanesX[laneIndex], homeLaneIndex: laneIndex,
      hp: card.hp, maxHp: card.hp, dmg: card.dmg, atk: card.atk, cd:0,
      range: card.range, speed: card.speed, radius: card.radius,
      kind: card.id, type: card.type,

      // pathing state
      phase: 'toBridge',       // 'toBridge' -> 'attack' after crossing
      goalKind: null, goalRef: null,
      path: [], wp: 0, repathCD: 0.0
    };
    // initial path: to bridge exit
    const pt = bridgeExitPoint(state, unit.side, unit.homeLaneIndex);
    unit.goalKind = 'bridge'; unit.goalRef = {x:pt.x,y:pt.y};
    unit.path = findPathWorld(state, {x:unit.x,y:unit.y}, pt);
    unit.wp = 0; unit.repathCD = 0.6;

    state.units.push(unit);
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

/* -------- PATHING: bridge phases + limited repath -------- */
function unitUpdate(state, u, dt) {
  if (u.hp <= 0) return;

  const { riverY, riverH } = state.config;
  const riverTop = riverY - riverH/2;
  const riverBot = riverY + riverH/2;
  const onOwnSide = (u.side==='blue') ? (u.y >= riverBot) : (u.y <= riverTop);
  const crossed   = (u.side==='blue') ? (u.y < riverTop) : (u.y > riverBot);

  // Promote phase once we are clearly across
  if (u.phase === 'toBridge' && crossed){
    u.phase = 'attack';
    u.repathCD = 0; // force replan to structure
  }

  // Decide current desired goal
  const foe = enemySideOf(u.side);
  const laneCrossbow = aliveCrossbowOn(state, foe, u.homeLaneX);
  const struct = laneCrossbow || kingOf(state, foe);

  const threat = getThreatenedLanes(state, u.side);
  const defendThisLane = onOwnSide && threat.awake && threat.lanes.has(u.homeLaneIndex); // ignore defending once across

  let desiredKind = u.goalKind, desiredRef = u.goalRef;
  if (u.phase === 'toBridge') {
    // Normally: go to the bridge exit on your lane
    const pt = bridgeExitPoint(state, u.side, u.homeLaneIndex);
    desiredKind = 'bridge'; desiredRef = { x: pt.x, y: pt.y };

    // If we must defend THIS lane (king awake & threatened), chase the closest threat near king
    if (defendThisLane){
      const k = kingOf(state, u.side), R = state.config.kingThreatRadius;
      const enemy = enemyUnits(state, u.side).filter(x => dist(x,k) < R)
        .sort((a,b)=>dist(u,a)-dist(u,b))[0];
      if (enemy){ desiredKind='unit'; desiredRef=enemy; }
    }
  } else { // 'attack' (enemy side)
    desiredKind = 'struct'; desiredRef = struct;
  }

  // Repath throttled
  u.repathCD -= dt;
  const goalChanged = (desiredKind !== u.goalKind) || (desiredRef !== u.goalRef);
  if (goalChanged || u.repathCD <= 0 || u.path.length === 0 || u.wp >= u.path.length){
    u.goalKind = desiredKind; u.goalRef = desiredRef;
    const tgt = targetPointFor(state, desiredRef);
    u.path = findPathWorld(state, {x:u.x,y:u.y}, tgt);
    u.wp = 0;
    u.repathCD = 0.6;
  }

  // Move along path
  const step = u.speed * dt;
  if (u.path.length && u.wp < u.path.length){
    const pt = u.path[u.wp];
    const dx = pt.x - u.x, dy = pt.y - u.y;
    const d = Math.hypot(dx,dy);
    if (d <= Math.max(1, step*1.25)) { u.x = pt.x; u.y = pt.y; u.wp++; }
    else { u.x += (dx/d) * step; u.y += (dy/d) * step; }
  }

  // Acquire a target to hit
  let inRange = enemyUnits(state, u.side)
    .filter(e => dist(u,e) <= (u.type==='melee' ? (u.radius + e.radius + 2) : u.range));
  let best=null, bestD=1e9;
  for (const e of inRange){ const dd=dist(u,e); if (dd<bestD){ best=e; bestD=dd; } }
  if (!best && desiredRef){
    const need = (u.type==='melee' ? (('r' in desiredRef)? desiredRef.r : desiredRef.radius) + u.radius + 2 : u.range);
    if (dist(u,desiredRef) <= need) best = desiredRef;
  }

  u.cd -= dt;
  if (best && u.cd <= 0){ dealDamage(state, best, u.dmg); u.cd = u.atk; }
}

/* ----------------- A* PATHFINDING ----------------- */
function buildNav(state){
  const { W, H, tile, riverY, riverH, lanesX, bridgeW, bridgeCorridorFactor } = state.config;
  const cols = Math.floor(W / tile);
  const rows = Math.floor(H / tile);
  const walk = Array.from({length: rows}, () => Array(cols).fill(1));

  // river rows blocked except bridge corridors
  const topY = riverY - riverH/2, botY = riverY + riverH/2;
  const rowTop = Math.max(0, Math.floor(topY / tile));
  const rowBot = Math.min(rows-1, Math.floor(botY / tile));
  for (let cy = rowTop; cy <= rowBot; cy++){
    for (let cx = 0; cx < cols; cx++){
      const { x } = cellCenter(state, cx, cy);
      const laneC = Math.abs(x - lanesX[0]) < Math.abs(x - lanesX[1]) ? lanesX[0] : lanesX[1];
      const half = bridgeW * bridgeCorridorFactor;
      const minX = laneC - half, maxX = laneC + half;
      walk[cy][cx] = (x >= minX && x <= maxX) ? 1 : 0;
    }
  }

  // towers as obstacles
  for (const t of state.towers){
    const rad = t.r + 10;
    const minC = Math.max(0, Math.floor((t.x - rad) / tile));
    const maxC = Math.min(cols-1, Math.floor((t.x + rad) / tile));
    const minR = Math.max(0, Math.floor((t.y - rad) / tile));
    const maxR = Math.min(rows-1, Math.floor((t.y + rad) / tile));
    for (let cy=minR; cy<=maxR; cy++){
      for (let cx=minC; cx<=maxC; cx++){
        const { x, y } = cellCenter(state, cx, cy);
        if (Math.hypot(x - t.x, y - t.y) <= rad) walk[cy][cx] = 0;
      }
    }
  }

  state.nav = { cols, rows, walk };
}

function findPathWorld(state, fromPt, toPt){
  const s = cellFromWorld(state, fromPt.x, fromPt.y);
  const g = nearestWalkableCell(state, toPt.x, toPt.y);
  if (!s || !g) return [];
  const cells = aStar(state, s.cx, s.cy, g.cx, g.cy);
  return cells.map(c => cellCenter(state, c.cx, c.cy));
}

function aStar(state, sx, sy, gx, gy){
  const { cols, rows, walk } = state.nav;
  const key = (x,y)=> (y<<16)|x;
  const open = new MinHeap((a,b)=>a.f-b.f);
  const gScore = new Map(); const fScore = new Map(); const came = new Map();

  const startK = key(sx,sy), goalK = key(gx,gy);
  gScore.set(startK, 0); fScore.set(startK, heuristic8(sx,sy,gx,gy));
  open.push({ cx:sx, cy:sy, f:fScore.get(startK), k:startK });

  const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];

  while(!open.empty()){
    const cur = open.pop();
    if (cur.k === goalK) return reconstruct(came, cur);
    const { cx, cy } = cur;

    for (const [dx,dy] of dirs){
      const nx = cx+dx, ny = cy+dy;
      if (nx<0||ny<0||nx>=cols||ny>=rows) continue;
      if (walk[ny][nx] !== 1) continue;
      if (dx && dy){ if (walk[cy][nx] !== 1 || walk[ny][cx] !== 1) continue; } // no diagonal corner-cut

      const nk = key(nx,ny);
      const candG = (gScore.get(cur.k) ?? Infinity) + ((dx && dy)? 1.4142 : 1);
      if (candG < (gScore.get(nk) ?? Infinity)){
        came.set(nk, cur); gScore.set(nk, candG);
        const f = candG + heuristic8(nx,ny,gx,gy);
        fScore.set(nk, f); open.push({ cx:nx, cy:ny, f, k:nk });
      }
    }
  }
  return [];
}
function reconstruct(came, cur){
  const out = [{ cx: cur.cx, cy: cur.cy }]; let node = cur;
  while (came.has(node.k)){ node = came.get(node.k); out.push({ cx: node.cx, cy: node.cy }); }
  out.reverse(); return out;
}
function heuristic8(x1,y1,x2,y2){ const dx=Math.abs(x1-x2), dy=Math.abs(y1-y2); const mn=Math.min(dx,dy), mx=Math.max(dx,dy); return mx - mn + 1.4142*mn; }

/* ----------------- Target helpers ----------------- */
function targetPointFor(state, ref){
  if (!ref) return { x: state.config.W/2, y: state.config.H/2 };
  if ('r' in ref){
    const near = nearestWalkableCell(state, ref.x, ref.y);
    if (near) return cellCenter(state, near.cx, near.cy);
  }
  return { x: ref.x, y: ref.y };
}
function bridgeExitPoint(state, side, laneIndex){
  const { lanesX, riverY, riverH } = state.config;
  const laneX = lanesX[laneIndex];
  const yGuess = (side === 'blue') ? (riverY - riverH/2 + 12) : (riverY + riverH/2 - 12);
  const c = nearestWalkableCell(state, laneX, yGuess);
  return c ? cellCenter(state, c.cx, c.cy) : { x: laneX, y: yGuess };
}

/* ----------------- Placement / Grid helpers ----------------- */
function cellFromWorld(state, x, y){
  const { tile } = state.config;
  const cx = Math.floor(x / tile), cy = Math.floor(y / tile);
  if (!inBounds(state, cx, cy)) return null; return { cx, cy };
}
function cellCenter(state, cx, cy){
  const { tile } = state.config; return { x: cx*tile + tile/2, y: cy*tile + tile/2 };
}
function inBounds(state, cx, cy){
  const { cols, rows } = state.nav; return cx>=0 && cy>=0 && cx<cols && cy<rows;
}
function nearestWalkableCell(state, x, y){
  const c = cellFromWorld(state, x, y); if (!c) return null;
  if (state.nav.walk[c.cy][c.cx]===1) return c;
  const { cols, rows } = state.nav;
  const visited = new Set(); const q = [c];
  const key = (a)=> (a.cy<<16)|a.cx; visited.add(key(c));
  const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while(q.length){
    const cur = q.shift();
    for (const [dx,dy] of dirs){
      const nx=cur.cx+dx, ny=cur.cy+dy;
      if (nx<0||ny<0||nx>=cols||ny>=rows) continue;
      const k=(ny<<16)|nx; if (visited.has(k)) continue;
      visited.add(k);
      if (state.nav.walk[ny][nx]===1) return { cx:nx, cy:ny };
      q.push({ cx:nx, cy:ny });
    }
  }
  return null;
}
function randomRedSpawnCell(state){
  const cells = [];
  const { rows, cols, walk } = state.nav;
  const { riverY, riverH } = state.config;
  const redMax = riverY - riverH/2 - 20;
  for (let cy=0; cy<rows; cy++){
    for (let cx=0; cx<cols; cx++){
      if (walk[cy][cx] !== 1) continue;
      const { y } = cellCenter(state, cx, cy);
      if (y >= 40 && y <= redMax) cells.push({cx,cy});
    }
  }
  if (!cells.length) return null;
  return cells[(Math.random()*cells.length)|0];
}

/* ----------------- Projectiles / Damage ----------------- */
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
function getLaneIndex(state, x){
  const { lanesX } = state.config;
  return (Math.abs(x - lanesX[0]) <= Math.abs(x - lanesX[1])) ? 0 : 1;
}
function getThreatenedLanes(state, side){
  const k = kingOf(state, side);
  const res = { awake: !!(k && k.awake), lanes: new Set() };
  if (!k || !k.awake) return res;
  const R = state.config.kingThreatRadius;
  const foes = enemyUnits(state, side).filter(u => dist(u, k) < R);
  for (const f of foes){ res.lanes.add(getLaneIndex(state, f.x)); }
  return res;
}

/* ---------- tiny MinHeap for A* ---------- */
class MinHeap{
  constructor(cmp){ this._a=[]; this._cmp=cmp; }
  push(x){ const a=this._a, c=this._cmp; a.push(x); let i=a.length-1; while(i>0){ const p=(i-1)>>1; if(c(a[i],a[p])>=0) break; [a[i],a[p]]=[a[p],a[i]]; i=p; } }
  pop(){ const a=this._a, c=this._cmp; if(!a.length) return null; const r=a[0], x=a.pop(); if(a.length){ a[0]=x; let i=0; while(true){ let l=i*2+1, rgt=l+1, m=i; if(l<a.length && c(a[l],a[m])<0) m=l; if(rgt<a.length && c(a[rgt],a[m])<0) m=rgt; if(m===i) break; [a[i],a[m]]=[a[m],a[i]]; i=m; } } return r; }
  empty(){ return this._a.length===0; }
}

export const labelFor = k => k==='knight'?'K':k==='archers'?'Ar':'MM';
