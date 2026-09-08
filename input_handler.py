# input_handler.py

import sys
import os
import time

try:
    # Windows
    import msvcrt
    IS_WINDOWS = True
except ImportError:
    # Linux / macOS
    import termios
    import tty
    import select
    IS_WINDOWS = False

class InputHandler:
    def __init__(self):
        self.old_settings = None
        if not IS_WINDOWS:
            self.fd = sys.stdin.fileno()
            self.old_settings = termios.tcgetattr(self.fd)
            tty.setcbreak(self.fd)

    def restore(self):
        if not IS_WINDOWS and self.old_settings:
            termios.tcsetattr(self.fd, termios.TCSADRAIN, self.old_settings)

    def get_input(self):
        """Returns the pressed key or None if no key was pressed."""
        if IS_WINDOWS:
            if msvcrt.kbhit():
                char = msvcrt.getch()
                if char in (b'\x00', b'\xe0'): # Special keys (arrows)
                    special = msvcrt.getch()
                    if special == b'H': return 'UP'
                    elif special == b'P': return 'DOWN'
                    elif special == b'K': return 'LEFT'
                    elif special == b'M': return 'RIGHT'
                else:
                    try:
                        return char.decode('utf-8').lower()
                    except UnicodeDecodeError:
                        return None
            return None
        else:
            # Linux non-blocking read
            dr, dw, de = select.select([sys.stdin], [], [], 0)
            if dr:
                char = sys.stdin.read(1)
                if char == '\x1b': # Escape sequence for arrows or ESC
                    dr2, dw2, de2 = select.select([sys.stdin], [], [], 0)
                    if dr2:
                        sys.stdin.read(1) # '['
                        arrow = sys.stdin.read(1)
                        if arrow == 'A': return 'UP'
                        elif arrow == 'B': return 'DOWN'
                        elif arrow == 'C': return 'RIGHT'
                        elif arrow == 'D': return 'LEFT'
                    else:
                        return 'esc'
                return char.lower()
            return None

# Mapping WASD to arrows to simplify game logic
KEY_MAPPINGS = {
    'w': 'UP',
    's': 'DOWN',
    'a': 'LEFT',
    'd': 'RIGHT',
    ' ': 'space',
    '\r': 'enter',
    '\n': 'enter',
    '\x1b': 'esc',
}

def normalize_key(key):
    if key in KEY_MAPPINGS:
        return KEY_MAPPINGS[key]
    return key
