import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { endgameData } from "../src/endgameData";
import {
  chooseEndgameMove,
  endgameOutcome,
  endgameFeedback,
} from "../src/EndgameEngine";
import { resolveMove } from "../src/chess";
import {
  loadEndgameProgress,
  saveEndgameProgress,
  recordEndgame,
  ENDGAME_PROGRESS_KEY,
} from "../src/EndgameProgress";
afterEach(() => Reflect.deleteProperty(globalThis, "localStorage"));
const solutions: Record<string, string[]> = {
  queen: ["Kb6", "Qc5", "Qc6+", "Qb7#"],
  rook: ["Kc7", "Rh6", "Kb6", "Rh8#"],
  pawn: ["Kd7", "e6", "e7+", "e8=Q+"],
};
for (const e of endgameData) {
  test(`${e.name}: full original-position exercise with legal defensive replies`, () => {
    const g = new Chess(e.fen);
    const original = g.fen();
    assert.equal(endgameOutcome(g, e), null);
    for (const san of solutions[e.id]) {
      if (g.turn() === "b") {
        const before = g.fen();
        const reply = chooseEndgameMove(g, e)!;
        assert.equal(g.fen(), before);
        assert.ok(g.moves().includes(reply.san));
        g.move(reply);
      }
      assert.ok(g.moves().includes(san), `${san} not legal`);
      g.move(san);
    }
    assert.equal(endgameOutcome(g, e)?.status, "success");
    assert.notEqual(g.fen(), original);
  });
}
test("Queen stalemate does not complete the objective", () => {
  const g = new Chess(endgameData[0].fen);
  g.move("Qb6");
  assert.equal(g.isStalemate(), true);
  assert.equal(endgameOutcome(g, endgameData[0])?.status, "failure");
});
test("Another legal move is accepted and king may not enter attacked squares", () => {
  const g = new Chess(endgameData[0].fen);
  assert.equal(resolveMove(g, "d4", "d5").kind, "moved");
  assert.equal(resolveMove(g, "c6", "b7").kind, "invalid");
});
for (const [id, piece, fen, move] of [
  ["queen", "q", "8/8/8/8/2K5/8/1Q6/k7 b - - 0 1", "Kxb2"],
  ["rook", "r", "8/8/8/8/2K5/8/1R6/k7 b - - 0 1", "Kxb2"],
  ["pawn", "p", "8/8/8/8/2K5/8/1P6/k7 b - - 0 1", "Kxb2"],
] as const) {
  test(`${piece}: defender captures unprotected essential material`, () => {
    const e = endgameData.find((e) => e.id === id)!;
    const g = new Chess(fen);
    assert.equal(chooseEndgameMove(g, e)?.san, move);
    g.move(move);
    assert.equal(endgameOutcome(g, e)?.result, "Material perdido");
  });
}
test("Only queen promotion meets pawn objective; draws do not count", () => {
  for (const promotion of ["q", "r", "n", "b"] as const) {
    const g = new Chess("7k/4P3/3K4/8/8/8/8/8 w - - 0 1");
    g.move({ from: "e7", to: "e8", promotion });
    assert.equal(
      endgameOutcome(g, endgameData[2])?.status,
      promotion === "q" ? "success" : "failure",
    );
  }
});
test("Move feedback warns about a legal capture instead of praising it", () => {
  const e = endgameData[0],
    g = new Chess("k7/8/2K5/8/3Q4/8/8/8 w - - 0 1");
  const before = new Chess(g.fen());
  const move = g.move("Qa7");
  assert.match(endgameFeedback(before, g, move, e), /captura legal/);
});
test("Endgame progress is separate, accumulates nonconsecutive successes and persists", () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  let p = loadEndgameProgress();
  p = recordEndgame(p, "queen", false);
  assert.equal(p.queen.wins, 0);
  for (let i = 0; i < 4; i++) {
    p = recordEndgame(p, "queen", true);
    p = recordEndgame(p, "queen", false);
  }
  assert.equal(p.queen.wins, 3);
  assert.equal(p.rook.wins, 0);
  assert.ok(saveEndgameProgress(p));
  assert.deepEqual(loadEndgameProgress(), p);
  assert.ok(values.has(ENDGAME_PROGRESS_KEY));
  assert.equal(values.size, 1);
});
test("Malformed or blocked endgame storage recovers safely", () => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: () => "{",
      setItem: () => {
        throw Error("blocked");
      },
    },
  });
  const p = loadEndgameProgress();
  assert.equal(p.pawn.wins, 0);
  assert.equal(saveEndgameProgress(p), false);
});
