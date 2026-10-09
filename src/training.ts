import { openings, type Opening } from "./openings";
export type TrainingSession = {
  targets: Record<string, number>;
  completed: Record<string, number>;
};
export function createSession(
  targets: Record<string, number>,
): TrainingSession {
  const clean = Object.fromEntries(
    openings
      .filter(
        (o) =>
          Number.isInteger(targets[o.id]) &&
          targets[o.id] >= 1 &&
          targets[o.id] <= 20,
      )
      .map((o) => [o.id, targets[o.id]]),
  );
  return {
    targets: clean,
    completed: Object.fromEntries(Object.keys(clean).map((id) => [id, 0])),
  };
}
export function nextOpening(
  session: TrainingSession,
  previous?: string,
  random = Math.random,
): Opening | undefined {
  const remaining = openings.filter(
    (o) => session.completed[o.id] < session.targets[o.id],
  );
  const different = remaining.filter((o) => o.id !== previous);
  const pool = different.length ? different : remaining;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
export function recordTrainingSuccess(
  session: TrainingSession,
  id: string,
): TrainingSession {
  if (!(id in session.targets)) return session;
  return {
    ...session,
    completed: {
      ...session.completed,
      [id]: Math.min(session.targets[id], session.completed[id] + 1),
    },
  };
}
