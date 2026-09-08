# board.py

from settings import Chars, Colors

class Board:
    def __init__(self, renderer):
        self.r = renderer
        self.update_dimensions()
        
    def update_dimensions(self):
        # We need a minimum width and height, else show warning
        self.term_w = self.r.width
        self.term_h = self.r.height
        
        # Center the board
        self.w = min(100, self.term_w - 4)
        self.h = min(30, self.term_h - 10)
        
        self.x = (self.term_w - self.w) // 2
        self.y = (self.term_h - self.h) // 2 + 2 # Leave space for HUD
        
        # Playable area boundaries (exclusive of the walls)
        self.min_x = self.x + 1
        self.max_x = self.x + self.w - 2
        self.min_y = self.y + 1
        self.max_y = self.y + self.h - 2

    def draw(self, level_info):
        # Draw border
        color = Colors.BORDER
        
        # Horizontal lines
        for i in range(self.x + 1, self.x + self.w - 1):
            self.r.draw_char(i, self.y, Chars.BORDER_H, color)
            self.r.draw_char(i, self.y + self.h - 1, Chars.BORDER_H, color)
            
        # Vertical lines
        for i in range(self.y + 1, self.y + self.h - 1):
            self.r.draw_char(self.x, i, Chars.BORDER_V, color)
            self.r.draw_char(self.x + self.w - 1, i, Chars.BORDER_V, color)
            
        # Corners
        self.r.draw_char(self.x, self.y, Chars.CORNER_TL, color)
        self.r.draw_char(self.x + self.w - 1, self.y, Chars.CORNER_TR, color)
        self.r.draw_char(self.x, self.y + self.h - 1, Chars.CORNER_BL, color)
        self.r.draw_char(self.x + self.w - 1, self.y + self.h - 1, Chars.CORNER_BR, color)

    def is_inside(self, px, py):
        return self.min_x <= px <= self.max_x and self.min_y <= py <= self.max_y

    def wrap_around(self, px, py):
        if px < self.min_x: px = self.max_x
        elif px > self.max_x: px = self.min_x
        if py < self.min_y: py = self.max_y
        elif py > self.max_y: py = self.min_y
        return px, py
