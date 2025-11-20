from random import randint

ADDITIONAL_BUTTONS_PER_ROUND: float = 1.0 / 3
INITIAL_BUTTON_COUNT: int = 3
BUTTON_COLORS: list[str] = ["red", "green", "blue"]

class ColorGame:
    def __init__(self, initial_lives: int, initial_time: float):
        # Initialize Variables
        self.lives = initial_lives
        self.time = initial_time
        self.round = 0

    def startRound():
        pass

    def _generateColors(self) -> list[str]:
        # Get total count of buttons
        totalButtons: int = INITIAL_BUTTON_COUNT + self.round * ADDITIONAL_BUTTONS_PER_ROUND
        
        # Get randomized list of colors
        colors: list[str] = []
        for _ in range(totalButtons):
            randomSelectedColor: str = BUTTON_COLORS[randint(0, BUTTON_COLORS.count)]
            colors.append(randomSelectedColor)
        
