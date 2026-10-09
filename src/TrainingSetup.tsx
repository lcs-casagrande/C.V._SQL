import { useState } from "react";
import { openings } from "./openings";
import { createSession, type TrainingSession } from "./training";
export function TrainingSetup({
  onStart,
}: {
  onStart: (session: TrainingSession) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [targets, setTargets] = useState<Record<string, number>>(
    Object.fromEntries(openings.map((o) => [o.id, 3])),
  );
  const valid =
    selected.length > 0 &&
    selected.every(
      (id) =>
        Number.isInteger(targets[id]) && targets[id] >= 1 && targets[id] <= 20,
    );
  return (
    <section className="training-setup">
      <h2>Treino de aberturas aleatório</h2>
      <p>
        Escolha as aberturas e quantos acertos completos deseja em cada uma. A
        próxima abertura será sorteada automaticamente, sem dicas. Erros não
        apagam seus acertos.
      </p>
      <details className="training-dropdown">
        <summary>Selecionar aberturas ({selected.length})</summary>
        <div className="training-options">
          {openings.map((o) => (
            <div className="training-option" key={o.id}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(o.id)}
                  onChange={(e) =>
                    setSelected((ids) =>
                      e.target.checked
                        ? [...ids, o.id]
                        : ids.filter((id) => id !== o.id),
                    )
                  }
                />
                {o.name}
              </label>
              <label className="training-count">
                Repetições
                <input
                  aria-label={`Repetições de ${o.name}`}
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  disabled={!selected.includes(o.id)}
                  value={Number.isNaN(targets[o.id]) ? "" : targets[o.id]}
                  onChange={(e) =>
                    setTargets((t) => ({
                      ...t,
                      [o.id]: e.target.valueAsNumber,
                    }))
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </details>
      <div className="training-start">
        <span>
          {selected.length
            ? selected
                .map(
                  (id) =>
                    `${openings.find((o) => o.id === id)!.short}: ${Number.isFinite(targets[id]) ? targets[id] : "—"}`,
                )
                .join(" · ")
            : "Selecione pelo menos uma abertura."}
        </span>
        <button
          className="primary-btn"
          disabled={!valid}
          onClick={() =>
            onStart(
              createSession(
                Object.fromEntries(selected.map((id) => [id, targets[id]])),
              ),
            )
          }
        >
          Iniciar treino aleatório
        </button>
      </div>
      <small>
        De 1 a 20 repetições por abertura. A meta deste treino é independente
        dos 3 acertos de domínio; os acertos também contribuem para seu domínio.
      </small>
    </section>
  );
}
