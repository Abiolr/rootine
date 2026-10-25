import logo from "./assets/logo.png";
import "./Cosmetics.css";

export const TREES = [
  { id: "sapling", name: "Sapling", xp: 0, shape: "round", color: "#cfe97a" },
  { id: "oak", name: "Oak", xp: 100, shape: "round", color: "#f2a65a" },
  { id: "pine", name: "Pine", xp: 250, shape: "pine", color: "#2f8a5f" },
  { id: "cherry", name: "Cherry", xp: 400, shape: "bloom", color: "#e97ba5" },
  { id: "golden", name: "Golden", xp: 900, shape: "round", color: "#f7d56b" },
];

export function TreeIcon({ shape, color, width = 70, height = 82 }) {
  const canopy =
    shape === "pine"
      ? "M5 0h2v1h-2zM4 1h4v1h-4zM4 2h4v1h-4zM3 3h6v1h-6zM3 4h6v1h-6zM2 5h8v1h-8zM2 6h8v1h-8zM1 7h10v1h-10zM1 8h10v1h-10zM0 9h12v1h-12z"
      : "M4 0h4v1h-4zM3 1h6v1h-6zM2 2h8v1h-8zM1 3h10v1h-10zM1 4h10v1h-10zM2 5h8v1h-8zM1 6h10v1h-10zM0 7h12v1h-12zM1 8h10v1h-10zM2 9h8v1h-8z";

  return (
    <svg viewBox="0 0 12 14" shapeRendering="crispEdges" width={width} height={height} aria-hidden="true">
      <path fill={color} d={canopy} />
      {shape === "bloom" && (
        <path
          fill="#fff1f7"
          d="M3 2h1v1h-1zM8 3h1v1h-1zM5 1h1v1h-1zM2 6h1v1h-1zM9 6h1v1h-1zM6 5h1v1h-1z"
        />
      )}
      <path fill="#8a5a33" d="M5 10h2v3h-2z" />
      <path fill="#1f5a43" d="M2 13h8v1h-8z" />
    </svg>
  );
}

export default function Cosmetics({
  lifetimeXp = 300,
  equippedId = "sapling",
  trees = TREES,
  onEquip,
  onTree,
  onLogout,
}) {
  const sorted = [...trees].sort((a, b) => a.xp - b.xp);
  const unlockedCount = sorted.filter((t) => lifetimeXp >= t.xp).length;
  const equipped = sorted.find((t) => t.id === equippedId) ?? sorted[0];
  const next = sorted.find((t) => lifetimeXp < t.xp) ?? null;
  const prevXp = next
    ? sorted.filter((t) => t.xp <= lifetimeXp).at(-1)?.xp ?? 0
    : 0;
  const progress = next
    ? Math.min(100, ((lifetimeXp - prevXp) / (next.xp - prevXp)) * 100)
    : 100;

  return (
    <div className="cos">
      <header className="cos-head">
        <img className="cos-logo" src={logo} alt="Rootine" />
        <span className="cos-pill">{lifetimeXp} XP</span>
      </header>

      <nav className="cos-nav" aria-label="Main">
        <button type="button" className="cos-tab" onClick={onTree}>
          Tree
        </button>
        <div className="cos-right">
          <button type="button" className="cos-navbtn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="cos-panel">
        <div className="cos-hero">
          <div>
            <h1 className="cos-title">Cosmetics</h1>
            <p className="cos-desc">
              Trees unlock with lifetime XP, so a withered plant never takes
              your rewards away.
            </p>
          </div>

          <div className="cos-summary">
            <div className="cos-stat">
              <b>{unlockedCount}/{sorted.length}</b>
              <span>Unlocked</span>
            </div>
            <div className="cos-stat">
              <b>{equipped.name}</b>
              <span>Equipped</span>
            </div>
          </div>
        </div>

        <div className="cos-next" aria-label={next ? `${next.xp - lifetimeXp} XP until ${next.name}` : "All trees unlocked"}>
          <div className="cos-next-text">
            {next ? (
              <>
                <span>Next: <b>{next.name}</b></span>
                <span>{next.xp - lifetimeXp} XP to go</span>
              </>
            ) : (
              <span>Every tree is unlocked.</span>
            )}
          </div>
          <div className="cos-bar" role="presentation">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>

        <h2 className="cos-section">Trees</h2>
        <div className="cos-grid">
          {sorted.map((tree, index) => {
            const unlocked = lifetimeXp >= tree.xp;
            const isEquipped = equippedId === tree.id;
            const cardClass = [
              "cos-card",
              isEquipped && "is-equipped",
              !unlocked && "is-locked",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <article key={tree.id} className={cardClass}>
                <div className="cos-meta">
                  <span className="cos-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="cos-tag">
                    {isEquipped ? "Equipped" : unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
                <div className="cos-art">
                  <TreeIcon shape={tree.shape} color={tree.color} />
                </div>
                <h3 className="cos-name">{tree.name}</h3>
                <p className="cos-req">
                  {tree.xp === 0 ? "Starter tree" : `${tree.xp} lifetime XP`}
                </p>
                {isEquipped ? (
                  <button type="button" className="cos-btn" disabled>
                    In use
                  </button>
                ) : unlocked ? (
                  <button
                    type="button"
                    className="cos-btn is-action"
                    onClick={() => onEquip?.(tree.id)}
                  >
                    Equip
                  </button>
                ) : (
                  <button type="button" className="cos-btn" disabled>
                    Locked
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
