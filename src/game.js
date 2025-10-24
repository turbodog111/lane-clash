// src/game.js
export async function initGame(diag){
  const VER = window.__LC_VER || 'dev';

  // Versioned, single-shot dynamic imports
  const logic  = await import(`./logic.js?v=${VER}`);
  const render = await import(`./render.js?v=${VER}`);

  // Pull what we need into local names (no top-level duplicates)
  const { createGameState, update, tryDeployAt, rotateAfterPlay, labelFor } = logic;
  const { setupRenderer } = render;

  const canvas     = document.getElementById('game');
  const cardsWrap  = document.getElementById('cards');
  const elixirFill = document.getElementById('elixirFill');
  const elixirText = document.getElementById('elixirText');

  const state = createGameState(canvas);

  // ========= UI callbacks from state =========
  state.onElixirChange = () => {
    const pct = Math.min(1, state.elixir.blue/state.config.ELIXIR_MAX);
    elixirFill.style.width = `${pct*100}%`;
    elixirText.textContent = Math.floor(state.elixir.blue).toString();
  };

  state.rebuildCardBar = () => {
    cardsWrap.innerHTML = '';
    state.hand.forEach((cardIdx, slot) => {
      const c = state.cards[cardIdx];
      const btn = document.createElement('button');
      btn.className = 'cardBtn';
      btn.innerHTML = `
        <img src="${c.img}" alt="${c.name} card">
        <div class="meta"><strong>${c.name}</strong><span>Cost: ${c.cost}</span></div>
      `;
      btn.onclick = () => {
        state.selectedHandSlot = slot;
        for (const el of cardsWrap.querySelectorAll('.cardBtn')) el.classList.remove('selected');
        btn.classList.add('selected');
        state.showPlacementOverlay = true;
      };
      cardsWrap.appendChild(btn);
    });
  };

  state.rebuildCardBar();
  state.onElixirChange();

  // ========= Renderer =========
  const { drawAll, setHelpers } = setupRenderer(canvas);
  // provide helpers so render.js never imports logic.js
  setHelpers({ labelFor, getState: ()=>state });

  // ========= Input: placement =========
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top)  * (canvas.height/ rect.height);
    tryDeployAt(state, x, y);
  });

  // ========= Game Loop =========
  let raf = 0, last = 0, running = false;
  function frame(ts){
    if (!running) return;
    const dt = Math.min(0.05, (ts - last) / 1000) || 0.016;
    last = ts;
    update(state, dt);
    drawAll(state);
    raf = requestAnimationFrame(frame);
  }

  function start(){ if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop(){ running = false; if (raf) cancelAnimationFrame(raf); }

  // expose for diagnostics
  return { start, stop, getState: () => state };
}
