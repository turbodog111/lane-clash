export function setupRenderer(canvas){
  const ctx = canvas.getContext('2d');

  function drawAll(state){
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);

    // background
    ctx.fillStyle='#0d1730'; ctx.fillRect(0,0,W,H);

    // river
    const { riverY, riverH, lanesX, bridgeW } = state.config;
    const grad = ctx.createLinearGradient(0, riverY-riverH/2, 0, riverY+riverH/2);
    grad.addColorStop(0,'#1e5a8a'); grad.addColorStop(1,'#0e3d66');
    ctx.fillStyle=grad; ctx.fillRect(0,riverY-riverH/2,W,riverH);

    // bridges
    ctx.fillStyle='#7a5736';
    for (const x of lanesX){ ctx.fillRect(x-bridgeW/2, riverY-30, bridgeW, 24); ctx.fillRect(x-bridgeW/2, riverY+6, bridgeW, 24); }

    // towers
    for (const t of state.towers){
      if (t.hp<=0) continue;
      ctx.fillStyle = (t.side==='blue') ? '#5aa8ff' : '#ff7b7b';
      roundRect(ctx,t.x-t.r,t.y-t.r,t.r*2,t.r*2,8); ctx.fill();
      const w=80,h=6,hpw=Math.max(0,w*(t.hp/t.maxHp));
      ctx.fillStyle='#0b132b'; ctx.fillRect(t.x-w/2,t.y-t.r-16,w,h);
      ctx.fillStyle='#6bff95'; ctx.fillRect(t.x-w/2,t.y-t.r-16,hpw,h);
      ctx.fillStyle='#cfe1ff'; ctx.font='12px system-ui'; ctx.textAlign='center';
      ctx.fillText(`${Math.max(0,Math.floor(t.hp))}`, t.x, t.y-t.r-20);
    }

    // placement overlay
    if (state.showPlacementOverlay){
      const t = state.config.tile, { rows, cols } = state.nav;
      ctx.fillStyle='rgba(81,214,141,.16)';
      for (let cy=0; cy<rows; cy++) for (let cx=0; cx<cols; cx++) if (state.canPlaceCell(cx,cy)){
        const x=cx*t+t/2, y=cy*t+t/2; ctx.fillRect(x-t/2+1,y-t/2+1,t-2,t-2);
      }
    }

    // units
    for (const u of state.units){
      if (u.hp<=0) continue;
      ctx.beginPath(); ctx.arc(u.x,u.y,12,0,Math.PI*2); ctx.fillStyle=(u.side==='blue')?'#2b6bf0':'#d64f4f'; ctx.fill();
      ctx.strokeStyle='#e6eeff'; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='12px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(labelFor(u.kind), u.x, u.y);
      ctx.fillStyle='#cfe1ff'; ctx.font='10px system-ui'; ctx.fillText(`${Math.max(0,Math.floor(u.hp))}`, u.x, u.y-20);
    }

    // projectiles
    ctx.fillStyle='#ffd166';
    for (const p of state.projectiles){ ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill(); }

    // float dmg
    for (const f of state.floatDMG){ ctx.globalAlpha=Math.max(0,Math.min(1,f.a)); ctx.fillStyle='#ffd166'; ctx.font='12px system-ui'; ctx.textAlign='center'; ctx.fillText(f.txt,f.x,f.y); ctx.globalAlpha=1; }

    if (state.winner){ ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.font='40px system-ui'; ctx.textAlign='center'; ctx.fillText(state.winner==='blue'?'Victory!':'Defeat!', W/2, H/2); }
  }

  return { drawAll };
}
function roundRect(ctx,x,y,w,h,r){ const rr=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath(); }
function labelFor(k){ return k==='knight'?'K':k==='archers'?'Ar':'MM'; }
