// ============================================================
//  PARTICLES — simple burst effects on brick hits / bonus collection
// ============================================================

function spawnParticles(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = rand(60, 260);
    game.particles.push({
      x: x, y: y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(0.4, 0.9),
      maxLife: 0.9,
      color: color,
      size: rand(1.5, 3.5),
    });
  }
}

function stepParticles(dt) {
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.life -= dt;
    if (p.life <= 0) { game.particles.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
  }
}
