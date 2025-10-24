// Particles + floating damage numbers
export function addHitFX(state, x, y, dmg, color = '#ffd166') {
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 60 + Math.random() * 160;
    state.particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: 0, ttl: 0.35 + Math.random() * 0.25, size: 2 + Math.random() * 2, color
    });
  }
  state.floatDMG.push({ x, y: y - 8, vy: -40, life: 0, ttl: 0.8, text: String(Math.round(dmg)), color });
}

export function updateFX(state, dt) {
  const P = state.particles, F = state.floatDMG;
  for (const p of P) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; }
  for (let i = P.length - 1; i >= 0; i--) if (P[i].life > P[i].ttl) P.splice(i, 1);
  for (const f of F) { f.life += dt; f.y += f.vy * dt; f.vy *= 0.98; }
  for (let i = F.length - 1; i >= 0; i--) if (F[i].life > F[i].ttl) F.splice(i, 1);
}
