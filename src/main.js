import { initUI } from './ui.js';
import { initGame } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
  const ui = initUI();
  const game = initGame();

  // Helpers to ensure gameplay state matches the visible screen
  function goPlay()  { ui.showPlay();  game.start(); }
  function goMenu()  { ui.showMenu();  game.stop(); }
  function goEncy()  { ui.showEncy();  game.stop(); }
  function goLog()   { ui.showLog();   game.stop(); }

  // Wire up buttons (guard in case any are missing)
  const $ = (id) => document.getElementById(id);

  const playBtn     = $('playBtn');
  const openEncy    = $('openEncy');
  const openLog     = $('openLog');
  const backBtn     = $('backBtn');
  const backFromPlay= $('backFromPlay');
  const backFromLog = $('backFromLog');

  if (playBtn)      playBtn.addEventListener('click',   (e)=>{ e.preventDefault(); goPlay(); });
  if (openEncy)     openEncy.addEventListener('click',  (e)=>{ e.preventDefault(); goEncy(); });
  if (openLog)      openLog.addEventListener('click',   (e)=>{ e.preventDefault(); goLog(); });
  if (backBtn)      backBtn.addEventListener('click',   (e)=>{ e.preventDefault(); goMenu(); });
  if (backFromPlay) backFromPlay.addEventListener('click',(e)=>{ e.preventDefault(); goMenu(); });
  if (backFromLog)  backFromLog.addEventListener('click',(e)=>{ e.preventDefault(); goMenu(); });

  // Land on menu (paused) by default
  goMenu();
});
