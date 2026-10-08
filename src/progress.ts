import { openings } from "./openings";
export type Progress = Record<string, { studied: boolean; wins: number }>;
export const PROGRESS_KEY = "chess-academy-progress-v1";
export const initialProgress = (): Progress =>
  Object.fromEntries(openings.map((o) => [o.id, { studied: false, wins: 0 }]));
export function loadProgress(): Progress {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return Object.fromEntries(
      openings.map((o) => [
        o.id,
        {
          studied: raw?.[o.id]?.studied === true,
          wins: Math.max(
            0,
            Math.min(3, Math.floor(Number(raw?.[o.id]?.wins) || 0)),
          ),
        },
      ]),
    );
  } catch {
    return initialProgress();
  }
}
export function saveProgress(progress: Progress): boolean {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
export function completeOpening(
  progress: Progress,
  id: string,
  tutorial: boolean,
): Progress {
  const current = progress[id];
  if (!current) return progress;
  return {
    ...progress,
    [id]: {
      studied: tutorial || current.studied,
      wins: tutorial ? current.wins : Math.min(3, current.wins + 1),
    },
  };
}
