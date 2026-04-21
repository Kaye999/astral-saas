// Starfield.jsx — dark cosmic background with real named stars + constellations
// Single-file React component, no imports (React provided globally by Babel-standalone pipeline).
// Usage: <Starfield showLabels={false} />

// SELF_CHECK:
// - Equirectangular projection: x = (24 - RA_hours) / 24 * 2000  (RA increases to the left in typical sky views)
// - y = (90 - Dec) / 180 * 1200
// - Viewport size 2000x1200, preserveAspectRatio="xMidYMid slice"
// - Verify: Mintaka (5.53, -0.30)  → x ≈ (24-5.53)/24*2000 ≈ 1539.17, y ≈ (90-(-0.30))/180*1200 ≈ 602.0
// - Verify: Vega    (18.62, +38.78) → x ≈ (24-18.62)/24*2000 ≈ 448.33, y ≈ (90-38.78)/180*1200 ≈ 341.47
// - Verify: Acrux   (12.44, -63.10) → x ≈ (24-12.44)/24*2000 ≈ 963.33, y ≈ (90-(-63.10))/180*1200 ≈ 1020.67

// ─── PROJECTION ──────────────────────────────────────────────────────────────
const CANVAS_W = 2000;
const CANVAS_H = 1200;

function projectRA(raHours) {
  return ((24 - raHours) / 24) * CANVAS_W;
}
function projectDec(decDegrees) {
  return ((90 - decDegrees) / 180) * CANVAS_H;
}

// ─── SEEDED PRNG (mulberry32) ────────────────────────────────────────────────
function makePrng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const STAR_COLORS = [
  "#FCFAF6", "#FCFAF6", "#FCFAF6", "#FCFAF6", "#FCFAF6", // majority pale white
  "#FCFAF6", "#FCFAF6",
  "#CBE3FF", "#CBE3FF",                                   // cool blue
  "#F4D8A8",                                              // warm amber
];

// ─── NAMED STARS (RA hours, Dec degrees) ─────────────────────────────────────
const NAMED_STARS = [
  // Orion
  { name: "Betelgeuse", ra: 5.92, dec: 7.4,    mag: 0.5, color: "#F4D8A8" },
  { name: "Bellatrix",  ra: 5.42, dec: 6.35,   mag: 1.6, color: "#CBE3FF" },
  { name: "Mintaka",    ra: 5.53, dec: -0.30,  mag: 2.2, color: "#CBE3FF" },
  { name: "Alnilam",    ra: 5.60, dec: -1.20,  mag: 1.7, color: "#CBE3FF" },
  { name: "Alnitak",    ra: 5.68, dec: -1.94,  mag: 1.8, color: "#CBE3FF" },
  { name: "Saiph",      ra: 5.80, dec: -9.67,  mag: 2.1, color: "#CBE3FF" },
  { name: "Rigel",      ra: 5.24, dec: -8.20,  mag: 0.1, color: "#CBE3FF" },

  // Ursa Major (Big Dipper)
  { name: "Dubhe",   ra: 11.06, dec: 61.75, mag: 1.8, color: "#F4D8A8" },
  { name: "Merak",   ra: 11.03, dec: 56.38, mag: 2.4, color: "#FCFAF6" },
  { name: "Phecda",  ra: 11.90, dec: 53.69, mag: 2.4, color: "#FCFAF6" },
  { name: "Megrez",  ra: 12.26, dec: 57.03, mag: 3.3, color: "#FCFAF6" },
  { name: "Alioth",  ra: 12.90, dec: 55.96, mag: 1.8, color: "#FCFAF6" },
  { name: "Mizar",   ra: 13.40, dec: 54.93, mag: 2.2, color: "#FCFAF6" },
  { name: "Alkaid",  ra: 13.79, dec: 49.31, mag: 1.9, color: "#CBE3FF" },

  // Crux (Southern Cross)
  { name: "Acrux",        ra: 12.44, dec: -63.1,  mag: 0.8, color: "#CBE3FF" },
  { name: "Mimosa",       ra: 12.80, dec: -59.69, mag: 1.3, color: "#CBE3FF" },
  { name: "Gacrux",       ra: 12.52, dec: -57.11, mag: 1.6, color: "#F4D8A8" },
  { name: "Delta Crucis", ra: 12.25, dec: -58.75, mag: 2.8, color: "#CBE3FF" },

  // Scorpius
  { name: "Antares",   ra: 16.49, dec: -26.43, mag: 1.0, color: "#F4D8A8" },
  { name: "Shaula",    ra: 17.56, dec: -37.10, mag: 1.6, color: "#CBE3FF" },
  { name: "Sargas",    ra: 17.62, dec: -43.00, mag: 1.9, color: "#FCFAF6" },
  { name: "Dschubba",  ra: 16.01, dec: -22.62, mag: 2.3, color: "#CBE3FF" },
  { name: "Graffias",  ra: 16.09, dec: -19.80, mag: 2.6, color: "#CBE3FF" },
  { name: "Pi Sco",    ra: 15.98, dec: -26.11, mag: 2.9, color: "#CBE3FF" },

  // Cassiopeia
  { name: "Caph",      ra: 0.15, dec: 59.15, mag: 2.3, color: "#FCFAF6" },
  { name: "Schedar",   ra: 0.68, dec: 56.54, mag: 2.2, color: "#F4D8A8" },
  { name: "Gamma Cas", ra: 0.95, dec: 60.72, mag: 2.2, color: "#CBE3FF" },
  { name: "Ruchbah",   ra: 1.43, dec: 60.24, mag: 2.7, color: "#FCFAF6" },
  { name: "Segin",     ra: 1.91, dec: 63.67, mag: 3.4, color: "#CBE3FF" },

  // Cygnus
  { name: "Deneb",     ra: 20.69, dec: 45.28, mag: 1.3, color: "#FCFAF6" },
  { name: "Sadr",      ra: 20.37, dec: 40.26, mag: 2.2, color: "#FCFAF6" },
  { name: "Gienah",    ra: 20.77, dec: 33.97, mag: 2.5, color: "#F4D8A8" },
  { name: "Delta Cyg", ra: 19.75, dec: 45.13, mag: 2.9, color: "#CBE3FF" },
  { name: "Albireo",   ra: 19.51, dec: 27.96, mag: 3.1, color: "#F4D8A8" },

  // Lyra
  { name: "Vega",      ra: 18.62, dec: 38.78, mag: 0.0, color: "#CBE3FF" },
  { name: "Sheliak",   ra: 18.83, dec: 33.36, mag: 3.5, color: "#CBE3FF" },
  { name: "Sulafat",   ra: 18.98, dec: 32.69, mag: 3.3, color: "#CBE3FF" },
  { name: "Zeta Lyr",  ra: 18.75, dec: 37.60, mag: 4.3, color: "#FCFAF6" },
  { name: "Delta Lyr", ra: 18.89, dec: 36.90, mag: 4.3, color: "#F4D8A8" },

  // Pleiades (tight cluster ~ (3.79, +24.1))
  { name: "Alcyone",  ra: 3.791, dec: 24.105, mag: 2.9, color: "#CBE3FF" },
  { name: "Atlas",    ra: 3.819, dec: 24.053, mag: 3.6, color: "#CBE3FF" },
  { name: "Electra",  ra: 3.748, dec: 24.113, mag: 3.7, color: "#CBE3FF" },
  { name: "Maia",     ra: 3.767, dec: 24.368, mag: 3.9, color: "#CBE3FF" },
  { name: "Merope",   ra: 3.772, dec: 23.948, mag: 4.2, color: "#CBE3FF" },
  { name: "Taygeta",  ra: 3.762, dec: 24.467, mag: 4.3, color: "#CBE3FF" },
  { name: "Pleione",  ra: 3.822, dec: 24.136, mag: 5.0, color: "#CBE3FF" },
];

// Lookup helper for line definitions
const STAR_BY_NAME = (() => {
  const m = {};
  for (const s of NAMED_STARS) m[s.name] = s;
  return m;
})();

// ─── CONSTELLATION LINES ─────────────────────────────────────────────────────
// Each entry: [starNameA, starNameB]. Lines are drawn subtly as connective hints.
const CONSTELLATIONS = [
  {
    name: "Orion",
    stars: ["Betelgeuse","Bellatrix","Mintaka","Alnilam","Alnitak","Saiph","Rigel"],
    lines: [
      ["Betelgeuse","Bellatrix"],
      ["Bellatrix","Mintaka"],
      ["Mintaka","Rigel"],
      ["Mintaka","Alnilam"],
      ["Alnilam","Alnitak"],
      ["Saiph","Alnitak"],
      ["Saiph","Rigel"],
    ],
  },
  {
    name: "Ursa Major",
    stars: ["Dubhe","Merak","Phecda","Megrez","Alioth","Mizar","Alkaid"],
    lines: [
      ["Dubhe","Merak"],
      ["Merak","Phecda"],
      ["Phecda","Megrez"],
      ["Megrez","Alioth"],
      ["Alioth","Mizar"],
      ["Mizar","Alkaid"],
      ["Dubhe","Megrez"],
    ],
  },
  {
    name: "Crux",
    stars: ["Acrux","Mimosa","Gacrux","Delta Crucis"],
    lines: [
      ["Gacrux","Acrux"],
      ["Delta Crucis","Mimosa"],
    ],
  },
  {
    name: "Scorpius",
    stars: ["Antares","Shaula","Sargas","Dschubba","Graffias","Pi Sco"],
    lines: [
      ["Graffias","Dschubba"],
      ["Dschubba","Pi Sco"],
      ["Pi Sco","Antares"],
      ["Antares","Sargas"],
      ["Sargas","Shaula"],
    ],
  },
  {
    name: "Cassiopeia",
    stars: ["Caph","Schedar","Gamma Cas","Ruchbah","Segin"],
    lines: [
      ["Caph","Schedar"],
      ["Schedar","Gamma Cas"],
      ["Gamma Cas","Ruchbah"],
      ["Ruchbah","Segin"],
    ],
  },
  {
    name: "Cygnus",
    stars: ["Deneb","Sadr","Gienah","Delta Cyg","Albireo"],
    lines: [
      ["Deneb","Sadr"],
      ["Sadr","Albireo"],
      ["Gienah","Sadr"],
      ["Sadr","Delta Cyg"],
    ],
  },
  {
    name: "Lyra",
    stars: ["Vega","Sheliak","Sulafat","Zeta Lyr","Delta Lyr"],
    lines: [
      ["Vega","Zeta Lyr"],
      ["Zeta Lyr","Sheliak"],
      ["Sheliak","Sulafat"],
      ["Sulafat","Delta Lyr"],
      ["Delta Lyr","Zeta Lyr"],
    ],
  },
  {
    name: "Pleiades",
    stars: ["Alcyone","Atlas","Electra","Maia","Merope","Taygeta","Pleione"],
    lines: [], // cluster, no lines
  },
];

// ─── MAGNITUDE → VISUAL ──────────────────────────────────────────────────────
// Lower magnitude = brighter. Map mag ∈ [-1, 5] → radius/opacity.
function magToRadius(mag) {
  // Brightest stars ~2.4px, faintest named ~1.0px
  const clamped = Math.max(-1, Math.min(5, mag));
  const t = (5 - clamped) / 6;              // 0 (faint) → 1 (bright)
  return 1.0 + t * 1.4;                     // 1.0 .. 2.4
}
function magToOpacity(mag) {
  const clamped = Math.max(-1, Math.min(5, mag));
  const t = (5 - clamped) / 6;
  return 0.55 + t * 0.4;                    // 0.55 .. 0.95
}

// ─── BACKGROUND STAR GENERATION ──────────────────────────────────────────────
function generateBackgroundStars(count, seed) {
  const rand = makePrng(seed);
  const stars = [];
  for (let i = 0; i < count; i++) {
    const x = rand() * CANVAS_W;
    const y = rand() * CANVAS_H;
    const roll = rand();

    let tier; // 'dim' | 'mid' | 'bright'
    if (roll < 0.015)      tier = "bright";
    else if (roll < 0.115) tier = "mid";
    else                   tier = "dim";

    let radius, opacity;
    if (tier === "dim") {
      radius  = 0.4 + rand() * 0.4;   // 0.4 .. 0.8
      opacity = 0.15 + rand() * 0.20; // 0.15 .. 0.35
    } else if (tier === "mid") {
      radius  = 1.0 + rand() * 0.4;   // 1.0 .. 1.4
      opacity = 0.5 + rand() * 0.25;  // 0.5 .. 0.75
    } else {
      radius  = 1.8 + rand() * 0.6;   // 1.8 .. 2.4
      opacity = 0.8 + rand() * 0.15;  // 0.8 .. 0.95
    }

    const color = STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)];
    const twinkle = tier === "dim" && rand() < 0.05; // ~5% of dim stars twinkle
    const twinkleDur = 3 + rand() * 5;               // 3..8s
    const twinkleDelay = rand() * 6;                 // 0..6s

    stars.push({ x, y, radius, opacity, color, tier, twinkle, twinkleDur, twinkleDelay });
  }
  return stars;
}

// ─── CONSTELLATION CENTROIDS (for labels) ────────────────────────────────────
function computeCentroid(starNames) {
  let sx = 0, sy = 0, n = 0;
  for (const nm of starNames) {
    const s = STAR_BY_NAME[nm];
    if (!s) continue;
    sx += projectRA(s.ra);
    sy += projectDec(s.dec);
    n++;
  }
  return n ? { x: sx / n, y: sy / n } : { x: 0, y: 0 };
}

// CSS for twinkle animation — static, no user input.
const TWINKLE_CSS = [
  "@keyframes sf-twinkle {",
  "  0%   { opacity: var(--sf-o, 0.25); }",
  "  50%  { opacity: calc(var(--sf-o, 0.25) + 0.20); }",
  "  100% { opacity: var(--sf-o, 0.25); }",
  "}",
  ".sf-twinkle {",
  "  animation-name: sf-twinkle;",
  "  animation-iteration-count: infinite;",
  "  animation-timing-function: ease-in-out;",
  "}",
].join("\n");

// ─── COMPONENT ───────────────────────────────────────────────────────────────
function Starfield({ showLabels = false, className, style }) {
  const useMemo = React.useMemo;

  const bgStars = useMemo(() => generateBackgroundStars(800, 1337), []);

  const namedProjected = useMemo(
    () => NAMED_STARS.map(s => ({
      ...s,
      x: projectRA(s.ra),
      y: projectDec(s.dec),
      r: magToRadius(s.mag),
      o: magToOpacity(s.mag),
    })),
    []
  );

  const namedMap = useMemo(() => {
    const m = {};
    for (const s of namedProjected) m[s.name] = s;
    return m;
  }, [namedProjected]);

  const centroids = useMemo(
    () => CONSTELLATIONS.map(c => ({ name: c.name, ...computeCentroid(c.stars) })),
    []
  );

  const mergedStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    background: "radial-gradient(ellipse at 50% 40%, #0b1020 0%, #060912 55%, #030509 100%)",
    ...(style || {}),
  };

  return React.createElement(
    "div",
    { className: className, style: mergedStyle, "aria-hidden": "true" },
    // Static CSS string as plain text child — safe (no interpolation, no user input).
    React.createElement("style", null, TWINKLE_CSS),
    React.createElement(
      "svg",
      {
        viewBox: `0 0 ${CANVAS_W} ${CANVAS_H}`,
        preserveAspectRatio: "xMidYMid slice",
        width: "100%",
        height: "100%",
        style: { display: "block", width: "100%", height: "100%" },
      },
      // ── DEFS: glow filter, noise filter, milky-way gradient ──
      React.createElement(
        "defs",
        null,
        React.createElement(
          "filter",
          { id: "sf-glow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "2.2", result: "coloredBlur" }),
          React.createElement(
            "feMerge",
            null,
            React.createElement("feMergeNode", { in: "coloredBlur" }),
            React.createElement("feMergeNode", { in: "SourceGraphic" })
          )
        ),
        React.createElement(
          "filter",
          { id: "sf-softglow", x: "-200%", y: "-200%", width: "500%", height: "500%" },
          React.createElement("feGaussianBlur", { stdDeviation: "1.1", result: "b" }),
          React.createElement(
            "feMerge",
            null,
            React.createElement("feMergeNode", { in: "b" }),
            React.createElement("feMergeNode", { in: "SourceGraphic" })
          )
        ),
        React.createElement(
          "filter",
          { id: "sf-grain", x: "0%", y: "0%", width: "100%", height: "100%" },
          React.createElement("feTurbulence", {
            type: "fractalNoise",
            baseFrequency: "0.9",
            numOctaves: "2",
            stitchTiles: "stitch",
          }),
          React.createElement("feColorMatrix", {
            type: "matrix",
            values: "0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.06 0",
          })
        ),
        React.createElement(
          "radialGradient",
          {
            id: "sf-milkyway",
            cx: "50%", cy: "50%", r: "70%",
            gradientTransform: "translate(0.0 0.1) rotate(-28 0.5 0.5) scale(1.2 0.32)",
          },
          React.createElement("stop", { offset: "0%",   stopColor: "#F4D8A8", stopOpacity: "0.09" }),
          React.createElement("stop", { offset: "40%",  stopColor: "#CBE3FF", stopOpacity: "0.05" }),
          React.createElement("stop", { offset: "100%", stopColor: "#000000", stopOpacity: "0" })
        )
      ),

      // ── MILKY WAY BAND ──
      React.createElement("rect", {
        x: 0, y: 0, width: CANVAS_W, height: CANVAS_H,
        fill: "url(#sf-milkyway)",
      }),

      // ── BACKGROUND STARS (one <g>, no pointer events) ──
      React.createElement(
        "g",
        { style: { pointerEvents: "none" } },
        bgStars.map((s, i) =>
          React.createElement("circle", {
            key: "bg" + i,
            cx: s.x.toFixed(2),
            cy: s.y.toFixed(2),
            r: s.radius.toFixed(2),
            fill: s.color,
            opacity: s.twinkle ? undefined : s.opacity,
            className: s.twinkle ? "sf-twinkle" : undefined,
            style: s.twinkle
              ? {
                  "--sf-o": s.opacity,
                  animationDuration: `${s.twinkleDur.toFixed(2)}s`,
                  animationDelay: `${s.twinkleDelay.toFixed(2)}s`,
                  opacity: s.opacity,
                }
              : undefined,
            filter: s.tier === "bright" ? "url(#sf-softglow)" : undefined,
          })
        )
      ),

      // ── CONSTELLATION LINES (below named stars) ──
      React.createElement(
        "g",
        { style: { pointerEvents: "none" }, stroke: "#C8A052", strokeWidth: 0.5, strokeLinecap: "round", fill: "none", opacity: 0.12 },
        CONSTELLATIONS.flatMap((c, ci) =>
          c.lines.map((pair, li) => {
            const a = namedMap[pair[0]];
            const b = namedMap[pair[1]];
            if (!a || !b) return null;
            return React.createElement("line", {
              key: `L-${ci}-${li}`,
              x1: a.x.toFixed(2),
              y1: a.y.toFixed(2),
              x2: b.x.toFixed(2),
              y2: b.y.toFixed(2),
            });
          })
        )
      ),

      // ── NAMED STARS with glow ──
      React.createElement(
        "g",
        { style: { pointerEvents: "none" }, filter: "url(#sf-glow)" },
        namedProjected.map((s, i) =>
          React.createElement(
            React.Fragment,
            { key: "ns" + i },
            // outer soft halo
            React.createElement("circle", {
              cx: s.x.toFixed(2),
              cy: s.y.toFixed(2),
              r: (s.r * 2.6).toFixed(2),
              fill: s.color,
              opacity: 0.08,
            }),
            // core
            React.createElement("circle", {
              cx: s.x.toFixed(2),
              cy: s.y.toFixed(2),
              r: s.r.toFixed(2),
              fill: s.color,
              opacity: s.o,
            })
          )
        )
      ),

      // ── CONSTELLATION LABELS (Fraunces italic, hidden unless showLabels) ──
      showLabels && React.createElement(
        "g",
        {
          style: { pointerEvents: "none" },
          fontFamily: "Fraunces, 'Fraunces', Georgia, serif",
          fontStyle: "italic",
          fontSize: 18,
          letterSpacing: "0.12em",
          fill: "#F4D8A8",
          opacity: 0.35,
          textAnchor: "middle",
        },
        centroids.map((c, i) =>
          React.createElement(
            "text",
            {
              key: "lbl" + i,
              x: c.x.toFixed(2),
              y: (c.y - 18).toFixed(2),
            },
            c.name
          )
        )
      ),

      // ── GRAIN OVERLAY (print-feel) ──
      React.createElement("rect", {
        x: 0, y: 0, width: CANVAS_W, height: CANVAS_H,
        filter: "url(#sf-grain)",
        opacity: 0.5,
        style: { mixBlendMode: "overlay" },
      })
    )
  );
}

// Memoize so parent re-renders don't re-run star generation (useMemo handles data,
// React.memo handles element diffing).
const MemoStarfield = React.memo(Starfield);

export default MemoStarfield;
