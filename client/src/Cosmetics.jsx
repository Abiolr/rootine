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
        <h1 className="cos-title">Cosmetics</h1>
        <p className="cos-desc">
          Unlocked by lifetime XP, so a withered plant never takes your rewards
          away. Each skin unlocks at its XP amount and restyles your tree at every
          stage.
        </p>

        <h2 className="cos-section">Tree skins</h2>
        <div className="cos-grid">
          {skins.map((skin) => {
            const unlocked = lifetimeXp >= skin.xp;
            const equipped = equippedId === skin.id;
            const status = equipped
              ? "Equipped"
              : unlocked
              ? "Unlocked"
              : `${skin.xp} lifetime XP`;

            const cardClass = [
              "cos-card",
              equipped && "is-equipped",
              !unlocked && "is-locked",
            ]
              .filter(Boolean)
              .join(" ");

            const preview = skinImage(skin.id, "GROWN");

            return (
              <article key={skin.id} className={cardClass}>
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
                <p className="cos-status">{status}</p>
                {equipped ? (
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
