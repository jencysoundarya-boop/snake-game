# achievements.py

import time

ACHIEVEMENTS_DEFS = {
    "FIRST_BITE": {"name": "FIRST BITE", "desc": "Eat your first food."},
    "CENTURY": {"name": "CENTURY", "desc": "Reach 100 points."},
    "SPEED_DEMON": {"name": "SPEED DEMON", "desc": "Reach maximum speed."},
    "LONG_BOY": {"name": "LONG BOY", "desc": "Reach 100 segments."},
    "NEON_MASTER": {"name": "NEON MASTER", "desc": "Reach level 20."},
    "PERFECT_RUN": {"name": "PERFECT RUN", "desc": "Survive for a long time."}
}

class AchievementManager:
    def __init__(self):
        self.unlocked = set()
        self.active_display = None
        self.display_timer = 0
        self.display_duration = 4.0 # seconds
        self.start_time = time.time()

    def check(self, game_state, snake):
        # First Bite
        if "FIRST_BITE" not in self.unlocked and game_state.score_manager.score > 0:
            self.unlock("FIRST_BITE")
        
        # Century
        if "CENTURY" not in self.unlocked and game_state.score_manager.score >= 100:
            self.unlock("CENTURY")
            
        # Long Boy
        if "LONG_BOY" not in self.unlocked and len(snake.body) >= 100:
            self.unlock("LONG_BOY")
            
        # Neon Master
        if "NEON_MASTER" not in self.unlocked and game_state.level >= 20:
            self.unlock("NEON_MASTER")
            
        # Perfect Run
        if "PERFECT_RUN" not in self.unlocked and time.time() - self.start_time > 180 and game_state.score_manager.score > 500:
            self.unlock("PERFECT_RUN")

    def unlock(self, key):
        self.unlocked.add(key)
        self.active_display = ACHIEVEMENTS_DEFS[key]
        self.display_timer = time.time()

    def get_display(self):
        if self.active_display and time.time() - self.display_timer < self.display_duration:
            return self.active_display
        else:
            self.active_display = None
            return None
