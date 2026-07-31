// ============================================================
//  BALL MANAGER — object pool for balls (pre-allocated, no GC pressure)
// ============================================================

const balls = [];

(function initBallPool() {
  for (let i = 0; i < CFG.POOL_SIZE; i++) {
    balls.push({
      x: 0, y: 0, vx: 0, vy: 0, r: CFG.BALL_R, active: false,
      trail: new Float32Array(16), trailHead: 0, trailLen: 0
    });
  }
})();

function acquireBall(x, y, vx, vy) {
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];
    if (!b.active) {
      b.x = x; b.y = y; b.vx = vx; b.vy = vy;
      b.active = true; b.trailHead = 0; b.trailLen = 0;
      return b;
    }
  }
  return null;
}

function releaseBall(b) {
  b.active = false;
  b.trailHead = 0; b.trailLen = 0;
}
