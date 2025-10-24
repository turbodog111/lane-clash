// src/diag.js
export function initDiag({ version = 'dev' } = {}) {
  const qs = new URLSearchParams(location.search);
  const auto = qs.get('debug') === '1';
  const el = document.createElement('div');
  el.id = 'lc-diag';
  el.style.cssText = `
    position:fixed; left:12px; bottom:12px; z-index:99999;
    background:rgba(12,18,40,.92); color:#cfe1ff; font:12px/1.4 system-ui,Segoe UI,Roboto,Arial;
    border:1px solid #24305a; border-radius:8px; padding:10px 12px; max-width:46ch;
    box-shadow:0 6px 20px rgba(0,0,0,.35); display:${auto?'block':'none'};
  `;
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px;">
      <strong>Diagnostics</strong><span style="opacity:.7">v ${version}</span>
    </div>
    <div id="lc-diag-body"></div>
    <div style="margin-top:8px; opacity:.75">Press <kbd>D</kbd> to toggle.</div>
  `;
  document.body.appendChild(el);
  const body = el.querySelector('#lc-diag-body');

  const lines = [];
  function render(){ body.innerHTML = lines.map(x => `<div>${x}</div>`).join(''); }
  function add(prefix, msg, color='#cfe1ff'){ lines.push(`<span style="color:${color}">${prefix}</span> ${escapeHtml(String(msg))}`); if(lines.length>120) lines.shift(); render(); }
  function step(m){ add('·', m, '#9ad1ff'); }
  function ok(m){ add('✔', m, '#6bff95'); }
  function warn(m){ add('▲', m, '#ffd166'); }
  function error(m){ add('✖', m, '#ff6b6b'); el.style.display='block'; }

  window.addEventListener('error', (e)=> error(e.message || 'Script error'));
  window.addEventListener('unhandledrejection', (e)=> error((e.reason && e.reason.message) || 'Unhandled promise rejection'));
  window.addEventListener('keydown', (e)=>{ if (e.key.toLowerCase()==='d') el.style.display = (el.style.display==='none'?'block':'none'); });

  const api = { step, ok, warn, error, show(){el.style.display='block';}, hide(){el.style.display='none';} };
  window.__LC_DIAG = api;
  return api;
}
function escapeHtml(s){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
