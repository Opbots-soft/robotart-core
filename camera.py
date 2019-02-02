import cv2


class Camera(object):
    def __init__(self):
        # Probably want to initialize an OpenCV camera in self.cam or similar
        self.cap = cv2.VideoCapture(0)
        self.latest_frame = None

    def grab_frame(self):
        ret, frame = self.cap.read()
        # convert to RGB
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        self.latest_frame = frame
        return frame
