import { useState } from "react";
import "./App.css";
import Frontpage from "./Frontpage";
import Dashboard from "./Dashboard";
import Cosmetics from "./Cosmetics";

export default function App() {
  const [view, setView] = useState("front"); // "front" | "dashboard" | "cosmetics"
  const [equippedId, setEquippedId] = useState("sapling");

  if (view === "dashboard") {
    return (
      <Dashboard
        equippedId={equippedId}
        onCosmetics={() => setView("cosmetics")}
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
