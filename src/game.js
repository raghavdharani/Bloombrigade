export const HELPERS = {
  sprout: {
    name: "Seed Sprout",
    short: "Sprout",
    role: "Gathers seeds",
    cost: 0,
    color: "#a8ca79",
    x: -9,
  },
  pebble: {
    name: "Pebble Pal",
    short: "Pebble",
    role: "Repairs the bridge",
    cost: 3,
    color: "#b8a9d5",
    x: -9.6,
  },
  dew: {
    name: "Dew Dancer",
    short: "Dew",
    role: "Gathers water · grows flowers",
    cost: 3,
    color: "#8fc7dc",
    x: -10.2,
  },
  glow: {
    name: "Glow Moth",
    short: "Glow",
    role: "Wakes the Great Tree",
    cost: 3,
    color: "#edd18b",
    x: -10.8,
  },
};
export const SITES = [
  { id: "seeds", name: "Seed patch", x: -7, helper: "sprout", duration: 1.8 },
  { id: "water", name: "Water pool", x: -3.6, helper: "dew", duration: 1.8 },
  {
    id: "bridge",
    name: "Little bridge",
    x: -1.1,
    helper: "pebble",
    duration: 3,
  },
  {
    id: "flower0",
    name: "First flower bed",
    x: 3.4,
    helper: "dew",
    duration: 2.4,
  },
  {
    id: "flower1",
    name: "Second flower bed",
    x: 5.7,
    helper: "dew",
    duration: 2.4,
  },
  {
    id: "flower2",
    name: "Third flower bed",
    x: 8,
    helper: "dew",
    duration: 2.4,
  },
  { id: "tree", name: "Great Tree", x: 10.2, helper: "glow", duration: 3.5 },
];
export function freshGame() {
  return {
    version: 1,
    seeds: 3,
    water: 0,
    bridge: false,
    flowers: [false, false, false],
    won: false,
    selected: "sprout",
    helpers: { sprout: { x: -9 } },
  };
}
export function restoreGame(value) {
  if (
    !value ||
    value.version !== 1 ||
    !Number.isInteger(value.seeds) ||
    value.seeds < 0 ||
    value.seeds > 999 ||
    !Number.isInteger(value.water) ||
    value.water < 0 ||
    value.water > 999 ||
    !Array.isArray(value.flowers) ||
    value.flowers.length !== 3 ||
    value.flowers.some((x) => typeof x !== "boolean") ||
    typeof value.bridge !== "boolean" ||
    typeof value.won !== "boolean" ||
    !value.helpers?.sprout ||
    !Object.hasOwn(HELPERS, value.selected) ||
    !Object.hasOwn(value.helpers, value.selected)
  )
    return freshGame();
  for (const [id, helper] of Object.entries(value.helpers)) {
    if (
      !Object.hasOwn(HELPERS, id) ||
      !helper ||
      !Number.isFinite(helper.x) ||
      helper.x < -12 ||
      helper.x > 12
    )
      return freshGame();
  }
  if (
    (value.flowers.some(Boolean) && !value.bridge) ||
    (value.won && !value.flowers.every(Boolean))
  )
    return freshGame();
  return structuredClone(value);
}
export function recruit(state, id) {
  const helper = Object.hasOwn(HELPERS, id) ? HELPERS[id] : null;
  if (!helper || state.helpers[id])
    return "That helper is already in your team.";
  if (state.seeds < helper.cost)
    return `Gather ${helper.cost - state.seeds} more seeds first.`;
  state.seeds -= helper.cost;
  state.helpers[id] = { x: helper.x };
  state.selected = id;
  return null;
}
export function taskProblem(state, id, helperId = state.selected) {
  const site = SITES.find((s) => s.id === id);
  if (!site) return "Choose a garden task.";
  if (!state.helpers[helperId])
    return `Invite ${HELPERS[site.helper].name} first.`;
  if (helperId !== site.helper)
    return `${HELPERS[site.helper].name} can help here. Select them below.`;
  if (site.x > 1 && !state.bridge)
    return "Repair the bridge to reach the other side.";
  if (id === "bridge" && state.bridge)
    return "The bridge is ready. Let’s grow some flowers!";
  if (id.startsWith("flower")) {
    if (state.flowers[Number(id.at(-1))])
      return "This flower bed is already blooming.";
    if (state.seeds < 2)
      return "Seed Sprout needs to gather more seeds. This bed needs 2.";
    if (state.water < 2)
      return "Gather water at the pool. This bed needs 2 drops.";
  }
  if (id === "tree") {
    if (state.won) return "The garden is already awake!";
    if (!state.flowers.every(Boolean))
      return "Grow all three flower beds to wake the Great Tree.";
    if (state.water < 3) return "Gather 3 drops of water for the Great Tree.";
  }
  if (
    (id === "seeds" && state.seeds >= 99) ||
    (id === "water" && state.water >= 99)
  )
    return "You have plenty for now!";
  return null;
}
export function finishTask(state, id, helperId) {
  const problem = taskProblem(state, id, helperId);
  if (problem) return problem;
  if (id === "seeds") state.seeds = Math.min(99, state.seeds + 4);
  if (id === "water") state.water = Math.min(99, state.water + 4);
  if (id === "bridge") state.bridge = true;
  if (id.startsWith("flower")) {
    state.seeds -= 2;
    state.water -= 2;
    state.flowers[Number(id.at(-1))] = true;
  }
  if (id === "tree") {
    state.water -= 3;
    state.won = true;
  }
  return null;
}
export function nextGoal(state) {
  if (state.won)
    return {
      title: "A garden renewed",
      detail: "You did it. Your little team brought the garden back to life.",
      done: true,
    };
  if (!state.helpers.pebble)
    return state.seeds < 3
      ? gatherSeeds()
      : {
          title: "A little help goes a long way",
          detail: "Invite Pebble Pal for 3 seeds. They can repair the bridge.",
          recruit: "pebble",
          label: "Invite Pebble Pal",
        };
  if (!state.bridge)
    return {
      title: "Make a path together",
      detail: "Guide Pebble Pal to the broken bridge.",
      task: "bridge",
      helper: "pebble",
      label: "Repair the bridge",
    };
  if (!state.helpers.dew)
    return state.seeds < 3
      ? gatherSeeds()
      : {
          title: "Meet your watering expert",
          detail: "Invite Dew Dancer for 3 seeds to help flowers grow.",
          recruit: "dew",
          label: "Invite Dew Dancer",
        };
  if (!state.flowers.every(Boolean)) {
    if (state.seeds < 2) return gatherSeeds();
    if (state.water < 2) return gatherWater();
    const n = state.flowers.indexOf(false);
    return {
      title: "A little color returns",
      detail: `Grow flower bed ${n + 1} of 3 with 2 seeds and 2 drops.`,
      task: `flower${n}`,
      helper: "dew",
      label: "Grow a flower bed",
    };
  }
  if (!state.helpers.glow)
    return state.seeds < 3
      ? gatherSeeds()
      : {
          title: "One last garden friend",
          detail: "Invite Glow Moth for 3 seeds to awaken the Great Tree.",
          recruit: "glow",
          label: "Invite Glow Moth",
        };
  if (state.water < 3) return gatherWater();
  return {
    title: "Wake the Great Tree",
    detail: "Bring a little light and 3 drops of water to the tree.",
    task: "tree",
    helper: "glow",
    label: "Wake the Great Tree",
  };
}
function gatherSeeds() {
  return {
    title: "Seeds for new beginnings",
    detail: "Guide Seed Sprout to the seed patch. Each visit gathers 4 seeds.",
    task: "seeds",
    helper: "sprout",
    label: "Gather seeds",
  };
}
function gatherWater() {
  return {
    title: "A drink for the garden",
    detail: "Guide Dew Dancer to the pool. Each visit gathers 4 drops.",
    task: "water",
    helper: "dew",
    label: "Gather water",
  };
}
