// ---------- Game State & Config ----------
export function createGameState(canvas){
  const W = canvas.width, H = canvas.height;
  const config = {
    W,H,
    lanesX: [W*0.25, W*0.75],
    riverY: H/2, riverH: 100,
    bridgeW: 120, bridgeH: 118,
    tile: 40,

    // economy
    ELIXIR_MAX: 10,
    ELIXIR_PER_SEC: 0.5, // 1 per 2s

    // path/aggro tuning
    AGGRO_RADIUS: 140,         // enter aggro
    AGGRO_EXIT_RADIUS: 180,    // leave aggro (hysteresis)
    TARGET_LOCK_TIME: 1.0,     // seconds to keep a target
    GOAL_EPS: 8,               // waypoint reach tolerance (px)
    BRIDGE_BUFFER_Y: 8,        // buffer past river before switching phase
    REPATH_TIME: 0.35,         // min seconds between repaths
    REPATH_MOVE_DST: 10,       // repath if moved this far since last path
    LANE_TOLERANCE: 80,        // same-lane check half-width
    CORRIDOR_W: 90,            // lane corridor half-width (cheaper A*)
    SEP_DIST: 18,              // friendly separation radius
    SEP_PUSH: 12,              // strength of separation push
    kingThreatRadius: 240,     // (available for future king-defense logic)
  };

  const state = {
    canvas, config,
    towers: [], units: [],
    projectiles: [],
    floatDMG: [],
    elixir: { blue: 5, red: 5 },
    winner: null,

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
    onElixirChange:()=>{}, rebuildCardBar:()=>{},
  };

  // starting hands (2-card rotation)
  state.hand     = [ state.deckOrder[0], state.deckOrder[1] ];
  state.ai.hand  = [ state.ai.deckOrder[0], state.ai.deckOrder[1] ];

  // towers
  const K = (side,x,y)=>({type:'king', side,x,y,r:26,hp:2000,maxHp:2000,rof:1.0,range:260,cd:0,awake:false});
  const X = (side,x,y)=>({type:'xbow', side,x,y,r:16,hp:1000,maxHp:1000,rof:1.0,range:300,cd:0});
  state.towers.push(
    K('blue', W/2, H-100),
    X('blue', config.lanesX[0], H-190),
    X('blue', config.lanesX[1], H-190),
    K('red',  W/2, 100),
    X('red',  config.lanesX[0], 190),
    X('red',  config.lanesX[1], 190),
  );

  buildNav(state);

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

// ---------- AI ----------
function aiUpdate(state, dt){
  const ai = state.ai; if (!ai.enabled) return;
  ai.timer -= dt; if (ai.timer>0) return;

  const choices = ai.hand
    .map((idx,slot)=>({idx,slot,card:state.cards[idx]}))
    .filter(x=>x.card.cost<=state.elixir.red);
  if (!choices.length){ ai.timer=1.0; return; }

  const pick = choices.sort((a,b)=>(b.card.cost+Math.random())-(a.card.cost+Math.random()))[0];
  const cell = randomRedSpawnCell(state);
  if (!cell){ ai.timer=1.0; return; }

  const { cx,cy }=cell; const {x,y}=cellCenter(state,cx,cy);
  state.elixir.red -= pick.card.cost;
  spawnUnits(state,'red',pick.card,cx,cy,x,y);
  ai.deckOrder = ai.deckOrder.filter(i=>i!==pick.idx).concat([pick.idx]);
  const next = ai.deckOrder.find(i => !ai.hand.includes(i)); if (next!==undefined) ai.hand[pick.slot]=next;

  ai.timer = randRange(ai.minInterval, ai.maxInterval);
}

// ---------- Mechanics ----------
function spawnUnits(state, side, card, cx, cy, x, y){
  const laneIndex = laneForX(state, x);
  for (let i=0;i<card.count;i++){
    const off=(card.count>1?(i===0?-12:12):0);
    const u={
      side,x:x+off,y, cx,cy,
      homeLaneIndex:laneIndex, homeLaneX:state.config.lanesX[laneIndex],
      hp:card.hp,maxHp:card.hp,dmg:card.dmg,atk:card.atk,cd:0,range:card.range,
      speed:card.speed,radius:card.radius, kind:card.id,type:card.type,
      phase:'toBridge', path:[], wp:0, repathCD:0, goal:null,
      // stabilization fields
      lockId:null, lockTimer:0,
      lastPathX:x+off, lastPathY:y,
    };
    // first goal: bridge entry on own side
    const pt = bridgeEntryPoint(state,u.side,u.homeLaneIndex);
    u.goal=pt; u.path=findPathWorld(state,{x:u.x,y:u.y},pt); u.wp=0; u.repathCD=state.config.REPATH_TIME;
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

  // ---- phase transitions across river (robust)
  const { riverY, riverH, BRIDGE_BUFFER_Y } = cfg;
  const riverTop = riverY - riverH/2, riverBot = riverY + riverH/2;

  // enter cross-bridge once you cross the river line
  if (u.phase==='toBridge' && ((u.side==='blue' && u.y < riverTop) || (u.side==='red' && u.y > riverBot))) {
    u.phase='crossBridge';
    u.goal = bridgeExitPoint(state,u.side,u.homeLaneIndex);
    u.repathCD = 0;
  }
  // enter attack once you've moved past a small buffer
  if (u.phase==='crossBridge' && ((u.side==='blue' && u.y < riverTop - BRIDGE_BUFFER_Y) ||
                                  (u.side==='red'  && u.y > riverBot + BRIDGE_BUFFER_Y))) {
    u.phase='attack';
    u.repathCD = 0;
  }

  // ---- choose target: hysteresis + short lock
  const ENTER = cfg.AGGRO_RADIUS, EXIT = cfg.AGGRO_EXIT_RADIUS;
  const sameSide = (e)=> ((u.side==='blue' && e.y>riverY) || (u.side==='red' && e.y<riverY));

  // Keep lock if still valid
  let targetUnit = null;
  u.lockTimer = Math.max(0, u.lockTimer - dt);
  if (u.lockId != null){
    const tgt = state.units.find(x=>x===u.lockId) || state.towers.find(x=>x===u.lockId);
    if (tgt && tgt.hp>0 && dist(u,tgt) <= EXIT && inSameLane(state,u,tgt.x) && sameSide(tgt)){
      targetUnit = tgt;
    } else {
      u.lockId = null;
    }
  }
  // Acquire new target if no lock (closest within ENTER, same side & lane)
  if (!targetUnit && u.lockTimer<=0){
    let best=null, bd=1e9;
    for (const e of enemyUnits(state,u.side)){
      if (e.hp<=0) continue;
      if (!sameSide(e)) continue;
      if (!inSameLane(state,u,e.x)) continue;
      const d=dist(u,e); if (d<bd){bd=d; best=e;}
    }
    if (best && bd<=ENTER){ targetUnit = best; u.lockId = best; u.lockTimer = cfg.TARGET_LOCK_TIME; }
  }

  const struct = laneStructureTarget(state,u);

  // ---- desired goal based on phase/target
  let desired = null;
  if      (u.phase==='toBridge')    desired = bridgeEntryPoint(state,u.side,u.homeLaneIndex);
  else if (u.phase==='crossBridge') desired = bridgeExitPoint(state,u.side,u.homeLaneIndex);
  else                               desired = targetUnit ? {x:targetUnit.x,y:targetUnit.y}
                                                           : (struct ? {x:struct.x,y:struct.y} : {x:u.x,y:u.y});

  // ---- repath throttled (time + movement + goal change)
  u.repathCD -= dt;
  const moved = Math.hypot(u.x - u.lastPathX, u.y - u.lastPathY);
  const needRepath =
    !u.path || u.wp>=u.path.length ||
    changedGoal(u.goal, desired, cfg.GOAL_EPS) ||
    (u.repathCD<=0 && moved >= cfg.REPATH_MOVE_DST);

  if (needRepath) {
    u.goal = desired;
    u.path = findPathWorld(state, {x:u.x,y:u.y}, desired);
    u.wp = 0;
    u.repathCD = cfg.REPATH_TIME;
    u.lastPathX = u.x; u.lastPathY = u.y;
  }

  // ---- move along path + gentle separation
  let vx=0, vy=0;
  const step = u.speed*dt;
  if (u.path && u.wp<u.path.length){
    const pt=u.path[u.wp]; const dx=pt.x-u.x, dy=pt.y-u.y; const d=Math.hypot(dx,dy);
    const EPS = cfg.GOAL_EPS;
    if (d <= Math.max(EPS, step*1.25)){ u.x=pt.x; u.y=pt.y; u.wp++; }
    else { vx += dx/d*step; vy += dy/d*step; }
  }
  for (const f of state.units){
    if (f===u || f.side!==u.side || f.hp<=0) continue;
    const dx=u.x-f.x, dy=u.y-f.y; const d=Math.hypot(dx,dy);
    if (d>0 && d<cfg.SEP_DIST){ const push=(1 - d/cfg.SEP_DIST)*(cfg.SEP_PUSH*dt); vx += (dx/d)*push; vy += (dy/d)*push; }
  }
  u.x += vx; u.y += vy;

  // ---- attack
  let victim = targetUnit;
  if (!victim && struct){
    const need = (u.type==='melee' ? ((struct.r||20)+u.radius+2) : u.range);
    if (dist(u,struct)<=need) victim = struct;
  }
  if (!victim){
    const meleeRange = (u.radius + 12 + 2);
    const near = enemyUnits(state,u.side).filter(e=>dist(u,e)<= (u.type==='melee' ? meleeRange : u.range));
    let best=null, bd=1e9; for (const e of near){ const dd=dist(u,e); if (dd<bd){bd=dd; best=e;} }
    if (best) victim = best;
  }
  u.cd -= dt;
  if (victim && u.cd<=0){ dealDamage(state, victim, u.dmg); u.cd=u.atk; }
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

// ---------- Navigation (lane-biased A*) ----------
function buildNav(state){
  const {W,H,tile,riverY,riverH,lanesX,bridgeW,CORRIDOR_W}=state.config;
  const cols=Math.floor(W/tile), rows=Math.floor(H/tile);
  const walk=Array.from({length:rows},()=>Array(cols).fill(1));
  const cost=Array.from({length:rows},()=>Array(cols).fill(3)); // default slightly expensive

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

      // lane-biased costs
      const near = nearestLaneX(lanesX, x);
      cost[cy][cx] = (Math.abs(x-near)<=CORRIDOR_W ? 1 : 3);
    }
  }

  // block around towers
  for (const t of state.towers){
    const rad=t.r+(t.type==='xbow'?6:12);
    for (let cy=0; cy<rows; cy++){
      for (let cx=0; cx<cols; cx++){
        const c=cellCenter(state,cx,cy);
        if (Math.hypot(c.x-t.x,c.y-t.y)<=rad){ walk[cy][cx]=0; cost[cy][cx]=999; }
      }
    }
  }

  state.nav={cols,rows,walk,cost};
}
function nearestLaneX(lanes,x){ return Math.abs(x-lanes[0])<=Math.abs(x-lanes[1])?lanes[0]:lanes[1]; }

function findPathWorld(state,from,to){
  const s=cellFromWorld(state,from.x,from.y), g=nearestWalkable(state,to.x,to.y);
  if (!s||!g) return [];
  const cells=aStar(state,s.cx,s.cy,g.cx,g.cy);
  return cells.map(c=>cellCenter(state,c.cx,c.cy));
}
function aStar(state,sx,sy,gx,gy){
  const {cols,rows,walk,cost}=state.nav;
  const key=(x,y)=>(y<<16)|x;
  const open=[]; const cmp=(a,b)=>a.f-b.f; function push(n){ open.push(n); open.sort(cmp); } function pop(){ return open.shift(); }
  const gScore=new Map(), fScore=new Map(), came=new Map();
  const startK=key(sx,sy), goalK=key(gx,gy);
  gScore.set(startK,0); fScore.set(startK,heur8(sx,sy,gx,gy));
  push({cx:sx,cy:sy,f:fScore.get(startK),k:startK});
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  while(open.length){
    const cur=pop(); if (cur.k===goalK) return reconstruct(came,cur);
    for (const [dx,dy] of dirs){
      const nx=cur.cx+dx, ny=cur.cy+dy;
      if (nx<0||ny<0||nx>=cols||ny>=rows) continue;
      if (walk[ny][nx]!==1) continue;
      if (dx&&dy && (walk[cur.cy][nx]!==1 || walk[ny][cur.cx]!==1)) continue;
      const nk=key(nx,ny);
      const step = (dx&&dy?1.4142:1) * (cost[ny][nx]||1);
      const cand=(gScore.get(cur.k)??Infinity)+step;
      if (cand < (gScore.get(nk)??Infinity)){
        came.set(nk,cur); gScore.set(nk,cand);
        const f=cand+heur8(nx,ny,gx,gy); fScore.set(nk,f); push({cx:nx,cy:ny,f,k:nk});
      }
    }
  }
  return [];
}
function reconstruct(came,cur){ const out=[{cx:cur.cx,cy:cur.cy}]; let n=cur; while(came.has(n.k)){ n=came.get(n.k); out.push({cx:n.cx,cy:n.cy}); } out.reverse(); return out; }
function heur8(x1,y1,x2,y2){ const dx=Math.abs(x1-x2),dy=Math.abs(y1-y2); const m=Math.min(dx,dy), M=Math.max(dx,dy); return M-m+1.4142*m; }

// ---------- Helpers ----------
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
function bridgeEntryPoint(state,side,laneIndex){
  const {lanesX,riverY,riverH}=state.config; const laneX=lanesX[laneIndex];
  const y=(side==='blue')? (riverY + riverH/2 - 12) : (riverY - riverH/2 + 12);
  const c=nearestWalkable(state,laneX,y);
  return c?cellCenter(state,c.cx,c.cy):{x:laneX,y};
}
function bridgeExitPoint(state,side,laneIndex){
  const {lanesX,riverY,riverH}=state.config; const laneX=lanesX[laneIndex];
  const y=(side==='blue')? (riverY - riverH/2 - 12) : (riverY + riverH/2 + 12);
  const c=nearestWalkable(state,laneX,y);
  return c?cellCenter(state,c.cx,c.cy):{x:laneX,y};
}
function xbowBand(state,t){ const {riverY,riverH,H}=state.config; return (t.side==='blue')?{yMin:riverY+riverH/2,yMax:H}:{yMin:0,yMax:riverY-riverH/2}; }
function kingOf(state,s){ return state.towers.find(t=>t.type==='king'&&t.side===s); }
function aliveXbow(state,s,lx){ const xs=state.towers.filter(t=>t.type==='xbow'&&t.side===s&&t.hp>0); if(!xs.length) return null; return xs.reduce((b,t)=>Math.abs(t.x-lx)<Math.abs(b.x-lx)?t:b,xs[0]); }
function enemyUnits(state,s){ return state.units.filter(u=>u.side!==s&&u.hp>0); }
function enemyTowers(state,s){ return state.towers.filter(t=>t.side!==s&&t.hp>0); }
function enemySide(s){ return s==='blue'?'red':'blue'; }
function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
function shuffle(a){ const arr=a.slice(); for(let i=arr.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }
function randRange(a,b){ return a + Math.random()*(b-a); }
function changedGoal(a,b,eps=6){ if(!a||!b) return true; return Math.abs(a.x-b.x)>eps || Math.abs(a.y-b.y)>eps; }
function inSameLane(state, u, x){ const laneX = state.config.lanesX[u.homeLaneIndex]; return Math.abs(x - laneX) <= state.config.LANE_TOLERANCE; }
function laneStructureTarget(state, u){ const foe=enemySide(u.side); const lx=state.config.lanesX[u.homeLaneIndex]; return aliveXbow(state,foe,lx) || kingOf(state,foe); }
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
  const cands=[];
  for (const laneX of state.config.lanesX){ const n=nearestWalkable(state,laneX,redMaxY); if(n) cands.push(n); }
  return cands.length ? cands[(Math.random()*cands.length)|0] : null;
}

// short label helper (renderer has its own fallback)
export const labelFor = (k)=> (k==='knight'?'K':k==='archers'?'Ar':'MM');
