import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createSession,
  nextOpening,
  recordTrainingSuccess,
} from "../src/training";
test("Selection accepts only known openings with integer repetition targets", () => {
  const s = createSession({
    gambito: 2,
    siciliana: 4,
    unknown: 3,
    italiana: 0,
    francesa: 1.5,
  });
  assert.deepEqual(s.targets, { gambito: 2, siciliana: 4 });
  assert.equal(nextOpening(createSession({})), undefined);
});
test("Random selection chooses remaining openings and alternates when possible", () => {
  const s = createSession({ gambito: 1, siciliana: 2 });
  assert.equal(nextOpening(s, undefined, () => 0)?.id, "gambito");
  assert.equal(nextOpening(s, undefined, () => 0.99)?.id, "siciliana");
  assert.equal(nextOpening(s, "gambito", () => 0)?.id, "siciliana");
  const after = recordTrainingSuccess(s, "gambito");
  assert.equal(nextOpening(after, "siciliana")?.id, "siciliana");
  assert.equal(s.completed.gambito, 0);
});
test("Independent session goals can exceed mastery and end exactly at their target", () => {
  let s = createSession({ gambito: 4 });
  for (let i = 0; i < 3; i++) {
    s = recordTrainingSuccess(s, "gambito");
    assert.ok(nextOpening(s));
  }
  s = recordTrainingSuccess(s, "gambito");
  assert.equal(nextOpening(s), undefined);
  assert.equal(recordTrainingSuccess(s, "gambito").completed.gambito, 4);
});
