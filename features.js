/*
 * features.js — Synastra revenue/viral extensions
 *
 * Three self-contained features loaded alongside the main app bundle:
 *   1. Share your chart via URL       (window.SynastraShare)
 *   2. Synastry (two-chart compare)   (window.SynastraSynastry)
 *   3. Chart image export (IG story)  (window.SynastraExport)
 *
 * Pure vanilla JS. No CDN deps beyond what index.html already ships
 * (React, astronomy-engine, Babel). The file is fetched + concatenated
 * with the main JSX bundle and transformed by Babel-standalone, so:
 *   - NO ES module import/export.
 *   - Top-level declarations live on `window.*`.
 *   - Integrates with the main App via a MutationObserver that watches
 *     for the rendered app, then injects three buttons next to the
 *     settings cog — no edit to astrology-transits.jsx required.
 *
 * Integrates with existing globals:
 *   - SIGNS, computeTropicalChart, computeSiderealChart (engine-astro.js)
 *   - resolveCityCoords is internal to the main bundle; we re-use it if
 *     the main bundle exposes it, else fall back to Sydney coords.
 */

(function () {
  "use strict";

  var TOK = {
    bg:       "#0A0E1A",
    bgDeep:   "#060912",
    bgRaise:  "#131828",
    ink:      "#FCFAF6",
    inkDim:   "#CFC5B1",
    inkFaint: "#7B7361",
    brass:    "#C8A052",
    ember:    "#A84B3E",
    rule:     "rgba(252,250,246,0.08)"
  };

  var SIGN_GLYPHS = {
    Aries: "\u2648", Taurus: "\u2649", Gemini: "\u264A", Cancer: "\u264B",
    Leo: "\u264C", Virgo: "\u264D", Libra: "\u264E", Scorpio: "\u264F",
    Sagittarius: "\u2650", Capricorn: "\u2651", Aquarius: "\u2652", Pisces: "\u2653"
  };
  var PLANET_GLYPHS = {
    Sun: "\u2609", Moon: "\u263D", Mercury: "\u263F", Venus: "\u2640", Mars: "\u2642",
    Jupiter: "\u2643", Saturn: "\u2644", Uranus: "\u2645", Neptune: "\u2646", Pluto: "\u2647",
    Ascendant: "ASC", MC: "MC"
  };
  var SIGNS_LOCAL = [
    "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
    "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
  ];

  function _norm360(x){ var v = x % 360; if (v < 0) v += 360; return v; }
  function _fmtDeg(d){
    var whole = Math.floor(d);
    var minutes = Math.round((d - whole) * 60);
    if (minutes >= 60) { whole += 1; minutes -= 60; }
    return whole + "\u00B0" + String(minutes).padStart(2,"0") + "'";
  }

  function _toast(message) {
    var t = document.createElement("div");
    t.textContent = message;
    t.style.cssText =
      "position:fixed;left:50%;bottom:40px;transform:translateX(-50%);"+
      "background:"+TOK.bgRaise+";color:"+TOK.brass+";"+
      "border:1px solid "+TOK.brass+";padding:14px 22px;"+
      "font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11px;"+
      "letter-spacing:0.18em;text-transform:uppercase;"+
      "z-index:99999;opacity:0;transition:opacity .25s ease;"+
      "box-shadow:0 10px 40px rgba(0,0,0,0.6);border-radius:2px;";
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.style.opacity = "1"; });
    setTimeout(function(){
      t.style.opacity = "0";
      setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 2400);
  }

  /* ── SHARE ─────────────────────────────────────────────────────────────── */
  var SHARE_ORIGIN = "https://astral-saas.vercel.app";

  function generateShareUrl(user) {
    if (!user) return null;
    var safe = {
      fullName: user.fullName || user.name || "",
      name: user.name || "",
      dob: user.dob || null,
      time: user.time || null,
      timeUnknown: !!user.timeUnknown,
      city: user.city || "",
      gender: user.gender || "male"
    };
    var encoded = btoa(encodeURIComponent(JSON.stringify(safe)));
    return SHARE_ORIGIN + "/?s=" + encoded;
  }

  function parseShareUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var s = params.get("s");
      if (!s) return null;
      var json = decodeURIComponent(atob(s));
      var parsed = JSON.parse(json);
      parsed.isShared = true;
      return parsed;
    } catch (err) {
      console.warn("[features] parseShareUrl failed:", err);
      return null;
    }
  }

  function _applySharedUser() {
    var shared = parseShareUrl();
    if (!shared) return;
    try {
      var existing = null;
      try { existing = JSON.parse(localStorage.getItem("astro:user") || "null"); } catch(e){}
      if (!existing || !existing.dob) {
        localStorage.setItem("astro:user", JSON.stringify(shared));
        localStorage.setItem("astro:isShared", "1");
      }
    } catch(e){}
  }

  _applySharedUser();

  function _fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); _toast("Link copied \u2014 paste it anywhere"); }
    catch(e){ _toast("Copy failed \u2014 URL: " + text); }
    document.body.removeChild(ta);
  }

  window.SynastraShare = {
    generateUrl: generateShareUrl,
    parseUrl: parseShareUrl,
    copy: function (user) {
      var url = generateShareUrl(user);
      if (!url) { _toast("No chart to share yet"); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function(){
          _toast("Link copied \u2014 paste it anywhere");
        }).catch(function(){
          _fallbackCopy(url);
        });
      } else {
        _fallbackCopy(url);
      }
    }
  };

  /* ── SYNASTRY ──────────────────────────────────────────────────────────── */
  var ASPECTS = [
    { name:"Conjunction", angle:0,   personalOrb:6, outerOrb:4 },
    { name:"Opposition",  angle:180, personalOrb:6, outerOrb:4 },
    { name:"Trine",       angle:120, personalOrb:6, outerOrb:4 },
    { name:"Square",      angle:90,  personalOrb:6, outerOrb:4 },
    { name:"Sextile",     angle:60,  personalOrb:4, outerOrb:3 }
  ];
  var PERSONAL_PLANETS = { Sun:1, Moon:1, Mercury:1, Venus:1, Mars:1, Ascendant:1, MC:1 };

  function _aspectOrb(p1, p2) {
    var isPers = PERSONAL_PLANETS[p1] || PERSONAL_PLANETS[p2];
    return isPers ? 6 : 4;
  }

  function _angularDistance(lonA, lonB) {
    var d = Math.abs(_norm360(lonA) - _norm360(lonB));
    if (d > 180) d = 360 - d;
    return d;
  }

  function _findAspect(lonA, lonB, p1, p2) {
    var diff = _angularDistance(lonA, lonB);
    var maxOrb = _aspectOrb(p1, p2);
    for (var i = 0; i < ASPECTS.length; i++) {
      var a = ASPECTS[i];
      var delta = Math.abs(diff - a.angle);
      if (delta <= maxOrb) {
        return { aspect: a.name, angle: a.angle, orb: delta, exact: delta < 1 };
      }
    }
    return null;
  }

  function _collectPlanetLongitudes(chart) {
    var out = [];
    if (!chart) return out;
    (chart.planets || []).forEach(function(p){
      out.push({ planet: p.planet, longitude: p.longitude, sign: p.sign, deg: p.deg });
    });
    if (chart.ascendant) {
      out.push({ planet:"Ascendant", longitude: chart.ascendant.longitude, sign: chart.ascendant.sign, deg: chart.ascendant.deg });
    }
    if (chart.mc) {
      out.push({ planet:"MC", longitude: chart.mc.longitude, sign: chart.mc.sign, deg: chart.mc.deg });
    }
    return out;
  }

  var SYNASTRY_ASPECTS = {
    "Sun/Moon/Conjunction":    "Solar identity fused with lunar instinct \u2014 a magnetic, near-twin recognition. You each reflect what the other needs most.",
    "Sun/Moon/Opposition":     "Light and shadow mirror each other. Intense mutual completion \u2014 and equally sharp complementarity.",
    "Sun/Moon/Trine":          "An easy climate. Feelings and will flow in the same current; comfort without confusion.",
    "Sun/Moon/Square":         "Ego friction with emotional weather. You provoke growth in each other \u2014 expect grit.",
    "Sun/Venus/Conjunction":   "Admiration and affection knot at the core. Being seen and being loved arrive together.",
    "Sun/Venus/Trine":         "Romance with ease \u2014 charm is the native language between you.",
    "Sun/Mars/Conjunction":    "Vitality sparks. One lights the other's drive; partnership feels kinetic.",
    "Sun/Mars/Square":         "Wills collide. Sparks fly both ways \u2014 productive if channelled, combustible if not.",
    "Sun/Saturn/Conjunction":  "One grounds the other. Gravity and structure \u2014 can feel like duty, or like forever.",
    "Sun/Saturn/Square":       "Criticism and chill. The Saturn person weighs on the Sun's self-image; long-term tension if unowned.",
    "Moon/Venus/Conjunction":  "Tenderness sits beside feeling. Affectionate, nurturing, home-like.",
    "Moon/Venus/Trine":        "Soft fluency. Shared taste, shared comfort \u2014 an atmosphere of gentleness.",
    "Moon/Mars/Conjunction":   "Desire meets emotion directly. Passionate, reactive \u2014 the chemistry runs hot.",
    "Moon/Mars/Square":        "Moods and appetites clash. Fights escalate fast; make-ups equally charged.",
    "Moon/Saturn/Conjunction": "Emotional seriousness. Safety through restraint \u2014 can feel like being held, or held back.",
    "Moon/Saturn/Square":      "A subtle chill. The Saturn side dampens the Moon's expression \u2014 loneliness risk if not named.",
    "Venus/Mars/Conjunction":  "The classic erotic signature. Attraction is written on the body; combustible desire.",
    "Venus/Mars/Trine":        "Graceful chemistry. Flirtation lands where it's aimed.",
    "Venus/Mars/Square":       "Pursuit meets withholding. The dance is magnetic and exasperating at once.",
    "Venus/Mars/Opposition":   "Opposites attract \u2014 literally. Strong polarity, strong pull.",
    "Venus/Saturn/Conjunction":"Committed love or muted love \u2014 depending on maturity. Long-form affection.",
    "Mars/Mars/Conjunction":   "Drives align. You want and fight in the same rhythm.",
    "Mars/Mars/Square":        "Methods differ. Same fire, different fuses \u2014 arguments about how, not what.",
    "Mars/Mars/Opposition":    "Full polarity of will. Passionate rivalry or aligned ambition, depending on choice.",
    "Ascendant/Ascendant/Conjunction":"Physical recognition \u2014 the way you each move through the world rhymes.",
    "Ascendant/Sun/Conjunction":      "The Sun person lights up the Ascendant person's presentation. Natural visibility together.",
    "Ascendant/Moon/Conjunction":     "Instant emotional familiarity. Home in each other's face.",
    "Ascendant/Venus/Conjunction":    "Physical attraction at the surface. The Venus person beautifies the Ascendant person.",
    "Ascendant/Mars/Conjunction":     "Immediate sexual spark \u2014 and a tendency to challenge each other.",
    "Saturn/Moon/Trine":       "Quiet emotional stability. Saturn steadies the Moon's tides."
  };

  function _lookupSynastryText(p1, p2, aspect) {
    var k1 = p1 + "/" + p2 + "/" + aspect;
    var k2 = p2 + "/" + p1 + "/" + aspect;
    if (SYNASTRY_ASPECTS[k1]) return SYNASTRY_ASPECTS[k1];
    if (SYNASTRY_ASPECTS[k2]) return SYNASTRY_ASPECTS[k2];
    var flavour = {
      Conjunction:"fuses \u2014 two forces pressed together.",
      Opposition:"pulls across the chart \u2014 polarity as attraction.",
      Trine:"flows \u2014 a harmonious current between you.",
      Square:"abrades \u2014 friction that sharpens or wears.",
      Sextile:"invites \u2014 a gentle opening, acted on or not."
    };
    return p1 + " meeting " + p2 + " " + (flavour[aspect] || "adds a thread between you.");
  }

  function computeSynastry(chartA, chartB) {
    var A = _collectPlanetLongitudes(chartA);
    var B = _collectPlanetLongitudes(chartB);

    var aspects = [];
    var score = 0;

    for (var i = 0; i < A.length; i++) {
      for (var j = 0; j < B.length; j++) {
        var a = A[i], b = B[j];
        var hit = _findAspect(a.longitude, b.longitude, a.planet, b.planet);
        if (!hit) continue;

        var delta = 0;
        var pair = a.planet + "/" + b.planet;
        var pairRev = b.planet + "/" + a.planet;
        var isSunMoon = (pair === "Sun/Moon" || pairRev === "Sun/Moon");
        var isVenusMars = (pair === "Venus/Mars" || pairRev === "Venus/Mars");
        var isAscConj = (a.planet === "Ascendant" || b.planet === "Ascendant") && hit.aspect === "Conjunction";
        var isPersonalHard = PERSONAL_PLANETS[a.planet] && PERSONAL_PLANETS[b.planet] &&
                             (hit.aspect === "Square" || hit.aspect === "Opposition");

        if (isSunMoon && hit.aspect === "Conjunction") delta += 15;
        else if (isSunMoon && hit.aspect === "Trine") delta += 8;
        else if (isSunMoon && hit.aspect === "Opposition") delta += 6;
        else if (isVenusMars) delta += 10;
        else if (isAscConj) delta += 10;
        else if (isPersonalHard) delta -= 5;
        else if (hit.aspect === "Conjunction" || hit.aspect === "Trine") delta += 3;
        else if (hit.aspect === "Sextile") delta += 2;
        else delta += 1;

        var orbFactor = 1 - (hit.orb / _aspectOrb(a.planet, b.planet));
        delta = delta * (0.5 + 0.5 * orbFactor);

        score += delta;

        aspects.push({
          planetA: a.planet, planetB: b.planet,
          signA: a.sign, signB: b.sign,
          degA: a.deg, degB: b.deg,
          aspect: hit.aspect, orb: hit.orb, angle: hit.angle,
          weight: delta,
          interpretation: _lookupSynastryText(a.planet, b.planet, hit.aspect)
        });
      }
    }

    var harmCount = 0, hardCount = 0;
    aspects.forEach(function(x){
      if (x.aspect === "Trine" || x.aspect === "Sextile" || x.aspect === "Conjunction") harmCount++;
      else if (x.aspect === "Square" || x.aspect === "Opposition") hardCount++;
    });
    var ratio = harmCount / Math.max(1, harmCount + hardCount);
    var harmBonus = Math.round(ratio * 20);
    score += harmBonus;

    var normalised = Math.max(0, Math.min(100, Math.round(50 + score * 0.4)));

    aspects.sort(function(a,b){ return Math.abs(b.weight) - Math.abs(a.weight); });

    var highlights = [];
    for (var k = 0; k < Math.min(3, aspects.length); k++) {
      highlights.push(_editorialHighlight(aspects[k]));
    }

    return {
      score: normalised,
      aspects: aspects,
      top: aspects.slice(0, 10),
      highlights: highlights,
      harmonyRatio: ratio
    };
  }

  function _editorialHighlight(ax) {
    var pronoun = "Their " + ax.planetA + " " + ax.aspect.toLowerCase() + "s your " + ax.planetB;
    var inSign = ax.signA ? " in " + ax.signA : "";
    return pronoun + inSign + " \u2014 " + ax.interpretation;
  }

  function _signAngleRad(lonDeg) {
    return (180 - lonDeg) * Math.PI / 180;
  }

  function _findLonByPlanet(list, name) {
    for (var i = 0; i < list.length; i++) if (list[i].planet === name) return list[i].longitude;
    return null;
  }

  function renderWheelSVG(chartA, chartB, opts) {
    opts = opts || {};
    var size = opts.size || 600;
    var cx = size/2, cy = size/2;
    var outerR = size*0.48;
    var ringOuterR = size*0.44;
    var ringInnerR = size*0.36;
    var innerR = size*0.28;

    var svg = [];
    svg.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+size+' '+size+'" width="'+size+'" height="'+size+'" style="background:'+TOK.bg+';font-family:\'Fraunces\',serif;">');

    svg.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+outerR+'" fill="none" stroke="'+TOK.brass+'" stroke-width="1" opacity="0.6"/>');
    svg.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+ringOuterR+'" fill="none" stroke="'+TOK.rule+'" stroke-width="1"/>');
    svg.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+ringInnerR+'" fill="none" stroke="'+TOK.rule+'" stroke-width="1"/>');
    svg.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+innerR+'" fill="none" stroke="'+TOK.rule+'" stroke-width="1"/>');

    for (var i = 0; i < 12; i++) {
      var theta = _signAngleRad(i * 30);
      var x1 = cx + Math.cos(theta) * ringInnerR;
      var y1 = cy + Math.sin(theta) * ringInnerR;
      var x2 = cx + Math.cos(theta) * outerR;
      var y2 = cy + Math.sin(theta) * outerR;
      svg.push('<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+TOK.brass+'" stroke-width="0.5" opacity="0.3"/>');

      var gTheta = _signAngleRad(i * 30 + 15);
      var gx = cx + Math.cos(gTheta) * ((outerR + ringOuterR)/2);
      var gy = cy + Math.sin(gTheta) * ((outerR + ringOuterR)/2);
      svg.push('<text x="'+gx+'" y="'+gy+'" fill="'+TOK.brass+'" font-size="14" text-anchor="middle" dominant-baseline="central" font-family="serif">'+SIGN_GLYPHS[SIGNS_LOCAL[i]]+'</text>');
    }

    var A = _collectPlanetLongitudes(chartA);
    var B = _collectPlanetLongitudes(chartB);

    var aRingR = (ringInnerR + innerR) / 2;
    var bRingR = (ringOuterR + ringInnerR) / 2;

    try {
      var syn = computeSynastry(chartA, chartB);
      for (var k = 0; k < syn.aspects.length; k++) {
        var asp = syn.aspects[k];
        var aLon = _findLonByPlanet(A, asp.planetA);
        var bLon = _findLonByPlanet(B, asp.planetB);
        if (aLon == null || bLon == null) continue;
        var thA = _signAngleRad(aLon);
        var thB = _signAngleRad(bLon);
        var ax = cx + Math.cos(thA) * aRingR;
        var ay = cy + Math.sin(thA) * aRingR;
        var bx = cx + Math.cos(thB) * bRingR;
        var by = cy + Math.sin(thB) * bRingR;
        var strength = Math.min(1, Math.abs(asp.weight) / 12);
        var opacity = (0.12 + 0.45 * strength).toFixed(3);
        var aspectColor = (asp.aspect === "Square" || asp.aspect === "Opposition") ? TOK.ember : TOK.brass;
        svg.push('<line x1="'+ax+'" y1="'+ay+'" x2="'+bx+'" y2="'+by+'" stroke="'+aspectColor+'" stroke-width="'+(0.5 + strength*1.2).toFixed(2)+'" opacity="'+opacity+'"/>');
      }
    } catch(e) { /* aspect lines optional */ }

    A.forEach(function(p){
      if (!PLANET_GLYPHS[p.planet]) return;
      var th = _signAngleRad(p.longitude);
      var x = cx + Math.cos(th) * aRingR;
      var y = cy + Math.sin(th) * aRingR;
      svg.push('<circle cx="'+x+'" cy="'+y+'" r="11" fill="'+TOK.bgDeep+'" stroke="'+TOK.ink+'" stroke-width="0.8"/>');
      svg.push('<text x="'+x+'" y="'+y+'" fill="'+TOK.ink+'" font-size="13" text-anchor="middle" dominant-baseline="central" font-family="serif">'+PLANET_GLYPHS[p.planet]+'</text>');
    });

    B.forEach(function(p){
      if (!PLANET_GLYPHS[p.planet]) return;
      var th = _signAngleRad(p.longitude);
      var x = cx + Math.cos(th) * bRingR;
      var y = cy + Math.sin(th) * bRingR;
      svg.push('<circle cx="'+x+'" cy="'+y+'" r="11" fill="'+TOK.bgDeep+'" stroke="'+TOK.brass+'" stroke-width="0.8"/>');
      svg.push('<text x="'+x+'" y="'+y+'" fill="'+TOK.brass+'" font-size="13" text-anchor="middle" dominant-baseline="central" font-family="serif">'+PLANET_GLYPHS[p.planet]+'</text>');
    });

    svg.push('</svg>');
    return svg.join("");
  }

  window.SynastraSynastry = {
    compute: computeSynastry,
    renderWheelSVG: renderWheelSVG,
    ASPECTS: SYNASTRY_ASPECTS
  };

  /* ── EXPORT (CANVAS IMAGE) ─────────────────────────────────────────────── */

  function _drawCanvasStarfield(ctx, w, h) {
    ctx.fillStyle = TOK.bg;
    ctx.fillRect(0, 0, w, h);
    var grad = ctx.createRadialGradient(w/2, h*0.35, 0, w/2, h*0.35, Math.max(w,h)*0.7);
    grad.addColorStop(0, "rgba(200,160,82,0.12)");
    grad.addColorStop(0.5, "rgba(10,14,26,0)");
    grad.addColorStop(1, "rgba(6,9,18,0.6)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    var seed = 1;
    function rand(){ seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    for (var i = 0; i < 260; i++) {
      var x = rand() * w;
      var y = rand() * h;
      var r = rand() * 1.3 + 0.3;
      var alpha = 0.15 + rand() * 0.6;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = rand() > 0.9 ? TOK.brass : TOK.ink;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function _drawMiniWheel(ctx, chart, centerX, centerY, radius) {
    ctx.strokeStyle = TOK.brass;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(centerX, centerY, radius*0.78, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(centerX, centerY, radius*0.5, 0, Math.PI*2); ctx.stroke();

    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = TOK.brass;
    ctx.lineWidth = 0.8;
    for (var i = 0; i < 12; i++) {
      var th = _signAngleRad(i * 30);
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(th) * radius*0.78, centerY + Math.sin(th) * radius*0.78);
      ctx.lineTo(centerX + Math.cos(th) * radius, centerY + Math.sin(th) * radius);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = TOK.brass;
    ctx.font = "18px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (var j = 0; j < 12; j++) {
      var gth = _signAngleRad(j * 30 + 15);
      var gx = centerX + Math.cos(gth) * radius*0.89;
      var gy = centerY + Math.sin(gth) * radius*0.89;
      ctx.fillText(SIGN_GLYPHS[SIGNS_LOCAL[j]], gx, gy);
    }

    var ring = (chart && chart.planets) || [];
    var planetR = radius * 0.64;
    ctx.font = "16px serif";
    ring.forEach(function(p){
      if (!PLANET_GLYPHS[p.planet]) return;
      var th = _signAngleRad(p.longitude);
      var x = centerX + Math.cos(th) * planetR;
      var y = centerY + Math.sin(th) * planetR;
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = TOK.bgDeep;
      ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = TOK.ink;
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.fillStyle = TOK.ink;
      ctx.fillText(PLANET_GLYPHS[p.planet], x, y);
    });

    if (chart && chart.ascendant) {
      var ath = _signAngleRad(chart.ascendant.longitude);
      ctx.strokeStyle = TOK.ember;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(ath) * radius*0.5, centerY + Math.sin(ath) * radius*0.5);
      ctx.lineTo(centerX + Math.cos(ath) * (radius+8), centerY + Math.sin(ath) * (radius+8));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function _drawWordmark(ctx, w, h, firstName) {
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    ctx.fillStyle = TOK.brass;
    ctx.font = "500 22px 'IBM Plex Mono', monospace";
    ctx.fillText("AN ASTRAL ATLAS", w/2, 130);

    ctx.fillStyle = TOK.ink;
    ctx.font = "600 88px 'Fraunces', serif";
    ctx.fillText("SYNASTRA", w/2, 176);

    ctx.fillStyle = TOK.inkDim;
    ctx.font = "italic 400 40px 'Crimson Pro', serif";
    ctx.fillText(firstName || "A chart", w/2, 290);

    ctx.strokeStyle = TOK.brass;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w/2 - 40, 360);
    ctx.lineTo(w/2 + 40, 360);
    ctx.stroke();
  }

  function _placementLine(chart, label, planetOrField) {
    if (label === "Rising") {
      if (!chart || !chart.ascendant) return label + " \u00B7 \u2014";
      return label + " \u00B7 " + chart.ascendant.sign + " " + _fmtDeg(chart.ascendant.deg);
    }
    if (!chart || !chart.planets) return label + " \u00B7 \u2014";
    for (var i = 0; i < chart.planets.length; i++) {
      var p = chart.planets[i];
      if (p.planet === planetOrField) {
        return label + " \u00B7 " + p.sign + " " + _fmtDeg(p.deg);
      }
    }
    return label + " \u00B7 \u2014";
  }

  function _renderExportCanvas(user, chart) {
    var W = 1080, H = 1920;
    var canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");

    _drawCanvasStarfield(ctx, W, H);

    var firstName = (user && (user.name || (user.fullName || "").split(" ")[0])) || "Seeker";
    _drawWordmark(ctx, W, H, firstName);

    _drawMiniWheel(ctx, chart, W/2, 720, 300);

    var lines = [
      _placementLine(chart, "Sun", "Sun"),
      _placementLine(chart, "Moon", "Moon"),
      _placementLine(chart, "Rising", "Ascendant"),
      _placementLine(chart, "Venus", "Venus"),
      _placementLine(chart, "Mars", "Mars")
    ];

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "400 44px 'Crimson Pro', serif";
    var y = 1130;
    lines.forEach(function(line, i){
      ctx.fillStyle = i === 0 ? TOK.ink : (i === 2 ? TOK.brass : TOK.inkDim);
      ctx.fillText(line, W/2, y);
      y += 68;
    });

    ctx.strokeStyle = TOK.brass;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W/2 - 60, H - 220);
    ctx.lineTo(W/2 + 60, H - 220);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = TOK.brass;
    ctx.font = "500 26px 'IBM Plex Mono', monospace";
    ctx.fillText("synastra.app", W/2, H - 180);

    ctx.fillStyle = TOK.inkFaint;
    ctx.font = "italic 400 22px 'Crimson Pro', serif";
    ctx.fillText("Five readings, one birth.", W/2, H - 130);

    return canvas;
  }

  function exportToDataURL(user, chart) {
    var canvas = _renderExportCanvas(user, chart);
    return canvas.toDataURL("image/png");
  }

  function exportDownload(user, chart) {
    try {
      var canvas = _renderExportCanvas(user, chart);
      var dataUrl = canvas.toDataURL("image/png");
      var name = (user && (user.name || (user.fullName||"").split(" ")[0])) || "chart";
      var safe = String(name).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "chart";
      var a = document.createElement("a");
      a.download = "synastra-" + safe + ".png";
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      _toast("Chart image downloaded");
    } catch(e) {
      console.error("[features] exportDownload failed:", e);
      _toast("Export failed \u2014 see console");
    }
  }

  function exportCopyToClipboard(user, chart) {
    try {
      var canvas = _renderExportCanvas(user, chart);
      if (!canvas.toBlob || !navigator.clipboard || !window.ClipboardItem) {
        _toast("Clipboard image not supported \u2014 use Download");
        return;
      }
      canvas.toBlob(function(blob){
        if (!blob) { _toast("Export failed"); return; }
        var item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]).then(function(){
          _toast("Chart image copied");
        }).catch(function(err){
          console.error("[features] clipboard failed:", err);
          _toast("Clipboard denied \u2014 try Download");
        });
      }, "image/png");
    } catch(e) {
      console.error("[features] exportCopyToClipboard failed:", e);
      _toast("Copy failed \u2014 see console");
    }
  }

  window.SynastraExport = {
    toDataURL: exportToDataURL,
    download: exportDownload,
    copy: exportCopyToClipboard
  };

  /* ── COMPARE MODAL (SYNASTRY UI) ───────────────────────────────────────── */

  function _inputStyle(){
    return "display:block;width:100%;margin-top:6px;padding:8px 0;background:transparent;border:0;border-bottom:1px solid "+TOK.rule+";color:"+TOK.ink+";font-family:'Crimson Pro',serif;font-size:16px;outline:none;";
  }

  function _isPaid(){
    try { return localStorage.getItem("astro:paid") === "1"; } catch(e){ return false; }
  }

  function _openCompareModal(userA, chartA) {
    if (!userA || !chartA) {
      _toast("Load your chart first");
      return;
    }

    var back = document.createElement("div");
    back.id = "synastra-compare-modal";
    back.style.cssText =
      "position:fixed;inset:0;z-index:9000;background:rgba(6,9,18,0.86);"+
      "display:flex;align-items:center;justify-content:center;padding:32px 16px;"+
      "overflow-y:auto;font-family:'Crimson Pro',serif;color:"+TOK.ink+";";

    var card = document.createElement("div");
    card.style.cssText =
      "position:relative;max-width:920px;width:100%;background:"+TOK.bg+";"+
      "border:1px solid "+TOK.rule+";padding:40px 36px;border-radius:3px;"+
      "box-shadow:0 40px 120px rgba(0,0,0,0.7);max-height:92vh;overflow-y:auto;";
    back.appendChild(card);

    card.innerHTML =
      '<button aria-label="Close" style="position:absolute;top:16px;right:20px;background:none;border:0;color:'+TOK.inkFaint+';font-size:28px;cursor:pointer;line-height:1;">\u00D7</button>'+
      '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:'+TOK.brass+';margin-bottom:10px;">Synastry \u2014 two charts overlaid</div>'+
      '<h2 style="font-family:\'Fraunces\',serif;font-size:40px;font-weight:600;letter-spacing:-0.02em;margin:0 0 8px;color:'+TOK.ink+';">Compare with someone</h2>'+
      '<p style="font-family:\'Crimson Pro\',serif;font-style:italic;font-size:16px;color:'+TOK.inkDim+';margin:0 0 24px;">Enter their birth data \u2014 we overlay your chart onto theirs and read the angles between.</p>'+
      '<form id="syn-form" style="display:grid;grid-template-columns:1fr 1fr;gap:16px 22px;">'+
      '  <label style="grid-column:1/-1;font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:'+TOK.brass+';">Their full name<input name="fullName" required style="'+_inputStyle()+'"/></label>'+
      '  <label style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:'+TOK.brass+';">Birth date<input name="date" type="date" required style="'+_inputStyle()+';color-scheme:dark;"/></label>'+
      '  <label style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:'+TOK.brass+';">Birth time<input name="time" type="time" style="'+_inputStyle()+';color-scheme:dark;"/></label>'+
      '  <label style="grid-column:1/-1;font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:'+TOK.brass+';">Birth place<input name="city" required placeholder="City, country" style="'+_inputStyle()+'"/></label>'+
      '  <label style="grid-column:1/-1;font-family:\'IBM Plex Mono\',monospace;font-size:11px;color:'+TOK.inkFaint+';display:flex;align-items:center;gap:10px;"><input name="timeUnknown" type="checkbox" style="accent-color:'+TOK.brass+';"/> Time unknown</label>'+
      '  <button type="submit" style="grid-column:1/-1;padding:14px;border:1px solid '+TOK.brass+';background:transparent;color:'+TOK.brass+';font-family:\'Fraunces\',serif;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;margin-top:8px;">Reveal the synastry</button>'+
      '</form>'+
      '<div id="syn-result"></div>';

    document.body.appendChild(back);

    function close(){ if (back.parentNode) back.parentNode.removeChild(back); }
    card.querySelector("button").addEventListener("click", close);
    back.addEventListener("click", function(e){ if (e.target === back) close(); });

    var form = card.querySelector("#syn-form");
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var fd = new FormData(form);
      var dateStr = fd.get("date");
      var timeStr = fd.get("time");
      var fullName = fd.get("fullName");
      var city = fd.get("city");
      var timeUnknown = !!fd.get("timeUnknown");

      var mDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || "");
      if (!mDate) { _toast("Enter a valid birth date"); return; }
      var y = +mDate[1], mo = +mDate[2], d = +mDate[3];
      var h = 12, mn = 0;
      if (!timeUnknown) {
        var mTime = /^(\d{2}):(\d{2})$/.exec(timeStr || "");
        if (mTime) { h = +mTime[1]; mn = +mTime[2]; }
      }

      var resolver = (typeof window.resolveCityCoords === "function") ? window.resolveCityCoords
                    : (typeof resolveCityCoords === "function") ? resolveCityCoords
                    : null;
      var coords = (resolver ? resolver(city) : null) || { lat:-33.87, lon:151.21, tzOffset:10 };
      var birthData = {
        dob: { y:y, m:mo, d:d },
        time: { h:h, m:mn },
        timeUnknown: timeUnknown,
        lat: coords.lat, lon: coords.lon, tzOffset: coords.tzOffset
      };

      var chartB;
      try {
        var computeFn = (typeof window.computeTropicalChart === "function") ? window.computeTropicalChart
                      : (typeof computeTropicalChart === "function") ? computeTropicalChart
                      : null;
        if (!computeFn) { _toast("Chart engine not loaded"); return; }
        chartB = computeFn(birthData);
      } catch(err) {
        console.error("[features] compute chartB failed:", err);
        _toast("Chart compute failed");
        return;
      }

      var result = computeSynastry(chartA, chartB);
      var isPaid = _isPaid();
      _renderSynastryResult(card.querySelector("#syn-result"), result, chartA, chartB, fullName, userA, isPaid);
    });
  }

  function _renderSynastryResult(mount, result, chartA, chartB, nameB, userA, isPaid) {
    var nameA = (userA && (userA.name || (userA.fullName||"").split(" ")[0])) || "You";
    var blurredAttr = isPaid ? "" : 'style="filter:blur(5px);user-select:none;pointer-events:none;"';

    var wheel = renderWheelSVG(chartA, chartB, { size: 560 });
    var rows = result.top.map(function(ax, i){
      var rowStyle = (i >= 3 && !isPaid) ? blurredAttr : '';
      return ''+
        '<div '+rowStyle+' style="padding:14px 0;border-bottom:1px solid '+TOK.rule+';">'+
        '  <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;font-family:\'Fraunces\',serif;font-size:17px;color:'+TOK.ink+';">'+
        '    <span style="color:'+TOK.ink+';">'+nameA+"'s "+ax.planetA+'</span>'+
        '    <span style="color:'+TOK.brass+';font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;">'+ax.aspect+'</span>'+
        '    <span style="color:'+TOK.brass+';">'+nameB+"'s "+ax.planetB+'</span>'+
        '    <span style="color:'+TOK.inkFaint+';font-family:\'IBM Plex Mono\',monospace;font-size:10px;margin-left:auto;">orb '+ax.orb.toFixed(1)+'\u00B0</span>'+
        '  </div>'+
        '  <div style="font-family:\'Crimson Pro\',serif;font-size:15px;color:'+TOK.inkDim+';margin-top:4px;font-style:italic;">'+ax.interpretation+'</div>'+
        '</div>';
    }).join("");

    var highlightsHtml = result.highlights.map(function(h){
      return '<li style="font-family:\'Crimson Pro\',serif;font-size:16px;color:'+TOK.ink+';margin:8px 0;line-height:1.5;">'+h+'</li>';
    }).join("");

    mount.innerHTML =
      '<div style="margin-top:36px;padding-top:30px;border-top:1px solid '+TOK.rule+';">'+
      '  <div style="text-align:center;margin-bottom:24px;">'+
      '    <div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:'+TOK.brass+';margin-bottom:8px;">Compatibility score</div>'+
      '    <div style="font-family:\'Fraunces\',serif;font-weight:600;font-size:88px;line-height:1;color:'+TOK.ink+';letter-spacing:-0.03em;">'+result.score+'</div>'+
      '    <div style="font-family:\'Crimson Pro\',serif;font-style:italic;color:'+TOK.inkDim+';font-size:14px;margin-top:6px;">'+nameA+' \u00D7 '+nameB+'</div>'+
      '  </div>'+
      '  <div style="display:flex;justify-content:center;margin:20px 0 28px;">'+wheel+'</div>'+
      (highlightsHtml ? '  <div style="margin:20px 0 28px;padding:20px;background:'+TOK.bgRaise+';border-left:2px solid '+TOK.brass+';"><div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:'+TOK.brass+';margin-bottom:10px;">Key interactions</div><ul style="margin:0;padding:0;list-style:none;">'+highlightsHtml+'</ul></div>' : '')+
      '  <div style="font-family:\'IBM Plex Mono\',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:'+TOK.brass+';margin:18px 0 6px;">Top aspects</div>'+
      '  '+rows+
      (!isPaid ? '<div style="margin-top:22px;text-align:center;padding:22px;border:1px solid '+TOK.brass+';"><div style="font-family:\'Fraunces\',serif;font-size:22px;color:'+TOK.ink+';margin-bottom:6px;">Upgrade to read the full synastry</div><div style="font-family:\'Crimson Pro\',serif;font-style:italic;color:'+TOK.inkDim+';">All 10 aspects, all interpretations, unblurred.</div></div>' : '')+
      '</div>';
  }

  /* ── MOUNT BUTTONS VIA OBSERVER ────────────────────────────────────────── */

  function _readUserFromStorage(){
    try { return JSON.parse(localStorage.getItem("astro:user") || "null"); } catch(e){ return null; }
  }

  function _computeUserChart() {
    var user = _readUserFromStorage();
    if (!user || !user.dob) return { user: null, chart: null };
    try {
      var resolver = (typeof window.resolveCityCoords === "function") ? window.resolveCityCoords
                    : (typeof resolveCityCoords === "function") ? resolveCityCoords
                    : null;
      var coords = (resolver ? resolver(user.city) : null) || { lat:-33.87, lon:151.21, tzOffset:10 };
      var computeFn = (typeof window.computeTropicalChart === "function") ? window.computeTropicalChart
                    : (typeof computeTropicalChart === "function") ? computeTropicalChart
                    : null;
      if (!computeFn) return { user: user, chart: null };
      var chart = computeFn({
        dob: user.dob,
        time: user.time || { h:12, m:0 },
        timeUnknown: !!user.timeUnknown,
        lat: coords.lat, lon: coords.lon, tzOffset: coords.tzOffset
      });
      return { user: user, chart: chart };
    } catch(e) {
      console.error("[features] computeUserChart failed:", e);
      return { user: user, chart: null };
    }
  }

  function _renderActionBar() {
    if (document.getElementById("synastra-actions-bar")) return;
    var bar = document.createElement("div");
    bar.id = "synastra-actions-bar";
    bar.style.cssText =
      "position:fixed;top:20px;left:20px;z-index:50;"+
      "display:flex;flex-direction:column;gap:8px;"+
      "font-family:'IBM Plex Mono',monospace;";

    var actions = [
      { label:"Share",   id:"f-share",   title:"Copy a shareable link to your chart" },
      { label:"Compare", id:"f-compare", title:"Overlay someone else's chart with yours" },
      { label:"Export",  id:"f-export",  title:"Download as a 1080x1920 image" }
    ];

    actions.forEach(function(a){
      var btn = document.createElement("button");
      btn.id = a.id;
      btn.type = "button";
      btn.title = a.title;
      btn.textContent = a.label;
      btn.style.cssText =
        "appearance:none;-webkit-appearance:none;"+
        "background:rgba(10,14,26,0.72);backdrop-filter:blur(8px);"+
        "color:"+TOK.brass+";border:1px solid "+TOK.brass+";"+
        "padding:8px 14px;font-family:inherit;font-size:10px;"+
        "letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;"+
        "transition:background .2s,color .2s;border-radius:2px;min-width:110px;";
      btn.addEventListener("mouseenter", function(){
        btn.style.background = TOK.brass;
        btn.style.color = TOK.bg;
      });
      btn.addEventListener("mouseleave", function(){
        btn.style.background = "rgba(10,14,26,0.72)";
        btn.style.color = TOK.brass;
      });
      bar.appendChild(btn);
    });

    document.body.appendChild(bar);

    document.getElementById("f-share").addEventListener("click", function(){
      var u = _readUserFromStorage();
      window.SynastraShare.copy(u);
    });
    document.getElementById("f-compare").addEventListener("click", function(){
      var ctx = _computeUserChart();
      _openCompareModal(ctx.user, ctx.chart);
    });
    document.getElementById("f-export").addEventListener("click", function(){
      var ctx = _computeUserChart();
      if (!ctx.user || !ctx.chart) { _toast("Load your chart first"); return; }
      exportDownload(ctx.user, ctx.chart);
    });
  }

  function _hideActionBar() {
    var bar = document.getElementById("synastra-actions-bar");
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }

  function _evaluate() {
    var u = _readUserFromStorage();
    var appLoaded = !!document.querySelector(".cog") || !!document.querySelector(".hero");
    if (u && u.dob && appLoaded) {
      _renderActionBar();
    } else {
      _hideActionBar();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _evaluate);
  } else {
    _evaluate();
  }
  new MutationObserver(_evaluate).observe(document.body, { childList:true, subtree:true });

})();
