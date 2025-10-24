// src/boot.js
const VERSION = '0.1.4';
window.LC_VERSION = VERSION;

// Simple fatal overlay
function showFatal(msg) {
  let box = document.getElementById('lc-fatal');
  if (!box) {
    box = document.createElement('pre');
    box.id = 'lc-fatal';
    Object.assign(box.style, {
      position:'fixed', inset:'16px', background:'#0b1224', color:'#f6d5d5',
      border:'1px solid #3b4763', borderRadius:'10px', padding:'14px',
      font:'12px/1.4 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      whiteSpace:'pre-wrap', zIndex: 999999
    });
    document.body.appendChild(box);
  }
  box.textContent = 'Fatal load error:\n' + msg;
}
window.addEventListener('error',  e => showFatal(e.message || String(e)));
window.addEventListener('unhandledrejection', e => showFatal(e.reason?.stack || e.reason?.message || String(e.reason)));

(async () => {
  const { initDiag } = await import(`./diag.js?v=${VERSION}`);
  const diag = initDiag({ version: VERSION, startOpen:true }); // force open
  diag.step(`boot: requesting game.js (v=${VERSION})`);

  const { boot } = await import(`./game.js?v=${VERSION}`);
  await boot(VERSION);
  diag.ok('boot complete');
})();
