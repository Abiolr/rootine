// Rep counting from COCO-17 keypoints ([x, y, conf], x/y normalized 0-1).
// Push-up and squat tracking is ported from the working test page: one body side,
// smoothing, spike rejection, hysteresis. Frame counts assume ~10-30 fps (in-browser model).
// COCO indices: 5/6 shoulders, 7/8 elbows, 9/10 wrists, 11/12 hips, 13/14 knees, 15/16 ankles.

const JOINT_MIN_CONFIDENCE = 0.4;
const WARMUP_FRAMES = 6; // good frames in a row before counting starts
const FRAMES_LOST_BEFORE_RESET = 3; // bad frames in a row = forget the current rep
const SMOOTHING_NEW_WEIGHT = 0.55; // smoothed = 55% new + 45% old
const SPIKE_JUMP_DEGREES = 45; // a bigger sudden jump is treated as a glitch...
const SPIKE_FRAMES_TO_ACCEPT = 3; // ...unless it lasts this many frames
const BOTTOM_HOLD_FRAMES = 2;
const MIN_MOTION_DEGREES = 30; // a rep must move the angle at least this much
const MIN_MS_BETWEEN_REPS = 350;

// Angle (degrees) at point b formed by a-b-c
function angleBetween(a, b, c) {
  const dx1 = a[0] - b[0], dy1 = a[1] - b[1];
  const dx2 = c[0] - b[0], dy2 = c[1] - b[1];
  const lengths = Math.hypot(dx1, dy1) * Math.hypot(dx2, dy2) || 1;
  const cosine = Math.max(-1, Math.min(1, (dx1 * dx2 + dy1 * dy2) / lengths));
  return Math.round((Math.acos(cosine) * 180) / Math.PI);
}

// bottom: angle at or below this = bottom of the rep. top: at or above = top.
const ANGLE_EXERCISES = {
  pushup: {
    sides: [[5, 7, 9], [6, 8, 10]], // shoulder-elbow-wrist
    bottom: 115,
    top: 145,
    lostHint: "Turn side-on so one arm is fully in frame.",
  },
  squat: {
    sides: [[11, 13, 15], [12, 14, 16]], // hip-knee-ankle
    bottom: 125,
    top: 150,
    lostHint: "Step back so your hips, knees and ankles are in frame.",
  },
};

function createAngleTracker({ sides, bottom, top, lostHint }) {
  let s;
  const fresh = () => ({
    reps: 0,
    phase: null,
    cycle: null,
    smoothed: null,
    lastRepTime: 0,
    goodFrames: 0,
    missed: 0,
    bottomFrames: 0,
    spikeFrames: 0,
  });
  s = fresh();

  const snapshot = (message = "") => ({
    reps: s.reps,
    phase: s.phase,
    angle: s.smoothed == null ? null : Math.round(s.smoothed),
    message,
  });

  function lost() {
    s.missed += 1;
    if (s.missed >= FRAMES_LOST_BEFORE_RESET) {
      s.phase = null;
      s.smoothed = null;
      s.cycle = null;
      s.goodFrames = 0;
      s.bottomFrames = 0;
      s.spikeFrames = 0;
    }
  }

  function update(kps, aspect) {
    // Use whichever side (left/right) the model is more confident about
    const conf = (side) => side.reduce((sum, i) => sum + kps[i][2], 0);
    const side = conf(sides[0]) >= conf(sides[1]) ? sides[0] : sides[1];

    if (!side.every((i) => kps[i][2] > JOINT_MIN_CONFIDENCE)) {
      s.goodFrames = 0;
      lost();
      return snapshot(lostHint);
    }
    s.missed = 0;
    s.goodFrames += 1;
    if (s.goodFrames < WARMUP_FRAMES) return snapshot("Getting ready... hold still");

    const [a, b, c] = side.map((i) => [kps[i][0] * aspect, kps[i][1]]);
    const raw = angleBetween(a, b, c);

    // Ignore one-off glitches: a sudden big jump must persist to be believed
    const jumped = s.smoothed != null && Math.abs(raw - s.smoothed) > SPIKE_JUMP_DEGREES;
    if (jumped && s.spikeFrames < SPIKE_FRAMES_TO_ACCEPT) {
      s.spikeFrames += 1;
      return snapshot();
    }
    s.spikeFrames = 0;

    s.smoothed =
      s.smoothed == null
        ? raw
        : s.smoothed * (1 - SMOOTHING_NEW_WEIGHT) + raw * SMOOTHING_NEW_WEIGHT;
    const angle = Math.round(s.smoothed);

    if (!s.cycle) s.cycle = { min: angle, max: angle };
    s.cycle.min = Math.min(s.cycle.min, angle);
    s.cycle.max = Math.max(s.cycle.max, angle);

    if (angle <= bottom) {
      s.bottomFrames += 1;
      if (s.bottomFrames >= BOTTOM_HOLD_FRAMES) s.phase = "bottom";
    } else {
      s.bottomFrames = 0;
      if (angle >= top) {
        const cameFromBottom = s.phase === "bottom";
        const movedEnough = s.cycle.max - s.cycle.min >= MIN_MOTION_DEGREES;
        const notTooSoon = performance.now() - s.lastRepTime > MIN_MS_BETWEEN_REPS;
        if (cameFromBottom && movedEnough && notTooSoon) {
          s.reps += 1;
          s.lastRepTime = performance.now();
        }
        if (cameFromBottom) s.cycle = null;
        s.phase = "top";
      }
      // between the thresholds: keep the previous phase
    }
    return snapshot();
  }

  return { update, lost };
}

// Jumping jacks (not covered by the test page, so untested): arms up + feet wide = "open",
// arms down + feet together = "closed". A rep is open -> closed.
function createJumpingJackTracker() {
  let phase = null;
  let reps = 0;
  const ok = (k) => k[2] > JOINT_MIN_CONFIDENCE;

  return {
    lost() {
      phase = null;
    },
    update(kps, aspect) {
      const [lS, rS, lW, rW, lA, rA] = [5, 6, 9, 10, 15, 16].map((i) => kps[i]);
      if (![lS, rS, lW, rW, lA, rA].every(ok)) {
        return { reps, phase, angle: null, message: "Step back so your whole body is in frame." };
      }
      const shoulderW = Math.abs(lS[0] - rS[0]) * aspect;
      const ankleW = Math.abs(lA[0] - rA[0]) * aspect;
      const armsUp = lW[1] < lS[1] && rW[1] < rS[1]; // y grows downward
      const armsDown = lW[1] > lS[1] && rW[1] > rS[1];

      if (armsUp && ankleW > 1.5 * shoulderW) {
        phase = "open";
      } else if (armsDown && ankleW < 1.2 * shoulderW) {
        if (phase === "open") reps += 1;
        phase = "closed";
      }
      return { reps, phase, angle: null, message: "" };
    },
  };
}

// Returns { update(keypoints, aspect) -> { reps, phase, angle, message }, lost() }
export function createCounter(exercise) {
  if (exercise === "jumping_jack") return createJumpingJackTracker();
  const config = ANGLE_EXERCISES[exercise];
  if (!config) throw new Error(`Unknown exercise: ${exercise}`);
  return createAngleTracker(config);
}