// src/ui.js
// UI: inputs, view switching, and all rendering.
// Exports: initUI(state), draw(state)

import { tryDeployAt } from './logic.js';

// -------- utilities --------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp  = (a, b, t) => a + (b - a) * t;
const labelFor = (u) => (u.kind === 'knight' ? 'K' : u.kind === 'archers' ? 'Ar' : 'MM');

// -------- view helpers (safe: no-throw if missing) --------
function qs(id) { return document.getElementById(id) || null; }
function show(el) { if (el) el.style.display = ''; }
function hide(el) { if (el) el.style.display = 'none'; }

export function initUI(state) {
  const canvas = /** @type {HTMLCanvasElement} */ (qs('game'));
  const play    = qs('screenPlay') || qs('sectionPlay');
  const menu    = qs('screenMenu');
  const enc     = qs('screenEncyclopedia') || qs('sectionEncyclopedia');
  const log     = qs('screenUpdateLog') || qs('sectionUpdateLog');

  const btnPlay  = qs('btnPlay');
  const btnEnc   = qs('btnEncyclopedia');
  const btnLog   = qs('btnUpdateLog');
  const backP    = qs('btnBackFromPlay');
  const backE    = qs('btnBackFromEnc') || qs('btnBackFromEncyclopedia');
  const backL    = qs('btnBackFromLog');

  // Flexible start: if no menu exists, start directly in Play
  if (menu && play) { show(menu); hide(play); } else if (play) { show(play); }

  const toMenu = () => { if (menu) show(menu); hide(play); hide(enc); hide(log); };
  const toPlay = () => { hide(menu); show(play); hide(enc); hide(log); };
  const toEnc  = () => { hide(menu); hide(play); show(enc); hide(log); };
  const toLog  = () => { hide(menu); hide(play); hide(enc); show(log); };

  btnPlay && btnPlay.addEventListener('click', toPlay);
  btnEnc  && btnEnc.addEventListener('click', toEnc);
  btnLog  && btnLog.addEventListener('click', toLog);
  backP   && backP.addEventListener('click', toMenu);
  backE   && backE.addEventListener('click', toMenu);
  backL   && backL.addEventListener('click', toMenu);

  // Canvas sizing (900 tall target)
  function resize() {
    const targetH = 900;
    const w = canvas.clientWidth || (canvas.parentElement?.clientWidth ?? 1024);
    canvas.width  = w;
    canvas.height = targetH;
    // tell logic to rebuild tower/nav if you want; for now we use dynamic draw only
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // --- card selection & deployment ---
  // You can also click UI elements with id='hand0'/'hand1' if present
  const slotEls = [qs('hand0'), qs('hand1')];
  function select(slot) {
    state.selectedHandSlot = slot;
    state.showPlacementOverlay = (slot !== null);
    // optional highlight
    slotEls.forEach((el, i) => {
      if (!el) return;
      el.style.outline = (slot === i ? '2px solid #68aaff' : 'none');
    });
  }
  slotEls.forEach((el, i) => el && el.addEventListener('click', () => select(i)));

  // Keyboard: 1/2 selects, Esc cancels, E toggles grid
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Digit1' || e.key === '1') select(0);
    if (e.code === 'Digit2' || e.key === '2') select(1);
    if (e.key === 'Escape') select(null);
    if (e.key?.toLowerCase() === 'e') state.showPlacementOverlay = !state.showPlacementOverlay;
  });

  // Deploy by clicking canvas
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const my = (ev.clientY - rect.top)  * (canvas.height / rect.height);
    const placed = tryDeployAt(state, mx, my);
    if (!placed) {
      // feedback: flash overlay once if the click was invalid
      if (state.selectedHandSlot !== null) {
        state._flashInvalid = 0.5;
      }
    }
  });

  // Elixir bar data → redraw request (we draw it on the canvas)
  state.onElixirChange = () => { /* draw() reads state.elixir */ };

  // Card bar UI (optional images if you have them in HTML)
  state.rebuildCardBar = () => {
    slotEls.forEach((el, i) => {
      if (!el) return;
      const idx = state.hand[i];
      const card = state.cards[idx];
      el.innerHTML = card
        ? `<div class="slot"><img src="${card.img}" alt="${card.name}" style="height:64px;display:block;margin:auto"><div class="cap">${card.name} — Cost: ${card.cost}</div></div>`
        : `<div class="slot empty">Empty</div>`;
    });
  };
  state.rebuildCardBar();

  window.__LC_DIAG?.ok('buttons wired');
}

// ------------- RENDERING -------------
export function draw(state) {
  const ctx = /** @type {CanvasRenderingContext2D} */ (qs('game')?.getContext('2d'));
  if (!ctx) return;
  const { W, H, lanesX, riverY, riverH, bridgeW } = state.config;

  // clear
  ctx.clearRect(0,0,W,H);

  // background
  ctx.fillStyle = '#0b1730';
  ctx.fillRect(0,0,W,H);

  // river
  const g = ctx.createLinearGradient(0, riverY - riverH/2, 0, riverY + riverH/2);
  g.addColorStop(0, '#14476a');
  g.addColorStop(1, '#0f3b5d');
  ctx.fillStyle = g;
  ctx.fillRect(0, riverY - riverH/2, W, riverH);

  // bridges (two)
  ctx.fillStyle = '#80552d';
  const bw = bridgeW, bh = 20;
  ctx.fillRect(lanesX[0]-bw/2, riverY - bh - 6, bw, bh);
  ctx.fillRect(lanesX[0]-bw/2, riverY + 6,     bw, bh);
  ctx.fillRect(lanesX[1]-bw/2, riverY - bh - 6, bw, bh);
  ctx.fillRect(lanesX[1]-bw/2, riverY + 6,     bw, bh);

  // placement grid (only when selecting a card)
  if (state.showPlacementOverlay) {
    drawPlacementGrid(ctx, state);
  }
  // flash invalid placement
  if (state._flashInvalid) {
    state._flashInvalid = Math.max(0, state._flashInvalid - 1/60);
    ctx.fillStyle = `rgba(255,80,80,${state._flashInvalid*0.5})`;
    ctx.fillRect(0,0,W,H);
  }

  // towers
  for (const t of state.towers) {
    drawTower(ctx, t);
    drawHP(ctx, t.x, t.y - (t.r + 22), t.hp, t.maxHp);
  }

  // projectiles
  for (const p of state.projectiles) {
    ctx.fillStyle = '#ffd270';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
    ctx.fill();
  }

  // units
  for (const u of state.units) {
    drawUnit(ctx, u);
    drawHP(ctx, u.x, u.y - (u.radius + 18), u.hp, u.maxHp);
  }

  // damage text
  for (const f of state.floatDMG) {
    ctx.globalAlpha = clamp(f.a, 0, 1);
    ctx.fillStyle = '#ffd270';
    ctx.font = 'bold 14px ui-monospace, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(f.txt, f.x, f.y);
    ctx.globalAlpha = 1;
  }

  // segmented elixir bar (bottom of canvas)
  drawElixir(ctx, state);
}

// ------- drawing helpers -------
function drawTower(ctx, t) {
  const isBlue = t.side === 'blue';
  ctx.fillStyle = isBlue ? '#6fb0ff' : '#ff8f8f';
  roundRect(ctx, t.x - t.r, t.y - t.r, t.r*2, t.r*2, 8);
  ctx.fill();

  // subtle shadow “ring”
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.r + 8, 0, Math.PI*2);
  ctx.stroke();
}

function drawUnit(ctx, u) {
  const isBlue = u.side === 'blue';
  ctx.save();
  // base circle
  ctx.fillStyle = isBlue ? '#6fb0ff' : '#ff8f8f';
  ctx.beginPath();
  ctx.arc(u.x, u.y, u.radius, 0, Math.PI*2);
  ctx.fill();

  // team glow ring
  ctx.lineWidth = 3;
  ctx.strokeStyle = isBlue ? 'rgba(120,200,255,0.9)' : 'rgba(255,140,140,0.9)';
  ctx.beginPath();
  ctx.arc(u.x, u.y, u.radius + 3, 0, Math.PI*2);
  ctx.stroke();

  // label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px ui-monospace, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(labelFor(u), u.x, u.y + 4);
  ctx.restore();
}

function drawHP(ctx, x, y, hp, maxHp) {
  const w = 90, h = 6;
  const pct = clamp(hp / maxHp, 0, 1);
  // number above
  ctx.fillStyle = '#b8d0ff';
  ctx.font = '12px ui-monospace, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.max(0, hp|0)}`, x, y - 5);
  // bar
  roundRect(ctx, x - w/2, y, w, h, 3);
  ctx.fillStyle = '#0a122a';
  ctx.fill();
  roundRect(ctx, x - w/2, y, w * pct, h, 3);
  ctx.fillStyle = '#3ad07a';
  ctx.fill();
}

function drawElixir(ctx, state) {
  const { W, H } = state.config;
  const x = 20, y = H - 90, width = W - 40, height = 12, segs = 10;
  // track
  roundRect(ctx, x, y, width, height, 6);
  ctx.fillStyle = '#0a122a';
  ctx.fill();
  // fill (segmented)
  const pct = clamp(state.elixir.blue / 10, 0, 1);
  const segW = width / segs;
  for (let i = 0; i < segs; i++) {
    const filled = (i + 1) / segs <= pct;
    roundRect(ctx, x + i * segW + 2, y + 2, segW - 4, height - 4, 4);
    ctx.fillStyle = filled ? '#60b8ff' : '#1a2b4d';
    ctx.fill();
  }
  // label
  ctx.fillStyle = '#b8d0ff';
  ctx.font = '12px ui-monospace, Consolas, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${state.elixir.blue.toFixed(1)} / 10`, x + width, y - 6);
}

function drawPlacementGrid(ctx, state) {
  const { W, H, tile, riverY, riverH } = state.config;
  ctx.save();
  // only show on player's half
  const y0 = riverY + riverH/2 + 20;
  ctx.fillStyle = 'rgba(96, 200, 96, 0.14)';
  for (let cy = 0; cy < Math.floor(H / tile); cy++) {
    for (let cx = 0; cx < Math.floor(W / tile); cx++) {
      const cxW = cx * tile + tile / 2;
      const cyW = cy * tile + tile / 2;
      if (cyW < y0 || cyW > H - 40) continue;
      // ask logic if this cell is placeable
      if (state.canPlaceCell && state.canPlaceCell(cx, cy)) {
        ctx.fillRect(cx * tile, cy * tile, tile - 1, tile - 1);
      }
    }
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
