import random
import threading
import datetime
import time
from led_controller import LEDController

ADDITIONAL_BUTTONS_PER_ROUND: float = 1.0 / 3
INITIAL_BUTTON_COUNT: int = 3
BUTTON_COLORS: list[str] = ["red", "green", "blue"]

UPDATE_TIME_DELAY = 0.2 #ms


class ColorGame:
    def __init__(self, initial_lives: int, initial_time: float):
        # Initialize Variables
        self._initial_lives: int = initial_lives

        self._lives: int = initial_lives
        self._round: int = 0
        self._seconds_remaining: float = 0
        self._elapsingTime: bool = False
        self._gameStarted: bool = False

        self._input_enabled: bool = False

        self._max_time: float = initial_time

        self._correctColors: list[str] = []
        self._correctInputCount: int = 0
        self._inCelebration: bool = False

        # Initialize elapse time thread
        self.initElapseTime()

        # Initialize LED Controller
        self.initLEDController()

    def initElapseTime(self):
        # Initialize the elapse time thread
        threading.Thread(target=self._elapseTime, daemon=False).start()

    def initLEDController(self):
        self._led_controller = LEDController()

    def getData(self):
        return {
            "lives": self._lives,
            "round": self._round,
            "correctInputCount": self._correctInputCount,
            "time_remaining": self._seconds_remaining
        }

    def startGame(self):
        '''
        Starts the game by initializing the first round.
        '''
        self._gameStarted = True
        self._startRound()

    #region Game Generation
    def _startRound(self):
        # Reset correct input count & time
        self._correctInputCount = 0
        self._seconds_remaining = self._max_time

        # Increment the round
        self._round += 1

        # Get the new colors
        self._correctColors = self._generateColors()

        # Flash the colors
        self._led_controller.flash_sequence(self._correctColors, flash_duration=0.6, pause_duration=0.3)

        # Start elapsing time
        self._startElapseTime()
        self._input_enabled = True

    def _generateColors(self) -> list[str]:
        # Get total count of buttons
        totalButtons: int = INITIAL_BUTTON_COUNT + int(self._round * ADDITIONAL_BUTTONS_PER_ROUND)
        
        # Get randomized list of colors
        colors: list[str] = []
        for _ in range(totalButtons):
            randomSelectedColor: str = BUTTON_COLORS[random.randint(0, len(BUTTON_COLORS) - 1)]
            colors.append(randomSelectedColor)

        # Return the colors
        print(colors)
        return colors
    #endregion

    #region Input Handling
    def colorInput(self, selectedColor: str):
        if not self._input_enabled:
            return
        # Check if the input is correct
        targetColor = self._correctColors[self._correctInputCount]
        if selectedColor == targetColor:
            self._correctInput()
        else:
            self._incorrectInput()

    def _correctInput(self):
        # Increment correct input count
        self._correctInputCount += 1

        # Check if the roudn is complete
        if self.isRoundComplete():
            # Pause elapsing time for a short celebration, then start next round
            self._stopElapseTime()
            self._input_enabled = False
            self._inCelebration = True
            # Schedule next round after 2 seconds (celebration)
            # Wait for LED to stop flashing
            while self._led_controller._flashing: time.sleep(0.1)
            self._led_controller.celebrate()
            time.sleep(2)

    def _incorrectInput(self):
        # Decrement Lives
        self._lives -= 1

        # Reset correct input count
        self._correctInputCount = 0

        # Check for game over
        if self.isGameOver():
            self._gameOver()
    #endregion

    def _gameOver(self):
        # User lost
        self._input_enabled = False
        pass

    #region Elapse Time Handling
    def _startElapseTime(self):
        self._elapsingTime = True
    
    def _stopElapseTime(self):
        self._elapsingTime = False

    def _elapseTime(self):
        """
        Reduce the remaining time by delta_time seconds.
        If time reaches 0 or below, trigger game over.
        
        Args:
            delta_time: Time in seconds to subtract from remaining time
        """
        previousTime = datetime.datetime.now()
        while not self.isGameOver() or self._gameStarted == False:
            time.sleep(UPDATE_TIME_DELAY)
            if self._elapsingTime == False:
                continue

            currentTime = datetime.datetime.now()
            self._seconds_remaining -= ( currentTime - previousTime ).total_seconds()
            previousTime = currentTime

    #endregion

    #region Status Checkers
    def isRoundComplete(self) -> bool:
        # Check if the round is complete
        return len(self._correctColors) == self._correctInputCount
    
    def isGameOver(self) -> bool:
        # Check if the game is over
        return self._lives <= 0 or self._seconds_remaining <= 0
    
    def hasGameStarted(self) -> bool:
        return self._gameStarted
    
    def isInputEnabled(self) -> bool:
        return self._input_enabled

    #endregion

    def resetGame(self):
        self._lives = self._initial_lives
        self._round = 0
        self._seconds_remaining = 0
        self._elapsingTime = False
        self._gameStarted = False
        self._correctColors = []
        self._correctInputCount = 0
