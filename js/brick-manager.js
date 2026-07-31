// ============================================================
//  BRICK MANAGER — brick rows, spatial hash grid, bonus extraction, fail check
// ============================================================

let gridCols, gridRows, spatialGrid = null;

function buildSpatialGrid() {
  gridCols = Math.ceil(CFG.W / GRID_CELL);
  gridRows = Math.ceil(CFG.H / GRID_CELL);
  const size = gridCols * gridRows;
  spatialGrid = new Array(size);
  for (let i = 0; i < size; i++) spatialGrid[i] = [];

  for (let ri = 0; ri < game.brickRows.length; ri++) {
    const row = game.brickRows[ri];
    for (let ci = 0; ci < row.length; ci++) {
      const cell = row[ci];
      if (!cell || cell.bonus || cell.hp <= 0) continue;
      const c1 = Math.floor(Math.max(0, cell.x) / GRID_CELL);
      const r1 = Math.floor(Math.max(0, cell.y) / GRID_CELL);
      const c2 = Math.floor(Math.min(CFG.W - 1, cell.x + cell.w) / GRID_CELL);
      const r2 = Math.floor(Math.min(CFG.H - 1, cell.y + cell.h) / GRID_CELL);
      // Track which buckets this brick lives in, so we can swap-remove
      // it from each bucket when it is destroyed (lazy, deferred to keep
      // the per-substep iteration loop free of mutation hazards).
      cell._buckets = [];
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const idx = r * gridCols + c;
          spatialGrid[idx].push(cell);
          cell._buckets.push(idx);
        }
      }
    }
  }
}

/**
 * Remove a destroyed brick from every bucket it occupies in the spatial hash.
 * Uses swap-removal: O(1) per bucket, O(num_overlapping_buckets) total (~1-4).
 * MUST only be called outside any bucket-iteration loop (deferred removal).
 */
function removeBrickFromGrid(cell) {
  const buckets = cell._buckets;
  if (!buckets) return;
  for (let i = 0; i < buckets.length; i++) {
    const bucket = spatialGrid[buckets[i]];
    if (!bucket) continue;
    const j = bucket.indexOf(cell);
    if (j !== -1) {
      // swap-remove: move last element into the freed slot, then drop the tail
      bucket[j] = bucket[bucket.length - 1];
      bucket.pop();
    }
  }
  cell._buckets = null;
}

function spawnNewRow() {
  const row = [];
  // Per-brick x jitter; row-level y jitter (same dy for the whole row so the
  // warning line triggers consistently per row, while rows still look uneven).
  const JX = 8, JY = 6;
  const dy = (Math.random() - 0.5) * 2 * JY;
  for (let c = 0; c < CFG.COLS; c++) {
    const r = Math.random();
    const baseX = CFG.GRID_LEFT + c * (CFG.BRICK_W + CFG.BRICK_GAP_X);
    const dx = (Math.random() - 0.5) * 2 * JX;
    if (r < CFG.BRICK_PROB) {
      // HP = 1 ~ 3×round (pre-cap), skewed toward larger values (max-of-2 bias).
      // After ballCount hits BALL_CAP, HP growth slope drops to HP_SLOPE_POST_CAP
      // (30%) so the difficulty curve flattens once the player is starved of
      // new balls — keeps the game winnable instead of HP exploding to infinity.
      // Formula stays continuous at the cap boundary.
      let hpScale;
      if (game.capRound === null || game.round <= game.capRound) {
        hpScale = 3 * game.round;
      } else {
        hpScale = 3 * game.capRound + 3 * CFG.HP_SLOPE_POST_CAP * (game.round - game.capRound);
      }
      const t = Math.max(Math.random(), Math.random());
      const hp = Math.max(1, Math.ceil(t * hpScale));
      const shape = CFG.SHAPES[(Math.random() * 3) | 0];
      // Random rotation ±25° for square/triangle; circles stay unrotated
      const angle = shape === 'circle' ? 0 : (Math.random() - 0.5) * (50 * Math.PI / 180);
      const col = brickColor(hp, hp);
      row.push({ x: baseX + dx, y: CFG.GRID_TOP + dy, w: CFG.BRICK_W, h: CFG.BRICK_H, hp: hp, maxHp: hp, shape: shape, angle: angle, color: col });
    } else if (r < CFG.BRICK_PROB + CFG.BONUS_PROB && game.round > 1) {
      // Bonus ball placeholder (rendered separately)
      row.push({ x: baseX + dx, y: CFG.GRID_TOP + dy, w: CFG.BRICK_W, h: CFG.BRICK_H, hp: 0, maxHp: 0, bonus: true });
    } else {
      row.push(null);
    }
  }
  game.brickRows.push(row);
}

function shiftRowsDown() {
  for (let ri = 0; ri < game.brickRows.length; ri++) {
    const row = game.brickRows[ri];
    for (let ci = 0; ci < row.length; ci++) {
      const cell = row[ci];
      if (cell) cell.y += CFG.BRICK_ROW_PITCH;
    }
  }
  // Bonuses descend with the brick grid
  for (let bi = 0; bi < game.bonuses.length; bi++) {
    game.bonuses[bi].y += CFG.BRICK_ROW_PITCH;
  }
}

function extractBonusesFromRows() {
  // Only the most recently spawned row can contain bonus cells: every prior
  // row's bonus cells were already extracted in their own spawn frame and the
  // cell slot was set to null. Walking the full brick grid here is wasted work
  // that scales with round count.
  if (game.brickRows.length === 0) return;
  const row = game.brickRows[game.brickRows.length - 1];
  for (let i = 0; i < row.length; i++) {
    const cell = row[i];
    if (cell && cell.bonus) {
      game.bonuses.push({
        x: cell.x + cell.w / 2,
        y: cell.y + cell.h / 2,
        r: CFG.BONUS_R,
        collected: false,
        phase: Math.random() * Math.PI * 2,
      });
      row[i] = null;
    }
  }
}

function checkFail() {
  for (let ri = 0; ri < game.brickRows.length; ri++) {
    const row = game.brickRows[ri];
    for (let ci = 0; ci < row.length; ci++) {
      const cell = row[ci];
      if (cell && !cell.bonus && cell.hp > 0 && cell.y + cell.h - CFG.SHAPE_MARGIN > CFG.FAIL_Y) return true;
    }
  }
  return false;
}
