// ============================================================
//  AUDIO — procedural sound synthesis via Web Audio API (no files)
// ============================================================

let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function sfx(freq, type, duration, vol, freqEnd) {
  if (!audioCtx || audioCtx.state === 'suspended') return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + duration);
  gain.gain.setValueAtTime(Math.min(vol, 0.3), t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + duration);
}

function sfxFire()        { sfx(300, 'triangle', 0.08, 0.08, 150); }
function sfxBrickHit(hp)  { const f = 900 + (1 - Math.min(hp, 40) / 40) * 1400; sfx(f, 'sine', 0.025, 0.09); }
function sfxBrickDestroy() { sfx(100, 'sawtooth', 0.15, 0.12, 30); sfx(900, 'square', 0.03, 0.04); }
function sfxBonus()       { sfx(880, 'sine', 0.08, 0.1, 1320); setTimeout(function() { sfx(1320, 'sine', 0.06, 0.08); }, 50); }
function sfxGameOver()    { sfx(300, 'sawtooth', 0.5, 0.18, 60); setTimeout(function() { sfx(180, 'sawtooth', 0.5, 0.18, 40); }, 250); }
function sfxRoundEnd()    { [523, 659, 784, 1047].forEach(function(f, i) { setTimeout(function() { sfx(f, 'sine', 0.1, 0.08); }, i * 55); }); }
