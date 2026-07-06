from ultralytics import YOLO
import cv2
import winsound

# Load YOLO Model
model = YOLO("yolov8n.pt")

# Hazard objects
hazards = {
    "person": "PERSON ON ROAD",
    "car": "VEHICLE AHEAD",
    "truck": "TRUCK AHEAD",
    "bus": "BUS AHEAD",
    "motorcycle": "BIKE AHEAD",
    "bicycle": "BICYCLE AHEAD",
    "dog": "ANIMAL ON ROAD",
    "cow": "ANIMAL ON ROAD",
    "horse": "ANIMAL ON ROAD"
}

cap = cv2.VideoCapture(0)

last_alert = ""

while True:

    ret, frame = cap.read()

    if not ret:
        break

    h, w, _ = frame.shape

    # ---------------------------------------
    # Wider Lane (60% of screen)
    # ---------------------------------------
    LANE_WIDTH = 0.60

    lane_left = int(w * (1 - LANE_WIDTH) / 2)
    lane_right = int(w * (1 + LANE_WIDTH) / 2)

    # Draw transparent lane region
    overlay = frame.copy()

    cv2.rectangle(
        overlay,
        (lane_left, 0),
        (lane_right, h),
        (255, 255, 0),
        -1
    )

    alpha = 0.20
    frame = cv2.addWeighted(overlay, alpha, frame, 1-alpha, 0)

    # Draw lane borders
    cv2.line(frame,(lane_left,0),(lane_left,h),(255,255,0),4)
    cv2.line(frame,(lane_right,0),(lane_right,h),(255,255,0),4)

    results = model(frame, verbose=False)

    warning = ""
    color = (0,255,0)

    for r in results:

        for box in r.boxes:

            cls = int(box.cls[0])
            name = model.names[cls]

            if name not in hazards:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])

            bw = x2 - x1
            bh = y2 - y1

            area = bw * bh

            center_x = (x1 + x2)//2

            # Draw bounding box
            cv2.rectangle(frame,(x1,y1),(x2,y2),(0,255,0),2)

            cv2.putText(
                frame,
                name,
                (x1,y1-10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0,255,0),
                2
            )

            # Draw center point
            cv2.circle(frame,(center_x,(y1+y2)//2),5,(255,0,255),-1)

            # Ignore objects outside lane
            if not (lane_left < center_x < lane_right):
                continue

            # -------------------------------
            # Alert Levels
            # -------------------------------

            if area > 45000:

                warning = "DANGER : " + hazards[name]
                color = (0,0,255)

            elif area > 25000:

                warning = "CAUTION : " + hazards[name]
                color = (0,165,255)

            elif area > 12000:

                warning = "OBJECT AHEAD : " + hazards[name]
                color = (0,255,255)

    # ----------------------------
    # Warning Banner
    # ----------------------------

    if warning != "":

        cv2.rectangle(frame,(0,0),(w,90),color,-1)

        cv2.putText(
            frame,
            warning,
            (20,55),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (255,255,255),
            3
        )

        if warning != last_alert:

            if "DANGER" in warning:

                winsound.Beep(1500,500)

            elif "CAUTION" in warning:

                winsound.Beep(1000,300)

            else:

                winsound.Beep(700,200)

            last_alert = warning

    else:

        last_alert = ""

    cv2.putText(
        frame,
        "Press Q to Exit",
        (10,h-15),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255,255,255),
        2
    )

    cv2.imshow("SafeRoute AI", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()