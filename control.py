class Control(object):

	red = (-1,-2)
	blue = (-2,-3)
	green = (-4,-5)

	def __init__(self):
		pass

	def plan_moves(self, brush_strokes):
		# Return a list of moves for mechanical control to execute the provided brush strokes
		print('Control planning moves')

		data = []

		brush_strokes.sort(key=lambda x: x[2][0]) # Sort by color
		print(brush_strokes)

		color = None
		for stroke in brush_strokes:
			
			if(color != stroke[2]):
				color = (stroke[2][0], stroke[2][1], 10)
				inColor = (stroke[2][0], stroke[2][1], 0)
				data.append(color)
				data.append(inColor)
				data.append(color)
				# print(color)
				# print(inColor)
				# print(color)

			above = (stroke[0], stroke[1], 10)
			canvas = (stroke[0], stroke[1], 0)

			data.append(above)
			data.append(canvas)
			data.append(above)

			# print(above)
			# print(canvas)
			# print(above)

		return data


	# Test
test = Control()
strokes = [(4,2,test.green),(3,2, test.green), (9,3,test.red), (1,5,test.blue)]
test.plan_moves(strokes)

