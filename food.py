# food.py

import random
import time
from settings import FOOD_TYPES

class FoodManager:
    def __init__(self, board):
        self.board = board
        self.foods = [] # List of dicts: {'x', 'y', 'type', 'spawn_time', 'duration'}
        
    def spawn(self, snake_body, force_type=None):
        while True:
            x = random.randint(self.board.min_x, self.board.max_x)
            y = random.randint(self.board.min_y, self.board.max_y)
            if (x, y) not in snake_body and all(f['x'] != x or f['y'] != y for f in self.foods):
                break
                
        ftype = force_type
        if not ftype:
            # Weighted random selection
            rand = random.randint(1, 100)
            cumulative = 0
            for t, data in FOOD_TYPES.items():
                cumulative += data["prob"]
                if rand <= cumulative:
                    ftype = t
                    break
        if not ftype: ftype = "NORMAL"
        
        # Special foods might expire
        duration = None
        if ftype in ("GOLD", "SPEED", "SLOW"):
            duration = random.uniform(5.0, 10.0)
            
        self.foods.append({
            'x': x,
            'y': y,
            'type': ftype,
            'spawn_time': time.time(),
            'duration': duration
        })

    def update(self):
        # Remove expired foods
        current_time = time.time()
        self.foods = [f for f in self.foods if not f['duration'] or current_time - f['spawn_time'] < f['duration']]
        
        # Ensure there is always at least one normal food
        if not any(f['type'] == 'NORMAL' for f in self.foods):
            self.spawn(snake_body=set(), force_type='NORMAL')

    def draw(self, renderer):
        current_time = time.time()
        for f in self.foods:
            f_data = FOOD_TYPES[f['type']]
            
            # Pulse animation for special foods (dim if close to expire)
            if f['duration']:
                time_left = f['duration'] - (current_time - f['spawn_time'])
                if time_left < 2.0 and int(current_time * 10) % 2 == 0:
                    continue # Blink effect
                    
            renderer.draw_char(f['x'], f['y'], f_data['char'], f_data['color'])

    def check_eat(self, head_x, head_y):
        for i, f in enumerate(self.foods):
            if f['x'] == head_x and f['y'] == head_y:
                return self.foods.pop(i)
        return None
