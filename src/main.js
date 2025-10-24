const qs = new URLSearchParams(location.search);
const VER = qs.get('v') || window.__LC_DEF_VER || 'dev';
window.__LC_VER = VER;

const { initDiag } = await import(`./diag.js?v=${VER}`);
const diag = initDiag({ version: VER });

try {
  diag.step(`boot: loading ui.js & game.js (v=${VER})`);
  const [{ initUI }, { initGame }] = await Promise.all([
    import(`./ui.js?v=${VER}`),
    import(`./game.js?v=${VER}`)
  ]);

  const ui   = initUI();
  const game = await initGame(diag);

  const $ = (id)=>document.getElementById(id);
  const bind = (id, fn) => { const b=$(id); if(!b){ diag.warn(`missing #${id}`); return; } b.onclick = (e)=>{ e.preventDefault(); fn(); }; };

  function goPlay(){ ui.showPlay(); game.start(); }
  function goMenu(){ ui.showMenu(); game.stop(); }
  function goEncy(){ ui.showEncy(); game.stop(); }
  function goLog(){ ui.showLog(); game.stop(); }

  bind('playBtn', goPlay);
  bind('openEncy', goEncy);
  bind('openLog', goLog);
  bind('backBtn', goMenu);
  bind('backFromPlay', goMenu);
  bind('backFromLog', goMenu);

  diag.ok('modules loaded');
  diag.ok('buttons wired');
  goMenu();
} catch (e) { console.error(e); diag.error(e?.message || 'boot failed'); }
