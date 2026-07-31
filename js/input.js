// ============================================================
//  INPUT CONTROLLER — mouse/touch aim, fire, and button hit-tests
// ============================================================
//  canvas / ctx are owned by canvas.js (loaded before this module).

let dragging = false;

function pointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = CFG.W / rect.width;
  const sy = CFG.H / rect.height;
  const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  return { x: cx * sx, y: cy * sy };
}

function onDown(e) {
  e.preventDefault();
  initAudio();
  const p = pointerPos(e);

  if (game.state === STATE.MENU) {
    if (hitStartButton(p)) startGame();
    return;
  }
  if (game.state === STATE.GAMEOVER) {
    if (hitRestartButton(p)) startGame();
    return;
  }
  if (game.state === STATE.SIM || game.state === STATE.AIM) {
    // Pause toggle — works in both AIM and SIM
    if (hitPauseButton(p)) {
      game.paused = !game.paused;
      if (game.paused) dragging = false;  // cancel any in-progress drag
      return;
    }
    if (game.paused) {
      // Resume button
      if (hitResumeButton(p)) { game.paused = false; return; }
      // Quit-to-menu button
      if (hitQuitButton(p)) { game.paused = false; game.state = STATE.MENU; }
      return;
    }
    if (hitSpeedButton(p)) {
      cycleSpeed();
      return;
    }
    if (game.state === STATE.SIM) return;
    // AIM state (not paused)
    dragging = true;
    updateAim(p);
  }
}

function onMove(e) {
  if (!dragging || game.state !== STATE.AIM || game.paused) return;
  e.preventDefault();
  updateAim(pointerPos(e));
}

function onUp(e) {
  if (!dragging) return;
  dragging = false;
  if (game.state === STATE.AIM && !game.paused) {
    fireBalls();
  }
}

function updateAim(p) {
  game.hover = p;
  const dx = p.x - game.launcherX;
  const dy = CFG.LAUNCHER_Y - p.y;     // positive when pointer above launcher
  if (dy <= 0) return;                  // ignore pointers below launcher
  let deg = Math.atan2(dy, dx) * 180 / Math.PI;
  // atan2(dy>0, dx) → (0, π) → 0°..180°
  deg = clamp(deg, CFG.AIM_MIN_DEG, CFG.AIM_MAX_DEG);
  game.aimAngleDeg = deg;
  game.aimAngle = deg * Math.PI / 180;
}

// --- event listeners ---
canvas.addEventListener('mousedown', onDown);
canvas.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);
canvas.addEventListener('touchstart', onDown, { passive: false });
canvas.addEventListener('touchmove', onMove, { passive: false });
canvas.addEventListener('touchend', onUp);

// --- fire & launch ---
function fireBalls() {
  sfxFire();
  game.state = STATE.SIM;
  game.ballsToFire = game.ballCount;
  game.fireTimer = 0;
  game.firstLandedX = null;
  game.ballsActive = 0;
}

function launchOne() {
  const a = game.aimAngle;
  const vx = Math.cos(a) * CFG.BALL_SPEED;
  const vy = -Math.sin(a) * CFG.BALL_SPEED;
  // Defensive: ball cap (BALL_CAP) should keep ballCount ≤ POOL_SIZE, but
  // guard against any future regression that would deadlock the round —
  // only count balls that were actually acquired.
  const b = acquireBall(game.launcherX, CFG.LAUNCHER_Y, vx, vy);
  if (b) game.ballsActive++;
}

// --- aim path prediction (with one wall reflection) ---
function computeAimPath() {
  const a = game.aimAngle;
  const dx = Math.cos(a);
  const dy = -Math.sin(a);
  const pts = [{ x: game.launcherX, y: CFG.LAUNCHER_Y }];
  let x = game.launcherX, y = CFG.LAUNCHER_Y;

  // First segment to wall/top
  let tHit = Infinity;
  if (dx > 0) tHit = (CFG.W - CFG.BALL_R - x) / dx;
  else if (dx < 0) tHit = (CFG.BALL_R - x) / dx;
  else tHit = Infinity;
  const tTop = dy < 0 ? (CFG.BALL_R - y) / dy : Infinity;
  let t1 = Math.min(tHit, tTop, CFG.MAX_AIM_LEN);
  x += dx * t1; y += dy * t1;
  pts.push({ x: x, y: y });

  if (t1 === tHit && t1 < CFG.MAX_AIM_LEN && t1 < tTop) {
    // Reflect off side wall, continue to top
    const rdx = -dx;
    const tTop2 = dy < 0 ? (CFG.BALL_R - y) / dy : Infinity;
    let t2 = Math.min(tTop2, CFG.MAX_AIM_LEN - t1);
    x += rdx * t2; y += dy * t2;
    pts.push({ x: x, y: y });
  }
  return pts;
}

// --- button hit-test helpers ---
function hitStartButton(p) {
  return p.x >= CFG.W / 2 - 110 && p.x <= CFG.W / 2 + 110 && p.y >= 820 && p.y <= 884;
}
function hitRestartButton(p) {
  return p.x >= CFG.W / 2 - 110 && p.x <= CFG.W / 2 + 110 && p.y >= 780 && p.y <= 844;
}
function hitPauseButton(p) {
  const dx = p.x - PAUSE_BTN.cx, dy = p.y - PAUSE_BTN.cy;
  return dx * dx + dy * dy < (PAUSE_BTN.r + 6) * (PAUSE_BTN.r + 6);
}
function hitSpeedButton(p) {
  const dx = p.x - SPEED_BTN.cx, dy = p.y - SPEED_BTN.cy;
  return dx * dx + dy * dy < (SPEED_BTN.r + 6) * (SPEED_BTN.r + 6);
}
function hitQuitButton(p) {
  return p.x >= QUIT_BTN.x && p.x <= QUIT_BTN.x + QUIT_BTN.w
      && p.y >= QUIT_BTN.y && p.y <= QUIT_BTN.y + QUIT_BTN.h;
}
function hitResumeButton(p) {
  return p.x >= RESUME_BTN.x && p.x <= RESUME_BTN.x + RESUME_BTN.w
      && p.y >= RESUME_BTN.y && p.y <= RESUME_BTN.y + RESUME_BTN.h;
}
