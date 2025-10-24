// src/game.js
import { initDiag } from './diag.js';
import { createGameState, update } from './logic.js';
import { initUI, draw } from './ui.js';

export async function boot(version = '0.1.4') {
  const diag = initDiag({ version });
  diag.step(`boot: loading ui.js & game.js (v=${version})`);

  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game'));
  const state = createGameState(canvas);
  initUI(state);
  diag.ok('modules loaded');
  diag.ok('buttons wired');

  let last = performance.now();

  function tick(now) {
    try {
      const dt = Math.max(0.001, Math.min(0.05, (now - last) / 1000));
      last = now;
      update(state, dt);
      draw(state);
    } catch (e) {
      console.error(e);
      const msg = e?.stack || e?.message || String(e);
      window.__LC_DIAG?.error(msg);
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
  return state;
}
