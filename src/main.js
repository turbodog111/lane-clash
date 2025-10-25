 // src/main.js
// Single module: diagnostics + UI + drawing + loop
import { createGameState, update, tryDeployAt, resetMatch, upgradeCard, getUpgradeCost, getScaledStat } from './logic.js';

const VERSION = '0.3.4';

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
const labelFor = (u)=>u.kind==='knight'?'K':u.kind==='archers'?'Ar':u.kind==='mega'?'MG':u.kind==='skeletonarmy'?'SA':'MM';
function roundRect(ctx,x,y,w,h,r){ const rr=Math.min(r,w/2,h/2); ctx.beginPath();
  ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath();
}
function drawHP(ctx,x,y,hp,maxHp,level,recentDamage,flashAlpha,side){
  const w=90,h=6,pct=clamp(hp/maxHp,0,1);

  // Draw flash effect if flashAlpha > 0 (blue for blue side, red for red side)
  if (flashAlpha && flashAlpha > 0) {
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = side === 'blue' ? '#6fb0ff' : '#ff8f8f';
    ctx.fillRect(x - w/2 - 2, y - 2, w + 4, h + 4);
    ctx.globalAlpha = 1;
  }

  // Draw HP text with recent damage
  ctx.fillStyle='#b8d0ff'; ctx.font='12px ui-monospace, Consolas, monospace';
  ctx.textAlign='center';
  const hpText = `${Math.max(0,hp|0)}`;
  const damageText = recentDamage ? ` -${recentDamage|0}` : '';
  ctx.fillText(hpText, x - 15, y-5);

  // Draw recent damage in red
  if (recentDamage) {
    ctx.fillStyle='#ff6666';
    ctx.fillText(damageText, x + 15, y-5);
  }

  // Draw level number to the right
  if (level !== undefined && level > 0) {
    ctx.fillStyle='#ffd270';
    ctx.font='bold 10px ui-monospace, Consolas, monospace';
    ctx.fillText(`Lv${level}`, x + w/2 + 15, y + 4);
  }

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
    drawHP(ctx, t.x, t.y - (t.r + 22), t.hp, t.maxHp, 0, t.recentDamage, t.flashAlpha, t.side);
  }

  // projectiles
  for (const p of state.projectiles){
    ctx.fillStyle='#ffd270'; ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill();
  }

  // units
  for (const u of state.units){
    const isBlue = u.side==='blue';
    const card = state.cards.find(c => c.id === u.kind);

    // Draw unit image only (no circles)
    if (card && imageCache[card.id]) {
      const img = imageCache[card.id];
      // Make image size larger for better visibility
      const imgSize = u.radius * 3; // 3x the radius for better visibility
      const imgX = u.x - imgSize / 2;
      const imgY = u.y - imgSize / 2;

      // Draw colored border to indicate team
      ctx.strokeStyle = isBlue ? '#6fb0ff' : '#ff8f8f';
      ctx.lineWidth = 2;
      ctx.strokeRect(imgX - 1, imgY - 1, imgSize + 2, imgSize + 2);

      // Draw the card image
      ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
    }

    // Draw HP bar above unit with level and damage info
    drawHP(ctx, u.x, u.y - (u.radius * 1.8), u.hp, u.maxHp, u.level, u.recentDamage, u.flashAlpha, u.side);
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

// ---------- Image Loading ----------
const imageCache = {};

function loadImages(cards) {
  return Promise.all(
    cards.map(card => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          imageCache[card.id] = img;
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load image: ${card.img}`);
          resolve(); // Continue even if image fails
        };
        img.src = card.img;
      });
    })
  );
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
  const tabCards = $('tabCards'), tabDeck = $('tabDeck'), tabProgression = $('tabProgression');
  const tabContentCards = $('tabContentCards'), tabContentDeck = $('tabContentDeck'), tabContentProgression = $('tabContentProgression');

  const switchTab = (activeTab, activeContent) => {
    // Remove active class from all tabs
    [tabCards, tabDeck, tabProgression].forEach(tab => tab && tab.classList.remove('active'));
    // Hide all tab contents
    [tabContentCards, tabContentDeck, tabContentProgression].forEach(content => content && (content.style.display = 'none'));
    // Activate selected tab and content
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.style.display = 'block';
  };

  tabCards && tabCards.addEventListener('click', () => switchTab(tabCards, tabContentCards));
  tabDeck && tabDeck.addEventListener('click', () => { switchTab(tabDeck, tabContentDeck); renderDeck(); });
  tabProgression && tabProgression.addEventListener('click', () => switchTab(tabProgression, tabContentProgression));

  // Deck rendering
  const deckCardsContainer = $('deckCards');
  const deckTotalCoinsEl = $('deckTotalCoins');

  const renderDeck = () => {
    if (!deckCardsContainer) return;

    // Update coins display
    if (deckTotalCoinsEl) deckTotalCoinsEl.textContent = state.coins.toLocaleString();

    // Clear and rebuild deck
    deckCardsContainer.innerHTML = '';

    state.cards.forEach((card, index) => {
      const scaledHp = getScaledStat(card.hp, card.level);
      const scaledDmg = getScaledStat(card.dmg, card.level);
      const upgradeCost = getUpgradeCost(card);
      const isMaxLevel = card.level >= 5;
      const canAfford = upgradeCost && state.coins >= upgradeCost;

      const cardEl = document.createElement('div');
      cardEl.className = 'deck-card';
      cardEl.innerHTML = `
        <img src="${card.img}" alt="${card.name}" />
        <div class="deck-card-info">
          <h4>${card.name} <span class="rar rar-${card.rarity}">${card.rarity.toUpperCase()}</span></h4>
          <div class="deck-card-stats">
            <div class="deck-card-stat">
              <span class="deck-card-stat-label">HP:</span>
              <span class="deck-card-stat-value">${scaledHp}</span>
            </div>
            <div class="deck-card-stat">
              <span class="deck-card-stat-label">Damage:</span>
              <span class="deck-card-stat-value">${scaledDmg}</span>
            </div>
            <div class="deck-card-stat">
              <span class="deck-card-stat-label">Cost:</span>
              <span class="deck-card-stat-value">${card.cost} Elixir</span>
            </div>
            <div class="deck-card-stat">
              <span class="deck-card-stat-label">Type:</span>
              <span class="deck-card-stat-value">${card.type}</span>
            </div>
          </div>
        </div>
        <div class="deck-card-level">
          <div class="deck-card-level-display">Level ${card.level}</div>
          <div class="deck-card-upgrade-cost">
            ${isMaxLevel ? 'MAX LEVEL' : `Cost: ${upgradeCost?.toLocaleString() || 0} coins`}
          </div>
          <button class="btn ${canAfford ? 'primary' : ''}"
                  id="upgradeBtn${index}"
                  ${isMaxLevel || !canAfford ? 'disabled' : ''}>
            ${isMaxLevel ? 'Max Level' : 'Upgrade'}
          </button>
        </div>
      `;

      deckCardsContainer.appendChild(cardEl);

      // Add upgrade button handler
      const upgradeBtn = $(`upgradeBtn${index}`);
      if (upgradeBtn && !isMaxLevel) {
        upgradeBtn.addEventListener('click', () => {
          if (upgradeCard(state, index)) {
            updateCoinsDisplay();
            renderDeck();
          }
        });
      }
    });
  };

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

  // Load card images before starting game loop
  await loadImages(state.cards);
  diag.ok('images loaded');

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
