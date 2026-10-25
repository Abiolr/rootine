import { useEffect, useRef, useState } from "react";
import { loadPoseDetector, detectPoseLocal } from "./pose";
import { createCounter } from "./repCounter";

const SKELETON = [
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15], [12, 14], [14, 16],
];

const TIPS = {
  pushup: "Put the camera on the floor, side-on to you, 2-3 metres away, whole body in frame.",
  squat: "Stand side-on to the camera, 2-3 metres away, whole body in frame.",
  jumping_jack: "Step back so your whole body is in frame, with room to jump.",
};

export default function TaskCamera({ task, onComplete, onCancel }) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [reps, setReps] = useState(0);
  const [status, setStatus] = useState("starting"); // starting | loading | running | saving | error
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [info, setInfo] = useState({ fps: null, angle: null, phase: null });

  useEffect(() => {
    let cancelled = false;
    let finished = false;
    let stream = null;
    let rafId = null;
    let lastFrame = 0;
    let smoothFps = 0;
    let lastInfoUpdate = 0;
    const counter = createCounter(task.exercise);

    function drawOverlay(kps, width, height) {
      const canvas = overlayRef.current;
      if (!canvas) return;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, width, height);
      if (!kps) return;
      ctx.strokeStyle = "#38b764";
      ctx.lineWidth = 3;
      for (const [a, b] of SKELETON) {
        if (kps[a][2] > 0.3 && kps[b][2] > 0.3) {
          ctx.beginPath();
          ctx.moveTo(kps[a][0] * width, kps[a][1] * height);
          ctx.lineTo(kps[b][0] * width, kps[b][1] * height);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "#ffcd75";
      for (const [x, y, c] of kps) {
        if (c > 0.3) ctx.fillRect(x * width - 3, y * height - 3, 6, 6);
      }
    }

    async function finish() {
      finished = true;
      setStatus("saving");
      stream?.getTracks().forEach((t) => t.stop());
      try {
        await onCompleteRef.current();
      } catch (err) {
        setError(err.message || "Couldn't save your task.");
        setStatus("error");
      }
    }

    async function run(detector) {
      const video = videoRef.current;
      while (!cancelled && !finished) {
        if (video.readyState >= 2 && video.videoWidth) {
          try {
            const kps = await detectPoseLocal(detector, video);
            if (cancelled || finished) return;

            const now = performance.now();
            if (lastFrame) smoothFps = smoothFps * 0.9 + (1000 / (now - lastFrame)) * 0.1;
            lastFrame = now;

            drawOverlay(kps, video.videoWidth, video.videoHeight);

            let result = null;
            if (kps) {
              result = counter.update(kps, video.videoWidth / video.videoHeight);
              setReps(result.reps);
              setHint(result.message);
            } else {
              counter.lost();
              setHint("No person detected. Step back so your whole body is in frame.");
            }

            // update the debug line a few times a second, not every frame
            if (now - lastInfoUpdate > 300) {
              lastInfoUpdate = now;
              setInfo({
                fps: smoothFps.toFixed(0),
                angle: result?.angle ?? null,
                phase: result?.phase ?? null,
              });
            }

            if (result && result.reps >= task.reps) return finish();
          } catch {
            if (cancelled) return;
            setHint("Pose model error. Retrying...");
          }
        }
        // wait for the next screen refresh so we never queue up frames
        await new Promise((resolve) => {
          rafId = requestAnimationFrame(resolve);
        });
      }
    }

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch {
        if (!cancelled) {
          setError("Couldn't access the camera. Allow camera permission and try again.");
          setStatus("error");
        }
        return;
      }

      try {
        setStatus("loading");
        const detector = await loadPoseDetector(); // first time downloads the model
        if (cancelled) return;
        setStatus("running");
        run(detector);
      } catch {
        if (!cancelled) {
          setError("Couldn't load the pose model. Check your connection and try again.");
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [task]);

  return (
    <div>
      <h1>{task.label}</h1>
      <p>{TIPS[task.exercise]}</p>
      <h2>
        {reps} / {task.reps}
      </h2>

      {/* mirrored like a mirror; the overlay shares the same box so it stays aligned */}
      <div style={{ position: "relative", maxWidth: 640, transform: "scaleX(-1)" }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block" }} />
        <canvas
          ref={overlayRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      </div>

      {status === "starting" && <p>Starting camera...</p>}
      {status === "loading" && <p>Loading pose model...</p>}
      {status === "saving" && <p>Nice! Saving your task...</p>}
      {hint && <p>{hint}</p>}
      {status === "running" && info.fps != null && (
        <p style={{ opacity: 0.7, fontSize: 14 }}>
          {info.fps} fps
          {info.angle != null ? ` · angle ${info.angle}°` : ""}
          {info.phase ? ` · ${info.phase}` : ""}
        </p>
      )}
      {error && <p role="alert">{error}</p>}

      <button type="button" onClick={onCancel} disabled={status === "saving"}>
        Cancel
      </button>
    </div>
  );
}