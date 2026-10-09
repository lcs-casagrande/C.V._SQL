import { useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Board } from "./Board";
import { PromotionDialog } from "./PromotionDialog";
import { resolveMove, cloneGame, type PromotionPiece } from "./chess";
import {
  chooseEndgameMove,
  endgameFeedback,
  endgameOutcome,
} from "./EndgameEngine";
import { type Endgame } from "./endgameData";
import { MoveHistory } from "./MoveHistory";
export function EndgameTraining({
  exercise,
  practice,
  hideInstructions,
  wins,
  onSuccess,
  onBack,
  onPractice,
  onReview,
}: {
  exercise: Endgame;
  practice: boolean;
  hideInstructions: boolean;
  wins: number;
  onSuccess: () => void;
  onBack: () => void;
  onPractice: () => void;
  onReview: () => void;
}) {
  const [game, setGame] = useState(() => new Chess(exercise.fen));
  const [stage, setStage] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [pending, setPending] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const recorded = useRef(false);
  const outcome = endgameOutcome(game, exercise);
  const busy = game.turn() === "b" && !outcome;
  useEffect(() => {
    if (!busy) return;
    const timer = setTimeout(() => {
      const move = chooseEndgameMove(game, exercise);
      if (move) {
        const next = cloneGame(game);
        next.move(move);
        setGame(next);
      }
    }, 550);
    return () => clearTimeout(timer);
  }, [game, exercise, busy]);
  useEffect(() => {
    if (outcome?.status === "success" && practice && !recorded.current) {
      recorded.current = true;
      onSuccess();
    }
  }, [outcome?.status, practice, onSuccess]);
  function restart() {
    recorded.current = false;
    setPending(null);
    setFeedback("");
    setStage(0);
    setGame(new Chess(exercise.fen));
  }
  function move(from: Square, to: Square, promotion?: PromotionPiece) {
    if (busy || outcome) return;
    const result = resolveMove(game, from, to, promotion);
    if (result.kind === "invalid") {
      setFeedback(
        "Esse movimento não é permitido pelas regras do xadrez. Escolha outra casa.",
      );
      return;
    }
    if (result.kind === "promotion") {
      setPending({ from, to });
      return;
    }
    setPending(null);
    setFeedback(
      practice
        ? "Lance registrado."
        : endgameFeedback(game, result.game, result.move, exercise),
    );
    setGame(result.game);
  }
  return (
    <>
      <div className="mode-heading">
        <button className="text-link" onClick={onBack}>
          ← Voltar aos finais
        </button>
        <h1>{exercise.title}</h1>
        <p>
          {practice ? "PRÁTICA SEM DICAS" : "TUTORIAL INTERATIVO"} · Brancas ·
          Iniciante
        </p>
      </div>
      <div className="game-layout endgame-layout">
        <div className="board-column">
          <div className="player-strip">
            <span>♚ Adversário · Pretas</span>
            <span>{busy ? "Pensando…" : "Defesa automática"}</span>
          </div>
          <Board
            game={game}
            orientation="w"
            interactive={!busy && !outcome}
            onMove={move}
            reportInvalidMoves
            showHints={!practice && !hideInstructions}
          />
          <div className="player-strip">
            <span>♔ Você · Brancas</span>
            <span>
              {outcome
                ? "Exercício encerrado"
                : busy
                  ? "Vez do adversário"
                  : "Sua vez"}
            </span>
          </div>
          <div className="board-under">
            <button className="secondary-btn" onClick={restart}>
              Reiniciar exercício
            </button>
            <button className="text-link" onClick={onBack}>
              Voltar aos finais
            </button>
          </div>
        </div>
        <div className="right-column">
          <section className="panel endgame-panel">
            <span className="overline">
              {practice ? "SEU OBJETIVO" : "SUA AULA"}
            </span>
            <h2>{exercise.name}</h2>
            <p>{exercise.objective}</p>
            {!practice && !outcome && (
              <>
                <div className="endgame-intro">
                  {exercise.intro.map((text) => (
                    <p key={text}>{text}</p>
                  ))}
                </div>
                <h3>
                  {stage + 1}. {exercise.stages[stage].title}
                </h3>
                <p>{exercise.stages[stage].text}</p>
                <div className="endgame-concepts">
                  <button
                    className="secondary-btn"
                    disabled={stage === 0}
                    onClick={() => setStage((s) => s - 1)}
                  >
                    Conceito anterior
                  </button>
                  <button
                    className="secondary-btn"
                    disabled={stage === exercise.stages.length - 1}
                    onClick={() => setStage((s) => s + 1)}
                  >
                    Próximo conceito
                  </button>
                </div>
                <small>
                  Os conceitos são orientações. Você pode experimentar qualquer
                  lance legal.
                </small>
                <button className="secondary-btn" onClick={onPractice}>
                  Praticar sem dicas
                </button>
              </>
            )}
            {!outcome && feedback && (
              <div role="status" className="feedback">
                {feedback}
              </div>
            )}
            {outcome && (
              <div className="endgame-result" role="status">
                <h3>
                  {outcome.status === "success"
                    ? "Objetivo concluído!"
                    : "Tente novamente"}
                </h3>
                <p>{outcome.message}</p>
                <dl>
                  <dt>Resultado</dt>
                  <dd>{outcome.result}</dd>
                  <dt>Seus lances</dt>
                  <dd>
                    {
                      game
                        .history({ verbose: true })
                        .filter((m) => m.color === "w").length
                    }
                  </dd>
                  <dt>Conceito principal</dt>
                  <dd>{exercise.concept}</dd>
                  <dt>Domínio</dt>
                  <dd>
                    {wins}/3 · {wins >= 3 ? "Dominado" : "Em treinamento"}
                  </dd>
                </dl>
                {!practice && (
                  <p>
                    O tutorial não contabiliza acertos. Conclua a prática sem
                    dicas para avançar.
                  </p>
                )}
                <button
                  className="primary-btn"
                  onClick={practice ? restart : onPractice}
                >
                  {practice ? "Tentar novamente" : "Praticar sem dicas"}
                </button>
                {practice && (
                  <button className="secondary-btn" onClick={onReview}>
                    Rever tutorial
                  </button>
                )}
              </div>
            )}
          </section>
          <MoveHistory game={game} />
        </div>
      </div>
      {pending && (
        <PromotionDialog
          color="w"
          onChoose={(piece) => move(pending.from, pending.to, piece)}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}
