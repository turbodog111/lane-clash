// src/render.js
let helpers = { labelFor: (k)=>k, getState: ()=>null };
export function setupRenderer(canvas){
  const ctx = canvas.getContext('2d');

  function setHelpers(h){ helpers = { ...helpers, ...h }; }

  function drawAll(state){
    // --- background ---
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#0d1b2a'; ctx.fillRect(0,0,canvas.width,canvas.height);

    // river
    const riverY = state.config.riverY, riverH = state.config.riverH;
    const g = ctx.createLinearGradient(0, riverY-riverH/2, 0, riverY+riverH/2);
    g.addColorStop(0, '#1e5a8a'); g.addColorStop(1, '#0e3d66');
    ctx.fillStyle = g; ctx.fillRect(0, riverY-riverH/2, canvas.width, riverH);

    // bridges (simple planks)
    ctx.fillStyle = '#7a5736';
    const bw = state.config.bridgeW, bh = state.config.bridgeH;
    for (const x of state.config.lanesX){
      ctx.fillRect(x - bw/2, riverY - bh/2, bw, 24);
      ctx.fillRect(x - bw/2, riverY + bh/2 - 24, bw, 24);
    }

    // towers
    for (const t of state.towers){
      if (t.hp <= 0) continue;
      ctx.fillStyle = (t.side==='blue') ? '#5aa8ff' : '#ff7b7b';
      const r = t.r;
      roundRect(ctx, t.x-r, t.y-r, r*2, r*2, 8); ctx.fill();

      // hp bar
      const w = 80, h = 6, hpw = Math.max(0, w * (t.hp/t.maxHp));
      ctx.fillStyle='#0b132b'; ctx.fillRect(t.x-w/2, t.y-r-16, w, h);
      ctx.fillStyle='#6bff95'; ctx.fillRect(t.x-w/2, t.y-r-16, hpw, h);
      ctx.fillStyle='#cfe1ff'; ctx.font='12px system-ui'; ctx.textAlign='center';
      ctx.fillText(Math.max(0,Math.floor(t.hp)).toString(), t.x, t.y-r-20);
    }

    // units
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for (const u of state.units){
      if (u.hp<=0) continue;
      ctx.beginPath();
      ctx.arc(u.x, u.y, 12, 0, Math.PI*2);
      ctx.fillStyle = u.side==='blue' ? '#2b6bf0' : '#d64f4f';
      ctx.fill();
      ctx.strokeStyle = '#e5eeff'; ctx.lineWidth=2; ctx.stroke();

      ctx.fillStyle='#ffffff';
      ctx.font='12px system-ui';
      ctx.fillText(helpers.labelFor(u.kind), u.x, u.y);

      // tiny hp text
      ctx.fillStyle='#cfe1ff'; ctx.font='10px system-ui';
      ctx.fillText(Math.max(0,Math.floor(u.hp)).toString(), u.x, u.y-20);
    }

    // projectiles / particles are drawn by your existing fx renderer if any
  }

  return { drawAll, setHelpers };
}

function roundRect(ctx, x, y, w, h, r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}
