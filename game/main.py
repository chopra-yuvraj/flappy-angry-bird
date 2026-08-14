import pygame
import random
import sys
import asyncio
import math
import numpy as np

# ═══════════════════════════════════════════════════════════════
#  Flappy Angry Bird — Ultimate Edition (Python / Pygame)
#  Engine Architecture by Yuvraj Chopra
# ═══════════════════════════════════════════════════════════════

SCREEN_WIDTH = 400
SCREEN_HEIGHT = 600
GROUND_HEIGHT = 90
PIPE_WIDTH = 52
PIPE_GAP = 140
BIRD_SIZE = 34
FPS = 60

# Palette
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GOLD = (255, 215, 0)
GOLD_BRIGHT = (255, 230, 110)
CYAN_GLOW = (0, 225, 255)
SHIELD_BLUE = (30, 144, 255)

# Skins
SKIN_RED = 0
SKIN_CHUCK = 1
SKIN_BOMB = 2
SKIN_NAMES = ["RED", "CHUCK", "BOMB"]


# ── Procedural Sound Synthesizer (Zero External Assets) ─────────
class SoundSynth:
    def __init__(self):
        self.enabled = False
        self.muted = False
        try:
            pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)
            self.enabled = True
        except Exception:
            self.enabled = False

    def _generate_tone(self, start_freq, end_freq, duration, wave_type="sine", vol=0.3):
        if not self.enabled:
            return None
        sr = 44100
        n_samples = int(sr * duration)
        t = np.linspace(0, duration, n_samples, endpoint=False)
        freqs = np.linspace(start_freq, end_freq, n_samples)
        phase = 2 * np.pi * np.cumsum(freqs) / sr

        if wave_type == "sine":
            waveform = np.sin(phase)
        elif wave_type == "square":
            waveform = np.sign(np.sin(phase))
        elif wave_type == "sawtooth":
            waveform = 2.0 * (phase / (2 * np.pi) - np.floor(phase / (2 * np.pi) + 0.5))
        elif wave_type == "noise":
            waveform = np.random.uniform(-1, 1, n_samples)
        else:
            waveform = np.sin(phase)

        envelope = np.exp(-3.5 * t / duration)
        waveform = waveform * envelope * vol
        waveform = np.clip(waveform, -1.0, 1.0)
        audio = (waveform * 32767).astype(np.int16)
        stereo = np.column_stack((audio, audio))
        return pygame.sndarray.make_sound(stereo)

    def play(self, snd):
        if self.enabled and not self.muted and snd:
            try:
                snd.play()
            except Exception:
                pass


# ── Particle Engine ─────────────────────────────────────────────
class Particle:
    def __init__(self, x, y, color=None, speed_mult=1.0, shape="circle"):
        self.x, self.y = x, y
        a = random.uniform(0, 6.283)
        sp = random.uniform(1.5, 5.0) * speed_mult
        self.vx = math.cos(a) * sp
        self.vy = math.sin(a) * sp - 1.5
        self.life = random.randint(16, 35)
        self.ml = self.life
        self.sz = random.randint(2, 5)
        self.color = color or random.choice([GOLD, WHITE, (255, 100, 60)])
        self.shape = shape

    def update(self):
        self.x += self.vx
        self.vy += 0.15
        self.y += self.vy
        self.life -= 1
        return self.life > 0

    def draw(self, scr):
        r = max(1, int(self.sz * self.life / self.ml))
        if self.shape == "star":
            pts = [
                (int(self.x), int(self.y - r)),
                (int(self.x + r * 0.4), int(self.y - r * 0.3)),
                (int(self.x + r), int(self.y)),
                (int(self.x + r * 0.4), int(self.y + r * 0.3)),
                (int(self.x), int(self.y + r)),
                (int(self.x - r * 0.4), int(self.y + r * 0.3)),
                (int(self.x - r), int(self.y)),
                (int(self.x - r * 0.4), int(self.y - r * 0.3))
            ]
            if len(pts) >= 3:
                pygame.draw.polygon(scr, self.color, pts)
        else:
            pygame.draw.circle(scr, self.color, (int(self.x), int(self.y)), r)


# ── Floating Popups (+1, +3 ⭐, SHIELD) ─────────────────────────
class PopupText:
    def __init__(self, x, y, text, color=GOLD, size=24):
        self.x = x
        self.y = y
        self.text = text
        self.color = color
        self.font = pygame.font.Font(None, size)
        self.life = 45
        self.max_life = 45

    def update(self):
        self.y -= 1.2
        self.life -= 1
        return self.life > 0

    def draw(self, scr):
        alpha = int(255 * (self.life / self.max_life))
        surf = self.font.render(self.text, True, self.color)
        shadow = self.font.render(self.text, True, (0, 0, 0))
        surf.set_alpha(alpha)
        shadow.set_alpha(alpha)
        rect = surf.get_rect(center=(int(self.x), int(self.y)))
        scr.blit(shadow, (rect.x + 1, rect.y + 1))
        scr.blit(surf, rect)


# ── Collectibles (Star & Shield) ────────────────────────────────
class Collectible:
    def __init__(self, x, y, ctype="star"):
        self.x = x
        self.y = y
        self.type = ctype  # 'star' or 'shield'
        self.size = 20
        self.timer = random.uniform(0, 6.28)
        self.collected = False

    def update(self, sp):
        self.x -= sp
        self.timer += 0.08

    def get_rect(self):
        return pygame.Rect(int(self.x - 12), int(self.y - 12), 24, 24)

    def draw(self, scr):
        bob = math.sin(self.timer) * 4
        cy = int(self.y + bob)
        cx = int(self.x)

        if self.type == "star":
            # Pulsing golden star
            r = 11 + int(math.sin(self.timer * 2) * 2)
            pts = []
            for i in range(10):
                angle = i * (math.pi / 5) - math.pi / 2
                rad = r if i % 2 == 0 else r * 0.45
                pts.append((cx + math.cos(angle) * rad, cy + math.sin(angle) * rad))
            pygame.draw.polygon(scr, GOLD_BRIGHT, pts)
            pygame.draw.polygon(scr, (180, 120, 0), pts, 1)
        elif self.type == "shield":
            # Glowing cyan energy bubble
            r = 13 + int(math.sin(self.timer * 2) * 2)
            s = pygame.Surface((r * 2 + 4, r * 2 + 4), pygame.SRCALPHA)
            pygame.draw.circle(s, (0, 220, 255, 90), (r + 2, r + 2), r)
            pygame.draw.circle(s, CYAN_GLOW, (r + 2, r + 2), r, 2)
            pygame.draw.circle(s, WHITE, (r - 2, r - 3), max(2, r // 4))
            scr.blit(s, (cx - r - 2, cy - r - 2))


# ── Bird Character & Skin Engine ────────────────────────────────
class Bird:
    def __init__(self, skin=SKIN_RED):
        self.x = 80
        self.y = SCREEN_HEIGHT // 2 - 20
        self.vel = 0
        self.grav = 0.45
        self.jstr = -7.5
        self.size = BIRD_SIZE
        self.rot = 0
        self.flap = 0
        self.skin = skin
        self.has_shield = False
        self.shield_pulse = 0

    def jump(self):
        self.vel = self.jstr
        self.rot = 30
        self.flap = 8

    def update(self):
        self.vel += self.grav
        self.y += self.vel
        self.flap = max(0, self.flap - 1)
        self.shield_pulse += 0.1

        if self.vel < -2:
            self.rot = min(30, self.rot + 5)
        elif self.vel > 2:
            self.rot = max(-70, self.rot - 3)
        else:
            t = max(-20, min(10, -self.vel * 8))
            self.rot += (t - self.rot) * 0.1

        if self.y < 0:
            self.y = 0
            self.vel = 0
        elif self.y > SCREEN_HEIGHT - GROUND_HEIGHT - self.size:
            self.y = SCREEN_HEIGHT - GROUND_HEIGHT - self.size

    def get_rect(self):
        m = self.size * 0.2
        return pygame.Rect(self.x + m, self.y + m, self.size - m * 2, self.size - m * 2)

    def draw(self, scr):
        cx = int(self.x + self.size // 2)
        cy = int(self.y + self.size // 2)
        r = self.size // 2
        s = self.size / 34.0
        si = lambda v: int(v * s)

        # ── Shield Aura
        if self.has_shield:
            pulse = int(math.sin(self.shield_pulse) * 3)
            sr = r + 9 + pulse
            aura = pygame.Surface((sr * 2 + 4, sr * 2 + 4), pygame.SRCALPHA)
            pygame.draw.circle(aura, (0, 220, 255, 60), (sr + 2, sr + 2), sr)
            pygame.draw.circle(aura, CYAN_GLOW, (sr + 2, sr + 2), sr, 2)
            pygame.draw.circle(aura, WHITE, (sr + 2, sr + 2), max(1, sr - 3), 1)
            scr.blit(aura, (cx - sr - 2, cy - sr - 2))

        if self.skin == SKIN_RED:
            # 🔴 RED (Classic)
            pygame.draw.polygon(scr, BLACK, [
                (cx - r + si(3), cy),
                (cx - r - si(8), cy - si(7)),
                (cx - r - si(8), cy + si(7))
            ])
            pygame.draw.circle(scr, (200, 30, 30), (cx, cy), r)
            pygame.draw.circle(scr, (160, 15, 15), (cx, cy), r, 2)
            pygame.draw.circle(scr, (230, 200, 160), (cx, cy + si(6)), max(1, r - si(6)))
            er, pr = max(2, si(6)), max(1, si(2))
            for ep in [(cx + si(1), cy - si(7)), (cx + si(11), cy - si(7))]:
                pygame.draw.circle(scr, WHITE, ep, er)
                pygame.draw.circle(scr, BLACK, ep, er, max(1, si(1)))
                pygame.draw.circle(scr, BLACK, (ep[0] + si(2), ep[1]), pr)
            bt = max(2, si(3))
            mid = (cx + si(6), cy - si(4))
            pygame.draw.line(scr, BLACK, (cx - si(4), cy - si(13)), mid, bt)
            pygame.draw.line(scr, BLACK, mid, (cx + si(16), cy - si(13)), bt)
            bk = [(cx + si(6), cy + si(1)), (cx + si(18), cy + si(6)), (cx + si(6), cy + si(11))]
            pygame.draw.polygon(scr, (255, 180, 30), bk)
            pygame.draw.polygon(scr, (220, 140, 10), bk, max(1, si(1)))
            wo = si(3) if self.flap > 0 else 0
            wp = [(cx - si(4), cy + si(2)), (cx - si(12), cy - si(2) - wo), (cx - si(2), cy + si(8))]
            pygame.draw.polygon(scr, (160, 15, 15), wp)

        elif self.skin == SKIN_CHUCK:
            # 🟡 CHUCK (Yellow Triangle)
            pygame.draw.polygon(scr, BLACK, [
                (cx - r - si(2), cy),
                (cx - r - si(11), cy - si(8)),
                (cx - r - si(11), cy + si(8))
            ])
            # Crest on head
            pygame.draw.polygon(scr, BLACK, [
                (cx - si(4), cy - r),
                (cx - si(10), cy - r - si(10)),
                (cx, cy - r)
            ])
            # Triangle cone body
            body_pts = [
                (cx + r + si(4), cy),
                (cx - r, cy - r),
                (cx - r + si(4), cy + r)
            ]
            pygame.draw.polygon(scr, (255, 215, 0), body_pts)
            pygame.draw.polygon(scr, (210, 160, 0), body_pts, 2)
            pygame.draw.ellipse(scr, (255, 245, 200), (cx - r + si(4), cy + si(1), si(18), si(12)))
            # Eyes
            er, pr = max(2, si(5)), max(1, si(2))
            for ep in [(cx + si(2), cy - si(6)), (cx + si(11), cy - si(6))]:
                pygame.draw.circle(scr, WHITE, ep, er)
                pygame.draw.circle(scr, BLACK, ep, er, 1)
                pygame.draw.circle(scr, BLACK, (ep[0] + si(2), ep[1]), pr)
            # Brows
            pygame.draw.line(scr, (180, 50, 0), (cx - si(2), cy - si(12)), (cx + si(6), cy - si(5)), 2)
            pygame.draw.line(scr, (180, 50, 0), (cx + si(6), cy - si(5)), (cx + si(15), cy - si(12)), 2)
            # Long Sharp Beak
            bk = [(cx + si(6), cy), (cx + si(22), cy + si(4)), (cx + si(6), cy + si(9))]
            pygame.draw.polygon(scr, (255, 140, 0), bk)
            pygame.draw.polygon(scr, (200, 90, 0), bk, 1)
            wo = si(3) if self.flap > 0 else 0
            wp = [(cx - si(2), cy + si(1)), (cx - si(12), cy - si(3) - wo), (cx - si(1), cy + si(7))]
            pygame.draw.polygon(scr, (220, 170, 0), wp)

        elif self.skin == SKIN_BOMB:
            # 💣 BOMB (Black Explosive)
            pygame.draw.polygon(scr, BLACK, [
                (cx - r + si(2), cy),
                (cx - r - si(9), cy - si(6)),
                (cx - r - si(9), cy + si(6))
            ])
            # Fuse & Spark
            spark_col = (255, random.randint(120, 220), 0)
            pygame.draw.line(scr, (120, 110, 90), (cx, cy - r), (cx, cy - r - si(8)), 2)
            pygame.draw.circle(scr, spark_col, (cx, cy - r - si(9)), max(2, si(3)))
            # Body
            pygame.draw.circle(scr, (35, 35, 42), (cx, cy), r + si(1))
            pygame.draw.circle(scr, (15, 15, 20), (cx, cy), r + si(1), 2)
            pygame.draw.circle(scr, (80, 85, 95), (cx, cy + si(6)), max(1, r - si(6)))
            # White forehead dot
            pygame.draw.circle(scr, WHITE, (cx, cy - si(8)), max(1, si(2)))
            # Eyes
            er, pr = max(2, si(5)), max(1, si(2))
            for ep in [(cx + si(2), cy - si(5)), (cx + si(11), cy - si(5))]:
                pygame.draw.circle(scr, WHITE, ep, er)
                pygame.draw.circle(scr, BLACK, ep, er, 1)
                pygame.draw.circle(scr, (200, 30, 30), (ep[0] + si(2), ep[1]), pr)
            # Red Flaming Eyebrows
            pygame.draw.line(scr, (220, 40, 40), (cx - si(3), cy - si(11)), (cx + si(6), cy - si(4)), 3)
            pygame.draw.line(scr, (220, 40, 40), (cx + si(6), cy - si(4)), (cx + si(15), cy - si(11)), 3)
            # Beak
            bk = [(cx + si(6), cy + si(1)), (cx + si(17), cy + si(6)), (cx + si(6), cy + si(11))]
            pygame.draw.polygon(scr, (255, 170, 0), bk)
            pygame.draw.polygon(scr, (190, 110, 0), bk, 1)
            wo = si(3) if self.flap > 0 else 0
            wp = [(cx - si(4), cy + si(2)), (cx - si(12), cy - si(2) - wo), (cx - si(2), cy + si(8))]
            pygame.draw.polygon(scr, (60, 60, 70), wp)


# ── Pipes with 3D Bevel & Rivets ────────────────────────────────
class Pipe:
    def __init__(self, x):
        mn, mx = 60, SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 60
        self.x = x
        self.height = random.randint(mn, max(mn, mx))
        self.top_rect = pygame.Rect(x, 0, PIPE_WIDTH, self.height)
        bot_y = self.height + PIPE_GAP
        self.bot_rect = pygame.Rect(x, bot_y, PIPE_WIDTH, SCREEN_HEIGHT - bot_y - GROUND_HEIGHT)
        self.passed = False
        self.scored = False

    def update(self, sp):
        self.x -= sp
        self.top_rect.x = int(self.x)
        self.bot_rect.x = int(self.x)

    def draw(self, scr):
        ch, co = 22, 5
        ix = int(self.x)
        p_body = (34, 177, 76)
        p_dark = (14, 100, 35)
        p_hl = (100, 210, 120)

        # 1. Top pipe body & highlights
        pygame.draw.rect(scr, p_body, self.top_rect)
        pygame.draw.rect(scr, p_dark, self.top_rect, 2)
        pygame.draw.line(scr, p_hl, (ix + 7, 0), (ix + 7, max(0, self.height - ch)), 3)
        cr = (ix - co, self.height - ch, PIPE_WIDTH + co * 2, ch)
        pygame.draw.rect(scr, p_body, cr, border_radius=3)
        pygame.draw.rect(scr, p_dark, cr, 2, border_radius=3)
        pygame.draw.circle(scr, p_dark, (ix - co + 4, self.height - ch + 11), 2)
        pygame.draw.circle(scr, p_dark, (ix + PIPE_WIDTH + co - 4, self.height - ch + 11), 2)

        # 2. Bottom pipe body & highlights
        bot_y = self.height + PIPE_GAP
        pygame.draw.rect(scr, p_body, self.bot_rect)
        pygame.draw.rect(scr, p_dark, self.bot_rect, 2)
        pygame.draw.line(scr, p_hl, (ix + 7, bot_y + ch), (ix + 7, SCREEN_HEIGHT - GROUND_HEIGHT), 3)
        br = (ix - co, bot_y, PIPE_WIDTH + co * 2, ch)
        pygame.draw.rect(scr, p_body, br, border_radius=3)
        pygame.draw.rect(scr, p_dark, br, 2, border_radius=3)
        pygame.draw.circle(scr, p_dark, (ix - co + 4, bot_y + 11), 2)
        pygame.draw.circle(scr, p_dark, (ix + PIPE_WIDTH + co - 4, bot_y + 11), 2)

    def collides_with(self, bird):
        br = bird.get_rect()
        return br.colliderect(self.top_rect) or br.colliderect(self.bot_rect)


# ── Main Game Architecture ──────────────────────────────────────
class Game:
    def __init__(self):
        try:
            pygame.init()
            pygame.font.init()
        except Exception:
            pass

        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Flappy Angry Bird — Ultimate Edition")
        self.clock = pygame.time.Clock()

        # Fonts
        self.font = pygame.font.Font(None, 34)
        self.tfont = pygame.font.Font(None, 48)
        self.sfont = pygame.font.Font(None, 62)
        self.smfont = pygame.font.Font(None, 24)

        # Audio Synth
        self.synth = SoundSynth()
        self.snd_flap = self.synth._generate_tone(420, 840, 0.12, "sine", 0.25)
        self.snd_point = self.synth._generate_tone(980, 1320, 0.25, "triangle", 0.3)
        self.snd_star = self.synth._generate_tone(700, 1400, 0.35, "sine", 0.35)
        self.snd_shield = self.synth._generate_tone(500, 1100, 0.4, "sine", 0.4)
        self.snd_shatter = self.synth._generate_tone(800, 100, 0.25, "noise", 0.45)
        self.snd_hit = self.synth._generate_tone(600, 120, 0.2, "noise", 0.4)
        self.snd_die = self.synth._generate_tone(400, 80, 0.4, "sawtooth", 0.35)

        # Backgrounds & Sky Palettes
        self.sky_day = ((80, 180, 220), (160, 220, 245))
        self.sky_sunset = ((240, 110, 60), (255, 200, 120))
        self.sky_night = ((15, 23, 42), (40, 60, 95))

        self.clouds = [{'x': random.randint(0, SCREEN_WIDTH + 100), 'y': random.randint(20, 200),
                        'sp': random.uniform(0.3, 0.8), 'sz': random.uniform(0.7, 1.3)} for _ in range(6)]
        self.stars_bg = [{'x': random.randint(0, SCREEN_WIDTH), 'y': random.randint(10, 320),
                          'sz': random.choice([1, 2]), 'tw': random.uniform(0, 6.28)} for _ in range(35)]
        self.mountains = [(i * 90, SCREEN_HEIGHT - GROUND_HEIGHT - random.randint(40, 85)) for i in range(7)]

        self.current_skin = SKIN_RED
        self.best = 0
        self.total_stars = 0
        self.particles = []
        self.popups = []
        self.collectibles = []
        self.shake = 0
        self.goff = 0
        self.paused = False
        self.reset_game()

    def reset_game(self):
        self.bird = Bird(self.current_skin)
        self.pipes = []
        self.collectibles = []
        self.particles = []
        self.popups = []
        self.ptimer = 0
        self.score = 0
        self.game_over = False
        self.game_started = False
        self.paused = False
        self.shake = 0
        self.death_done = False

    def pipe_speed(self):
        return 3.0 + min(self.score * 0.08, 2.0)

    def spawn_collectible(self, x, pipe_h):
        # 45% chance to spawn star, 15% chance to spawn shield if bird doesn't have shield
        roll = random.random()
        gap_center = pipe_h + PIPE_GAP // 2
        if roll < 0.15 and not self.bird.has_shield:
            self.collectibles.append(Collectible(x + PIPE_WIDTH // 2, gap_center, "shield"))
        elif roll < 0.60:
            self.collectibles.append(Collectible(x + PIPE_WIDTH // 2, gap_center, "star"))

    def update_pipes(self):
        sp = self.pipe_speed()
        self.ptimer += 1
        interval = max(65, 90 - self.score)

        if self.ptimer > interval:
            new_p = Pipe(SCREEN_WIDTH + 20)
            self.pipes.append(new_p)
            self.spawn_collectible(new_p.x, new_p.height)
            self.ptimer = 0

        # Update collectibles
        for c in self.collectibles[:]:
            c.update(sp)
            if c.x < -20:
                self.collectibles.remove(c)
                continue
            if not c.collected and self.bird.get_rect().colliderect(c.get_rect()):
                c.collected = True
                self.collectibles.remove(c)
                if c.type == "star":
                    self.score += 3
                    self.total_stars += 1
                    self.synth.play(self.snd_star)
                    self.popups.append(PopupText(c.x, c.y, "+3 PTS", GOLD_BRIGHT, 30))
                    for _ in range(12):
                        self.particles.append(Particle(c.x, c.y, GOLD, 1.2, "star"))
                elif c.type == "shield":
                    self.bird.has_shield = True
                    self.synth.play(self.snd_shield)
                    self.popups.append(PopupText(c.x, c.y, "SHIELD ON!", CYAN_GLOW, 32))
                    for _ in range(16):
                        self.particles.append(Particle(c.x, c.y, CYAN_GLOW, 1.4))

        # Update pipes & check collision
        for p in self.pipes[:]:
            p.update(sp)
            if p.x + PIPE_WIDTH < -10:
                self.pipes.remove(p)
                continue

            if not p.scored and p.x + PIPE_WIDTH < self.bird.x:
                p.scored = True
                self.score += 1
                self.synth.play(self.snd_point)
                self.popups.append(PopupText(SCREEN_WIDTH // 2, 85, "+1", WHITE, 22))
                for _ in range(8):
                    self.particles.append(Particle(SCREEN_WIDTH // 2, 70, GOLD, 1.0, "star"))

            if p.collides_with(self.bird):
                if self.bird.has_shield:
                    # Shield absorbs crash!
                    self.bird.has_shield = False
                    self.synth.play(self.snd_shatter)
                    self.shake = 10
                    self.popups.append(PopupText(self.bird.x, self.bird.y - 15, "SHIELD SAVED YOU!", CYAN_GLOW, 28))
                    for _ in range(25):
                        self.particles.append(Particle(self.bird.x + 15, self.bird.y + 15, CYAN_GLOW, 1.8))
                    p.top_rect.x = -100
                    p.bot_rect.x = -100
                else:
                    self.game_over = True

    def get_sky_gradient(self):
        # Day -> Sunset (10+) -> Night (25+)
        if self.score < 10:
            return self.sky_day
        elif self.score < 25:
            return self.sky_sunset
        else:
            return self.sky_night

    def draw_bg(self):
        sky_top, sky_bot = self.get_sky_gradient()
        sky_h = SCREEN_HEIGHT - GROUND_HEIGHT

        # Draw smooth sky gradient
        for y in range(0, sky_h, 3):
            t = y / sky_h
            c = [int(sky_top[i] + (sky_bot[i] - sky_top[i]) * t) for i in range(3)]
            pygame.draw.rect(self.screen, c, (0, y, SCREEN_WIDTH, 3))

        # Night stars
        if self.score >= 18:
            alpha = min(255, (self.score - 18) * 30)
            for s in self.stars_bg:
                s['tw'] += 0.05
                br = max(100, int(180 + math.sin(s['tw']) * 70))
                pygame.draw.circle(self.screen, (br, br, br), (s['x'], s['y']), s['sz'])

        # Distant Hills Parallax
        hill_col = (50, 110, 95) if self.score < 10 else ((120, 60, 70) if self.score < 25 else (25, 35, 55))
        for mx, my in self.mountains:
            pts = [(mx - 70, SCREEN_HEIGHT - GROUND_HEIGHT), (mx + 30, my), (mx + 130, SCREEN_HEIGHT - GROUND_HEIGHT)]
            pygame.draw.polygon(self.screen, hill_col, pts)

        # Clouds
        cloud_col = WHITE if self.score < 10 else ((255, 230, 200) if self.score < 25 else (90, 110, 140))
        for c in self.clouds:
            if not self.paused:
                c['x'] -= c['sp']
            if c['x'] < -130:
                c['x'] = SCREEN_WIDTH + random.randint(40, 140)
                c['y'] = random.randint(20, 200)
            sz = c['sz']
            cx, cy = int(c['x']), int(c['y'])
            pygame.draw.circle(self.screen, cloud_col, (cx, cy), int(25 * sz))
            pygame.draw.circle(self.screen, cloud_col, (cx - int(18 * sz), cy + int(8 * sz)), int(20 * sz))
            pygame.draw.circle(self.screen, cloud_col, (cx + int(18 * sz), cy + int(8 * sz)), int(20 * sz))
            pygame.draw.circle(self.screen, cloud_col, (cx + int(8 * sz), cy - int(6 * sz)), int(16 * sz))

        # Ground Strip
        gy = SCREEN_HEIGHT - GROUND_HEIGHT
        pygame.draw.rect(self.screen, (210, 180, 120), (0, gy, SCREEN_WIDTH, GROUND_HEIGHT))
        pygame.draw.rect(self.screen, (100, 200, 80), (0, gy, SCREEN_WIDTH, 12))
        pygame.draw.line(self.screen, (70, 160, 50), (0, gy + 12), (SCREEN_WIDTH, gy + 12), 2)

        if self.game_started and not self.game_over and not self.paused:
            self.goff = (self.goff + self.pipe_speed()) % 24
        off = int(self.goff)
        for i in range(-24 + off, SCREEN_WIDTH + 24, 24):
            pygame.draw.line(self.screen, (160, 120, 60), (i, gy + 14), (i - 12, gy + GROUND_HEIGHT), 1)

    def draw_ui(self):
        # 1. Score HUD
        if self.game_started and not self.game_over:
            sh = self.sfont.render(str(self.score), True, (30, 30, 30))
            self.screen.blit(sh, sh.get_rect(center=(SCREEN_WIDTH // 2 + 2, 52)))
            tx = self.sfont.render(str(self.score), True, WHITE)
            self.screen.blit(tx, tx.get_rect(center=(SCREEN_WIDTH // 2, 50)))

            if self.bird.has_shield:
                sh_txt = self.smfont.render("SHIELD ACTIVE", True, CYAN_GLOW)
                self.screen.blit(sh_txt, sh_txt.get_rect(center=(SCREEN_WIDTH // 2, 85)))

        # 2. Title & Skin Selection Screen
        if not self.game_started and not self.game_over:
            tk = pygame.time.get_ticks()
            ty = SCREEN_HEIGHT // 2 - 80 + int(math.sin(tk / 400) * 6)

            sh = self.tfont.render("FLAPPY ANGRY BIRD", True, (80, 0, 0))
            self.screen.blit(sh, sh.get_rect(center=(SCREEN_WIDTH // 2 + 2, ty + 2)))
            tt = self.tfont.render("FLAPPY ANGRY BIRD", True, (220, 35, 35))
            self.screen.blit(tt, tt.get_rect(center=(SCREEN_WIDTH // 2, ty)))

            pu = 0.7 + 0.3 * math.sin(tk / 280)
            pc = tuple(int(255 * pu) for _ in range(3))
            st = self.font.render("Tap or Press SPACE", True, pc)
            self.screen.blit(st, st.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 25)))

            # Character Selector UI
            skin_box = pygame.Rect(SCREEN_WIDTH // 2 - 110, SCREEN_HEIGHT // 2 + 65, 220, 42)
            pygame.draw.rect(self.screen, (30, 41, 59), skin_box, border_radius=10)
            pygame.draw.rect(self.screen, GOLD, skin_box, 2, border_radius=10)

            skin_lbl = self.smfont.render(f"◄  HERO: {SKIN_NAMES[self.current_skin]} (TAB)  ►", True, GOLD_BRIGHT)
            self.screen.blit(skin_lbl, skin_lbl.get_rect(center=skin_box.center))

            if self.best > 0:
                bt = self.smfont.render(f"Best: {self.best}", True, GOLD)
                self.screen.blit(bt, bt.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 130)))

            brand = self.smfont.render("BUILT BY YUVRAJ CHOPRA", True, (255, 255, 255))
            brand.set_alpha(120)
            self.screen.blit(brand, brand.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT - 25)))

        # 3. Paused Overlay
        if self.paused:
            ov = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            ov.fill((15, 23, 42, 160))
            self.screen.blit(ov, (0, 0))
            ptx = self.tfont.render("PAUSED", True, GOLD)
            self.screen.blit(ptx, ptx.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 20)))
            rtx = self.smfont.render("Press P or Tap to Resume", True, WHITE)
            self.screen.blit(rtx, rtx.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 25)))

        # 4. Game Over Modal
        if self.game_over:
            ov = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            ov.fill((0, 0, 0, 100))
            self.screen.blit(ov, (0, 0))

            pw, ph = 290, 250
            px = (SCREEN_WIDTH - pw) // 2
            py = (SCREEN_HEIGHT - ph) // 2 - 15
            pn = pygame.Rect(px, py, pw, ph)

            pygame.draw.rect(self.screen, (30, 41, 59), pn, border_radius=16)
            pygame.draw.rect(self.screen, GOLD, pn, 3, border_radius=16)

            go = self.tfont.render("GAME OVER", True, (240, 50, 50))
            self.screen.blit(go, go.get_rect(center=(SCREEN_WIDTH // 2, py + 38)))
            pygame.draw.line(self.screen, (70, 85, 110), (px + 20, py + 62), (px + pw - 20, py + 62), 2)

            sc = self.font.render(f"Score:  {self.score}", True, WHITE)
            self.screen.blit(sc, (px + 28, py + 82))

            nb = self.score >= self.best and self.score > 0
            bc = GOLD if nb else (180, 185, 195)
            bs = self.font.render(f"Best:   {self.best}", True, bc)
            self.screen.blit(bs, (px + 28, py + 120))

            if nb:
                nt = self.smfont.render("NEW!", True, GOLD)
                self.screen.blit(nt, (px + pw - 60, py + 124))

            # Medals (Bronze, Silver, Gold, Platinum, Diamond)
            medal_col = None
            if self.score >= 75:
                medal_col = (0, 230, 255)
            elif self.score >= 50:
                medal_col = (220, 220, 255)
            elif self.score >= 30:
                medal_col = (255, 200, 50)
            elif self.score >= 15:
                medal_col = (200, 200, 210)
            elif self.score >= 5:
                medal_col = (200, 140, 80)

            if medal_col:
                mx, my = px + pw - 55, py + 98
                pygame.draw.circle(self.screen, medal_col, (mx, my), 20)
                pygame.draw.circle(self.screen, BLACK, (mx, my), 20, 2)

            pygame.draw.line(self.screen, (70, 85, 110), (px + 20, py + 162), (px + pw - 20, py + 162), 2)

            tk = pygame.time.get_ticks()
            pu = 0.6 + 0.4 * math.sin(tk / 320)
            rc = tuple(int(c * pu) for c in (180, 215, 255))
            rt = self.font.render("Press R or Tap", True, rc)
            self.screen.blit(rt, rt.get_rect(center=(SCREEN_WIDTH // 2, py + ph - 38)))

    def change_skin(self, step=1):
        self.current_skin = (self.current_skin + step) % len(SKIN_NAMES)
        self.bird.skin = self.current_skin

    def handle_events(self):
        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                return False

            if ev.type == pygame.KEYDOWN:
                if ev.key in (pygame.K_SPACE, pygame.K_UP, pygame.K_w):
                    if not self.game_started and not self.game_over:
                        self.game_started = True
                        self.synth.play(self.snd_flap)
                        self.bird.jump()
                    elif self.game_started and not self.game_over and not self.paused:
                        self.synth.play(self.snd_flap)
                        self.bird.jump()

                elif ev.key in (pygame.K_TAB, pygame.K_s):
                    if not self.game_started:
                        self.change_skin(1)

                elif ev.key in (pygame.K_p, pygame.K_ESCAPE):
                    if self.game_started and not self.game_over:
                        self.paused = not self.paused

                elif ev.key == pygame.K_m:
                    self.synth.muted = not self.synth.muted

                elif ev.key == pygame.K_r and self.game_over:
                    self.reset_game()

            if ev.type in (pygame.MOUSEBUTTONDOWN, pygame.FINGERDOWN):
                pos = getattr(ev, 'pos', (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2))
                if not self.game_started and not self.game_over:
                    # Check if clicked skin selector
                    skin_box = pygame.Rect(SCREEN_WIDTH // 2 - 110, SCREEN_HEIGHT // 2 + 65, 220, 42)
                    if skin_box.collidepoint(pos):
                        self.change_skin(1)
                    else:
                        self.game_started = True
                        self.synth.play(self.snd_flap)
                        self.bird.jump()
                elif self.game_started and not self.game_over:
                    if self.paused:
                        self.paused = False
                    else:
                        self.synth.play(self.snd_flap)
                        self.bird.jump()
                elif self.game_over:
                    self.reset_game()

        return True

    async def run(self):
        running = True
        while running:
            running = self.handle_events()

            if self.game_started and not self.game_over and not self.paused:
                self.bird.update()
                self.update_pipes()

                # Trailing flap wind particles
                if self.bird.flap > 4:
                    self.particles.append(Particle(self.bird.x, self.bird.y + self.bird.size // 2, (255, 255, 255, 120), 0.5))

                if self.bird.y <= 0 or self.bird.y >= SCREEN_HEIGHT - GROUND_HEIGHT - self.bird.size:
                    if self.bird.has_shield:
                        self.bird.has_shield = False
                        self.synth.play(self.snd_shatter)
                        self.bird.vel = -5
                        self.shake = 10
                        self.popups.append(PopupText(self.bird.x, self.bird.y - 15, "SHIELD SAVED YOU!", CYAN_GLOW, 28))
                    else:
                        self.game_over = True

            if self.game_over and not self.death_done:
                self.death_done = True
                self.shake = 14
                self.synth.play(self.snd_hit)
                if self.score > self.best:
                    self.best = self.score

                # Death explosion particles tailored to bird skin
                bx = self.bird.x + self.bird.size // 2
                by = self.bird.y + self.bird.size // 2
                p_col = (220, 40, 40) if self.current_skin == SKIN_RED else ((255, 215, 0) if self.current_skin == SKIN_CHUCK else (40, 40, 45))
                for _ in range(25):
                    self.particles.append(Particle(bx, by, p_col, 1.5))

            # Update particles and popups
            self.particles = [p for p in self.particles if p.update()]
            self.popups = [p for p in self.popups if p.update()]

            if self.shake > 0:
                self.shake -= 1

            # Render
            self.draw_bg()
            for p in self.pipes:
                p.draw(self.screen)
            for c in self.collectibles:
                c.draw(self.screen)
            self.bird.draw(self.screen)
            for p in self.particles:
                p.draw(self.screen)
            for pu in self.popups:
                pu.draw(self.screen)
            self.draw_ui()

            pygame.display.flip()
            self.clock.tick(FPS)
            await asyncio.sleep(0)

        pygame.quit()


if __name__ == "__main__":
    game = Game()
    asyncio.run(game.run())
