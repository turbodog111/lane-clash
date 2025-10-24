export async function initGame(diag){
  const VER = window.__LC_VER || 'dev';
  const logic  = await import(`./logic.js?v=${VER}`);
  const render = await import(`./render.js?v=${VER}`);

  const { createGameState, update, tryDeployAt } = logic;
  const { setupRenderer } = render;

  const canvas     = document.getElementById('game');
  const cardsWrap  = document.getElementById('cards');
  const elixirFill = document.getElementById('elixirFill');
  const elixirText = document.getElementById('elixirText');

  const state = createGameState(canvas);

  state.onElixirChange = () => {
    const pct = Math.min(1, state.elixir.blue/state.config.ELIXIR_MAX);
    elixirFill.style.width = `${pct*100}%`;
    elixirText.textContent = Math.floor(state.elixir.blue).toString();
  };
  state.rebuildCardBar = () => {
    cardsWrap.innerHTML = '';
    state.hand.forEach((idx, slot) => {
      const c = state.cards[idx];
      const btn = document.createElement('button');
      btn.className = 'cardBtn';
      btn.innerHTML = `<img src="${c.img}" alt="${c.name} card"><div class="meta"><strong>${c.name}</strong><span>Cost: ${c.cost}</span></div>`;
      btn.onclick = () => {
        state.selectedHandSlot = slot;
        for (const el of cardsWrap.querySelectorAll('.cardBtn')) el.classList.remove('selected');
        btn.classList.add('selected');
        state.showPlacementOverlay = true;
      };
      cardsWrap.appendChild(btn);
    });
  };
  state.rebuildCardBar(); state.onElixirChange();

  const { drawAll } = setupRenderer(canvas);

  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (canvas.width / r.width);
    const y = (e.clientY - r.top)  * (canvas.height/ r.height);
    tryDeployAt(state, x, y);
  });

  let raf=0,last=0,running=false;
  function frame(ts){ if(!running) return; const dt=Math.min(0.05,(ts-last)/1000)||0.016; last=ts; update(state,dt); drawAll(state); raf=requestAnimationFrame(frame); }
  function start(){ if(running) return; running=true; last=performance.now(); raf=requestAnimationFrame(frame); }
  function stop(){ running=false; if(raf) cancelAnimationFrame(raf); }

  return { start, stop, getState:()=>state };
}
