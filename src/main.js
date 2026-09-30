import "./style.css";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/nunito";
import {
  HELPERS,
  SITES,
  freshGame,
  restoreGame,
  recruit,
  taskProblem,
  finishTask,
  nextGoal,
} from "./game.js";
import { createGarden } from "./scene.js";

const icons = {
  leaf: '<path d="M19 4C8 3 3 9 7 15c5 5 13 0 12-11Z"/><path d="m5 20 9-10"/>',
  seed: '<path d="M17 4C6 5 3 12 7 17c6 5 13-3 10-13Z"/><path d="m8 17 7-9"/>',
  water:
    '<path d="M12 3C10 7 5 11 5 15a7 7 0 0 0 14 0c0-4-5-8-7-12Z"/><path d="M9 15c0 2 1 3 3 3"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 5 11 7-11 7Z"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="m10 3-1 3-3 1-3 3 2 2-1 3 3 3 3-1 2 2 3-1 1-3 3-1-1-4-3-1-1-3Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  bridge: '<path d="M3 18V7m18 11V7M3 13h18M7 9v8m5-8v8m5-8v8"/>',
  flower:
    '<path d="M12 14v7m0-3-4-2m4 0 4-2"/><circle cx="12" cy="8" r="3"/><path d="M9 6C4 1 2 9 7 10c-3 5 5 8 5 2 3 5 9 0 5-3 5-3-1-8-4-4"/>',
};
const icon = (id, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[id] || icons.leaf}</svg>`;
const $ = (id) => document.getElementById(id);
const SAVE = "bloom-brigade-save-v1";
const SETTINGS = "bloom-brigade-settings-v1";
let state = freshGame(),
  settings = {
    sound: false,
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    left: "a",
    right: "d",
    action: " ",
  };
let storageAvailable = true;
try {
  state = restoreGame(JSON.parse(localStorage.getItem(SAVE)));
  const savedSettings = JSON.parse(localStorage.getItem(SETTINGS));
  if (
    savedSettings &&
    typeof savedSettings.sound === "boolean" &&
    typeof savedSettings.reduced === "boolean"
  ) {
    settings.sound = savedSettings.sound;
    settings.reduced = savedSettings.reduced;
    const bindings = ["left", "right", "action"].map((k) => savedSettings[k]);
    if (
      bindings.every((k) => typeof k === "string" && k.length === 1) &&
      new Set(bindings).size === 3
    ) {
      ["left", "right", "action"].forEach((k) => {
        settings[k] = savedSettings[k];
      });
    }
  }
} catch {
  storageAvailable = false;
}
let started = false,
  paused = false,
  task = null,
  walking = null,
  cameraOffset = 0;
let input = "Keyboard + mouse",
  padPrevious = [],
  touchDirection = 0,
  selectedSite = "seeds",
  audio;
const keys = new Set();
document.querySelector("#app").innerHTML = `
  <header class="topbar">
    <a class="brand" href="#" aria-label="Bloom Brigade home">${icon("leaf")}<span>Bloom<span class="brand-light">brigade</span><small>A LITTLE TEAMWORK. A GARDEN RENEWED.</small></span></a>
    <div class="chapter"><span class="chapter-dot"></span> THE FIRST GARDEN <span class="chapter-number">01</span></div>
    <div class="top-actions"><span id="save-status" class="save-status">Progress saved on this device</span><button id="settings" class="icon-button" aria-label="Settings and controls">${icon("settings")}</button><button id="pause" class="icon-button" aria-label="Pause game">${icon("pause")}</button></div>
  </header>
  <main class="layout">
    <section class="garden-panel" aria-label="Interactive 3D garden">
      <div class="scene-heading"><span class="eyebrow">YOUR LITTLE CORNER OF THE WORLD</span><h1>A place to bloom.</h1><p>No hurry. Just a little help, one flower at a time.</p></div>
      <div class="resources" aria-label="Resources"><span class="resource seed">${icon("seed")}<strong id="seeds">3</strong><span>seeds</span></span><span class="resource water">${icon("water")}<strong id="water">0</strong><span>drops</span></span></div>
      <div id="scene-wrap"><canvas id="garden" tabindex="0" aria-label="3D garden. Click a helper to select them or a garden task to guide them. Keyboard and task buttons are available below."></canvas><div id="site-labels" aria-label="Garden tasks"></div><div id="render-error" hidden>3D rendering is unavailable. Enable WebGL in your browser and reload.</div></div>
      <div class="scene-footer"><span id="input-mode">${icon("leaf")} Keyboard + mouse</span><span id="scene-hint">Click a garden task to guide your helper</span><button id="center-camera" class="text-button">Center view</button></div>
      <div class="touch-controls" aria-label="Touch movement"><button id="move-left" aria-label="Move left">←</button><button id="move-right" aria-label="Move right">→</button><button id="touch-action" aria-label="Interact with nearest task">${icon("leaf")} Help</button></div>
    </section>
    <aside class="journey-panel">
      <div class="journey-top"><span class="eyebrow">A SMALL ADVENTURE</span><span class="level-badge">GARDEN 01</span></div>
      <h2>Bring the garden<br>back to life.</h2><p class="intro-copy">A sleeping tree. A few little friends.<br>Something lovely is about to grow.</p>
      <div class="progress-head"><span>Garden restored</span><strong id="progress-label">0%</strong></div><div class="progress-track" role="progressbar" aria-label="Garden restored" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="progress-fill"></div></div>
      <ol class="milestones"><li id="milestone-bridge">${icon("bridge")}<span>Make a path<small>Repair the little bridge</small></span><span class="milestone-check"></span></li><li id="milestone-flowers">${icon("flower")}<span>Let color return<small id="flower-count">Grow 3 flower beds</small></span><span class="milestone-check"></span></li><li id="milestone-tree">${icon("leaf")}<span>Wake the Great Tree<small>Bring the garden together</small></span><span class="milestone-check"></span></li></ol>
      <div class="goal-card"><span class="eyebrow" id="goal-eyebrow">YOUR NEXT LITTLE STEP</span><h3 id="goal-title"></h3><p id="goal-detail"></p><button id="goal-action" class="primary-button"></button><div id="task-progress" class="task-progress" hidden><div id="task-fill"></div></div></div>
      <p class="gentle-note">${icon("leaf")} A little progress is still progress.</p>
    </aside>
    <section class="team-panel" aria-label="Your garden helpers"><div class="team-heading"><div><span class="eyebrow">BETTER TOGETHER</span><h2>Your little team</h2></div><span class="team-tip">Select a friend. Give them a little purpose.</span></div><div id="helpers" class="helper-grid"></div></section>
  </main>
  <footer class="page-footer"><span>Made for small moments of joy.</span><span id="controls-summary">A / D move · Space help · 1–4 select · Esc pause</span></footer>
  <p id="announcement" class="sr-only" role="status" aria-live="polite"></p><div id="toast" role="status" hidden></div>
  <dialog id="welcome"><span class="dialog-leaf">${icon("leaf")}</span><span class="eyebrow">WELCOME TO BLOOM BRIGADE</span><h2>A little garden.<br>A big beginning.</h2><p>Gather seeds, invite your garden friends, and help a sleepy world bloom. There’s no timer and nothing to fight.</p><div class="welcome-steps"><span>${icon("seed")} Gather</span><span>${icon("bridge")} Restore</span><span>${icon("flower")} Grow</span></div><button id="begin" class="primary-button">${Object.keys(state.helpers).length > 1 || state.seeds !== 3 ? "Continue your garden" : "Let’s grow together"} ${icon("arrow")}</button><small>Keyboard + mouse · Controller · Touch</small></dialog>
  <dialog id="pause-dialog"><span class="eyebrow">TAKE YOUR TIME</span><h2>The garden can wait.</h2><p>Your progress is saved on this device.</p><button id="resume" class="primary-button">Back to the garden ${icon("play")}</button><button id="restart" class="secondary-button">Start a fresh garden</button></dialog>
  <dialog id="settings-dialog"><span class="eyebrow">MAKE YOURSELF AT HOME</span><h2>Settings & controls</h2><label class="setting-row">Gentle sound effects<input type="checkbox" id="sound-toggle"></label><label class="setting-row">Reduce motion<input type="checkbox" id="motion-toggle"></label><div class="bindings"><label>Move left<input id="binding-left" maxlength="1" aria-label="Move left key"></label><label>Move right<input id="binding-right" maxlength="1" aria-label="Move right key"></label><label>Help / interact<input id="binding-action" maxlength="1" aria-label="Interact key" placeholder="Space"></label></div><p class="controls-copy">Mouse / touch: select a helper, then a task. Arrow keys also move. 1–4 selects or invites helpers. Enter takes the guided next step. Q / E pans the view.</p><p class="controls-copy">Controller: left stick moves · A interacts · X takes the next step · bumpers cycle helpers · D-pad cycles garden tasks · Y assigns the highlighted task · right stick pans · Start pauses. Standard-mapped controllers supported.</p><p id="binding-error" role="alert"></p><button id="close-settings" class="primary-button">Save & return ${icon("check")}</button></dialog>
  <dialog id="win-dialog"><span class="dialog-leaf">${icon("flower")}</span><span class="eyebrow">LOOK WHAT YOU GREW</span><h2>A garden renewed.</h2><p>The Great Tree is awake. Every seed, every drop, and every little friend made a difference.</p><div class="win-summary"><strong>3</strong> flower beds blooming <span>·</span> <strong>4</strong> garden friends</div><button id="explore" class="primary-button">Enjoy your garden ${icon("leaf")}</button><button id="play-again" class="secondary-button">Grow a fresh garden</button></dialog>
  <dialog id="confirm-dialog"><h2>A fresh beginning?</h2><p>This replaces the garden saved on this device.</p><button id="confirm-reset" class="primary-button">Start fresh</button><button id="cancel-reset" class="secondary-button">Keep my garden</button></dialog>`;

let garden;
try {
  garden = createGarden($("garden"), (pick) => {
    if (!started || paused) return;
    setInput(
      matchMedia("(pointer: coarse)").matches ? "Touch" : "Keyboard + mouse",
    );
    if (pick.helper) selectHelper(pick.helper);
    else if (pick.site) startTask(pick.site);
    else {
      task = null;
      walking = boundedX(pick.x);
      updateUI();
    }
  });
} catch (error) {
  console.error("Could not initialize 3D garden", error);
  $("render-error").hidden = false;
  $("begin").disabled = true;
  $("begin").textContent = "WebGL is required to play";
}
const labels = new Map();
for (const site of SITES) {
  const b = document.createElement("button");
  b.className = "site-label";
  b.dataset.site = site.id;
  b.textContent =
    site.id === "seeds"
      ? "Gather seeds"
      : site.id === "water"
        ? "Gather water"
        : site.id === "bridge"
          ? "Repair bridge"
          : site.id === "tree"
            ? "Great Tree"
            : `Flower ${Number(site.id.at(-1)) + 1}`;
  b.setAttribute("aria-label", site.name);
  b.addEventListener("click", () => startTask(site.id));
  $("site-labels").append(b);
  labels.set(site.id, b);
}
for (const [id, helper] of Object.entries(HELPERS)) {
  const b = document.createElement("button");
  b.className = "helper-card";
  b.dataset.helper = id;
  b.innerHTML = `<span class="helper-portrait ${id}"><span class="mini-body"><i></i><i></i><b></b></span></span><span class="helper-info"><strong>${helper.name}</strong><small>${helper.role}</small><span class="helper-state"></span></span><span class="helper-key">${Object.keys(HELPERS).indexOf(id) + 1}</span>`;
  b.addEventListener("click", () =>
    state.helpers[id] ? selectHelper(id) : invite(id),
  );
  $("helpers").append(b);
}
function save() {
  try {
    localStorage.setItem(SAVE, JSON.stringify(state));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  $("save-status").textContent = storageAvailable
    ? "Progress saved on this device"
    : "Session only · storage unavailable";
}
function tone() {
  if (!settings.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const o = audio.createOscillator(),
      gain = audio.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(523, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(784, audio.currentTime + 0.15);
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.35);
    o.connect(gain);
    gain.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.36);
  } catch {
    /* Sound is optional when browser audio is unavailable. */
  }
}
let toastTimer;
function notify(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  $("announcement").textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $("toast").hidden = true;
  }, 4200);
}
function setInput(mode) {
  if (input === mode) return;
  input = mode;
  $("input-mode").innerHTML = `${icon("leaf")} ${mode}`;
  $("controls-summary").textContent =
    mode === "Controller"
      ? "Left stick move · A help · X next step · Start pause"
      : mode === "Touch"
        ? "Tap a friend · Tap a task · Use arrows to move"
        : `${settings.left.toUpperCase()} / ${settings.right.toUpperCase()} move · ${settings.action === " " ? "Space" : settings.action.toUpperCase()} help · 1–4 select · Esc pause`;
}
function selectHelper(id) {
  if (!started || paused || !state.helpers[id]) return;
  if (state.selected !== id) {
    task = null;
    walking = null;
  }
  state.selected = id;
  cameraOffset = 0;
  save();
  updateUI();
}
function invite(id) {
  if (!started || paused) return;
  const error = recruit(state, id);
  if (error) return notify(error);
  task = null;
  walking = null;
  tone();
  notify(`${HELPERS[id].name} joined your little team!`);
  save();
  updateUI();
}
function startTask(id) {
  if (!started || paused) return;
  if (task)
    return notify(
      "Your helper is busy. Move or choose another friend to cancel.",
    );
  const error = taskProblem(state, id);
  if (error) return notify(error);
  const site = SITES.find((s) => s.id === id);
  task = {
    id,
    helper: state.selected,
    x: site.x,
    duration: site.duration,
    elapsed: 0,
  };
  $("task-fill").style.width = "0%";
  walking = null;
  selectedSite = id;
  updateUI();
}
function doGoal() {
  if (!started || paused || task) return;
  const goal = nextGoal(state);
  if (goal.done) return;
  if (goal.recruit) invite(goal.recruit);
  else {
    selectHelper(goal.helper);
    startTask(goal.task);
  }
}
function interact() {
  const x = state.helpers[state.selected].x;
  const nearby = SITES.filter(
    (s) => Math.abs(s.x - x) <= 1.35 && s.helper === state.selected,
  );
  if (nearby.length)
    startTask(
      nearby.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0].id,
    );
  else
    notify(
      "Move closer to a task, or use the next-step button to guide your friend.",
    );
}
function boundedX(x) {
  x = Math.max(-11.5, Math.min(11.5, x));
  if (!state.bridge && x > -0.8) return -0.8;
  return x;
}
function updateUI() {
  $("seeds").textContent = state.seeds;
  $("water").textContent = state.water;
  const count = state.flowers.filter(Boolean).length;
  const progress = Math.round(
    (((state.bridge ? 1 : 0) + count + (state.won ? 1 : 0)) / 5) * 100,
  );
  $("progress-label").textContent = `${progress}%`;
  $("progress-fill").style.width = `${progress}%`;
  document
    .querySelector('[role="progressbar"]')
    .setAttribute("aria-valuenow", progress);
  for (const [id, done] of [
    ["bridge", state.bridge],
    ["flowers", count === 3],
    ["tree", state.won],
  ]) {
    $(`milestone-${id}`).classList.toggle("done", done);
    $(`milestone-${id}`).querySelector(".milestone-check").innerHTML = done
      ? icon("check")
      : "";
  }
  $("flower-count").textContent = `${count} of 3 flower beds blooming`;
  const goal = nextGoal(state);
  $("goal-title").textContent = goal.title;
  $("goal-detail").textContent = goal.detail;
  $("goal-eyebrow").textContent = goal.done
    ? "YOU MADE A DIFFERENCE"
    : task
      ? "A LITTLE TEAMWORK IN PROGRESS"
      : "YOUR NEXT LITTLE STEP";
  $("goal-action").innerHTML =
    `${task ? "Your friend is on their way…" : goal.done ? "Garden complete" : goal.label} ${icon(goal.done ? "check" : "arrow")}`;
  $("goal-action").disabled = !!task || goal.done || !started;
  $("task-progress").hidden = !task;
  document.querySelectorAll(".helper-card").forEach((b) => {
    const id = b.dataset.helper,
      owned = !!state.helpers[id];
    b.classList.toggle("selected", owned && state.selected === id);
    b.classList.toggle("locked", !owned);
    b.setAttribute("aria-pressed", String(owned && state.selected === id));
    b.querySelector(".helper-state").innerHTML = owned
      ? state.selected === id
        ? `${icon("check")} Selected`
        : "Ready to help"
      : `${icon("seed")} Invite · 3 seeds`;
    b.setAttribute(
      "aria-label",
      owned
        ? `Select ${HELPERS[id].name}`
        : `Invite ${HELPERS[id].name} for 3 seeds`,
    );
  });
  for (const [id, b] of labels) {
    b.classList.toggle("highlighted", selectedSite === id || goal.task === id);
    b.classList.toggle(
      "completed",
      (id === "bridge" && state.bridge) ||
        (id === "tree" && state.won) ||
        (id.startsWith("flower") && state.flowers[Number(id.at(-1))]),
    );
  }
}
function openDialog(id) {
  keys.clear();
  touchDirection = 0;
  paused = true;
  $(id).showModal();
}
function closeDialog(id) {
  $(id).close();
  paused = false;
}
function togglePause() {
  if (!started) return;
  if ($("pause-dialog").open) closeDialog("pause-dialog");
  else if (!document.querySelector("dialog[open]")) openDialog("pause-dialog");
}
$("begin").onclick = () => {
  started = true;
  closeDialog("welcome");
  save();
  updateUI();
  $("garden").focus();
};
$("goal-action").onclick = doGoal;
$("pause").onclick = togglePause;
$("resume").onclick = () => closeDialog("pause-dialog");
$("settings").onclick = () => {
  $("sound-toggle").checked = settings.sound;
  $("motion-toggle").checked = settings.reduced;
  for (const key of ["left", "right", "action"])
    $(`binding-${key}`).value = settings[key] === " " ? "" : settings[key];
  $("binding-error").textContent = "";
  openDialog("settings-dialog");
};
$("close-settings").onclick = () => {
  const bindings = ["left", "right", "action"].map(
    (k) => $(`binding-${k}`).value.toLowerCase() || (k === "action" ? " " : ""),
  );
  if (
    new Set(bindings).size < 3 ||
    bindings.some((k) => !k || k.length !== 1 || /[1-4qe]/.test(k))
  ) {
    $("binding-error").textContent =
      "Choose three different keys. 1–4 and Q/E are reserved.";
    return;
  }
  ["left", "right", "action"].forEach((k, i) => {
    settings[k] = bindings[i];
  });
  settings.sound = $("sound-toggle").checked;
  settings.reduced = $("motion-toggle").checked;
  try {
    localStorage.setItem(SETTINGS, JSON.stringify(settings));
  } catch {
    notify("Settings apply for this session; storage is unavailable.");
  }
  document.body.classList.toggle("reduce-motion", settings.reduced);
  input = "";
  setInput("Keyboard + mouse");
  closeDialog("settings-dialog");
};
function confirmReset() {
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  openDialog("confirm-dialog");
}
$("restart").onclick = confirmReset;
$("play-again").onclick = confirmReset;
$("cancel-reset").onclick = () => closeDialog("confirm-dialog");
$("confirm-reset").onclick = () => {
  state = freshGame();
  task = null;
  walking = null;
  cameraOffset = 0;
  started = true;
  closeDialog("confirm-dialog");
  save();
  updateUI();
};
$("explore").onclick = () => closeDialog("win-dialog");
$("center-camera").onclick = () => {
  cameraOffset = 0;
};
document.querySelector(".brand").onclick = (e) => {
  e.preventDefault();
  togglePause();
};
for (const dialog of document.querySelectorAll("dialog"))
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    if (dialog.id !== "welcome") {
      dialog.close();
      paused = false;
    }
  });
addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!document.querySelector("dialog[open]")) {
      e.preventDefault();
      togglePause();
    }
    return;
  }
  if (!started || paused || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))
    return;
  const key = e.key.toLowerCase();
  setInput("Keyboard + mouse");
  if (e.target.tagName === "BUTTON" && [" ", "enter"].includes(key)) return;
  if (
    [
      settings.left,
      settings.right,
      settings.action,
      "arrowleft",
      "arrowright",
      " ",
      "enter",
      "q",
      "e",
    ].includes(key)
  )
    e.preventDefault();
  keys.add(key);
  if (e.repeat) return;
  if (key === settings.action) interact();
  if (key === "enter") doGoal();
  if (/^[1-4]$/.test(key)) {
    const id = Object.keys(HELPERS)[Number(key) - 1];
    state.helpers[id] ? selectHelper(id) : invite(id);
  }
});
addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
addEventListener("blur", () => {
  keys.clear();
  touchDirection = 0;
  if (started && !paused) togglePause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    save();
    if (started && !paused) togglePause();
  }
});
for (const [id, direction] of [
  ["move-left", -1],
  ["move-right", 1],
]) {
  $(id).addEventListener("pointerdown", (e) => {
    setInput("Touch");
    touchDirection = direction;
    $(id).setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    $(id).addEventListener(type, () => {
      touchDirection = 0;
      save();
    });
}
$("touch-action").onclick = interact;
function cycleHelper(direction) {
  const ids = Object.keys(HELPERS);
  let n = ids.indexOf(state.selected);
  for (let i = 0; i < ids.length; i++) {
    n = (n + direction + ids.length) % ids.length;
    if (state.helpers[ids[n]]) return selectHelper(ids[n]);
  }
}
function controller() {
  const pad = Array.from(navigator.getGamepads?.() || []).find(
    (p) => p?.connected && p.mapping === "standard",
  );
  if (!pad) {
    padPrevious = [];
    return { move: 0, pan: 0 };
  }
  const pressed = pad.buttons.map((b) => b.pressed);
  const edge = (i) => pressed[i] && !padPrevious[i];
  if (pressed.some(Boolean) || pad.axes.some((a) => Math.abs(a) > 0.2))
    setInput("Controller");
  if ($("welcome").open && edge(0) && garden) $("begin").click();
  else if (document.querySelector("dialog[open]") && !$("welcome").open) {
    const dialog = document.querySelector("dialog[open]");
    const controls = [...dialog.querySelectorAll("input,button")];
    if (edge(12) || edge(13)) {
      const index = controls.indexOf(document.activeElement),
        step = edge(12) ? -1 : 1;
      controls[(index + step + controls.length) % controls.length].focus();
    }
    if (edge(0)) {
      const el = document.activeElement;
      if (el.type === "checkbox" || el.tagName === "BUTTON") el.click();
    }
    if (edge(1) || edge(9)) closeDialog(dialog.id);
  } else if (started && !paused) {
    if (edge(0)) interact();
    if (edge(2)) doGoal();
    if (edge(4)) cycleHelper(-1);
    if (edge(5)) cycleHelper(1);
    if (edge(9)) togglePause();
    if (edge(12) || edge(13) || edge(14) || edge(15)) {
      const direction = edge(12) || edge(14) ? -1 : 1;
      selectedSite =
        SITES[
          (SITES.findIndex((s) => s.id === selectedSite) +
            direction +
            SITES.length) %
            SITES.length
        ].id;
      updateUI();
      notify(
        `${SITES.find((s) => s.id === selectedSite).name} selected. Press Y to assign.`,
      );
    }
    if (edge(3)) startTask(selectedSite);
    if (edge(8)) $("settings").click();
  }
  padPrevious = pressed;
  return {
    move: Math.abs(pad.axes[0] || 0) > 0.2 ? pad.axes[0] : 0,
    pan: Math.abs(pad.axes[2] || 0) > 0.2 ? pad.axes[2] : 0,
  };
}
let previousTime = performance.now(),
  saveTime = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const delta = Math.min((now - previousTime) / 1000, 0.25);
  previousTime = now;
  const pad = controller();
  if (started && !paused) {
    const movement =
      touchDirection ||
      pad.move ||
      (keys.has(settings.right) || keys.has("arrowright") ? 1 : 0) -
        (keys.has(settings.left) || keys.has("arrowleft") ? 1 : 0);
    const helper = state.helpers[state.selected];
    if (movement) {
      task = null;
      walking = null;
      helper.x = boundedX(helper.x + movement * delta * 4.6);
    }
    const destination = task?.x ?? walking;
    if (destination !== null && destination !== undefined) {
      const gap = destination - helper.x;
      if (Math.abs(gap) > 0.08)
        helper.x = boundedX(
          helper.x + Math.sign(gap) * Math.min(Math.abs(gap), delta * 5.2),
        );
      else if (task) {
        task.elapsed += delta;
        $("task-fill").style.width = `${(task.elapsed / task.duration) * 100}%`;
        if (task.elapsed >= task.duration) {
          const completed = task.id;
          const error = finishTask(state, task.id, task.helper);
          task = null;
          if (error) notify(error);
          else {
            tone();
            notify(
              completed === "seeds"
                ? "Four seeds for something new."
                : completed === "water"
                  ? "Four fresh drops, ready to help."
                  : completed === "bridge"
                    ? "A new path! Your friends can cross now."
                    : completed === "tree"
                      ? "The Great Tree is awake!"
                      : "A little more color in the world.",
            );
          }
          save();
          updateUI();
          if (state.won && !error) openDialog("win-dialog");
        }
      } else walking = null;
    }
    const pan = pad.pan || (keys.has("e") ? 1 : 0) - (keys.has("q") ? 1 : 0);
    cameraOffset = Math.max(-10, Math.min(10, cameraOffset + pan * delta * 6));
    if (movement && $("goal-action").disabled && !state.won) updateUI();
    saveTime += delta;
    if (saveTime > 2) {
      save();
      saveTime = 0;
    }
  }
  garden?.render(
    state,
    settings.reduced || paused ? 0 : now / 1000,
    settings.reduced || paused,
    delta,
    cameraOffset,
  );
  if (garden)
    for (const [id, label] of labels) {
      const p = garden.projectSite(id);
      label.style.left = `${p.x}px`;
      label.style.top = `${p.y}px`;
      const compact = $("scene-wrap").clientWidth < 600;
      const site = SITES.find((s) => s.id === id);
      label.hidden =
        p.x < 40 ||
        p.x > $("scene-wrap").clientWidth - 40 ||
        (compact &&
          (Math.abs(site.x - state.helpers[state.selected].x) > 3.5 ||
            site.helper !== state.selected ||
            label.classList.contains("completed")));
    }
}
document.body.classList.toggle("reduce-motion", settings.reduced);
if (navigator.maxTouchPoints > 0) setInput("Touch");
addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch") setInput("Touch");
});
updateUI();
$("welcome").showModal();
paused = true;
requestAnimationFrame(frame);
