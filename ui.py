import time
from tkinter import *
from PIL import Image, ImageTk

from mech import MechControl
from control import Control
from imgproc import ImageProcessing
from camera import Camera


class DummyUI(Frame):
    """Placeholder UI - feel free to replace with a different framework (not tkinter)"""
    def create_widgets(self):
        self.camera_display = Label(master=self)
        self.camera_display.pack()
        self.quit_btn = Button(self)
        self.quit_btn["text"] = "Quit"
        self.quit_btn["command"] = self.quit
        self.quit_btn.pack({"side": "left"})
        self.capture_btn = Button(self)
        self.capture_btn["text"] = "Capture image"
        self.capture_btn["command"] = self.input_image
        self.capture_btn.pack({"side": "left"})
        self.proc_btn = Button(self)
        self.proc_btn["text"] = "Process image"
        self.proc_btn["command"] = self.run_processing
        self.proc_btn.pack({"side": "left"})
        self.start_btn = Button(self)
        self.start_btn["text"] = "Paint!"
        self.start_btn["command"] = self.start_painting
        self.start_btn.pack({"side": "left"})

    @staticmethod
    def create_ui():
        root = Tk()
        ui = DummyUI(root)
        root.protocol("WM_DELETE_WINDOW", ui.quit)
        return ui

    def __init__(self, master=None):
        super().__init__(master)
        self.root = master
        self.running = False
        self.camera_display = self.quit_btn = self.capture_btn = self.proc_btn = self.start_btn = None
        self.pack()
        self.create_widgets()
        # Init the modules
        self.camera = Camera()
        self.control = Control()
        self.mech = MechControl()
        self.imgproc = ImageProcessing()
        # State
        self.image = None
        self.tkimg = None
        # Timing
        self.last_frame_time = time.perf_counter()

    def input_image(self):
        # This should be called by a 'take image' button
        # Take an image from the camera
        self.image = self.camera.grab_image()
        # Display the image somehow?
        # Show 'process' button

    def run_processing(self):
        if self.image is not None:
            # Should be called by a 'process' button
            # Runs image processing to generate planned moves
            brush_strokes = self.imgproc.process_image(self.image)
            self.mech.set_moves(self.control.plan_moves(brush_strokes))
        else:
            print('Need to take an image!')

    def start_painting(self):
        print('Starting painting!')
        self.mech.activate()
        # Probably want to replace 'start' button with a 'stop' button here

    def run(self):
        self.running = True
        self.after(0, self.tick)
        self.root.mainloop()

    def quit(self):
        self.running = False
        self.root.destroy()
        super().quit()

    def tick(self):
        # Executes the real-time portion of the code
        # Measure elapsed time since last frame
        time_now = time.perf_counter()
        delta_time = time_now - self.last_frame_time
        self.last_frame_time = time_now

        # Display camera feed
        img = self.camera.grab_frame()
        self.tkimg = ImageTk.PhotoImage(image=Image.fromarray(img))
        self.camera_display.configure(image=self.tkimg)
        self.update()

        # Robot control
        self.mech.tick(delta_time)

        # Runs as frequently as possible
        if self.running:
            self.after(0, self.tick)
