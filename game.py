# game.py

import time
from board import Board
from snake import Snake
from food import FoodManager
from score_manager import ScoreManager
from achievements import AchievementManager
from settings import Colors, Chars, LEVELS, MODE_CLASSIC, MODE_ENDLESS, BASE_TICK_RATE, MIN_TICK_RATE

class GameState:
    MENU = 0
    PLAYING = 1
    PAUSED = 2
    GAME_OVER = 3

class Game:
    def __init__(self, renderer, input_handler):
        self.renderer = renderer
        self.input = input_handler
        self.state = GameState.MENU
        
        self.board = Board(self.renderer)
        self.score_manager = ScoreManager()
        self.achievements = AchievementManager()
        
        self.mode = MODE_CLASSIC
        self.level = 1
        
        self.snake = None
        self.food_manager = None
        self.last_tick = 0
        self.menu_selection = 0
        self.game_over_time = 0
        
    def start_game(self):
        self.board.update_dimensions()
        # Start snake in middle
        start_x = self.board.x + self.board.w // 2
        start_y = self.board.y + self.board.h // 2
        self.snake = Snake(start_x, start_y)
        self.food_manager = FoodManager(self.board)
        self.food_manager.spawn(self.snake.body, force_type="NORMAL")
        self.score_manager.score = 0
        self.score_manager.combo = 1
        self.level = 1
        self.state = GameState.PLAYING
        self.last_tick = time.time()
        
    def process_input(self, key):
        if not key: return
        
        if self.state == GameState.MENU:
            if key == 'UP': self.menu_selection = max(0, self.menu_selection - 1)
            elif key == 'DOWN': self.menu_selection = min(3, self.menu_selection + 1)
            elif key == 'enter':
                if self.menu_selection == 0: self.start_game()
                elif self.menu_selection == 3: return False # Exit
                
        elif self.state == GameState.PLAYING:
            if key in ('UP', 'DOWN', 'LEFT', 'RIGHT'):
                self.snake.set_direction(key)
            elif key == 'esc' or key == 'space':
                self.state = GameState.PAUSED
                
        elif self.state == GameState.PAUSED:
            if key == 'UP': self.menu_selection = max(0, self.menu_selection - 1)
            elif key == 'DOWN': self.menu_selection = min(2, self.menu_selection + 1)
            elif key == 'enter':
                if self.menu_selection == 0: self.state = GameState.PLAYING
                elif self.menu_selection == 1: self.start_game()
                elif self.menu_selection == 2: self.state = GameState.MENU; self.menu_selection = 0
            elif key == 'esc':
                self.state = GameState.PLAYING
                
        elif self.state == GameState.GAME_OVER:
            if time.time() - self.game_over_time > 1.0: # prevent accidental skip
                if key == 'enter' or key == 'esc':
                    self.state = GameState.MENU
                    self.menu_selection = 0
        return True

    def update(self):
        if self.state != GameState.PLAYING:
            return
            
        current_time = time.time()
        
        # Calculate tick rate
        level_mult = LEVELS.get(self.level, LEVELS[max(LEVELS.keys())])["speed_multiplier"]
        tick_rate = BASE_TICK_RATE / (level_mult * self.snake.speed_multiplier)
        tick_rate = max(MIN_TICK_RATE, tick_rate)
        
        if current_time - self.last_tick > tick_rate:
            self.last_tick = current_time
            
            self.snake.update()
            
            # Wrap around for endless
            if self.mode == MODE_ENDLESS:
                head_x, head_y = self.snake.get_head()
                new_x, new_y = self.board.wrap_around(head_x, head_y)
                if (new_x, new_y) != (head_x, head_y):
                    # Re-adjust head position
                    self.snake.body[0] = (new_x, new_y)
            
            # Collision
            if self.snake.check_collision(self.board, self.mode):
                self.state = GameState.GAME_OVER
                self.game_over_time = time.time()
                self.score_manager.add_high_score("PLAYER", self.level)
                return
                
            # Food eat
            head_x, head_y = self.snake.get_head()
            eaten = self.food_manager.check_eat(head_x, head_y)
            if eaten:
                from settings import FOOD_TYPES
                f_data = FOOD_TYPES[eaten['type']]
                self.score_manager.add_score(f_data['points'])
                self.score_manager.increment_combo()
                self.snake.grow_pending += 1
                
                # Handle special foods
                if eaten['type'] == 'SPEED':
                    self.snake.apply_effect(1.5, 5.0)
                elif eaten['type'] == 'SLOW':
                    self.snake.apply_effect(0.7, 5.0)
                    
                # Level up logic
                new_level = (self.score_manager.score // 200) + 1
                if new_level > self.level:
                    self.level = new_level
                    
            self.food_manager.update()
            self.score_manager.update_combo()
            self.achievements.check(self, self.snake)

    def draw_hud(self):
        hud_color = Colors.HUD_TEXT
        
        # Title
        self.renderer.draw_text(self.board.x + 2, self.board.y - 2, "SNAKE // NEON HUNT", Colors.NEON_MAGENTA + Colors.BOLD)
        
        # Score & High Score
        score_str = f"SCORE {self.score_manager.score:06d}"
        hs_str = f"HIGH SCORE {self.score_manager.get_high_score():06d}"
        self.renderer.draw_text(self.board.x + 2, self.board.y - 1, score_str, hud_color)
        self.renderer.draw_text(self.board.x + self.board.w - len(hs_str) - 2, self.board.y - 1, hs_str, hud_color)
        
        # Level & Combo
        lvl_name = LEVELS.get(self.level, LEVELS[max(LEVELS.keys())])["name"]
        lvl_str = f"LEVEL {self.level:02d} [{lvl_name}]"
        self.renderer.draw_text(self.board.x + 2, self.board.y + self.board.h, lvl_str, hud_color)
        
        if self.score_manager.combo > 1:
            combo_str = f"COMBO x{self.score_manager.combo}"
            self.renderer.draw_text(self.board.x + self.board.w - len(combo_str) - 2, self.board.y + self.board.h, combo_str, Colors.NEON_YELLOW)
            
        # Achievements
        ach = self.achievements.get_display()
        if ach:
            ach_str = f"ACHIEVEMENT: {ach['name']} - {ach['desc']}"
            self.renderer.draw_text(self.board.x + (self.board.w - len(ach_str)) // 2, self.board.y + self.board.h + 1, ach_str, Colors.NEON_GREEN)

    def draw_menu(self):
        self.renderer.clear_buffer()
        cy = self.renderer.height // 2
        cx = self.renderer.width // 2
        
        title = [
            "███████╗███╗   ██╗ █████╗ ██╗  ██╗███████╗",
            "██╔════╝████╗  ██║██╔══██╗██║ ██╔╝██╔════╝",
            "███████╗██╔██╗ ██║███████║█████╔╝ █████╗  ",
            "╚════██║██║╚██╗██║██╔══██║██╔═██╗ ██╔══╝  ",
            "███████║██║ ╚████║██║  ██║██║  ██╗███████╗",
            "╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝",
            "                                          ",
            "           // N E O N   H U N T //        "
        ]
        
        for i, line in enumerate(title):
            self.renderer.draw_text(cx - 21, cy - 8 + i, line, Colors.NEON_CYAN + Colors.BOLD)
            
        options = ["PLAY", "HIGH SCORES", "SETTINGS", "EXIT"]
        for i, opt in enumerate(options):
            color = Colors.NEON_MAGENTA if i == self.menu_selection else Colors.HUD_TEXT
            prefix = "> " if i == self.menu_selection else "  "
            self.renderer.draw_text(cx - 5, cy + 3 + i, prefix + opt, color)

    def draw_paused(self):
        cx = self.renderer.width // 2
        cy = self.renderer.height // 2
        
        # Simple dim box
        box_w = 20
        box_h = 8
        for y in range(cy - box_h//2, cy + box_h//2):
            for x in range(cx - box_w//2, cx + box_w//2):
                self.renderer.draw_char(x, y, " ", Colors.BG_DARK)
                
        self.renderer.draw_text(cx - 3, cy - 2, "PAUSED", Colors.NEON_YELLOW + Colors.BOLD)
        options = ["RESUME", "RESTART", "MAIN MENU"]
        for i, opt in enumerate(options):
            color = Colors.NEON_MAGENTA if i == self.menu_selection else Colors.HUD_TEXT
            prefix = "> " if i == self.menu_selection else "  "
            self.renderer.draw_text(cx - 5, cy + i, prefix + opt, color)

    def draw_game_over(self):
        cx = self.renderer.width // 2
        cy = self.renderer.height // 2
        
        # Keep the background (the final frame is still in the buffer), just draw overlay
        box_w = 30
        box_h = 10
        for y in range(cy - box_h//2, cy + box_h//2):
            for x in range(cx - box_w//2, cx + box_w//2):
                self.renderer.draw_char(x, y, " ", Colors.BG_DARK)
                
        self.renderer.draw_text(cx - 7, cy - 3, "CONNECTION LOST", Colors.NEON_RED + Colors.BOLD)
        self.renderer.draw_text(cx - 8, cy - 1, f"SCORE: {self.score_manager.score:06d}", Colors.HUD_TEXT)
        self.renderer.draw_text(cx - 8, cy, f"LEVEL: {self.level:02d}", Colors.HUD_TEXT)
        
        if self.score_manager.is_high_score():
            self.renderer.draw_text(cx - 7, cy + 2, "★ NEW RECORD ★", Colors.NEON_YELLOW + Colors.BOLD)
            
        if time.time() - self.game_over_time > 1.0:
            if int(time.time() * 2) % 2 == 0:
                self.renderer.draw_text(cx - 9, cy + 4, "PRESS ENTER TO CONTINUE", Colors.DIM)

    def draw(self):
        if self.state == GameState.MENU:
            self.draw_menu()
        else:
            self.renderer.clear_buffer()
            self.board.draw(self.level)
            self.food_manager.draw(self.renderer)
            self.snake.draw(self.renderer)
            self.draw_hud()
            
            if self.state == GameState.PAUSED:
                self.draw_paused()
            elif self.state == GameState.GAME_OVER:
                self.draw_game_over()
        
        self.renderer.render()
