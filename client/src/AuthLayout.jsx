import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "./assets/logo.png";
import "./Auth.css";

const STARS = Array.from({ length: 16 }, (_, i) => ({ 
  x: (i * 37 + 11) % 97, 
  y: (i * 53 + 7) % 50, 
  d: (i % 6) * 0.9 
}));

export default function AuthLayout({ title, sub, onSubmit, error, children, actions }) {
  return (
    <div className = "au">
      <div className = "au-sky" aria-hidden = "true">
        {STARS.map((s, i) => (
          <i key = {i} style = {{ left: `${s.x}%`, top: `${s.y}%`, "--d": `${s.d}s` }} />
        ))}
      </div>

      <header className = "au-nav">
        <Link className = "au-logo" to = "/" aria-label = "Rootine home">
          <img src = {logo} alt = "Rootine" />
        </Link>
      </header>

      <main className = "au-main">
        <b className = "au-moon" aria-hidden = "true" />
        <form className = "au-card" onSubmit = {onSubmit}>
          <h1> {title} </h1>
          <p className = "au-sub"> {sub} </p>
          {children}
          {error && <p className = "au-error" role = "alert"> {error} </p>}
          {actions}
        </form>
      </main>

      <div className = "au-hills" aria-hidden = "true"> <i /><i /> </div>
    </div>
  );
}

// Labelled text input
export function Field({ label, i = 0, ...inputProps }) {
  return (
    <label className = "au-field" style = {{ "--i": i }}>
      {label}
      <input {...inputProps} />
    </label>
  );
}

// Password input with a Show/Hide button
export function PasswordField({ label, i = 0, ...inputProps }) {
  const [show, setShow] = useState(false);
  return (
    <label className = "au-field" style = {{ "--i": i }}>
      {label}
      <span className = "au-pw">
        <input type = {show ? "text" : "password"} {...inputProps} />
        <button type = "button" className = "au-show" aria-pressed = {show} onClick = {() => setShow(!show)}>
          {show ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}

// Pixel submit button
export function SubmitButton({ busy, label, busyLabel, i = 3 }) {
  return (
    <button className = "au-submit" type = "submit" disabled = {busy} style = {{ "--i": i }}>
      <span> {busy ? busyLabel : label} </span>
    </button>
  );
}
