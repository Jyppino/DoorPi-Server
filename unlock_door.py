#!/usr/bin/python
import RPi.GPIO as GPIO
import time

# Config
RelayPin = 20 # Relay CH2
SecondsWait = 2

# Setup function
def setup():
    GPIO.setwarnings(False)
    # Set the GPIO modes to BCM numbering
    GPIO.setmode(GPIO.BCM)
    # Set RelayPin's mode to output,and initial level to LOW(0V)
    GPIO.setup(RelayPin,GPIO.OUT,initial=GPIO.HIGH)

# Main function
def main():        
    # Low output = open relay
    print('Doorlock open..')
    GPIO.output(RelayPin,GPIO.LOW)
    # Wait X seconds 
    time.sleep(SecondsWait)
    # High output = closed relay
    print('Doorlock neutral..')
    GPIO.output(RelayPin,GPIO.HIGH)
    # Cleanup
    destroy()

# Define a destroy function for clean up everything after the script finished
def destroy():
    # Turn off relay
    GPIO.output(RelayPin,GPIO.LOW)
    # Release resource
    GPIO.cleanup()

if __name__ == '__main__':
    setup()
    try:
        main()
    except KeyboardInterrupt: # Ctrl+C
        destroy()

    
