import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Chess, type Square } from "chess.js";
import {
  Maximize,
  Minimize,
  PanelRight,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Flag,
  GraduationCap,
  Home,
  Medal,
  RotateCcw,
  Shield,
  Swords,
  Target,
  Trophy,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { openings, lineText, type Opening, type Color } from "./openings";
import {
  cpuMove,
  cloneGame,
  resultText,
  resolveMove,
  type PromotionPiece,
} from "./chess";
import {
  loadProgress,
  saveProgress,
  completeOpening,
  type Progress,
} from "./progress";
import { Board } from "./Board";
import { PromotionDialog } from "./PromotionDialog";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/outfit";
import { TrainingSetup } from "./TrainingSetup";
import {
  nextOpening,
  recordTrainingSuccess,
  type TrainingSession,
} from "./training";
import "./style.css";
import { MoveHistory } from "./MoveHistory";
import { EndgameCatalog } from "./EndgameCatalog";
import { EndgameTraining } from "./EndgameTraining";
import { endgameData, type Endgame } from "./endgameData";
import {
  loadEndgameProgress,
  saveEndgameProgress,
  recordEndgame,
} from "./EndgameProgress";

type View =
  | "home"
  | "catalog"
  | "practice-center"
  | "game"
  | "tutorial"
  | "practice"
  | "endgames"
  | "endgame-tutorial"
  | "endgame-practice";
function App() {
  const [endgameProgress, setEndgameProgress] = useState(loadEndgameProgress);
  const [selectedEndgame, setSelectedEndgame] = useState(endgameData[0]);
  const [endgameRestart, setEndgameRestart] = useState(0);
  const [endgameStorageError, setEndgameStorageError] = useState(false);
  useEffect(() => {
    setEndgameStorageError(!saveEndgameProgress(endgameProgress));
  }, [endgameProgress]);
  function startEndgame(exercise: Endgame, practice: boolean) {
    navigate(practice ? "endgame-practice" : "endgame-tutorial");
    setSelectedEndgame(exercise);
    setEndgameRestart((n) => n + 1);
    setEndgameProgress((p) => recordEndgame(p, exercise.id, false));
  }
  const [fullBoard, setFullBoard] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const nativeFullscreen = useRef(false);
  function exitFullBoard() {
    setFullBoard(false);
    if (document.fullscreenElement === shell.current)
      void document.exitFullscreen().catch(() => {});
  }
  function enterFullBoard() {
    setShowInstructions(false);
    setFullBoard(true);
    if (shell.current?.requestFullscreen)
      void shell.current.requestFullscreen().catch(() => {});
  }
  useEffect(() => {
    const changed = () => {
      if (document.fullscreenElement === shell.current)
        nativeFullscreen.current = true;
      else if (nativeFullscreen.current) {
        nativeFullscreen.current = false;
        setFullBoard(false);
      }
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector('[role="dialog"]'))
        exitFullBoard();
    };
    document.addEventListener("fullscreenchange", changed);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("fullscreenchange", changed);
      window.removeEventListener("keydown", key);
    };
  }, []);
  useEffect(() => {
    if (fullBoard) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [fullBoard]);

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [view, setView] = useState<View>("home");
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [filter, setFilter] = useState<Color>("w");
  const [chosen, setChosen] = useState<Opening>(openings[0]);
  const [game, setGame] = useState(() => new Chess());
  const [modeColor, setModeColor] = useState<Color>("w");
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"good" | "bad" | "neutral">(
    "neutral",
  );
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resigned, setResigned] = useState(false);
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [tick, setTick] = useState(0);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const mastered = openings.filter((o) => progress[o.id]?.wins === 3).length;
  const totalWins = openings.reduce(
    (s, o) => s + (progress[o.id]?.wins || 0),
    0,
  );
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setStorageUnavailable(!saveProgress(progress));
  }, [progress]);
  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    [],
  );
  function schedule(fn: () => void, ms = 650) {
    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(fn, ms);
  }
  function fresh(next: View, opening?: Opening, color?: Color) {
    if (next !== "practice") setSession(null);
    if (pending.current) clearTimeout(pending.current);
    const c = new Chess();
    setGame(c);
    setStep(0);
    setFeedback("");
    setFeedbackType("neutral");
    setDone(false);
    setBusy(false);
    setResigned(false);
    setPromotion(null);
    if (opening) setChosen(opening);
    if (color) setModeColor(color);
    setView(next);
    setTick((t) => t + 1);
  }
  function startOpening(o: Opening, m: "tutorial" | "practice") {
    setSession(null);
    fresh(m, o);
  }
  function navigate(next: View) {
    exitFullBoard();
    setSession(null);
    if (pending.current) clearTimeout(pending.current);
    setBusy(false);
    setView(next);
  }
  function goHome() {
    navigate("home");
  }
  function makeLineResponse(
    c: Chess,
    o: Opening,
    index: number,
    forTutorial: boolean,
  ) {
    const san = o.line[index];
    if (!san) return;
    try {
      c.move(san);
    } catch {
      return;
    }
    setGame(cloneGame(c));
    setStep(index + 1);
    setBusy(false);
    if (forTutorial) {
      setFeedback(
        `O adversário respondeu ${san}. ${o.responseNotes[san] || ""}`,
      );
      setFeedbackType("neutral");
    } else {
      setFeedback("");
      setFeedbackType("neutral");
    }
    if (index + 1 >= o.line.length) finishOpening(forTutorial, o);
  }
  function startTraining(training: TrainingSession) {
    const first = nextOpening(training);
    if (!first) return;
    setSession(training);
    fresh("practice", first);
  }
  function finishOpening(forTutorial: boolean, o: Opening) {
    setDone(true);
    setBusy(false);
    setProgress((p) => completeOpening(p, o.id, forTutorial));
    if (!forTutorial && session) {
      const updated = recordTrainingSuccess(session, o.id);
      setSession(updated);
      const next = nextOpening(updated, o.id);
      if (next) schedule(() => fresh("practice", next), 1600);
    }
  }
  // For black opening lines, the first white move is executed automatically.
  useEffect(() => {
    if (
      (view !== "tutorial" && view !== "practice") ||
      chosen.color !== "b" ||
      step !== 0 ||
      busy ||
      done
    )
      return;
    setBusy(true);
    schedule(() => {
      const c = new Chess();
      makeLineResponse(c, chosen, 0, view === "tutorial");
    }, 520);
  }, [view, chosen, step, tick]);
  // For the free game with black, the engine starts.
  useEffect(() => {
    if (
      view !== "game" ||
      modeColor !== "b" ||
      game.history().length ||
      busy ||
      resigned
    )
      return;
    setBusy(true);
    schedule(() => {
      const c = new Chess();
      const m = cpuMove(c, "w");
      if (m) c.move(m);
      setGame(c);
      setBusy(false);
    }, 650);
  }, [view, modeColor, tick]);
  function rejectMove(message: string) {
    setFeedback(message);
    setFeedbackType("bad");
    if (view === "practice") {
      setBusy(true);
      schedule(() => fresh("practice", chosen), 1800);
    }
  }
  function processMove(from: Square, to: Square, promote?: PromotionPiece) {
    if (busy || done || resigned) return;
    if (game.turn() !== (view === "game" ? modeColor : chosen.color)) return;
    const resolved = resolveMove(game, from, to, promote);
    if (resolved.kind === "invalid") {
      rejectMove(
        view === "practice"
          ? "Movimento inválido. Esta tentativa não conta. Seus acertos foram mantidos; iniciando uma nova tentativa."
          : "Movimento inválido pelas regras do xadrez. Tente outro lance.",
      );
      return;
    }
    if (resolved.kind === "promotion") {
      setPromotion({ from, to });
      return;
    }
    const c = resolved.game,
      m = resolved.move;
    if (view === "game") {
      if (game.turn() !== modeColor) return;
      setGame(c);
      setFeedback("");
      if (c.isGameOver()) {
        setDone(true);
        return;
      }
      setBusy(true);
      schedule(() => {
        const next = cloneGame(c);
        const reply = cpuMove(next, modeColor === "w" ? "b" : "w");
        if (reply) next.move(reply);
        setGame(next);
        setBusy(false);
        if (next.isGameOver()) setDone(true);
      }, 550);
      return;
    }
    if (view === "tutorial" || view === "practice") {
      const expected = chosen.line[step];
      if (!expected) return;
      if (m.san !== expected) {
        rejectMove(
          view === "practice"
            ? `Você jogou ${m.san}. Essa tentativa teve um erro e não conta. Seus acertos foram mantidos; iniciando uma nova tentativa.`
            : `Você jogou ${m.san}, mas a linha estudada pede ${expected}. ${chosen.notes[expected] || "Tente novamente."}`,
        );
        return;
      }
      setGame(c);
      setStep(step + 1);
      if (view === "tutorial") {
        setFeedback(`Correto! ${m.san}. ${chosen.notes[m.san] || ""}`);
        setFeedbackType("good");
      } else {
        setFeedback("Lance correto. Continue a sequência.");
        setFeedbackType("good");
      }
      if (step + 1 >= chosen.line.length) {
        finishOpening(view === "tutorial", chosen);
        return;
      }
      setBusy(true);
      schedule(
        () => {
          const next = cloneGame(c);
          makeLineResponse(next, chosen, step + 1, view === "tutorial");
        },
        view === "tutorial" ? 1050 : 560,
      );
    }
  }
  const gameResult = resigned
    ? `Você desistiu. Vitória das ${modeColor === "w" ? "pretas" : "brancas"}.`
    : resultText(game);
  const currentHint = useMemo(() => {
    if (view !== "tutorial" || done || busy) return null;
    const current = chosen.line[step];
    if (!current) return null;
    try {
      const m = game.moves({ verbose: true }).find((x) => x.san === current);
      return m ? { from: m.from, to: m.to } : null;
    } catch {
      return null;
    }
  }, [view, game, step, chosen, busy, done]);
  const ownStep = chosen.line
    .slice(0, step)
    .filter((_, i) => i % 2 === (chosen.color === "w" ? 0 : 1)).length;
  return (
    <div
      ref={shell}
      className={`app-shell ${fullBoard ? "board-fullscreen" : ""} ${showInstructions ? "instructions-open" : ""}`}
    >
      {(view === "game" ||
        view === "tutorial" ||
        view === "practice" ||
        view === "endgame-tutorial" ||
        view === "endgame-practice") && (
        <div className={fullBoard ? "focus-toolbar" : "focus-entry"}>
          {fullBoard ? (
            <>
              <span className="focus-title">
                {view === "game"
                  ? "Jogo livre"
                  : view.startsWith("endgame-")
                    ? selectedEndgame.name
                    : chosen.name}
              </span>
              <button
                className="secondary-btn"
                aria-expanded={showInstructions}
                onClick={() => setShowInstructions((value) => !value)}
              >
                <PanelRight size={16} />
                {showInstructions ? "Ocultar instruções" : "Mostrar instruções"}
              </button>
              <button
                className="secondary-btn"
                disabled={!!session && done}
                onClick={() =>
                  view.startsWith("endgame-")
                    ? setEndgameRestart((n) => n + 1)
                    : fresh(
                        view,
                        view === "game" ? undefined : chosen,
                        view === "game" ? modeColor : undefined,
                      )
                }
              >
                <RotateCcw size={16} />
                <span className="focus-restart-label">Reiniciar</span>
              </button>
              <button className="secondary-btn" onClick={exitFullBoard}>
                <Minimize size={16} />
                Sair
              </button>
            </>
          ) : (
            <button className="secondary-btn" onClick={enterFullBoard}>
              <Maximize size={16} />
              Tela cheia
            </button>
          )}
        </div>
      )}
      <aside className="sidebar">
        <button className="brand" onClick={goHome}>
          <div className="brand-emblem">♞</div>
          <div>
            <strong>
              CHESS<span>ACADEMY</span>
            </strong>
            <small>YOUR CHESS JOURNEY</small>
          </div>
        </button>
        <div className="side-label">PLATAFORMA</div>
        <nav>
          <button className={view === "home" ? "nav-on" : ""} onClick={goHome}>
            <Home size={19} /> Visão geral
          </button>
          <button
            className={view === "game" ? "nav-on" : ""}
            onClick={() => fresh("game", undefined, "w")}
          >
            <Swords size={19} /> Jogo livre
          </button>
          <button
            className={
              view === "catalog" || view === "tutorial" ? "nav-on" : ""
            }
            onClick={() => navigate("catalog")}
          >
            <BookOpen size={19} /> Aprender aberturas
          </button>
          <button
            className={
              view === "practice-center" || view === "practice" ? "nav-on" : ""
            }
            onClick={() => navigate("practice-center")}
          >
            <Target size={19} /> Central de repetição
          </button>
          <button
            className={view.startsWith("endgame") ? "nav-on" : ""}
            onClick={() => navigate("endgames")}
          >
            <Flag size={19} />
            Treinar finais
          </button>
        </nav>
        <div className="side-label train-label">SEU TREINAMENTO</div>
        <div className="side-progress">
          <div className="side-progress-head">
            <span>Domínio de aberturas</span>
            <strong>
              {mastered}/{openings.length}
            </strong>
          </div>
          <div className="progress-track">
            <div style={{ width: `${(mastered / openings.length) * 100}%` }} />
          </div>
          <small>
            {totalWins} de {openings.length * 3} repetições concluídas
          </small>
        </div>
        <div className="sidebar-bottom">
          <div className="side-bottom-icon">
            <GraduationCap size={22} />
          </div>
          <div>
            <strong>Um lance por vez.</strong>
            <p>Consistência transforma conhecimento em habilidade.</p>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="mobile-brand">
            <span>♞</span> CHESS ACADEMY
          </div>
          <div className="breadcrumb">
            ACADEMY <ChevronRight size={14} />{" "}
            <span>
              {view === "home"
                ? "Visão geral"
                : view === "game"
                  ? "Jogo livre"
                  : view === "catalog"
                    ? "Aberturas"
                    : view === "practice-center"
                      ? "Central de repetição"
                      : view.startsWith("endgame")
                        ? view === "endgames"
                          ? "Treinamento de Finais"
                          : selectedEndgame.name
                        : chosen.name}
            </span>
          </div>
          <div className="header-right">
            <span className="online-dot" /> TREINAMENTO LOCAL{" "}
            <div className="avatar">CA</div>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Navegação principal">
          <button
            onClick={goHome}
            aria-current={view === "home" ? "page" : undefined}
          >
            <Home size={18} />
            Início
          </button>
          <button
            onClick={() => fresh("game", undefined, "w")}
            aria-current={view === "game" ? "page" : undefined}
          >
            <Swords size={18} />
            Jogar
          </button>
          <button
            onClick={() => navigate("catalog")}
            aria-current={
              view === "catalog" || view === "tutorial" ? "page" : undefined
            }
          >
            <BookOpen size={18} />
            Aprender
          </button>
          <button
            onClick={() => navigate("practice-center")}
            aria-current={
              view === "practice-center" || view === "practice"
                ? "page"
                : undefined
            }
          >
            <Target size={18} />
            Repetir
          </button>
          <button
            onClick={() => navigate("endgames")}
            aria-current={view.startsWith("endgame") ? "page" : undefined}
          >
            <Flag size={18} />
            Finais
          </button>
        </nav>
        <div className="page-content">
          {(storageUnavailable || endgameStorageError) && (
            <div role="status" className="feedback bad">
              O navegador bloqueou o armazenamento. Seu progresso funciona nesta
              sessão, mas não será salvo após atualizar.
            </div>
          )}
          {view === "home" && (
            <>
              <section className="hero">
                <div className="hero-text">
                  <div className="eyebrow">
                    <span className="tiny-star">✦</span> SUA JORNADA COMEÇA AQUI
                  </div>
                  <h1>
                    Domine o tabuleiro.
                    <br />
                    <em>Um lance de cada vez.</em>
                  </h1>
                  <p>
                    Aprenda a pensar como um enxadrista. Estude aberturas,
                    pratique suas estratégias e evolua no seu próprio ritmo.
                  </p>
                  <button
                    className="primary-btn"
                    onClick={() => navigate("catalog")}
                  >
                    Começar a aprender <ArrowRight size={18} />
                  </button>
                </div>
                <div className="hero-art">
                  <div className="hero-ring ring-a" />
                  <div className="hero-ring ring-b" />
                  <span className="hero-chess">♞</span>
                  <span className="art-star art-star-a">✦</span>
                  <span className="art-star art-star-b">✧</span>
                </div>
              </section>
              <div className="section-heading">
                <div>
                  <span className="overline">ESCOLHA SEU CAMINHO</span>
                  <h2>O que vamos fazer hoje?</h2>
                </div>
              </div>
              <div className="feature-grid three-modules">
                <button
                  className="feature-card"
                  onClick={() => fresh("game", undefined, "w")}
                >
                  <div className="feature-icon green-icon">
                    <Swords size={27} />
                  </div>
                  <div className="feature-kicker">DESAFIO</div>
                  <h3>
                    Jogo Livre <ArrowRight size={20} />
                  </h3>
                  <p>
                    Enfrente o computador e coloque seu raciocínio à prova em
                    uma partida completa.
                  </p>
                  <span className="feature-link">
                    Jogar agora <ChevronRight size={16} />
                  </span>
                  <div className="feature-watermark">♚</div>
                </button>
                <button
                  className="feature-card"
                  onClick={() => navigate("catalog")}
                >
                  <div className="feature-icon gold-icon">
                    <BookOpen size={27} />
                  </div>
                  <div className="feature-kicker">APRENDIZADO</div>
                  <h3>
                    Treinar Aberturas <ArrowRight size={20} />
                  </h3>
                  <p>
                    Aprenda as ideias por trás de cada movimento e memorize
                    {openings.length} aberturas essenciais.
                  </p>
                  <span className="feature-link gold-link">
                    Explorar aberturas <ChevronRight size={16} />
                  </span>
                  <div className="feature-watermark">♙</div>
                </button>
                <button
                  className="feature-card"
                  onClick={() => navigate("endgames")}
                >
                  <div className="feature-icon green-icon">
                    <Flag size={27} />
                  </div>
                  <div className="feature-kicker">CONVERSÃO DE VANTAGEM</div>
                  <h3>
                    Treinamento de Finais <ArrowRight size={20} />
                  </h3>
                  <p>Aprenda a transformar vantagens em vitória.</p>
                  <p>
                    Domine os finais essenciais com explicações interativas,
                    exercícios práticos e repetição.
                  </p>
                  <small>3 exercícios disponíveis.</small>
                  <span className="feature-link">
                    Explorar finais <ChevronRight size={16} />
                  </span>
                  <div className="feature-watermark">♖</div>
                </button>
              </div>
              <div className="section-heading section-space">
                <div>
                  <span className="overline">SEU DESEMPENHO</span>
                  <h2>Evolução do treinamento</h2>
                </div>
                <button
                  className="text-link"
                  onClick={() => navigate("practice-center")}
                >
                  Ver central de repetição <ArrowRight size={16} />
                </button>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-icon">
                    <Trophy size={20} />
                  </span>
                  <strong>
                    {mastered}
                    <small> / {openings.length}</small>
                  </strong>
                  <span>Aberturas dominadas</span>
                  <div className="mini-track">
                    <div
                      style={{
                        width: `${(mastered / openings.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon amber">
                    <Target size={20} />
                  </span>
                  <strong>
                    {totalWins}
                    <small> / {openings.length * 3}</small>
                  </strong>
                  <span>Repetições corretas</span>
                  <div className="mini-track">
                    <div
                      style={{
                        width: `${(totalWins / (openings.length * 3)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon blue">
                    <BookOpen size={20} />
                  </span>
                  <strong>
                    {openings.filter((o) => progress[o.id]?.studied).length}
                    <small> / {openings.length}</small>
                  </strong>
                  <span>Tutoriais concluídos</span>
                  <div className="mini-track">
                    <div
                      style={{
                        width: `${(openings.filter((o) => progress[o.id]?.studied).length / openings.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          {view === "endgames" && (
            <EndgameCatalog progress={endgameProgress} onStart={startEndgame} />
          )}
          {(view === "endgame-tutorial" || view === "endgame-practice") && (
            <EndgameTraining
              key={`${selectedEndgame.id}-${view}-${endgameRestart}`}
              exercise={selectedEndgame}
              practice={view === "endgame-practice"}
              hideInstructions={fullBoard && !showInstructions}
              wins={endgameProgress[selectedEndgame.id].wins}
              onSuccess={() =>
                setEndgameProgress((p) =>
                  recordEndgame(p, selectedEndgame.id, true),
                )
              }
              onBack={() => navigate("endgames")}
              onPractice={() => startEndgame(selectedEndgame, true)}
              onReview={() => startEndgame(selectedEndgame, false)}
            />
          )}
          {view === "catalog" && (
            <>
              <div className="page-intro">
                <span className="overline">BIBLIOTECA DE ESTRATÉGIAS</span>
                <h1>Treinar aberturas</h1>
                <p>
                  Aprenda os princípios fundamentais por trás de cada lance, com
                  orientação passo a passo.
                </p>
              </div>
              <div className="tab-bar">
                <button
                  className={filter === "w" ? "active" : ""}
                  onClick={() => setFilter("w")}
                >
                  ♔ Peças brancas
                </button>
                <button
                  className={filter === "b" ? "active" : ""}
                  onClick={() => setFilter("b")}
                >
                  ♚ Peças pretas
                </button>
              </div>
              <div className="opening-grid">
                {openings
                  .filter((o) => o.color === filter)
                  .map((o, i) => (
                    <div className="opening-card" key={o.id}>
                      <div className="opening-top">
                        <div className="opening-icon">{o.icon}</div>
                        <span className="level">● INICIANTE</span>
                      </div>
                      <span className="opening-index">ABERTURA 0{i + 1}</span>
                      <h3>{o.name}</h3>
                      <p>{o.subtitle}</p>
                      <div className="opening-divider" />
                      <div className="opening-meta">
                        <span>
                          {progress[o.id].wins === 3 ? (
                            <>
                              <Medal size={16} /> Dominada
                            </>
                          ) : progress[o.id].studied ? (
                            <>
                              <CheckCircle2 size={16} /> Estudando
                            </>
                          ) : (
                            <>
                              <CircleHelp size={16} /> Não iniciada
                            </>
                          )}
                        </span>
                        <span>{progress[o.id].wins}/3 repetições</span>
                      </div>
                      <div className="opening-actions">
                        <button
                          className="primary-btn"
                          onClick={() => startOpening(o, "tutorial")}
                        >
                          <GraduationCap size={16} /> Aprender
                        </button>
                        <button
                          className="secondary-btn"
                          onClick={() => startOpening(o, "practice")}
                        >
                          <Target size={16} /> Praticar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
          {view === "practice-center" && (
            <>
              <div className="page-intro">
                <span className="overline">MEMORIZAÇÃO ATIVA</span>
                <h1>Central de repetição</h1>
                <p>
                  Execute cada abertura do início ao fim, sem dicas. Três
                  execuções corretas concluem o desafio.
                </p>
              </div>
              <div className="repeat-summary">
                <div className="repeat-circle">
                  {mastered}
                  <span>/{openings.length}</span>
                </div>
                <div>
                  <strong>
                    {mastered === openings.length
                      ? "Todas as aberturas dominadas!"
                      : "Sua evolução, lance a lance."}
                  </strong>
                  <p>
                    {mastered} de {openings.length} aberturas dominadas ·{" "}
                    {totalWins} de {openings.length * 3}
                    repetições concluídas
                  </p>
                </div>
                <div className="repeat-track">
                  <div
                    style={{
                      width: `${(totalWins / (openings.length * 3)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <TrainingSetup onStart={startTraining} />
              <div className="repeat-list">
                {openings.map((o) => (
                  <div className="repeat-item" key={o.id}>
                    <div className="repeat-icon">{o.icon}</div>
                    <div className="repeat-info">
                      <strong>
                        {o.name}{" "}
                        {progress[o.id].wins === 3 && (
                          <Medal size={17} className="medal" />
                        )}
                      </strong>
                      <span>
                        Jogar de {o.color === "w" ? "brancas" : "pretas"}
                      </span>
                    </div>
                    <div className="repeat-pips">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className={i < progress[o.id].wins ? "filled" : ""}
                        >
                          {i < progress[o.id].wins ? (
                            <Check size={14} />
                          ) : (
                            i + 1
                          )}
                        </span>
                      ))}
                    </div>
                    <span
                      className={`status ${progress[o.id].wins === 3 ? "complete" : ""}`}
                    >
                      {progress[o.id].wins === 3
                        ? "Dominada"
                        : progress[o.id].wins
                          ? "Em treinamento"
                          : "Pendente"}
                    </span>
                    <button
                      className="secondary-btn"
                      onClick={() => startOpening(o, "practice")}
                    >
                      Praticar <ArrowRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="tip">
                <Brain size={17} /> Repetições incorretas não apagam as
                conquistas anteriores. Continue praticando!
              </p>
            </>
          )}
          {view === "game" && (
            <>
              <div className="mode-heading">
                <div>
                  <button className="back-link" onClick={goHome}>
                    <ArrowLeft size={15} /> Voltar
                  </button>
                  <h1>
                    Jogo livre{" "}
                    <span className="mode-tag">
                      <Swords size={13} /> PARTIDA
                    </span>
                  </h1>
                  <p>Um desafio contra o computador em nível iniciante.</p>
                </div>
                <button
                  className="secondary-btn"
                  onClick={() => fresh("game", undefined, modeColor)}
                >
                  <RotateCcw size={16} /> Nova partida
                </button>
              </div>
              <div className="game-layout">
                <div className="board-column">
                  <div className="player-strip">
                    <div className="player-avatar enemy">♚</div>
                    <div>
                      <strong>Computador</strong>
                      <small>
                        Iniciante · {modeColor === "w" ? "Pretas" : "Brancas"}
                      </small>
                    </div>
                    <span className="player-status">
                      {busy ? "Pensando..." : "Pronto"}
                    </span>
                  </div>
                  <Board
                    game={game}
                    orientation={modeColor}
                    interactive={
                      !done && !busy && !resigned && game.turn() === modeColor
                    }
                    onMove={processMove}
                  />
                  <div className="player-strip">
                    <div className="player-avatar self">♔</div>
                    <div>
                      <strong>Você</strong>
                      <small>
                        {modeColor === "w" ? "Peças brancas" : "Peças pretas"}
                      </small>
                    </div>
                    <span className="player-status active-status">
                      {game.isCheck() && game.turn() === modeColor
                        ? "Em xeque"
                        : game.turn() === modeColor && !done && !resigned
                          ? "Sua vez"
                          : "Aguarde"}
                    </span>
                  </div>
                </div>
                <div className="right-column">
                  <div className="control-card">
                    <div className="panel-heading">Configuração</div>
                    <p className="muted">
                      Escolha seu lado e inicie uma nova partida.
                    </p>
                    <div className="color-options">
                      <button
                        className={modeColor === "w" ? "color-active" : ""}
                        onClick={() => fresh("game", undefined, "w")}
                      >
                        <span>♔</span> Brancas
                      </button>
                      <button
                        className={modeColor === "b" ? "color-active" : ""}
                        onClick={() => fresh("game", undefined, "b")}
                      >
                        <span>♚</span> Pretas
                      </button>
                    </div>
                    <div className="difficulty">
                      <span>Dificuldade</span>
                      <strong>
                        <span className="green-circle" /> Iniciante
                      </strong>
                    </div>
                  </div>
                  <MoveHistory game={game} />
                  {gameResult && (
                    <div className="result-card">
                      <Trophy size={23} />
                      <h3>Fim da partida</h3>
                      <p>{gameResult}</p>
                      <button
                        className="primary-btn"
                        onClick={() => fresh("game", undefined, modeColor)}
                      >
                        Jogar novamente
                      </button>
                    </div>
                  )}
                  {!gameResult && (
                    <button
                      className="resign-btn"
                      onClick={() => {
                        if (pending.current) clearTimeout(pending.current);
                        setResigned(true);
                        setBusy(false);
                      }}
                    >
                      <Flag size={16} /> Desistir da partida
                    </button>
                  )}
                  {feedback && <div className="feedback bad">{feedback}</div>}
                </div>
              </div>
            </>
          )}
          {(view === "tutorial" || view === "practice") && (
            <>
              <div className="mode-heading">
                <div>
                  <button
                    className="back-link"
                    onClick={() =>
                      navigate(
                        view === "tutorial" ? "catalog" : "practice-center",
                      )
                    }
                  >
                    <ArrowLeft size={15} /> Voltar para{" "}
                    {view === "tutorial" ? "aberturas" : "repetições"}
                  </button>
                  <h1>
                    {chosen.name}{" "}
                    <span
                      className={`mode-tag ${view === "practice" ? "gold-tag" : ""}`}
                    >
                      {view === "tutorial" ? (
                        <GraduationCap size={13} />
                      ) : (
                        <Brain size={13} />
                      )}{" "}
                      {view === "tutorial" ? "MODO TUTORIAL" : "MODO REPETIÇÃO"}
                    </span>
                  </h1>
                  <p>
                    {view === "tutorial"
                      ? chosen.objective
                      : "Sem dicas: reproduza todos os movimentos da sua cor sem cometer erros."}
                  </p>
                </div>
                <button
                  className="secondary-btn"
                  disabled={!!session && done}
                  onClick={() => fresh(view, chosen)}
                >
                  <RotateCcw size={16} /> Reiniciar
                </button>
              </div>
              <div className="game-layout">
                <div className="board-column">
                  <div className="player-strip">
                    <div className="player-avatar enemy">
                      {chosen.color === "w" ? "♚" : "♔"}
                    </div>
                    <div>
                      <strong>Adversário</strong>
                      <small>Respostas da linha estudada</small>
                    </div>
                    <span className="player-status">
                      {busy ? "Movendo..." : "Automático"}
                    </span>
                  </div>
                  <Board
                    game={game}
                    orientation={chosen.color}
                    interactive={!busy && !done && game.turn() === chosen.color}
                    onMove={processMove}
                    hint={fullBoard && !showInstructions ? null : currentHint}
                    showHints={
                      view === "tutorial" && (!fullBoard || showInstructions)
                    }
                  />
                  <div className="player-strip">
                    <div className="player-avatar self">
                      {chosen.color === "w" ? "♔" : "♚"}
                    </div>
                    <div>
                      <strong>Você</strong>
                      <small>
                        {chosen.color === "w"
                          ? "Peças brancas"
                          : "Peças pretas"}
                      </small>
                    </div>
                    <span className="player-status active-status">
                      {done ? "Concluído" : busy ? "Aguarde" : "Sua vez"}
                    </span>
                  </div>
                </div>
                <div className="right-column">
                  {session && (
                    <div className="training-session" role="status">
                      <h3>Treino aleatório</h3>
                      {Object.keys(session.targets).map((id) => (
                        <div className="training-session-row" key={id}>
                          <span>
                            {openings.find((o) => o.id === id)!.short}
                          </span>
                          <strong>
                            {session.completed[id]}/{session.targets[id]}
                          </strong>
                        </div>
                      ))}
                      <p>
                        {done
                          ? nextOpening(session)
                            ? "Preparando a próxima abertura…"
                            : "Meta atingida em todas as aberturas!"
                          : "Complete a sequência sem erros."}
                      </p>
                      <button
                        className="secondary-btn"
                        onClick={() => navigate("practice-center")}
                      >
                        {done && !nextOpening(session)
                          ? "Voltar à central"
                          : "Encerrar treino"}
                      </button>
                    </div>
                  )}
                  <div className="lesson-card">
                    <div className="lesson-kicker">
                      {view === "tutorial" ? "SUA AULA" : "TESTE DE MEMÓRIA"}{" "}
                      <span>
                        {Math.min(step, chosen.line.length)}/
                        {chosen.line.length} lances
                      </span>
                    </div>
                    <div className="progress-track lesson-track">
                      <div
                        style={{
                          width: `${(step / chosen.line.length) * 100}%`,
                        }}
                      />
                    </div>
                    {done ? (
                      <div className="lesson-done">
                        <div className="completion-medal">
                          {view === "tutorial" ? "✓" : "★"}
                        </div>
                        <h2>
                          {view === "tutorial"
                            ? "Abertura aprendida!"
                            : session && !nextOpening(session)
                              ? "Treino concluído!"
                              : "Sequência perfeita!"}
                        </h2>
                        <p>
                          {view === "tutorial"
                            ? `Você concluiu o tutorial da ${chosen.name}. Agora fixe essa estratégia na memória.`
                            : session
                              ? `Acerto registrado: ${session.completed[chosen.id]} de ${session.targets[chosen.id]} repetições nesta sessão.`
                              : `Excelente! Você reproduziu todos os lances sem erros. ${Math.min(progress[chosen.id].wins, 3)} de 3 repetições concluídas.`}
                        </p>
                        <div className="sequence-text">
                          {lineText(chosen.line)}
                        </div>
                        {!session && (
                          <button
                            className="primary-btn wide"
                            onClick={() => fresh("practice", chosen)}
                          >
                            {view === "tutorial"
                              ? "Iniciar treinamento de repetição"
                              : "Praticar novamente"}{" "}
                            <ArrowRight size={16} />
                          </button>
                        )}
                        {view === "practice" &&
                          progress[chosen.id].wins >= 3 && (
                            <div className="dominated">
                              <Medal size={17} /> Abertura dominada!
                            </div>
                          )}
                      </div>
                    ) : view === "tutorial" ? (
                      <>
                        <span className="step-eyebrow">
                          PASSO {ownStep + 1} DE{" "}
                          {Math.ceil(chosen.line.length / 2)}
                        </span>
                        <h2>
                          {busy
                            ? "Resposta do adversário"
                            : `Sua vez: ${chosen.line[step] || ""}`}
                        </h2>
                        <p className="lesson-explanation">
                          {busy
                            ? "Observe o lance das peças adversárias e sua função na posição."
                            : chosen.notes[chosen.line[step]] ||
                              "Execute o lance destacado no tabuleiro."}
                        </p>
                        <div className="lesson-instruction">
                          <Zap size={19} />
                          <div>
                            <strong>
                              {busy ? "Observe a resposta" : "Sua missão"}
                            </strong>
                            <p>
                              {busy
                                ? "O computador vai executar o próximo movimento."
                                : currentHint
                                  ? `Mova a peça de ${currentHint.from} para ${currentHint.to}.`
                                  : "Acompanhe os movimentos no tabuleiro."}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="step-eyebrow">
                          REPETIÇÃO{" "}
                          {session
                            ? session.completed[chosen.id] + 1
                            : Math.min(progress[chosen.id].wins + 1, 3)}{" "}
                          DE {session ? session.targets[chosen.id] : 3}
                        </span>
                        <h2>Confie na sua memória.</h2>
                        <p className="lesson-explanation">
                          Reproduza a linha que você aprendeu. Você não receberá
                          dicas dos próximos lances.
                        </p>
                        <div className="memory-count">
                          <div>
                            <strong>
                              {session
                                ? session.completed[chosen.id]
                                : progress[chosen.id].wins}
                            </strong>
                            <span>Acertos completos</span>
                          </div>
                          <div>
                            <strong>
                              {session ? session.targets[chosen.id] : 3}
                            </strong>
                            <span>Meta</span>
                          </div>
                        </div>
                      </>
                    )}
                    {feedback && !done && (
                      <div
                        role="status"
                        aria-live="polite"
                        className={`feedback ${feedbackType}`}
                      >
                        <div>
                          {feedbackType === "good" ? (
                            <CheckCircle2 size={17} />
                          ) : feedbackType === "bad" ? (
                            <X size={17} />
                          ) : (
                            <Volume2 size={17} />
                          )}
                        </div>
                        <span>{feedback}</span>
                      </div>
                    )}
                  </div>
                  <MoveHistory game={game} />
                  <div className="side-note">
                    <Shield size={18} />{" "}
                    {view === "tutorial"
                      ? "As dicas aparecem apenas durante o tutorial. Aprenda antes de memorizar."
                      : "Uma tentativa com erro não é contabilizada, mas seus acertos anteriores permanecem."}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <footer>
          © Chess Academy · Aprenda. Pratique. Domine.{" "}
          <span>Feito para evoluir um lance por vez.</span>
        </footer>
      </main>
      {promotion && (
        <PromotionDialog
          color={modeColor}
          onCancel={() => setPromotion(null)}
          onChoose={(piece) => {
            const move = promotion;
            setPromotion(null);
            processMove(move.from, move.to, piece);
          }}
        />
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
