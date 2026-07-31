// ============================================================
//  COLLISION SYSTEM — shape-specific collision detection (circle, AABB, triangle)
// ============================================================

/** Closest point on segment AB to point P. */
function closestOnSeg(px, py, ax, ay, bx, by) {
  const abx = bx - ax, aby = by - ay;
  const len2 = abx * abx + aby * aby;
  let t = len2 > 0 ? ((px - ax) * abx + (py - ay) * aby) / len2 : 0;
  t = clamp(t, 0, 1);
  return { x: ax + abx * t, y: ay + aby * t };
}

/** Point-in-triangle test (sign-of-cross-product method). */
function pointInTri(px, py, v0, v1, v2) {
  const s1 = (px - v1.x) * (v0.y - v1.y) - (v0.x - v1.x) * (py - v1.y);
  const s2 = (px - v2.x) * (v1.y - v2.y) - (v1.x - v2.x) * (py - v2.y);
  const s3 = (px - v0.x) * (v2.y - v0.y) - (v2.x - v0.x) * (py - v0.y);
  const neg = (s1 < 0) || (s2 < 0) || (s3 < 0);
  const pos = (s1 > 0) || (s2 > 0) || (s3 > 0);
  return !(neg && pos);
}

/**
 * Wrapper: handles brick rotation by transforming ball to brick-local space,
 * running the raw collision, then rotating the result back to world space.
 * Returns { hit, nx, ny, push, cx, cy } or { hit: false }.
 */
function collideBallWithBrick(b, cell) {
  if (cell.angle && cell.shape !== 'circle') {
    const bcx = cell.x + cell.w / 2;
    const bcy = cell.y + cell.h / 2;
    const cos = Math.cos(-cell.angle);
    const sin = Math.sin(-cell.angle);
    const dx = b.x - bcx;
    const dy = b.y - bcy;
    // Virtual ball in brick-local space (brick axis-aligned)
    const lb = { x: bcx + dx * cos - dy * sin, y: bcy + dx * sin + dy * cos, r: b.r };
    const hit = collideBallWithBrickRaw(lb, { x: cell.x, y: cell.y, w: cell.w, h: cell.h, shape: cell.shape, angle: 0 });
    if (hit.hit) {
      // Rotate normal back to world space
      const cosR = Math.cos(cell.angle);
      const sinR = Math.sin(cell.angle);
      const lnx = hit.nx, lny = hit.ny;
      hit.nx = lnx * cosR - lny * sinR;
      hit.ny = lnx * sinR + lny * cosR;
      // Transform contact point back to world
      if (hit.cx !== undefined) {
        const dcx = hit.cx - bcx, dcy = hit.cy - bcy;
        hit.cx = bcx + dcx * cosR - dcy * sinR;
        hit.cy = bcy + dcx * sinR + dcy * cosR;
      }
    }
    return hit;
  }
  return collideBallWithBrickRaw(b, cell);
}

/** Raw collision detection — ball vs axis-aligned shape (square / triangle / circle). */
function collideBallWithBrickRaw(b, cell) {
  const m = CFG.SHAPE_MARGIN;
  const sx = cell.x + m, sy = cell.y + m;
  const sw = cell.w - 2 * m, sh = cell.h - 2 * m;

  // --- circle shape ---
  if (cell.shape === 'circle') {
    const cx = cell.x + cell.w / 2, cy = cell.y + cell.h / 2;
    const cr = sw / 2;
    const dx = b.x - cx, dy = b.y - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= b.r + cr) return { hit: false };
    let nx, ny;
    if (d < 0.0001) { nx = 0; ny = -1; }
    else { nx = dx / d; ny = dy / d; }
    return { hit: true, nx: nx, ny: ny, push: b.r + cr - d + 0.5, cx: cx + nx * cr, cy: cy + ny * cr };
  }

  // --- triangle shape ---
  if (cell.shape === 'triangle') {
    // Equilateral-ish triangle pointing up, inscribed in shape box
    const v0 = { x: sx + sw / 2, y: sy };
    const v1 = { x: sx, y: sy + sh };
    const v2 = { x: sx + sw, y: sy + sh };
    const e0 = closestOnSeg(b.x, b.y, v0.x, v0.y, v1.x, v1.y);
    const e1 = closestOnSeg(b.x, b.y, v1.x, v1.y, v2.x, v2.y);
    const e2 = closestOnSeg(b.x, b.y, v2.x, v2.y, v0.x, v0.y);
    let best = e0, bestD = (e0.x - b.x) * (e0.x - b.x) + (e0.y - b.y) * (e0.y - b.y);
    let dd = (e1.x - b.x) * (e1.x - b.x) + (e1.y - b.y) * (e1.y - b.y);
    if (dd < bestD) { best = e1; bestD = dd; }
    dd = (e2.x - b.x) * (e2.x - b.x) + (e2.y - b.y) * (e2.y - b.y);
    if (dd < bestD) { best = e2; bestD = dd; }
    if (pointInTri(b.x, b.y, v0, v1, v2)) {
      // Ball centre inside triangle: push out toward closest boundary point
      let nx = b.x - best.x, ny = b.y - best.y;
      const nl = Math.sqrt(nx * nx + ny * ny);
      if (nl < 0.001) { nx = 0; ny = -1; } else { nx /= nl; ny /= nl; }
      return { hit: true, nx: nx, ny: ny, push: b.r + Math.sqrt(bestD) + 0.5, cx: best.x, cy: best.y };
    }
    const dist = Math.sqrt(bestD);
    if (dist >= b.r) return { hit: false };
    let nx, ny;
    if (dist < 0.0001) { nx = 0; ny = -1; }
    else { nx = (b.x - best.x) / dist; ny = (b.y - best.y) / dist; }
    return { hit: true, nx: nx, ny: ny, push: b.r - dist + 0.5, cx: best.x, cy: best.y };
  }

  // --- square (default): circle vs AABB ---
  const cx = clamp(b.x, sx, sx + sw);
  const cy = clamp(b.y, sy, sy + sh);
  const dx = b.x - cx, dy = b.y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= b.r * b.r) return { hit: false };
  const d = Math.sqrt(d2);
  let nx, ny;
  if (d < 0.0001) {
    const left = b.x - sx, right = sx + sw - b.x;
    const top = b.y - sy, bot = sy + sh - b.y;
    const mn = Math.min(left, right, top, bot);
    if (mn === left)      { nx = -1; ny = 0; }
    else if (mn === right) { nx = 1; ny = 0; }
    else if (mn === top)   { nx = 0; ny = -1; }
    else                   { nx = 0; ny = 1; }
    return { hit: true, nx: nx, ny: ny, push: b.r + 0.5, cx: cx, cy: cy };
  }
  nx = dx / d; ny = dy / d;
  return { hit: true, nx: nx, ny: ny, push: b.r - d + 0.5, cx: cx, cy: cy };
}
