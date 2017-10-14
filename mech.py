class MechControl(object):
    def __init__(self):
        # Runs once when the module is "created"
        self.moves = []
        self.active = False
        self

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
