// Mirrors server/src/utils/progression.util.js so the UI can show XP next to the stage.
export const STAGE_THRESHOLDS = [
  { status: "SEED", xp: 0 },
  { status: "SAPLING", xp: 100 },
  { status: "JUVENILE", xp: 400 },
  { status: "GROWN", xp: 1000 },
];

export function stageForXp(xp = 0, penaltyPoints = 0) {
  if (penaltyPoints >= 2) return "DEAD";
  return [...STAGE_THRESHOLDS].reverse().find((s) => xp >= s.xp).status;
}

// The next stage the tree can reach, or null when fully grown (or dead)
export function nextStage(xp = 0, penaltyPoints = 0) {
  if (penaltyPoints >= 2) return null;
  return STAGE_THRESHOLDS.find((s) => s.xp > xp) ?? null;
}
