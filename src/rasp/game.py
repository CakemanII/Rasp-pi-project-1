from random import randint
import threading
import datetime
import time

ADDITIONAL_BUTTONS_PER_ROUND: float = 1.0 / 3
INITIAL_BUTTON_COUNT: int = 3
BUTTON_COLORS: list[str] = ["red", "green", "blue"]

UPDATE_TIME_DELAY = 0.2 #ms


class ColorGame:
    def __init__(self, initial_lives: int, initial_time: float):
        # Initialize Variables
        self._lives: int = initial_lives
        self._round: int = 0
        self._seconds_remaining: float = 0
        self.elapsingTime: bool = False

        self._max_time: float = initial_time

        self._correctColors: list[str] = []
        self._correctInputCount: int = 0

        # Initialize elapse time thread
        self.initElapseTime()

    def initElapseTime(self):
        # Initialize the elapse time thread
        threading.Thread(target=self._elapseTime, daemon=True).start()

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

        # Return the colors
        return self._correctColors

    def _generateColors(self) -> list[str]:
        # Get total count of buttons
        totalButtons: int = INITIAL_BUTTON_COUNT + self.round * ADDITIONAL_BUTTONS_PER_ROUND
        
        # Get randomized list of colors
        colors: list[str] = []
        for _ in range(totalButtons):
            randomSelectedColor: str = BUTTON_COLORS[randint(0, BUTTON_COLORS.count)]
            colors.append(randomSelectedColor)

        # Return the colors
        return colors
    #endregion

    #region Input Handling
    def colorInput(self, selectedColor: str):
        # Check if the input is correct
        targetColor = self.correctColors[self.correctInputCount]
        if selectedColor == targetColor:
            self._correctInput()
        else:
            self._incorrectInput()

    def _correctInput(self):
        # Increment correct input count
        self.correctInputCount += 1

        # Check if the roudn is complete
        if self.isRoundComplete():
            self.startRound()

    def _incorrectInput(self):
        # Decrement Lives
        self.lives -= 1

        # Check for game over
        if self.isGameOver():
            self._gameOver()
    #endregion

    def _gameOver(self):
        # User lost
        pass

    #region Elapse Time Handling
    def _startElapseTime(self): self.elapsingTime = True
    def _stopElapseTime(self): self.elapsingTime = False

    def _elapseTime(self):
        """
        Reduce the remaining time by delta_time seconds.
        If time reaches 0 or below, trigger game over.
        
        Args:
            delta_time: Time in seconds to subtract from remaining time
        """
        previousTime = datetime.datetime.now()
        while not self.isGameOver():
            time.sleep(UPDATE_TIME_DELAY)
            if self.elapsingTime == False:
                continue

            currentTime = datetime.datetime.now()
            self._seconds_remaining -= ( currentTime - previousTime ).total_seconds()
            previousTime = currentTime
            
    #endregion

    #region Status Checkers
    def isRoundComplete(self) -> bool:
        # Check if the round is complete
        return self.correctColors.count == self.correctInputCount
    
    def isGameOver(self) -> bool:
        # Check if the game is over
        return self._lives <= 0 or self._seconds_remaining <= 0
    
    #endregion
    