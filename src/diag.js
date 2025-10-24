export function initDiag({ version='dev' }={}){
  const qs = new URLSearchParams(location.search);
  const want = qs.get('debug')==='1';
  let box = document.getElementById('lc-diag');
  if (!box){
    box = document.createElement('div');
    box.id='lc-diag';
    box.innerHTML = `
      <div class="hdr"><strong>Diagnostics</strong><span class="v">v ${version}</span></div>
      <div class="rows"></div>
      <div class="hint">Press <kbd>D</kbd> to toggle</div>
    `;
    document.body.appendChild(box);
  }
  const rows = box.querySelector('.rows');
  function row(cls,msg){ const d=document.createElement('div'); d.className=`row ${cls}`; d.textContent=msg; rows.appendChild(d); rows.scrollTop=rows.scrollHeight; }
  const api = {
    step:(m)=>row('ok',`· ${m}`),
    ok:(m)=>row('ok',`✔ ${m}`),
    warn:(m)=>row('warn',`⚠ ${m}`),
    error:(m)=>row('err',`❌ ${m}`),
  };
  if (!want) box.style.display='none';
  document.addEventListener('keydown', (e)=>{ if (e.key.toLowerCase()==='d') box.style.display = (box.style.display==='none'?'block':'none'); });
  window.__LC_DIAG = api;
  return api;
}
