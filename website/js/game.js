// ═══════════════════════════════════════════════════════════════
//  Flappy Angry Bird — Ultimate HTML5 Canvas & Web Audio Engine
//  Architecture & Enhancements by Yuvraj Chopra
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  // ─── Virtual Resolution & Engine Constants ───────────────────
  const W = 400;
  const H = 600;
  const GROUND_H = 90;
  const PIPE_W = 52;
  const PIPE_GAP = 140;
  const BIRD_SZ = 34;
  const FPS = 60;

  // Skins
  const SKIN_RED = 0;
  const SKIN_CHUCK = 1;
  const SKIN_BOMB = 2;
  const SKIN_NAMES = ["RED", "CHUCK", "BOMB"];

  // ─── Color Palette ───────────────────────────────────────────
  const COL = {
    // Skies
    skyDayTop: "#50B4DC", skyDayBot: "#A0DCE8",
    skySunsetTop: "#F06E3C", skySunsetBot: "#FFC878",
    skyNightTop: "#0F172A", skyNightBot: "#283C5F",
    
    // Mountains
    mountDay: "#326E5F", mountSunset: "#783C46", mountNight: "#192337",
    
    // Pipes
    pipeBody: "#22B14C", pipeDark: "#0E6423", pipeHl: "#64D278",
    
    // Birds
    birdRed: "#C81E1E", birdRedDark: "#A01010", birdBelly: "#E6C8A0",
    birdYellow: "#FFD700", birdYellowDark: "#D2A000",
    birdBomb: "#23232A", birdBombDark: "#0F0F14",
    beak: "#FFB41E", beakDark: "#DC8C0A",
    
    // Ground
    groundGrn: "#64C850", groundBrn: "#D2B478", groundDk: "#A0783C",
    
    // Accents & FX
    gold: "#FFD700", goldBright: "#FFE66E",
    cyanGlow: "#00E1FF", shieldAura: "rgba(0, 225, 255, 0.35)",
    white: "#FFFFFF", black: "#000000",
    
    // Medals
    medalBronze: "#C88C50", medalSilver: "#C8C8D2", medalGold: "#FFC832",
    medalPlat: "#DCE6FF", medalDiamond: "#00E5FF",
    panelBg: "rgba(30, 41, 59, 0.95)", panelBorder: "#FFD700"
  };

  // ─── Web Audio Synthesizer (Zero External Dependencies) ───────
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem("fab_muted") === "true";
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.ctx = new AudioContext();
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem("fab_muted", this.muted ? "true" : "false");
      return this.muted;
    }

    playFlap() {
      if (this.muted || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.exponentialRampToValueAtTime(860, t + 0.12);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      } catch (e) {}
    }

    playPoint() {
      if (this.muted || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(987.77, t);
        osc.frequency.setValueAtTime(1318.51, t + 0.08);
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      } catch (e) {}
    }

    playStar() {
      if (this.muted || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(740, t);
        osc.frequency.exponentialRampToValueAtTime(1480, t + 0.25);
        gain.gain.setValueAtTime(0.32, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      } catch (e) {}
    }

    playShield() {
      if (this.muted || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(1100, t + 0.35);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
      } catch (e) {}
    }

    playShatter() {
      if (this.muted || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.22;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1200, t);
        filter.frequency.linearRampToValueAtTime(200, t + 0.22);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
      } catch (e) {}
    }

    playHit() {
      if (this.muted || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(750, t);
        filter.frequency.linearRampToValueAtTime(90, t + 0.15);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
      } catch (e) {}
    }

    playDie() {
      if (this.muted || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(420, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.45);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      } catch (e) {}
    }

    playMedal() {
      if (this.muted || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const start = t + idx * 0.08;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.24, start);
          gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(start);
          osc.stop(start + 0.2);
        });
      } catch (e) {}
    }
  }

  const audio = new SoundEngine();

  // ─── Engine State Variables ──────────────────────────────────
  let canvas, ctx;
  let dpr = 1;
  let bird, pipes, collectibles, particles, popups, clouds, starsBg, mountains;
  let score = 0, bestScore = 0;
  let currentSkin = parseInt(localStorage.getItem("fab_skin") || "0", 10);
  let pipeTimer = 0, groundOff = 0;
  let gameStarted = false, gameOver = false, isPaused = false;
  let deathDone = false, shakeTicks = 0;
  let lastTime = 0;

  // ─── Mathematical Helpers ────────────────────────────────────
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ─── High DPI Canvas Setup ───────────────────────────────────
  function setupCanvas() {
    canvas = document.getElementById("game-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    dpr = window.devicePixelRatio || 1;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
  }

  // ─── Particle System ─────────────────────────────────────────
  class Particle {
    constructor(x, y, color, speedMult = 1.0, shape = "circle") {
      this.x = x;
      this.y = y;
      const a = rand(0, Math.PI * 2);
      const sp = rand(1.5, 5.0) * speedMult;
      this.vx = Math.cos(a) * sp;
      this.vy = Math.sin(a) * sp - 1.5;
      this.life = randInt(16, 35);
      this.maxLife = this.life;
      this.sz = rand(2, 5);
      this.color = color || (Math.random() > 0.5 ? COL.gold : COL.white);
      this.shape = shape;
    }

    update() {
      this.x += this.vx;
      this.vy += 0.16;
      this.y += this.vy;
      this.life--;
      return this.life > 0;
    }

    draw(c) {
      const a = Math.max(0, this.life / this.maxLife);
      const r = Math.max(1, this.sz * a);
      c.save();
      c.globalAlpha = a;
      c.fillStyle = this.color;
      if (this.shape === "star") {
        drawStar(c, this.x, this.y, 5, r, r * 0.45);
      } else {
        c.beginPath();
        c.arc(this.x, this.y, r, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }
  }

  // ─── Floating Popup Texts ────────────────────────────────────
  class PopupText {
    constructor(x, y, text, color = COL.gold, size = 20) {
      this.x = x;
      this.y = y;
      this.text = text;
      this.color = color;
      this.size = size;
      this.life = 45;
      this.maxLife = 45;
    }

    update() {
      this.y -= 1.2;
      this.life--;
      return this.life > 0;
    }

    draw(c) {
      const a = Math.max(0, this.life / this.maxLife);
      c.save();
      c.globalAlpha = a;
      c.font = `800 ${this.size}px 'Outfit', sans-serif`;
      c.textAlign = "center";
      c.fillStyle = "rgba(0,0,0,0.5)";
      c.fillText(this.text, this.x + 1, this.y + 1);
      c.fillStyle = this.color;
      c.fillText(this.text, this.x, this.y);
      c.restore();
    }
  }

  // ─── Collectibles (Star & Shield) ────────────────────────────
  class Collectible {
    constructor(x, y, type = "star") {
      this.x = x;
      this.y = y;
      this.type = type;
      this.timer = rand(0, Math.PI * 2);
    }

    update(sp) {
      this.x -= sp;
      this.timer += 0.08;
    }

    getRect() {
      return { x: this.x - 12, y: this.y - 12, w: 24, h: 24 };
    }

    draw(c) {
      const bob = Math.sin(this.timer) * 4;
      const cx = this.x, cy = this.y + bob;

      if (this.type === "star") {
        const r = 11 + Math.sin(this.timer * 2) * 2;
        c.save();
        c.fillStyle = COL.goldBright;
        c.strokeStyle = "#B47800";
        c.lineWidth = 1.5;
        drawStar(c, cx, cy, 5, r, r * 0.45);
        c.restore();
      } else if (this.type === "shield") {
        const r = 13 + Math.sin(this.timer * 2) * 2;
        c.save();
        c.fillStyle = "rgba(0, 220, 255, 0.4)";
        c.beginPath();
        c.arc(cx, cy, r, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = COL.cyanGlow;
        c.lineWidth = 2;
        c.stroke();
        c.fillStyle = COL.white;
        c.beginPath();
        c.arc(cx - 3, cy - 3, Math.max(2, r * 0.25), 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }
  }

  function drawStar(c, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = (Math.PI / 2) * 3;
    let x = cx, y = cy;
    const step = Math.PI / spikes;

    c.beginPath();
    c.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      c.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      c.lineTo(x, y);
      rot += step;
    }
    c.lineTo(cx, cy - outerRadius);
    c.closePath();
    c.fill();
    c.stroke();
  }

  // ─── Game Reset & Bird Physics ───────────────────────────────
  function resetGame() {
    bird = {
      x: 80,
      y: H / 2 - 20,
      vel: 0,
      grav: 0.45,
      jstr: -7.5,
      rot: 0,
      flap: 0,
      size: BIRD_SZ,
      skin: currentSkin,
      hasShield: false,
      shieldPulse: 0
    };
    pipes = [];
    collectibles = [];
    particles = [];
    popups = [];
    score = 0;
    pipeTimer = 0;
    groundOff = 0;
    gameStarted = false;
    gameOver = false;
    isPaused = false;
    deathDone = false;
    shakeTicks = 0;
  }

  function birdJump() {
    audio.init();
    audio.playFlap();
    bird.vel = bird.jstr;
    bird.rot = 30;
    bird.flap = 8;
  }

  function birdUpdate() {
    bird.vel += bird.grav;
    bird.y += bird.vel;
    bird.flap = Math.max(0, bird.flap - 1);
    bird.shieldPulse += 0.1;

    if (bird.vel < -2) {
      bird.rot = Math.min(30, bird.rot + 5);
    } else if (bird.vel > 2) {
      bird.rot = Math.max(-70, bird.rot - 3);
    } else {
      const targetRot = clamp(-bird.vel * 8, -20, 10);
      bird.rot += (targetRot - bird.rot) * 0.1;
    }

    if (bird.y < 0) {
      bird.y = 0;
      bird.vel = 0;
    } else if (bird.y > H - GROUND_H - bird.size) {
      bird.y = H - GROUND_H - bird.size;
    }
  }

  function birdRect() {
    const m = bird.size * 0.2;
    return { x: bird.x + m, y: bird.y + m, w: bird.size - m * 2, h: bird.size - m * 2 };
  }

  function drawBird(c) {
    const cx = bird.x + bird.size / 2;
    const cy = bird.y + bird.size / 2;
    const r = bird.size / 2;
    const s = bird.size / 34.0;
    const si = v => v * s;

    c.save();

    // ── Shield Aura
    if (bird.hasShield) {
      const pulse = Math.sin(bird.shieldPulse) * 3;
      const sr = r + 9 + pulse;
      c.fillStyle = "rgba(0, 225, 255, 0.25)";
      c.beginPath();
      c.arc(cx, cy, sr, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = COL.cyanGlow;
      c.lineWidth = 2;
      c.stroke();
    }

    c.translate(cx, cy);
    c.rotate((-bird.rot * Math.PI) / 180);
    c.translate(-cx, -cy);

    if (bird.skin === SKIN_RED) {
      // 🔴 RED (Classic)
      c.fillStyle = COL.black;
      c.beginPath();
      c.moveTo(cx - r + si(3), cy);
      c.lineTo(cx - r - si(8), cy - si(7));
      c.lineTo(cx - r - si(8), cy + si(7));
      c.fill();

      c.fillStyle = COL.birdRed;
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = COL.birdRedDark; c.lineWidth = 2.2; c.stroke();

      c.fillStyle = COL.birdBelly;
      c.beginPath(); c.arc(cx, cy + si(6), Math.max(1, r - si(6)), 0, Math.PI * 2); c.fill();

      // Eyes
      const er = Math.max(2, si(6)), pr = Math.max(1, si(2.2));
      [[cx + si(1), cy - si(7)], [cx + si(11), cy - si(7)]].forEach(([ex, ey]) => {
        c.fillStyle = COL.white;
        c.beginPath(); c.arc(ex, ey, er, 0, Math.PI * 2); c.fill();
        c.strokeStyle = COL.black; c.lineWidth = Math.max(1, si(1.2)); c.stroke();
        c.fillStyle = COL.black;
        c.beginPath(); c.arc(ex + si(2), ey, pr, 0, Math.PI * 2); c.fill();
      });

      // Brows
      c.strokeStyle = COL.black; c.lineWidth = Math.max(2.2, si(3.2)); c.lineCap = "round";
      c.beginPath(); c.moveTo(cx - si(4), cy - si(13)); c.lineTo(cx + si(6), cy - si(4)); c.stroke();
      c.beginPath(); c.moveTo(cx + si(6), cy - si(4)); c.lineTo(cx + si(16), cy - si(13)); c.stroke();

      // Beak
      c.fillStyle = COL.beak;
      c.beginPath();
      c.moveTo(cx + si(6), cy + si(1));
      c.lineTo(cx + si(18), cy + si(6));
      c.lineTo(cx + si(6), cy + si(11));
      c.closePath(); c.fill();
      c.strokeStyle = COL.beakDark; c.lineWidth = Math.max(1, si(1.2)); c.stroke();

      // Wing
      const wo = bird.flap > 0 ? si(4) : 0;
      c.fillStyle = COL.birdRedDark;
      c.beginPath();
      c.moveTo(cx - si(4), cy + si(2));
      c.lineTo(cx - si(12), cy - si(2) - wo);
      c.lineTo(cx - si(2), cy + si(8));
      c.closePath(); c.fill();

    } else if (bird.skin === SKIN_CHUCK) {
      // 🟡 CHUCK (Speedster Yellow)
      c.fillStyle = COL.black;
      c.beginPath();
      c.moveTo(cx - r - si(2), cy);
      c.lineTo(cx - r - si(11), cy - si(8));
      c.lineTo(cx - r - si(11), cy + si(8));
      c.fill();

      // Crest
      c.beginPath();
      c.moveTo(cx - si(4), cy - r);
      c.lineTo(cx - si(10), cy - r - si(10));
      c.lineTo(cx, cy - r);
      c.fill();

      // Cone body
      c.fillStyle = COL.birdYellow;
      c.beginPath();
      c.moveTo(cx + r + si(4), cy);
      c.lineTo(cx - r, cy - r);
      c.lineTo(cx - r + si(4), cy + r);
      c.closePath(); c.fill();
      c.strokeStyle = COL.birdYellowDark; c.lineWidth = 2.2; c.stroke();

      // Belly
      c.fillStyle = "#FFFBE6";
      c.beginPath();
      c.ellipse(cx - r + si(10), cy + si(4), si(8), si(6), 0, 0, Math.PI * 2);
      c.fill();

      // Eyes
      const er = Math.max(2, si(5)), pr = Math.max(1, si(2));
      [[cx + si(2), cy - si(6)], [cx + si(11), cy - si(6)]].forEach(([ex, ey]) => {
        c.fillStyle = COL.white;
        c.beginPath(); c.arc(ex, ey, er, 0, Math.PI * 2); c.fill();
        c.strokeStyle = COL.black; c.lineWidth = 1; c.stroke();
        c.fillStyle = COL.black;
        c.beginPath(); c.arc(ex + si(2), ey, pr, 0, Math.PI * 2); c.fill();
      });

      // Brows
      c.strokeStyle = "#B43200"; c.lineWidth = 2.2; c.lineCap = "round";
      c.beginPath(); c.moveTo(cx - si(2), cy - si(12)); c.lineTo(cx + si(6), cy - si(5)); c.stroke();
      c.beginPath(); c.moveTo(cx + si(6), cy - si(5)); c.lineTo(cx + si(15), cy - si(12)); c.stroke();

      // Beak
      c.fillStyle = "#FF8C00";
      c.beginPath();
      c.moveTo(cx + si(6), cy);
      c.lineTo(cx + si(22), cy + si(4));
      c.lineTo(cx + si(6), cy + si(9));
      c.closePath(); c.fill();
      c.strokeStyle = "#C85A00"; c.lineWidth = 1.2; c.stroke();

      // Wing
      const wo = bird.flap > 0 ? si(4) : 0;
      c.fillStyle = COL.birdYellowDark;
      c.beginPath();
      c.moveTo(cx - si(2), cy + si(1));
      c.lineTo(cx - si(12), cy - si(3) - wo);
      c.lineTo(cx - si(1), cy + si(7));
      c.closePath(); c.fill();

    } else if (bird.skin === SKIN_BOMB) {
      // 💣 BOMB (Explosive Black)
      c.fillStyle = COL.black;
      c.beginPath();
      c.moveTo(cx - r + si(2), cy);
      c.lineTo(cx - r - si(9), cy - si(6));
      c.lineTo(cx - r - si(9), cy + si(6));
      c.fill();

      // Fuse & Animated Spark
      c.strokeStyle = "#786E5A"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(cx, cy - r); c.lineTo(cx, cy - r - si(8)); c.stroke();
      c.fillStyle = Math.random() > 0.5 ? "#FF7800" : "#FFD700";
      c.beginPath(); c.arc(cx, cy - r - si(9), Math.max(2, si(3)), 0, Math.PI * 2); c.fill();

      // Body
      c.fillStyle = COL.birdBomb;
      c.beginPath(); c.arc(cx, cy, r + si(1), 0, Math.PI * 2); c.fill();
      c.strokeStyle = COL.birdBombDark; c.lineWidth = 2.2; c.stroke();

      c.fillStyle = "#505560";
      c.beginPath(); c.arc(cx, cy + si(6), Math.max(1, r - si(6)), 0, Math.PI * 2); c.fill();

      // White forehead dot
      c.fillStyle = COL.white;
      c.beginPath(); c.arc(cx, cy - si(8), Math.max(1, si(2)), 0, Math.PI * 2); c.fill();

      // Eyes
      const er = Math.max(2, si(5)), pr = Math.max(1, si(2));
      [[cx + si(2), cy - si(5)], [cx + si(11), cy - si(5)]].forEach(([ex, ey]) => {
        c.fillStyle = COL.white;
        c.beginPath(); c.arc(ex, ey, er, 0, Math.PI * 2); c.fill();
        c.strokeStyle = COL.black; c.lineWidth = 1; c.stroke();
        c.fillStyle = "#C81E1E";
        c.beginPath(); c.arc(ex + si(2), ey, pr, 0, Math.PI * 2); c.fill();
      });

      // Red Flaming Brows
      c.strokeStyle = "#DC2828"; c.lineWidth = 3; c.lineCap = "round";
      c.beginPath(); c.moveTo(cx - si(3), cy - si(11)); c.lineTo(cx + si(6), cy - si(4)); c.stroke();
      c.beginPath(); c.moveTo(cx + si(6), cy - si(4)); c.lineTo(cx + si(15), cy - si(11)); c.stroke();

      // Beak
      c.fillStyle = COL.beak;
      c.beginPath();
      c.moveTo(cx + si(6), cy + si(1));
      c.lineTo(cx + si(17), cy + si(6));
      c.lineTo(cx + si(6), cy + si(11));
      c.closePath(); c.fill();
      c.strokeStyle = COL.beakDark; c.lineWidth = 1.2; c.stroke();

      // Wing
      const wo = bird.flap > 0 ? si(4) : 0;
      c.fillStyle = "#3C3C46";
      c.beginPath();
      c.moveTo(cx - si(4), cy + si(2));
      c.lineTo(cx - si(12), cy - si(2) - wo);
      c.lineTo(cx - si(2), cy + si(8));
      c.closePath(); c.fill();
    }

    c.restore();
  }

  // ─── Pipes & Collectibles Logic ──────────────────────────────
  function getPipeSpeed() {
    return 3.0 + Math.min(score * 0.08, 2.0);
  }

  function spawnPipe() {
    const minH = 60;
    const maxH = H - GROUND_H - PIPE_GAP - 60;
    const h = randInt(minH, Math.max(minH, maxH));
    const p = { x: W + 20, h: h, scored: false };
    pipes.push(p);

    // Collectibles (Star / Shield)
    const roll = Math.random();
    const gapCenter = h + PIPE_GAP / 2;
    if (roll < 0.15 && !bird.hasShield) {
      collectibles.push(new Collectible(p.x + PIPE_W / 2, gapCenter, "shield"));
    } else if (roll < 0.60) {
      collectibles.push(new Collectible(p.x + PIPE_W / 2, gapCenter, "star"));
    }
  }

  function updatePipes() {
    const sp = getPipeSpeed();
    pipeTimer++;
    const interval = Math.max(65, 90 - score);

    if (pipeTimer > interval) {
      spawnPipe();
      pipeTimer = 0;
    }

    const br = birdRect();

    // Collectibles update
    for (let i = collectibles.length - 1; i >= 0; i--) {
      const col = collectibles[i];
      col.update(sp);
      if (col.x < -20) {
        collectibles.splice(i, 1);
        continue;
      }
      if (rectsIntersect(br, col.getRect())) {
        collectibles.splice(i, 1);
        if (col.type === "star") {
          score += 3;
          audio.playStar();
          popups.push(new PopupText(col.x, col.y, "+3 PTS", COL.goldBright, 26));
          for (let s = 0; s < 12; s++) particles.push(new Particle(col.x, col.y, COL.gold, 1.2, "star"));
        } else if (col.type === "shield") {
          bird.hasShield = true;
          audio.playShield();
          popups.push(new PopupText(col.x, col.y, "SHIELD ON!", COL.cyanGlow, 30));
          for (let s = 0; s < 16; s++) particles.push(new Particle(col.x, col.y, COL.cyanGlow, 1.4));
        }
      }
    }

    // Pipes update
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= sp;

      if (p.x + PIPE_W < -20) {
        pipes.splice(i, 1);
        continue;
      }

      if (!p.scored && p.x + PIPE_W < bird.x) {
        p.scored = true;
        score++;
        audio.playPoint();
        popups.push(new PopupText(W / 2, 85, "+1", COL.white, 20));
        for (let s = 0; s < 8; s++) particles.push(new Particle(W / 2, 70, COL.gold, 1.0, "star"));
      }

      const topRect = { x: p.x, y: 0, w: PIPE_W, h: p.h };
      const botRect = { x: p.x, y: p.h + PIPE_GAP, w: PIPE_W, h: H - (p.h + PIPE_GAP) - GROUND_H };

      if (rectsIntersect(br, topRect) || rectsIntersect(br, botRect)) {
        if (bird.hasShield) {
          bird.hasShield = false;
          audio.playShatter();
          shakeTicks = 10;
          popups.push(new PopupText(bird.x, bird.y - 15, "SHIELD SAVED YOU!", COL.cyanGlow, 26));
          for (let s = 0; s < 25; s++) particles.push(new Particle(bird.x + 15, bird.y + 15, COL.cyanGlow, 1.8));
          p.x = -100;
        } else {
          triggerDeath();
        }
      }
    }
  }

  function rectsIntersect(r1, r2) {
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
  }

  function drawPipe(p, c) {
    const ch = 22, co = 5;
    const ix = Math.round(p.x);

    // Top pipe
    c.fillStyle = COL.pipeBody;
    c.fillRect(ix, 0, PIPE_W, p.h);
    c.strokeStyle = COL.pipeDark; c.lineWidth = 2; c.strokeRect(ix, 0, PIPE_W, p.h);
    c.strokeStyle = COL.pipeHl; c.lineWidth = 3;
    c.beginPath(); c.moveTo(ix + 7, 0); c.lineTo(ix + 7, Math.max(0, p.h - ch)); c.stroke();
    drawRoundedRect(c, ix - co, p.h - ch, PIPE_W + co * 2, ch, 3, COL.pipeBody, COL.pipeDark);

    // Bottom pipe
    const botY = p.h + PIPE_GAP, botH = H - botY - GROUND_H;
    c.fillStyle = COL.pipeBody;
    c.fillRect(ix, botY, PIPE_W, botH);
    c.strokeStyle = COL.pipeDark; c.lineWidth = 2; c.strokeRect(ix, botY, PIPE_W, botH);
    c.strokeStyle = COL.pipeHl; c.lineWidth = 3;
    c.beginPath(); c.moveTo(ix + 7, botY + ch); c.lineTo(ix + 7, H - GROUND_H); c.stroke();
    drawRoundedRect(c, ix - co, botY, PIPE_W + co * 2, ch, 3, COL.pipeBody, COL.pipeDark);
  }

  function drawRoundedRect(c, x, y, w, h, r, fill, stroke) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
  }

  // ─── Environment & Day/Night Cycle ───────────────────────────
  function drawBackground(c) {
    // Dynamic Sky Gradient
    let skyTop = COL.skyDayTop, skyBot = COL.skyDayBot;
    let hillCol = COL.mountDay, cloudCol = "rgba(255,255,255,0.88)";

    if (score >= 25) {
      skyTop = COL.skyNightTop; skyBot = COL.skyNightBot;
      hillCol = COL.mountNight; cloudCol = "rgba(100,120,150,0.8)";
    } else if (score >= 10) {
      skyTop = COL.skySunsetTop; skyBot = COL.skySunsetBot;
      hillCol = COL.mountSunset; cloudCol = "rgba(255,230,200,0.85)";
    }

    const grad = c.createLinearGradient(0, 0, 0, H - GROUND_H);
    grad.addColorStop(0, skyTop); grad.addColorStop(1, skyBot);
    c.fillStyle = grad;
    c.fillRect(0, 0, W, H - GROUND_H);

    // Stars at night
    if (score >= 18) {
      starsBg.forEach(s => {
        s.tw += 0.05;
        const br = 180 + Math.sin(s.tw) * 70;
        c.fillStyle = `rgb(${br},${br},${br})`;
        c.beginPath(); c.arc(s.x, s.y, s.sz, 0, Math.PI * 2); c.fill();
      });
    }

    // Parallax Mountains
    mountains.forEach(([mx, my]) => {
      c.fillStyle = hillCol;
      c.beginPath();
      c.moveTo(mx - 70, H - GROUND_H);
      c.lineTo(mx + 30, my);
      c.lineTo(mx + 130, H - GROUND_H);
      c.closePath(); c.fill();
    });

    // Clouds
    clouds.forEach(cloud => {
      if (!isPaused) cloud.x -= cloud.sp;
      if (cloud.x < -130) { cloud.x = W + rand(40, 140); cloud.y = rand(20, 200); }
      const cx = cloud.x, cy = cloud.y, sz = cloud.sz;
      c.fillStyle = cloudCol;
      c.beginPath();
      c.arc(cx, cy, 25 * sz, 0, Math.PI * 2);
      c.arc(cx - 18 * sz, cy + 8 * sz, 20 * sz, 0, Math.PI * 2);
      c.arc(cx + 18 * sz, cy + 8 * sz, 20 * sz, 0, Math.PI * 2);
      c.arc(cx + 8 * sz, cy - 6 * sz, 16 * sz, 0, Math.PI * 2);
      c.fill();
    });

    // Ground Strip
    const gy = H - GROUND_H;
    c.fillStyle = COL.groundBrn; c.fillRect(0, gy, W, GROUND_H);
    c.fillStyle = COL.groundGrn; c.fillRect(0, gy, W, 12);
    c.strokeStyle = "#46A032"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, gy + 12); c.lineTo(W, gy + 12); c.stroke();

    if (gameStarted && !gameOver && !isPaused) groundOff = (groundOff + getPipeSpeed()) % 24;
    const off = Math.floor(groundOff);
    c.strokeStyle = COL.groundDk; c.lineWidth = 1;
    for (let i = -24 + off; i < W + 24; i += 24) {
      c.beginPath(); c.moveTo(i, gy + 14); c.lineTo(i - 12, gy + GROUND_H); c.stroke();
    }
  }

  // ─── Death & Particles ───────────────────────────────────────
  function triggerDeath() {
    if (gameOver) return;
    gameOver = true;
    shakeTicks = 14;
    audio.playHit();
    setTimeout(() => audio.playDie(), 120);

    const bx = bird.x + bird.size / 2, by = bird.y + bird.size / 2;
    const pCol = bird.skin === SKIN_RED ? COL.birdRed : (bird.skin === SKIN_CHUCK ? COL.gold : "#282830");
    for (let i = 0; i < 25; i++) particles.push(new Particle(bx, by, pCol, 1.5));

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("fab_best", bestScore.toString());
      setTimeout(() => audio.playMedal(), 400);
    }
  }

  // ─── UI Overlay Screens ──────────────────────────────────────
  function drawScoreHUD(c) {
    c.font = "900 54px 'Outfit', sans-serif";
    c.textAlign = "center";
    c.fillStyle = "rgba(0,0,0,0.35)";
    c.fillText(score, W / 2 + 2, 62);
    c.fillStyle = COL.white;
    c.fillText(score, W / 2, 60);

    if (bird.hasShield) {
      c.font = "700 16px 'Outfit', sans-serif";
      c.fillStyle = COL.cyanGlow;
      c.fillText("SHIELD ACTIVE", W / 2, 88);
    }
  }

  function drawStartScreen(c) {
    const t = performance.now();
    const bob = Math.sin(t / 400) * 6;
    const titleY = H / 2 - 95 + bob;

    c.textAlign = "center";

    // Title
    c.font = "900 42px 'Outfit', sans-serif";
    c.fillStyle = "rgba(100, 0, 0, 0.4)";
    c.fillText("FLAPPY", W / 2 + 2, titleY + 2);
    c.fillText("ANGRY BIRD", W / 2 + 2, titleY + 48 + 2);

    c.fillStyle = COL.birdRed;
    c.fillText("FLAPPY", W / 2, titleY);
    c.fillText("ANGRY BIRD", W / 2, titleY + 48);

    // Tap/Space Prompt
    const pulse = 0.5 + 0.5 * Math.sin(t / 280);
    c.globalAlpha = 0.5 + pulse * 0.5;
    c.font = "700 22px 'Outfit', sans-serif";
    c.fillStyle = COL.white;
    c.fillText("TAP or Press SPACE to Flap", W / 2, H / 2 + 30);
    c.globalAlpha = 1;

    // Character Skin Selector Box
    const boxW = 230, boxH = 44;
    const boxX = (W - boxW) / 2, boxY = H / 2 + 65;
    drawRoundedRect(c, boxX, boxY, boxW, boxH, 10, "rgba(30, 41, 59, 0.9)", COL.gold);

    c.font = "800 18px 'Outfit', sans-serif";
    c.fillStyle = COL.goldBright;
    c.fillText(`◄  HERO: ${SKIN_NAMES[currentSkin]} (TAB)  ►`, W / 2, boxY + 28);

    if (bestScore > 0) {
      c.font = "600 20px 'Outfit', sans-serif";
      c.fillStyle = COL.gold;
      c.fillText(`Best: ${bestScore}`, W / 2, H / 2 + 140);
    }

    c.font = "500 13px 'Outfit', sans-serif";
    c.fillStyle = "rgba(255, 255, 255, 0.45)";
    c.fillText("BUILT BY YUVRAJ CHOPRA", W / 2, H - 24);
  }

  function drawPauseScreen(c) {
    c.fillStyle = "rgba(15, 23, 42, 0.65)";
    c.fillRect(0, 0, W, H);
    c.textAlign = "center";
    c.font = "900 44px 'Outfit', sans-serif";
    c.fillStyle = COL.gold;
    c.fillText("PAUSED", W / 2, H / 2 - 20);
    c.font = "600 20px 'Outfit', sans-serif";
    c.fillStyle = COL.white;
    c.fillText("Press P or Tap to Resume", W / 2, H / 2 + 30);
  }

  function drawGameOverScreen(c) {
    c.fillStyle = "rgba(10, 15, 26, 0.5)";
    c.fillRect(0, 0, W, H);

    const pw = 300, ph = 260;
    const px = (W - pw) / 2, py = (H - ph) / 2 - 15;
    drawRoundedRect(c, px, py, pw, ph, 18, COL.panelBg, COL.panelBorder);

    c.font = "900 36px 'Outfit', sans-serif";
    c.textAlign = "center";
    c.fillStyle = "#FF4545";
    c.fillText("GAME OVER", W / 2, py + 46);

    c.strokeStyle = "rgba(255, 255, 255, 0.15)";
    c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(px + 20, py + 64); c.lineTo(px + pw - 20, py + 64); c.stroke();

    c.textAlign = "left";
    c.font = "700 26px 'Outfit', sans-serif";
    c.fillStyle = COL.white;
    c.fillText(`Score:  ${score}`, px + 30, py + 105);

    const isNewBest = score > 0 && score >= bestScore;
    c.fillStyle = isNewBest ? COL.gold : "#A0AEC0";
    c.fillText(`Best:   ${bestScore}`, px + 30, py + 145);

    if (isNewBest) {
      c.font = "900 16px 'Outfit', sans-serif";
      c.fillStyle = COL.gold;
      c.textAlign = "right";
      c.fillText("NEW!", px + pw - 24, py + 145);
    }

    // Medals (Bronze, Silver, Gold, Platinum, Diamond)
    let medalColor = null, medalLabel = "MEDAL";
    if (score >= 75) { medalColor = COL.medalDiamond; medalLabel = "DIAMOND"; }
    else if (score >= 50) { medalColor = COL.medalPlat; medalLabel = "PLATINUM"; }
    else if (score >= 30) { medalColor = COL.medalGold; medalLabel = "GOLD"; }
    else if (score >= 15) { medalColor = COL.medalSilver; medalLabel = "SILVER"; }
    else if (score >= 5) { medalColor = COL.medalBronze; medalLabel = "BRONZE"; }

    if (medalColor) {
      const mx = px + pw - 55, my = py + 105;
      c.fillStyle = medalColor;
      c.beginPath(); c.arc(mx, my, 20, 0, Math.PI * 2); c.fill();
      c.strokeStyle = COL.black; c.lineWidth = 2; c.stroke();
      c.font = "bold 10px 'Outfit', sans-serif"; c.textAlign = "center"; c.fillStyle = COL.black;
      c.fillText(medalLabel, mx, my + 4);
    }

    c.strokeStyle = "rgba(255, 255, 255, 0.15)";
    c.beginPath(); c.moveTo(px + 20, py + 175); c.lineTo(px + pw - 20, py + 175); c.stroke();

    const t = performance.now();
    const pulse = 0.5 + 0.5 * Math.sin(t / 300);
    c.globalAlpha = 0.6 + pulse * 0.4;
    c.font = "700 22px 'Outfit', sans-serif";
    c.textAlign = "center";
    c.fillStyle = "#A8C7FA";
    c.fillText("Press R or Tap to Retry", W / 2, py + ph - 30);
    c.globalAlpha = 1;
  }

  // ─── Input & Event Management ────────────────────────────────
  function cycleSkin(step = 1) {
    currentSkin = (currentSkin + step + SKIN_NAMES.length) % SKIN_NAMES.length;
    localStorage.setItem("fab_skin", currentSkin.toString());
    if (bird) bird.skin = currentSkin;
  }

  function handlePrimaryAction(pos = null) {
    audio.init();

    if (isPaused) {
      isPaused = false;
      return;
    }

    if (!gameStarted && !gameOver) {
      if (pos) {
        const boxW = 230, boxH = 44;
        const boxX = (W - boxW) / 2, boxY = H / 2 + 65;
        if (pos.x >= boxX && pos.x <= boxX + boxW && pos.y >= boxY && pos.y <= boxY + boxH) {
          cycleSkin(1);
          return;
        }
      }
      gameStarted = true;
      birdJump();
    } else if (gameStarted && !gameOver) {
      birdJump();
    } else if (gameOver) {
      resetGame();
    }
  }

  function getCanvasPos(e) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H
    };
  }

  function bindEvents() {
    window.addEventListener("keydown", function (e) {
      if (e.code === "Space" || e.key === " " || e.code === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        handlePrimaryAction();
      } else if (e.code === "Tab" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        if (!gameStarted) cycleSkin(1);
      } else if (e.code === "KeyR" || e.key === "r" || e.key === "R") {
        if (gameOver) resetGame();
      } else if (e.code === "KeyP" || e.key === "p" || e.key === "P" || e.code === "Escape") {
        if (gameStarted && !gameOver) isPaused = !isPaused;
      } else if (e.code === "KeyM" || e.key === "m" || e.key === "M") {
        const isMuted = audio.toggleMute();
        updateMuteButtonUI(isMuted);
      }
    });

    if (canvas) {
      canvas.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        handlePrimaryAction(getCanvasPos(e));
      });

      canvas.addEventListener("touchstart", function (e) {
        e.preventDefault();
        handlePrimaryAction(getCanvasPos(e));
      }, { passive: false });
    }

    const btnMute = document.getElementById("btn-mute");
    if (btnMute) {
      btnMute.addEventListener("click", () => {
        audio.init();
        const isMuted = audio.toggleMute();
        updateMuteButtonUI(isMuted);
      });
      updateMuteButtonUI(audio.muted);
    }

    const btnPause = document.getElementById("btn-pause");
    if (btnPause) {
      btnPause.addEventListener("click", () => {
        if (gameStarted && !gameOver) isPaused = !isPaused;
      });
    }

    const btnFullscreen = document.getElementById("btn-fullscreen");
    if (btnFullscreen) {
      btnFullscreen.addEventListener("click", () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  function updateMuteButtonUI(isMuted) {
    const btnMute = document.getElementById("btn-mute");
    if (btnMute) {
      btnMute.innerHTML = isMuted ? "🔇" : "🔊";
      btnMute.title = isMuted ? "Unmute Audio (M)" : "Mute Audio (M)";
    }
  }

  // ─── Main Game Loop ──────────────────────────────────────────
  function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    if (timestamp - lastTime < 1000 / FPS - 1) return;
    lastTime = timestamp;

    if (!isPaused) {
      if (gameStarted && !gameOver) {
        birdUpdate();
        updatePipes();

        if (bird.flap > 4) {
          particles.push(new Particle(bird.x, bird.y + bird.size / 2, "rgba(255,255,255,0.7)", 0.5));
        }

        if (bird.y <= 0 || bird.y >= H - GROUND_H - bird.size) {
          if (bird.hasShield) {
            bird.hasShield = false;
            audio.playShatter();
            bird.vel = -5;
            shakeTicks = 10;
            popups.push(new PopupText(bird.x, bird.y - 15, "SHIELD SAVED YOU!", COL.cyanGlow, 26));
          } else {
            triggerDeath();
          }
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) particles.splice(i, 1);
      }

      for (let i = popups.length - 1; i >= 0; i--) {
        if (!popups[i].update()) popups.splice(i, 1);
      }

      if (shakeTicks > 0) shakeTicks--;
    }

    ctx.save();
    if (shakeTicks > 0) {
      const sx = randInt(-shakeTicks, shakeTicks);
      const sy = randInt(-shakeTicks, shakeTicks);
      ctx.translate(sx, sy);
    }

    drawBackground(ctx);
    pipes.forEach(p => drawPipe(p, ctx));
    collectibles.forEach(c => c.draw(ctx));
    drawBird(ctx);
    particles.forEach(p => p.draw(ctx));
    popups.forEach(pu => pu.draw(ctx));

    if (gameStarted && !gameOver) drawScoreHUD(ctx);
    if (!gameStarted && !gameOver) drawStartScreen(ctx);
    if (isPaused) drawPauseScreen(ctx);
    if (gameOver) drawGameOverScreen(ctx);

    ctx.restore();
  }

  // ─── Initialization ──────────────────────────────────────────
  function init() {
    setupCanvas();
    bestScore = parseInt(localStorage.getItem("fab_best") || "0", 10);

    clouds = [];
    for (let i = 0; i < 6; i++) {
      clouds.push({ x: rand(-50, W + 100), y: rand(20, 200), sp: rand(0.3, 0.8), sz: rand(0.7, 1.3) });
    }

    starsBg = [];
    for (let i = 0; i < 35; i++) {
      starsBg.push({ x: rand(0, W), y: rand(10, 320), sz: Math.random() > 0.7 ? 2 : 1, tw: rand(0, Math.PI * 2) });
    }

    mountains = [];
    for (let i = 0; i < 7; i++) {
      mountains.push([i * 90, H - GROUND_H - rand(40, 85)]);
    }

    resetGame();
    bindEvents();
    requestAnimationFrame(gameLoop);
  }

  window.FlappyAngryBird = { init, resetGame, cycleSkin };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
