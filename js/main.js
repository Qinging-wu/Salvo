// ============================================================
//  MAIN — game loop, stars init, boot
// ============================================================

let lastTime = performance.now();

function initStars() {
  game.stars = [];
  for (let i = 0; i < 70; i++) {
    game.stars.push({
      x: Math.random() * CFG.W,
      y: Math.random() * CFG.H,
      r: rand(0.4, 1.6),
      a: rand(0.15, 0.7),
      tw: rand(0.5, 2),
    });
  }
}

function frame(now) {
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  if (dt > 0.25) dt = 0.25;  // clamp big gaps

  // Update
  if (game.state === STATE.SIM && !game.paused) {
    const simDt = dt * game.speedMult;   // speed-up affects launch + physics
    // Launch queued balls over time
    if (game.ballsToFire > 0) {
      game.fireTimer += simDt;
      while (game.fireTimer >= CFG.LAUNCH_INTERVAL && game.ballsToFire > 0) {
        game.fireTimer -= CFG.LAUNCH_INTERVAL;
        launchOne();
        game.ballsToFire--;
      }
    }
    // Fixed-step physics (run more steps when sped up)
    game.acc += simDt;
    let steps = 0;
    // Cap step budget per frame independent of speedMult: at 8x a single 16ms
    // frame asks for ~16 physics steps already (16ms*8 / (1000/120)), and a
    // momentary frame hitch must not let that balloon to 64. 16 covers 60fps
    // steady state (≤2 steps) plus ~8x headroom for one dropped frame.
    const maxSteps = 16;
    while (game.acc >= CFG.PHYSICS_DT && steps < maxSteps) {
      stepPhysics(CFG.PHYSICS_DT);
      game.acc -= CFG.PHYSICS_DT;
      steps++;
    }
    if (steps === maxSteps && game.acc > CFG.PHYSICS_DT) {
      // Frame budget exhausted with unfinished physics: drop the backlog to
      // avoid spiral-of-death, but keep at most one step's worth so the next
      // frame can catch up smoothly instead of starting dry.
      game.acc = CFG.PHYSICS_DT;
    }
    stepParticles(dt);  // particles stay real-time

    // Round end?
    if (game.ballsToFire === 0 && game.ballsActive === 0) {
      endRound();
    }
  } else if (game.state === STATE.SIM && game.paused) {
    // Still update particles while paused (for visual liveliness)
    stepParticles(dt);
  } else {
    stepParticles(dt);
  }

  // Smooth launcher animation (only in AIM state, not paused)
  if (game.state === STATE.AIM && !game.paused && Math.abs(game.targetLauncherX - game.launcherX) > 0.3) {
    game.launcherX += (game.targetLauncherX - game.launcherX) * 0.12;
  }

  // Shake decay (freeze while paused)
  if (game.shake > 0 && !game.paused) game.shake = Math.max(0, game.shake - dt * 18);

  // Render
  ctx.save();
  if (game.shake > 0) {
    ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  }
  drawBackground();
  drawBricks();
  drawBonuses();
  drawBalls();
  drawLauncher();
  drawAimPath();
  drawParticles();
  drawHUD();
  drawPauseButton();
  drawSpeedButton();

  if (game.state === STATE.MENU) drawMenu();
  if (game.state === STATE.GAMEOVER) drawGameOver();
  drawPauseOverlay();

  ctx.restore();

  requestAnimationFrame(frame);
}

// ============================================================
//  BOOT
// ============================================================
initStars();
requestAnimationFrame(frame);
