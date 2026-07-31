// ============================================================
//  PHYSICS — fixed-step simulation with CCD substeps + spatial hash
// ============================================================

function stepPhysics(dt) {
  // Deferred removal list: bricks destroyed during this physics step are
  // collected here and purged from the spatial hash AFTER the ball loop
  // finishes. Mutating buckets mid-iteration would break the swap-remove
  // contract, so we never touch them inside the per-substep loop.
  const destroyed = [];

  // --- Ball physics with CCD substeps + spatial hash ---
  ballLoop:
  for (let bi = 0; bi < balls.length; bi++) {
    const b = balls[bi];
    if (!b.active) continue;

    // CCD: adaptive substeps — ball moves ≤ 0.75× radius per substep
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    const displacement = speed * dt;
    const n = displacement > b.r ? Math.ceil(displacement / (b.r * 0.75)) : 1;
    const subDt = dt / n;

    for (let s = 0; s < n; s++) {
      b.x += b.vx * subDt;
      b.y += b.vy * subDt;

      // Wall collisions
      if (b.x - b.r < 0) { b.x = b.r; b.vx = -b.vx; }
      else if (b.x + b.r > CFG.W) { b.x = CFG.W - b.r; b.vx = -b.vx; }
      if (b.y - b.r < 0) { b.y = b.r; b.vy = -b.vy; }

      // Landing (bottom)
      if (b.y >= CFG.LAND_Y) {
        if (game.firstLandedX === null) {
          // Mirror the wall-clamp used in physics (b.r .. CFG.W - b.r),
          // so the next round's launcher sits where a ball could actually land.
          game.firstLandedX = clamp(b.x, b.r, CFG.W - b.r);
        }
        releaseBall(b);
        game.ballsActive--;
        continue ballLoop;
      }

      // Brick collisions via spatial hash (9-cell neighborhood)
      if (spatialGrid) {
        const gc = Math.floor(b.x / GRID_CELL);
        const gr = Math.floor(b.y / GRID_CELL);
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = gr + dr, c = gc + dc;
            if (r < 0 || r >= gridRows || c < 0 || c >= gridCols) continue;
            const bucket = spatialGrid[r * gridCols + c];
            for (let ci = 0; ci < bucket.length; ci++) {
              const cell = bucket[ci];
              if (cell.hp <= 0) continue;
              // Fine-grained AABB reject
              if (b.y + b.r < cell.y - 4 || b.y - b.r > cell.y + cell.h + 4) continue;
              if (b.x + b.r < cell.x - 2 || b.x - b.r > cell.x + cell.w + 2) continue;

              const hit = collideBallWithBrick(b, cell);
              if (hit.hit) {
                // Reflect velocity along contact normal (only if moving into surface)
                const dot = b.vx * hit.nx + b.vy * hit.ny;
                if (dot < 0) {
                  b.vx -= 2 * dot * hit.nx;
                  b.vy -= 2 * dot * hit.ny;
                }
                // Push out of the shape
                b.x += hit.nx * hit.push;
                b.y += hit.ny * hit.push;

                // Damage brick — score = sum of HP reduced (each hit +1)
                cell.hp--;
                cell.color = brickColor(cell.hp, cell.maxHp);  // cache for render
                game.score++;
                if (cell.hp <= 0) {
                  sfxBrickDestroy();
                  spawnParticles(cell.x + cell.w / 2, cell.y + cell.h / 2, brickColor(1, cell.maxHp || 1), 10);
                  game.shake = Math.min(8, game.shake + 1.5);
                  destroyed.push(cell);  // defer bucket removal until after the ball loop
                } else {
                  sfxBrickHit(cell.hp);
                  spawnParticles(hit.cx, hit.cy, '#ffffff', 2);
                }
              }
            }
          }
        }
      }

      // Bonus ball collisions (checked per substep to prevent tunneling)
      for (let bni = 0; bni < game.bonuses.length; bni++) {
        const bonus = game.bonuses[bni];
        if (bonus.collected) continue;
        const dx = b.x - bonus.x;
        const dy = b.y - bonus.y;
        if (dx * dx + dy * dy < (b.r + bonus.r) * (b.r + bonus.r)) {
          bonus.collected = true;
          game.pendingBonus++;
          sfxBonus();
          spawnParticles(bonus.x, bonus.y, '#fbbf24', 14);
        }
      }
    }

    // Trail (record final position after all substeps)
    b.trail[b.trailHead] = b.x;
    b.trail[b.trailHead + 1] = b.y;
    b.trailHead = (b.trailHead + 2) & 15;
    if (b.trailLen < 16) b.trailLen += 2;
  }

  // Clean collected bonuses
  game.bonuses = game.bonuses.filter(function(bn) { return !bn.collected; });

  // Purge destroyed bricks from the spatial hash (deferred from the ball loop
  // to keep iteration-safe — see comment at the top of this function).
  for (let i = 0; i < destroyed.length; i++) {
    removeBrickFromGrid(destroyed[i]);
  }
}
