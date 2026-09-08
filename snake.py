# snake.py

from collections import deque
from settings import Colors, Chars

class Snake:
    def __init__(self, start_x, start_y):
        self.body = deque([(start_x, start_y), (start_x - 1, start_y), (start_x - 2, start_y)])
        self.direction = 'RIGHT'
        self.next_direction = 'RIGHT'
        self.grow_pending = 0
        
        # Temporary effects
        self.speed_multiplier = 1.0
        self.effect_timer = 0
        self.effect_duration = 0

    def get_head(self):
        return self.body[0]

    def set_direction(self, new_dir):
        # Prevent immediate 180 degree turns
        opposites = {'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT'}
        if new_dir in opposites and opposites[new_dir] != self.direction:
            self.next_direction = new_dir

    def update(self):
        self.direction = self.next_direction
        head_x, head_y = self.get_head()
        
        if self.direction == 'UP':
            head_y -= 1
        elif self.direction == 'DOWN':
            head_y += 1
        elif self.direction == 'LEFT':
            head_x -= 1
        elif self.direction == 'RIGHT':
            head_x += 1

        # Move body
        self.body.appendleft((head_x, head_y))
        
        if self.grow_pending > 0:
            self.grow_pending -= 1
        else:
            self.body.pop() # Remove tail if not growing
            
        # Update effects
        import time
        if self.effect_duration > 0:
            if time.time() - self.effect_timer > self.effect_duration:
                self.speed_multiplier = 1.0
                self.effect_duration = 0

    def apply_effect(self, multiplier, duration):
        import time
        self.speed_multiplier = multiplier
        self.effect_duration = duration
        self.effect_timer = time.time()

    def check_collision(self, board, mode):
        head_x, head_y = self.get_head()
        
        # Wall collision
        if not board.is_inside(head_x, head_y):
            if mode == "ENDLESS":
                # Wrap around logic is handled in game.py before this check usually,
                # but if not handled, return False to indicate it's fine.
                pass
            else:
                return True # Hit wall
                
        # Self collision (skip the first element which is head)
        for i, segment in enumerate(self.body):
            if i > 0 and segment == (head_x, head_y):
                return True
                
        return False

    def draw(self, renderer):
        for i, (x, y) in enumerate(self.body):
            if i == 0:
                color = Colors.SNAKE_HEAD
                char = Chars.SNAKE_HEAD
            else:
                # Gradient-like effect
                # Near head = bright, near tail = dim
                ratio = i / len(self.body)
                if ratio < 0.5:
                    color = Colors.SNAKE_BODY
                else:
                    color = Colors.SNAKE_TAIL
                char = Chars.SNAKE_BODY
                
            renderer.draw_char(x, y, char, color)
