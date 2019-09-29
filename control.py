# https://gamedev.stackexchange.com/questions/75756/sphere-sphere-intersection-and-circle-sphere-intersection
# Author: Kausik Krishnakumar

import time
import serial
import numpy as np

SERIAL_PORT = 'COM4'

BP = 3
UP = 0.75
BL = 2.74
UL = 3
TICKS_PER_REV = 600

CIRCUM_RADIUS = 0.5774
INSCRIBED_RADIUS = 0.2887
ORIGIN = np.zeros(3)
PI = np.pi

normalize = lambda x: x * 1/np.linalg.norm(x)

class Control(object):

    def __init__(self):
        pass
        # self.ser = serial.Serial(SERIAL_PORT, 115200, timeout=0)

    def send_grbl(self, command):
        pass
        # if command == 'quit':
        #     self.ser.close()
        #     return

        # self.ser.write(command.encode('ascii') + '\n')
        # time.sleep(0.5)

        # out = bytes([])
        # while self.ser.in_waiting > 0:
        #     out += self.ser.read(1)

        # print(out.decode('ascii'))

    def sphere_sphere(self, c1, r1, c2, r2):
        ''' Calculate intersection between two spheres 
        Args:   
                c1 - np.array of len=3, center of sphere
                r1 - float, radius of sphere
                c2 - np.array of len=3, center of sphere
                r2 - float, radius of sphere
        Returns: 
                center - np.array of len=3, center of intersecting circle
                normal - np.array of len=3, normal of circle
                radius - float, radius of circle
        '''
        d2 = np.linalg.norm(c2 - c1)**2
        h = 0.5 + (r1*r1 - r2*r2)/(2 * d2)

        center = c1 + h * (c2 - c1)
        radius = np.sqrt(r1*r1 - h*h*d2)
        normal = normalize(c1 - c2)

        return center, normal, radius

    def sphere_circle(self, c1, r1, c2, n2, r2):
        ''' Calculate intersections between a sphere and a circle
        Args:   
                c1 - np.array of len=3, center of sphere
                r1 - float, radius of sphere
                c2 - np.array of len=3, center of circle
                n2 - np.array of len=3, normal of circle
                r2 - float, radius of circle
        Returns:
                p0 - np.array of len=3, 1st intersection
                p1 - np.array of len=3, 2nd intersection
        '''
        d = np.dot(n2, c2 - c1)
        centerP = c1 + d * n2
        radiusP = np.sqrt(r1*r1 - d*d)

        centerI, normalI, radiusI = self.sphere_sphere(centerP, radiusP, c2, r2)
        tangent = normalize(np.cross(centerP - c2, n2))

        p0 = centerI + tangent * radiusI
        p1 = centerI - tangent * radiusI

        return p0, p1

    def calc_angles(self, pos):
        angles = np.zeros(3)
        for i in range(3):
            centerS = np.copy(pos)
            if i == 0:
                centerS = centerS + [0, CIRCUM_RADIUS * UP, 0]
                centerC = np.array([0, INSCRIBED_RADIUS * BP, 0])
            elif i == 1:
                centerS = centerS + [0.5 * UP, -INSCRIBED_RADIUS * UP, 0]
                centerC = np.array([0.25 * BP, (INSCRIBED_RADIUS - CIRCUM_RADIUS)/2 * BP, 0])
            elif i == 2:
                centerS = centerS + [-0.5 * UP, -INSCRIBED_RADIUS * UP, 0]
                centerC = np.array([-0.25 * BP, (INSCRIBED_RADIUS - CIRCUM_RADIUS)/2 * BP, 0])
            normal = normalize(np.array([-centerC[1], centerC[0], 0]))

            p0, p1 = self.sphere_circle(centerS, UL, centerC, normal, BL)

            angles[i] = PI - np.arccos(np.clip(np.dot(normalize(p1 - centerC), normalize(ORIGIN - centerC)), -1, 1))
            angles[i] = angles[i] * (-1 if p1[2] < 0 else 1)
        return angles

    def calc_plat_pos(self, angles):
        c0 = np.array([0, INSCRIBED_RADIUS * BP + np.cos(angles[0]) * BL, np.sin(angles[0]) * BL])
        c1 = np.array([0.25 * BP + np.cos(angles[1]) * np.cos(PI/6) * BL, (INSCRIBED_RADIUS - CIRCUM_RADIUS)/2 * BP - np.cos(angles[1]) * np.sin(PI/6) * BL, np.sin(angles[1]) * BL])
        c2 = np.array([-(0.25 * BP + np.cos(angles[2]) * np.cos(PI/6) * BL), (INSCRIBED_RADIUS - CIRCUM_RADIUS)/2 * BP - np.cos(angles[2]) * np.sin(PI/6) * BL, np.sin(angles[2]) * BL])
        c0 = c0 + [0, -CIRCUM_RADIUS * UP, 0]
        c1 = c1 + [-0.5 * UP, INSCRIBED_RADIUS * UP, 0]
        c2 = c2 + [0.5 * UP, INSCRIBED_RADIUS * UP, 0]

        center, normal, radius = self.sphere_sphere(c0, UL, c1, UL)
        p0, p1 = self.sphere_circle(c2, UL, center, normal, radius)

        return p1
