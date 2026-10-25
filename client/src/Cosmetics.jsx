import { Link } from "react-router-dom";
import logo from "./assets/logo.png";
import { SKINS, skinImage } from "./skins";
import "./Cosmetics.css";

export default function Cosmetics({
  lifetimeXp = 0,
  equippedId = "classic",
  skins = SKINS,
  onEquip,
  onTree,
  onLogout,
}) {
  // Replaced undefined `trees` with the `skins` prop
  const sorted = [...skins].sort((a, b) => a.xp - b.xp);
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
        <Link to="/dashboard" aria-label="Go to dashboard">
          <img className="cos-logo" src={logo} alt="Rootine" />
        </Link>
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

        <h2 className="cos-section">Tree skins</h2>
        <div className="cos-grid">
          {sorted.map((skin, index) => {
            const unlocked = lifetimeXp >= skin.xp;
            const isEquipped = equippedId === skin.id;
            const cardClass = [
              "cos-card",
              isEquipped && "is-equipped",
              !unlocked && "is-locked",
            ]
              .filter(Boolean)
              .join(" ");

            const preview = skinImage(skin.id, "GROWN");

            return (
              <article key={skin.id} className={cardClass}>
                <div className="cos-meta">
                  <span className="cos-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="cos-tag">
                    {isEquipped ? "Equipped" : unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
                <div className="cos-art">
                  {preview && (
                    <img
                      src={preview}
                      alt={`${skin.name} tree`}
                      width={70}
                      style={{ imageRendering: "pixelated" }}
                    />
                  )}
                </div>
                <h3 className="cos-name">{skin.name}</h3>
                <p className="cos-req">
                  {skin.xp === 0 ? "Starter tree" : `${skin.xp} lifetime XP`}
                </p>
                {isEquipped ? (
                  <button type="button" className="cos-btn" disabled>
                    In use
                  </button>
                ) : unlocked ? (
                  <button
                    type="button"
                    className="cos-btn is-action"
                    onClick={() => onEquip?.(skin.id)}
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