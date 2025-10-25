 // src/main.js
// Single module: diagnostics + UI + drawing + loop
import { createGameState, update, tryDeployAt, resetMatch } from './logic.js';

const VERSION = '0.2.0';

// ---------- Diagnostics (very small) ----------
function initDiag() {
  let box = document.getElementById('lc-diag');
  if (!box) {
    box = document.createElement('div');
    box.id = 'lc-diag';
    box.innerHTML =
      `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
         <strong>Diagnostics</strong><span id="lc-diag-ver" style="opacity:.75"></span>
       </div>
       <div id="lc-diag-rows"></div>
       <div style="margin-top:6px;opacity:.7">Press <kbd>D</kbd> to toggle</div>`;
    Object.assign(box.style, {
      position:'fixed', right:'10px', bottom:'10px', width:'360px', maxHeight:'50vh',
      overflow:'auto', padding:'10px', background:'#0b1224', border:'1px solid #21304f',
      borderRadius:'8px', color:'#cfe1ff', font:'12px/1.35 ui-monospace, Menlo, Consolas, monospace',
      zIndex: 99999
    });
    document.body.appendChild(box);

    const knob = document.createElement('button');
    knob.textContent = 'D'; knob.title = 'Diagnostics';
    Object.assign(knob.style, {
      position:'fixed', right:'10px', bottom:'10px', transform:'translateY(calc(100% + 8px))',
      width:'28px', height:'28px', borderRadius:'50%', border:'1px solid #21304f',
      background:'#0f1b33', color:'#cfe1ff', cursor:'pointer', zIndex:100000
    });
    knob.addEventListener('click', () => {
      box.style.display = (box.style.display === 'none') ? 'block' : 'none';
    });
    document.body.appendChild(knob);

    const keyHandler = (e) => {
      const k = (e.key || '').toLowerCase();
      if (k === 'd' || e.code === 'KeyD') {
        e.preventDefault(); // Prevent default behavior
        e.stopPropagation(); // Stop event from bubbling
        box.style.display = (box.style.display === 'none') ? 'block' : 'none';
      }
    };
    // Only add one event listener to avoid double-triggering
    document.addEventListener('keydown', keyHandler, { capture:true });
  }
  const rows = document.getElementById('lc-diag-rows');
  const ver  = document.getElementById('lc-diag-ver');
  ver.textContent = `v ${VERSION}`;
  const push = (tag, msg) => {
    const d = document.createElement('div'); d.textContent = `${tag} ${msg}`;
    rows.appendChild(d); rows.scrollTop = rows.scrollHeight;
  };
  const api = {
    ok:   (m) => push('✔', m),
    step: (m) => push('·', m),
    warn: (m) => push('⚠', m),
    err:  (m) => push('❌', m),
  };
  window.__LC_DIAG = api;
  return api;
}

// ---------- DOM helpers ----------
const $ = (id)=>document.getElementById(id);
const show = (el)=>{ if(el) el.style.display=''; };
const hide = (el)=>{ if(el) el.style.display='none'; };

// ---------- Canvas drawing helpers ----------
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const labelFor = (u)=>u.kind==='knight'?'K':u.kind==='archers'?'Ar':'MM';
function roundRect(ctx,x,y,w,h,r){ const rr=Math.min(r,w/2,h/2); ctx.beginPath();
  ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath();
}
function drawHP(ctx,x,y,hp,maxHp){
  const w=90,h=6,pct=clamp(hp/maxHp,0,1);
  ctx.fillStyle='#b8d0ff'; ctx.font='12px ui-monospace, Consolas, monospace';
  ctx.textAlign='center'; ctx.fillText(`${Math.max(0,hp|0)}`, x, y-5);
  roundRect(ctx, x-w/2, y, w, h, 3); ctx.fillStyle='#0a122a'; ctx.fill();
  roundRect(ctx, x-w/2, y, w*pct, h, 3); ctx.fillStyle='#3ad07a'; ctx.fill();
}

// ---------- Draw whole frame ----------
function draw(state){
  const canvas = $('game'); const ctx = canvas?.getContext('2d'); if (!ctx) return;
  const { W,H, lanesX, riverY, riverH, bridgeW } = state.config;

  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0b1730'; ctx.fillRect(0,0,W,H);

  // river
  const g = ctx.createLinearGradient(0, riverY - riverH/2, 0, riverY + riverH/2);
  g.addColorStop(0,'#14476a'); g.addColorStop(1,'#0f3b5d'); ctx.fillStyle=g;
  ctx.fillRect(0, riverY - riverH/2, W, riverH);

  // bridges
  ctx.fillStyle='#80552d'; const bw=bridgeW, bh=20;
  ctx.fillRect(lanesX[0]-bw/2, riverY - bh - 6, bw, bh);
  ctx.fillRect(lanesX[0]-bw/2, riverY + 6,     bw, bh);
  ctx.fillRect(lanesX[1]-bw/2, riverY - bh - 6, bw, bh);
  ctx.fillRect(lanesX[1]-bw/2, riverY + 6,     bw, bh);

  // Timer and mode display at top center
  const minutes = Math.floor(state.matchTimer / 60);
  const seconds = Math.floor(state.matchTimer % 60);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  ctx.fillStyle = '#1a2748';
  roundRect(ctx, W/2 - 120, 15, 240, 40, 8);
  ctx.fill();

  ctx.fillStyle = '#b8d0ff';
  ctx.font = 'bold 18px ui-monospace, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(timeStr, W/2, 38);

  ctx.fillStyle = '#8ea6d9';
  ctx.font = '12px ui-monospace, Consolas, monospace';
  ctx.fillText(state.matchMode, W/2, 50);

  // placement overlay
  if (state.showPlacementOverlay) {
    const tile=state.config.tile, y0=riverY+riverH/2+20;
    ctx.fillStyle='rgba(96,200,96,0.14)';
    for(let cy=0; cy<Math.floor(H/tile); cy++){
      for(let cx=0; cx<Math.floor(W/tile); cx++){
        const y = cy*tile + tile/2;
        if (y<y0 || y>H-40) continue;
        if (state.canPlaceCell && state.canPlaceCell(cx,cy))
          ctx.fillRect(cx*tile, cy*tile, tile-1, tile-1);
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

  // damage text
  for (const f of state.floatDMG){
    ctx.globalAlpha = clamp(f.a,0,1);
    ctx.fillStyle='#ffd270'; ctx.font='bold 14px ui-monospace, Consolas, monospace';
    ctx.textAlign='center'; ctx.fillText(f.txt, f.x, f.y); ctx.globalAlpha=1;
  }

  // segmented elixir bar
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

// ---------- Start everything ----------
async function start(){
  const diag = initDiag(); diag.step('boot: main.js');

  const canvas = $('game');
  if (!canvas) { diag.err('Missing <canvas id="game">'); return; }

  // screens & buttons (IDs must match)
  const scrMenu=$('screenMenu'), scrPlay=$('screenPlay'), scrEnc=$('screenEncyclopedia'), scrLog=$('screenUpdateLog');
  const btnPlay=$('btnPlay'), btnEnc=$('btnEncyclopedia'), btnLog=$('btnUpdateLog');
  const backP=$('btnBackFromPlay'), backE=$('btnBackFromEnc'), backL=$('btnBackFromLog');

  const showMenu=()=>{ show(scrMenu); hide(scrPlay); hide(scrEnc); hide(scrLog); canvas.style.pointerEvents='none'; };
  const showPlay=()=>{ hide(scrMenu); show(scrPlay); hide(scrEnc); hide(scrLog); canvas.style.pointerEvents='auto'; };
  const showEnc =()=>{ hide(scrMenu); hide(scrPlay); show(scrEnc); hide(scrLog); canvas.style.pointerEvents='none'; };
  const showLog =()=>{ hide(scrMenu); hide(scrPlay); hide(scrEnc); show(scrLog); canvas.style.pointerEvents='none'; };

  (scrMenu && scrPlay) ? showMenu() : showPlay();

  btnPlay && btnPlay.addEventListener('click', showPlay);
  btnEnc  && btnEnc.addEventListener('click', showEnc);
  btnLog  && btnLog.addEventListener('click', showLog);
  backP   && backP.addEventListener('click', showMenu);
  backE   && backE.addEventListener('click', showMenu);
  backL   && backL.addEventListener('click', showMenu);

  // encyclopedia tabs
  const tabCards = $('tabCards'), tabProgression = $('tabProgression');
  const tabContentCards = $('tabContentCards'), tabContentProgression = $('tabContentProgression');

  const switchTab = (activeTab, activeContent) => {
    // Remove active class from all tabs
    [tabCards, tabProgression].forEach(tab => tab && tab.classList.remove('active'));
    // Hide all tab contents
    [tabContentCards, tabContentProgression].forEach(content => content && (content.style.display = 'none'));
    // Activate selected tab and content
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.style.display = 'block';
  };

  tabCards && tabCards.addEventListener('click', () => switchTab(tabCards, tabContentCards));
  tabProgression && tabProgression.addEventListener('click', () => switchTab(tabProgression, tabContentProgression));

  // canvas size
  function resize(){
    const w = canvas.parentElement?.clientWidth || 1024;
    canvas.width = w; canvas.height = 900;
  }
  resize(); window.addEventListener('resize', resize, { passive:true });

  // state & card bar
  const state = createGameState(canvas);
  const hand0 = $('hand0'), hand1 = $('hand1');
  const renderSlot = (el, card) => {
    if (!el) return;
    if (!card) { el.innerHTML = '<div class="muted">Empty</div>'; return; }
    el.innerHTML = `
      <img src="${card.img}" alt="${card.name}" />
      <div>
        <div style="font-weight:600">${card.name}</div>
        <div class="muted">Cost: ${card.cost}</div>
      </div>`;
  };
  state.rebuildCardBar = () => {
    renderSlot(hand0, state.cards[state.hand[0]]);
    renderSlot(hand1, state.cards[state.hand[1]]);
  };
  state.rebuildCardBar();

  // End game overlay elements
  const endGameOverlay = $('endGameOverlay');
  const endGameTitle = $('endGameTitle');
  const coinsEarnedEl = $('coinsEarned');
  const damageDealtEl = $('damageDealt');
  const towersDestroyedEl = $('towersDestroyed');
  const btnPlayAgain = $('btnPlayAgain');
  const btnBackToMenu = $('btnBackToMenu');
  const totalCoinsEl = $('totalCoins');

  // Function to update coins display
  const updateCoinsDisplay = () => {
    if (totalCoinsEl) totalCoinsEl.textContent = state.coins.toLocaleString();
  };

  // Function to show end game screen
  const showEndGame = () => {
    if (!endGameOverlay) return;

    // Set title based on winner
    if (state.winner === 'blue') {
      endGameTitle.textContent = 'Victory! 🎉';
    } else if (state.winner === 'red') {
      endGameTitle.textContent = 'Defeat';
    } else {
      endGameTitle.textContent = 'Draw';
    }

    // Set stats
    if (coinsEarnedEl) coinsEarnedEl.textContent = state.matchCoins.toLocaleString();
    if (damageDealtEl) damageDealtEl.textContent = Math.round(state.damageDealt).toLocaleString();
    if (towersDestroyedEl) towersDestroyedEl.textContent = state.towersDestroyed.blue;

    endGameOverlay.style.display = 'flex';
    updateCoinsDisplay();
  };

  // Play again button
  btnPlayAgain && btnPlayAgain.addEventListener('click', () => {
    resetMatch(state);
    if (endGameOverlay) endGameOverlay.style.display = 'none';
  });

  // Back to menu from end game
  btnBackToMenu && btnBackToMenu.addEventListener('click', () => {
    if (endGameOverlay) endGameOverlay.style.display = 'none';
    showMenu();
  });

  // Timer update callback
  state.onTimerChange = () => {
    // Check if game just ended
    if (state.winner && endGameOverlay && endGameOverlay.style.display === 'none') {
      showEndGame();
    }
  };

  // Initial coins display
  updateCoinsDisplay();

  // select cards (click or 1/2 keys)
  const setSel = (s)=>{ state.selectedHandSlot=s; state.showPlacementOverlay=(s!==null); [hand0,hand1].forEach((el,i)=>{ if(!el)return; el.style.outline=(s===i?'2px solid #68aaff':'none'); }); };
  hand0 && hand0.addEventListener('click', ()=>setSel(0));
  hand1 && hand1.addEventListener('click', ()=>setSel(1));
  window.addEventListener('keydown', (e)=>{
    const k=(e.key||'').toLowerCase();
    if (k==='1') setSel(0);
    if (k==='2') setSel(1);
    if (k==='escape') setSel(null);
  }, { capture:true });

  // deploy by clicking canvas (only when play visible)
  canvas.addEventListener('click',(ev)=>{
    if (scrPlay && scrPlay.style.display==='none') return;
    const r = canvas.getBoundingClientRect();
    const mx = (ev.clientX - r.left) * (canvas.width / r.width);
    const my = (ev.clientY - r.top)  * (canvas.height / r.height);
    tryDeployAt(state, mx, my);
  });

  // safe RAF loop (paused when not on play)
  let last = performance.now();
  function tick(now){
    try{
      const dt = Math.max(0.001, Math.min(0.05, (now-last)/1000)); last = now;
      // Update when play screen is visible (or doesn't exist for testing)
      if (!scrPlay || scrPlay.style.display !== 'none'){ update(state, dt); draw(state); }
    }catch(e){ console.error(e); window.__LC_DIAG?.err(e?.stack || e?.message || String(e)); }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  diag.ok('buttons wired');
  diag.ok('boot complete');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once:true });
} else {
  start();
}
