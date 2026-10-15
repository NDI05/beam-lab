import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
const M = window.BeamPhysics;
const BRIDGE_Y = 2.05;
const DEFORMATION_SCALE = 8;
const FLOW_SLOPE_SCALE = 8;
const vec = new THREE.Vector3();
class LaboratoryScene {
  constructor(host, mode, params, options = {}) {
    this.host = host;
    this.mode = mode === "flow" ? "flow" : "bridge";
    this.params = { ...params };
    this.options = options;
    this.materials = /* @__PURE__ */ new Map();
    this.morph = [];
    this.wheels = [];
    this.labels = [];
    this.time = 0;
    this.playback = null;
    this.lastSample = 0;
    this.paused = false;
    this.visible = true;
    this.frame = 0;
    this.lastTime = 0;
    this.reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reduced = this.reducedQuery.matches;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#e8eeea");
    this.scene.fog = new THREE.Fog("#e8eeea", 30, 65);
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "default" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.96;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.canvas = this.renderer.domElement;
    this.canvas.className = "scene-canvas";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("role", "img");
    this.canvas.setAttribute("aria-label", this.mode === "flow" ? "Saluran 3D interaktif. Tombol panah memutar kamera, plus dan minus mengatur zoom." : "Jembatan 3D interaktif. Tombol panah memutar kamera, plus dan minus mengatur zoom.");
    host.replaceChildren(this.canvas);
    this.overlay = document.createElement("div");
    this.overlay.className = "scene-labels";
    this.overlay.setAttribute("aria-hidden", "true");
    host.append(this.overlay);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.enablePan = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 32;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minPolarAngle = 0.2;
    this.controls.addEventListener("change", () => this.wake());
    this.controls.addEventListener("start", () => {
      this.cameraTween = null;
      this.wake();
    });
    this.onKey = (e) => {
      const target = this.controls.target;
      const offset = this.camera.position.clone().sub(target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      if (e.key === "ArrowLeft") spherical.theta -= 0.12;
      else if (e.key === "ArrowRight") spherical.theta += 0.12;
      else if (e.key === "ArrowUp") spherical.phi = Math.max(0.2, spherical.phi - 0.1);
      else if (e.key === "ArrowDown") spherical.phi = Math.min(1.5, spherical.phi + 0.1);
      else if (["+", "="].includes(e.key)) spherical.radius = Math.max(5, spherical.radius * 0.9);
      else if (e.key === "-") spherical.radius = Math.min(32, spherical.radius * 1.1);
      else return;
      e.preventDefault();
      this.camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(spherical));
      this.controls.update();
      this.wake();
    };
    this.canvas.addEventListener("keydown", this.onKey);
    this.onContextLost = (e) => {
      e.preventDefault();
      this.contextLost = true;
      this.options.onError?.("Tampilan 3D terhenti. Muat ulang scene untuk melanjutkan; hitungan dan grafik tetap tersedia.");
    };
    this.onContextRestored = () => {
      this.contextLost = false;
      this.options.onError?.("");
      this.wake();
    };
    this.canvas.addEventListener("webglcontextlost", this.onContextLost);
    this.canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    this.scene.add(new THREE.HemisphereLight("#edf5ff", "#66715b", 1.35));
    const sun = new THREE.DirectionalLight("#fff5df", 2.8);
    sun.position.set(-6, 13, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 0.1, far: 45 });
    sun.shadow.normalBias = 0.035;
    sun.shadow.bias = -15e-5;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight("#d9e9ee", 0.7);
    fill.position.set(8, 6, -10);
    this.scene.add(fill);
    const env = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTarget = pmrem.fromScene(env, 0.06);
    this.scene.environment = this.envTarget.texture;
    this.scene.environmentIntensity = 0.55;
    env.dispose();
    pmrem.dispose();
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.buildWorld();
    this.preset("perspective", true);
    this.resizeObserver = new ResizeObserver(() => {
      const box = host.getBoundingClientRect();
      if (!box.width || !box.height) return;
      this.renderer.setSize(box.width, box.height, false);
      this.camera.aspect = box.width / box.height;
      this.camera.updateProjectionMatrix();
      this.wake();
    });
    this.resizeObserver.observe(host);
    this.intersectionObserver = new IntersectionObserver((entries) => {
      this.visible = entries[0].isIntersecting;
      if (this.visible) this.wake();
    }, { threshold: 0.01 });
    this.intersectionObserver.observe(host);
    this.onVisibility = () => {
      this.lastTime = 0;
      if (!document.hidden) this.wake();
    };
    document.addEventListener("visibilitychange", this.onVisibility);
    this.onMotion = (e) => {
      this.reduced = e.matches;
      if (this.reduced && this.playback) this.finishPlayback();
      this.wake();
    };
    this.reducedQuery.addEventListener("change", this.onMotion);
    this.wake();
  }
  material(key, color, options = {}) {
    if (!this.materials.has(key)) this.materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.72, ...options }));
    return this.materials.get(key);
  }
  mesh(geometry, material, position, parent = this.world) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  box(size, position, material, parent = this.world, radius = 0) {
    return this.mesh(radius ? new RoundedBoxGeometry(...size, 2, radius) : new THREE.BoxGeometry(...size), material, position, parent);
  }
  groundTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#7c8570";
    ctx.fillRect(0, 0, 128, 128);
    let seed = 11;
    for (let i = 0; i < 1800; i++) {
      seed = Math.imul(seed, 1664525) + 1013904223;
      const x = (seed >>> 0) % 128;
      seed = Math.imul(seed, 1664525) + 1013904223;
      const y = (seed >>> 0) % 128;
      ctx.fillStyle = i % 2 ? "#838e79" : "#727c68";
      ctx.fillRect(x, y, 1, 2);
    }
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(6, 6);
    this.groundMap = map;
    return map;
  }
  buildWorld() {
    this.earth = this.material("earth", "#d0c8b8", { roughness: 1 });
    this.grass = this.material("grass", "#bcc5ac", { map: this.groundTexture(), roughness: 1 });
    this.concrete = this.material("concrete", "#c4c7bd", { roughness: 0.94 });
    this.road = this.material("road", "#515c57", { roughness: 0.92 });
    this.paint = this.material("paint", "#f1ebd8");
    this.rail = this.material("rail", "#9ba6a0", { metalness: 0.65, roughness: 0.35 });
    this.buildTrees();
    if (this.mode === "bridge") this.buildBridge();
    else this.buildFlow();
  }
  buildTrees() {
    const bark = this.material("bark", "#7d7057");
    const leaf = this.material("leaf", "#5a7757", { roughness: 1 });
    const places = this.mode === "bridge" ? [[-8, -4], [-9, 3], [8, -5], [10, 3], [-7, -7], [7, 6]] : [[-7, -5], [6, -5], [-7, 5], [7, 5]];
    for (const [x, z] of places) {
      const bottom = this.mode === "bridge" ? 1.37 : -0.4;
      this.mesh(new THREE.CylinderGeometry(0.07, 0.12, 1.1, 7), bark, [x, bottom + 0.55, z]);
      const crown = this.mesh(new THREE.IcosahedronGeometry(0.7, 1), leaf, [x, bottom + 1.65, z]);
      crown.scale.set(0.9, 1.3, 0.95);
    }
  }
  makeWater(width, length, parent, y) {
    const material = new THREE.MeshPhysicalMaterial({ color: "#4e9ca5", roughness: 0.21, metalness: 0.15, transparent: true, opacity: 0.91, envMapIntensity: 1.1, side: THREE.DoubleSide });
    const uniform = { value: 0 };
    this.waterUniform = uniform;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniform;
      shader.vertexShader = "uniform float uTime;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n transformed.y += sin(position.x * 2.2 - uTime * 1.3 + position.z * 1.7) * .018 + sin(position.z * 3.1 - uTime * .8) * .009;");
    };
    this.waterMaterial = material;
    const geometry = new THREE.PlaneGeometry(width, length, 36, 80);
    geometry.rotateX(-Math.PI / 2);
    const mesh = this.mesh(geometry, material, [0, y, 0], parent);
    mesh.castShadow = false;
    return mesh;
  }
  sweptGeometry(loops, length, baseY, offsetZ = 0) {
    const positions = [];
    const indices = [];
    const segments = 64;
    for (const loop of loops) {
      const start = positions.length / 3;
      for (let i = 0; i <= segments; i++) for (const [z, y] of loop) positions.push(-length / 2 + length * i / segments, baseY + y, z + offsetZ);
      for (let i = 0; i < segments; i++) for (let j = 0; j < loop.length; j++) {
        const a = start + i * loop.length + j;
        const b = start + i * loop.length + (j + 1) % loop.length;
        const c = b + loop.length;
        const d = a + loop.length;
        indices.push(a, b, d, b, c, d);
      }
    }
    const contour = loops[0].map((p) => new THREE.Vector2(...p));
    const holes = loops.slice(1).map((l) => l.map((p) => new THREE.Vector2(...p)));
    const faces = THREE.ShapeUtils.triangulateShape(contour, holes);
    const capPoints = loops.flat();
    for (const end of [0, 1]) {
      const start = positions.length / 3;
      for (const [z, y] of capPoints) positions.push(end ? length / 2 : -length / 2, baseY + y, z + offsetZ);
      for (const f of faces) indices.push(...(end ? f : f.slice().reverse()).map((i) => i + start));
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    this.morph.push({ geometry, initial: new Float32Array(positions), length });
    return geometry;
  }
  buildBridge() {
    const p = this.params;
    const half = p.L / 2;
    this.bridgeGroup = new THREE.Group();
    this.world.add(this.bridgeGroup);
    const g = this.bridgeGroup;
    for (const sign of [-1, 1]) {
      this.box([10.1, 3.8, 17], [sign * 8, -0.5, 0], this.earth, g, 0.12);
      this.box([10.1, 0.15, 17], [sign * 8, 1.45, 0], this.grass, g, 0.06);
      this.box([0.48, 4.05, 3.65], [sign * half, -0.22, 0], this.concrete, g, 0.05);
      this.box([0.72, 0.24, 3.78], [sign * half, 1.81, 0], this.concrete, g, 0.035);
      this.box([0.32, 0.12, 2.9], [sign * half, 1.94, 0], this.material("bearing", "#343f3c"), g);
      this.box([5.5, 0.22, 3.42], [sign * (half + 2.75), 1.93, 0], this.concrete, g);
      this.box([5.5, 0.035, 2.72], [sign * (half + 2.75), 2.057, 0], this.road, g);
      for (let i = 0; i < 5; i++) this.box([0.5, 7e-3, 0.045], [sign * (half + 0.45 + i), 2.082, 0], this.paint, g);
    }
    this.makeWater(5.8, 24, g, -2.17);
    const rockMat = this.material("rock", "#b9b4a5");
    for (let i = 0; i < 12; i++) {
      const x = (i % 2 ? -1 : 1) * (2.4 + i % 3 * 0.12);
      const z = (i - 6) * 1.7;
      const r = this.mesh(new THREE.IcosahedronGeometry(0.27, 0), rockMat, [x, -2.05, z], g);
      r.scale.set(1.4, 0.7, 1);
    }
    const roadLoop = [[-1.52, 0], [1.52, 0], [1.52, -0.16], [-1.52, -0.16]];
    this.mesh(this.sweptGeometry([roadLoop], p.L, BRIDGE_Y), this.concrete, [0, 0, 0], g);
    this.mesh(this.sweptGeometry([[[-1.27, 0.022], [1.27, 0.022], [1.27, 2e-3], [-1.27, 2e-3]]], p.L, BRIDGE_Y), this.road, [0, 0, 0], g);
    const steel = M.materials[p.material];
    const beamMat = this.material("beam-" + p.material, steel.color, { metalness: p.material === "steel" ? 0.7 : 0, roughness: p.material === "steel" ? 0.38 : 0.9 });
    const profile = p.profile === "ibeam" ? [[-0.42, 0], [0.42, 0], [0.42, -0.065], [0.055, -0.065], [0.055, -0.51], [0.42, -0.51], [0.42, -0.575], [-0.42, -0.575], [-0.42, -0.51], [-0.055, -0.51], [-0.055, -0.065], [-0.42, -0.065]] : p.profile === "box" ? [[-0.34, 0], [0.34, 0], [0.34, -0.48], [-0.34, -0.48]] : [[-0.27, 0], [0.27, 0], [0.27, -0.33], [-0.27, -0.33]];
    const loops = [profile];
    if (p.profile === "box") loops.push([[-0.28, -0.06], [-0.28, -0.42], [0.28, -0.42], [0.28, -0.06]]);
    this.mesh(this.sweptGeometry(loops, p.L, BRIDGE_Y - 0.17), beamMat, [0, 0, 0], g);
    this.sectionGroup = new THREE.Group();
    this.world.add(this.sectionGroup);
    this.sectionGroup.visible = false;
    const sectionShape = new THREE.Shape(loops[0].map((point) => new THREE.Vector2(...point)));
    for (const hole of loops.slice(1)) sectionShape.holes.push(new THREE.Path(hole.map((point) => new THREE.Vector2(...point))));
    const sectionGeometry = new THREE.ExtrudeGeometry(sectionShape, { depth: 0.8, bevelEnabled: false, steps: 1 });
    sectionGeometry.center();
    const sectionMesh = this.mesh(sectionGeometry, beamMat, [0, 1.1, 0], this.sectionGroup);
    sectionMesh.scale.setScalar(2.8);
    this.box([5, 0.12, 4], [0, -0.12, 0], this.material("section-stage", "#dfe5db"), this.sectionGroup, 0.035);
    this.railPosts = [];
    for (const z of [-1.45, 1.45]) {
      this.mesh(this.sweptGeometry([[[-0.026, 0], [0.026, 0], [0.026, -0.065], [-0.026, -0.065]]], p.L, BRIDGE_Y + 0.59, z), this.rail, [0, 0, 0], g);
      this.mesh(this.sweptGeometry([[[-0.018, 0], [0.018, 0], [0.018, -0.04], [-0.018, -0.04]]], p.L, BRIDGE_Y + 0.31, z), this.rail, [0, 0, 0], g);
      for (let i = 0; i <= 12; i++) {
        const x = -half + i * p.L / 12;
        const post = this.box([0.046, 0.58, 0.046], [x, BRIDGE_Y + 0.29, z], this.rail, g);
        this.railPosts.push({ post, x, y: BRIDGE_Y + 0.29 });
      }
    }
    this.dashes = [];
    for (let x = -half + 0.4; x < half; x += 1) {
      const dash = this.box([0.46, 9e-3, 0.045], [x, BRIDGE_Y + 0.029, 0], this.paint, g);
      this.dashes.push({ post: dash, x, y: BRIDGE_Y + 0.029 });
    }
    this.baselineLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: "#e4efda", dashSize: 0.15, gapSize: 0.09, transparent: true, opacity: 0.9 }));
    g.add(this.baselineLine);
    this.truck = this.makeTruck();
    g.add(this.truck);
    this.displayCurve = Array.from({ length: 65 }, (_, i) => this.sag(p.L * i / 64));
    this.setCurveTarget();
    this.addLabel("load", () => [this.truck.position.x, this.truck.position.y + 1.72, 0], () => M.beamResult(this.params).forceKN.toLocaleString("id-ID", { maximumFractionDigits: 0 }) + " kN");
    this.addLabel("delta", () => {
      const r = M.beamResult(this.params, this.playback ? this.playback.position : this.params.L / 2);
      return [r.peakX - this.params.L / 2, BRIDGE_Y - this.curveAt(r.peakX) - 0.55, 1.7];
    }, () => "\u03B4 " + M.beamResult(this.params, this.playback ? this.playback.position : this.params.L / 2).maximum.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " mm");
    this.updateBridgeGeometry(1);
    this.inspection(this.inspecting || false);
  }
  sag(x, p = this.params, a = p.L / 2) {
    return M.beamDeflectionAt(x, p, a) / 1e3 * DEFORMATION_SCALE;
  }
  setCurveTarget(position = this.params.L / 2) {
    this.targetCurve = Array.from({ length: 65 }, (_, i) => this.sag(this.params.L * i / 64, this.params, position));
  }
  curveAt(x) {
    const index = M.clamp(x / this.params.L * 64, 0, 64);
    const lo = Math.floor(index);
    return THREE.MathUtils.lerp(this.displayCurve[lo] || 0, this.displayCurve[Math.min(64, lo + 1)] || 0, index - lo);
  }
  updateBridgeGeometry(amount) {
    for (let i = 0; i < 65; i++) this.displayCurve[i] = THREE.MathUtils.lerp(this.displayCurve[i], this.targetCurve[i], amount);
    for (const item of this.morph) {
      const position = item.geometry.attributes.position;
      for (let i = 0; i < position.count; i++) position.setY(i, item.initial[i * 3 + 1] - this.curveAt(item.initial[i * 3] + this.params.L / 2));
      position.needsUpdate = true;
      item.geometry.computeVertexNormals();
      item.geometry.computeBoundingSphere();
    }
    for (const { post, x, y } of [...this.railPosts, ...this.dashes]) post.position.y = y - this.curveAt(x + this.params.L / 2);
    const a = this.playback ? this.playback.position : this.params.L / 2;
    this.truck.position.x = a - this.params.L / 2;
    this.truck.position.y = BRIDGE_Y + 0.034 - this.curveAt(a);
    const slope = (this.curveAt(Math.min(this.params.L, a + 0.04)) - this.curveAt(Math.max(0, a - 0.04))) / 0.08;
    this.truck.rotation.z = -Math.atan(slope);
    const baseline = this.options.baseline || this.params;
    const points = Array.from({ length: 65 }, (_, i) => new THREE.Vector3(-baseline.L / 2 + baseline.L * i / 64, BRIDGE_Y + 0.035 - this.sag(baseline.L * i / 64, baseline), 1.34));
    this.baselineLine.geometry.dispose();
    this.baselineLine.geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.baselineLine.computeLineDistances();
  }
  makeTruck() {
    const truck = new THREE.Group();
    this.wheels = [];
    const body = this.material("truck", "#e9efe5", { roughness: 0.38, metalness: 0.16 });
    const trim = this.material("truck-trim", "#245e44", { metalness: 0.35, roughness: 0.4 });
    const dark = this.material("dark", "#27322e", { roughness: 0.8 });
    const glass = this.material("glass", "#385d64", { roughness: 0.16, metalness: 0.25 });
    this.box([2.55, 0.15, 1.12], [0, 0.38, 0], dark, truck, 0.035);
    this.box([1.72, 0.15, 1.19], [-0.43, 0.62, 0], trim, truck, 0.025);
    this.box([0.78, 1.02, 1.12], [0.84, 0.94, 0], body, truck, 0.07);
    this.box([0.12, 0.4, 0.98], [1.243, 1.14, 0], glass, truck, 0.018);
    for (const side of [-1, 1]) {
      this.box([0.49, 0.34, 0.018], [0.85, 1.2, side * 0.565], glass, truck, 0.025);
      this.box([0.14, 0.03, 0.025], [0.91, 0.84, side * 0.58], dark, truck, 8e-3);
      this.box([0.13, 0.15, 0.12], [1.02, 1.13, side * 0.66], dark, truck, 0.02);
    }
    this.box([0.13, 0.14, 1.21], [1.3, 0.5, 0], this.rail, truck, 0.025);
    this.box([0.025, 0.2, 0.62], [1.27, 0.73, 0], dark, truck, 0.01);
    for (const z of [-0.43, 0.43]) this.box([0.025, 0.12, 0.17], [1.27, 0.9, z], this.material("headlights", "#fff4d2", { emissive: "#d6bc82", emissiveIntensity: 0.3 }), truck, 0.015);
    this.box([0.025, 0.09, 0.25], [1.38, 0.48, 0], this.material("plate", "#e8e8df"), truck);
    for (const x of [-0.94, -0.43, 0.86]) for (const z of [-0.59, 0.59]) {
      const wheel = new THREE.Group();
      wheel.position.set(x, 0.25, z);
      const tyre = this.mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.16, 20), dark, [0, 0, 0], wheel);
      tyre.rotation.x = Math.PI / 2;
      const hub = this.mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.17, 16), this.rail, [0, 0, 0], wheel);
      hub.rotation.x = Math.PI / 2;
      for (let spoke = 0; spoke < 3; spoke++) {
        const bar = this.box([0.17, 0.02, 0.012], [0, 0, z > 0 ? 0.093 : -0.093], this.material("hub-spoke", "#d4dcd4"), wheel);
        bar.rotation.z = spoke * Math.PI / 3;
      }
      truck.add(wheel);
      this.wheels.push(wheel);
    }
    this.cargo = new THREE.Group();
    truck.add(this.cargo);
    this.fillCargo();
    return truck;
  }
  fillCargo() {
    this.clearGroup(this.cargo);
    const rows = Math.round(M.clamp((this.params.P - 10) / 10 + 1, 1, 5));
    const pallet = this.material("pallet", "#ac926e");
    this.box([1.4, 0.07, 1.03], [-0.48, 0.75, 0], pallet, this.cargo);
    for (let i = 0; i < rows; i++) for (let col = 0; col < 2; col++) this.box([0.62, 0.19, 0.44], [-0.8 + col * 0.67, 0.89 + i * 0.2, 0], this.concrete, this.cargo, 0.018);
    for (const x of [-1.08, 0.11]) this.box([0.038, 0.2 * rows + 0.09, 1.07], [x, 0.81 + rows * 0.1, 0], this.material("strap", "#795e3e"), this.cargo, 6e-3);
  }
  buildFlow() {
    this.box([22, 0.45, 17], [0, -0.75, 0], this.earth, this.world, 0.12);
    this.box([22, 0.07, 17], [0, -0.49, 0], this.grass, this.world, 0.04);
    this.channel = new THREE.Group();
    this.world.add(this.channel);
    const p = this.params;
    this.bed = this.box([10.8, 0.22, p.width + 0.55], [0, -0.12, 0], this.concrete, this.channel, 0.045);
    this.walls = [];
    for (const sign of [-1, 1]) this.walls.push(this.box([10.8, 3, 0.22], [0, 1.5, sign * (p.width / 2 + 0.11)], this.concrete, this.channel, 0.025));
    this.water = this.makeWater(10.7, p.width, this.channel, p.depth);
    this.frontWater = [];
    for (const x of [-5.35, 5.35]) this.frontWater.push(this.box([8e-3, p.depth, p.width], [x, p.depth / 2, 0], this.waterMaterial, this.channel));
    const particleGeom = new THREE.ConeGeometry(0.052, 0.23, 3);
    particleGeom.rotateZ(-Math.PI / 2);
    particleGeom.rotateX(Math.PI / 2);
    this.particles = new THREE.InstancedMesh(particleGeom, this.material("foam", "#e0f2eb", { roughness: 0.5 }), 42);
    this.particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.channel.add(this.particles);
    this.gauges = [];
    for (const x of [-4.9, 4.9]) {
      const gauge = new THREE.Group();
      gauge.position.set(x, 0, p.width / 2 + 0.26);
      this.channel.add(gauge);
      this.box([0.07, 2.8, 0.06], [0, 1.4, 0], this.material("gauge", "#f4ede0"), gauge);
      this.gauges.push(gauge);
      for (let y = 0.25; y < 2.8; y += 0.25) this.box([0.075, 0.013, 0.07], [0, y, 0], this.material("gauge-mark", "#4c6357"), gauge);
    }
    this.addLabel("width", () => [5.5, 0.14, 0], () => "b = " + this.params.width.toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " m");
    this.addLabel("depth", () => [5.4, this.params.depth, -this.params.width / 2], () => "y = " + this.params.depth.toLocaleString("id-ID", { maximumFractionDigits: 2 }) + " m");
    this.updateFlow();
  }
  updateFlow() {
    const p = this.params;
    this.channel.rotation.z = -Math.atan(p.slope * FLOW_SLOPE_SCALE);
    this.bed.scale.z = (p.width + 0.55) / (this.builtWidth || p.width + 0.55);
    this.water.scale.z = p.width / (this.initialWidth || p.width);
    this.water.position.y = p.depth;
    this.walls.forEach((wall, i) => {
      wall.position.z = (i === 0 ? -1 : 1) * (p.width / 2 + 0.11);
      wall.material = p.roughness >= 0.025 ? this.material("earth-wall", "#b4a389", { roughness: 1 }) : this.concrete;
    });
    this.frontWater.forEach((mesh) => {
      mesh.scale.y = p.depth / (this.initialDepth || p.depth);
      mesh.scale.z = p.width / (this.initialWidth || p.width);
      mesh.position.y = p.depth / 2;
    });
    if (!this.initialWidth) {
      this.initialWidth = p.width;
      this.initialDepth = p.depth;
      this.builtWidth = p.width + 0.55;
    }
    this.gauges.forEach((g) => g.position.z = p.width / 2 + 0.26);
  }
  updateParticles() {
    const p = this.params;
    const velocity = M.flowResult(p).velocity;
    const transform = new THREE.Object3D();
    for (let i = 0; i < 42; i++) {
      const x = (i % 14 / 14 * 10.5 + this.time * velocity * 0.6) % 10.5 - 5.25;
      const z = (Math.floor(i / 14) - 1) * p.width * 0.29;
      transform.position.set(x, p.depth + 0.035 + Math.sin(x * 2.2 - this.time * 1.3 + z * 1.7) * 0.018, z);
      transform.updateMatrix();
      this.particles.setMatrixAt(i, transform.matrix);
    }
    this.particles.instanceMatrix.needsUpdate = true;
  }
  addLabel(id, position, text) {
    const el = document.createElement("span");
    el.className = "scene-label";
    this.overlay.append(el);
    this.labels.push({ id, el, position, text });
  }
  projectLabels() {
    for (const label of this.labels) {
      vec.set(...label.position()).project(this.camera);
      label.el.style.left = (vec.x * 0.5 + 0.5) * this.host.clientWidth + "px";
      label.el.style.top = (-vec.y * 0.5 + 0.5) * this.host.clientHeight + "px";
      label.el.textContent = label.text();
      label.el.hidden = this.inspecting || this.annotations === false || vec.z > 1 || Math.abs(vec.x) > 0.95 || Math.abs(vec.y) > 0.92;
    }
  }
  inspection(value) {
    this.inspecting = value;
    if (this.mode !== "bridge") return;
    for (const child of this.world.children) child.visible = value ? child === this.sectionGroup : child !== this.sectionGroup;
    this.controls.minDistance = value ? 3 : 5;
  }
  update(params, options = {}) {
    const old = this.params;
    this.params = { ...params };
    this.options = { ...this.options, ...options };
    if (this.mode === "bridge") {
      if (this.playback) this.finishPlayback();
      if (old.L !== params.L || old.profile !== params.profile || old.material !== params.material) {
        const previousCurve = this.displayCurve.slice();
        this.clearGroup(this.sectionGroup);
        this.world.remove(this.sectionGroup);
        this.clearGroup(this.bridgeGroup);
        this.world.remove(this.bridgeGroup);
        this.waterMaterial?.dispose();
        this.morph = [];
        this.overlay.replaceChildren();
        this.labels = [];
        this.buildBridge();
        this.displayCurve = previousCurve;
      } else if (old.P !== params.P) this.fillCargo();
      this.setCurveTarget();
      if (this.reduced) this.updateBridgeGeometry(1);
    } else this.updateFlow();
    this.wake();
  }
  preset(name, instant = false) {
    this.inspection(this.mode === "bridge" && name === "section");
    let position, target;
    if (this.mode === "flow") {
      target = [0, 1, 0];
      position = name === "side" ? [0, 7.5, 13] : name === "section" ? [9, 3, 0.05] : [9.4, 12.5, 10.8];
    } else {
      target = [0, 0.65, 0];
      position = name === "side" ? [0.05, 4, 15.5] : name === "section" ? [-this.params.L / 2 - 2.2, 2.5, 3.3] : [9.2, 7.8, 10.8];
      if (name === "section") {
        position = [3, 2.6, 4.5];
        target = [0, 1.05, 0];
      }
    }
    if (instant || this.reduced) {
      this.camera.position.set(...position);
      this.controls.target.set(...target);
      this.controls.update();
    } else this.cameraTween = { from: this.camera.position.clone(), to: new THREE.Vector3(...position), targetFrom: this.controls.target.clone(), targetTo: new THREE.Vector3(...target), elapsed: 0 };
    this.wake();
  }
  play() {
    if (this.mode !== "bridge" || this.reduced) return;
    this.playback = { elapsed: 0, position: -1.6 };
    this.options.onPlayback?.(true);
    this.wake();
  }
  finishPlayback() {
    this.playback = null;
    this.setCurveTarget();
    this.options.onPlayback?.(false);
    this.options.onSample?.(null);
    this.wake();
  }
  pause(value) {
    this.paused = value;
    this.wake();
  }
  toggleAnnotations(value) {
    this.annotations = value;
    this.wake();
  }
  wake() {
    if (!this.frame && !this.disposed && !document.hidden && this.visible) this.frame = requestAnimationFrame((t) => this.tick(t));
  }
  tick(now) {
    this.frame = 0;
    if (this.disposed || this.contextLost) return;
    const dt = Math.min(0.05, this.lastTime ? (now - this.lastTime) / 1e3 : 0.016);
    this.lastTime = now;
    if (!this.reduced && !this.paused) this.time += dt;
    let moving = false;
    if (this.cameraTween) {
      const tween = this.cameraTween;
      tween.elapsed += dt;
      const f = Math.min(1, tween.elapsed / 0.65);
      const ease = 1 - (1 - f) ** 3;
      this.camera.position.lerpVectors(tween.from, tween.to, ease);
      this.controls.target.lerpVectors(tween.targetFrom, tween.targetTo, ease);
      if (f === 1) this.cameraTween = null;
      else moving = true;
    }
    this.controls.update();
    if (this.mode === "bridge") {
      if (this.playback && !this.paused) {
        this.playback.elapsed += dt;
        const f = Math.min(1, this.playback.elapsed / 3.2);
        this.playback.position = THREE.MathUtils.lerp(-1.6, this.params.L / 2, f);
        this.setCurveTarget(this.playback.position);
        for (const wheel of this.wheels) wheel.rotation.z -= dt * 3;
        this.options.onSample?.(this.playback.position);
        if (f === 1) this.finishPlayback();
        moving = true;
      }
      const difference = this.displayCurve.some((v, i) => Math.abs(v - this.targetCurve[i]) > 1e-4);
      if (difference || this.playback) {
        this.updateBridgeGeometry(this.playback || this.reduced ? 1 : 1 - Math.exp(-dt * 8));
        moving = moving || difference || Boolean(this.playback && !this.paused);
      }
    } else {
      const near = this.camera.position.z >= 0 ? 1 : 0;
      const earth = this.params.roughness >= 0.025;
      this.walls.forEach((wall, i) => {
        wall.material = i === near ? this.material(earth ? "cutaway-earth" : "cutaway-concrete", earth ? "#b4a389" : "#c4c7bd", { transparent: true, opacity: 0.18, depthWrite: false, roughness: 0.9 }) : earth ? this.material("earth-wall", "#b4a389", { roughness: 1 }) : this.concrete;
        wall.castShadow = i !== near;
      });
      this.updateParticles();
      moving = !this.reduced && !this.paused;
    }
    if (this.waterUniform) this.waterUniform.value = this.time;
    this.projectLabels();
    this.renderer.render(this.scene, this.camera);
    if ((moving || !this.reduced && !this.paused && this.mode === "flow") && this.visible && !document.hidden) this.wake();
  }
  clearGroup(group) {
    if (!group) return;
    group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.isLine) obj.material?.dispose();
    });
    group.clear();
  }
  dispose() {
    this.disposed = true;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.reducedQuery.removeEventListener("change", this.onMotion);
    this.canvas.removeEventListener("keydown", this.onKey);
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onContextRestored);
    this.controls.dispose();
    this.clearGroup(this.world);
    for (const material of this.materials.values()) material.dispose();
    this.waterMaterial?.dispose();
    this.groundMap?.dispose();
    this.envTarget?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.host.replaceChildren();
  }
}
let active = null;
window.BeamLab3D = {
  mount(host, mode, params, options = {}) {
    active?.dispose();
    try {
      active = new LaboratoryScene(host, mode, params, options);
      return true;
    } catch (error) {
      active?.dispose();
      active = null;
      host.innerHTML = '<div class="scene-fallback"><strong>Scene 3D belum dapat dimuat.</strong><p>Browser ini belum dapat menjalankan WebGL. Kontrol, materi, perhitungan, dan grafik tetap dapat digunakan.</p></div>';
      console.warn("Beam Lab 3D:", error.message);
      return false;
    }
  },
  update(mode, params, options) {
    active?.update(params, options);
  },
  preset(name) {
    active?.preset(name);
  },
  resetCamera() {
    active?.preset("perspective");
  },
  play() {
    active?.play();
  },
  pause(value) {
    active?.pause(value);
  },
  annotations(value) {
    active?.toggleAnnotations(value);
  },
  destroy() {
    active?.dispose();
    active = null;
  }
};
