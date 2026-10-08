import { Chess, type Move, type Square } from "chess.js";
import type { Color } from "./openings";
const worth: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};
function score(chess: Chess, side: Color) {
  if (chess.isCheckmate()) return chess.turn() === side ? -100000 : 100000;
  let val = 0;
  for (const row of chess.board())
    for (const p of row)
      if (p) {
        let position =
          p.type === "p"
            ? (p.color === "w"
                ? Number(p.square[1]) - 2
                : 7 - Number(p.square[1])) * 4
            : 0;
        val += (p.color === side ? 1 : -1) * (worth[p.type] + position);
      }
  return val;
}
export function cpuMove(chess: Chess, side: Color): Move | undefined {
  if (chess.isGameOver()) return;
  const legal = chess.moves({ verbose: true });
  if (!legal.length) return;
  let ranked = legal
    .map((m) => {
      chess.move(m);
      let value = score(chess, side);
      if (!chess.isGameOver()) {
        const opp = chess.moves({ verbose: true });
        let worst = Infinity;
        for (const reply of opp) {
          chess.move(reply);
          const s = score(chess, side);
          chess.undo();
          if (s < worst) worst = s;
        }
        value = 0.4 * value + 0.6 * worst;
      }
      chess.undo();
      return { m, value };
    })
    .sort((a, b) => b.value - a.value);
  const good = ranked
    .filter((x) => x.value >= ranked[0].value - 65)
    .slice(0, 5);
  return good[Math.floor(Math.random() * good.length)].m;
}
export function cloneGame(c: Chess) {
  const next = new Chess(c.getHeaders().FEN);
  for (const san of c.history()) next.move(san);
  return next;
}
export function resultText(c: Chess) {
  if (c.isCheckmate())
    return `Xeque-mate! Vitória das ${c.turn() === "w" ? "pretas" : "brancas"}.`;
  if (c.isStalemate()) return "Empate por afogamento.";
  if (c.isThreefoldRepetition()) return "Empate por repetição tripla.";
  if (c.isInsufficientMaterial()) return "Empate por material insuficiente.";
  if (c.isDraw()) return "Partida empatada.";
  return "";
}

export type PromotionPiece = "q" | "r" | "b" | "n";
export function resolveMove(
  game: Chess,
  from: Square,
  to: Square,
  promotion?: PromotionPiece,
):
  | { kind: "invalid" }
  | { kind: "promotion" }
  | { kind: "moved"; game: Chess; move: Move } {
  const legal = game
    .moves({ verbose: true })
    .filter((m) => m.from === from && m.to === to);
  if (!legal.length) return { kind: "invalid" };
  if (legal.some((m) => m.promotion) && !promotion)
    return { kind: "promotion" };
  const next = cloneGame(game);
  const move = next.move({ from, to, promotion });
  return { kind: "moved", game: next, move };
}
