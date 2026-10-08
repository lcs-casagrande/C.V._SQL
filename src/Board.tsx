import { useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import type { Color } from "./openings";
export const glyph: Record<string, string> = {
  wk: "♔",
  wq: "♕",
  wr: "♖",
  wb: "♗",
  wn: "♘",
  wp: "♙",
  bk: "♚",
  bq: "♛",
  br: "♜",
  bb: "♝",
  bn: "♞",
  bp: "♟",
};
export function Board({
  game,
  orientation,
  interactive,
  onMove,
  hint,
  showHints = true,
}: {
  game: Chess;
  orientation: Color;
  interactive: boolean;
  onMove: (from: Square, to: Square) => void;
  hint?: { from: Square; to: Square } | null;
  showHints?: boolean;
}) {
  const [selected, setSelected] = useState<Square | null>(null);
  const drag = useRef<Square | null>(null);
  const touch = useRef<{
    from: Square;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(0);
  const files =
    orientation === "w"
      ? ["a", "b", "c", "d", "e", "f", "g", "h"]
      : ["h", "g", "f", "e", "d", "c", "b", "a"];
  const ranks =
    orientation === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const last = game.history({ verbose: true }).at(-1);
  const possible =
    selected && interactive
      ? game.moves({ square: selected, verbose: true }).map((m) => m.to)
      : [];
  const active = (sq: Square) => {
    if (!interactive) return;
    const p = game.get(sq);
    if (selected) {
      if (selected === sq) {
        setSelected(null);
        return;
      }
      if (possible.includes(sq)) {
        onMove(selected, sq);
        setSelected(null);
        return;
      }
      if (p?.color === game.turn()) {
        setSelected(sq);
        return;
      }
      setSelected(null);
      return;
    }
    if (p?.color === game.turn()) setSelected(sq);
  };
  useEffect(() => {
    setSelected(null);
    drag.current = null;
    touch.current = null;
  }, [game.fen(), orientation, interactive]);
  return (
    <div className="board-wrap">
      <div
        className="board"
        role="grid"
        aria-label="Tabuleiro de xadrez interativo"
      >
        {ranks.map((r, ri) =>
          files.map((f, fi) => {
            const sq = `${f}${r}` as Square,
              p = game.get(sq),
              light = (fi + ri) % 2 === 0;
            const kingCheck =
              p?.type === "k" && p.color === game.turn() && game.isCheck();
            return (
              <button
                type="button"
                role="gridcell"
                data-square={sq}
                key={sq}
                aria-label={`${sq}${p ? " " + (p.color === "w" ? "branca" : "preta") + " " + p.type : ""}`}
                className={`square ${light ? "light" : "dark"} ${last?.from === sq || last?.to === sq ? "last" : ""} ${selected === sq ? "selected" : ""} ${hint?.from === sq || hint?.to === sq ? "hint" : ""} ${kingCheck ? "incheck" : ""}`}
                onClick={() => {
                  if (Date.now() < suppressClick.current) {
                    suppressClick.current = 0;
                    return;
                  }
                  active(sq);
                }}
                onPointerDown={(e) => {
                  if (
                    e.pointerType === "touch" &&
                    interactive &&
                    p?.color === game.turn()
                  ) {
                    touch.current = {
                      from: sq,
                      x: e.clientX,
                      y: e.clientY,
                      moved: false,
                    };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }
                }}
                onPointerMove={(e) => {
                  if (
                    touch.current &&
                    Math.hypot(
                      e.clientX - touch.current.x,
                      e.clientY - touch.current.y,
                    ) > 8
                  ) {
                    touch.current.moved = true;
                    setSelected(touch.current.from);
                  }
                }}
                onPointerUp={(e) => {
                  const gesture = touch.current;
                  touch.current = null;
                  if (!gesture?.moved) return;
                  const target = document
                    .elementFromPoint(e.clientX, e.clientY)
                    ?.closest("[data-square]")
                    ?.getAttribute("data-square") as Square | null;
                  suppressClick.current = Date.now() + 400;
                  if (target && interactive) onMove(gesture.from, target);
                  setSelected(null);
                }}
                onPointerCancel={() => {
                  touch.current = null;
                  setSelected(null);
                }}
                onDragOver={(e) => {
                  if (interactive) e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (drag.current && interactive) onMove(drag.current, sq);
                  drag.current = null;
                  setSelected(null);
                }}
              >
                {fi === 0 && <span className="rank-label">{r}</span>}
                {ri === 7 && <span className="file-label">{f}</span>}
                {p && (
                  <span
                    key={p.color + p.type}
                    draggable={interactive && p.color === game.turn()}
                    onDragStart={(e) => {
                      drag.current = sq;
                      e.dataTransfer.setData("text/plain", sq);
                    }}
                    onDragEnd={() => (drag.current = null)}
                    className={`piece ${p.color === "w" ? "white-piece" : "black-piece"}`}
                  >
                    {glyph[p.color + p.type]}
                  </span>
                )}
                {showHints && possible.includes(sq) && (
                  <span className={p ? "capture-ring" : "move-dot"} />
                )}
                {showHints && hint?.to === sq && (
                  <span className="hint-target" />
                )}
              </button>
            );
          }),
        )}
      </div>
      <div className="board-under">
        <span>
          {orientation === "w" ? "Você joga de brancas" : "Você joga de pretas"}
        </span>
        <span>Arraste ou clique para mover</span>
      </div>
    </div>
  );
}
