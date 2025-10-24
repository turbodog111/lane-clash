import { initUI } from './ui.js';
import { initGame } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
  const { showMenu, showPlay, showEncy, showLog } = initUI();
  const game = initGame();

  document.getElementById('playBtn').addEventListener('click', () => {
    showPlay();
    game.start();
  });
  document.getElementById('openEncy').addEventListener('click', showEncy);
  document.getElementById('openLog').addEventListener('click', showLog);
  document.getElementById('backBtn').addEventListener('click', showMenu);
  document.getElementById('backFromPlay').addEventListener('click', showMenu);
  document.getElementById('backFromLog').addEventListener('click', showMenu);
});
