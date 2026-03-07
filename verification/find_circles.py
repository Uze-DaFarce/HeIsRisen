import cv2
import numpy as np

# This script was used to programmatically find the exact pixel coordinates
# of the circular placeholders on the new map background (assets/map/new-map.png).
# It uses OpenCV's HoughCircles to detect them and logs the coordinates so they
# can be used to update map_sections.json.

# Load image
img = cv2.imread('../assets/map/new-map.png')
output = img.copy()
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Apply blur to reduce noise
gray = cv2.medianBlur(gray, 5)

# Detect circles
circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1, minDist=20,
                           param1=50, param2=30, minRadius=10, maxRadius=100)

coords = []

if circles is not None:
    circles = np.uint16(np.around(circles))
    for i in circles[0, :]:
        coords.append((int(i[0]), int(i[1])))
        # draw the outer circle
        cv2.circle(output, (i[0], i[1]), i[2], (0, 255, 0), 2)
        # draw the center of the circle
        cv2.circle(output, (i[0], i[1]), 2, (0, 0, 255), 3)

    print("Found {} circles.".format(len(coords)))
    for c in coords:
        print("x: {}, y: {}".format(c[0], c[1]))
    cv2.imwrite('circles_detected.png', output)
else:
    print("No circles found.")
