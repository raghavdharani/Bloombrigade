import * as THREE from "three";
import { HELPERS, SITES } from "./game.js";

const palette = {
  grass: "#b5cc92",
  edge: "#91ad73",
  path: "#ecdbc0",
  trunk: "#bd9168",
  leaf: "#a7c883",
};
export function createGarden(canvas, onPick) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-16, 16, 9, -9, 0.1, 100);
  scene.add(new THREE.HemisphereLight("#fff9eb", "#8f9e7b", 1.8));
  const sun = new THREE.DirectionalLight("#fff2d8", 2);
  sun.position.set(-6, 14, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -17,
    right: 17,
    top: 12,
    bottom: -12,
    near: 0.5,
    far: 45,
  });
  sun.shadow.bias = -0.001;
  scene.add(sun);
  const materials = new Map();
  const mat = (color) => {
    if (!materials.has(color))
      materials.set(
        color,
        new THREE.MeshStandardMaterial({ color, roughness: 0.95 }),
      );
    return materials.get(color);
  };
  const sphere = new THREE.SphereGeometry(1, 20, 12);
  const box = new THREE.BoxGeometry(1, 1, 1);
  function mesh(parent, geometry, color, position, scale = [1, 1, 1]) {
    const object = new THREE.Mesh(geometry, mat(color));
    object.position.set(...position);
    object.scale.set(...scale);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  const ball = (parent, color, p, s) => mesh(parent, sphere, color, p, s);
  const block = (parent, color, p, s) => mesh(parent, box, color, p, s);
  function cylinder(parent, color, p, radius, height) {
    return mesh(
      parent,
      new THREE.CylinderGeometry(radius, radius * 1.08, height, 12),
      color,
      p,
    );
  }
  const world = new THREE.Group();
  scene.add(world);
  // Two clean garden islands make the bridge's purpose immediately visible.
  block(world, palette.edge, [-6.7, -0.67, 0], [12.2, 1.15, 6.5]);
  block(world, palette.edge, [7.1, -0.67, 0], [12.6, 1.15, 6.5]);
  block(world, palette.grass, [-6.7, -0.06, 0], [12.2, 0.15, 6.5]);
  block(world, palette.grass, [7.1, -0.06, 0], [12.6, 0.15, 6.5]);
  block(world, palette.path, [-6.7, 0.03, 0.6], [12.2, 0.035, 1.7]);
  block(world, palette.path, [7.1, 0.03, 0.6], [12.6, 0.035, 1.7]);
  const river = block(world, "#9bcbd0", [0.1, -0.43, 0], [1.7, 0.12, 7]);
  river.material = new THREE.MeshStandardMaterial({
    color: "#9bcbd0",
    roughness: 0.45,
  });
  // Nursery: a rounded cottage with a petal roof.
  const nursery = new THREE.Group();
  nursery.position.set(-10.2, 0, -1.45);
  world.add(nursery);
  cylinder(nursery, "#f4e4ca", [0, 1, 0], 1.03, 2);
  const roof = ball(nursery, "#dea28f", [0, 2.05, 0], [1.4, 0.48, 1.4]);
  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI * 2) / 5;
    const petal = ball(
      nursery,
      i % 2 ? "#eab09d" : "#e5a18f",
      [Math.cos(angle) * 0.55, 2.2, Math.sin(angle) * 0.55],
      [0.85, 0.26, 0.48],
    );
    petal.rotation.y = -angle;
  }
  block(nursery, "#ac8265", [0, 0.63, 1.01], [0.66, 1.25, 0.08]);
  ball(nursery, "#f4d59b", [0.18, 0.64, 1.09], [0.065, 0.065, 0.04]);
  block(nursery, "#d0b59a", [0, 0.12, 1.37], [1.25, 0.22, 0.6]);
  ball(nursery, "#7d9e63", [0, 2.7, 0], [0.16, 0.36, 0.14]).rotation.z = -0.5;
  const seedPatch = new THREE.Group();
  seedPatch.position.set(-7, 0, -1.1);
  world.add(seedPatch);
  ball(seedPatch, "#cab18d", [0, 0.03, 0], [0.85, 0.08, 0.65]);
  for (const [x, z] of [
    [-0.4, 0.1],
    [0.12, -0.2],
    [0.4, 0.24],
  ]) {
    ball(seedPatch, "#dbaf68", [x, 0.22, z], [0.2, 0.16, 0.14]).rotation.z =
      0.5;
  }
  const pool = ball(world, "#8abfc9", [-3.6, 0.06, -1], [1.05, 0.1, 0.75]);
  for (const [x, z] of [
    [-4.4, -0.6],
    [-3, -1.5],
    [-4.1, -1.6],
  ])
    ball(world, "#c5c4af", [x, 0.12, z], [0.26, 0.19, 0.22]);
  const bridge = new THREE.Group();
  world.add(bridge);
  for (let i = 0; i < 6; i++) {
    const plank = block(
      bridge,
      i % 2 ? "#c79c73" : "#d4ad84",
      [-0.72 + i * 0.32, 0.14, 0.6],
      [0.29, 0.15, 1.8],
    );
    plank.userData.plank = true;
  }
  for (const x of [-0.9, 1.03])
    for (const z of [-0.43, 1.62])
      cylinder(world, "#b48964", [x, 0.44, z], 0.09, 0.9);
  const flowerBeds = [];
  const flowerColors = ["#e5a193", "#e9cf87", "#b5a3cd"];
  function flower(parent, x, z, color) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    parent.add(g);
    cylinder(g, "#7e9e60", [0, 0.4, 0], 0.035, 0.8);
    ball(g, "#8fac6e", [-0.15, 0.3, 0], [0.24, 0.07, 0.1]).rotation.z = 0.4;
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      ball(
        g,
        color,
        [Math.cos(a) * 0.2, 0.84 + Math.sin(a) * 0.2, 0.01],
        [0.18, 0.18, 0.095],
      );
    }
    ball(g, "#f4dd9b", [0, 0.84, 0.12], [0.115, 0.115, 0.075]);
    return g;
  }
  for (let i = 0; i < 3; i++) {
    const bed = new THREE.Group();
    bed.position.set(SITES[i + 3].x, 0, -1.1);
    world.add(bed);
    ball(bed, "#c6a882", [0, 0.05, 0], [0.8, 0.08, 0.55]);
    const blooms = new THREE.Group();
    bed.add(blooms);
    flower(blooms, -0.32, 0, flowerColors[i]);
    flower(blooms, 0.32, 0.06, flowerColors[i]);
    const dormant = new THREE.Group();
    bed.add(dormant);
    for (const x of [-0.3, 0.3])
      ball(dormant, "#9baf77", [x, 0.2, 0], [0.09, 0.22, 0.07]).rotation.z =
        -0.45;
    flowerBeds.push({ blooms, dormant });
  }
  const tree = new THREE.Group();
  tree.position.set(10.9, 0, -1.7);
  world.add(tree);
  cylinder(tree, palette.trunk, [0, 1.3, 0], 0.64, 2.6);
  for (const x of [-0.48, 0.48])
    ball(tree, "#ba8d65", [x, 0.12, 0.2], [0.62, 0.16, 0.5]);
  for (const [x, y, z, s] of [
    [0, 3.6, 0, 1.65],
    [-1.1, 3.1, 0, 1.15],
    [1.05, 3.15, 0, 1.2],
    [0, 3, 0.65, 1.25],
  ]) {
    ball(tree, palette.leaf, [x, y, z], [s, s * 0.8, s * 0.85]);
  }
  const treeEyes = [];
  for (const x of [-0.23, 0.23])
    treeEyes.push(ball(tree, "#634e3e", [x, 1.85, 0.6], [0.12, 0.025, 0.05]));
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.022, 6, 16, Math.PI),
    mat("#634e3e"),
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, 1.4, 0.65);
  tree.add(smile);
  for (const x of [-0.36, 0.36])
    ball(tree, "#dba38b", [x, 1.52, 0.59], [0.12, 0.055, 0.03]);
  // A handful of background shapes, intentionally quiet.
  for (const [x, z, size] of [
    [-12, -2.5, 0.6],
    [-5.5, -2.7, 0.45],
    [2.1, -2.4, 0.5],
    [7, -2.7, 0.55],
    [12.8, -2.7, 0.55],
  ]) {
    ball(world, "#9eba7f", [x, 0.2, z], [size, size * 0.6, size * 0.6]);
  }
  const characters = new Map();
  function character(id) {
    const root = new THREE.Group();
    root.userData.helper = id;
    const body = new THREE.Group();
    root.add(body);
    const color = HELPERS[id].color;
    ball(
      body,
      color,
      [0, 0.69, 0],
      id === "pebble" ? [0.52, 0.47, 0.39] : [0.37, 0.48, 0.33],
    );
    for (const x of [-0.19, 0.19]) {
      ball(body, color, [x, 0.15, 0.12], [0.16, 0.1, 0.19]);
      ball(
        body,
        "#3e5042",
        [x * 0.78, 0.78, id === "pebble" ? 0.4 : 0.32],
        [0.042, 0.062, 0.025],
      );
      ball(body, "#f0b7a5", [x * 1.2, 0.64, 0.29], [0.055, 0.027, 0.015]);
      ball(body, color, [x * 2, 0.55, 0], [0.12, 0.19, 0.12]).rotation.z =
        x > 0 ? -0.4 : 0.4;
    }
    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(0.066, 0.012, 5, 12, Math.PI),
      mat("#3e5042"),
    );
    mouth.position.set(0, 0.64, 0.34);
    mouth.rotation.z = Math.PI;
    body.add(mouth);
    if (id === "sprout") {
      for (const x of [-0.2, 0.2])
        ball(
          body,
          x < 0 ? "#94b765" : "#bad68b",
          [x, 1.31, 0],
          [0.14, 0.35, 0.075],
        ).rotation.z = x < 0 ? 0.5 : -0.5;
      block(body, "#d9a17d", [0.28, 0.59, -0.24], [0.3, 0.32, 0.22]);
    }
    if (id === "pebble")
      for (const x of [-0.2, 0, 0.2])
        ball(body, "#91ab6d", [x, 1.1, 0], [0.17, 0.08, 0.13]);
    if (id === "dew") {
      const tip = mesh(
        body,
        new THREE.ConeGeometry(0.24, 0.55, 16),
        color,
        [0, 1.2, 0],
      );
      tip.rotation.z = -0.15;
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        ball(
          body,
          "#b4a4d0",
          [Math.cos(a) * 0.27, 0.36, Math.sin(a) * 0.27],
          [0.19, 0.08, 0.15],
        );
      }
    }
    if (id === "glow") {
      for (const x of [-0.45, 0.45]) {
        ball(body, "#edb5a0", [x, 0.9, -0.12], [0.35, 0.5, 0.08]).rotation.z =
          x > 0 ? -0.45 : 0.45;
        cylinder(body, "#c5a160", [x * 0.32, 1.27, 0], 0.018, 0.35);
        ball(body, "#f5dfa0", [x * 0.32, 1.48, 0], [0.07, 0.07, 0.07]);
      }
    }
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.56, 0.62, 40),
      new THREE.MeshBasicMaterial({ color: "#fffbea", side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.085;
    root.add(ring);
    world.add(root);
    characters.set(id, { root, body, ring });
    return characters.get(id);
  }
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerStart;
  canvas.addEventListener("pointerdown", (e) => {
    pointerStart = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener("pointerup", (e) => {
    if (
      !pointerStart ||
      Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) > 15
    )
      return;
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    for (const hit of raycaster.intersectObjects(
      [...characters.values()].filter((c) => c.root.visible).map((c) => c.root),
      true,
    )) {
      let o = hit.object;
      while (o && !o.userData.helper) o = o.parent;
      if (o) {
        onPick({ helper: o.userData.helper });
        return;
      }
    }
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.08);
    const point = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, point)) {
      const closest = SITES.reduce((a, b) =>
        Math.abs(b.x - point.x) < Math.abs(a.x - point.x) ? b : a,
      );
      if (Math.abs(closest.x - point.x) < 1.25) onPick({ site: closest.id });
      else onPick({ x: THREE.MathUtils.clamp(point.x, -11.5, 11.5) });
    }
  });
  let focus = 0,
    width = 0,
    height = 0;
  function render(state, time, reducedMotion, delta, cameraOffset) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width !== width || rect.height !== height) {
      width = rect.width;
      height = rect.height;
      renderer.setSize(width, height, false);
    }
    const aspect = Math.max(0.4, width / Math.max(1, height));
    const compact = width < 600;
    const viewWidth = compact ? 13 : 30;
    const viewHeight = Math.max(8, viewWidth / aspect);
    camera.left = -viewWidth / 2;
    camera.right = viewWidth / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    const targetFocus = compact ? state.helpers[state.selected].x : 0;
    focus += (targetFocus + cameraOffset - focus) * Math.min(1, delta * 5);
    camera.position.set(focus + 1, 12, 20);
    camera.lookAt(focus, 0.7, 0);
    camera.updateProjectionMatrix();
    for (const [id, data] of Object.entries(state.helpers)) {
      const c = characters.get(id) || character(id);
      c.root.visible = true;
      c.root.position.set(data.x, 0, 0.65);
      c.body.position.y = reducedMotion
        ? 0
        : Math.sin(time * 2.1 + Object.keys(HELPERS).indexOf(id)) * 0.025;
      if (id === "glow") c.body.position.y += 0.32;
      c.ring.visible = state.selected === id;
    }
    for (const [id, c] of characters) c.root.visible = !!state.helpers[id];
    bridge.children.forEach((plank, i) => {
      plank.visible = state.bridge || i === 0 || i === 5;
    });
    flowerBeds.forEach((bed, i) => {
      bed.blooms.visible = state.flowers[i];
      bed.dormant.visible = !state.flowers[i];
    });
    treeEyes.forEach((eye) => {
      eye.scale.y = state.won ? 0.095 : 0.025;
    });
    renderer.render(scene, camera);
  }
  function projectSite(id) {
    const site = SITES.find((s) => s.id === id);
    const v = new THREE.Vector3(site.x, 0.4, -0.9).project(camera);
    return { x: ((v.x + 1) * width) / 2, y: ((1 - v.y) * height) / 2 };
  }
  return { render, projectSite, renderer };
}
