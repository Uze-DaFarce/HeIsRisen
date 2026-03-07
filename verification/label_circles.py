import cv2
import numpy as np

# Load image
img = cv2.imread('assets/map/new-map.png')
output = img.copy()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Apply blur to reduce noise
gray = cv2.medianBlur(gray, 5)

# Detect circles. We are looking for the 11 large target circles with a specific thick border.
# Tuning parameters to find exactly 11 circles:
circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1, minDist=100,
                           param1=50, param2=45, minRadius=40, maxRadius=60)

if circles is not None:
    circles = np.uint16(np.around(circles))
    # sort by y, then by x just for consistent labeling
    circle_list = list(circles[0, :])
    circle_list.sort(key=lambda c: c[0])

    for idx, i in enumerate(circle_list):
        # draw the outer circle
        cv2.circle(output, (i[0], i[1]), i[2], (0, 255, 0), 2)
        # put text label
        cv2.putText(output, str(idx), (i[0]-10, i[1]+10), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)

    cv2.imwrite('verification/circles_labeled.png', output)
    print("Labeled {} circles.".format(len(circle_list)))
    for idx, c in enumerate(circle_list):
        print("Circle {}: x={}, y={}".format(idx, c[0], c[1]))
else:
    print("No circles found.")
