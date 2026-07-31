// ============================================================
//  CONFIG — all tunable constants and state enum
// ============================================================
const CFG = {
  W: 720, H: 1280,
  BALL_R: 8,
  BALL_SPEED: 800,          // px/s
  PHYSICS_DT: 1/120,         // fixed step
  LAUNCH_INTERVAL: 0.040,    // 40ms between balls
  AIM_MIN_DEG: 10,
  AIM_MAX_DEG: 170,
  COLS: 11,
  BRICK_W: 56,
  BRICK_H: 56,
  BRICK_GAP_X: 8,
  BRICK_ROW_PITCH: 64,      // vertical distance between rows
  GRID_LEFT: 12,
  GRID_TOP: 100,            // first row y
  LAUNCHER_Y: 1190,
  LAND_Y: 1240,             // ball considered landed when y >= this
  FAIL_Y: 1180,             // brick bottom >= this → game over
  WARN_Y: 1116,             // brick bottom >= this → near-danger warning (FAIL_Y - BRICK_ROW_PITCH)
  BRICK_PROB: 0.30,
  BONUS_PROB: 0.09,
  BONUS_R: 10,
  POOL_SIZE: 220,
  BALL_CAP: 220,             // 球数封顶（= POOL_SIZE，避免池溢出导致死锁）
  OVERFLOW_SCORE: 300,       // 封顶后溢出的奖励球按此倍率转分数（一个球≈一回合数百点伤害，10 分太亏）
  HP_SLOPE_POST_CAP: 0.3,    // 封顶后砖块 HP 增长斜率（相对原斜率 3×round）
  MAX_AIM_LEN: 700,
  SHAPE_MARGIN: 4,          // inset of shape inside cell
  SHAPES: ['square', 'triangle', 'circle'],
};

const STATE = { MENU: 'menu', AIM: 'aim', SIM: 'sim', GAMEOVER: 'over' };

// Spatial hash cell size
const GRID_CELL = 72;

// Floating action button bounds (right side, visible during SIM)
const PAUSE_BTN = { cx: CFG.W - 44, cy: 110, r: 22 };
const SPEED_BTN = { cx: CFG.W - 44, cy: 162, r: 22 };
// Pause-overlay buttons
const RESUME_BTN = { x: CFG.W / 2 - 110, y: CFG.H / 2 + 50, w: 220, h: 64 };
const QUIT_BTN   = { x: CFG.W / 2 - 110, y: CFG.H / 2 + 130, w: 220, h: 56 };
