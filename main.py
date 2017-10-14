from tkinter import Tk
from ui import DummyUI

if __name__ == "__main__":
    print('Starting application')
    root = Tk()
    app = DummyUI(master=root)
    app.after(500, app.tick)
    # Run loop "forever" - until the application quits
    app.mainloop()
    # When loop is finished (we quit), clean up
    root.destroy()
