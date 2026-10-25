# Standalone computer-vision service (Ultralytics YOLO pose).
# Run locally:  uvicorn cv_service:app --port 8000
import base64
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
model = YOLO("yolo11n-pose.pt")  # COCO 17 keypoints, downloads on first run


class Req(BaseModel):
    image: str  # data URL (JPEG)
    exercise: Optional[str] = None


@app.get("/")
def root():
    return {"api": "Rootine CV", "model": "yolo11n-pose"}


@app.get("/api/health")
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/vision/pose")
@app.post("/pose")
def pose(r: Req):
    buf = np.frombuffer(base64.b64decode(r.image.split(",")[-1]), np.uint8)
    img = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    if img is None:
        return {"keypoints": []}
    res = model(img, imgsz=320, conf=0.3, verbose=False)[0]
    if res.keypoints is None or len(res.boxes) == 0 or res.keypoints.conf is None:
        return {"keypoints": []}
    h, w = img.shape[:2]
    best = int(res.boxes.conf.argmax())  # strongest person only
    xy = res.keypoints.xy[best].cpu().numpy()
    cf = res.keypoints.conf[best].cpu().numpy()
    return {"keypoints": [[[float(x / w), float(y / h), float(c)] for (x, y), c in zip(xy, cf)]]}