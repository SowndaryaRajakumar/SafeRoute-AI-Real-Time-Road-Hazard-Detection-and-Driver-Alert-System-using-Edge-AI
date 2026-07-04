# SafeRoute AI – Real-Time Road Hazard Detection and Driver Alert System

## Overview

SafeRoute AI is an AI-powered driver assistance system that improves road safety by detecting road hazards in real time and providing instant alerts to drivers. The system combines Computer Vision, Edge AI, and Machine Learning to identify potential dangers such as potholes, animals, vehicles, and obstacles on the road.

In addition to hazard detection, SafeRoute AI integrates a crime prediction module that helps users identify high-risk areas and choose safer travel routes.

This project is being developed as part of the **Tata Technologies InnoVent Challenge** under the category **AI at the Edge Solutions for Automotive**.

---

## Features

- 🚗 Real-time road hazard detection using YOLOv8
- 🕳️ Pothole detection
- 🐄 Animal detection (Dog, Cow, Horse, etc.)
- 🚧 Obstacle detection (Vehicles, Trucks, Bikes, Pedestrians)
- 🔊 Voice and visual alerts for detected hazards
- 📍 Crime prediction based on location
- 🖥️ Simple dashboard for monitoring hazards
- ⚡ Edge AI compatible for Raspberry Pi and NVIDIA Jetson devices

---

## Project Workflow

```
Camera Input
      │
      ▼
YOLOv8 Object Detection
      │
      ├── Potholes
      ├── Animals
      ├── Vehicles
      └── Obstacles
      │
      ▼
Hazard Detection Module
      │
      ▼
Voice & Visual Alerts
      │
      ▼
Crime Prediction Module
      │
      ▼
Driver Dashboard
```

---

## Technologies Used

- Python
- YOLOv8 (Ultralytics)
- OpenCV
- NumPy
- Flask / Streamlit
- Machine Learning
- Computer Vision

---

## Future Improvements

- GPS-based navigation
- Live Google Maps integration
- Automatic emergency alerts
- Cloud synchronization
- Mobile application
- Smart traffic analytics
- Driver fatigue detection

---

## Project Structure

```
SafeRouteAI/
│
├── app.py
├── detect.py
├── crime_prediction.py
├── models/
├── weights/
├── static/
├── templates/
├── videos/
├── requirements.txt
└── README.md
```

---

## Applications

- Smart Transportation
- Advanced Driver Assistance Systems (ADAS)
- Smart Cities
- Road Safety Monitoring
- Fleet Management
- Highway Surveillance

---

## Acknowledgements

- Ultralytics YOLOv8
- OpenCV
- Roboflow
- Tata Technologies InnoVent Challenge
