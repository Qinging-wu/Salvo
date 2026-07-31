// ============================================================
//  CANVAS — DOM acquisition, 2D context, and high-DPI setup
// ============================================================
//  This module owns the canvas/ctx singletons and the DPI scaling.
//  Other modules reference the global `canvas` / `ctx` it defines.
//  Load order in index.html MUST place this after config.js (we read
//  CFG.W / CFG.H) and before any module that touches ctx (renderer,
//  utils.roundRect via renderer, main loop, input event wiring).

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// High-DPI backing store: scale the canvas internal resolution by devicePixelRatio
// (capped at 2 to bound memory on 3x/4x phones). All drawing code keeps using the
// logical 720x1280 coordinate system; the scale transform is preserved across
// save/restore cycles because no draw function calls setTransform().
(function setupHiDPI() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = CFG.W * dpr;
  canvas.height = CFG.H * dpr;
  ctx.scale(dpr, dpr);
})();
