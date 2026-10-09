import { type Chess } from "chess.js";
export function MoveHistory({ game }: { game: Chess }) {
  const h = game.history({ verbose: true });
  const rows = new Map<number, { w?: string; b?: string }>();
  for (const m of h) {
    const number = Number(m.before.split(" ")[5]);
    const row = rows.get(number) || {};
    row[m.color] = m.san;
    rows.set(number, row);
  }
  return (
    <div className="history">
      <div className="panel-heading">
        Histórico de lances <span>{h.length} meios-lances</span>
      </div>
      <div className="move-list">
        {!h.length ? (
          <div className="history-empty">Os movimentos aparecerão aqui.</div>
        ) : (
          [...rows].map(([number, row]) => (
            <div className="move-row" key={number}>
              <span>{number}.</span>
              <strong>{row.w || "—"}</strong>
              <strong>{row.b || "—"}</strong>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
