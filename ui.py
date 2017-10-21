import time
from tkinter import *

from mech import MechControl
from control import Control
from imgproc import ImageProcessing
from camera import Camera


class DummyUI(Frame):
    """Placeholder UI - feel free to replace with a different framework (not tkinter)"""
    def create_widgets(self):
        self.quit_btn = Button(self)
        self.quit_btn["text"] = "Quit"
        self.quit_btn["command"] = self.quit
        self.quit_btn.pack({"side" : "left"})
        self.colors_btn = Button(self)
        self.colors_btn["text"] = "Edit paints"
        self.colors_btn["command"] = self.edit_paints
        self.colors_btn.pack({"side": "left"})
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

    def __init__(self, master=None):
        super().__init__(master)
        self.quit_btn = self.colors_btn = self.capture_btn = self.proc_btn = self.start_btn = None
        self.pack()
        self.create_widgets()
        # Init the modules
        self.camera = Camera()
        self.control = Control()
        self.mech = MechControl()
        self.imgproc = ImageProcessing()
        # State
        self.image = None
        # Timing
        self.last_frame_time = time.perf_counter()

    def edit_paints(self):
        # Edit what paints are available for the robot to use. Maybe
        # later we can just take photos of the paints so the robot
        # automatically detects the colors and puts it in the program...
        self.imgproc.my_palette.add_paint()
        self.imgproc.my_palette.remove_paint()
        # Probably display the paint colors and have add/remove buttons?

    def input_image(self):
        # This should be called by a 'take image' button
        # Take an image from the camera
        self.image = self.camera.grab_image()
        # Display the image somehow?
        # Show 'process' button

    def run_processing(self):
        if self.image is not None \
                and self.imgproc.my_palette.available_paints is not None:
            # Should be called by a 'process' button
            # Runs image processing to generate planned moves

            self.imgproc.subsample_image(self.image)
            self.imgproc.my_palette.process_colors(self.imgproc.img, num_colors=8)
            self.generate_layers()

            brush_strokes = self.imgproc.process_image()
            self.mech.set_moves(self.control.plan_moves(brush_strokes))
        elif self.image is None:
            print('Need to take an image!')
        else:
            print('Need to add paints!')

    def generate_layers(self):
        # Use this as loop to keep UI responsive???
        self.imgproc.get_layers()

        if not self.imgproc.completed:
            self.after(0, self.generate_layers)

    def start_painting(self):
        print('Starting painting!')
        self.mech.activate()
        # Probably want to replace 'start' button with a 'stop' button here

    def tick(self):
        # Executes the real-time portion of the code
        # Measure elapsed time since last frame
        time_now = time.perf_counter()
        delta_time = time_now - self.last_frame_time
        self.last_frame_time = time_now

        # Robot control
        self.mech.tick(delta_time)

        # Runs as frequently as possible
        self.after(0, self.tick)
