// Browser integration fixture: exercises the same components and move resolver as App.
// This file is not included in the production build.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Chess, type Square } from "chess.js";
import { Board } from "../src/Board";
import { PromotionDialog } from "../src/PromotionDialog";
import { resolveMove, resultText, type PromotionPiece } from "../src/chess";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/outfit";
import "../src/style.css";
function Harness() {
  const params = new URLSearchParams(location.search);
  const [game, setGame] = useState(
    () => new Chess(params.get("fen") || undefined),
  );
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [error, setError] = useState("");
  function onMove(from: Square, to: Square, piece?: PromotionPiece) {
    const result = resolveMove(game, from, to, piece);
    if (result.kind === "invalid") {
      setError("Movimento inválido");
      return;
    }
    if (result.kind === "promotion") {
      setPromotion({ from, to });
      return;
    }
    setError("");
    setGame(result.game);
  }
  return (
    <main style={{ maxWidth: 600, margin: "20px auto", padding: 16 }}>
      <Board
        game={game}
        orientation={params.get("side") === "b" ? "b" : "w"}
        interactive={!game.isGameOver()}
        onMove={onMove}
      />
      <div data-testid="fen">{game.fen()}</div>
      <div role="status">
        {resultText(game) || error || (game.isCheck() ? "Em xeque" : "Sua vez")}
      </div>
      <div data-testid="history">{game.history().join(" ")}</div>
      {promotion && (
        <PromotionDialog
          color={game.turn()}
          onCancel={() => setPromotion(null)}
          onChoose={(piece) => {
            const move = promotion;
            setPromotion(null);
            onMove(move.from, move.to, piece);
          }}
        />
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
