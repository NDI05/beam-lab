(function(root) {
  "use strict";
  const GRAVITY = 9.81;
  const materials = {
    steel: { label: "Baja", E: 200, cost: 75, color: "#607b80" },
    concrete: { label: "Beton", E: 30, cost: 45, color: "#aeb3ae" },
    timber: { label: "Kayu", E: 12, cost: 30, color: "#b39165" }
  };
  const profiles = {
    rectangle: { label: "Persegi solid", I: 4e4, cost: 15 },
    box: { label: "Box berongga", I: 6e4, cost: 30 },
    ibeam: { label: "Profil I", I: 8e4, cost: 40 }
  };
  const BRIDGE_DEFAULTS = { P: 20, L: 8, material: "steel", profile: "rectangle" };
  const FLOW_DEFAULTS = { width: 2.4, depth: 1, slope: 15e-4, roughness: 0.015 };
  function finite(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function bridgeParameters(p = {}) {
    return { P: clamp(finite(p.P, 20), 10, 50), L: clamp(finite(p.L, 8), 6, 12), material: materials[p.material] ? p.material : "steel", profile: profiles[p.profile] ? p.profile : "rectangle" };
  }
  function flowParameters(p = {}) {
    return { width: clamp(finite(p.width, 2.4), 1, 6), depth: clamp(finite(p.depth, 1), 0.2, 2.5), slope: clamp(finite(p.slope, 15e-4), 5e-4, 0.01), roughness: clamp(finite(p.roughness, 0.015), 8e-3, 0.04) };
  }
  function beamDeflectionAt(x, params, loadPosition = params.L / 2) {
    const p = bridgeParameters(params);
    const a = loadPosition;
    const b = p.L - a;
    if (x <= 0 || x >= p.L || a <= 0 || a >= p.L) return 0;
    const force = p.P * 1e3 * GRAVITY;
    const stiffness = materials[p.material].E * 1e9 * profiles[p.profile].I * 1e-8;
    const r = x <= a ? b * x * (p.L * p.L - b * b - x * x) : a * (p.L - x) * (p.L * p.L - a * a - (p.L - x) ** 2);
    return force * r / (6 * p.L * stiffness) * 1e3;
  }
  function beamResult(params, loadPosition = params.L / 2) {
    const p = bridgeParameters(params);
    const a = loadPosition;
    const peakX = a <= 0 || a >= p.L ? p.L / 2 : a <= p.L / 2 ? p.L - Math.sqrt((p.L * p.L - a * a) / 3) : Math.sqrt((p.L * p.L - (p.L - a) ** 2) / 3);
    return { maximum: beamDeflectionAt(peakX, p, a), peakX, forceKN: p.P * GRAVITY, cost: materials[p.material].cost + profiles[p.profile].cost, E: materials[p.material].E, I: profiles[p.profile].I };
  }
  function flowResult(params, depth = params.depth) {
    const p = flowParameters(params);
    const d = Math.max(0, Number(depth));
    const area = p.width * d;
    const perimeter = p.width + 2 * d;
    const radius = area / perimeter;
    const velocity = Math.pow(radius, 2 / 3) * Math.sqrt(p.slope) / p.roughness;
    return { area, perimeter, radius, velocity, discharge: area * velocity };
  }
  function parseNumber(value) {
    const text = String(value).trim().replace(/\s/g, "").replace(",", ".");
    return /^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(text) ? Number(text) : NaN;
  }
  function isClose(value, expected, relative = 0.025, absolute = 0.02) {
    return Number.isFinite(value) && Math.abs(value - expected) <= Math.max(absolute, Math.abs(expected) * relative);
  }
  function shuffled(options, seed) {
    const result = options.slice();
    let n = seed >>> 0;
    for (let i = result.length - 1; i > 0; i--) {
      n = Math.imul(n, 1664525) + 1013904223 >>> 0;
      const j = n % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  const api = { GRAVITY, materials, profiles, BRIDGE_DEFAULTS, FLOW_DEFAULTS, finite, clamp, bridgeParameters, flowParameters, beamDeflectionAt, beamResult, flowResult, parseNumber, isClose, shuffled };
  root.BeamPhysics = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
