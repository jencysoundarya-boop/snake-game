# 🐍 SNAKE // NEON HUNT

Classic Snake. Rewired.

This project contains two distinct versions of the classic Snake game, reimagined with a futuristic cyberpunk aesthetic.

## 🌐 PLAY ONLINE

Play the game directly in your browser:  
▶ **[https://jencysoundarya-boop.github.io/snake-game/](https://jencysoundarya-boop.github.io/snake-game/)**

*(Note: The link above requires GitHub Pages to be enabled in this repository's settings.)*

---

## 🎮 Web Edition
The Web Edition is a complete, standalone HTML5 browser game located in the `web/` directory.

### Features
- **Zero Dependencies**: Pure HTML, CSS, and Vanilla JavaScript. No frameworks or npm required.
- **Web Audio API Synth**: Custom retro sound effects generated mathematically on the fly. No external audio files.
- **Neon Graphics**: Smooth HTML5 Canvas rendering with glowing particles and glitch text effects.
- **Progress Tracking**: LocalStorage-backed High Scores and Achievement systems.
- **Multiple Modes**: Classic, Endless, Time Attack, Obstacle, and Survival.
- **Mobile Ready**: Fully responsive with integrated on-screen touch controls.

### How to Play (Local)
1. Navigate to the `web/` directory.
2. Open `index.html` in any modern web browser.
3. Use **WASD** or **Arrow Keys** to move. Use **SPACE** to pause.

---

## ⌨ Terminal Edition
The Terminal Edition is the original Python implementation designed for Ubuntu/Linux terminals. It leverages direct ANSI escape sequences for a flicker-free, double-buffered TUI (Text User Interface) experience without relying on `curses` or `pygame`.

### Features
- **Cross-Platform Input**: Custom non-blocking input handlers that support both Linux (`termios`) and Windows (`msvcrt`).
- **Terminal Safety**: Automatically cleans up cursor state and ANSI resets on crash or `Ctrl+C`.
- **Docker Support**: Containerized via the included `Dockerfile`.

### How to Run (Local)
Ensure you have Python 3 installed.
```bash
python main.py
```
*(Or use `python3 main.py` or `py main.py` depending on your OS).*

### How to Run (Docker)
```bash
docker build -t snake-neon-hunt .
docker run -it snake-neon-hunt
```
*(The `-it` flag is required for interactive keyboard input).*

---

## 🕹 Game Modes & Mechanics

- **Normal Data (+10)**: Core snake growth.
- **Rare Data (+25)**: Spawns occasionally.
- **Gold Package (+50)**: High value, but expires quickly.
- **Speed ⚡**: Temporarily increases movement speed.
- **Freeze ❄**: Temporarily underclocks the system, slowing you down.
- **Combo System**: Eat data sequentially in a short timeframe to build a score multiplier!

## 🏗 Architecture
This project is built to showcase two fundamentally different ways of rendering a game loop from scratch:
1. **Web (`web/game.js`)**: Utilizing `requestAnimationFrame`, a variable timestep for particles, and a fixed accumulator timestep for logic to prevent game-speed fluctuations on high refresh rate monitors.
2. **Terminal (`main.py`)**: Utilizing a constant delta-time polling loop combined with a differential render buffer that strictly updates only the specific terminal cells (x, y coordinates) that changed, completely eliminating the standard terminal flickering problem.

---
*Created as a commercial-grade indie redesign of the classic Snake experience.*
