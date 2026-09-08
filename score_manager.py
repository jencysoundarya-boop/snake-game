# score_manager.py

import json
import os
import time

class ScoreManager:
    def __init__(self):
        self.score = 0
        self.combo = 1
        self.combo_timer = 0
        self.combo_timeout = 3.0 # seconds
        self.high_scores = []
        self.filename = "highscores.json"
        self.load_high_scores()

    def add_score(self, points):
        self.score += points * self.combo

    def increment_combo(self):
        self.combo += 1
        self.combo_timer = time.time()

    def update_combo(self):
        if self.combo > 1 and time.time() - self.combo_timer > self.combo_timeout:
            self.combo = 1

    def load_high_scores(self):
        if os.path.exists(self.filename):
            try:
                with open(self.filename, 'r') as f:
                    self.high_scores = json.load(f)
            except Exception:
                self.high_scores = []
        else:
            self.high_scores = []

    def save_high_scores(self):
        with open(self.filename, 'w') as f:
            json.dump(self.high_scores, f, indent=4)

    def is_high_score(self):
        if len(self.high_scores) < 5:
            return True
        return self.score > self.high_scores[-1]['score']

    def add_high_score(self, name, level):
        self.high_scores.append({"name": name, "score": self.score, "level": level})
        self.high_scores.sort(key=lambda x: x['score'], reverse=True)
        self.high_scores = self.high_scores[:5]
        self.save_high_scores()

    def get_high_score(self):
        if self.high_scores:
            return self.high_scores[0]['score']
        return 0
