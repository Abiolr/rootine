// Stand-in for @mediapipe/pose. pose-detection imports it for the MediaPipe runtime,
// which we don't use (we run MoveNet on TensorFlow.js).
export class Pose {}