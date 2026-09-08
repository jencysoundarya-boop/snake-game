# settings.py

import os
import sys

# --- GAME CONFIGURATION ---
FPS = 60
BASE_TICK_RATE = 0.15 # Seconds per tick (movement) at Level 1
MIN_TICK_RATE = 0.04  # Maximum speed

# Modes
MODE_CLASSIC = "CLASSIC"
MODE_ENDLESS = "ENDLESS"
MODE_SURVIVAL = "SURVIVAL"
MODE_TIME_ATTACK = "TIME ATTACK"
MODE_OBSTACLE = "OBSTACLE"

# --- THEMES & COLORS ---
def rgb_to_ansi(r, g, b):
    # Generates a True Color (24-bit) escape sequence for foreground
    return f"\033[38;2;{r};{g};{b}m"

def rgb_to_ansi_bg(r, g, b):
    return f"\033[48;2;{r};{g};{b}m"

class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    CLEAR = "\033[2J"
    HIDE_CURSOR = "\033[?25l"
    SHOW_CURSOR = "\033[?25h"
    
    # Neon Theme Palette
    NEON_CYAN = rgb_to_ansi(0, 255, 255)
    NEON_MAGENTA = rgb_to_ansi(255, 0, 255)
    NEON_GREEN = rgb_to_ansi(57, 255, 20)
    NEON_YELLOW = rgb_to_ansi(255, 255, 0)
    NEON_RED = rgb_to_ansi(255, 40, 40)
    
    # UI elements
    HUD_TEXT = rgb_to_ansi(180, 180, 255)
    BORDER = rgb_to_ansi(50, 50, 80)
    BG_DARK = rgb_to_ansi_bg(10, 10, 15)
    
    # Game Elements
    SNAKE_HEAD = NEON_CYAN
    SNAKE_BODY = rgb_to_ansi(0, 150, 200)
    SNAKE_TAIL = rgb_to_ansi(0, 100, 150)
    FOOD_NORMAL = NEON_GREEN
    FOOD_RARE = NEON_MAGENTA
    FOOD_GOLD = NEON_YELLOW
    FOOD_SPEED = NEON_CYAN
    FOOD_SLOW = NEON_RED
    FOOD_BONUS = rgb_to_ansi(255, 100, 0)
    OBSTACLE = rgb_to_ansi(100, 100, 100)

# Characters
class Chars:
    SNAKE_HEAD = "◆"
    SNAKE_BODY = "█"
    SNAKE_TAIL = "▓"
    FOOD_NORMAL = "●"
    FOOD_RARE = "✦"
    FOOD_GOLD = "◇"
    BORDER_H = "─"
    BORDER_V = "│"
    CORNER_TL = "┌"
    CORNER_TR = "┐"
    CORNER_BL = "└"
    CORNER_BR = "┘"
    BLOCK = "██"
    OBSTACLE = "▒"

# Levels
LEVELS = {
    1: {"name": "NEON GRID", "speed_multiplier": 1.0},
    5: {"name": "NIGHT CITY", "speed_multiplier": 1.2},
    10: {"name": "CYBER CORE", "speed_multiplier": 1.4},
    15: {"name": "DATA STREAM", "speed_multiplier": 1.6},
    20: {"name": "VOID GRID", "speed_multiplier": 1.8}
}

# Food definitions
FOOD_TYPES = {
    "NORMAL": {"char": Chars.FOOD_NORMAL, "color": Colors.FOOD_NORMAL, "points": 10, "prob": 70},
    "RARE": {"char": Chars.FOOD_RARE, "color": Colors.FOOD_RARE, "points": 30, "prob": 15},
    "GOLD": {"char": Chars.FOOD_GOLD, "color": Colors.FOOD_GOLD, "points": 50, "prob": 5},
    "SPEED": {"char": Chars.FOOD_NORMAL, "color": Colors.FOOD_SPEED, "points": 15, "prob": 5},
    "SLOW": {"char": Chars.FOOD_NORMAL, "color": Colors.FOOD_SLOW, "points": 15, "prob": 5},
}
