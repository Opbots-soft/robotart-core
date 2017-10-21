class ImageProcessing(object):
    def __init__(self):
        self.my_palette = Palette()
        self.img = None
        self.img_size = []
        self.current_px = [0, 0]
        self.layers = []
        self.completed = False

    def process_image(self):
        # take the provided image (Either an OpenCV mat or Numpy array) and output a list of brush strokes
        # print('Image processing running')
        print('Image processing completed')

        return self.layers

    def subsample_image(self, image):
        # Subsample the raw image
        print('Subsampling image...')
        self.img = []   # Image after subsampling
        self.img_size = [3, 3]  # Subsampled image size... [3,3] is placeholder

    def get_cluster_data(self, pixel_color):
        # Return the subcolors to use and the number of dots of each subcolor,
        # for a pixel of a given color
        print('Getting cluster data')
        return []

    def get_dot(self, pixel_coord, cluster_data):
        # Determine the coordinates of each dot in the cluster.
        # cluster_data is the subcolors in the cluster, as well as the number
        # of dots for each subcolor

        # When the coordinates for a dot is found, append the coordinate to the
        # appropriate color layer
        print('Getting dot')
        pass

    def get_layers(self):
        current_px_color = []
        self.get_dot(self.current_px, self.get_cluster_data(current_px_color))

        if self.current_px[0] < self.img_size[0]:
            self.current_px[0] += 1

            print(self.current_px)

        elif self.current_px[1] < self.img_size[1]:
            self.current_px[1] += 1
            self.current_px[0] = 0

            print(self.current_px)
        else:
            self.completed = True
            print('Layers completed')


class Palette:
    def __init__(self):
        self.available_paints = None

    def add_paint(self):
        print("Color added")
        self.available_paints = []

    def remove_paint(self):
        print("Color removed")

    def process_colors(self, image, num_colors=8):
        # Take the provided image and available paint colors and find
        # num_colors number of colors to use for the palette (max. 8)
        print("Getting palette...")
        return []


