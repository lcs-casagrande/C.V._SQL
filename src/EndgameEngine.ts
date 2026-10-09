import { Chess, type Move, type Square } from "chess.js";
import { cloneGame, resultText } from "./chess";
import type { Endgame } from "./endgameData";
export interface EndgameOutcome {
  status: "success" | "failure";
  result: string;
  message: string;
}
export function endgameOutcome(
  game: Chess,
  exercise: Endgame,
): EndgameOutcome | null {
  const pieces = game
    .board()
    .flat()
    .filter((p) => p?.color === "w");
  const promotion =
    exercise.id === "pawn"
      ? game
          .history({ verbose: true })
          .find((m) => m.color === "w" && m.promotion)
      : undefined;
  if (game.isStalemate())
    return {
      status: "failure",
      result: "Afogamento",
      message:
        "A partida terminou empatada por afogamento. O rei adversário ficou sem movimentos legais, mas não estava em xeque. Reinicie e procure deixar uma casa de fuga até preparar o mate.",
    };
  if (!pieces.some((p) => p?.type === exercise.piece) && !promotion)
    return {
      status: "failure",
      result: "Material perdido",
      message: `A peça necessária ao objetivo foi capturada. ${resultText(game)} Reinicie e mantenha seu material protegido.`,
    };
  if (game.isDraw())
    return { status: "failure", result: "Empate", message: resultText(game) };
  if (exercise.id === "pawn" && promotion)
    return promotion.promotion === "q"
      ? {
          status: "success",
          result: game.isCheckmate()
            ? "Promoção e xeque-mate"
            : "Promoção a dama",
          message: exercise.success,
        }
      : {
          status: "failure",
          result: "Outra promoção",
          message:
            "O lance é legal, mas o objetivo deste exercício é promover a dama. Reinicie para tentar novamente.",
        };
  if (!pieces.some((p) => p?.type === exercise.piece))
    return {
      status: "failure",
      result: "Material perdido",
      message: `A peça necessária ao objetivo foi capturada. ${resultText(game)} Reinicie e mantenha seu material protegido.`,
    };
  if (game.isCheckmate())
    return {
      status: game.turn() === "b" ? "success" : "failure",
      result: "Xeque-mate",
      message: game.turn() === "b" ? exercise.success : resultText(game),
    };
  return null;
}
function king(game: Chess, color: "w" | "b"): Square {
  return game
    .board()
    .flat()
    .find((p) => p?.type === "k" && p.color === color)!.square;
}
const distance = (a: Square, b: Square) =>
  Math.max(
    Math.abs(a.charCodeAt(0) - b.charCodeAt(0)),
    Math.abs(+a[1] - +b[1]),
  );
export function kingSpace(game: Chess): number {
  const k = king(game, "b");
  let count = 0;
  const file = k.charCodeAt(0) - 97,
    rank = +k[1];
  for (let df = -1; df <= 1; df++)
    for (let dr = -1; dr <= 1; dr++) {
      if (!df && !dr) continue;
      const f = file + df,
        r = rank + dr;
      if (f < 0 || f > 7 || r < 1 || r > 8) continue;
      const square = `${String.fromCharCode(97 + f)}${r}` as Square;
      if (!game.isAttacked(square, "w")) count++;
    }
  return count;
}

function value(game: Chess, e: Endgame): number {
  const outcome = endgameOutcome(game, e);
  if (outcome) return outcome.status === "success" ? 100000 : -100000;
  const b = king(game, "b"),
    w = king(game, "w");
  const f = b.charCodeAt(0) - 97,
    r = +b[1] - 1;
  if (e.id === "pawn") {
    const p = game
      .board()
      .flat()
      .find((p) => p?.color === "w" && p.type === "p")!.square;
    return (
      +p[1] * 130 -
      distance(w, p) * 12 +
      distance(b, p) * 8 -
      distance(w, b) * 2
    );
  }
  return (
    -kingSpace(game) * 35 -
    Math.min(f, 7 - f, r, 7 - r) * 30 -
    distance(w, b) * 9
  );
}
export function chooseEndgameMove(
  game: Chess,
  e: Endgame,
  depth = 3,
): Move | undefined {
  if (endgameOutcome(game, e)) return;
  const c = cloneGame(game);
  function search(left: number, alpha: number, beta: number): number {
    if (!left || endgameOutcome(c, e)) return value(c, e);
    const white = c.turn() === "w";
    let best = white ? -Infinity : Infinity;
    for (const m of c.moves({ verbose: true })) {
      c.move(m);
      const s = search(left - 1, alpha, beta);
      c.undo();
      best = white ? Math.max(best, s) : Math.min(best, s);
      if (white) alpha = Math.max(alpha, best);
      else beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  const white = c.turn() === "w";
  let best = white ? -Infinity : Infinity,
    chosen: Move | undefined;
  for (const m of c.moves({ verbose: true })) {
    c.move(m);
    const s = search(depth - 1, -Infinity, Infinity);
    c.undo();
    if (!chosen || (white ? s > best : s < best)) {
      best = s;
      chosen = m;
    }
  }
  return chosen;
}
export function endgameFeedback(
  before: Chess,
  after: Chess,
  move: Move,
  e: Endgame,
): string {
  const outcome = endgameOutcome(after, e);
  if (outcome) return outcome.message;
  if (after.moves({ verbose: true }).some((m) => m.captured === e.piece))
    return "Atenção: o adversário tem uma captura legal da sua peça. Observe como protegê-la na próxima tentativa.";
  if (
    move.piece === "k" &&
    distance(king(after, "w"), king(after, "b")) <
      distance(king(before, "w"), king(before, "b"))
  )
    return "Seu rei está participando do ataque. No final de partida, o rei é uma peça essencial.";
  if (kingSpace(after) < kingSpace(before))
    return "Sua jogada reduziu as casas disponíveis ao rei adversário.";
  return "Esse movimento é permitido. Observe o controle de casas e a segurança do seu material antes de planejar o próximo lance.";
}
