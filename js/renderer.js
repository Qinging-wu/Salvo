// ============================================================
//  RENDERER — all Canvas 2D drawing functions
// ============================================================

function drawBackground() {
  // Base gradient
  const g = ctx.createLinearGradient(0, 0, 0, CFG.H);
  g.addColorStop(0, '#15152a');
  g.addColorStop(0.5, '#0a0a1a');
  g.addColorStop(1, '#05050d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.W, CFG.H);

  // Stars
  const t = performance.now() / 1000;
  for (let si = 0; si < game.stars.length; si++) {
    const s = game.stars[si];
    const tw = 0.5 + 0.5 * Math.sin(t * s.tw + s.x);
    ctx.globalAlpha = s.a * tw;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= CFG.W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CFG.H); ctx.stroke();
  }

  // Side walls glow
  ctx.fillStyle = 'rgba(120, 100, 200, 0.06)';
  ctx.fillRect(0, 0, 4, CFG.H);
  ctx.fillRect(CFG.W - 4, 0, 4, CFG.H);

  // Warning zone — pulsing orange band above FAIL_Y
  const warnPulse = 0.4 + 0.3 * Math.sin(t * 3.2);
  const warnG = ctx.createLinearGradient(0, CFG.WARN_Y, 0, CFG.FAIL_Y);
  warnG.addColorStop(0, 'rgba(251, 146, 60, ' + (0.1 + warnPulse * 0.2) + ')');
  warnG.addColorStop(1, 'rgba(251, 146, 60, 0)');
  ctx.fillStyle = warnG;
  ctx.fillRect(0, CFG.WARN_Y, CFG.W, CFG.FAIL_Y - CFG.WARN_Y);

  ctx.save();
  ctx.shadowColor = 'rgba(251, 146, 60, ' + (0.3 + warnPulse * 0.4) + ')';
  ctx.shadowBlur = 4 + warnPulse * 8;
  ctx.strokeStyle = 'rgba(251, 146, 60, ' + (0.35 + warnPulse * 0.4) + ')';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(0, CFG.WARN_Y);
  ctx.lineTo(CFG.W, CFG.WARN_Y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Danger zone — pulsing red fill below FAIL_Y (reuses `t` from stars above)
  const pulse = 0.4 + 0.25 * Math.sin(t * 3.5);  // pulse 0.15~0.65 alpha
  const dangerH = CFG.H - CFG.FAIL_Y;

  // Red gradient fill over the danger zone
  const dg = ctx.createLinearGradient(0, CFG.FAIL_Y, 0, CFG.H);
  dg.addColorStop(0, 'rgba(220, 38, 38, ' + (0.18 + pulse * 0.3) + ')');
  dg.addColorStop(0.3, 'rgba(180, 30, 30, ' + (0.08 + pulse * 0.15) + ')');
  dg.addColorStop(1, 'rgba(80, 10, 10, 0.02)');
  ctx.fillStyle = dg;
  ctx.fillRect(0, CFG.FAIL_Y, CFG.W, dangerH);

  // Danger boundary line — pulsing red dashed
  ctx.save();
  ctx.shadowColor = 'rgba(248, 113, 113, ' + (0.5 + pulse * 0.5) + ')';
  ctx.shadowBlur = 6 + pulse * 10;
  ctx.strokeStyle = 'rgba(248, 113, 113, ' + (0.5 + pulse * 0.5) + ')';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(0, CFG.FAIL_Y);
  ctx.lineTo(CFG.W, CFG.FAIL_Y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Pulsing DANGER labels (below the line to indicate the area beneath)
  ctx.fillStyle = 'rgba(248, 113, 113, ' + (0.4 + pulse * 0.6) + ')';
  ctx.font = '700 11px "Russo One", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('⚠ DANGER', CFG.W - 18, CFG.FAIL_Y + 18);
  ctx.textAlign = 'left';
  ctx.fillText('⚠ DANGER', 18, CFG.FAIL_Y + 18);
}

/** Draw a shape path (square/triangle/circle) relative to (x, y). */
function drawShapePath(shape, x, y, w, h) {
  ctx.beginPath();
  if (shape === 'circle') {
    const r = Math.min(w, h) / 2;
    ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
  } else if (shape === 'triangle') {
    // pointing up: apex top-centre, base at bottom
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  } else {
    // rounded square
    const r = Math.min(7, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}

function drawBricks() {
  const m = CFG.SHAPE_MARGIN;
  for (let ri = 0; ri < game.brickRows.length; ri++) {
    const row = game.brickRows[ri];
    for (let ci = 0; ci < row.length; ci++) {
      const cell = row[ci];
      if (!cell || cell.bonus || cell.hp <= 0) continue;
      const col = cell.color || brickColor(cell.hp, cell.maxHp);
      const sw = cell.w - 2 * m, sh = cell.h - 2 * m;
      const bcx = cell.x + cell.w / 2, bcy = cell.y + cell.h / 2;

      ctx.save();
      ctx.translate(bcx, bcy);
      if (cell.angle) ctx.rotate(cell.angle);
      const sx = -sw / 2, sy = -sh / 2;

      // Body: drop shadow + vertical gradient
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 2;
      const g = ctx.createLinearGradient(sx, sy, sx, sy + sh);
      g.addColorStop(0, lighten(col, 0.22));
      g.addColorStop(1, col);
      ctx.fillStyle = g;
      drawShapePath(cell.shape, sx, sy, sw, sh);
      ctx.fill();
      ctx.restore();

      // Glossy top sheen (clip to shape, fill top 40%)
      ctx.save();
      drawShapePath(cell.shape, sx, sy, sw, sh);
      ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(sx, sy, sw, sh * 0.42);
      ctx.restore();

      // Number — adaptive font size for 1–4 digit numbers
      const hpStr = String(cell.hp);
      const fontSize = hpStr.length <= 1 ? 18 : (hpStr.length === 2 ? 15 : (hpStr.length === 3 ? 12 : 10));
      ctx.fillStyle = 'rgba(10,10,26,0.92)';
      ctx.font = '700 ' + fontSize + 'px "Russo One", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(cell.hp), 0, 1);

      // Near-danger warning glow (per-brick, reflects actual distance to danger line).
      // Both bounds use the visual BOTTOM (cell.y + h - SHAPE_MARGIN) so the glow
      // window is exactly (WARN_Y, FAIL_Y) — perfectly complementary to checkFail,
      // which fires when the same visual bottom crosses FAIL_Y. The previous code
      // used visual TOP < FAIL_Y for cond2, leaving a 48px window where a brick
      // had already failed but still glowed orange, misleading the player into
      // thinking the game-over was a misjudgment.
      const visBottom = cell.y + cell.h - CFG.SHAPE_MARGIN;
      if (visBottom > CFG.WARN_Y && visBottom < CFG.FAIL_Y) {
        const wp = 0.5 + 0.5 * Math.sin(performance.now() / 1000 * 4);
        ctx.save();
        ctx.shadowColor = 'rgba(251, 146, 60, ' + (0.6 + 0.4 * wp) + ')';
        ctx.shadowBlur = 8 + 10 * wp;
        ctx.strokeStyle = 'rgba(251, 146, 60, ' + (0.5 + 0.5 * wp) + ')';
        ctx.lineWidth = 2.5;
        drawShapePath(cell.shape, sx, sy, sw, sh);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }
  }
}

function drawBonuses() {
  const t = performance.now() / 1000;
  for (let bi = 0; bi < game.bonuses.length; bi++) {
    const b = game.bonuses[bi];
    const pulse = 1 + 0.12 * Math.sin(t * 4 + b.phase);
    // Glow
    ctx.save();
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    // "+" mark
    ctx.strokeStyle = 'rgba(120, 70, 0, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x - 4, b.y); ctx.lineTo(b.x + 4, b.y);
    ctx.moveTo(b.x, b.y - 4); ctx.lineTo(b.x, b.y + 4);
    ctx.stroke();
  }
}

function drawBalls() {
  for (let bi = 0; bi < balls.length; bi++) {
    const b = balls[bi];
    if (!b.active) continue;
    // Trail (ring buffer read)
    if (b.trailLen >= 4) {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = b.r * 0.9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const start = (b.trailHead - b.trailLen + 16) & 15;
      ctx.moveTo(b.trail[start], b.trail[start + 1]);
      for (let i = 2; i < b.trailLen; i += 2) {
        const idx = (start + i) & 15;
        ctx.lineTo(b.trail[idx], b.trail[idx + 1]);
      }
      ctx.stroke();
    }
    // Glow
    ctx.save();
    ctx.shadowColor = '#fff8e0';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#fefefe';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLauncher() {
  const x = game.launcherX, y = CFG.LAUNCHER_Y;
  // Base ring
  ctx.fillStyle = 'rgba(120, 100, 200, 0.25)';
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(180, 160, 255, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.stroke();
  // Centre
  ctx.fillStyle = '#e5e7eb';
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  // Ball count badge
  ctx.fillStyle = 'rgba(229,231,235,0.9)';
  ctx.font = '600 14px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('×' + game.ballCount, x + 26, y);
}

function drawAimPath() {
  if (game.state !== STATE.AIM || !dragging || game.paused) return;
  const pts = computeAimPath();
  if (pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.setLineDash([]);
  // End dot
  const end = pts[pts.length - 1];
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(end.x, end.y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles() {
  for (let i = 0; i < game.particles.length; i++) {
    const p = game.particles[i];
    const a = clamp(p.life / p.maxLife, 0, 1);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHUD() {
  // Top bar background
  const g = ctx.createLinearGradient(0, 0, 0, 80);
  g.addColorStop(0, 'rgba(10,10,26,0.92)');
  g.addColorStop(1, 'rgba(10,10,26,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.W, 80);

  ctx.textBaseline = 'middle';
  // Score
  ctx.fillStyle = 'rgba(229,231,235,0.55)';
  ctx.font = '500 11px "Outfit", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 24, 28);
  ctx.fillStyle = '#fefefe';
  ctx.font = '400 28px "Russo One", sans-serif';
  ctx.fillText(String(game.score), 24, 52);

  // Round (centre)
  ctx.fillStyle = 'rgba(229,231,235,0.55)';
  ctx.font = '500 11px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ROUND', CFG.W / 2, 28);
  ctx.fillStyle = '#fbbf24';
  ctx.font = '400 28px "Russo One", sans-serif';
  ctx.fillText(String(game.round), CFG.W / 2, 52);

  // Balls (right)
  ctx.fillStyle = 'rgba(229,231,235,0.55)';
  ctx.font = '500 11px "Outfit", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('BALLS', CFG.W - 24, 28);
  ctx.fillStyle = '#4ade80';
  ctx.font = '400 28px "Russo One", sans-serif';
  ctx.fillText('×' + game.ballCount, CFG.W - 24, 52);
}

function drawPauseButton() {
  if (game.state === STATE.MENU || game.state === STATE.GAMEOVER) return;
  const b = PAUSE_BTN;
  const t = performance.now() / 1000;
  const pulse = 0.5 + 0.5 * Math.sin(t * 3);
  const active = game.paused;

  ctx.save();
  if (active) {
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 16 + 8 * pulse;
  }
  ctx.fillStyle = active ? 'rgba(255,255,255,0.92)' : 'rgba(30,30,55,0.8)';
  ctx.beginPath();
  ctx.arc(b.cx, b.cy, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Border
  ctx.strokeStyle = active ? 'rgba(255,255,255,0.8)' : 'rgba(180,180,220,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(b.cx, b.cy, b.r, 0, Math.PI * 2);
  ctx.stroke();
  // Icon: two vertical bars
  const barW = 3, barH = 12, gap = 4;
  ctx.fillStyle = active ? '#1a1a2e' : '#e5e7eb';
  ctx.fillRect(b.cx - gap - barW, b.cy - barH / 2, barW, barH);
  ctx.fillRect(b.cx + gap, b.cy - barH / 2, barW, barH);
}

function drawSpeedButton() {
  if (game.state === STATE.MENU || game.state === STATE.GAMEOVER) return;
  const b = SPEED_BTN;
  const t = performance.now() / 1000;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.5);
  const active = game.speedMult > 1;

  ctx.save();
  if (active) {
    ctx.shadowColor = 'rgba(251, 191, 36, 0.7)';
    ctx.shadowBlur = 14 + 8 * pulse;
  }
  ctx.fillStyle = active ? 'rgba(251, 191, 36, 0.95)' : 'rgba(30,30,55,0.8)';
  ctx.beginPath();
  ctx.arc(b.cx, b.cy, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Border
  ctx.strokeStyle = active ? 'rgba(251, 191, 36, 0.9)' : 'rgba(180,180,220,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(b.cx, b.cy, b.r, 0, Math.PI * 2);
  ctx.stroke();
  // Label
  ctx.fillStyle = active ? '#1a1a2e' : '#e5e7eb';
  ctx.font = '700 13px "Russo One", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(game.speedMult + '×', b.cx, b.cy + 1);
}

function drawPauseOverlay() {
  if (!game.paused) return;
  const t = performance.now() / 1000;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2);
  ctx.fillStyle = 'rgba(5,5,13,0.72)';
  ctx.fillRect(0, 0, CFG.W, CFG.H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Big title
  ctx.fillStyle = '#fefefe';
  ctx.font = '400 72px "Russo One", sans-serif';
  ctx.fillText('PAUSED', CFG.W / 2, CFG.H / 2 - 110);

  // Resume button
  drawButton(RESUME_BTN.x, RESUME_BTN.y, RESUME_BTN.w, RESUME_BTN.h, 'RESUME', pulse);

  // Quit button (subdued style, same width as resume for alignment)
  drawSubduedButton(QUIT_BTN.x, QUIT_BTN.y, QUIT_BTN.w, QUIT_BTN.h, 'QUIT', pulse);
}

function drawMenu() {
  // Overlay
  ctx.fillStyle = 'rgba(5,5,13,0.78)';
  ctx.fillRect(0, 0, CFG.W, CFG.H);

  const t = performance.now() / 1000;
  game.menuPulse = 0.5 + 0.5 * Math.sin(t * 2);

  // Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
  ctx.font = '400 96px "Russo One", sans-serif';
  ctx.fillText('SALVO', CFG.W / 2 + 3, 500 + 3);

  ctx.fillStyle = '#fefefe';
  ctx.font = '400 96px "Russo One", sans-serif';
  ctx.fillText('SALVO', CFG.W / 2, 500);

  // Best record — highlighted with gold glow
  if (game.bestScore > 0) {
    const bp = 0.5 + 0.5 * Math.sin(t * 2.5);
    ctx.save();
    ctx.shadowColor = 'rgba(251, 191, 36, ' + (0.4 + 0.4 * bp) + ')';
    ctx.shadowBlur = 18 + 8 * bp;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.font = '500 11px "Outfit", sans-serif';
    ctx.fillText('★  BEST RECORD  ★', CFG.W / 2, 600);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '400 44px "Russo One", sans-serif';
    ctx.fillText(String(game.bestScore), CFG.W / 2, 645);
    ctx.restore();
  }

  // Start button
  drawButton(CFG.W / 2 - 110, 820, 220, 64, 'PLAY', game.menuPulse);
}

function drawGameOver() {
  // Dim
  ctx.fillStyle = 'rgba(5,5,13,0.82)';
  ctx.fillRect(0, 0, CFG.W, CFG.H);

  const t = performance.now() / 1000;
  game.overPulse = 0.5 + 0.5 * Math.sin(t * 2.5);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f87171';
  ctx.font = '400 64px "Russo One", sans-serif';
  ctx.fillText('GAME OVER', CFG.W / 2, 460);

  // NEW RECORD! banner — gold pulsing glow when current run beat the best
  if (game.isNewRecord) {
    ctx.save();
    ctx.shadowColor = 'rgba(251, 191, 36, ' + (0.5 + 0.5 * game.overPulse) + ')';
    ctx.shadowBlur = 20 + 14 * game.overPulse;
    ctx.fillStyle = 'rgba(251, 191, 36, ' + (0.85 + 0.15 * game.overPulse) + ')';
    ctx.font = '400 30px "Russo One", sans-serif';
    ctx.fillText('★  NEW RECORD!  ★', CFG.W / 2, 510);
    ctx.restore();
  }

  // Stats
  ctx.fillStyle = 'rgba(229,231,235,0.55)';
  ctx.font = '500 12px "Outfit", sans-serif';
  ctx.fillText('FINAL SCORE', CFG.W / 2, 555);
  ctx.fillStyle = game.isNewRecord ? '#fbbf24' : '#fefefe';
  ctx.font = '400 56px "Russo One", sans-serif';
  ctx.fillText(String(game.score), CFG.W / 2, 595);

  ctx.fillStyle = 'rgba(229,231,235,0.55)';
  ctx.font = '500 12px "Outfit", sans-serif';
  ctx.fillText('REACHED ROUND', CFG.W / 2, 655);
  ctx.fillStyle = '#fbbf24';
  ctx.font = '400 32px "Russo One", sans-serif';
  ctx.fillText(String(game.round), CFG.W / 2, 690);

  // Best score line — shown when a record exists
  if (game.bestScore > 0) {
    ctx.fillStyle = game.isNewRecord
      ? 'rgba(251, 191, 36, ' + (0.7 + 0.3 * game.overPulse) + ')'
      : 'rgba(229,231,235,0.45)';
    ctx.font = '500 13px "Outfit", sans-serif';
    ctx.fillText('BEST  ·  ' + String(game.bestScore), CFG.W / 2, 730);
  }

  drawButton(CFG.W / 2 - 110, 780, 220, 64, 'PLAY AGAIN', game.overPulse);
}

function drawButton(x, y, w, h, label, pulse) {
  // Glow
  ctx.save();
  ctx.shadowColor = 'rgba(251, 191, 36, ' + (0.3 + 0.25 * pulse) + ')';
  ctx.shadowBlur = 24 + 12 * pulse;
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#fbbf24');
  g.addColorStop(1, '#f59e0b');
  ctx.fillStyle = g;
  roundRect(x, y, w, h, 32, true, false);
  ctx.restore();

  // Inner sheen
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(x, y, w, h * 0.45, 32, true, false);

  // Text
  ctx.fillStyle = '#1a1a2e';
  ctx.font = '600 20px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
}

function drawSubduedButton(x, y, w, h, label, pulse) {
  // Muted outline style — same width as main button for alignment
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(x, y, w, h, 32, true, false);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  roundRect(x, y, w, h, 32, false, true);

  // Text
  ctx.fillStyle = 'rgba(229,231,235,0.55)';
  ctx.font = '600 16px "Outfit", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
}
