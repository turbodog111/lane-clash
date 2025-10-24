// src/logic.js
// ---------- Game State & Config ----------
export function createGameState(canvas){
  const W = canvas.width, H = canvas.height;
  const config = {
    W,H,
    lanesX: [W*0.25, W*0.75],
    riverY: H/2, riverH: 100,
    bridgeW: 120,
    tile: 40,

    // economy
    ELIXIR_MAX: 10,
    ELIXIR_PER_SEC: 0.5, // 1 per 2s

    // behavior
    LANE_TOLERANCE: 80,
    AGGRO_RADIUS: 60,    // small, same-lane only (no chasing)
    PATH_ATTR: 40,       // path recentering (px/s)
    SEP_DIST: 18,        // friendly separation
    SEP_PUSH: 12,
    GOAL_EPS: 8,
  };

  const state = {
    canvas, config,
    towers: [], units: [],
    projectiles: [],
    floatDMG: [],
    elixir: { blue: 5, red: 5 },
    winner: null,

    // Cards
    cards: [
      { id:'knight',   name:'Knight',    cost:2, img:'assets/Knight.png',    count:1, hp:100, dmg:20, atk:1.0,  range:22,  speed:60, radius:13, type:'melee' },
      { id:'archers',  name:'Archers',   cost:2, img:'assets/Archers.png',   count:2, hp:60,  dmg:10, atk:0.75, range:120, speed:90, radius:10, type:'ranged' },
      { id:'minimega', name:'Mini-MEGA', cost:3, img:'assets/Mini-MEGA.png', count:1, hp:300, dmg:80, atk:1.5,  range:26,  speed:45, radius:15, type:'melee' },
    ],
    deckOrder: shuffle([0,1,2]),
    hand: [],
    selectedHandSlot: null,

    ai: { enabled:true, timer:2.0, minInterval:2.2, maxInterval:4.0, deckOrder: shuffle([0,1,2]), hand: [] },

    nav:null, showPlacementOverlay:false,
    paths: null, // lane polylines (3 per lane)
    onElixirChange:()=>{}, rebuildCardBar:()=>{},
  };

  // hands (2-card rotation)
  state.hand     = [ state.deckOrder[0], state.deckOrder[1] ];
  state.ai.hand  = [ state.ai.deckOrder[0], state.ai.deckOrder[1] ];

  // towers (BIGGER to match your note)
  const K = (side,x,y)=>({type:'king', side,x,y,r:34,hp:2000,maxHp:2000,rof:1.0,range:260,cd:0,awake:false});
  const X = (side,x,y)=>({type:'xbow', side,x,y,r:22,hp:1000,maxHp:1000,rof:1.0,range:300,cd:0});
  state.towers.push(
    K('blue', W/2, H-120),
    X('blue', config.lanesX[0], H-250),
    X('blue', config.lanesX[1], H-250),
    K('red',  W/2, 120),
    X('red',  config.lanesX[0], 250),
    X('red',  config.lanesX[1], 250),
  );

  buildNav(state);    // for placement blocking only
  buildPaths(state);  // 3 polylines per lane

  // placement rules (blue half & walkable)
  state.canPlaceCell = (cx,cy)=>{
    if (!inBounds(state,cx,cy)) return false;
    const { y } = cellCenter(state,cx,cy);
    const { riverY, riverH, H } = state.config;
    const blueMin = riverY + riverH/2 + 20;
    if (y < blueMin || y > H-40) return false;
    return state.nav.walk[cy][cx] === 1;
  };

  return state;
}

// ---------- Update Loop ----------
export function update(state, dt){
  if (state.winner) { updateFX(state, dt); return; }

  // elixir
  const { ELIXIR_MAX, ELIXIR_PER_SEC } = state.config;
  state.elixir.blue = Math.min(ELIXIR_MAX, state.elixir.blue + ELIXIR_PER_SEC * dt);
  state.elixir.red  = Math.min(ELIXIR_MAX, state.elixir.red  + ELIXIR_PER_SEC * dt);
  state.onElixirChange();

  try { aiUpdate(state, dt); } catch(e){ console.error(e); window.__LC_DIAG?.error(e.message||'AI failed'); }

  for (const t of state.towers) towerAI(state, t, dt);
  for (const u of state.units)  unitUpdate(state, u, dt);
  for (let i=state.units.length-1;i>=0;i--) if (state.units[i].hp<=0) state.units.splice(i,1);

  updateProjectiles(state, dt);
  updateFX(state, dt);

  const kB = kingOf(state,'blue'), kR = kingOf(state,'red');
  if (kB && kB.hp<=0 && !state.winner) state.winner='red';
  if (kR && kR.hp<=0 && !state.winner) state.winner='blue';
}

// ---------- Deploy & Rotation ----------
export function tryDeployAt(state, mx, my){
  const c = cellFromWorld(state, mx, my); if (!c) return false;
  if (!state.canPlaceCell(c.cx, c.cy)) return false;
  const slot = state.selectedHandSlot; if (slot===null) return false;
  const idx  = state.hand[slot]; const card = state.cards[idx];
  if (!card || state.elixir.blue < card.cost) return false;

  const { x, y } = cellCenter(state, c.cx, c.cy);
  state.elixir.blue -= card.cost;
  spawnUnits(state, 'blue', card, c.cx, c.cy, x, y);
  rotateAfterPlay(state, idx, slot);
  state.selectedHandSlot = null; state.showPlacementOverlay = false;
  state.onElixirChange();
  return true;
}
export function rotateAfterPlay(state, playedIdx, slot){
  state.deckOrder = state.deckOrder.filter(i=>i!==playedIdx).concat([playedIdx]);
  const next = state.deckOrder.find(i => !state.hand.includes(i));
  if (next!==undefined) state.hand[slot]=next;
  state.rebuildCardBar();
}

// ---------- AI (reliable spawns + fallback) ----------
function aiUpdate(state, dt){
  const ai = state.ai; if (!ai.enabled) return;
  ai.timer -= dt; if (ai.timer>0) return;

  const choices = ai.hand
    .map((idx,slot)=>({idx,slot,card:state.cards[idx]}))
    .filter(x=>x.card.cost<=state.elixir.red);
  if (!choices.length){ ai.timer=0.8; return; }

  const pick = choices.sort((a,b)=>(b.card.cost+Math.random())-(a.card.cost+Math.random()))[0];

  // primary: random walkable cell on red side
  let cell = randomRedSpawnCell(state);

  // fallback: snap to a top approach point on a random lane/path
  if (!cell){
    const lane = (Math.random()<0.5?0:1);
    const which = (Math.random()*3)|0;
    const poly = state.paths[lane][which]; // bottom->top
    const topPt = poly[poly.length-1];
    const px = topPt.x + (Math.random()*20-10);
    const py = topPt.y + (Math.random()*10-5);
    const cw = cellFromWorld(state, px, py) || nearestWalkable(state, px, py);
    if (cw) cell = cw;
  }

  if (!cell){ ai.timer=1.0; window.__LC_DIAG?.warn('AI: no spawn cell found'); return; }

  const { cx,cy }=cell; const {x,y}=cellCenter(state,cx,cy);
  state.elixir.red -= pick.card.cost;
  spawnUnits(state,'red',pick.card,cx,cy,x,y);
  ai.deckOrder = ai.deckOrder.filter(i=>i!==pick.idx).concat([pick.idx]);
  const next = ai.deckOrder.find(i => !ai.hand.includes(i)); if (next!==undefined) ai.hand[pick.slot]=next;

  ai.timer = randRange(ai.minInterval, ai.maxInterval);
  window.__LC_DIAG?.ok('AI: deployed');
}

// ---------- Mechanics ----------
function spawnUnits(state, side, card, cx, cy, x, y){
  const laneIndex = laneForX(state, x);
  const { whichPath, segIndex, point } = projectToNearestPath(state, laneIndex, {x,y});
  for (let i=0;i<card.count;i++){
    const off=(card.count>1?(i===0?-12:12):0);
    const u={
      side, x: (point.x+off), y: point.y, cx, cy,
      homeLaneIndex:laneIndex, homeLaneX:state.config.lanesX[laneIndex],
      hp:card.hp,maxHp:card.hp,dmg:card.dmg,atk:card.atk,cd:0,range:card.range,
      speed:card.speed,radius:card.radius, kind:card.id,type:card.type,
      pathLane: laneIndex,
      pathWhich: whichPath,
      pathDir: (side==='blue')? +1 : -1, // poly points are bottom→top
      pathI: segIndex,                   // current segment index
      onPath: true,
    };
    state.units.push(u);
  }
}
function towerAI(state, t, dt){
  if (t.hp<=0) return;
  if (t.type==='king' && !t.awake) return;
  t.cd-=dt; if (t.cd>0) return;

  let candidates = enemyUnits(state,t.side);
  if (t.type==='xbow'){ const band=xbowBand(state,t); candidates=candidates.filter(e=>e.y>=band.yMin && e.y<=band.yMax); }
  candidates=candidates.filter(e=>dist(t,e)<t.range);

  if (!candidates.length){
    let ets = enemyTowers(state,t.side);
    if (t.type==='xbow'){ const band=xbowBand(state,t); ets=ets.filter(e=>e.y>=band.yMin && e.y<=band.yMax); }
    ets=ets.filter(e=>dist(t,e)<t.range);
    candidates=ets;
  }

  let best=null, bd=1e9; for (const e of candidates){ const d=dist(t,e); if (d<bd){bd=d; best=e;} }
  if (best){ const dmg=(t.type==='king'?50:30); spawnBolt(state,t,best,dmg,(t.type==='king'?340:380)); t.cd=t.rof; }
}

function unitUpdate(state,u,dt){
  if (u.hp<=0) return;
  const cfg = state.config;

  // 1) Lane structure target (lane xbow → king if dead)
  const foe = enemySide(u.side);
  const laneX = cfg.lanesX[u.pathLane];
  const laneXbow = aliveXbow(state,foe,laneX);
  const structTarget = laneXbow || kingOf(state,foe);

  // 2) Aggro candidate (same lane). Only affects ATTACK choice (no chase).
  let targetUnit = null;
  {
    const sameSide = (e)=> ((u.side==='blue' && e.y>cfg.riverY) || (u.side==='red' && e.y<cfg.riverY));
    let best=null, bd=1e9;
    for (const e of enemyUnits(state,u.side)){
      if (e.hp<=0) continue;
      if (!sameSide(e)) continue;
      if (!inSameLane(state,u,e.x)) continue;
      const d=dist(u,e);
      if (d<bd && d<=cfg.AGGRO_RADIUS){ bd=d; best=e; }
    }
    targetUnit = best;
  }

  // 3) Follow lane polyline; when it ends, walk to structure but STOP at proper range so no clipping
  const poly = state.paths[u.pathLane][u.pathWhich]; // bottom→top
  u.pathI = clamp(u.pathI, 0, poly.length-2);

  const forward = (u.pathDir > 0);
  const iCurr = forward ? u.pathI     : u.pathI+1;
  const iNext = forward ? u.pathI + 1 : u.pathI;
  const A = poly[iCurr], B = poly[iNext];

  let vx=0, vy=0;
  const step = u.speed*dt;

  if (u.onPath){
    const dx=B.x-u.x, dy=B.y-u.y; const d=Math.hypot(dx,dy);
    const EPS = cfg.GOAL_EPS;
    if (d <= Math.max(EPS, step*1.25)){ u.x=B.x; u.y=B.y; u.pathI += (forward?1:-1); }
    else { vx += dx/d*step; vy += dy/d*step; }

    // recenter gently to segment line
    const q = nearestPointOnSegment({x:u.x,y:u.y}, A, B);
    const px=q.x-u.x, py=q.y-u.y; const L=Math.hypot(px,py)||1;
    const attr = Math.min(cfg.PATH_ATTR*dt, L);
    vx += px/L * attr; vy += py/L * attr;

    // end-of-polyline? leave path mode
    const endIdx = forward ? (poly.length-2) : 0;
    const endPoint = forward ? poly[poly.length-1] : poly[0];
    const closeToEnd = nearPoint(u, endPoint, cfg.GOAL_EPS+1.5);
    if ((forward && u.pathI > endIdx) || (!forward && u.pathI < endIdx) || (u.pathI===endIdx && closeToEnd)){
      u.onPath = false;
    }
  }

  // Off path → approach structure but stop at hold distance
  if (!u.onPath && structTarget){
    const need = (u.type==='melee'
      ? (structTarget.r + u.radius + 2)  // standoff so melee doesn’t overlap tower
      : Math.max(u.range - 2, 8));       // ranged stops at edge of range

    const dx=structTarget.x-u.x, dy=structTarget.y-u.y; const d=Math.hypot(dx,dy)||1;
    const remain = d - need;
    if (remain > 0){
      const m = Math.min(step, remain);  // don’t overshoot into the tower
      vx += dx/d*m; vy += dy/d*m;
    }
  }

  // Separation (friendly unstack)
  for (const f of state.units){
    if (f===u || f.side!==u.side || f.hp<=0) continue;
    const dx=u.x-f.x, dy=u.y-f.y; const d=Math.hypot(dx,dy);
    if (d>0 && d<cfg.SEP_DIST){ const push=(1 - d/cfg.SEP_DIST)*(cfg.SEP_PUSH*dt); vx += (dx/d)*push; vy += (dy/d)*push; }
  }

  // Melee tiny lateral step to connect, without chase (≤12px)
  if (targetUnit && u.type==='melee'){
    const need = u.radius + (targetUnit.radius||12) + 2;
    const d = dist(u,targetUnit);
    if (d > need && d <= need + 12){
      const dx=targetUnit.x-u.x, dy=targetUnit.y-u.y; const L=Math.hypot(dx,dy)||1;
      const extra = Math.min((d-need), 12) * 2 * dt;
      vx += dx/L * extra; vy += dy/L * extra;
    }
  }

  // Apply motion
  u.x += vx; u.y += vy;

  // 4) Attack resolution (ranged now properly uses full range vs structures)
  let victim = null;

  // Units first (only if small-aggro target exists and is within weapon range)
  if (targetUnit){
    const need = (u.type==='melee' ? (u.radius + (targetUnit.radius||12) + 2) : u.range);
    if (dist(u,targetUnit) <= need) victim = targetUnit;
  }

  // Otherwise structure if in range
  if (!victim && structTarget){
    const need = (u.type==='melee' ? ((structTarget.r||20)+u.radius+2) : u.range);
    if (dist(u,structTarget) <= need) victim = structTarget;
  }

  // Fallback: nearby melee bumping / ranged opportunistic
  if (!victim){
    const meleeRange = (u.radius + 12 + 2);
    const near = enemyUnits(state,u.side).filter(e=>dist(u,e)<= (u.type==='melee' ? meleeRange : u.range));
    let best=null, bd=1e9; for (const e of near){ const dd=dist(u,e); if (dd<bd){bd=dd; best=e;} }
    if (best) victim = best;
  }

  u.cd -= dt;
  if (victim && u.cd<=0){ dealDamage(state, victim, u.dmg); u.cd=u.atk; }
}

// ---------- Lane Paths (3 per lane) ----------
function buildPaths(state){
  const { W,H, lanesX, riverY, riverH } = state.config;
  const yB0 = H - 260;                    // bottom approach
  const yB1 = riverY + riverH/2 - 22;     // pre-bridge bottom
  const yT1 = riverY - riverH/2 + 22;     // post-bridge top
  const yT0 = 260;                        // top approach

  const OFFS = [-24, 0, 24];
  const paths = [[],[]]; // [lane0, lane1] each with 3 polylines

  for (let lane=0; lane<2; lane++){
    const lx = lanesX[lane];
    for (const o of OFFS){
      const poly = [
        { x: lx + o*0.6, y: yB0 },
        { x: lx + o,     y: yB1 },
        { x: lx + o,     y: yT1 },
        { x: lx + o*0.6, y: yT0 },
      ];
      paths[lane].push(poly);
    }
  }
  state.paths = paths;
}

function projectToNearestPath(state, laneIndex, p){
  const polys = state.paths[laneIndex];
  let best=null, bdist=1e9, which=0, idx=0, q=null;
  for (let w=0; w<polys.length; w++){
    const poly=polys[w];
    for (let i=0;i<poly.length-1;i++){
      const qi = nearestPointOnSegment(p, poly[i], poly[i+1]);
      const d = Math.hypot(qi.x-p.x, qi.y-p.y);
      if (d<bdist){ bdist=d; best=w; idx=i; q=qi; }
    }
  }
  return { whichPath: best, segIndex: idx, point: q };
}

// ---------- Projectiles, Damage, FX ----------
function spawnBolt(state,from,target,dmg,spd){
  const ang=Math.atan2(target.y-from.y,target.x-from.x);
  state.projectiles.push({x:from.x,y:from.y,vx:Math.cos(ang),vy:Math.sin(ang),spd,dmg,target});
}
function updateProjectiles(state,dt){
  const P=state.projectiles;
  for (const p of P){
    const t=p.target; if(!t||t.hp<=0){ p.dead=true; continue; }
    const dx=t.x-p.x, dy=t.y-p.y, L=Math.hypot(dx,dy)||1; p.vx=dx/L; p.vy=dy/L;
    p.x+=p.vx*p.spd*dt; p.y+=p.vy*p.spd*dt;
    const tr=(t.r||t.radius||12)+6;
    if (Math.hypot(t.x-p.x,t.y-p.y)<=tr){ dealDamage(state,t,p.dmg); p.dead=true; }
  }
  for (let i=P.length-1;i>=0;i--) if (P[i].dead) P.splice(i,1);
}
function dealDamage(state,target,amount){
  if (!target||target.hp<=0) return;
  target.hp-=amount;
  state.floatDMG.push({x:target.x, y:target.y-20, a:1, vY:-18, txt:`${amount|0}`});
  if (target.type==='king' && !target.awake) target.awake=true;
}
function updateFX(state,dt){
  for (const f of state.floatDMG){ f.y += f.vY*dt; f.a -= 1.2*dt; }
  state.floatDMG = state.floatDMG.filter(f=>f.a>0);
}

// ---------- Navigation (for placement only) ----------
function buildNav(state){
  const {W,H,tile,riverY,riverH,lanesX,bridgeW}=state.config;
  const cols=Math.floor(W/tile), rows=Math.floor(H/tile);
  const walk=Array.from({length:rows},()=>Array(cols).fill(1));

  const top=riverY-riverH/2, bot=riverY+riverH/2;

  for (let cy=0; cy<rows; cy++){
    for (let cx=0; cx<cols; cx++){
      const c=cellCenter(state,cx,cy); const x=c.x, y=c.y;
      // block river except near bridges
      if (y>=top && y<=bot){
        const near = nearestLaneX(lanesX, x);
        const half = bridgeW*0.45;
        if (x < near-half || x > near+half) { walk[cy][cx]=0; continue; }
      }
    }
  }

  // block around towers (match bigger radii)
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
function nearestLaneX(lanes,x){ return Math.abs(x-lanes[0])<=Math.abs(x-lanes[1])?lanes[0]:lanes[1]; }

// ---------- Helpers ----------
function nearestPointOnSegment(p, a, b){
  const vx=b.x-a.x, vy=b.y-a.y;
  const wx=p.x-a.x, wy=p.y-a.y;
  const L2=vx*vx+vy*vy || 1;
  let t=(vx*wx+vy*wy)/L2; t=Math.max(0,Math.min(1,t));
  return { x:a.x+vx*t, y:a.y+vy*t, t };
}
function nearPoint(p,q,eps){ return Math.abs(p.x-q.x)<=eps && Math.abs(p.y-q.y)<=eps; }
function cellFromWorld(state,x,y){ const t=state.config.tile; const cx=Math.floor(x/t), cy=Math.floor(y/t); return inBounds(state,cx,cy)?{cx,cy}:null; }
function cellCenter(state,cx,cy){ const t=state.config.tile; return {x:cx*t+t/2,y:cy*t+t/2}; }
function inBounds(state,cx,cy){ const {cols,rows}=state.nav; return cx>=0&&cy>=0&&cx<cols&&cy<rows; }
function nearestWalkable(state,x,y){
  const start=cellFromWorld(state,x,y); if (!start) return null;
  if (state.nav.walk[start.cy][start.cx]===1) return start;
  const {cols,rows}=state.nav; const seen=new Set([start.cy<<16|start.cx]); const q=[start];
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while(q.length){ const c=q.shift();
    for (const [dx,dy] of dirs){ const nx=c.cx+dx, ny=c.cy+dy; if (nx<0||ny<0||nx>=cols||ny>=rows) continue; const k=ny<<16|nx; if (seen.has(k)) continue; seen.add(k);
      if (state.nav.walk[ny][nx]===1) return {cx:nx,cy:ny}; q.push({cx:nx,cy:ny});
    }
  } return null;
}

function laneForX(state,x){ const L=state.config.lanesX; return (Math.abs(x-L[0])<=Math.abs(x-L[1]))?0:1; }
function xbowBand(state,t){ const {riverY,riverH,H}=state.config; return (t.side==='blue')?{yMin:riverY+riverH/2,yMax:H}:{yMin:0,yMax:riverY-riverH/2}; }
function kingOf(state,s){ return state.towers.find(t=>t.type==='king'&&t.side===s); }
function aliveXbow(state,s,lx){ const xs=state.towers.filter(t=>t.type==='xbow'&&t.side===s&&t.hp>0); if(!xs.length) return null; return xs.reduce((b,t)=>Math.abs(t.x-lx)<Math.abs(b.x-lx)?t:b,xs[0]); }
function enemyUnits(state,s){ return state.units.filter(u=>u.side!==s&&u.hp>0); }
function enemyTowers(state,s){ return state.towers.filter(t=>t.side!==s&&t.hp>0); }
function enemySide(s){ return s==='blue'?'red':'blue'; }
function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
function shuffle(a){ const arr=a.slice(); for(let i=arr.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function randRange(a,b){ return a + Math.random()*(b-a); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

// ---------- Red Spawn (random top-half walkable) ----------
function randomRedSpawnCell(state){
  const { riverY, riverH } = state.config;
  const { cols, rows, walk } = state.nav;
  const redMaxY = riverY - riverH / 2 - 20;
  for (let tries=0; tries<200; tries++){
    const cx=(Math.random()*cols)|0, cy=(Math.random()*rows)|0;
    const {x,y}=cellCenter(state,cx,cy);
    if (y > redMaxY) continue;
    if (walk[cy][cx] !== 1) continue;
    return {cx,cy};
  }
  return null;
}
