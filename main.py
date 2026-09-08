# main.py

import sys
import time
import traceback
from renderer import Renderer
from input_handler import InputHandler, normalize_key
from game import Game

def main():
    renderer = Renderer()
    input_handler = InputHandler()
    
    try:
        renderer.init_terminal()
        
        game = Game(renderer, input_handler)
        
        # Simple Boot Sequence
        boot_msgs = [
            "INITIALIZING NEURAL GRID...",
            "LOADING MOVEMENT ENGINE...",
            "CALIBRATING REFLEX SYSTEM...",
            "SYSTEM READY."
        ]
        
        cx, cy = renderer.width // 2, renderer.height // 2
        for i, msg in enumerate(boot_msgs):
            renderer.clear_buffer()
            renderer.draw_text(cx - len(msg)//2, cy, msg, "\033[38;2;0;255;255m")
            renderer.render()
            time.sleep(0.4)
            
        running = True
        while running:
            # Check terminal size changes
            renderer.update_terminal_size()
            
            # Input
            raw_key = input_handler.get_input()
            if raw_key:
                key = normalize_key(raw_key)
                if key == 'q' and game.state == 0:
                    break
                running = game.process_input(key)
                if running is False:
                    break
                    
            # Logic Update
            game.update()
            
            # Render
            game.draw()
            
            # Throttle loop to prevent 100% CPU (not using blocking sleep for input responsiveness)
            time.sleep(0.01)

    except KeyboardInterrupt:
        pass
    except Exception as e:
        # Save crash log
        with open("crash_log.txt", "w") as f:
            f.write(traceback.format_exc())
    finally:
        renderer.restore_terminal()
        input_handler.restore()

if __name__ == "__main__":
    main()
