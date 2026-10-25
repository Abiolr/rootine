// In-browser pose detection (MoveNet Lightning via TensorFlow.js).
// Returns the same shape the old vision service did: 17 COCO keypoints
// [[x, y, confidence], ...] with x/y as fractions of the video size (0-1).
// TensorFlow is loaded lazily so it only downloads when the camera page opens.

let detectorPromise = null;

export function loadPoseDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const tf = await import("@tensorflow/tfjs");
      const poseDetection = await import("@tensorflow-models/pose-detection");
      if (!(await tf.setBackend("webgl"))) await tf.setBackend("cpu");
      await tf.ready();
      return poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      });
    })();
    detectorPromise.catch(() => {
      detectorPromise = null; // allow a retry
    });
  }
  return detectorPromise;
}

export async function detectPoseLocal(detector, video) {
  const [pose] = await detector.estimatePoses(video);
  if (!pose) return null;
  const w = video.videoWidth;
  const h = video.videoHeight;
  const kps = pose.keypoints.map((k) => [k.x / w, k.y / h, k.score ?? 0]);
  const avg = kps.reduce((sum, k) => sum + k[2], 0) / kps.length;
  return avg < 0.2 ? null : kps; // basically no person in frame
}