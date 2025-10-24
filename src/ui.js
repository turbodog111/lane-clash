// src/ui.js
import { tryDeployAt } from './logic.js';

const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const labelFor = (u)=>u.kind==='knight'?'K':u.kind==='archers'?'Ar':'MM';
const must = (id)=>{
  const el = document.getElementById(id);
  if (!el) { window.__LC_DIAG?.error(`Missing element #${id}`); }
  return el;
};

export function initUI(state){
  const canvas = /** @type {HTMLCanvasElement} */ (must('game'));
  const menu   = document.getElementById('screenMenu');
  const play   = document.getElementById('screenPlay');
  const enc    = document.getElementById('screenEncyclopedia');
  const log    = document.getElementById('screenUpdateLog');

  const btnPlay = document.getElementById('btnPlay');
  const btnEnc  = document.getElementById('btnEncyclopedia');
  const btnLog  = document.getElementById('btnUpdateLog');
  const backP   = document.getElementById('btnBackFromPlay');
  const backE   = document.getElementById('btnBackFromEnc') || document.getElementById('btnBackFromEncyclopedia');
  const backL   = document.getElementById('btnBackFromLog');

  function show(el){ if(el){ el.style.display=''; } }
  function hide(el){ if(el){ el.style.display='none'; } }
  function toMenu(){ show(menu); hide(play); hide(enc); hide(log); if (canvas) canvas.style.pointerEvents='none'; }
  function toPlay(){ hide(menu); show(play); hide(enc); hide(log); if (canvas) canvas.style.pointerEvents='auto'; }
  function toEnc(){ hide(menu); hide(play); show(enc); hide(log); if (canvas) canvas.style.pointerEvents='none'; }
  function toLog(){ hide(menu); hide(play); hide(enc); show(log); if (canvas) canvas.style.pointerEvents='none'; }

  // start on menu if exists, else play
  if (menu && play) toMenu(); else toPlay();

  btnPlay && btnPlay.addEventListener('click', toPlay);
  btnEnc  && btnEnc.addEventListener('click', toEnc);
  btnLog  && btnLog.addEventListener('click', toLog);
  backP   && backP.addEventListener('click', toMenu);
  backE   && backE.addEventListener('click', toMenu);
  backL   && backL.addEventListener('click', toMenu);

  // size canvas (target 900h)
  function resize(){
    const w = play ? play.clientWidth : (canvas.parentElement?.clientWidth || 1024);
    canvas.width = w; canvas.height = 900;
  }
  resize(); window.addEventListener('resize', resize, { passive:true });

  // select cards by clicking thumbnails (optional) or 1/2 keys
  const hand0 = document.getElementById('hand0');
  const hand1 = document.getElementById('hand1');
  const setSel = (slot)=>{
    state.selectedHandSlot = slot;
    state.showPlacementOverlay = slot!==null;
    [hand0,hand1].forEach((el,i)=>{ if(el) el.style.outline = (slot===i?'2px solid #68aaff':'none'); });
  };
  hand0 && hand0.addEventListener('click', ()=>setSel(0));
  hand1 && hand1.addEventListener('click', ()=>setSel(1));
  window.addEventListener('keydown', (e)=>{
    if (e.code==='Digit1'||e.key==='1') setSel(0);
    if (e.code==='Digit2'||e.key==='2') setSel(1);
    if (e.key==='Escape') setSel(null);
  }, { capture:true });

  // deploy on canvas click (only in play)
  canvas.addEventListener('click', (ev)=>{
    if (play && play.style.display==='none') return; // not in play
    const r = canvas.getBoundingClientRect();
    const mx = (ev.clientX - r.left) * (canvas.width / r.width);
    const my = (ev.clientY - r.top)  * (canvas.height / r.height);
    tryDeployAt(state, mx, my);
  });

  // update-comms
  state.onElixirChange = ()=>{};
  state.rebuildCardBar = ()=>{}; // (UI cards are optional here)

  window.__LC_DIAG?.ok('buttons wired');
}

// --------- RENDERING ----------
export function draw(state){
  const canvas = document.getElementById('game');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;
  const { W, H, lanesX, riverY, riverH, bridgeW } = state.config;

  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#0b1730'; ctx.fillRect(0,0,W,H);

  const g = ctx.createLinearGradient(0, riverY - riverH/2, 0, riverY + riverH/2);
  g.addColorStop(0,'#14476a'); g.addColorStop(1,'#0f3b5d'); ctx.fillStyle=g;
  ctx.fillRect(0, riverY - riverH/2, W, riverH);

  ctx.fillStyle='#80552d'; const bw=bridgeW, bh=20;
  ctx.fillRect(lanesX[0]-bw/2, riverY - bh - 6, bw, bh);
  ctx.fillRect(lanesX[0]-bw/2, riverY + 6,     bw, bh);
  ctx.fillRect(lanesX[1]-bw/2, riverY - bh - 6, bw, bh);
  ctx.fillRect(lanesX[1]-bw/2, riverY + 6,     bw, bh);

  // placement grid (if selecting)
  if (state.showPlacementOverlay) {
    const tile = state.config.tile, y0 = riverY + riverH/2 + 20;
    ctx.fillStyle='rgba(96,200,96,0.14)';
    for (let cy=0; cy<Math.floor(H/tile); cy++){
      for (let cx=0; cx<Math.floor(W/tile); cx++){
        const x=cx*tile+tile/2, y=cy*tile+tile/2;
        if (y<y0 || y>H-40) continue;
        if (state.canPlaceCell && state.canPlaceCell(cx,cy)) ctx.fillRect(cx*tile, cy*tile, tile-1, tile-1);
      }
    }
  }

  // towers
  for (const t of state.towers){
    ctx.fillStyle = t.side==='blue' ? '#6fb0ff' : '#ff8f8f';
    roundRect(ctx, t.x - t.r, t.y - t.r, t.r*2, t.r*2, 8); ctx.fill();
    drawHP(ctx, t.x, t.y - (t.r + 22), t.hp, t.maxHp);
  }

  // projectiles
  for (const p of state.projectiles){
    ctx.fillStyle='#ffd270'; ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill();
  }

  // units
  for (const u of state.units){
    const isBlue = u.side==='blue';
    ctx.fillStyle = isBlue ? '#6fb0ff' : '#ff8f8f';
    ctx.beginPath(); ctx.arc(u.x,u.y,u.radius,0,Math.PI*2); ctx.fill();
    ctx.lineWidth=3; ctx.strokeStyle = isBlue?'rgba(120,200,255,0.9)':'rgba(255,140,140,0.9)';
    ctx.beginPath(); ctx.arc(u.x,u.y,u.radius+3,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font='bold 12px ui-monospace, Consolas, monospace';
    ctx.textAlign='center'; ctx.fillText(labelFor(u), u.x, u.y+4);
    drawHP(ctx, u.x, u.y - (u.radius + 18), u.hp, u.maxHp);
  }

  // dmg text
  for (const f of state.floatDMG){
    ctx.globalAlpha = clamp(f.a,0,1);
    ctx.fillStyle='#ffd270'; ctx.font='bold 14px ui-monospace, Consolas, monospace';
    ctx.textAlign='center'; ctx.fillText(f.txt, f.x, f.y); ctx.globalAlpha=1;
  }

  // elixir segmented
  drawElixir(ctx, state);
}

function drawHP(ctx,x,y,hp,maxHp){
  const w=90,h=6,pct=clamp(hp/maxHp,0,1);
  ctx.fillStyle='#b8d0ff'; ctx.font='12px ui-monospace, Consolas, monospace';
  ctx.textAlign='center'; ctx.fillText(`${Math.max(0,hp|0)}`, x, y-5);
  roundRect(ctx, x-w/2, y, w, h, 3); ctx.fillStyle='#0a122a'; ctx.fill();
  roundRect(ctx, x-w/2, y, w*pct, h, 3); ctx.fillStyle='#3ad07a'; ctx.fill();
}
function drawElixir(ctx,state){
  const { W,H } = state.config;
  const x=20,y=H-90,width=W-40,height=12,segs=10;
  roundRect(ctx,x,y,width,height,6); ctx.fillStyle='#0a122a'; ctx.fill();
  const pct = clamp(state.elixir.blue/10,0,1);
  const segW = width/segs;
  for (let i=0;i<segs;i++){
    const filled = (i+1)/segs <= pct;
    roundRect(ctx, x+i*segW+2, y+2, segW-4, height-4, 4);
    ctx.fillStyle = filled ? '#60b8ff' : '#1a2b4d'; ctx.fill();
  }
  ctx.fillStyle='#b8d0ff'; ctx.font='12px ui-monospace, Consolas, monospace';
  ctx.textAlign='right'; ctx.fillText(`${state.elixir.blue.toFixed(1)} / 10`, x+width, y-6);
}
function roundRect(ctx,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);
  ctx.beginPath(); ctx.moveTo(x+rr,y);
  ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath();
}
