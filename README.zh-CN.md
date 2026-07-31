# 🎯 Salvo I: Origin

**简体中文** | [English](./README.md)

> 🧱 一个纯前端实现的物理弹球消砖游戏。🎯 瞄准、🔥 发射、让一整队 ⚽ 小球在墙壁与砖块间反弹，尽可能多地清掉场上的数字方块——同时阻止它们压到底部 ☠️ 死亡线。

![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white) ![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black) ![No Build](https://img.shields.io/badge/No%20Build-Yes-success) ![License](https://img.shields.io/badge/license-MIT-blue) ![Platform](https://img.shields.io/badge/platform-browser-blueviolet) ![Mobile Friendly](https://img.shields.io/badge/mobile-friendly-orange)

---

## 💡 这是什么

Salvo 是一款类 🎮 BBTAN 风格的物理弹球消砖游戏，使用 **原生 HTML5 Canvas + Vanilla JavaScript** 编写，**无构建、无依赖、无框架**。🪶 打开 `index.html` 即可运行，🖥️ 桌面与 📱 移动端浏览器均可。

### ✨ 核心特性

- 🌐 **纯前端**：单个 HTML 文件 + 14 个 JS 模块，无打包步骤
- ⚙️ **固定步长物理**：60FPS / 144FPS 下行为一致
- 🔷 **多形状砖块**：方块 / 三角形 / 圆，部分带随机旋转
- 🚀 **可变倍速**：模拟中可切 1× / 2× / 4× / 8× 加速
- 🏆 **本地最高分**：通过 `localStorage` 持久化

---

## 🎮 玩法

### 🎯 目标

每一回合：**清掉尽量多的数字方块，不让任何方块触到底部 ☠️ 死亡线**。

### 🔁 一回合流程

1. 🎯 **瞄准**：按住并拖动，会出现一条带一次墙反弹预测的虚线轨迹。
2. 🔥 **发射**：松手后，所有球以 40ms 间隔依次射出，形成"弹幕"。
3. 💥 **反弹**：球在墙壁与砖块间反弹。每次撞击砖块 HP −1；HP 归零即销毁。
4. 🪂 **回收**：球触底后消失。**第一颗落地的球的位置**决定下一回合的发射点。
5. ⬇️ **结算**：所有球落地后，砖块整体下移一格，顶部随机生成新一行。
6. 💀 **失败**：任何砖块的视觉底边越过红色 🚨 DANGER 线即 Game Over。

### 🧩 关键机制

- 🔢 **数字方块 HP**：砖块上的数字 = 当前 HP，HP 越高颜色越深。新生成砖块的 HP 随回合数增长。
- 🌟 **奖励球**：场上会出现金色小球。碰到后下一回合球数 +1，多颗可叠加。
- ⚠️ **预警区**：橙色虚线以下的砖块如果**下一回合就会触线**，会自动亮起橙色描边——这是"若不消除即死"的提示。
- 🟥 **死亡线**：红色 DANGER 线下方区域，砖块越过即结束。
- 📈 **分数**：每对砖块造成 1 点伤害 +1 分。

### 🧢 球数封顶机制（BBTan 标准做法）

为防止后期球数无限增长导致对象池溢出死锁（`acquireBall` 返回 `null` → `ballsActive` 计数虚高 → 回合永不结束 → 游戏卡死），游戏在球数达到 `BALL_CAP` 后启用封顶：

- 🧢 **球数封顶**：`ballCount` 达到 `BALL_CAP`（= `POOL_SIZE` = 220）后不再增加。
- 💰 **溢出转分数**：封顶后收集的奖励球按 `OVERFLOW_SCORE`（300 分/个）转化为分数，奖励不浪费。
- 📉 **HP 斜率衰减**：首次封顶回合起，新砖块 HP 增长斜率从 `3×round` 降到 `3×0.3×round`（`HP_SLOPE_POST_CAP = 0.3`），公式在封顶边界连续，难度曲线被压平——玩家靠操作而非球数堆叠推进。
- 🛡️ **兜底防护**：`launchOne` 检查 `acquireBall` 返回值，`null` 时不计 `ballsActive`，即使未来出现回归也不会死锁回合。

> 🎛️ 以上四个常量均位于 `js/config.js`，可按需调整封顶阈值、溢出分数倍率与 HP 衰减斜率。

---

## 🕹️ 操作

| 动作 | 鼠标 🖱️ | 触屏 📱 |
| --- | --- | --- |
| 🎯 瞄准 | 按住拖动 | 按住拖动 |
| 🔥 发射 | 松开 | 松开 |
| ⏸ 暂停 / 继续 | 右上 ⏸ 按钮 | 同左 |
| 🚀 加速循环 (1→2→4→8→1) | 右上 ⏩ 按钮 | 同左 |

> 📐 瞄准角度限制在 10° ~ 170°，避免水平射出。

---

## 🚀 运行

无需构建。任选其一：

```bash
# 方式 1：直接打开 index.html

# 方式 2：本地静态服务器（推荐，移动端测试更稳）
python -m http.server 8000
#   访问 http://localhost:8000

# 或
npx serve .
```

✅ 支持 Canvas、`requestAnimationFrame`、`localStorage` 的现代浏览器均可，含 iOS Safari / Chrome Android / 桌面 Chrome / Firefox / Safari / Edge。

---

## 📂 项目结构

```
Salvo/
├── index.html              # 入口：HTML + 内联样式 + 脚本加载顺序
├── README.md               # 英文文档
├── README.zh-CN.md         # 简体中文文档
└── js/
    ├── config.js           # 所有可调常量与状态枚举
    ├── canvas.js           # canvas/ctx 获取与高 DPI 适配
    ├── utils.js            # 颜色、圆角矩形、夹紧等工具函数
    ├── audio.js            # WebAudio 合成的简易音效
    ├── game-state.js       # 全局可变状态 + localStorage 最高分
    ├── ball-manager.js     # 球对象池：acquire / release
    ├── brick-manager.js    # 砖块生成、行下移、空间哈希、失败判定
    ├── collision.js        # 圆 vs 矩形 碰撞检测
    ├── physics.js          # 单步物理推进：墙 / 砖 / 奖励球碰撞
    ├── particles.js        # 击中粒子效果
    ├── game-flow.js        # 开始游戏 / 回合结算 / 加速循环
    ├── input.js            # 鼠标 / 触屏输入、瞄准轨迹预测
    ├── renderer.js         # Canvas 绘制（背景、砖块、球、HUD、菜单）
    └── main.js             # 主循环 frame()
```

🎛️ 所有可调参数集中在 `js/config.js`，调整数值即可改变难度、节奏与视觉风格。

---

## 📄 License

🪪 MIT
