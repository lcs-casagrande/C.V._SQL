import { endgameData, type Endgame } from "./endgameData";
import { type EndgameProgress } from "./EndgameProgress";
export function EndgameCatalog({
  progress,
  onStart,
}: {
  progress: EndgameProgress;
  onStart: (exercise: Endgame, practice: boolean) => void;
}) {
  return (
    <>
      <div className="page-intro">
        <span className="overline">CONVERTA SUA VANTAGEM</span>
        <h1>Treinamento de Finais</h1>
        <p>Aprenda a transformar vantagens em vitória.</p>
        <p>
          Finais dominados:{" "}
          {endgameData.filter((e) => progress[e.id].wins >= 3).length} de 3
        </p>
      </div>
      <div className="endgame-catalog">
        {endgameData.map((e) => {
          const p = progress[e.id];
          return (
            <article className="panel endgame-card" key={e.id}>
              <span className="endgame-piece">
                {e.id === "queen" ? "♕" : e.id === "rook" ? "♖" : "♙"}
              </span>
              <span className="overline">
                {e.id === "pawn" ? "FINAIS DE PEÕES" : "XEQUE-MATE"} · BRANCAS ·
                INICIANTE
              </span>
              <h2>{e.name}</h2>
              <p>{e.objective}</p>
              <p className="endgame-progress">
                {p.wins}/3 ·{" "}
                {p.wins >= 3
                  ? "Dominado"
                  : p.studied
                    ? "Estudando"
                    : "Não iniciado"}
              </p>
              <div className="mini-track">
                <div style={{ width: `${(p.wins / 3) * 100}%` }} />
              </div>
              <div className="endgame-actions">
                <button
                  className="primary-btn"
                  onClick={() => onStart(e, false)}
                >
                  Aprender
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => onStart(e, true)}
                >
                  Praticar
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
