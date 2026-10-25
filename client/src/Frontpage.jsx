import { Link } from "react-router-dom";
import "./Frontpage.css";
import logo from "./assets/logo.png";

const STEPS = [
  [
    "Set your goals",
    "Pick what you want to do each day, like 10,000 steps and a short workout.",
  ],
  ["Finish them daily", "Your tree grows every day you complete your goals."],
  [
    "Keep it healthy",
    "Miss a day and it starts to wither. Finish your goals again and it comes back.",
  ],
];

// 26 stars with fixed positions. x and y spreads them around the sky. d is a twinkle delay.
const STARS = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 52,
  d: (i % 6) * 0.9,
}));

export default function Frontpage({ onStart }) {
  function handleStart(e) {
    e.preventDefault();
    onStart?.();
  }

  return (
    <div className = "fp">

      <section className = "fp-hero">
        <div className = "fp-sky" aria-hidden = "true">
          {STARS.map((s, i) => (
            <i key = {i} style = {{ left: `${s.x}%`, top: `${s.y}%`, "--d": `${s.d}s` }} />
          ))}
          <b className = "fp-moon" />
        </div>

        <header className = "fp-nav">
          <Link className = "fp-logo" to = "/" aria-label = "Rootine home"> <span> 
            <img src = {logo} alt = "Rootine" />
            </span> </Link>
          <Link className = "fp-link" to = "/login"> Sign in </Link>
        </header>

        <div className="fp-copy">
          <h1> Finish your goals. Grow your tree. </h1>
          <p> Rootine helps you stay consistent with exercise. Set daily goals, finish them, and watch what you've planted grow. </p>
          <Link className = "fp-cta" to = "/register"> Plant your tree </Link>
        </div>

        <div className = "fp-hills" aria-hidden = "true"><i /><i /></div>
      </section>

      <section className="fp-steps" aria-label="How Rootine works">
        {STEPS.map(([t, p], i) => (
          <article key = {t} style = {{ "--n": i }}>
            <h2> {t} </h2>
            <p> {p} </p>
          </article>
        ))}
      </section>
    </div>
  );
}
