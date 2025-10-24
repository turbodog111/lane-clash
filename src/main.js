// src/main.js
const qs = new URLSearchParams(location.search);
const VER = qs.get('v') || window.__LC_DEF_VER || 'dev';
window.__LC_VER = VER;

const { initDiag } = await import(`./diag.js?v=${VER}`);
const diag = initDiag({ version: VER });

try {
  diag.step(`boot: loading ui.js & game.js (v=${VER})`);
  const [{ initUI }, { initGame }] = await Promise.all([
    import(`./ui.js?v=${VER}`),
    import(`./game.js?v=${VER}`) // NOTE: game.js will version-load logic/render too
  ]);
  diag.ok('modules loaded');

  // init UI + Game
  const ui = initUI();
  const game = await initGame(diag); // async; returns {start, stop, getState}

  // helpers keep gameplay paused unless Play is visible
  function goPlay(){ ui.showPlay(); game.start(); }
  function goMenu(){ ui.showMenu(); game.stop(); }
  function goEncy(){ ui.showEncy(); game.stop(); }
  function goLog(){ ui.showLog(); game.stop(); }

  // wire buttons (guarded)
  const $ = (id)=>document.getElementById(id);
  const bind = (id, fn) => { const b=$(id); if(!b){ diag.warn(`missing #${id}`); return; } b.addEventListener('click', (e)=>{ e.preventDefault(); fn(); }); };

  bind('playBtn', goPlay);
  bind('openEncy', goEncy);
  bind('openLog', goLog);
  bind('backBtn', goMenu);
  bind('backFromPlay', goMenu);
  bind('backFromLog', goMenu);

  diag.ok('buttons wired');

  // initial state: Menu (paused)
  goMenu();

  // simple health ping so you can see it’s running
  let ticks = 0;
  setInterval(()=> { try { const s = game.getState(); if (s) ticks++; } catch{} }, 1000);
  diag.step('health: ready');

} catch (e) {
  console.error(e);
  diag.error(e?.message || 'boot failed');
}
