// ============================================================
//  GAME FLOW — start, round transitions, speed cycling
// ============================================================

function startGame() {
  // Release any leftover active balls (e.g. after quitting to menu mid-sim)
  for (let i = 0; i < balls.length; i++) {
    if (balls[i].active) releaseBall(balls[i]);
  }
  game.score = 0;
  game.round = 1;
  game.ballCount = 1;
  game.capRound = null;
  game.pendingBonus = 0;
  game.launcherX = CFG.W / 2;
  game.brickRows = [];
  game.bonuses = [];
  game.particles = [];
  game.firstLandedX = null;
  game.ballsActive = 0;
  game.ballsToFire = 0;
  game.fireTimer = 0;
  game.speedMult = 1;
  game.targetLauncherX = CFG.W / 2;
  game.paused = false;
  game.isNewRecord = false;
  game.acc = 0;  // reset fixed-timestep accumulator
  spawnNewRow();
  extractBonusesFromRows();
  buildSpatialGrid();
  game.state = STATE.AIM;
}

function cycleSpeed() {
  // 1 → 2 → 4 → 8 → 1
  game.speedMult = game.speedMult === 1 ? 2 : (game.speedMult === 2 ? 4 : (game.speedMult === 4 ? 8 : 1));
}

function endRound() {
  // Apply pending bonus with ball cap + overflow-to-score (BBTan standard).
  // Once ballCount reaches BALL_CAP, further bonuses convert to score at
  // OVERFLOW_SCORE per ball — this prevents the pool-overflow deadlock
  // (acquireBall returning null → ballsActive miscount → endRound never fires)
  // while still rewarding the player for collected bonuses.
  if (game.pendingBonus > 0) {
    if (game.ballCount < CFG.BALL_CAP) {
      const add = Math.min(game.pendingBonus, CFG.BALL_CAP - game.ballCount);
      game.ballCount += add;
      const overflow = game.pendingBonus - add;
      if (overflow > 0) game.score += overflow * CFG.OVERFLOW_SCORE;
      // Record the first round we hit the cap — HP slope changes from here on.
      if (game.ballCount >= CFG.BALL_CAP && game.capRound === null) {
        game.capRound = game.round;
      }
    } else {
      // Already capped: every bonus ball converts to score.
      game.score += game.pendingBonus * CFG.OVERFLOW_SCORE;
    }
    game.pendingBonus = 0;
  }
  // Update launcher position (smooth animation target)
  if (game.firstLandedX !== null) {
    game.targetLauncherX = game.firstLandedX;
  }
  // Shift bricks down & spawn new row
  shiftRowsDown();
  spawnNewRow();
  extractBonusesFromRows();
  // Fail check
  if (checkFail()) {
    sfxGameOver();
    // Update best score record
    if (game.score > game.bestScore) {
      game.bestScore = game.score;
      game.isNewRecord = true;
      try { localStorage.setItem('physicsballs_best', String(game.bestScore)); } catch (e) {}
    } else {
      game.isNewRecord = false;
    }
    game.state = STATE.GAMEOVER;
    game.overPulse = 0;
    return;
  }
  sfxRoundEnd();
  game.round++;
  game.state = STATE.AIM;
  buildSpatialGrid();  // rebuild after bricks shifted + new row added
}
