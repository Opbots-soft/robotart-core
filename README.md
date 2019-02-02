# robotart-core
Control software for UBC OpenRobotics RobotArt project

## Getting Started
If you're new to the project, start by installing python - [Anaconda](https://www.anaconda.com/download/) is a good choice, and you can install it alongside other versions of Python if needed. We'll be using Python 3, so the easiest option is to install Anaconda3, which should be the default.

You'll also want an environment to edit and run the code. [PyCharm](https://www.jetbrains.com/pycharm/download/) is a good option - it provides things like auto-completion, and integrates well with Git. **Make sure to install the free (Community) edition!**

Next you'll want to clone this repository to a spot on your computer where you want to work on the project, open up PyCharm, and import the project by selecting the cloned folder.

## File Responsibilities

imgproc.py:     (Image -> Image)

imgabstract.py  (Image -> Abstraction)

control.py:     (Abstraction -> GCode

mech.py:        (GCode -> Machine)
