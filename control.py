import serial, time

class Control(object):

    def __init__(self):
        self.ser = serial.Serial('COM4', 115200, timeout=0)

    def plan_moves(self, brush_strokes):
        # Return a list of moves for mechanical control to execute the provided brush strokes
        print('Control planning moves')

        data = []

        brush_strokes.sort()
        for stroke in brush_strokes:
        	above = (stroke[0], stroke[1], 10)
        	canvas = (stroke[0], stroke[1], 0)

        	print(above)
        	print(canvas)
        	data.append(above)
        	data.append(canvas)

        return data

    def set_dimensions(self, baseSideLength, baseLegLength, platLegLength, platSideLength):
        self.SB = baseSideLength                # Sidelengths of base
        self.LB = baseLegLength                 # Length of legs connected to base
        self.LP = platLegLength                 # Length of legs connected to moving platform
        self.SP = platSideLength                # Sidelengths of moving platform
        self.wb = root_three/6 * self.SB
        self.ub = self.SB / root_three
        self.wp = root_three / 6 * self.SP
        self.up = self.SP / root_three
        self.a = self.wb - self.up
        self.b = self.SP/2 - root_three/2 * self.wb
        self.c = self.wp - self.wb/2
        self.theta1 = 0
        self.theta2 = 0
        self.theta3 = 0

    def calc_angles(self, x, y, z):
        F = 2*z*self.LB

        E1 = 2*self.LB*(y + self.a)
        G1 = x**2 + y**2 + z**2 + self.a**2 + self.LB**2 + 2*y*self.a - self.LP**2

        E2 = -self.LB*(root_three*(x + self.b) + y + self.c)
        G2 = x**2 + y**2 + z**2 + self.b**2 + self.c**2 + self.LB**2 + 2*(x*self.b + y*self.c)  - self.LP**2

        E3 = self.LB*(root_three*(x - self.b) - y - self.c)
        G3 = x**2 + y**2 + z**2 + self.b**2 +  self.c**2 + self.LB**2 + 2*(-x*self.b + y*self.c) - self.LP**2

        t1 = 180/math.pi * 2 * math.atan((-F + (E1**2 + F**2 - G1**2)**0.5)/(G1 - E1))
        if t1 > 90:
            t1 = 180/math.pi * 2 * math.atan((-F - (E1**2 + F**2 - G1**2)**0.5)/(G1 - E1))

        t2 = 180/math.pi * 2 * math.atan((-F + (E1**2 + F**2 - G1**2)**0.5)/(G1 - E1))
        if t2 > 90:
            t2 = 180/math.pi * 2 * math.atan((-F - (E1**2 + F**2 - G1**2)**0.5)/(G1 - E1))

        t3 = 180/math.pi * 2 * math.atan((-F + (E1**2 + F**2 - G1**2)**0.5)/(G1 - E1))
        if t3 > 90:
            t3 = 180/math.pi * 2 * math.atan((-F - (E1**2 + F**2 - G1**2)**0.5)/(G1 - E1))

        return t1, t2, t3

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


'''
# Test
test = Control()
color = (1,2)
strokes = [(4,2,color), (9,3,color), (1,5,color)]
test.plan_moves(strokes)
'''

'''
$0=244
$1=25
$2=0
$3=0
$4=0
$5=0
$6=0
$10=1
$11=0.010
$12=0.002
$13=0
$20=0
$21=0
$22=0
$23=0
$24=25.000
$25=500.000
$26=250
$27=1.000
$30=1000
$31=0
$32=0
$100=1.000
$101=250.000
$102=250.000
$110=2147483.648
$111=500.000
$112=500.000
$120=10.000
$121=10.000
$122=10.000
$130=2147483.648
$131=200.000
$132=200.000
'''