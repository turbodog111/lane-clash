// src/logic.js

// ---------- Small helpers ----------
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const dist  = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const enemySide = s => s==='blue'?'red':'blue';
const shuffle = (a)=>{ const r=a.slice(); for(let i=r.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [r[i],r[j]]=[r[j],r[i]]; } return r; };
const randRange = (a,b)=>a + Math.random()*(b-a);

// Card upgrade costs by rarity and level
const UPGRADE_COSTS = {
  common: [100, 250, 500, 1000, 2500],
  rare: [200, 500, 1000, 2000, 5000]
};

// LocalStorage keys
const STORAGE_KEYS = {
  COINS: 'laneClash_coins',
  CARD_LEVELS: 'laneClash_cardLevels'
};

// Save game data to localStorage
export function saveGameData(state) {
  try {
    localStorage.setItem(STORAGE_KEYS.COINS, state.coins.toString());
    const levels = state.cards.map(card => card.level);
    localStorage.setItem(STORAGE_KEYS.CARD_LEVELS, JSON.stringify(levels));
  } catch (e) {
    console.warn('Failed to save game data:', e);
  }
}

// Load game data from localStorage
export function loadGameData(state) {
  try {
    const savedCoins = localStorage.getItem(STORAGE_KEYS.COINS);
    if (savedCoins !== null) {
      state.coins = parseInt(savedCoins, 10) || 0;
    }

    const savedLevels = localStorage.getItem(STORAGE_KEYS.CARD_LEVELS);
    if (savedLevels) {
      const levels = JSON.parse(savedLevels);
      levels.forEach((level, index) => {
        if (state.cards[index]) {
          state.cards[index].level = level;
        }
      });
    }
  } catch (e) {
    console.warn('Failed to load game data:', e);
  }
}

// Get upgrade cost for a card
export function getUpgradeCost(card) {
  if (card.level >= 5) return null; // Max level
  return UPGRADE_COSTS[card.rarity][card.level];
}

// Get scaled stat based on level (10% per level)
export function getScaledStat(baseStat, level) {
  return Math.round(baseStat * (1 + level * 0.1));
}

// Upgrade a card
export function upgradeCard(state, cardIndex) {
  const card = state.cards[cardIndex];
  const cost = getUpgradeCost(card);

  if (!cost || state.coins < cost) return false;

  state.coins -= cost;
  card.level++;
  saveGameData(state);
  return true;
}

function nearestPointOnSegment(p,a,b){
  const vx=b.x-a.x, vy=b.y-a.y;
  const wx=p.x-a.x, wy=p.y-a.y;
  const L2=vx*vx+vy*vy || 1;
  let t=(vx*wx+vy*wy)/L2; t=clamp(t,0,1);
  return {x:a.x+vx*t, y:a.y+vy*t, t};
}
const nearPoint = (p,q,eps)=>Math.abs(p.x-q.x)<=eps && Math.abs(p.y-q.y)<=eps;

// ---------- Game construction ----------
export function createGameState(canvas){
  const W = canvas.width, H = canvas.height;

  const config = {
    W,H,
    lanesX: [W*0.25, W*0.75],
    riverY: H/2, riverH: 100, bridgeW: 120,
    tile: 40,

    // economy
    ELIXIR_MAX: 10,
    ELIXIR_PER_SEC: 0.5, // 1 per 2s

    // movement / behavior
    LANE_TOLERANCE: 80,
    AGGRO_RADIUS: 60,    // small, same-lane aggro only
    PATH_ATTR: 40,       // path recentering (px/s)
    SEP_DIST: 18,        // friendly separation
    SEP_PUSH: 12,
    GOAL_EPS: 8,
    WORLD_PAD: 8,

    // new: when two enemies meet on the SAME PATH
    PATH_BLOCK_PAD: 6,     // extra standoff beyond radii
    PATH_BLOCK_DETECT: 18, // extra detection beyond standoff
  };

  const state = {
    canvas, config,
    towers: [], units: [],
    projectiles: [],
    floatDMG: [],
    elixir: { blue: 5, red: 5 },
    winner: null,

    // Match system
    matchTime: 240, // 4 minutes in seconds
    matchTimer: 240,
    matchMode: 'Regular',
    towersDestroyed: { blue: 0, red: 0 }, // Count of xbow towers destroyed by each side
    coins: 0, // Total coins earned
    matchCoins: 0, // Coins earned this match
    damageDealt: 0, // Total damage dealt by player

    // Cards (Speeds adjusted for balanced gameplay)
    cards: [
      { id:'knight',   name:'Knight',    cost:2, img:'assets/Knight.png',    count:1, hp:100, dmg:25, atk:1.0,  range:22,  speed:30, radius:13, type:'melee', rarity:'common', level:0 },
      { id:'archers',  name:'Archers',   cost:2, img:'assets/Archers.png',   count:2, hp:60,  dmg:10, atk:0.75, range:120, speed:35, radius:10, type:'ranged', rarity:'common', level:0 },
      { id:'minimega', name:'Mini-MEGA', cost:3, img:'assets/Mini-MEGA.png', count:1, hp:300, dmg:80, atk:1.5,  range:26,  speed:20, radius:15, type:'melee', rarity:'common', level:0 },
      { id:'mega',     name:'MEGA',      cost:5, img:'assets/MEGA.png',      count:1, hp:800, dmg:150, atk:2.0, range:30,  speed:15, radius:18, type:'melee', rarity:'rare', level:0 },
    ],
    deckOrder: shuffle([0,1,2,3]),
    hand: [],
    selectedHandSlot: null,

    ai: { enabled:true, timer:2.0, minInterval:2.2, maxInterval:4.0, deckOrder: shuffle([0,1,2,3]), hand: [] },

    nav:null, showPlacementOverlay:false,
    paths: null, // 3 polylines per lane
    onElixirChange: ()=>{},
    rebuildCardBar: ()=>{},
    onTimerChange: ()=>{},
  };

  // two-card rotation (player + AI)
  state.hand     = [ state.deckOrder[0], state.deckOrder[1] ];
  state.ai.hand  = [ state.ai.deckOrder[0], state.ai.deckOrder[1] ];

  // Towers (bigger radii, King rof nerfed to 1.5s)
  const K = (side,x,y)=>({type:'king', side,x,y, r:34, hp:2000, maxHp:2000, rof:1.5, range:260, cd:0, awake:false, dmg:50});
  const X = (side,x,y)=>({type:'xbow', side,x,y, r:22, hp:1000, maxHp:1000, rof:1.0, range:300, cd:0, dmg:30});

  state.towers.push(
    K('blue', W/2, H-120),
    X('blue', config.lanesX[0], H-250),
    X('blue', config.lanesX[1], H-250),
    K('red',  W/2, 120),
    X('red',  config.lanesX[0], 250),
    X('red',  config.lanesX[1], 250),
  );

  buildNav(state);    // placement grid
  buildPaths(state);  // movement polylines

  // placement: player bottom half only, walkable cell
  // Also allow placing where destroyed enemy crossbow towers were
  state.canPlaceCell = (cx,cy)=>{
    if (!inBounds(state,cx,cy)) return false;
    const cellPos = cellCenter(state,cx,cy);
    const { y } = cellPos;
    const blueMin = config.riverY + config.riverH/2 + 20;

    // Normal placement: blue half, must be walkable
    if (y >= blueMin && y <= H-40 && state.nav.walk[cy][cx] === 1) return true;

    // Special: allow placement at destroyed enemy (red) crossbow tower locations
    // even if above the river (in enemy territory)
    const destroyedRedXbow = state.towers.find(t =>
      t.type === 'xbow' &&
      t.side === 'red' &&
      t.hp <= 0 &&
      Math.hypot(cellPos.x - t.x, cellPos.y - t.y) <= t.r + 20
    );

    return !!destroyedRedXbow;
  };

  // Load saved game data
  loadGameData(state);

  return state;
}

// ---------- Reset match ----------
export function resetMatch(state){
  // Reset match state
  state.matchTimer = state.matchTime;
  state.matchMode = 'Regular';
  state.matchCoins = 0;
  state.damageDealt = 0;
  state.winner = null;
  state.towersDestroyed = { blue: 0, red: 0 };

  // Reset elixir
  state.elixir = { blue: 5, red: 5 };

  // Clear units and projectiles
  state.units = [];
  state.projectiles = [];
  state.floatDMG = [];

  // Reset towers
  for (const t of state.towers) {
    t.hp = t.maxHp;
    if (t.type === 'king') t.awake = false;
    t.cd = 0;
  }

  // Reset hand (4 cards now)
  state.deckOrder = shuffle([0,1,2,3]);
  state.hand = [ state.deckOrder[0], state.deckOrder[1] ];
  state.ai.deckOrder = shuffle([0,1,2,3]);
  state.ai.hand = [ state.ai.deckOrder[0], state.ai.deckOrder[1] ];
  state.ai.timer = 2.0;

  state.selectedHandSlot = null;
  state.showPlacementOverlay = false;

  state.rebuildCardBar();
  state.onElixirChange();
  state.onTimerChange();
}

// ---------- Main update ----------
export function update(state, dt){
  if (state.winner){ updateFX(state, dt); return; }

  // Match timer countdown
  state.matchTimer = Math.max(0, state.matchTimer - dt);
  state.onTimerChange();

  // elixir regen
  const { ELIXIR_MAX, ELIXIR_PER_SEC } = state.config;
  state.elixir.blue = Math.min(ELIXIR_MAX, state.elixir.blue + ELIXIR_PER_SEC * dt);
  state.elixir.red  = Math.min(ELIXIR_MAX, state.elixir.red  + ELIXIR_PER_SEC * dt);
  state.onElixirChange();

  aiUpdate(state, dt);

  for (const t of state.towers) towerAI(state, t, dt);
  for (const u of state.units)  unitUpdate(state, u, dt);
  for (let i=state.units.length-1;i>=0;i--) if (state.units[i].hp<=0) state.units.splice(i,1);

  updateProjectiles(state, dt);
  updateFX(state, dt);

  const kB = kingOf(state,'blue'), kR = kingOf(state,'red');
  // King tower destroyed = instant win
  if (kB && kB.hp<=0 && !state.winner) { state.winner='red'; endMatch(state); }
  if (kR && kR.hp<=0 && !state.winner) { state.winner='blue'; endMatch(state); }

  // Timer expired = check tower count
  if (state.matchTimer <= 0 && !state.winner) {
    if (state.towersDestroyed.blue > state.towersDestroyed.red) {
      state.winner = 'blue';
    } else if (state.towersDestroyed.red > state.towersDestroyed.blue) {
      state.winner = 'red';
    } else {
      state.winner = 'draw';
    }
    endMatch(state);
  }
}

function endMatch(state) {
  // Calculate coins earned (0.1 coins per damage dealt by player)
  state.matchCoins = Math.round(state.damageDealt * 0.1);
  state.coins += state.matchCoins;
  saveGameData(state);
  // Trigger UI update to show end game screen
  if (state.onTimerChange) state.onTimerChange();
}

// ---------- Placement ----------
export function tryDeployAt(state, mx, my){
  const cell = cellFromWorld(state, mx, my); if (!cell) return false;
  if (!state.canPlaceCell(cell.cx, cell.cy)) return false;
  const slot = state.selectedHandSlot; if (slot===null) return false;

  const idx  = state.hand[slot]; const card = state.cards[idx];
  if (!card || state.elixir.blue < card.cost) return false;

  const {x,y} = cellCenter(state, cell.cx, cell.cy);
  state.elixir.blue -= card.cost;
  spawnUnits(state, 'blue', card, cell.cx, cell.cy, x, y);
  rotateAfterPlay(state, idx, slot);
  state.selectedHandSlot = null;
  state.showPlacementOverlay = false;
  state.onElixirChange();
  return true;
}
function rotateAfterPlay(state, playedIdx, slot){
  state.deckOrder = state.deckOrder.filter(i=>i!==playedIdx).concat([playedIdx]);
  const next = state.deckOrder.find(i => !state.hand.includes(i));
  if (next!==undefined) state.hand[slot]=next;
  state.rebuildCardBar();
}

// ---------- AI ----------
function aiUpdate(state, dt){
  const ai = state.ai; if (!ai.enabled) return;
  ai.timer -= dt; if (ai.timer>0) return;

  const choices = ai.hand
    .map((idx,slot)=>({idx,slot,card:state.cards[idx]}))
    .filter(x=>x.card.cost<=state.elixir.red);

  if (!choices.length){ ai.timer = 0.8; return; }

  // prefer pricier card slightly
  const pick = choices.sort((a,b)=>(b.card.cost+Math.random())-(a.card.cost+Math.random()))[0];

  let cell = randomRedSpawnCell(state);
  if (!cell){
    const lane = (Math.random()<0.5?0:1);
    const which = (Math.random()*3)|0;
    const poly = state.paths[lane][which]; // bottom->top
    const topPt = poly[poly.length-1];
    cell = nearestWalkable(state, topPt.x, topPt.y) || cellFromWorld(state, topPt.x, topPt.y);
  }
  if (!cell){ ai.timer=1.0; return; }

  const {cx,cy} = cell; const {x,y} = cellCenter(state,cx,cy);
  state.elixir.red -= pick.card.cost;
  spawnUnits(state,'red',pick.card,cx,cy,x,y);

  ai.deckOrder = ai.deckOrder.filter(i=>i!==pick.idx).concat([pick.idx]);
  const next = ai.deckOrder.find(i => !ai.hand.includes(i));
  if (next!==undefined) ai.hand[pick.slot]=next;

  ai.timer = randRange(ai.minInterval, ai.maxInterval);
}

// ---------- Spawning & Updates ----------
function spawnUnits(state, side, card, cx, cy, x, y){
  const laneIndex = laneForX(state, x);

  // Apply level scaling to stats
  const scaledHp = getScaledStat(card.hp, card.level);
  const scaledDmg = getScaledStat(card.dmg, card.level);

  // Find nearest enemy crossbow tower for pathfinding target
  const enemySide = side === 'blue' ? 'red' : 'blue';
  const enemyXbows = state.towers.filter(t => t.type === 'xbow' && t.side === enemySide && t.hp > 0);

  let targetTower = null;
  if (enemyXbows.length > 0) {
    // Find nearest crossbow tower
    let minDist = Infinity;
    for (const tower of enemyXbows) {
      const d = Math.hypot(tower.x - x, tower.y - y);
      if (d < minDist) {
        minDist = d;
        targetTower = tower;
      }
    }
  } else {
    // Fallback to king tower if no crossbows
    targetTower = kingOf(state, enemySide);
  }

  // Compute A* path to target tower
  const startCell = cellFromWorld(state, x, y) || nearestWalkable(state, x, y);
  const goalCell = targetTower ? (cellFromWorld(state, targetTower.x, targetTower.y) || nearestWalkable(state, targetTower.x, targetTower.y)) : null;

  const computedPath = (startCell && goalCell) ? aStar(state, startCell, goalCell) : null;

  for (let i=0; i<card.count; i++){
    const off = (card.count>1 ? (i===0?-12:12) : 0);
    state.units.push({
      side, x: x+off, y: y, cx, cy,
      homeLaneIndex:laneIndex, homeLaneX:state.config.lanesX[laneIndex],
      hp:scaledHp, maxHp:scaledHp, dmg:scaledDmg, atk:card.atk, cd:0, range:card.range,
      speed:card.speed, radius:card.radius, type:card.type, kind:card.id,
      // New individual pathfinding
      individualPath: computedPath ? [...computedPath] : null,
      pathIndex: 0,
      targetTower: targetTower,
    });
  }
}

// NEW: find a blocking enemy on the SAME PATH (lane + which)
function findPathBlockEnemy(state, u){
  const { PATH_BLOCK_PAD, PATH_BLOCK_DETECT } = state.config;
  let best=null, bd=1e9;
  for (const e of enemyUnits(state, u.side)){
    if (e.hp<=0) continue;
    if (e.pathLane!==u.pathLane || e.pathWhich!==u.pathWhich) continue; // must be same path
    const d = dist(u,e);
    // engage window: standoff + small detection margin
    const standoff = u.radius + (e.radius||12) + PATH_BLOCK_PAD;
    if (d <= standoff + PATH_BLOCK_DETECT && d < bd){
      bd = d; best = e;
    }
  }
  return best;
}

function towerAI(state, t, dt){
  if (t.hp<=0) return;
  if (t.type==='king' && !t.awake) return;
  t.cd -= dt; if (t.cd>0) return;

  let targets = enemyUnits(state, t.side);
  if (t.type==='xbow'){ const band = xbowBand(state,t); targets = targets.filter(e=>e.y>=band.yMin && e.y<=band.yMax); }
  targets = targets.filter(e=>dist(t,e) < t.range);

  if (!targets.length){
    let ets = enemyTowers(state, t.side);
    if (t.type==='xbow'){ const band=xbowBand(state,t); ets=ets.filter(e=>e.y>=band.yMin && e.y<=band.yMax); }
    ets = ets.filter(e=>dist(t,e) < t.range);
    targets = ets;
  }

  let best=null, bd=1e9;
  for (const e of targets){ const d=dist(t,e); if (d<bd){ bd=d; best=e; } }

  if (best){
    spawnBolt(state, t, best, t.dmg, (t.type==='king'?340:380));
    t.cd = t.rof;
  }
}

function unitUpdate(state, u, dt){
  if (u.hp<=0) return;
  const cfg = state.config;

  // Find enemies within aggro range (60px for melee, weapon range for ranged)
  const aggroRange = (u.type === 'melee' ? 60 : u.range);
  let targetUnit = null;
  {
    let best=null, bd=1e9;
    for (const e of enemyUnits(state,u.side)){
      if (e.hp<=0) continue;
      const d = dist(u,e);
      if (d<bd && d<=aggroRange){ bd=d; best=e; }
    }
    targetUnit = best;
  }

  // Check if target tower still exists, otherwise find new one
  const foe = enemySide(u.side);
  if (!u.targetTower || u.targetTower.hp <= 0) {
    const enemyXbows = state.towers.filter(t => t.type === 'xbow' && t.side === foe && t.hp > 0);
    if (enemyXbows.length > 0) {
      let minDist = Infinity;
      for (const tower of enemyXbows) {
        const d = Math.hypot(tower.x - u.x, tower.y - u.y);
        if (d < minDist) {
          minDist = d;
          u.targetTower = tower;
        }
      }
    } else {
      u.targetTower = kingOf(state, foe);
    }

    // Recompute path to new target
    const startCell = cellFromWorld(state, u.x, u.y) || nearestWalkable(state, u.x, u.y);
    const goalCell = u.targetTower ? (cellFromWorld(state, u.targetTower.x, u.targetTower.y) || nearestWalkable(state, u.targetTower.x, u.targetTower.y)) : null;
    u.individualPath = (startCell && goalCell) ? aStar(state, startCell, goalCell) : null;
    u.pathIndex = 0;
  }

  let vx=0, vy=0;
  const step = Math.max(0, u.speed*dt);

  // If we have an enemy in aggro range, stop and fight
  if (targetUnit){
    const need = (u.type==='melee' ? (u.radius + (targetUnit.radius||12) + 2) : u.range);
    const dx = targetUnit.x - u.x, dy = targetUnit.y - u.y, d = Math.hypot(dx,dy)||1;
    const remain = d - need;
    if (remain > 0){
      // Move toward enemy to engage
      const m = Math.min(step, remain);
      vx += dx/d * m; vy += dy/d * m;
    }
    // else: in range, hold position and fight
  } else {
    // No enemy in aggro, follow individual path to tower
    if (u.individualPath && u.pathIndex < u.individualPath.length) {
      const waypoint = u.individualPath[u.pathIndex];
      const dx = waypoint.x - u.x, dy = waypoint.y - u.y;
      const d = Math.hypot(dx, dy);

      if (d <= cfg.GOAL_EPS || d <= step) {
        // Reached waypoint, move to next
        u.pathIndex++;
        if (u.pathIndex < u.individualPath.length) {
          const nextWp = u.individualPath[u.pathIndex];
          const ndx = nextWp.x - u.x, ndy = nextWp.y - u.y;
          const nd = Math.hypot(ndx, ndy);
          if (nd > 0) {
            vx += (ndx/nd) * step;
            vy += (ndy/nd) * step;
          }
        }
      } else {
        // Move toward current waypoint
        vx += (dx/d) * step;
        vy += (dy/d) * step;
      }
    } else if (u.targetTower) {
      // Reached end of path or no path, move directly to tower
      const need = (u.type==='melee' ? (u.targetTower.r + u.radius + 8) : u.range);
      const dx=u.targetTower.x-u.x, dy=u.targetTower.y-u.y, d=Math.hypot(dx,dy)||1;
      const remain = d - need;
      if (remain > 0){
        const m = Math.min(step, remain);
        vx += dx/d*m; vy += dy/d*m;
      }
    }
  }

  // separation (friendly)
  for (const f of state.units){
    if (f===u || f.side!==u.side || f.hp<=0) continue;
    let dx=u.x-f.x, dy=u.y-f.y, d=Math.hypot(dx,dy);
    if (d===0){ dx=(Math.random()-0.5)*0.01; dy=(Math.random()-0.5)*0.01; d=Math.hypot(dx,dy); }
    if (d>0 && d<cfg.SEP_DIST){
      const push=(1 - d/cfg.SEP_DIST)*(cfg.SEP_PUSH*dt);
      vx += (dx/d)*push; vy += (dy/d)*push;
    }
  }

  // apply motion (stay inside arena)
  u.x = clamp(u.x + vx, cfg.WORLD_PAD, cfg.W - cfg.WORLD_PAD);
  u.y = clamp(u.y + vy, cfg.WORLD_PAD, cfg.H - cfg.WORLD_PAD);

  // attack selection
  let victim = null;

  // Prefer enemy unit in range
  if (targetUnit){
    const need = (u.type==='melee' ? (u.radius + (targetUnit.radius||12) + 2) : u.range);
    if (dist(u,targetUnit) <= need) victim = targetUnit;
  }

  // else target tower if in range
  if (!victim && u.targetTower){
    const need = (u.type==='melee' ? (u.targetTower.r + u.radius + 8) : u.range);
    if (dist(u,u.targetTower) <= need) victim = u.targetTower;
  }

  // apply damage if we have a victim
  u.cd -= dt;
  if (victim && u.cd<=0){
    dealDamage(state, victim, u.dmg, u);
    u.cd = u.atk;
  }
}

// ---------- A* Pathfinding for Individual Units ----------
function aStar(state, startCell, goalCell) {
  const { nav } = state;
  const { cols, rows, walk } = nav;

  if (!startCell || !goalCell) return null;
  if (!inBounds(state, startCell.cx, startCell.cy) || !inBounds(state, goalCell.cx, goalCell.cy)) return null;

  const heuristic = (a, b) => Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);

  const openSet = [startCell];
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  const key = (cell) => `${cell.cx},${cell.cy}`;

  gScore.set(key(startCell), 0);
  fScore.set(key(startCell), heuristic(startCell, goalCell));

  const neighbors = (cell) => {
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    return dirs
      .map(([dx, dy]) => ({ cx: cell.cx + dx, cy: cell.cy + dy }))
      .filter(n => inBounds(state, n.cx, n.cy) && walk[n.cy][n.cx] === 1);
  };

  while (openSet.length > 0) {
    // Find node with lowest fScore
    let current = openSet[0];
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if ((fScore.get(key(openSet[i])) || Infinity) < (fScore.get(key(current)) || Infinity)) {
        current = openSet[i];
        currentIdx = i;
      }
    }

    if (current.cx === goalCell.cx && current.cy === goalCell.cy) {
      // Reconstruct path
      const path = [];
      let curr = current;
      while (cameFrom.has(key(curr))) {
        path.unshift(cellCenter(state, curr.cx, curr.cy));
        curr = cameFrom.get(key(curr));
      }
      return path;
    }

    openSet.splice(currentIdx, 1);

    for (const neighbor of neighbors(current)) {
      const tentativeGScore = (gScore.get(key(current)) || Infinity) + 1;

      if (tentativeGScore < (gScore.get(key(neighbor)) || Infinity)) {
        cameFrom.set(key(neighbor), current);
        gScore.set(key(neighbor), tentativeGScore);
        fScore.set(key(neighbor), tentativeGScore + heuristic(neighbor, goalCell));

        if (!openSet.some(n => n.cx === neighbor.cx && n.cy === neighbor.cy)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return null; // No path found
}

// ---------- Paths & Placement Nav ----------
function buildPaths(state){
  const { W,H, lanesX, riverY, riverH } = state.config;
  const yB0 = H - 260;                    // bottom approach
  const yB1 = riverY + riverH/2 - 10;     // pre-bridge bottom (reduced gap)
  const yMid = riverY;                    // middle of bridge
  const yT1 = riverY - riverH/2 + 10;     // post-bridge top (reduced gap)
  const yT0 = 260;                        // top approach

  const OFFS = [-24, 0, 24];
  const paths = [[],[]]; // 2 lanes × 3 polylines

  for (let lane=0; lane<2; lane++){
    const lx = lanesX[lane];
    for (const o of OFFS){
      paths[lane].push([
        { x: lx + o*0.6, y: yB0 },
        { x: lx + o,     y: yB1 },
        { x: lx + o,     y: yMid },  // Add middle point on bridge
        { x: lx + o,     y: yT1 },
        { x: lx + o*0.6, y: yT0 },
      ]);
    }
  }
  state.paths = paths;
}

function projectToNearestPath(state, laneIndex, p){
  const polys = state.paths[laneIndex];
  let best=0, idx=0, q=polys[0][0], bdist=1e9;
  for (let w=0; w<polys.length; w++){
    const poly = polys[w];
    for (let i=0;i<poly.length-1;i++){
      const qi = nearestPointOnSegment(p, poly[i], poly[i+1]);
      const d = Math.hypot(qi.x-p.x, qi.y-p.y);
      if (d < bdist){ bdist=d; best=w; idx=i; q=qi; }
    }
  }
  return { whichPath: best, segIndex: idx, point: q };
}

function buildNav(state){
  const {W,H,tile,riverY,riverH,lanesX,bridgeW} = state.config;
  const cols=Math.floor(W/tile), rows=Math.floor(H/tile);
  const walk=Array.from({length:rows},()=>Array(cols).fill(1));

  const top=riverY-riverH/2, bot=riverY+riverH/2;

  for (let cy=0; cy<rows; cy++){
    for (let cx=0; cx<cols; cx++){
      const c=cellCenter(state,cx,cy); const x=c.x, y=c.y;
      // Make bridge areas walkable (solid ground) for smooth pathfinding
      // Everything else in the river is blocked (water)
      if (y>=top && y<=bot){
        const near = nearestLaneX(lanesX, x);
        const half = bridgeW/2; // Half of bridge width on each side of lane center
        if (x < near-half || x > near+half){ walk[cy][cx]=0; continue; }
      }
    }
  }

  // block a small ring around towers (no placing on top)
  for (const t of state.towers){
    const rad=t.r+(t.type==='xbow'?8:14);
    for (let cy=0; cy<rows; cy++){
      for (let cx=0; cx<cols; cx++){
        const c=cellCenter(state,cx,cy);
        if (Math.hypot(c.x-t.x,c.y-t.y)<=rad){ walk[cy][cx]=0; }
      }
    }
  }

  state.nav={cols,rows,walk};
}

// ---------- Projectiles / Damage / FX ----------
function spawnBolt(state, from, target, dmg, spd){
  const ang=Math.atan2(target.y-from.y, target.x-from.x);
  state.projectiles.push({x:from.x,y:from.y,vx:Math.cos(ang),vy:Math.sin(ang),spd:spd||360,dmg,target,source:from});
}
function updateProjectiles(state, dt){
  const P=state.projectiles;
  for (const p of P){
    const t=p.target; if (!t || t.hp<=0){ p.dead=true; continue; }
    const dx=t.x-p.x, dy=t.y-p.y, L=Math.hypot(dx,dy)||1; p.vx=dx/L; p.vy=dy/L;
    p.x += p.vx*p.spd*dt; p.y += p.vy*p.spd*dt;
    const tr=(t.r||t.radius||12)+6;
    if (Math.hypot(t.x-p.x, t.y-p.y) <= tr){ dealDamage(state, t, p.dmg, p.source); p.dead=true; }
  }
  for (let i=P.length-1;i>=0;i--) if (P[i].dead) P.splice(i,1);
}
function dealDamage(state,target,amount,attacker){
  if (!target || target.hp<=0) return;
  const wasAlive = target.hp > 0;
  target.hp -= amount;
  state.floatDMG.push({x:target.x, y:target.y-20, a:1, vY:-18, txt:`${amount|0}`});
  if (target.type==='king' && !target.awake) target.awake=true;

  // Track damage dealt by player (blue side)
  if (attacker && attacker.side === 'blue') {
    state.damageDealt += amount;
  }

  // Track xbow tower destruction
  if (wasAlive && target.hp <= 0 && target.type === 'xbow') {
    if (target.side === 'red') {
      state.towersDestroyed.blue++; // Blue destroyed a red tower
    } else if (target.side === 'blue') {
      state.towersDestroyed.red++; // Red destroyed a blue tower
    }
  }
}
function updateFX(state,dt){
  for (const f of state.floatDMG){ f.y += f.vY*dt; f.a -= 1.2*dt; }
  state.floatDMG = state.floatDMG.filter(f=>f.a>0);
}

// ---------- Queries / utils ----------
function xbowBand(state,t){ const {riverY,riverH,H}=state.config; return (t.side==='blue')?{yMin:riverY+riverH/2,yMax:H}:{yMin:0,yMax:riverY-riverH/2}; }
function kingOf(state,s){ return state.towers.find(t=>t.type==='king'&&t.side===s); }
function aliveXbow(state,s,lx){ const xs=state.towers.filter(t=>t.type==='xbow'&&t.side===s&&t.hp>0); if(!xs.length) return null; return xs.reduce((b,t)=>Math.abs(t.x-lx)<Math.abs(b.x-lx)?t:b,xs[0]); }
function enemyUnits(state,s){ return state.units.filter(u=>u.side!==s&&u.hp>0); }
function enemyTowers(state,s){ return state.towers.filter(t=>t.side!==s&&t.hp>0); }

function laneForX(state,x){ const L=state.config.lanesX; return (Math.abs(x-L[0])<=Math.abs(x-L[1]))?0:1; }
function nearestLaneX(lanes,x){ return Math.abs(x-lanes[0])<=Math.abs(x-lanes[1])?lanes[0]:lanes[1]; }

function cellFromWorld(state,x,y){ const t=state.config.tile; const cx=Math.floor(x/t), cy=Math.floor(y/t); return inBounds(state,cx,cy)?{cx,cy}:null; }
function cellCenter(state,cx,cy){ const t=state.config.tile; return {x:cx*t+t/2,y:cy*t+t/2}; }
function inBounds(state,cx,cy){ const {cols,rows}=state.nav; return cx>=0&&cy>=0&&cx<cols&&cy<rows; }

function nearestWalkable(state,x,y){
  const start=cellFromWorld(state,x,y); if (!start) return null;
  if (state.nav.walk[start.cy][start.cx]===1) return start;
  const {cols,rows}=state.nav;
  const seen=new Set([start.cy<<16|start.cx]); const q=[start];
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while(q.length){
    const c=q.shift();
    for (const [dx,dy] of dirs){
      const nx=c.cx+dx, ny=c.cy+dy;
      if (nx<0||ny<0||nx>=cols||ny>=rows) continue;
      const key=ny<<16|nx; if (seen.has(key)) continue; seen.add(key);
      if (state.nav.walk[ny][nx]===1) return {cx:nx,cy:ny};
      q.push({cx:nx,cy:ny});
    }
  }
  return null;
}

function randomRedSpawnCell(state){
  const { riverY, riverH } = state.config;
  const { cols, rows, walk } = state.nav;
  const redMaxY = riverY - riverH/2 - 20;
  for (let tries=0; tries<200; tries++){
    const cx=(Math.random()*cols)|0, cy=(Math.random()*rows)|0;
    const c=cellCenter(state,cx,cy);
    if (c.y > redMaxY) continue;
    if (walk[cy][cx] !== 1) continue;
    return {cx,cy};
  }
  return null;
}

function inSameLane(state,u,xOther){
  const L = state.config.lanesX;
  const laneOf  = (x)=> (Math.abs(x-L[0])<=Math.abs(x-L[1]))?0:1;
  return laneOf(u.x) === laneOf(xOther);
}
