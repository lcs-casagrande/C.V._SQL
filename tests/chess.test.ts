import { test } from "node:test";
import assert from "node:assert/strict";
import { Chess, type Square } from "chess.js";
import {
  cloneGame,
  cpuMove,
  resolveMove,
  resultText,
  type PromotionPiece,
} from "../src/chess";
import { openings } from "../src/openings";
function move(c: Chess, from: Square, to: Square, promotion?: PromotionPiece) {
  const result = resolveMove(c, from, to, promotion);
  assert.equal(result.kind, "moved");
  if (result.kind !== "moved") throw new Error("not moved");
  return result.game;
}
test("Illegal moves do not modify the game; legal moves preserve SAN history", () => {
  const c = new Chess();
  const fen = c.fen();
  assert.equal(resolveMove(c, "e2", "e5").kind, "invalid");
  assert.equal(c.fen(), fen);
  const next = move(c, "e2", "e4");
  assert.deepEqual(next.history(), ["e4"]);
  assert.equal(c.fen(), fen);
});
test("Both white castlings move king and rook and cannot cross check", () => {
  for (const [to, rook] of [
    ["g1", "f1"],
    ["c1", "d1"],
  ] as const) {
    const c = new Chess("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    const next = move(c, "e1", to);
    assert.equal(next.get(to)?.type, "k");
    assert.equal(next.get(rook)?.type, "r");
    assert.equal(cloneGame(next).fen(), next.fen());
  }
  const c = new Chess("r3k2r/8/8/8/8/5r2/8/R3K2R w KQkq - 0 1");
  assert.equal(resolveMove(c, "e1", "g1").kind, "invalid");
});
test("Black castling and loss of castling rights", () => {
  const c = new Chess("r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1");
  const next = move(c, "e8", "g8");
  assert.equal(next.get("f8")?.type, "r");
  assert.equal(next.get("g8")?.type, "k");
  const played = new Chess();
  for (const san of [
    "Nf3",
    "Nf6",
    "Rg1",
    "Ng8",
    "Rh1",
    "Nf6",
    "g3",
    "g6",
    "Bg2",
    "Bg7",
  ])
    played.move(san);
  assert.equal(resolveMove(played, "e1", "g1").kind, "invalid");
});
test("En passant removes the captured pawn and expires after a turn", () => {
  const c = new Chess();
  for (const san of ["e4", "a6", "e5", "d5"]) c.move(san);
  const next = move(c, "e5", "d6");
  assert.equal(next.get("d5"), undefined);
  assert.equal(next.get("d6")?.type, "p");
  assert.equal(next.history().at(-1), "exd6");
  c.move("Nf3");
  c.move("Nf6");
  assert.equal(resolveMove(c, "e5", "d6").kind, "invalid");
});
test("Promotion requires a choice and supports all four pieces, both colors", () => {
  for (const [fen, from, to] of [
    ["7k/P7/8/8/8/8/8/7K w - - 0 1", "a7", "a8"],
    ["7k/8/8/8/8/8/p7/7K b - - 0 1", "a2", "a1"],
  ] as const) {
    for (const piece of ["q", "r", "b", "n"] as const) {
      const c = new Chess(fen);
      assert.equal(resolveMove(c, from, to).kind, "promotion");
      assert.equal(c.get(from)?.type, "p");
      assert.equal(move(c, from, to, piece).get(to)?.type, piece);
    }
  }
});
test("Check and checkmate reject moves that leave the king attacked", () => {
  const c = new Chess();
  for (const san of ["f3", "e5", "g4", "Qh4#"]) c.move(san);
  assert.equal(c.isCheck(), true);
  assert.equal(c.isCheckmate(), true);
  assert.match(resultText(c), /Xeque-mate.*pretas/);
  assert.equal(resolveMove(c, "a2", "a3").kind, "invalid");
  assert.equal(cpuMove(c, "w"), undefined);
});
test("All draw outcomes remain detectable across cloning", () => {
  const stalemate = new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
  assert.match(resultText(stalemate), /afogamento/);
  assert.equal(cpuMove(stalemate, "b"), undefined);
  const material = new Chess("7k/8/6K1/8/8/8/8/8 w - - 0 1");
  assert.match(resultText(material), /material insuficiente/);
  const repeated = new Chess();
  for (let i = 0; i < 2; i++)
    for (const san of ["Nf3", "Nf6", "Ng1", "Ng8"]) repeated.move(san);
  assert.match(resultText(cloneGame(repeated)), /repetição tripla/);
  const fifty = new Chess("7k/8/6K1/8/8/8/8/R7 w - - 100 51");
  assert.equal(cloneGame(fifty).isDraw(), true);
  assert.match(resultText(fifty), /empatada/);
});
test("CPU returns legal replies without mutating any input state", () => {
  const c = new Chess();
  for (let i = 0; i < 8; i++) {
    const fen = c.fen(),
      history = c.history();
    const reply = cpuMove(c, c.turn());
    assert.ok(reply);
    assert.equal(c.fen(), fen);
    assert.deepEqual(c.history(), history);
    assert.ok(c.moves().includes(reply.san));
    c.move(reply);
  }
  assert.equal(c.history().length, 8);
});
for (const opening of openings)
  test(`${opening.name}: full line is legal with all planned student and opponent moves`, () => {
    const c = new Chess();
    let own = 0;
    for (const san of opening.line) {
      const student = c.turn() === opening.color;
      const m = c.moves({ verbose: true }).find((m) => m.san === san);
      assert.ok(m, `Illegal SAN ${san}`);
      if (student) {
        own++;
        assert.ok(opening.notes[san]);
      } else assert.ok(opening.responseNotes[san]);
      const result = resolveMove(c, m.from, m.to);
      assert.equal(result.kind, "moved");
      c.move(san);
    }
    assert.equal(own, opening.line.length / 2);
    assert.deepEqual(cloneGame(c).history(), opening.line);
  });
test("Requested 14 opening prefixes, identities and study colors are preserved", () => {
  const requested: Record<string, [string, string[]]> = {
    italiana: ["w", ["e4", "e5", "Nf3", "Nc6", "Bc4"]],
    escocesa: ["w", ["e4", "e5", "Nf3", "Nc6", "d4"]],
    gambito: ["w", ["d4", "d5", "c4"]],
    "gambito-rei": ["w", ["e4", "e5", "f4"]],
    evans: ["w", ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4"]],
    "rainha-recusado": ["b", ["d4", "d5", "c4", "e6"]],
    eslava: ["b", ["d4", "d5", "c4", "c6"]],
    "caro-kann": ["b", ["e4", "c6", "d4", "d5"]],
    francesa: ["b", ["e4", "e6", "d4", "d5"]],
    siciliana: ["b", ["e4", "c5"]],
    escandinava: ["b", ["e4", "d5"]],
    petroff: ["b", ["e4", "e5", "Nf3", "Nf6"]],
    "india-rei": ["b", ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7"]],
    holandesa: ["b", ["d4", "f5"]],
  };
  assert.equal(openings.length, 14);
  assert.equal(new Set(openings.map((o) => o.id)).size, 14);
  assert.equal(openings.filter((o) => o.color === "w").length, 5);
  assert.equal(openings.filter((o) => o.color === "b").length, 9);
  for (const [id, [color, prefix]] of Object.entries(requested)) {
    const o = openings.find((o) => o.id === id)!;
    assert.equal(o.color, color);
    assert.deepEqual(o.line.slice(0, prefix.length), prefix);
  }
});
