// ============================================================
//  UTILS — pure helper functions (no side effects)
// ============================================================

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => v < lo ? lo : (v > hi ? hi : v);

// --- brickColor acceleration LUT ----------------------------------------
// brickColor() runs on every brick hit (the hottest per-collision code path).
// The cycle-color portion depends only on (hp % 90), so we pre-resolve the
// 7-stop gradient interpolation into a 90-entry LUT at module load time.
// brickColor() then just looks up the cycle color + applies the maxHp-based
// dim factor, skipping the per-call loop entirely.
const BRICK_CYCLE_LEN = 90;
const BRICK_CYCLE_STOPS = [
  [0.00,  [85,  210, 195]],  // light teal
  [0.17,  [72,  195, 110]],  // green
  [0.33,  [195, 210, 55]],   // yellow-green
  [0.50,  [245, 145, 45]],   // orange
  [0.67,  [235, 70,  90]],   // red
  [0.83,  [180, 65,  195]],  // magenta-purple
  [1.00,  [85,  210, 195]],  // back to teal (seamless loop)
];
const BRICK_CYCLE_LUT = new Array(BRICK_CYCLE_LEN);
(function buildBrickCycleLUT() {
  for (let i = 0; i < BRICK_CYCLE_LEN; i++) {
    const pos = i / BRICK_CYCLE_LEN;  // 0..1 within current cycle
    let c = BRICK_CYCLE_STOPS[0][1];
    for (let j = 0; j < BRICK_CYCLE_STOPS.length - 1; j++) {
      const a = BRICK_CYCLE_STOPS[j], b = BRICK_CYCLE_STOPS[j + 1];
      if (pos >= a[0] && pos <= b[0]) {
        const k = (pos - a[0]) / (b[0] - a[0]);
        c = [
          a[1][0] + (b[1][0] - a[1][0]) * k,
          a[1][1] + (b[1][1] - a[1][1]) * k,
          a[1][2] + (b[1][2] - a[1][2]) * k,
        ];
        break;
      }
    }
    BRICK_CYCLE_LUT[i] = c;  // store as [r,g,b] floats; dim applied at lookup
  }
})();

/**
 * Cyclic colour gradient for brick HP display.
 * Uses BRICK_CYCLE_LUT to skip the 7-stop interpolation loop on every call.
 * Cycles every ~90 HP so colours change gradually with little repetition.
 */
function brickColor(hp, maxHp) {
  const pos = ((hp % BRICK_CYCLE_LEN) + BRICK_CYCLE_LEN) % BRICK_CYCLE_LEN;  // safe mod for negatives
  const c = BRICK_CYCLE_LUT[pos];

  // Damage dimming: full HP = bright, nearly dead = dark
  const t = clamp(hp / Math.max(1, maxHp), 0, 1);
  const dim = 0.45 + 0.55 * t;
  return `rgb(${c[0] * dim | 0},${c[1] * dim | 0},${c[2] * dim | 0})`;
}

/** Lighten an rgb(r,g,b) string by `amt` (0-1). */
function lighten(rgbStr, amt) {
  const m = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return rgbStr;
  const r = clamp(+m[1] + 255 * amt | 0, 0, 255);
  const g = clamp(+m[2] + 255 * amt | 0, 0, 255);
  const b = clamp(+m[3] + 255 * amt | 0, 0, 255);
  return `rgb(${r},${g},${b})`;
}

/** Rounded-rect path + optional fill/stroke. */
function roundRect(x, y, w, h, r, fill, stroke) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
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
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/** Lighten an rgb(r,g,b) string by `amt` (0-1). */
function lighten(rgbStr, amt) {
  const m = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return rgbStr;
  const r = clamp(+m[1] + 255 * amt | 0, 0, 255);
  const g = clamp(+m[2] + 255 * amt | 0, 0, 255);
  const b = clamp(+m[3] + 255 * amt | 0, 0, 255);
  return `rgb(${r},${g},${b})`;
}

/** Rounded-rect path + optional fill/stroke. */
function roundRect(x, y, w, h, r, fill, stroke) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
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
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
