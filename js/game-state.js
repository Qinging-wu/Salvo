// ============================================================
//  GAME STATE — central mutable state for the entire game
// ============================================================

const game = {
  state: STATE.MENU,
  score: 0,
  round: 1,
  ballCount: 1,
  capRound: null,           // 球数首次达到 BALL_CAP 的回合（null=未封顶）；封顶后 HP 斜率降到 HP_SLOPE_POST_CAP
  pendingBonus: 0,
  launcherX: CFG.W / 2,
  aimAngle: Math.PI / 2,   // 90° = straight up; radians (math convention, 0=right, π/2=up-screen)
  aimAngleDeg: 90,
  ballsToFire: 0,
  fireTimer: 0,
  firstLandedX: null,
  ballsActive: 0,
  brickRows: [],            // array of arrays of bricks (rows)
  bonuses: [],
  particles: [],
  stars: [],
  shake: 0,
  hover: null,              // {x,y} pointer position for aim
  menuPulse: 0,
  overPulse: 0,
  speedMult: 1,             // simulation speed multiplier (1/2/4/8)
  targetLauncherX: CFG.W / 2, // smooth launcher animation target
  paused: false,             // pause during simulation
  bestScore: 0,             // best score persisted to localStorage
  isNewRecord: false,       // true when current run set a new best
  acc: 0,                   // fixed-timestep physics accumulator (seconds)
};

// Load persisted best score from localStorage
(function() {
  try {
    const saved = localStorage.getItem('physicsballs_best');
    if (saved) game.bestScore = parseInt(saved, 10) || 0;
  } catch (e) { /* localStorage may be unavailable */ }
})();
