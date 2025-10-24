import { labelFor } from './logic.js';

export function setupRenderer(ctx, state) {
  const CSS = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#fff';
  const { W, H, riverY, riverH, lanesX, bridgeW, bridgeH } = state.config;

  function roundedRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y,   x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x,   y+h, r);
    ctx.arcTo(x,   y+h, x,   y,   r);
    ctx.arcTo(x,   y,   x+w, y,   r);
    ctx.closePath();
  }

  function drawBattlefield(){
    ctx.clearRect(0,0,W,H);

    // Ground halves
    ctx.fillStyle = '#0c1431';
    ctx.fillRect(0, 0, W, riverY - riverH/2);
    ctx.fillRect(0, riverY + riverH/2, W, H - (riverY + riverH/2));

    // River
    const grad = ctx.createLinearGradient(0, riverY-riverH/2, 0, riverY+riverH/2);
    grad.addColorStop(0, CSS('--riverHi')); grad.addColorStop(1, CSS('--river'));
    ctx.fillStyle = grad; ctx.fillRect(0, riverY - riverH/2, W, riverH);

    // Bridges
    ctx.fillStyle = CSS('--bridge');
    for (const x of lanesX){
      roundedRect(x - bridgeW/2, riverY - bridgeH/2, bridgeW, bridgeH, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
      for (let i=-3;i<=3;i++){ const bx = x + (i*bridgeW/7); ctx.beginPath(); ctx.moveTo(bx, riverY-bridgeH/2+6); ctx.lineTo(bx, riverY+bridgeH/2-6); ctx.stroke(); }
    }

    // Lane guides
    for (const x of lanesX){
      ctx.strokeStyle = CSS('--lane'); ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, H-40); ctx.stroke();
      ctx.strokeStyle = CSS('--laneCtr'); ctx.lineWidth = 2; ctx.setLineDash([8,8]); ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, H-40); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  function drawTower(t){
    ctx.save();
    const col = t.side === 'blue' ? CSS('--blue') : CSS('--red');

    if (t.type === 'king'){
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.ellipse(t.x, t.y+28, 36, 12, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = col; ctx.strokeStyle = '#0a0f25'; ctx.lineWidth = 3; roundedRect(t.x-28, t.y-36, 56, 72, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = CSS('--gold'); ctx.strokeStyle = '#7a5a00'; ctx.beginPath(); const cw=30;
      ctx.moveTo(t.x - cw/2, t.y - 40); ctx.lineTo(t.x - cw/6, t.y - 28); ctx.lineTo(t.x, t.y - 38); ctx.lineTo(t.x + cw/6, t.y - 28); ctx.lineTo(t.x + cw/2, t.y - 40); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.ellipse(t.x, t.y+18, 26, 9, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = col; ctx.strokeStyle = '#0a0f25'; ctx.lineWidth = 3; roundedRect(t.x-18, t.y-22, 36, 44, 8); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#c9cedd'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(t.x-20, t.y-4); ctx.lineTo(t.x+20, t.y-4); ctx.stroke();
    }

    const pct = Math.max(0, Math.min(1, t.hp/t.maxHp));
    const w = 60, h=6, bx=t.x-w/2, by=t.y-(t.type==='king'?52:38);
    ctx.fillStyle='#0a1129'; ctx.fillRect(bx,by,w,h);
    ctx.fillStyle='#6bff95'; ctx.fillRect(bx,by,w*pct,h);
    ctx.strokeStyle='#0a0f25'; ctx.strokeRect(bx,by,w,h);
    ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = '#dfe7ff';
    ctx.fillText(Math.max(0, Math.ceil(t.hp)), t.x, by-2);
    ctx.restore();
  }

  function drawUnit(u){
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#eaf4ff'; ctx.beginPath(); ctx.arc(u.x, u.y, u.radius, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.lineWidth = 2; ctx.strokeStyle = '#0a1a3d'; ctx.stroke();

    ctx.font = 'bold 11px system-ui, -apple-system, Segoe UI, Roboto, Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#0b1433';
    ctx.fillText(labelFor(u.kind), u.x, u.y);

    const w=38, h=5, bx=u.x-w/2, by=u.y - (u.radius+10);
    const pct = Math.max(0, Math.min(1, u.hp/u.maxHp));
    ctx.fillStyle='#0a1129'; ctx.fillRect(bx,by,w,h);
    ctx.fillStyle= pct>0.5 ? '#6bff95' : (pct>0.25? '#ffd166' : '#ff7b7b');
    ctx.fillRect(bx,by,w*pct,h);
    ctx.strokeStyle='#0a0f25'; ctx.strokeRect(bx,by,w,h);
    ctx.font='11px system-ui, -apple-system, Segoe UI, Roboto, Arial'; ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillStyle='#dfe7ff';
    ctx.fillText(Math.max(0, Math.ceil(u.hp)), u.x, by-2);
    ctx.restore();
  }

  function drawProjectiles(list){
    ctx.save();
    ctx.fillStyle = '#ffd166';
    ctx.shadowColor = 'rgba(255,209,102,0.6)'; ctx.shadowBlur = 8;
    for (const p of list){ ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, Math.PI*2); ctx.fill(); }
    ctx.restore();
  }

  function drawFX(state){
    ctx.save();
    for (const p of state.particles){
      const a = 1 - (p.life/p.ttl); if (a <= 0) continue;
      ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    }
    for (const f of state.floatDMG){
      const a = 1 - (f.life/f.ttl); if (a <= 0) continue;
      ctx.globalAlpha = a; ctx.font = 'bold 14px system-ui, -apple-system, Segoe UI, Roboto, Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  function drawAll(state){
    drawBattlefield();
    for (const t of state.towers) drawTower(t);
    for (const u of state.units)  drawUnit(u);
    drawProjectiles(state.projectiles);
    drawFX(state);
  }

  return { drawAll };
}
