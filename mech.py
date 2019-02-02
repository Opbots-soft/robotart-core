import serial

class MechControl(object):
    def __init__(self):
        # Runs once when the module is "created"
        self.moves = []
        self.active = False
        self.ser = serial.Serial('COM4', 115200, timeout=0)


    def set_moves(self, moves):
        self.moves = moves

    def activate(self):
        if self.active:
            return
        self.active = True
        # Enable motors etc

    def deactivate(self):
        if not self.active:
            return
        self.active = False
        # Disable motors etc

    def tick(self, delta_time):
        # Execute moves in the self.moves list bit-by-bit - this function gets called repeatedly!
        # Don't want to just run a loop here - the UI would become unresponsive until the robot finished painting!
        if self.active:
            # Send commands to the robot!
            print('Mech control update')

    def send_grbl(self, command):
        if command == 'quit':
            self.ser.close()
            break

        self.ser.write(command.encode('ascii') + '\n')
        time.sleep(0.5)

        out = bytes([])
        while self.ser.in_waiting > 0:
            out += self.ser.read(1)

        print(out.decode('ascii'))