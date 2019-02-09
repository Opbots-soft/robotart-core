import numpy as np
import cv2
import matplotlib.pyplot as plt

class ImageProcessing:
    def __init__(self):
        pass
    
    
    # take the provided image (Either an OpenCV mat or Numpy array) and output some kind of abstraction
    def process_image(self, image):
        print('Image processing running')
        # perform some image processing to 'image'
        
        # Pass the new image to ImageAbstraction class, return the instance
        return ImageAbstraction(image)
    
    
    
    
class ImageAbstraction:
    
    STEPSIZE = 50
    
    class PointStruct:
        position = (0, 0)
        color = (0, 0, 0)
    
    def __init__(self, image):
        
        self.pointList = []
        
        self.generateAbstraction(image)
    
    # fill 'pointList' with pointStructs corresponding to the image given
    def generateAbstraction(self, image):
        
        dims = image.shape
        for x in range(0, dims[0], self.STEPSIZE):
            for y in range(0, dims[1], self.STEPSIZE):
                newPoint = self.PointStruct()
                newPoint.position = (x,y)
                newPoint.color = image[x,y] # Naive approach to pointilism- just get the pixel colors at the sample points.
                self.pointList.append(newPoint)
       
    # return an iterator on the list, so that 'for p in ImageAbstraction(img):' works
    def __iter__(self):
        return iter(self.pointList)
    



# Testing code; remove later

img = cv2.imread('test.png', cv2.IMREAD_COLOR)

result = ImageAbstraction(img)

x = []
y=[]
color=[]

for ps in result :
    x.append(ps.position[0])
    y.append(ps.position[1])
    color.append(ps.color)

color = list(map((lambda c : [c[2]/256, c[1]/256, c[0]/256]), color))
# Map from colors that are 0-255 to 0.0-1.0
# Also go from BGR to RGB


print(color)

plt.scatter(y,x, c=color)

plt.title("Pointillism Test", fontsize=19)

plt.xlabel("X value (px)", fontsize=10)

plt.ylabel("Y value (px)", fontsize=10)

plt.tick_params(axis='both', which='major', labelsize=9)

plt.show()