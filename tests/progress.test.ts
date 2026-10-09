import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  initialProgress,
  completeOpening,
  loadProgress,
  saveProgress,
  PROGRESS_KEY,
} from "../src/progress";
afterEach(() => Reflect.deleteProperty(globalThis, "localStorage"));
function storage(initial: string | null = null) {
  const values = new Map<string, string>();
  if (initial !== null) values.set(PROGRESS_KEY, initial);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  return values;
}
test("A tutorial marks studied but never counts as a repetition", () => {
  const result = completeOpening(initialProgress(), "italiana", true);
  assert.deepEqual(result.italiana, { studied: true, wins: 0 });
  assert.equal(result.gambito.wins, 0);
});
test("Correct completions accumulate up to three, including intervening errors", () => {
  let p = initialProgress();
  p = completeOpening(p, "italiana", false);
  const afterError = structuredClone(p);
  assert.equal(afterError.italiana.wins, 1);
  p = completeOpening(afterError, "italiana", false);
  p = completeOpening(p, "italiana", false);
  p = completeOpening(p, "italiana", false);
  assert.equal(p.italiana.wins, 3);
  assert.equal(p.gambito.wins, 0);
});
test("All mastered openings survive storage round trip", () => {
  storage();
  let p = initialProgress();
  for (const id of Object.keys(p)) {
    p = completeOpening(p, id, true);
    for (let i = 0; i < 3; i++) p = completeOpening(p, id, false);
  }
  assert.equal(saveProgress(p), true);
  assert.deepEqual(loadProgress(), p);
});
test("Malformed, missing and out of range progress is safely normalized", () => {
  for (const raw of ["not json", "null", "[]"]) {
    storage(raw);
    assert.deepEqual(loadProgress(), initialProgress());
  }
  storage(
    JSON.stringify({
      italiana: { studied: true, wins: 9 },
      gambito: { wins: -2 },
      siciliana: { wins: 1.8 },
      francesa: { wins: "invalid" },
    }),
  );
  const p = loadProgress();
  assert.equal(p.italiana.wins, 3);
  assert.equal(p.gambito.wins, 0);
  assert.equal(p.siciliana.wins, 1);
  assert.equal(p.francesa.wins, 0);
});
test("Storage denied does not throw or break in-memory progression", () => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("SecurityError");
    },
  });
  assert.deepEqual(loadProgress(), initialProgress());
  assert.equal(saveProgress(initialProgress()), false);
});
test("Expanding the catalog preserves legacy progress and initializes new openings", () => {
  storage(
    JSON.stringify({
      italiana: { studied: true, wins: 3 },
      gambito: { studied: true, wins: 2 },
      siciliana: { studied: false, wins: 1 },
      francesa: { studied: true, wins: 3 },
    }),
  );
  const result = loadProgress();
  assert.equal(Object.keys(result).length, 14);
  assert.deepEqual(result.gambito, { studied: true, wins: 2 });
  assert.deepEqual(result.siciliana, { studied: false, wins: 1 });
  assert.deepEqual(result.escocesa, { studied: false, wins: 0 });
  assert.deepEqual(result["rainha-recusado"], { studied: false, wins: 0 });
});
