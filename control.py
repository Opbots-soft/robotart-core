import time
import serial
import numpy as np

SERIAL_PORT = 'COM4'

BP = 3
UP = 0.75
BL = 2.74
UL = 3

CIRCUM_RADIUS = 0.5774
INSCRIBED_RADIUS = 0.2887
TICKS_PER_REV = 600

class Control(object):

    def __init__(self):
        self.ser = serial.Serial(SERIAL_PORT, 115200, timeout=0)

    def send_grbl(self, command):
        if command == 'quit':
            self.ser.close()
            return

        self.ser.write(command.encode('ascii') + '\n')
        time.sleep(0.5)

        out = bytes([])
        while self.ser.in_waiting > 0:
            out += self.ser.read(1)

        print(out.decode('ascii'))
