// All art is drawn in code, in the manner of red-figure vase painting:
// terracotta figures on black glaze, details in dark line, a meander (Greek key) frieze.
(function (RA) {
  const C = {
    glaze: '#110c0a', glaze2: '#1d1410', clay: '#c9733b', clayHi: '#e8a062', clayLo: '#9a4f25',
    line: '#1b0f09', bone: '#efe3c8', styx: '#4fb3a6', gold: '#e8bf55', blood: '#d2463a', wine: '#5a1d16',
  };
  const TIER_COL = [null, '#b3a393', '#d0965a', '#5fc8b9', '#f2c95c', '#f6f1ff'];
  RA.C = C;

  let canvas, ctx, W = 0, H = 0, dpr = 1;
  let enemy = null, enemyId = null;
  let shake = 0, flash = [], lunge = 0, dying = 0, floaters = [], embers = [], partFade = [];
  let state = { petrified: false };

  function resize() {
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }

  // ── Shared drawing helpers ─────────────────────────────────────
  function clayGrad(x0 = -80, y0 = -90, x1 = 80, y1 = 90) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, C.clayHi); g.addColorStop(0.55, C.clay); g.addColorStop(1, C.clayLo);
    return g;
  }
  function ln(w = 2.2, col = C.line) { ctx.lineWidth = w; ctx.strokeStyle = col; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
  function eyeAlmond(x, y, s = 1, glow) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(0, -5, 6, 0); ctx.quadraticCurveTo(0, 4, -6, 0);
    ctx.fillStyle = glow || C.bone; ctx.fill(); ln(1.4); ctx.stroke();
    ctx.beginPath(); ctx.arc(glow ? 0 : -1, 0, 1.8, 0, 7); ctx.fillStyle = C.line; ctx.fill();
    ctx.restore();
  }
  // A profile head facing left, roughly 60 units tall, origin at the centre of the skull.
  function profileHead(hairCol = C.line, longHair = false) {
    ctx.beginPath();
    ctx.moveTo(16, 34);
    ctx.bezierCurveTo(26, 14, 26, -24, 6, -30);
    ctx.bezierCurveTo(-8, -33, -16, -24, -17, -10);
    ctx.lineTo(-25, 3); ctx.lineTo(-18, 7);
    ctx.quadraticCurveTo(-21, 11, -17, 13); ctx.quadraticCurveTo(-20, 17, -15, 20);
    ctx.quadraticCurveTo(-16, 27, -8, 28);
    ctx.lineTo(-6, 44); ctx.lineTo(18, 44); ctx.closePath();
    ctx.fillStyle = clayGrad(-30, -30, 30, 40); ctx.fill(); ln(1.8); ctx.stroke();
    // hair mass
    ctx.beginPath();
    ctx.moveTo(-15, -14); ctx.bezierCurveTo(-14, -34, 18, -38, 24, -8);
    ctx.bezierCurveTo(26, 8, 22, longHair ? 46 : 22, 14, longHair ? 58 : 26);
    ctx.bezierCurveTo(8, 20, 8, -4, -2, -18); ctx.closePath();
    ctx.fillStyle = hairCol; ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-10 + i * 7, -22 + Math.abs(i - 1.5) * 2, 2.2, 0, 7); ctx.fillStyle = C.clayLo; ctx.fill(); }
    eyeAlmond(-11, -4, 0.75);
    ctx.beginPath(); ctx.moveTo(-16, -9); ctx.quadraticCurveTo(-11, -12, -6, -9); ln(1.4); ctx.stroke();
  }
  function snake(x, y, ang, len, t, ph) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, 0);
    const seg = 6;
    let px = 0, py = 0;
    for (let i = 1; i <= seg; i++) {
      px = (len * i) / seg; py = Math.sin(t * 4 + ph + i * 1.1) * 5 * (i / seg);
      ctx.lineTo(px, py);
    }
    ln(4.5, C.line); ctx.stroke(); ln(2, C.clayLo); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(px + 2, py, 4.5, 3, 0, 0, 7); ctx.fillStyle = C.line; ctx.fill();
    ctx.restore();
  }
  function glow(x, y, r, col, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  }

  // ── Enemies (drawn in a ~200×200 box around 0,0) ───────────────
  const DRAW = {
    umbra(t) {
      ctx.translate(0, Math.sin(t * 1.6) * 4);
      glow(0, -20, 110, 'rgba(79,179,166,0.35)', 0.6);
      ctx.beginPath(); ctx.moveTo(0, -88);
      ctx.bezierCurveTo(44, -88, 54, -30, 48, 34);
      const n = 6;
      for (let i = 0; i < n; i++) {
        const x0 = 48 - (96 * i) / n, x1 = 48 - (96 * (i + 1)) / n;
        ctx.quadraticCurveTo((x0 + x1) / 2, 78 + Math.sin(t * 3 + i * 1.7) * 9, x1, 40 + Math.sin(t * 2 + i) * 4);
      }
      ctx.bezierCurveTo(-54, -30, -44, -88, 0, -88);
      const g = ctx.createLinearGradient(0, -90, 0, 80);
      g.addColorStop(0, 'rgba(239,227,200,0.92)'); g.addColorStop(0.6, 'rgba(201,180,160,0.55)'); g.addColorStop(1, 'rgba(160,140,130,0.04)');
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -48, 20, 26, 0, 0, 7); ctx.fillStyle = C.glaze; ctx.fill();
      for (const s of [-1, 1]) {
        glow(s * 7, -50, 10, C.styx, 0.9);
        ctx.beginPath(); ctx.ellipse(s * 7, -50, 3, 2, 0, 0, 7); ctx.fillStyle = '#c9fff6'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(s * 42, -8);
        ctx.quadraticCurveTo(s * 70, 0 + Math.sin(t * 2 + s) * 10, s * 66, 30 + Math.sin(t * 2.4 + s) * 8);
        ln(7, 'rgba(239,227,200,0.35)'); ctx.stroke();
      }
    },
    furia(t) {
      for (const s of [-1, 1]) {
        ctx.save(); ctx.scale(s, 1); ctx.rotate(Math.sin(t * 3) * 0.05);
        ctx.beginPath(); ctx.moveTo(18, 0); ctx.bezierCurveTo(70, -70, 120, -60, 112, -20);
        ctx.bezierCurveTo(100, 0, 96, 10, 80, 30); ctx.bezierCurveTo(60, 30, 40, 30, 22, 30); ctx.closePath();
        ctx.fillStyle = C.wine; ctx.fill(); ln(2); ctx.stroke();
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(30 + i * 14, 28); ctx.quadraticCurveTo(50 + i * 12, -10, 50 + i * 14, -40 + i * 4); ln(1.2, '#8a3a2a'); ctx.stroke(); }
        ctx.restore();
      }
      ctx.beginPath(); ctx.moveTo(-28, 4); ctx.lineTo(28, 4); ctx.lineTo(40, 92); ctx.lineTo(-40, 92); ctx.closePath();
      ctx.fillStyle = clayGrad(); ctx.fill(); ln(2); ctx.stroke();
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 8, 14); ctx.lineTo(i * 12, 90); ln(1.2); ctx.stroke(); }
      for (let i = 0; i < 7; i++) snake(0, -44, -Math.PI + 0.25 + i * 0.44, 34 + (i % 2) * 10, t, i);
      ctx.beginPath(); ctx.ellipse(0, -34, 24, 28, 0, 0, 7); ctx.fillStyle = clayGrad(-20, -60, 20, 0); ctx.fill(); ln(2); ctx.stroke();
      eyeAlmond(-9, -38, 1, C.blood); eyeAlmond(9, -38, 1, C.blood);
      ctx.beginPath(); ctx.moveTo(-17, -47); ctx.lineTo(-3, -42); ctx.moveTo(17, -47); ctx.lineTo(3, -42); ln(2.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(-3, -26); ctx.lineTo(2, -25); ln(1.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, -17); ctx.quadraticCurveTo(0, -21, 8, -17); ln(2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(26, 12); ctx.lineTo(54, -14); ln(9, C.line); ctx.stroke(); ln(6, C.clay); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(56, -4); ctx.lineTo(62, -50); ln(5, '#3a2418'); ctx.stroke();
      const f = Math.sin(t * 13) * 3;
      glow(62, -62, 46, 'rgba(232,191,85,0.8)', 0.55);
      ctx.beginPath(); ctx.moveTo(62, -50); ctx.quadraticCurveTo(46 + f, -66, 63, -92 + f); ctx.quadraticCurveTo(78 - f, -66, 62, -50);
      ctx.fillStyle = C.gold; ctx.fill();
      ctx.beginPath(); ctx.moveTo(62, -52); ctx.quadraticCurveTo(55, -62, 62, -76 + f); ctx.quadraticCurveTo(69, -62, 62, -52); ctx.fillStyle = C.blood; ctx.fill();
    },
    harpyia(t) {
      const flap = Math.sin(t * 5) * 0.28;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * 18, -6); ctx.scale(s, 1); ctx.rotate(-0.15 + flap);
        for (let i = 0; i < 6; i++) {
          ctx.save(); ctx.rotate(-0.9 + i * 0.32);
          ctx.beginPath(); ctx.ellipse(48, 0, 50 - i * 3, 9, 0, 0, 7);
          ctx.fillStyle = i % 2 ? C.clay : C.clayHi; ctx.fill(); ln(1.6); ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
      ctx.beginPath(); ctx.ellipse(0, 22, 26, 40, 0, 0, 7); ctx.fillStyle = clayGrad(); ctx.fill(); ln(2); ctx.stroke();
      for (let r = 0; r < 4; r++) for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.arc(i * 8 + (r % 2) * 4, 4 + r * 13, 5, 0.2, Math.PI - 0.2); ln(1.2); ctx.stroke();
      }
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 10, 58); ctx.lineTo(s * 14, 82); ln(3.5); ctx.stroke();
        for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(s * 14, 82); ctx.lineTo(s * 14 + k * 7, 92); ln(2.5); ctx.stroke(); }
      }
      ctx.beginPath(); ctx.moveTo(-18, -44); ctx.bezierCurveTo(-30, -20, -24, 8, -36, 22); ctx.bezierCurveTo(-10, 4, 20, 4, 36, 22);
      ctx.bezierCurveTo(24, 8, 30, -20, 18, -44); ctx.closePath(); ctx.fillStyle = C.line; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -40, 17, 20, 0, 0, 7); ctx.fillStyle = clayGrad(-20, -60, 20, -20); ctx.fill(); ln(1.8); ctx.stroke();
      eyeAlmond(-6, -42, 0.8); eyeAlmond(6, -42, 0.8);
      ctx.beginPath(); ctx.moveTo(-5, -30); ctx.quadraticCurveTo(0, -27, 5, -30); ln(1.6); ctx.stroke();
    },
    echo(t) {
      for (let i = 0; i < 4; i++) {
        const ph = (t * 0.5 + i / 4) % 1;
        ctx.beginPath(); ctx.arc(0, 0, 20 + ph * 110, 0, 7);
        ctx.globalAlpha = (1 - ph) * 0.5; ln(2, C.styx); ctx.stroke(); ctx.globalAlpha = 1;
      }
      for (let i = 2; i >= 0; i--) {
        ctx.save(); ctx.translate(-26 + i * 34, -6 + Math.sin(t * 1.4 + i) * 3); ctx.scale(1.25, 1.25);
        ctx.globalAlpha = [1, 0.45, 0.2][i];
        profileHead(C.line, true);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    },
    sphinx(t) {
      ctx.translate(10, 0);
      ctx.save(); ctx.rotate(Math.sin(t * 1.2) * 0.04);
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(4, 26); ctx.bezierCurveTo(20 + i * 6, -10 - i * 10, 50 + i * 8, -60 - i * 8, 70 + i * 6, -72 + i * 12);
        ctx.bezierCurveTo(60, -40, 40, -8, 20, 30); ctx.closePath();
        ctx.fillStyle = i % 2 ? C.clay : C.clayHi; ctx.fill(); ln(1.6); ctx.stroke();
      }
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(78, 52); ctx.bezierCurveTo(100, 40, 96, 6, 104, -6); ln(3); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(104, -10, 5, 8, 0.3, 0, 7); ctx.fillStyle = C.line; ctx.fill();
      ctx.beginPath(); ctx.ellipse(10, 50, 64, 26, 0, 0, 7); ctx.fillStyle = clayGrad(); ctx.fill(); ln(2); ctx.stroke();
      ctx.beginPath(); ctx.arc(54, 50, 30, 0, 7); ctx.fillStyle = clayGrad(); ctx.fill(); ln(2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-36, 34, 24, 30, 0, 0, 7); ctx.fillStyle = clayGrad(); ctx.fill(); ln(2); ctx.stroke();
      for (const x of [-48, -28]) {
        ctx.beginPath(); ctx.rect(x, 48, 12, 38); ctx.fillStyle = C.clay; ctx.fill(); ln(1.8); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x + 3, 88, 11, 5, 0, 0, 7); ctx.fillStyle = C.clay; ctx.fill(); ln(1.8); ctx.stroke();
      }
      ctx.save(); ctx.translate(-36, -24); ctx.scale(0.95, 0.95); profileHead(C.line, true); ctx.restore();
    },
    gorgo(t) {
      const stone = state.petrified;
      for (let i = 0; i < 16; i++) snake(0, 0, (i / 16) * Math.PI * 2, 78, t, i * 0.7);
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(s * 44, -40); ctx.quadraticCurveTo(s * 70, -78, s * 82, -54); ctx.quadraticCurveTo(s * 66, -48, s * 50, -28); ctx.closePath();
        ctx.fillStyle = C.clayHi; ctx.fill(); ln(1.6); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, 54, 0, 7); ctx.fillStyle = clayGrad(-50, -50, 50, 50); ctx.fill(); ln(2.4); ctx.stroke();
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(s * 20, -14, 13, 10, 0, 0, 7); ctx.fillStyle = stone ? '#d9e9e6' : C.bone; ctx.fill(); ln(2); ctx.stroke();
        if (stone) glow(s * 20, -14, 22, C.styx, 0.8);
        ctx.beginPath(); ctx.arc(s * 20, -14, 5.5, 0, 7); ctx.fillStyle = C.line; ctx.fill();
        ctx.beginPath(); ctx.moveTo(s * 36, -30); ctx.quadraticCurveTo(s * 20, -36, s * 6, -28); ln(3); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(-10, 8); ctx.quadraticCurveTo(0, 12, 10, 8); ctx.lineTo(6, -10); ln(2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-32, 18); ctx.quadraticCurveTo(0, 46, 32, 18); ctx.quadraticCurveTo(0, 30, -32, 18);
      ctx.fillStyle = C.line; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-8, 26); ctx.quadraticCurveTo(0, 54 + Math.sin(t * 3) * 3, 8, 26); ctx.fillStyle = C.blood; ctx.fill();
      for (const x of [-26, 26]) { ctx.beginPath(); ctx.moveTo(x - 4, 21); ctx.lineTo(x, 34); ctx.lineTo(x + 4, 22); ctx.fillStyle = C.bone; ctx.fill(); }
      for (let i = -2; i <= 2; i++) if (i) { ctx.beginPath(); ctx.moveTo(i * 6 - 2, 23); ctx.lineTo(i * 6, 28); ctx.lineTo(i * 6 + 2, 23); ctx.fillStyle = C.bone; ctx.fill(); }
    },
    tantalus(t) {
      const reach = (Math.sin(t * 0.9) + 1) / 2;
      ctx.save(); ctx.translate(98 + reach * 10, -108);
      ctx.beginPath(); ctx.moveTo(40, -10); ctx.quadraticCurveTo(0, 0, -36, 40 + reach * 6); ln(4, '#3a2418'); ctx.stroke();
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(-4 - i * 7, 14 + i * 6, 8, 3.5, 0.8, 0, 7); ctx.fillStyle = '#6f7d4a'; ctx.fill(); }
      for (let i = 0; i < 3; i++) {
        const x = -30 + i * 12, y = 52 + i * 4 + reach * 6;
        ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x, y - 6); ln(1.2, '#3a2418'); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fillStyle = C.gold; ctx.fill(); ln(1.4); ctx.stroke();
      }
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(10, 30); ctx.quadraticCurveTo(28, -10, 40 + reach * 8, -42 + reach * 4); ln(11, C.line); ctx.stroke(); ln(7.5, C.clay); ctx.stroke();
      ctx.save(); ctx.translate(-6, 6); ctx.scale(-1.15, 1.15); ctx.rotate(-0.25); profileHead(C.line, false); ctx.restore();
      ctx.beginPath(); ctx.moveTo(-320, 40);
      for (let x = -320; x < 320; x += 20) ctx.quadraticCurveTo(x + 10, 34 + Math.sin(t * 2 + x * 0.05) * 5, x + 20, 40);
      ctx.lineTo(320, 104); ctx.lineTo(-320, 104); ctx.closePath();
      const g = ctx.createLinearGradient(0, 30, 0, 110); g.addColorStop(0, 'rgba(79,179,166,0.75)'); g.addColorStop(1, 'rgba(17,12,10,0.9)');
      ctx.fillStyle = g; ctx.fill();
    },
    cerberus(t, parts) {
      ctx.beginPath(); ctx.ellipse(0, 66, 82, 44, 0, 0, 7); ctx.fillStyle = clayGrad(-80, 20, 80, 110); ctx.fill(); ln(2); ctx.stroke();
      for (let i = 0; i < 9; i++) snake(-60 + i * 15, 34, -Math.PI / 2 + (i - 4) * 0.12, 22, t, i);
      ctx.beginPath(); ctx.arc(0, 30, 70, 0.35, Math.PI - 0.35); ln(7, C.line); ctx.stroke();
      for (let i = 0; i < 7; i++) { const a = 0.45 + i * ((Math.PI - 0.9) / 6); ctx.beginPath(); ctx.arc(Math.cos(a) * 70, 30 + Math.sin(a) * 70, 3, 0, 7); ctx.fillStyle = C.gold; ctx.fill(); }
      const pos = [[-62, -6, -0.35, 1], [0, -40, 0.05, 1], [62, -6, 0.35, -1]];
      pos.forEach(([x, y, r, face], i) => {
        const alive = !parts || !parts[i] || parts[i].alive;
        ctx.save(); ctx.translate(x, y + (alive ? Math.sin(t * 3 + i) * 3 : 18)); ctx.rotate(alive ? r : r + 0.6 * face); ctx.scale(face, 1);
        if (!alive) ctx.globalAlpha = 0.35;
        const jaw = alive ? 0.25 + Math.sin(t * 4 + i * 2) * 0.12 : 0.05;
        ctx.beginPath(); ctx.arc(10, -6, 24, 0, 7); ctx.fillStyle = clayGrad(-20, -30, 30, 20); ctx.fill(); ln(2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(14, -26); ctx.lineTo(28, -50); ctx.lineTo(30, -20); ctx.closePath(); ctx.fillStyle = C.clayLo; ctx.fill(); ln(1.6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-6, -22); ctx.lineTo(-44, -12); ctx.lineTo(-46, -2); ctx.lineTo(-10, 4); ctx.closePath(); ctx.fillStyle = C.clay; ctx.fill(); ln(1.8); ctx.stroke();
        ctx.save(); ctx.translate(-8, 6); ctx.rotate(jaw);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-36, 2); ctx.lineTo(-34, 10); ctx.lineTo(2, 10); ctx.closePath(); ctx.fillStyle = C.clay; ctx.fill(); ln(1.8); ctx.stroke();
        for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-32 + k * 8, 2); ctx.lineTo(-30 + k * 8, -4); ctx.lineTo(-28 + k * 8, 2); ctx.fillStyle = C.bone; ctx.fill(); }
        ctx.restore();
        ctx.beginPath(); ctx.ellipse(-46, -7, 4, 3, 0, 0, 7); ctx.fillStyle = C.line; ctx.fill();
        if (alive) { glow(-4, -14, 10, C.blood, 0.9); eyeAlmond(-4, -14, 0.8, '#ffb199'); }
        else { ctx.beginPath(); ctx.moveTo(-8, -18); ctx.lineTo(0, -10); ctx.moveTo(0, -18); ctx.lineTo(-8, -10); ln(2); ctx.stroke(); }
        ctx.restore();
      });
    },
    charon(t) {
      ctx.save(); ctx.translate(0, Math.sin(t * 1.3) * 3); ctx.rotate(Math.sin(t * 1.1) * 0.02);
      ctx.beginPath(); ctx.moveTo(78, -126); ctx.lineTo(-30, 96); ln(5, '#3a2418'); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-26, -66); ctx.quadraticCurveTo(-48, 0, -50, 52); ctx.lineTo(26, 52); ctx.quadraticCurveTo(22, -10, 10, -66); ctx.closePath();
      ctx.fillStyle = '#2a1d17'; ctx.fill(); ln(2, '#6b4a36'); ctx.stroke();
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-18 + i * 9, -40); ctx.quadraticCurveTo(-26 + i * 12, 10, -34 + i * 16, 50); ln(1.2, '#4a3426'); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(-8, -72, 22, 0, 7); ctx.fillStyle = '#2a1d17'; ctx.fill(); ln(2, '#6b4a36'); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-12, -68, 13, 15, 0, 0, 7); ctx.fillStyle = '#060404'; ctx.fill();
      for (const x of [-17, -7]) { glow(x, -70, 8, C.styx, 1); ctx.beginPath(); ctx.arc(x, -70, 1.8, 0, 7); ctx.fillStyle = '#d6fffa'; ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(8, -36); ctx.lineTo(40, -60); ln(8, '#2a1d17'); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-120, 44); ctx.quadraticCurveTo(0, 104, 120, 44); ctx.lineTo(108, 52); ctx.quadraticCurveTo(0, 90, -108, 52); ctx.closePath();
      ctx.fillStyle = '#3a2418'; ctx.fill(); ln(2, C.clayLo); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-120, 44); ctx.lineTo(120, 44); ln(3, C.clay); ctx.stroke();
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 30 - 6, 52); ctx.lineTo(i * 30 + 6, 52); ln(1.4, C.clayLo); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(108, 44); ctx.lineTo(116, 2); ln(3, '#3a2418'); ctx.stroke();
      const sway = Math.sin(t * 2) * 4;
      glow(118 + sway, 22, 44, C.styx, 0.7);
      ctx.beginPath(); ctx.rect(112 + sway, 12, 12, 18); ctx.fillStyle = '#bff3eb'; ctx.fill(); ln(1.5); ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 4; i++) {
        const x = ((t * 14 + i * 90) % 360) - 180;
        ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.ellipse(x, 70 + i * 6, 60, 8, 0, 0, 7); ctx.fillStyle = C.bone; ctx.fill(); ctx.globalAlpha = 1;
      }
    },
    minos(t) {
      ctx.beginPath(); ctx.rect(-56, -84, 112, 150); ctx.fillStyle = C.glaze2; ctx.fill(); ln(3, C.clayLo); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-56, -84); ctx.lineTo(0, -104); ctx.lineTo(56, -84); ctx.closePath(); ctx.fillStyle = C.clayLo; ctx.fill(); ln(2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-26, -24); ctx.lineTo(26, -24); ctx.lineTo(44, 74); ctx.lineTo(-44, 74); ctx.closePath();
      ctx.fillStyle = clayGrad(-40, -20, 40, 80); ctx.fill(); ln(2); ctx.stroke();
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 7, -16); ctx.lineTo(i * 13, 72); ln(1.2); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-44, 50); ctx.lineTo(44, 50); ln(4, C.line); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -48, 20, 0, 7); ctx.fillStyle = clayGrad(-20, -70, 20, -30); ctx.fill(); ln(2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-20, -44); ctx.quadraticCurveTo(-22, -10, 0, -6); ctx.quadraticCurveTo(22, -10, 20, -44);
      ctx.quadraticCurveTo(0, -34, -20, -44); ctx.fillStyle = C.line; ctx.fill();
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-12 + i * 6, -20 + Math.abs(i - 2) * -2, 2.4, 0, 7); ctx.fillStyle = C.clayLo; ctx.fill(); }
      eyeAlmond(-7, -52, 0.7); eyeAlmond(7, -52, 0.7);
      ctx.beginPath(); ctx.moveTo(-18, -64);
      for (let i = 0; i <= 6; i++) ctx.lineTo(-18 + i * 6, i % 2 ? -82 : -66);
      ctx.lineTo(18, -64); ctx.closePath(); ctx.fillStyle = C.gold; ctx.fill(); ln(1.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(40, -86); ctx.lineTo(40, 70); ln(4, C.gold); ctx.stroke();
      ctx.beginPath(); ctx.arc(40, -90, 7, 0, 7); ctx.fillStyle = C.gold; ctx.fill(); ln(1.5); ctx.stroke();
      ctx.save(); ctx.translate(-74, 30); ctx.rotate(Math.sin(t * 7) * 0.12);
      ctx.beginPath(); ctx.moveTo(-8, -38); ctx.lineTo(8, -38); ctx.quadraticCurveTo(6, -28, 16, -18); ctx.quadraticCurveTo(26, 6, 10, 30);
      ctx.lineTo(-10, 30); ctx.quadraticCurveTo(-26, 6, -16, -18); ctx.quadraticCurveTo(-6, -28, -8, -38); ctx.closePath();
      ctx.fillStyle = clayGrad(-20, -40, 20, 30); ctx.fill(); ln(2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(18, -6); ctx.moveTo(-19, 6); ctx.lineTo(19, 6); ln(4, C.line); ctx.stroke();
      ctx.restore();
    },
  };

  // Greek key frieze along a horizontal band.
  function meander(y, h) {
    const u = h / 5;
    ctx.save();
    ctx.fillStyle = C.glaze2; ctx.fillRect(0, y, W, h);
    ctx.beginPath();
    for (let x = -u * 5; x < W + u * 5; x += u * 5) {
      ctx.moveTo(x, y + h - u * 0.5);
      ctx.lineTo(x, y + u * 0.5); ctx.lineTo(x + u * 4, y + u * 0.5); ctx.lineTo(x + u * 4, y + u * 3.5);
      ctx.lineTo(x + u * 2, y + u * 3.5); ctx.lineTo(x + u * 2, y + u * 2);
      ctx.moveTo(x, y + h - u * 0.5); ctx.lineTo(x + u * 5, y + h - u * 0.5);
    }
    ctx.lineWidth = Math.max(1.2, u * 0.55); ctx.strokeStyle = C.clayLo; ctx.lineCap = 'square'; ctx.stroke();
    ctx.restore();
  }

  RA.Art = {
    init(c) {
      canvas = c; ctx = c.getContext('2d');
      resize();
      window.addEventListener('resize', resize, { passive: true });
      for (let i = 0; i < 26; i++) embers.push({ x: Math.random(), y: Math.random(), v: 0.02 + Math.random() * 0.05, r: 0.6 + Math.random() * 1.6 });
    },
    resize,
    setEnemy(e) {
      enemy = e; enemyId = e ? e.id : null; dying = 0; floaters = []; flash = []; partFade = [];
    },
    hit(part, dmg, tier) {
      shake = Math.min(14, 3 + dmg / 8);
      flash[part] = 1;
      const n = enemy ? enemy.parts.length : 1;
      floaters.push({ x: n > 1 ? [-0.24, 0, 0.24][part] : (Math.random() - 0.5) * 0.2, y: 0, t: 0, txt: dmg > 0 ? '−' + dmg : '0', col: TIER_COL[tier] || C.bone, big: tier >= 4 });
    },
    text(txt, col) { floaters.push({ x: 0, y: 0, t: 0, txt, col: col || C.bone, big: false }); },
    strike() { lunge = 1; },
    defeat() { dying = 0.0001; },
    set(k, v) { state[k] = v; },
    draw(time, run) {
      if (!ctx) return;
      if (canvas.width !== Math.round(W * dpr) || W < 20) resize();
      if (W < 20 || H < 60) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const bg = ctx.createRadialGradient(W / 2, H * 0.6, 10, W / 2, H * 0.6, Math.max(W, H) * 0.8);
      bg.addColorStop(0, '#2a1a12'); bg.addColorStop(1, C.glaze);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      for (const e of embers) {
        e.y -= e.v * 0.016; if (e.y < -0.05) { e.y = 1.05; e.x = Math.random(); }
        ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time * 3 + e.x * 20);
        ctx.beginPath(); ctx.arc(e.x * W, e.y * H, e.r, 0, 7); ctx.fillStyle = C.clayHi; ctx.fill();
      }
      ctx.globalAlpha = 1;
      const band = Math.max(10, Math.min(18, H * 0.06));
      meander(0, band); meander(H - band, band);

      if (enemy && DRAW[enemy.id]) {
        const s = Math.min(W / 330, (H - band * 2) / 225);
        shake *= 0.86; lunge *= 0.9;
        if (dying) dying = Math.min(1, dying + 0.025);
        ctx.save();
        ctx.translate(W / 2 + (Math.random() - 0.5) * shake, H / 2 + 4 + (Math.random() - 0.5) * shake);
        ctx.beginPath(); ctx.ellipse(0, 96 * s, 90 * s, 12 * s, 0, 0, 7); ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();
        const sc = s * (1 + lunge * 0.12) * (1 - dying * 0.25);
        ctx.scale(sc, sc);
        ctx.globalAlpha = 1 - dying;
        if (state.petrified && enemy.id !== 'gorgo') ctx.filter = 'grayscale(0.8)';
        DRAW[enemy.id](time, run && run.enemy === enemy ? enemy.parts : null);
        ctx.filter = 'none';
        ctx.restore();
        const fl = Math.max(...flash.map((f) => f || 0), 0);
        if (fl > 0.02) { ctx.fillStyle = `rgba(239,227,200,${fl * 0.22})`; ctx.fillRect(0, 0, W, H); }
        flash = flash.map((f) => (f || 0) * 0.82);
        if (lunge > 0.05) { ctx.fillStyle = `rgba(210,70,58,${lunge * 0.28})`; ctx.fillRect(0, 0, W, H); }
      }
      for (const f of floaters) {
        f.t += 0.016;
        const a = Math.max(0, 1 - f.t / 1.4);
        ctx.globalAlpha = a;
        ctx.font = `${f.big ? 34 : 24}px 'Marcellus SC', 'Times New Roman', serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = f.col;
        ctx.shadowColor = f.col; ctx.shadowBlur = f.big ? 16 : 6;
        ctx.fillText(f.txt, W / 2 + f.x * W, H * 0.42 - f.t * 46);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
      floaters = floaters.filter((f) => f.t < 1.4);
    },
    // A static portrait for the title screen.
    drawTitle(c, time) {
      const prev = [canvas, ctx, W, H, enemy];
      canvas = c; ctx = c.getContext('2d');
      const r = c.getBoundingClientRect(); W = r.width; H = r.height;
      if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      const ids = ['umbra', 'furia', 'harpyia', 'echo', 'sphinx', 'gorgo', 'tantalus', 'cerberus', 'charon', 'minos'];
      enemy = { id: ids[Math.floor(time / 6) % ids.length], parts: [] };
      this.draw(time, null);
      [canvas, ctx, W, H, enemy] = prev;
    },
  };
})(window.RA = window.RA || {});
