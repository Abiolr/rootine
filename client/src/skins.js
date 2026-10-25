// Tree skins (cosmetics). Each skin has a sprite per growth stage in src/assets/:
//   classic:  sapling.png, juvenile.png, mature.png, dead.png
//   others:   <id>_sapling.png, <id>_juvenile.png, <id>_mature.png, <id>_dead.png
// The unlock XP lines up with the tree's own stages (sapling 100, juvenile 400, grown 1000),
// so players get a new skin each time their tree reaches a new stage.
const files = import.meta.glob("./assets/*.png", { eager: true, import: "default" });

export const SKINS = [
  { id: "classic", name: "Classic", xp: 0 },
  { id: "autumn", name: "Autumn", xp: 100 },
  { id: "cherry_blossom", name: "Cherry Blossom", xp: 400 },
  { id: "frost", name: "Frost", xp: 1000 },
  { id: "midnight", name: "Midnight", xp: 2000 },
];

// API tree status -> sprite file suffix. SEED has no sprite (background only).
const STAGE_FILE = { SAPLING: "sapling", JUVENILE: "juvenile", GROWN: "mature", DEAD: "dead" };

export function skinImage(skinId, status) {
  const stage = STAGE_FILE[String(status ?? "").toUpperCase()];
  if (!stage) return null;
  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];
  const name = skin.id === "classic" ? stage : `${skin.id}_${stage}`;
  // fall back to the classic sprite if a skin file is missing
  return files[`./assets/${name}.png`] ?? files[`./assets/${stage}.png`] ?? null;
}
