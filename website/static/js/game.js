// ═══════════════════════════════════════════════════════════════
//  Flappy Angry Bird — Pure JavaScript Canvas Engine
//  Author: Yuvraj Chopra
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  // ── Constants ────────────────────────────────────────────────
  const W = 400, H = 600;
  const GROUND_H = 80;
  const PIPE_W = 52, PIPE_GAP = 138;
  const BIRD_SZ = 34;
  const FPS = 60;

  // Colors
  const COL = {
    skyTop: "#50b4dc", skyBot: "#a0dce8",
    pipeBody: "#22b14c", pipeDark: "#0e6423", pipeHl: "#64d278",
    birdRed: "#c81e1e", birdDark: "#a01010", birdBelly: "#e6c8a0",
    beak: "#ffb41e", beakDark: "#dc8c0a",
    groundGrn: "#64c850", groundBrn: "#d2b478", groundDk: "#a0783c",
    gold: "#ffd700", white: "#fff", black: "#000",
    medalGold: "#ffc832", medalSilver: "#c8c8d2", medalBronze: "#c88c50",
  };

  // ── State ────────────────────────────────────────────────────
  let canvas, ctx;
  let bird, pipes, particles, clouds;
  let score, bestScore, pipeTimer, groundOff;
  let gameStarted, gameOver, deathDone, shakeTicks;
  let skySurface;       // off-screen gradient
  let lastTime = 0;

  // ── Helpers ──────────────────────────────────────────────────
  function rand(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ── Sky gradient (drawn once) ────────────────────────────────
  function buildSky() {
    skySurface = document.createElement("canvas");
    skySurface.width = W;
    skySurface.height = H - GROUND_H;
    const g = skySurface.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, H - GROUND_H);
    grad.addColorStop(0, COL.skyTop);
    grad.addColorStop(1, COL.skyBot);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H - GROUND_H);
  }

  // ── Particle ─────────────────────────────────────────────────
  function spawnParticle(x, y, color) {
    const a = rand(0, Math.PI * 2), sp = rand(1.5, 5);
    particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
      life: randInt(14, 32), maxLife: 0, sz: rand(2, 5), color
    });
    particles[particles.length - 1].maxLife = particles[particles.length - 1].life;
  }

  // ── Cloud ────────────────────────────────────────────────────
  function makeCloud() {
    return { x: rand(W, W + 150), y: rand(20, 220), sp: rand(0.3, 1), sz: rand(0.6, 1.3) };
  }

  // ── Init / Reset ─────────────────────────────────────────────
  function resetGame() {
    bird = { x: 80, y: H / 2, vel: 0, grav: 0.45, jstr: -7.5, rot: 0, flap: 0 };
    pipes = [];
    particles = [];
    score = 0;
    pipeTimer = 0;
    groundOff = 0;
    gameStarted = false;
    gameOver = false;
    deathDone = false;
    shakeTicks = 0;
  }

  function init() {
    canvas = document.getElementById("game-canvas");
    ctx = canvas.getContext("2d");
    canvas.width = W;
    canvas.height = H;
    bestScore = parseInt(localStorage.getItem("fab_best") || "0", 10);
    clouds = [];
    for (let i = 0; i < 6; i++) {
      const c = makeCloud();
      c.x = rand(-50, W + 100);
      clouds.push(c);
    }
    buildSky();
    resetGame();
    bindInput();
    requestAnimationFrame(loop);
  }

  // ── Input ────────────────────────────────────────────────────
  function handleAction() {
    if (!gameStarted && !gameOver) { gameStarted = true; birdJump(); }
    else if (gameStarted && !gameOver) { birdJump(); }
    else if (gameOver) { resetGame(); }
  }
  function bindInput() {
    document.addEventListener("keydown", function (e) {
      if (e.code === "Space" || e.key === " ") { e.preventDefault(); handleAction(); }
      if ((e.code === "KeyR" || e.key === "r") && gameOver) resetGame();
    });
    canvas.addEventListener("mousedown", function (e) { e.preventDefault(); handleAction(); });
    canvas.addEventListener("touchstart", function (e) { e.preventDefault(); handleAction(); }, { passive: false });
  }

  // ── Bird ──────────────────────────────────────────────────────
  function birdJump() { bird.vel = bird.jstr; bird.rot = 30; bird.flap = 8; }

  function birdUpdate() {
    bird.vel += bird.grav;
    bird.y += bird.vel;
    bird.flap = Math.max(0, bird.flap - 1);
    if (bird.vel < -2) bird.rot = Math.min(30, bird.rot + 5);
    else if (bird.vel > 2) bird.rot = Math.max(-70, bird.rot - 3);
    else { const t = clamp(-bird.vel * 8, -20, 10); bird.rot += (t - bird.rot) * 0.1; }
    if (bird.y < 0) { bird.y = 0; bird.vel = 0; }
    else if (bird.y > H - GROUND_H - BIRD_SZ) bird.y = H - GROUND_H - BIRD_SZ;
  }

  function birdRect() {
    const m = BIRD_SZ * 0.22;
    return { x: bird.x + m, y: bird.y + m, w: BIRD_SZ - m * 2, h: BIRD_SZ - m * 2 };
  }

  function drawBird() {
    const cx = bird.x + BIRD_SZ / 2, cy = bird.y + BIRD_SZ / 2;
    const r = BIRD_SZ / 2, s = BIRD_SZ / 34;
    const si = v => v * s;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((-bird.rot * Math.PI) / 180);
    ctx.translate(-cx, -cy);

    // Tail
    ctx.fillStyle = COL.black;
    ctx.beginPath();
    ctx.moveTo(cx - r + si(3), cy);
    ctx.lineTo(cx - r - si(8), cy - si(7));
    ctx.lineTo(cx - r - si(8), cy + si(7));
    ctx.fill();

    // Body
    ctx.fillStyle = COL.birdRed;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COL.birdDark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

    // Belly
    ctx.fillStyle = COL.birdBelly;
    ctx.beginPath(); ctx.arc(cx, cy + si(6), Math.max(1, r - si(6)), 0, Math.PI * 2); ctx.fill();

    // Eyes
    const er = Math.max(2, si(6)), pr = Math.max(1, si(2.5));
    [[cx + si(1), cy - si(7)], [cx + si(11), cy - si(7)]].forEach(([ex, ey]) => {
      ctx.fillStyle = COL.white;
      ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = COL.black; ctx.lineWidth = Math.max(1, si(1.2));
      ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = COL.black;
      ctx.beginPath(); ctx.arc(ex + si(2), ey, pr, 0, Math.PI * 2); ctx.fill();
    });

    // Angry eyebrows
    ctx.strokeStyle = COL.black; ctx.lineWidth = Math.max(2, si(3)); ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - si(4), cy - si(14)); ctx.lineTo(cx + si(6), cy - si(5));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + si(6), cy - si(5)); ctx.lineTo(cx + si(16), cy - si(14));
    ctx.stroke();

    // Beak
    ctx.fillStyle = COL.beak;
    ctx.beginPath();
    ctx.moveTo(cx + si(6), cy + si(1));
    ctx.lineTo(cx + si(18), cy + si(6));
    ctx.lineTo(cx + si(6), cy + si(11));
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = COL.beakDark; ctx.lineWidth = Math.max(1, si(1.2));
    ctx.stroke();

    // Wing
    const wo = bird.flap > 0 ? si(4) : 0;
    ctx.fillStyle = COL.birdDark;
    ctx.beginPath();
    ctx.moveTo(cx - si(4), cy + si(2));
    ctx.lineTo(cx - si(12), cy - si(2) - wo);
    ctx.lineTo(cx - si(2), cy + si(8));
    ctx.closePath(); ctx.fill();

    ctx.restore();
  }

  // ── Pipes ─────────────────────────────────────────────────────
  function pipeSpeed() { return 3 + Math.min(score * 0.08, 2); }

  function spawnPipe() {
    const mn = 60, mx = H - GROUND_H - PIPE_GAP - 60;
    const h = randInt(mn, Math.max(mn, mx));
    pipes.push({ x: W + 20, h, scored: false });
  }

  function updatePipes() {
    const sp = pipeSpeed();
    pipeTimer++;
    if (pipeTimer > Math.max(60, 90 - score)) { spawnPipe(); pipeTimer = 0; }

    const br = birdRect();
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= sp;
      if (p.x + PIPE_W < -10) { pipes.splice(i, 1); continue; }
      if (!p.scored && p.x + PIPE_W < bird.x) {
        p.scored = true; score++;
        for (let j = 0; j < 8; j++) spawnParticle(W / 2, 65, COL.gold);
      }
      // Collision
      const topR = { x: p.x, y: 0, w: PIPE_W, h: p.h };
      const botR = { x: p.x, y: p.h + PIPE_GAP, w: PIPE_W, h: H - p.h - PIPE_GAP - GROUND_H };
      if (rectsOverlap(br, topR) || rectsOverlap(br, botR)) gameOver = true;
    }
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function drawPipe(p) {
    const ch = 22, co = 5;
    const ix = Math.round(p.x);

    // Top pipe body
    ctx.fillStyle = COL.pipeBody;
    ctx.fillRect(ix, 0, PIPE_W, p.h);
    ctx.strokeStyle = COL.pipeDark; ctx.lineWidth = 2;
    ctx.strokeRect(ix, 0, PIPE_W, p.h);
    // Highlight
    ctx.strokeStyle = COL.pipeHl; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ix + 8, 0); ctx.lineTo(ix + 8, p.h - ch); ctx.stroke();
    // Top cap
    const capX = ix - co, capW = PIPE_W + co * 2;
    roundRect(capX, p.h - ch, capW, ch, 3, COL.pipeBody, COL.pipeDark);

    // Bottom pipe body
    const by = p.h + PIPE_GAP, bh = H - by - GROUND_H;
    ctx.fillStyle = COL.pipeBody;
    ctx.fillRect(ix, by, PIPE_W, bh);
    ctx.strokeStyle = COL.pipeDark; ctx.lineWidth = 2;
    ctx.strokeRect(ix, by, PIPE_W, bh);
    // Highlight
    ctx.strokeStyle = COL.pipeHl; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ix + 8, by + ch); ctx.lineTo(ix + 8, H - GROUND_H); ctx.stroke();
    // Bottom cap
    roundRect(capX, by, capW, ch, 3, COL.pipeBody, COL.pipeDark);
  }

  function roundRect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
  }

  // ── Background & Ground ──────────────────────────────────────
  function drawBackground() {
    ctx.drawImage(skySurface, 0, 0);

    // Clouds
    clouds.forEach(c => {
      c.x -= c.sp;
      if (c.x < -120) { c.x = W + rand(50, 150); c.y = rand(20, 220); c.sz = rand(0.6, 1.3); }
      const sz = c.sz, cx = c.x, cy = c.y;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath(); ctx.arc(cx, cy, 25 * sz, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx - 18 * sz, cy + 8 * sz, 20 * sz, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 18 * sz, cy + 8 * sz, 20 * sz, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 8 * sz, cy - 6 * sz, 16 * sz, 0, Math.PI * 2); ctx.fill();
    });

    // Ground
    const gy = H - GROUND_H;
    ctx.fillStyle = COL.groundBrn;
    ctx.fillRect(0, gy, W, GROUND_H);
    ctx.fillStyle = COL.groundGrn;
    ctx.fillRect(0, gy, W, 12);
    ctx.strokeStyle = "#46a032"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, gy + 12); ctx.lineTo(W, gy + 12); ctx.stroke();

    // Ground lines
    if (gameStarted && !gameOver) groundOff = (groundOff + pipeSpeed()) % 24;
    ctx.strokeStyle = COL.groundDk; ctx.lineWidth = 1;
    for (let i = -24 + Math.floor(groundOff); i < W + 24; i += 24) {
      ctx.beginPath(); ctx.moveTo(i, gy + 14); ctx.lineTo(i - 12, gy + GROUND_H); ctx.stroke();
    }
  }

  // ── Particles ────────────────────────────────────────────────
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.vy += 0.15; p.y += p.vy; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function drawParticles() {
    particles.forEach(p => {
      const a = p.life / p.maxLife;
      const r = Math.max(1, p.sz * a);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // ── UI Screens ───────────────────────────────────────────────
  function drawScore() {
    ctx.font = "bold 56px 'Outfit', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillText(score, W / 2 + 2, 62);
    ctx.fillStyle = COL.white;
    ctx.fillText(score, W / 2, 60);
  }

  function drawStartScreen() {
    const t = performance.now();
    const ty = H / 2 - 100 + Math.sin(t / 500) * 6;

    ctx.textAlign = "center";
    
    // Split title into two lines to fit width
    ctx.font = "900 42px 'Outfit', Arial, sans-serif";
    
    // Shadow
    ctx.fillStyle = "rgba(120,0,0,0.3)";
    ctx.fillText("FLAPPY", W / 2 + 2, ty + 2);
    ctx.fillText("ANGRY BIRD", W / 2 + 2, ty + 46 + 2);
    
    // Text
    ctx.fillStyle = COL.birdRed;
    ctx.fillText("FLAPPY", W / 2, ty);
    ctx.fillText("ANGRY BIRD", W / 2, ty + 46);

    // Pulse hint
    const pulse = 0.5 + 0.5 * Math.sin(t / 300);
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.font = "600 24px 'Outfit', Arial, sans-serif";
    ctx.fillStyle = COL.white;
    ctx.fillText("Tap or Press SPACE", W / 2, H / 2 + 80);
    ctx.globalAlpha = 1;

    if (bestScore > 0) {
      ctx.font = "500 22px 'Outfit', Arial, sans-serif";
      ctx.fillStyle = COL.gold;
      ctx.fillText("Best: " + bestScore, W / 2, H / 2 + 120);
    }
  }

  function drawGameOver() {
    // Dim overlay
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, W, H);

    // Panel
    const pw = 280, ph = 240;
    const px = (W - pw) / 2, py = (H - ph) / 2 - 20;

    roundRect(px, py, pw, ph, 12, "#2d3748", COL.gold);

    // Title
    ctx.font = "800 38px 'Outfit', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#dc3c3c";
    ctx.fillText("GAME OVER", W / 2, py + 42);

    // Divider
    ctx.strokeStyle = "#4a5568"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px + 20, py + 58); ctx.lineTo(px + pw - 20, py + 58); ctx.stroke();

    // Score
    ctx.font = "600 28px 'Outfit', Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = COL.white;
    ctx.fillText("Score:  " + score, px + 28, py + 92);

    // Best
    const isNew = score > 0 && score >= bestScore;
    ctx.fillStyle = isNew ? COL.gold : "#b4b4be";
    ctx.fillText("Best:   " + bestScore, px + 28, py + 128);

    if (isNew) {
      ctx.font = "800 18px 'Outfit', Arial, sans-serif";
      ctx.fillStyle = COL.gold;
      ctx.textAlign = "right";
      ctx.fillText("NEW!", px + pw - 24, py + 128);
    }

    // Medal
    let medalCol = null;
    if (score >= 30) medalCol = COL.medalGold;
    else if (score >= 15) medalCol = COL.medalSilver;
    else if (score >= 5) medalCol = COL.medalBronze;
    if (medalCol) {
      ctx.fillStyle = medalCol;
      ctx.beginPath(); ctx.arc(px + pw - 50, py + 100, 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = COL.black; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px + pw - 50, py + 100, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.font = "bold 18px Arial"; ctx.textAlign = "center"; ctx.fillStyle = COL.black;
      ctx.fillText("★", px + pw - 50, py + 106);
    }

    // Divider
    ctx.strokeStyle = "#4a5568"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px + 20, py + 155); ctx.lineTo(px + pw - 20, py + 155); ctx.stroke();

    // Restart hint
    const t = performance.now();
    const pulse = 0.5 + 0.5 * Math.sin(t / 350);
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.font = "600 26px 'Outfit', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#c8dcff";
    ctx.fillText("Press R or Tap", W / 2, py + ph - 32);
    ctx.globalAlpha = 1;
  }

  // ── Game Loop ────────────────────────────────────────────────
  function loop(ts) {
    requestAnimationFrame(loop);

    // Cap delta to ~60fps
    if (ts - lastTime < 1000 / FPS - 1) return;
    lastTime = ts;

    // ─ Update ─
    if (gameStarted && !gameOver) {
      birdUpdate();
      updatePipes();
      if (bird.y <= 0 || bird.y >= H - GROUND_H - BIRD_SZ) gameOver = true;
    }

    if (gameOver && !deathDone) {
      deathDone = true;
      shakeTicks = 12;
      if (score > bestScore) { bestScore = score; localStorage.setItem("fab_best", bestScore); }
      for (let i = 0; i < 15; i++) spawnParticle(bird.x + BIRD_SZ / 2, bird.y + BIRD_SZ / 2, COL.birdRed);
    }

    updateParticles();
    if (shakeTicks > 0) shakeTicks--;

    // ─ Draw ─
    ctx.save();
    if (shakeTicks > 0) {
      const sx = randInt(-shakeTicks, shakeTicks), sy = randInt(-shakeTicks, shakeTicks);
      ctx.translate(sx, sy);
    }

    drawBackground();
    pipes.forEach(drawPipe);
    drawBird();
    drawParticles();

    if (gameStarted && !gameOver) drawScore();
    if (!gameStarted && !gameOver) drawStartScreen();
    if (gameOver) drawGameOver();

    ctx.restore();
  }

  // ── Boot ─────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
