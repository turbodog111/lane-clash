import { initUI } from './ui.js';
import { initGame } from './game.js';

/** Show build info from GitHub Pages (Liquid) or fallback to version.json */
function initVersion() {
  const el = document.getElementById('version');
  if (!el) return;

  const commit = el.getAttribute('data-commit') || '';
  const built  = el.getAttribute('data-built') || '';
  const liquidResolved = commit && !commit.includes('{{');

  if (liquidResolved) {
    el.textContent = `dev ${commit} • ${built}`;
    return;
  }
  // Fallback: fetch version.json (cache-busted)
  fetch(`version.json?ts=${Date.now()}`).then(r => r.ok ? r.json() : null)
    .then(v => {
      if (v && (v.version || v.builtAt)) {
        el.textContent = `${v.version || 'dev'} • ${v.builtAt || ''}`.trim();
      } else {
        el.textContent = 'dev-local';
      }
    })
    .catch(() => { el.textContent = 'dev-local'; });
}

document.addEventListener('DOMContentLoaded', () => {
  initVersion();

  const { showMenu, showPlay, showEncy } = initUI();
  const game = initGame();

  document.getElementById('playBtn').addEventListener('click', () => {
    showPlay();
    game.start();
  });
  document.getElementById('openEncy').addEventListener('click', showEncy);
  document.getElementById('backBtn').addEventListener('click', showMenu);
  document.getElementById('backFromPlay').addEventListener('click', showMenu);
});
