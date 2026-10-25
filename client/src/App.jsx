import { useState } from "react";
import "./App.css";
import Frontpage from "./Frontpage";
import Dashboard from "./Dashboard";
import Cosmetics from "./Cosmetics";
import Workout from "./Workout";

const PAGES = ["front", "dashboard", "cosmetics", "workout"];

export default function App() {
  // Testing: open the site with #dashboard, #cosmetics, or #workout to go straight there.
  const [view, setView] = useState(() => {
    const hash = window.location.hash.slice(1);
    return PAGES.includes(hash) ? hash : "front";
  });
  const [equippedId, setEquippedId] = useState("sapling");

  if (view === "workout") {
    return (
      <Workout
        onTree={() => setView("dashboard")}
        onLogout={() => setView("front")}
      />
    );
  }

  if (view === "dashboard") {
    return (
      <Dashboard
        equippedId={equippedId}
        onCosmetics={() => setView("cosmetics")}
        onWorkout={() => setView("workout")}
        onLogout={() => setView("front")}
      />
    );
  }

  if (view === "cosmetics") {
    return (
      <Cosmetics
        equippedId={equippedId}
        onEquip={setEquippedId}
        onTree={() => setView("dashboard")}
        onLogout={() => setView("front")}
      />
    );
  }

  return <Frontpage onStart={() => setView("dashboard")} />;
}
