# Flappy Angry Bird - Premium Arcade Game
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Pygame](https://img.shields.io/badge/Pygame-CE-00D4AA?style=for-the-badge&logo=python&logoColor=white)](https://pygame.org/)
[![HTML5-Canvas](https://img.shields.io/badge/HTML5-Canvas_60FPS-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Web-Audio](https://img.shields.io/badge/Web_Audio-Synthesizer-9B51E0?style=for-the-badge&logo=soundcharts&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🚀 Live Demo & Web Play
Play Flappy Angry Bird directly in your browser with zero installations, 60 FPS Canvas rendering, multi-hero skins, power-ups, and procedural 8-bit audio:
- **Instant Vercel Deployment**: Push to GitHub and deploy straight to Vercel with zero configuration required!
- **Play in Browser**: Open `website/index.html` or visit the hosted web arcade portal to play instantly.
- **Standalone Windows Executable**: Download [`releases/FlappyAngryBird.exe`](releases/FlappyAngryBird.exe) for offline desktop play.

---

## Why Flappy Angry Bird?
As a **B.Tech CSE student at VIT** and **B.S. Data Science student at IIT Madras**, I wanted to explore the intersection of classical desktop game development and high-performance, modern web deployment.

This project delivers dual runtime targets:
1. **Desktop Native**: Powered by Python 3 and Pygame CE (`game/main.py` and Windows `releases/FlappyAngryBird.exe`).
2. **Web Portal & Arcade Engine**: Built with pure HTML5 Canvas, Web Audio API, and CSS3 for zero-latency, cross-platform browser play on any device (`website/`).

### Key Features
- **3 Playable Character Heroes** - Switch between **Red** (balanced flight dynamics and red feather bursts), **Chuck** (aerodynamic yellow speedster with swift lift), and **Bomb** (heavy black bird with an animated fuse spark).
- **Collectibles & Power-Ups** - Collect glowing **Energy Shields** that absorb fatal collisions to save your run, and **Golden Stars** granting +3 bonus score points.
- **Dynamic Atmosphere & Parallax Depth** - Sky transitions seamlessly from bright cyan daylight to amber sunset and starry midnight, backed by rolling parallax mountain horizons.
- **Procedural 8-Bit Audio** - Real-time synthesized audio engine generating flap sounds, point dings, star chimes, shield energy hums, shatter shockwaves, and game-over fanfares with zero external audio file latency.
- **Physics-Based Gameplay** - Realistic gravity, dynamic angular velocity rotation (+30° jump to -70° dive), progressive obstacle speed scaling, and precise collision detection.
- **Cross-Platform Responsive Controls** - Keyboard (`SPACE`, `W`, `↑`), Character Swap (`TAB`, `S`), Pause (`P`), Mute (`M`), Restart (`R`), and Touch (`TAP`) for mobile and tablet devices.
- **High Scores & Medal Achievements** - Local score persistence with Bronze, Silver, Gold, Platinum, and Diamond Legend milestones.
- **Clean Architecture & Deployment Ready** - Consolidated `website/` directory with `vercel.json` for edge static hosting and Flask (`website/app.py`) for Python server hosting.

---

### Game Interaction
| Feature | Action | Experience |
|---------|--------|------------|
| **Start Game** | Press `SPACE`, `W`, `↑` or Tap | The bird leaps into flight, activating gravity, aerodynamics, and obstacle generation |
| **Flight Control** | Press `SPACE` or Tap Screen | The bird flaps upwards with angular rotation and skin-tailored particle bursts |
| **Switch Character** | Press `TAB`, `S` or Tap Hero Box | Cycles between **Red ⇄ Chuck ⇄ Bomb** with distinct visuals and physics |
| **Shield Protection** | Collect Cyan Orb | Wraps character in an energy bubble that absorbs 1 fatal pipe or ground crash |
| **Bonus Star** | Collect Spinning Star | Awards +3 bonus score points accompanied by a starburst particle effect |
| **Pause / Resume** | Press `P` or `ESC` | Freezes the game session in place |
| **Mute / Unmute** | Press `M` or click Audio button | Toggles procedural sound effects on the fly |
| **Quick Restart** | Press `R` or Tap after death | Instantly resets the game state for rapid replayability |

---

### Engineering Highlights
- **Core Native Engine**: Built on **Python 3** and **Pygame Community Edition** with procedural wave sound synthesis via NumPy (`game/main.py`).
- **Compiled Desktop Executable**: Standalone single-file Windows binary in [`releases/FlappyAngryBird.exe`](releases/FlappyAngryBird.exe).
- **Web Engine**: Pure **HTML5 Canvas 2D** with High-DPI Retina scaling and **Web Audio API** oscillator sound synthesis (`website/js/game.js`).
- **Styling & UI**: Modern glassmorphism design system using pure CSS3 and Outfit typography (`website/css/style.css`).
- **Vercel Edge Ready**: Static configuration with clean URL routing and HTTP caching headers (`vercel.json`).

---

## Future Enhancements
Ideas for the next version:
- [x] **Power-ups** - Energy Shield protection and Golden Star bonus collectibles
- [x] **Character Selectors** - Playable Red, Chuck, and Bomb heroes with dedicated visual FX
- [x] **Dynamic Day / Night Cycles** - Progressive sky lighting transitions and parallax mountain horizon
- [x] **Sound Effects** - Zero-dependency procedural 8-bit audio synthesizer
- [x] **Difficulty Scaling** - Progressive pipe velocity and obstacle pacing
- [ ] **Leaderboard System** - Global high scores using a lightweight cloud database
- [ ] **Multiplayer Race Mode** - Real-time two-player split-screen challenge

---

## License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for full details.

---

## Acknowledgments
Special recognition to:
- **My professors at VIT Vellore** for their encouragement in exploring diverse tech stacks.
- **IIT Madras coursework** for emphasizing algorithmic efficiency.
- **The Pygame Community** for maintaining the excellent library.

---

## About the Developer

**Yuvraj Chopra**  
*B.Tech Computer Science Engineering - VIT Vellore*  
*B.S. Data Science - IIT Madras*  
Vellore, Tamil Nadu, India

*Passionate about building simple, effective solutions to everyday problems. Currently exploring the intersection of software engineering and data science.*

### Connect With Me

[![GitHub](https://img.shields.io/badge/GitHub-chopra--yuvraj-181717?style=for-the-badge&logo=github)](https://github.com/chopra-yuvraj)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-chopra--yuvraj-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/chopra-yuvraj)
[![Email](https://img.shields.io/badge/Email-yuvrajchopra19%40gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:yuvrajchopra19@gmail.com)

---

<div align="center">

**Made with ❤️ and ☕ by Yuvraj Chopra**

[ **View on GitHub**](https://github.com/chopra-yuvraj/flappy-angry-bird)

</div>
