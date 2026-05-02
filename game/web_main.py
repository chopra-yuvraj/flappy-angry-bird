import pygame
import random
import sys
import asyncio
import math

SCREEN_WIDTH = 288
SCREEN_HEIGHT = 512
GROUND_HEIGHT = 50
PIPE_WIDTH = 44
PIPE_GAP = 110
BIRD_SIZE = 28
FPS = 60

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
SKY_TOP = (80, 180, 220)
SKY_BOTTOM = (160, 220, 245)
PIPE_GREEN = (34, 177, 76)
PIPE_DARK = (14, 100, 35)
PIPE_HL = (100, 210, 120)
BIRD_RED = (200, 30, 30)
BIRD_DRED = (160, 15, 15)
BIRD_BELLY = (230, 200, 160)
BIRD_BEAK = (255, 180, 30)
BIRD_BEAK_D = (220, 140, 10)
GROUND_GRN = (100, 200, 80)
GROUND_BRN = (210, 180, 120)
GROUND_DK = (160, 120, 60)
SCORE_GOLD = (255, 215, 0)
SCORE_SHAD = (60, 40, 0)
MEDAL_G = (255, 200, 50)
MEDAL_S = (200, 200, 210)
MEDAL_B = (200, 140, 80)


class Particle:
    def __init__(self, x, y, color=None):
        self.x, self.y = x, y
        a = random.uniform(0, 6.28)
        sp = random.uniform(1.5, 4)
        self.vx = math.cos(a) * sp
        self.vy = math.sin(a) * sp - 2
        self.life = random.randint(12, 30)
        self.ml = self.life
        self.sz = random.randint(2, 4)
        self.color = color or random.choice([SCORE_GOLD, WHITE, (255, 100, 60)])

    def update(self):
        self.x += self.vx
        self.vy += 0.15
        self.y += self.vy
        self.life -= 1
        return self.life > 0

    def draw(self, scr):
        r = max(1, int(self.sz * self.life / self.ml))
        pygame.draw.circle(scr, self.color, (int(self.x), int(self.y)), r)


class Bird:
    def __init__(self):
        self.x = 60
        self.y = SCREEN_HEIGHT // 2
        self.vel = 0
        self.grav = 0.4
        self.jstr = -7.0
        self.size = BIRD_SIZE
        self.rot = 0
        self.flap = 0

    def update(self):
        self.vel += self.grav
        self.y += self.vel
        self.flap = max(0, self.flap - 1)
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

    def jump(self):
        self.vel = self.jstr
        self.rot = 30
        self.flap = 8

    def get_rect(self):
        m = self.size * 0.2
        return pygame.Rect(self.x + m, self.y + m, self.size - m * 2, self.size - m * 2)

    def draw(self, scr):
        cx = int(self.x + self.size // 2)
        cy = int(self.y + self.size // 2)
        r = self.size // 2
        s = self.size / 34.0
        si = lambda v: int(v * s)
        pygame.draw.polygon(scr, BLACK, [
            (cx - r + si(3), cy),
            (cx - r - si(8), cy - si(7)),
            (cx - r - si(8), cy + si(7))])
        pygame.draw.circle(scr, BIRD_RED, (cx, cy), r)
        pygame.draw.circle(scr, BIRD_DRED, (cx, cy), r, 2)
        pygame.draw.circle(scr, BIRD_BELLY, (cx, cy + si(6)), max(1, r - si(6)))
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
        pygame.draw.polygon(scr, BIRD_BEAK, bk)
        pygame.draw.polygon(scr, BIRD_BEAK_D, bk, max(1, si(1)))
        wo = si(3) if self.flap > 0 else 0
        wp = [(cx - si(4), cy + si(2)), (cx - si(12), cy - si(2) - wo), (cx - si(2), cy + si(8))]
        pygame.draw.polygon(scr, BIRD_DRED, wp)


class Pipe:
    def __init__(self, x):
        mn, mx = 50, SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 50
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
        ch, co = 18, 4
        ix = int(self.x)
        pygame.draw.rect(scr, PIPE_GREEN, self.top_rect)
        pygame.draw.rect(scr, PIPE_DARK, self.top_rect, 2)
        pygame.draw.line(scr, PIPE_HL, (ix + 7, 0), (ix + 7, self.height - ch), 2)
        cr = (ix - co, self.height - ch, PIPE_WIDTH + co * 2, ch)
        pygame.draw.rect(scr, PIPE_GREEN, cr, border_radius=3)
        pygame.draw.rect(scr, PIPE_DARK, cr, 2, border_radius=3)
        pygame.draw.rect(scr, PIPE_GREEN, self.bot_rect)
        pygame.draw.rect(scr, PIPE_DARK, self.bot_rect, 2)
        pygame.draw.line(scr, PIPE_HL, (ix + 7, self.height + PIPE_GAP + ch), (ix + 7, SCREEN_HEIGHT - GROUND_HEIGHT), 2)
        br = (ix - co, self.height + PIPE_GAP, PIPE_WIDTH + co * 2, ch)
        pygame.draw.rect(scr, PIPE_GREEN, br, border_radius=3)
        pygame.draw.rect(scr, PIPE_DARK, br, 2, border_radius=3)

    def collides_with(self, bird):
        br = bird.get_rect()
        return br.colliderect(self.top_rect) or br.colliderect(self.bot_rect)


class Game:
    def __init__(self):
        try:
            pygame.init()
            pygame.font.init()
        except Exception:
            pass
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Flappy Angry Bird")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 30)
        self.tfont = pygame.font.Font(None, 40)
        self.sfont = pygame.font.Font(None, 52)
        self.smfont = pygame.font.Font(None, 22)
        self.sky = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT - GROUND_HEIGHT))
        sky_h = SCREEN_HEIGHT - GROUND_HEIGHT
        for y in range(sky_h):
            t = y / sky_h
            c = [int(SKY_TOP[i] + (SKY_BOTTOM[i] - SKY_TOP[i]) * t) for i in range(3)]
            pygame.draw.line(self.sky, c, (0, y), (SCREEN_WIDTH, y))
        self.clouds = [{'x': random.randint(0, SCREEN_WIDTH + 80), 'y': random.randint(20, 180),
                        'sp': random.uniform(0.3, 0.8), 'sz': random.uniform(0.5, 1.0)} for _ in range(5)]
        self.best = 0
        self.particles = []
        self.shake = 0
        self.goff = 0
        self.reset_game()

    def reset_game(self):
        self.bird = Bird()
        self.pipes = []
        self.ptimer = 0
        self.score = 0
        self.game_over = False
        self.game_started = False
        self.particles = []
        self.shake = 0
        self.death_done = False

    def pipe_speed(self):
        return 2.5 + min(self.score * 0.07, 1.5)

    def update_pipes(self):
        sp = self.pipe_speed()
        self.ptimer += 1
        interval = max(60, 85 - self.score)
        if self.ptimer > interval:
            self.pipes.append(Pipe(SCREEN_WIDTH + 20))
            self.ptimer = 0
        rm = []
        for p in self.pipes:
            p.update(sp)
            if p.x + PIPE_WIDTH < -10:
                rm.append(p)
            if not p.scored and p.x + PIPE_WIDTH < self.bird.x:
                p.scored = True
                self.score += 1
                for _ in range(6):
                    self.particles.append(Particle(SCREEN_WIDTH // 2, 60, SCORE_GOLD))
            if p.collides_with(self.bird):
                self.game_over = True
        for p in rm:
            self.pipes.remove(p)

    def draw_bg(self):
        self.screen.blit(self.sky, (0, 0))
        for c in self.clouds:
            c['x'] -= c['sp']
            if c['x'] < -100:
                c['x'] = SCREEN_WIDTH + random.randint(40, 120)
                c['y'] = random.randint(20, 180)
            sz = c['sz']
            cx, cy = int(c['x']), int(c['y'])
            pygame.draw.circle(self.screen, WHITE, (cx, cy), int(20 * sz))
            pygame.draw.circle(self.screen, WHITE, (cx - int(14 * sz), cy + int(6 * sz)), int(16 * sz))
            pygame.draw.circle(self.screen, WHITE, (cx + int(14 * sz), cy + int(6 * sz)), int(16 * sz))
        gy = SCREEN_HEIGHT - GROUND_HEIGHT
        pygame.draw.rect(self.screen, GROUND_BRN, (0, gy, SCREEN_WIDTH, GROUND_HEIGHT))
        pygame.draw.rect(self.screen, GROUND_GRN, (0, gy, SCREEN_WIDTH, 8))
        pygame.draw.line(self.screen, (70, 160, 50), (0, gy + 8), (SCREEN_WIDTH, gy + 8), 2)
        if self.game_started and not self.game_over:
            self.goff = (self.goff + self.pipe_speed()) % 20
        off = int(self.goff)
        for i in range(-20 + off, SCREEN_WIDTH + 20, 20):
            pygame.draw.line(self.screen, GROUND_DK, (i, gy + 10), (i - 8, gy + GROUND_HEIGHT), 1)

    def draw_ui(self):
        if self.game_started and not self.game_over:
            sh = self.sfont.render(str(self.score), True, SCORE_SHAD)
            self.screen.blit(sh, sh.get_rect(center=(SCREEN_WIDTH // 2 + 2, 42)))
            tx = self.sfont.render(str(self.score), True, WHITE)
            self.screen.blit(tx, tx.get_rect(center=(SCREEN_WIDTH // 2, 40)))
        if not self.game_started and not self.game_over:
            tk = pygame.time.get_ticks()
            ty = SCREEN_HEIGHT // 2 - 50 + int(math.sin(tk / 500) * 4)
            sh = self.tfont.render("FLAPPY ANGRY BIRD", True, (80, 0, 0))
            self.screen.blit(sh, sh.get_rect(center=(SCREEN_WIDTH // 2 + 2, ty + 2)))
            tt = self.tfont.render("FLAPPY ANGRY BIRD", True, BIRD_RED)
            self.screen.blit(tt, tt.get_rect(center=(SCREEN_WIDTH // 2, ty)))
            pu = 0.7 + 0.3 * math.sin(tk / 300)
            pc = tuple(int(255 * pu) for _ in range(3))
            st = self.font.render("Tap or SPACE", True, pc)
            self.screen.blit(st, st.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 15)))
            if self.best > 0:
                bt = self.smfont.render(f"Best: {self.best}", True, SCORE_GOLD)
                self.screen.blit(bt, bt.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 50)))
        if self.game_over:
            ov = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            ov.fill((0, 0, 0, 80))
            self.screen.blit(ov, (0, 0))
            pw, ph = 240, 210
            px = (SCREEN_WIDTH - pw) // 2
            py = (SCREEN_HEIGHT - ph) // 2 - 15
            pn = pygame.Rect(px, py, pw, ph)
            pygame.draw.rect(self.screen, (45, 55, 72), pn, border_radius=10)
            pygame.draw.rect(self.screen, SCORE_GOLD, pn, 3, border_radius=10)
            go = self.tfont.render("GAME OVER", True, (220, 60, 60))
            self.screen.blit(go, go.get_rect(center=(SCREEN_WIDTH // 2, py + 30)))
            pygame.draw.line(self.screen, (80, 90, 110), (px + 16, py + 52), (px + pw - 16, py + 52), 2)
            sc = self.font.render(f"Score:  {self.score}", True, WHITE)
            self.screen.blit(sc, (px + 24, py + 66))
            nb = self.score >= self.best and self.score > 0
            bc = SCORE_GOLD if nb else (180, 180, 190)
            bs = self.font.render(f"Best:   {self.best}", True, bc)
            self.screen.blit(bs, (px + 24, py + 100))
            if nb:
                nt = self.smfont.render("NEW!", True, SCORE_GOLD)
                self.screen.blit(nt, (px + pw - 55, py + 103))
            mc = None
            if self.score >= 30: mc = MEDAL_G
            elif self.score >= 15: mc = MEDAL_S
            elif self.score >= 5: mc = MEDAL_B
            if mc:
                mx, my = px + pw - 45, py + 82
                pygame.draw.circle(self.screen, mc, (mx, my), 14)
                pygame.draw.circle(self.screen, BLACK, (mx, my), 14, 2)
            pygame.draw.line(self.screen, (80, 90, 110), (px + 16, py + 135), (px + pw - 16, py + 135), 2)
            tk = pygame.time.get_ticks()
            pu = 0.6 + 0.4 * math.sin(tk / 350)
            rc = tuple(int(c * pu) for c in (200, 220, 255))
            rt = self.font.render("Press R or Tap", True, rc)
            self.screen.blit(rt, rt.get_rect(center=(SCREEN_WIDTH // 2, py + ph - 30)))

    def handle_events(self):
        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                return False
            if ev.type == pygame.KEYDOWN:
                if ev.key == pygame.K_SPACE:
                    if not self.game_started and not self.game_over:
                        self.game_started = True
                        self.bird.jump()
                    elif self.game_started and not self.game_over:
                        self.bird.jump()
                elif ev.key == pygame.K_r and self.game_over:
                    self.reset_game()
            if ev.type in (pygame.MOUSEBUTTONDOWN, pygame.FINGERDOWN):
                if not self.game_started and not self.game_over:
                    self.game_started = True
                    self.bird.jump()
                elif self.game_started and not self.game_over:
                    self.bird.jump()
                elif self.game_over:
                    self.reset_game()
        return True

    async def run(self):
        running = True
        while running:
            running = self.handle_events()
            if self.game_started and not self.game_over:
                self.bird.update()
                self.update_pipes()
                if self.bird.y <= 0 or self.bird.y >= SCREEN_HEIGHT - GROUND_HEIGHT - self.bird.size:
                    self.game_over = True
            if self.game_over and not self.death_done:
                self.death_done = True
                self.shake = 10
                if self.score > self.best:
                    self.best = self.score
                bx = self.bird.x + self.bird.size // 2
                by = self.bird.y + self.bird.size // 2
                for _ in range(12):
                    self.particles.append(Particle(bx, by, BIRD_RED))
            self.particles = [p for p in self.particles if p.update()]
            if self.shake > 0:
                self.shake -= 1
            self.draw_bg()
            for p in self.pipes:
                p.draw(self.screen)
            self.bird.draw(self.screen)
            for p in self.particles:
                p.draw(self.screen)
            self.draw_ui()
            pygame.display.flip()
            self.clock.tick(FPS)
            await asyncio.sleep(0)
        pygame.quit()


if __name__ == "__main__":
    game = Game()
    asyncio.run(game.run())
