from gpiozero import LED
from time import sleep

LED_PINS = {
    "red": 17,
    "green": 27,
    "blue": 22
}

class LEDController:
    def __init__(self):
        self.leds = {color: LED(pin) for color, pin in LED_PINS.items()}

    def flash_sequence(self, colors: list[str], flash_duration: float = 0.5, pause_duration: float = 0.2):
        """Flash a sequence of colors on the LEDs."""
        for color in colors:
            if color in LED_PINS:
                led = self.leds[color]
                led.on()
                sleep(flash_duration)
                led.off()
                sleep(pause_duration)

    def celebrate(self, duration: float = 2.0, flash_interval: float = 0.2):
        """Flash all LEDs in a celebratory pattern."""
        end_time = sleep.time() + duration
        while sleep.time() < end_time:
            for led in self.leds.values():
                led.on()
            sleep(flash_interval)
            for led in self.leds.values():
                led.off()
            sleep(flash_interval)