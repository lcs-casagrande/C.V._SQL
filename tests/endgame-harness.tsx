// Controlled failures use the actual training UI; fixture is excluded from production.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { endgameData } from "../src/endgameData";
import { EndgameTraining } from "../src/EndgameTraining";
import "../src/style.css";
function Harness() {
  const params = new URLSearchParams(location.search);
  const e =
    endgameData.find((e) => e.id === params.get("id")) || endgameData[0];
  const [wins, setWins] = useState(0);
  return (
    <main className="page-content">
      <EndgameTraining
        exercise={{ ...e, fen: params.get("fen") || e.fen }}
        practice
        hideInstructions={false}
        wins={wins}
        onSuccess={() => setWins((w) => w + 1)}
        onBack={() => {}}
        onPractice={() => {}}
        onReview={() => {}}
      />
      <span data-testid="wins">{wins}</span>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
