import { test } from "node:test";
import assert from "node:assert/strict";
import {
  freshGame,
  restoreGame,
  recruit,
  finishTask,
  nextGoal,
  taskProblem,
} from "../src/game.js";

test("initial seeds buy a bridge helper, and gathering remains renewable", () => {
  const s = freshGame();
  assert.equal(recruit(s, "pebble"), null);
  assert.equal(s.seeds, 0);
  assert.equal(finishTask(s, "seeds", "sprout"), null);
  assert.equal(s.seeds, 4);
  assert.equal(finishTask(s, "seeds", "sprout"), null);
  assert.equal(s.seeds, 8);
});
test("wrong roles, inaccessible beds and insufficient resources cannot mutate progress", () => {
  const s = freshGame();
  const before = structuredClone(s);
  assert.match(finishTask(s, "bridge", "sprout"), /Pebble/);
  assert.deepEqual(s, before);
  assert.equal(recruit(s, "glow"), null);
  assert.match(finishTask(s, "tree", "glow"), /bridge/);
  assert.equal(s.won, false);
});
test("recruitment cannot spend unavailable seeds or duplicate helpers", () => {
  const s = freshGame();
  recruit(s, "pebble");
  assert.match(recruit(s, "dew"), /more seeds/);
  assert.equal(s.seeds, 0);
  assert.match(recruit(s, "pebble"), /already/);
  assert.equal(s.seeds, 0);
});
test("flower beds require the bridge, seeds and water, and only spend once", () => {
  const s = freshGame();
  s.seeds = 20;
  recruit(s, "dew");
  assert.match(taskProblem(s, "flower0", "dew"), /bridge/);
  s.bridge = true;
  assert.match(taskProblem(s, "flower0", "dew"), /water/);
  finishTask(s, "water", "dew");
  const seeds = s.seeds;
  assert.equal(finishTask(s, "flower0", "dew"), null);
  assert.equal(s.seeds, seeds - 2);
  assert.equal(s.water, 2);
  assert.match(finishTask(s, "flower0", "dew"), /already/);
  assert.equal(s.water, 2);
});
test("the guided loop completes a whole garden without dead ends", () => {
  const s = freshGame();
  let steps = 0;
  while (!s.won && steps++ < 40) {
    const goal = nextGoal(s);
    if (goal.recruit) assert.equal(recruit(s, goal.recruit), null);
    else {
      s.selected = goal.helper;
      assert.equal(finishTask(s, goal.task, goal.helper), null);
    }
    assert.ok(s.seeds >= 0 && s.water >= 0);
  }
  assert.ok(s.won);
  assert.ok(s.bridge);
  assert.ok(s.flowers.every(Boolean));
  assert.equal(Object.keys(s.helpers).length, 4);
  assert.equal(nextGoal(s).done, true);
});
test("tree awakening requires all flowers and enough water", () => {
  const s = freshGame();
  s.seeds = 20;
  recruit(s, "glow");
  s.bridge = true;
  assert.match(taskProblem(s, "tree", "glow"), /all three/);
  s.flowers = [true, true, true];
  assert.match(taskProblem(s, "tree", "glow"), /3 drops/);
  s.water = 3;
  assert.equal(finishTask(s, "tree", "glow"), null);
  assert.equal(s.water, 0);
  assert.equal(s.won, true);
});
test("saved games recover safely from malformed or incompatible data", () => {
  for (const value of [
    null,
    {},
    { ...freshGame(), seeds: -1 },
    { ...freshGame(), flowers: [] },
    { ...freshGame(), helpers: { sprout: { x: NaN } } },
    { ...freshGame(), helpers: { sprout: { x: -9 }, pebble: null } },
    { ...freshGame(), selected: "constructor" },
    { ...freshGame(), selected: "missing" },
    { ...freshGame(), won: true },
  ])
    assert.deepEqual(restoreGame(value), freshGame());
  const s = freshGame();
  recruit(s, "pebble");
  s.bridge = true;
  const recovered = restoreGame(s);
  assert.deepEqual(recovered, s);
  recovered.seeds = 5;
  assert.notEqual(s.seeds, recovered.seeds);
});
