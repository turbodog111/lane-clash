import { createGameState, update, tryDeployAt } from './logic.js';
import { setupRenderer } from './render.js';

export function initGame() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const cardsRoot = document.getElementById('cards');
  const elixirFill = document.getElementById('elixirFill');
  const elixirText = document.getElementById('elixirText');

  const state = createGameState(canvas);
  const renderer = setupRenderer(ctx, state);

  // ---------- Card HUD ----------
  function refreshElixirUI() {
    const max = state.config.ELIXIR_MAX;
    elixirFill.style.transform = `scaleX(${state.elixir.blue / max})`;
    elixirText.textContent = String(Math.floor(state.elixir.blue));
    [...cardsRoot.children].forEach((node, i) => {
      const c = state.cards[state.hand[i]];
      node.classList.toggle('disabled', state.elixir.blue < c.cost);
      node.classList.toggle('selected', state.selectedHandSlot === i);
    });
  }
  function rebuildCardBar() {
    cardsRoot.innerHTML = '';
    state.hand.forEach((idx, slot) => {
      const c = state.cards[idx];
      const btn = document.createElement('button');
      btn.className = 'cardBtn' + (state.selectedHandSlot===slot?' selected':'');
      btn.type='button';
      btn.title = `${c.name} — Cost ${c.cost}`;
      btn.addEventListener('click', () => {
        state.selectedHandSlot = (state.selectedHandSlot===slot? null : slot);
        refreshElixirUI();
      });

      const thumb = document.createElement('div'); thumb.className='thumb';
      const img = document.createElement('img'); img.src=c.img; img.alt=`${c.name} card`;
      img.onerror = () => { thumb.textContent = c.name[0]; };
      thumb.appendChild(img);

      const meta = document.createElement('div'); meta.className='meta';
      const name = document.createElement('div'); name.className='name'; name.textContent=c.name;
      const cost = document.createElement('div'); cost.className='cost'; cost.textContent=`Cost: ${c.cost}`;
      meta.appendChild(name); meta.appendChild(cost);

      btn.appendChild(thumb); btn.appendChild(meta);
      cardsRoot.appendChild(btn);
    });
    refreshElixirUI();
  }
  state.onElixirChange = refreshElixirUI;
  state.rebuildCardBar = rebuildCardBar;
  rebuildCardBar();

  // ---------- Input (deploy) ----------
  function canvasPoint(ev){
    const r = canvas.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * (canvas.width / r.width),
             y: (ev.clientY - r.top)  * (canvas.height / r.height) };
  }
  canvas.addEventListener('click', (ev) => {
    const { x, y } = canvasPoint(ev);
    if (tryDeployAt(state, x, y)) refreshElixirUI();
  });

  // ---------- Main Loop ----------
  let last = performance.now(), raf = 0;
  function loop(now){
    const dt = Math.min(0.033, Math.max(0, (now - last) / 1000)); last = now;
    update(state, dt);
    renderer.drawAll(state);
    raf = requestAnimationFrame(loop);
  }

  return {
    start(){ if (!raf) raf = requestAnimationFrame(loop); },
    stop(){ if (raf){ cancelAnimationFrame(raf); raf = 0; } }
  };
}
