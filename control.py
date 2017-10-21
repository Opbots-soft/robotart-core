class Control(object):
    def __init__(self):
        pass

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

'''
# Test
test = Control()
color = (1,2)
strokes = [(4,2,color), (9,3,color), (1,5,color)]
test.plan_moves(strokes)
'''
