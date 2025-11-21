from gpiozero import LED
from time import sleep
import datetime

LED_PINS = {
    "blue": 17,
    "green": 27,
    "red": 22
}

class LEDController:
    def __init__(self):
        self.leds = {color: LED(pin) for color, pin in LED_PINS.items()}
        self._flashing = False

    def flash_sequence(self, colors: list[str], flash_duration: float = 0.5, pause_duration: float = 0.2):
        """Flash a sequence of colors on the LEDs."""
        if self._flashing:
            return  # Prevent overlapping flashes
        self._flashing = True
        for color in colors:
            if color in LED_PINS:
                led = self.leds[color]
                led.on()
                sleep(flash_duration)
                led.off()
                sleep(pause_duration)
        self._flashing = False

    def celebrate(self):
        """Flash all LEDs in a celebratory pattern."""
        self._flashing = True
        for _ in range(3):
            for led in self.leds.values():
                led.on()
            sleep(0.2)
            for led in self.leds.values():
                led.off()
            sleep(0.2)
        self._flashing = False
