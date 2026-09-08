# renderer.py

import sys
import shutil
from settings import Colors

class Renderer:
    def __init__(self):
        self.width, self.height = shutil.get_terminal_size()
        self.buffer = [[" " for _ in range(self.width)] for _ in range(self.height)]
        self.prev_buffer = [[" " for _ in range(self.width)] for _ in range(self.height)]
        self.force_redraw = True

    def init_terminal(self):
        sys.stdout.write(Colors.CLEAR)
        sys.stdout.write(Colors.HIDE_CURSOR)
        sys.stdout.flush()

    def restore_terminal(self):
        sys.stdout.write(Colors.SHOW_CURSOR)
        sys.stdout.write(Colors.RESET)
        sys.stdout.write("\033[1;1H\n") # Move cursor to top left and newline
        sys.stdout.flush()

    def update_terminal_size(self):
        new_width, new_height = shutil.get_terminal_size()
        if new_width != self.width or new_height != self.height:
            self.width = new_width
            self.height = new_height
            self.buffer = [[" " for _ in range(self.width)] for _ in range(self.height)]
            self.prev_buffer = [[" " for _ in range(self.width)] for _ in range(self.height)]
            self.force_redraw = True
            sys.stdout.write(Colors.CLEAR)

    def clear_buffer(self):
        for y in range(self.height):
            for x in range(self.width):
                self.buffer[y][x] = " "

    def draw_text(self, x, y, text, color=Colors.RESET):
        """Draws text directly into the buffer, handling ANSI codes internally."""
        if y < 0 or y >= self.height:
            return
        
        # To handle colors, we store (char, color) in the buffer.
        # But for simplicity and speed, our buffer just stores the literal string to print
        # at that cell. A cell could contain an ANSI sequence + char + RESET.
        
        # Calculate visual length of text (ignoring ANSI)
        for i, char in enumerate(text):
            if 0 <= x + i < self.width:
                self.buffer[y][x+i] = f"{color}{char}{Colors.RESET}"

    def draw_char(self, x, y, char, color=Colors.RESET):
        if 0 <= y < self.height and 0 <= x < self.width:
            self.buffer[y][x] = f"{color}{char}{Colors.RESET}"

    def render(self):
        out = []
        for y in range(self.height):
            for x in range(self.width):
                # If force redraw, or if the cell changed
                if self.force_redraw or self.buffer[y][x] != self.prev_buffer[y][x]:
                    # Move cursor to (y+1, x+1) - 1-based indexing
                    out.append(f"\033[{y+1};{x+1}H{self.buffer[y][x]}")
                    self.prev_buffer[y][x] = self.buffer[y][x]
        
        if out:
            sys.stdout.write("".join(out))
            sys.stdout.flush()
        
        self.force_redraw = False
