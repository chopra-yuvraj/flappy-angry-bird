// ═══════════════════════════════════════════════════════════════
//  Flappy Angry Bird — Next-Gen HTML5 Canvas & Web Audio Engine
//  Original Python/Pygame Architecture by Yuvraj Chopra
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

  // ─── Color Palette ───────────────────────────────────────────
  const COL = {
    skyTop: "#50B4DC",
    skyBot: "#A0DCE8",
    pipeBody: "#22B14C",
    pipeDark: "#0E6423",
    pipeHl: "#64D278",
    birdRed: "#C81E1E",
    birdDark: "#A01010",
    birdBelly: "#E6C8A0",
    beak: "#FFB41E",
    beakDark: "#DC8C0A",
    groundGrn: "#64C850",
    groundBrn: "#D2B478",
    groundDk: "#A0783C",
    gold: "#FFD700",
    goldBright: "#FFE07D",
    white: "#FFFFFF",
    black: "#000000",
    medalGold: "#FFC832",
    medalSilver: "#C8C8D2",
    medalBronze: "#C88C50",
    medalPlat: "#00E5FF",
    panelBg: "rgba(30, 41, 59, 0.95)",
    panelBorder: "#FFD700"
  };

  // ─── Web Audio API Sound Synthesizer (Zero Assets Dependency) ─
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem("fab_muted") === "true";
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
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
        osc.frequency.exponentialRampToValueAtTime(840, t + 0.12);
        gain.gain.setValueAtTime(0.28, t);
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
        osc.frequency.setValueAtTime(987.77, t); // B5
        osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
      } catch (e) {}
    }

    playHit() {
      if (this.muted || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        // White noise burst for impact
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.linearRampToValueAtTime(100, t + 0.15);

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
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.45);
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
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const start = t + idx * 0.08;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.25, start);
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
  let bird, pipes, particles, clouds;
  let score = 0, bestScore = 0;
  let pipeTimer = 0, groundOff = 0;
  let gameStarted = false, gameOver = false, isPaused = false;
  let deathDone = false, shakeTicks = 0;
  let skyCanvas = null;
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

    buildSkyGradient();
  }

  function buildSkyGradient() {
    skyCanvas = document.createElement("canvas");
    skyCanvas.width = W;
    skyCanvas.height = H - GROUND_H;
    const g = skyCanvas.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, H - GROUND_H);
    grad.addColorStop(0, COL.skyTop);
    grad.addColorStop(1, COL.skyBot);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H - GROUND_H);
  }

  // ─── Particle System ─────────────────────────────────────────
  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      const a = rand(0, Math.PI * 2);
      const sp = rand(1.5, 5.5);
      this.vx = Math.cos(a) * sp;
      this.vy = Math.sin(a) * sp - 2;
      this.life = randInt(16, 36);
      this.maxLife = this.life;
      this.sz = rand(2, 5.5);
      this.color = color || (Math.random() > 0.5 ? COL.gold : COL.white);
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
      c.beginPath();
      c.arc(this.x, this.y, r, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }

  // ─── Cloud Generator ─────────────────────────────────────────
  function createCloud(startX = null) {
    return {
      x: startX !== null ? startX : rand(W, W + 160),
      y: rand(20, 210),
      sp: rand(0.3, 0.9),
      sz: rand(0.7, 1.3)
    };
  }

  // ─── Game Entities & Logic ───────────────────────────────────
  function resetGame() {
    bird = {
      x: 80,
      y: H / 2 - 20,
      vel: 0,
      grav: 0.45,
      jstr: -7.5,
      rot: 0,
      flap: 0,
      size: BIRD_SZ
    };
    pipes = [];
    particles = [];
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
    return {
      x: bird.x + m,
      y: bird.y + m,
      w: bird.size - m * 2,
      h: bird.size - m * 2
    };
  }

  function drawBird(c) {
    const cx = bird.x + bird.size / 2;
    const cy = bird.y + bird.size / 2;
    const r = bird.size / 2;
    const s = bird.size / 34.0;
    const si = v => v * s;

    c.save();
    c.translate(cx, cy);
    c.rotate((-bird.rot * Math.PI) / 180);
    c.translate(-cx, -cy);

    // 1. Black Tail Feather
    c.fillStyle = COL.black;
    c.beginPath();
    c.moveTo(cx - r + si(3), cy);
    c.lineTo(cx - r - si(8), cy - si(7));
    c.lineTo(cx - r - si(8), cy + si(7));
    c.closePath();
    c.fill();

    // 2. Red Body Circle & Dark Outline
    c.fillStyle = COL.birdRed;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = COL.birdDark;
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.stroke();

    // 3. Beige Belly
    c.fillStyle = COL.birdBelly;
    c.beginPath();
    c.arc(cx, cy + si(6), Math.max(1, r - si(6)), 0, Math.PI * 2);
    c.fill();

    // 4. Expressive Eyes
    const er = Math.max(2, si(6));
    const pr = Math.max(1, si(2.2));
    const eyes = [
      [cx + si(1), cy - si(7)],
      [cx + si(11), cy - si(7)]
    ];

    eyes.forEach(([ex, ey]) => {
      // White eye
      c.fillStyle = COL.white;
      c.beginPath();
      c.arc(ex, ey, er, 0, Math.PI * 2);
      c.fill();

      // Black border
      c.strokeStyle = COL.black;
      c.lineWidth = Math.max(1, si(1.2));
      c.beginPath();
      c.arc(ex, ey, er, 0, Math.PI * 2);
      c.stroke();

      // Dark pupil
      c.fillStyle = COL.black;
      c.beginPath();
      c.arc(ex + si(2), ey, pr, 0, Math.PI * 2);
      c.fill();
    });

    // 5. Angry Eyebrows
    c.strokeStyle = COL.black;
    c.lineWidth = Math.max(2.2, si(3.2));
    c.lineCap = "round";
    const midEyebrow = [cx + si(6), cy - si(4)];

    c.beginPath();
    c.moveTo(cx - si(4), cy - si(13));
    c.lineTo(midEyebrow[0], midEyebrow[1]);
    c.stroke();

    c.beginPath();
    c.moveTo(midEyebrow[0], midEyebrow[1]);
    c.lineTo(cx + si(16), cy - si(13));
    c.stroke();

    // 6. Orange Beak
    c.fillStyle = COL.beak;
    c.beginPath();
    c.moveTo(cx + si(6), cy + si(1));
    c.lineTo(cx + si(18), cy + si(6));
    c.lineTo(cx + si(6), cy + si(11));
    c.closePath();
    c.fill();

    c.strokeStyle = COL.beakDark;
    c.lineWidth = Math.max(1, si(1.2));
    c.stroke();

    // 7. Dynamic Flapping Wing
    const wingOffset = bird.flap > 0 ? si(4) : 0;
    c.fillStyle = COL.birdDark;
    c.beginPath();
    c.moveTo(cx - si(4), cy + si(2));
    c.lineTo(cx - si(12), cy - si(2) - wingOffset);
    c.lineTo(cx - si(2), cy + si(8));
    c.closePath();
    c.fill();

    c.restore();
  }

  // ─── Pipes ───────────────────────────────────────────────────
  function getPipeSpeed() {
    return 3.0 + Math.min(score * 0.08, 2.0);
  }

  function spawnPipe() {
    const minH = 60;
    const maxH = H - GROUND_H - PIPE_GAP - 60;
    const h = randInt(minH, Math.max(minH, maxH));
    pipes.push({
      x: W + 20,
      h: h,
      scored: false
    });
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

    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= sp;

      // Clean off-screen pipes
      if (p.x + PIPE_W < -20) {
        pipes.splice(i, 1);
        continue;
      }

      // Check scoring
      if (!p.scored && p.x + PIPE_W < bird.x) {
        p.scored = true;
        score++;
        audio.playPoint();
        for (let s = 0; s < 8; s++) {
          particles.push(new Particle(W / 2, 70, COL.goldBright));
        }
      }

      // Check pipe collisions
      const topRect = { x: p.x, y: 0, w: PIPE_W, h: p.h };
      const botRect = {
        x: p.x,
        y: p.h + PIPE_GAP,
        w: PIPE_W,
        h: H - (p.h + PIPE_GAP) - GROUND_H
      };

      if (rectsIntersect(br, topRect) || rectsIntersect(br, botRect)) {
        triggerDeath();
      }
    }
  }

  function rectsIntersect(r1, r2) {
    return (
      r1.x < r2.x + r2.w &&
      r1.x + r1.w > r2.x &&
      r1.y < r2.y + r2.h &&
      r1.y + r1.h > r2.y
    );
  }

  function drawPipe(p, c) {
    const ch = 22, co = 5;
    const ix = Math.round(p.x);

    // 1. Top Pipe Body & Highlight
    c.fillStyle = COL.pipeBody;
    c.fillRect(ix, 0, PIPE_W, p.h);
    c.strokeStyle = COL.pipeDark;
    c.lineWidth = 2;
    c.strokeRect(ix, 0, PIPE_W, p.h);

    c.strokeStyle = COL.pipeHl;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(ix + 8, 0);
    c.lineTo(ix + 8, Math.max(0, p.h - ch));
    c.stroke();

    // Top Pipe Cap
    drawRoundedRect(c, ix - co, p.h - ch, PIPE_W + co * 2, ch, 3, COL.pipeBody, COL.pipeDark);

    // 2. Bottom Pipe Body & Highlight
    const botY = p.h + PIPE_GAP;
    const botH = H - botY - GROUND_H;

    c.fillStyle = COL.pipeBody;
    c.fillRect(ix, botY, PIPE_W, botH);
    c.strokeStyle = COL.pipeDark;
    c.lineWidth = 2;
    c.strokeRect(ix, botY, PIPE_W, botH);

    c.strokeStyle = COL.pipeHl;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(ix + 8, botY + ch);
    c.lineTo(ix + 8, H - GROUND_H);
    c.stroke();

    // Bottom Pipe Cap
    drawRoundedRect(c, ix - co, botY, PIPE_W + co * 2, ch, 3, COL.pipeBody, COL.pipeDark);
  }

  function drawRoundedRect(c, x, y, w, h, r, fill, stroke) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();

    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 2;
      c.stroke();
    }
  }

  // ─── Background & Environment ────────────────────────────────
  function drawBackground(c) {
    if (skyCanvas) {
      c.drawImage(skyCanvas, 0, 0);
    }

    // Clouds
    clouds.forEach(cloud => {
      if (!isPaused) cloud.x -= cloud.sp;
      if (cloud.x < -130) {
        cloud.x = W + rand(40, 140);
        cloud.y = rand(20, 210);
      }
      const cx = cloud.x, cy = cloud.y, sz = cloud.sz;
      c.fillStyle = "rgba(255, 255, 255, 0.88)";
      c.beginPath();
      c.arc(cx, cy, 25 * sz, 0, Math.PI * 2);
      c.arc(cx - 18 * sz, cy + 8 * sz, 20 * sz, 0, Math.PI * 2);
      c.arc(cx + 18 * sz, cy + 8 * sz, 20 * sz, 0, Math.PI * 2);
      c.arc(cx + 8 * sz, cy - 6 * sz, 16 * sz, 0, Math.PI * 2);
      c.fill();
    });

    // Ground Strip
    const gy = H - GROUND_H;
    c.fillStyle = COL.groundBrn;
    c.fillRect(0, gy, W, GROUND_H);

    // Green Grass Top
    c.fillStyle = COL.groundGrn;
    c.fillRect(0, gy, W, 12);
    c.strokeStyle = "#46A032";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, gy + 12);
    c.lineTo(W, gy + 12);
    c.stroke();

    // Moving Ground Stripes
    if (gameStarted && !gameOver && !isPaused) {
      groundOff = (groundOff + getPipeSpeed()) % 24;
    }
    const off = Math.floor(groundOff);
    c.strokeStyle = COL.groundDk;
    c.lineWidth = 1;
    for (let i = -24 + off; i < W + 24; i += 24) {
      c.beginPath();
      c.moveTo(i, gy + 14);
      c.lineTo(i - 12, gy + GROUND_H);
      c.stroke();
    }
  }

  // ─── Death Trigger & Particles ───────────────────────────────
  function triggerDeath() {
    if (gameOver) return;
    gameOver = true;
    shakeTicks = 12;
    audio.playHit();
    setTimeout(() => audio.playDie(), 120);

    const bx = bird.x + bird.size / 2;
    const by = bird.y + bird.size / 2;

    for (let i = 0; i < 20; i++) {
      particles.push(new Particle(bx, by, COL.birdRed));
    }

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
    c.fillStyle = "rgba(0, 0, 0, 0.35)";
    c.fillText(score, W / 2 + 2, 62);
    c.fillStyle = COL.white;
    c.fillText(score, W / 2, 60);
  }

  function drawStartScreen(c) {
    const t = performance.now();
    const bob = Math.sin(t / 400) * 8;
    const titleY = H / 2 - 110 + bob;

    c.textAlign = "center";

    // Glowing Title
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
    c.fillText("TAP or Press SPACE to Flap", W / 2, H / 2 + 75);
    c.globalAlpha = 1;

    // Best Score Badge
    if (bestScore > 0) {
      c.font = "600 20px 'Outfit', sans-serif";
      c.fillStyle = COL.gold;
      c.fillText(`🏆 High Score: ${bestScore}`, W / 2, H / 2 + 115);
    }

    // Watermark
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
    // Backdrop Dim
    c.fillStyle = "rgba(10, 15, 26, 0.5)";
    c.fillRect(0, 0, W, H);

    // Modal Panel
    const pw = 300, ph = 260;
    const px = (W - pw) / 2;
    const py = (H - ph) / 2 - 15;

    drawRoundedRect(c, px, py, pw, ph, 18, COL.panelBg, COL.panelBorder);

    // Title
    c.font = "900 36px 'Outfit', sans-serif";
    c.textAlign = "center";
    c.fillStyle = "#FF4545";
    c.fillText("GAME OVER", W / 2, py + 46);

    // Separator line
    c.strokeStyle = "rgba(255, 255, 255, 0.15)";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(px + 20, py + 64);
    c.lineTo(px + pw - 20, py + 64);
    c.stroke();

    // Score & Best text
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

    // Medal
    let medalColor = null;
    let medalIcon = "★";
    if (score >= 50) {
      medalColor = COL.medalPlat;
      medalIcon = "👑";
    } else if (score >= 30) {
      medalColor = COL.medalGold;
    } else if (score >= 15) {
      medalColor = COL.medalSilver;
    } else if (score >= 5) {
      medalColor = COL.medalBronze;
    }

    if (medalColor) {
      const mx = px + pw - 55;
      const my = py + 105;
      c.fillStyle = medalColor;
      c.beginPath();
      c.arc(mx, my, 20, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = COL.black;
      c.lineWidth = 2;
      c.stroke();

      c.font = "bold 16px Arial";
      c.textAlign = "center";
      c.fillStyle = COL.black;
      c.fillText(medalIcon, mx, my + 6);
    }

    // Bottom Separator
    c.strokeStyle = "rgba(255, 255, 255, 0.15)";
    c.beginPath();
    c.moveTo(px + 20, py + 175);
    c.lineTo(px + pw - 20, py + 175);
    c.stroke();

    // Pulse Restart
    const t = performance.now();
    const pulse = 0.5 + 0.5 * Math.sin(t / 300);
    c.globalAlpha = 0.6 + pulse * 0.4;
    c.font = "700 22px 'Outfit', sans-serif";
    c.textAlign = "center";
    c.fillStyle = "#A8C7FA";
    c.fillText("Press R or Tap to Retry", W / 2, py + ph - 30);
    c.globalAlpha = 1;
  }

  // ─── Input Handling ──────────────────────────────────────────
  function handlePrimaryAction() {
    audio.init();

    if (isPaused) {
      isPaused = false;
      return;
    }

    if (!gameStarted && !gameOver) {
      gameStarted = true;
      birdJump();
    } else if (gameStarted && !gameOver) {
      birdJump();
    } else if (gameOver) {
      resetGame();
    }
  }

  function togglePause() {
    if (gameStarted && !gameOver) {
      isPaused = !isPaused;
    }
  }

  function bindEvents() {
    window.addEventListener("keydown", function (e) {
      if (e.code === "Space" || e.key === " " || e.code === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        handlePrimaryAction();
      } else if (e.code === "KeyR" || e.key === "r" || e.key === "R") {
        if (gameOver) resetGame();
      } else if (e.code === "KeyP" || e.key === "p" || e.key === "P" || e.code === "Escape") {
        togglePause();
      } else if (e.code === "KeyM" || e.key === "m" || e.key === "M") {
        const isMuted = audio.toggleMute();
        updateMuteButtonUI(isMuted);
      }
    });

    if (canvas) {
      canvas.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        handlePrimaryAction();
      });

      canvas.addEventListener("touchstart", function (e) {
        e.preventDefault();
        handlePrimaryAction();
      }, { passive: false });
    }

    // Attach External Button Listeners
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
        togglePause();
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
      btnMute.setAttribute("aria-label", isMuted ? "Unmute Audio" : "Mute Audio");
      btnMute.title = isMuted ? "Unmute Audio (M)" : "Mute Audio (M)";
    }
  }

  // ─── Main Animation Loop ─────────────────────────────────────
  function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    if (timestamp - lastTime < 1000 / FPS - 1) return;
    lastTime = timestamp;

    if (!isPaused) {
      // 1. Update Game States
      if (gameStarted && !gameOver) {
        birdUpdate();
        updatePipes();

        // Floor / Ceiling Collision Check
        if (bird.y <= 0 || bird.y >= H - GROUND_H - bird.size) {
          triggerDeath();
        }
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
          particles.splice(i, 1);
        }
      }

      if (shakeTicks > 0) shakeTicks--;
    }

    // 2. Render Frame
    ctx.save();

    // Camera Shake
    if (shakeTicks > 0) {
      const sx = randInt(-shakeTicks, shakeTicks);
      const sy = randInt(-shakeTicks, shakeTicks);
      ctx.translate(sx, sy);
    }

    drawBackground(ctx);
    pipes.forEach(p => drawPipe(p, ctx));
    drawBird(ctx);
    particles.forEach(p => p.draw(ctx));

    if (gameStarted && !gameOver) drawScoreHUD(ctx);
    if (!gameStarted && !gameOver) drawStartScreen(ctx);
    if (isPaused) drawPauseScreen(ctx);
    if (gameOver) drawGameOverScreen(ctx);

    ctx.restore();
  }

  // ─── Engine Initialization ───────────────────────────────────
  function init() {
    setupCanvas();
    bestScore = parseInt(localStorage.getItem("fab_best") || "0", 10);

    clouds = [];
    for (let i = 0; i < 6; i++) {
      clouds.push(createCloud(rand(-60, W + 80)));
    }

    resetGame();
    bindEvents();
    requestAnimationFrame(gameLoop);
  }

  // Global Engine Export
  window.FlappyAngryBird = {
    init,
    resetGame,
    togglePause,
    toggleMute: () => audio.toggleMute()
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
