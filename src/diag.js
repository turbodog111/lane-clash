// src/diag.js
export function initDiag({ version = 'dev' } = {}) {
  // Ensure DOM is ready before building UI
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(version), { once: true });
  } else {
    init(version);
  }
  // Return a stub API immediately (will be replaced once UI is ready)
  const api = {
    step:  (...m) => console.log('[Diag][step]', ...m),
    ok:    (...m) => console.log('%c[Diag][ok]', 'color:#8ff0a4', ...m),
    warn:  (...m) => console.warn('[Diag][warn]', ...m),
    error: (...m) => console.error('[Diag][err]', ...m),
  };
  // Stash so other modules can call before UI mounts
  window.__LC_DIAG = api;
  return api;
}

function init(version) {
  const qs = new URLSearchParams(location.search);
  const startOpen = qs.get('debug') === '1';

  // Create (or reuse) panel
  let box = document.getElementById('lc-diag');
  if (!box) {
    box = document.createElement('div');
    box.id = 'lc-diag';
    box.innerHTML = `
      <div class="hdr">
        <strong>Diagnostics</strong>
        <span class="v">v ${version}</span>
      </div>
      <div class="rows"></div>
      <div class="hint">Click the D badge or press <kbd>D</kbd> to toggle</div>
    `;
    // Minimal inline safety styles in case CSS didn't load
    Object.assign(box.style, {
      position:'fixed', right:'10px', bottom:'10px', width:'360px', maxHeight:'50vh',
      overflow:'auto', padding:'8px 10px', background:'#091126', border:'1px solid #21304f',
      borderRadius:'8px', boxShadow:'0 6px 30px rgba(0,0,0,.3)', color:'#cfe1ff',
      font:'12px/1.3 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      zIndex:'99999'
    });
    document.body.appendChild(box);
  }
  box.style.display = startOpen ? 'block' : 'none';

  // Floating toggle knob
  let knob = document.getElementById('lc-diag-toggle');
  if (!knob) {
    knob = document.createElement('button');
    knob.id = 'lc-diag-toggle';
    knob.type = 'button';
    knob.title = 'Diagnostics (press D)';
    knob.textContent = 'D';
    Object.assign(knob.style, {
      position:'fixed', right:'10px', bottom:'10px', transform:'translateY(calc(100% + 8px))',
      width:'28px', height:'28px', borderRadius:'50%', border:'1px solid #21304f',
      background:'#0f1b33', color:'#cfe1ff', cursor:'pointer', zIndex:'100000'
    });
    knob.addEventListener('click', toggle);
    document.body.appendChild(knob);
  }

  function toggle() {
    box.style.display = (box.style.display === 'none') ? 'block' : 'none';
  }

  // Robust key handling (works even when canvas has focus)
  window.addEventListener('keydown', (e) => {
    // Accept D/d or code KeyD
    const key = (e.key || '').toLowerCase();
    if (key === 'd' || e.code === 'KeyD') {
      toggle();
      // don’t interfere with gameplay typing (no preventDefault)
    }
  }, { capture: true });

  const rows = box.querySelector('.rows');
  function row(cls, msg) {
    const d = document.createElement('div');
    d.className = `row ${cls}`;
    d.textContent = msg;
    rows.appendChild(d);
    rows.scrollTop = rows.scrollHeight;
  }

  // Replace the provisional API with the live one
  const api = {
    step:  (m) => row('ok',   `· ${m}`),
    ok:    (m) => row('ok',   `✔ ${m}`),
    warn:  (m) => row('warn', `⚠ ${m}`),
    error: (m) => row('err',  `❌ ${m}`),
  };
  window.__LC_DIAG = api;

  // Initial breadcrumb
  api.ok('Diagnostics ready (press D or click the D badge)');
}
