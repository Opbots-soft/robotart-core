class ImageProcessing:
    def __init__(self):
        pass
    
    
    # take the provided image (Either an OpenCV mat or Numpy array) and output some kind of abstraction
    def process_image(self, image):
        print('Image processing running')
        # perform some image processing to 'image'
        
        
        return ImageAbstraction(image)
    
    
    
    
class ImageAbstraction:
    
    class pointStruct:
        position = (0.0, 0.0)
        color = 0
    
    def __init__(self, image):
        
        self.pointList = []
        
        self.generateAbstraction(image)
    
    # fill 'pointList' with pointStructs corresponding to the image given
    def generateAbstraction(self, image):
        return
       
    # return an iterator on the list, so that 'for p in ImageAbstraction(img):' works
    def __iter__(self):
        return iter(self.pointList)
    
        