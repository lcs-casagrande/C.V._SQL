import { endgameData, type EndgameId } from "./endgameData";
export const ENDGAME_PROGRESS_KEY = "chess-academy-endgames-v1";
export type EndgameProgress = Record<
  EndgameId,
  { studied: boolean; wins: number }
>;
export function loadEndgameProgress(): EndgameProgress {
  let raw: Record<string, { studied?: unknown; wins?: unknown }> = {};
  try {
    raw = JSON.parse(localStorage.getItem(ENDGAME_PROGRESS_KEY) || "{}") || {};
  } catch {
    /* Storage may be unavailable. */
  }
  return Object.fromEntries(
    endgameData.map((e) => {
      const p = raw[e.id];
      return [
        e.id,
        {
          studied: p?.studied === true,
          wins:
            typeof p?.wins === "number" && Number.isFinite(p.wins)
              ? Math.max(0, Math.min(3, Math.floor(p.wins)))
              : 0,
        },
      ];
    }),
  ) as EndgameProgress;
}
export function saveEndgameProgress(progress: EndgameProgress) {
  try {
    localStorage.setItem(ENDGAME_PROGRESS_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
export function recordEndgame(
  progress: EndgameProgress,
  id: EndgameId,
  success: boolean,
): EndgameProgress {
  return {
    ...progress,
    [id]: {
      studied: true,
      wins: Math.min(3, progress[id].wins + (success ? 1 : 0)),
    },
  };
}
