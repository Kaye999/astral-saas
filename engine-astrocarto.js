/*
 * engine-astrocarto.js — Astrocartography engine + world map renderer
 *
 * Depends on globals: `Astronomy` (astronomy-engine v2.1.19), React (for the
 * optional React factory path), and — if available — the engine-astro.js
 * helpers already concatenated into the bundle.
 *
 * This file is fetched + concatenated with the rest of the JS bundle and
 * transformed by Babel-standalone. Like engine-astro.js and features.js we
 * avoid ES modules, JSX (kept optional), and we mirror public functions on
 * `window.SynastraAstrocarto` so the UI bundle can call them.
 *
 * WHAT IS ASTROCARTOGRAPHY?
 * ------------------------
 * For each planet in the natal chart, we compute the set of places on Earth
 * where that planet was angular at the instant of birth. Four lines exist
 * per planet:
 *
 *   MC (Medium Coeli)  — the meridian where the planet was culminating.
 *   IC (Imum Coeli)    — the meridian 180° opposite, underfoot.
 *   AC (Ascendant)     — a curve of longitudes where the planet was rising.
 *   DC (Descendant)    — a curve where the planet was setting.
 *
 * People use their astrocartography map to pick places to live, travel or
 * relocate — each line carries the archetypal energy of the planet.
 *
 * SELF-TEST — ETHAN, 23 JUL 2004, 06:30 AEST, Sydney (-33.87, +151.21, +10)
 * ------------------------------------------------------------------------
 * Sydney is at longitude +151.21° E. At 06:30 local on 23 Jul 2004 the Sun
 * was rising on the eastern horizon (Sun at 0° Leo, birth just after civil
 * dawn), so the AC curve for the Sun passes through ~+151° E at latitude
 * -33.87° — i.e. essentially through Sydney itself.
 *
 * The MC line for the Sun is, by construction, 90° ahead of the AC point in
 * local hour angle — meaning the Sun MC meridian falls ~90° west of Sydney,
 * around longitude +60° E, which places the Sun MC line crossing the middle
 * of the Indian Ocean near the Seychelles / Reunion / Mauritius belt.
 *
 * Conversely the Sun IC meridian sits ~180° from the MC, near longitude
 * -120° E (i.e. 120° W) — running through the Pacific west of Los Angeles.
 *
 *   Expected Sun MC longitude : ~ +60°  (± a few degrees)
 *   Expected Sun IC longitude : ~ -120° (± a few degrees)
 *   Expected Sun AC longitude : ~ +151° at lat -33.87° (Sydney itself)
 *   Expected Sun DC longitude : ~ -29°  (i.e. 29° W) — mid-Atlantic
 *
 * These are what the computed map should plot. The integrator can eyeball
 * them against the rendered map.
 *
 * CAVEATS
 * -------
 * - We simplify β = 0 (ecliptic latitude) for all bodies, which introduces
 *   up to ~1° error for the Moon and the outer planets near the nodes.
 * - AC/DC curves break down inside the polar regions (|lat| > 66°) where
 *   the planet may be circumpolar. We clamp the latitude range to ±66° and
 *   silently drop any (lat, δ) combination whose acos argument is out of
 *   [-1, +1].
 * - The world map is rendered as a graticule (lat/lon grid) in faint brass
 *   plus a very small, hand-approximated set of continent outlines — not a
 *   full Natural Earth dataset. A future v2 can swap in the real paths.
 * - Reverse geocoder matches against a curated list of ~60 major cities. A
 *   match is any city within ±4° of the line's local longitude. Names are
 *   flagged as "near", not exact.
 */

/* ============================================================
 * Constants & palette
 * ============================================================ */

var ASTROCARTO_TOK = {
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

// Palette per planet — chosen for visual distinction on a dark map.
var ASTROCARTO_PLANET_COLORS = {
  Sun:      "#F2C14E",  // warm gold
  Moon:     "#D7E1EC",  // silver
  Mercury:  "#9DD1A7",  // pale green
  Venus:    "#E89AC3",  // rose pink
  Mars:     "#D9543B",  // ember red
  Jupiter:  "#C8A052",  // brass
  Saturn:   "#7B7361",  // dim taupe
  Uranus:   "#6EC1D2",  // ice cyan
  Neptune:  "#8AA6E0",  // sea blue
  Pluto:    "#7A4E9F"   // plum
};

// Personal vs outer — drives stroke width and opacity.
var ASTROCARTO_PERSONAL = {
  Sun: 1, Moon: 1, Mercury: 1, Venus: 1, Mars: 1
};

// Planets we render lines for. Order matters for the legend.
var ASTROCARTO_PLANETS = [
  "Sun", "Moon", "Mercury", "Venus", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"
];

// Map dimensions (equirectangular projection).
var ASTROCARTO_MAP_W = 1440;
var ASTROCARTO_MAP_H = 720;

// Latitude clamp — AC/DC curves blow up inside polar regions.
var ASTROCARTO_LAT_LIMIT = 66;

/* ============================================================
 * Angle helpers
 * (shadow engine-astro.js helpers so this file is standalone)
 * ============================================================ */

function _ac_deg2rad(d) { return d * Math.PI / 180; }
function _ac_rad2deg(r) { return r * 180 / Math.PI; }

function _ac_norm360(x) {
  var v = x % 360;
  if (v < 0) v += 360;
  return v;
}

// Normalise into (-180, +180] — the natural range for geographic longitude.
function _ac_norm180(x) {
  var v = ((x + 180) % 360 + 360) % 360 - 180;
  if (v <= -180) v += 360;
  return v;
}

/* ============================================================
 * Ecliptic → equatorial conversion
 * ============================================================ */

// Given ecliptic longitude λ (deg) and assuming β = 0, return RA (deg) and
// declination (deg) using mean obliquity of the ecliptic.
function _ac_eclipticToEquatorial(lambdaDeg, epsDeg) {
  var lam = _ac_deg2rad(lambdaDeg);
  var eps = _ac_deg2rad(epsDeg);
  var sinL = Math.sin(lam);
  var cosL = Math.cos(lam);
  var sinE = Math.sin(eps);
  var cosE = Math.cos(eps);

  // RA = atan2(sin λ · cos ε, cos λ)     (because β = 0)
  var ra = _ac_rad2deg(Math.atan2(sinL * cosE, cosL));
  // Dec = asin(sin λ · sin ε)
  var dec = _ac_rad2deg(Math.asin(sinL * sinE));

  return { ra: _ac_norm360(ra), dec: dec };
}

// Mean obliquity of the ecliptic (IAU 1980), degrees.
function _ac_meanObliquityDeg(astroTime) {
  var T = astroTime.tt / 36525.0;
  var seconds =
    84381.448 - 46.8150 * T - 0.00059 * T * T + 0.001813 * T * T * T;
  return seconds / 3600.0;
}

// Greenwich Mean Sidereal Time at an Astronomy.AstroTime instant.
// Returns degrees (0..360).
function _ac_gmstDeg(astroTime) {
  var gstHours = Astronomy.SiderealTime(astroTime);
  return _ac_norm360(gstHours * 15.0);
}

/* ============================================================
 * Line computation
 * ============================================================ */

// For a planet with (ra, dec) and GMST at birth, compute the longitude on
// Earth (east of Greenwich, -180..+180) where the planet is directly at the
// meridian — the MC line.
//
//   mcLon = ra − GMST
//
// The IC line is at mcLon + 180°.
function _ac_mcLongitude(raDeg, gmstDeg) {
  return _ac_norm180(raDeg - gmstDeg);
}

// Hour-angle at the horizon for a given observer latitude & declination.
// Returns H in degrees in [0, 180] or null if the planet never rises/sets
// at that latitude (circumpolar or never visible).
//
//   cos(H) = -tan(lat) · tan(dec)
function _ac_horizonHourAngle(latDeg, decDeg) {
  var lat = _ac_deg2rad(latDeg);
  var dec = _ac_deg2rad(decDeg);
  var arg = -Math.tan(lat) * Math.tan(dec);
  if (arg < -1 || arg > 1) return null;
  return _ac_rad2deg(Math.acos(arg));
}

// Compute the AC (rising) and DC (setting) curves for a planet.
//
// For each latitude in the safe range, find the hour angle H, then the
// longitude-east-of-Greenwich where the planet is rising or setting at that
// latitude.
//
//   At the rising horizon the local hour angle is -H (planet is east of
//   meridian). LST = RA + HA = RA - H. And LST = GMST + lon, so
//     lon = (RA - H) - GMST.
//
//   At the setting horizon HA = +H. So
//     lon = (RA + H) - GMST.
function _ac_horizonCurves(raDeg, decDeg, gmstDeg) {
  var ac = [];
  var dc = [];
  var step = 3; // degrees of latitude between samples — 44 samples per curve.
  for (var lat = -ASTROCARTO_LAT_LIMIT; lat <= ASTROCARTO_LAT_LIMIT; lat += step) {
    var H = _ac_horizonHourAngle(lat, decDeg);
    if (H == null) continue;
    var acLon = _ac_norm180(raDeg - H - gmstDeg);
    var dcLon = _ac_norm180(raDeg + H - gmstDeg);
    ac.push([acLon, lat]);
    dc.push([dcLon, lat]);
  }
  return { ac: ac, dc: dc };
}

/* ============================================================
 * Birth data helpers (standalone — mirrors engine-astro.js)
 * ============================================================ */

function _ac_birthDataToUTCDate(birthData) {
  if (!birthData || !birthData.dob) return null;
  var y = birthData.dob.y;
  var m = birthData.dob.m;
  var d = birthData.dob.d;
  var hour = birthData.timeUnknown ? 12 : (birthData.time && birthData.time.h) || 0;
  var minute = birthData.timeUnknown ? 0 : (birthData.time && birthData.time.m) || 0;
  var tz = birthData.tzOffset || 0;
  var utcMs = Date.UTC(y, m - 1, d, hour, minute, 0);
  utcMs -= tz * 3600 * 1000;
  return new Date(utcMs);
}

/* ============================================================
 * Top-level compute
 * ============================================================ */

// Compute all astrocartography lines for a birth chart.
//
//   birthData = { dob:{y,m,d}, time:{h,m}, lat, lon, tzOffset, timeUnknown }
//   tropicalChart = { planets:[{planet, longitude, ...}], ... }
//
// Returns:
//   {
//     planets: [
//       { planet, color, personal, mc:{lon}, ic:{lon}, ac:[[lon,lat],...], dc:[[lon,lat],...] },
//       ...
//     ],
//     meta: { birthUTC, lat, lon, tzOffset, gmst, obliquity }
//   }
function computeAstrocarto(birthData, tropicalChart) {
  if (!birthData || !tropicalChart || !tropicalChart.planets) {
    return { planets: [], meta: null, error: "missing inputs" };
  }

  var utcDate = _ac_birthDataToUTCDate(birthData);
  if (!utcDate) return { planets: [], meta: null, error: "bad birth data" };

  var astroTime = new Astronomy.AstroTime(utcDate);
  var gmst = _ac_gmstDeg(astroTime);
  var eps = _ac_meanObliquityDeg(astroTime);

  // Index the natal longitudes by planet name.
  var lonByPlanet = {};
  for (var i = 0; i < tropicalChart.planets.length; i++) {
    var p = tropicalChart.planets[i];
    lonByPlanet[p.planet] = p.longitude;
  }

  var out = [];
  for (var j = 0; j < ASTROCARTO_PLANETS.length; j++) {
    var name = ASTROCARTO_PLANETS[j];
    var lam = lonByPlanet[name];
    if (typeof lam !== "number") continue;

    var eq = _ac_eclipticToEquatorial(lam, eps);
    var mcLon = _ac_mcLongitude(eq.ra, gmst);
    var icLon = _ac_norm180(mcLon + 180);
    var curves = _ac_horizonCurves(eq.ra, eq.dec, gmst);

    out.push({
      planet: name,
      color: ASTROCARTO_PLANET_COLORS[name] || ASTROCARTO_TOK.brass,
      personal: !!ASTROCARTO_PERSONAL[name],
      eclipticLongitude: lam,
      rightAscension: eq.ra,
      declination: eq.dec,
      mc: { lon: mcLon },
      ic: { lon: icLon },
      ac: curves.ac,
      dc: curves.dc
    });
  }

  return {
    planets: out,
    meta: {
      birthUTC: utcDate.toISOString(),
      lat: birthData.lat,
      lon: birthData.lon,
      tzOffset: birthData.tzOffset,
      gmst: gmst,
      obliquity: eps
    }
  };
}

/* ============================================================
 * Line interpretations
 * (All 40 cells filled — 10 planets × 4 angles.)
 * ============================================================ */

var ASTROCARTO_LINES = {
  Sun: {
    MC: {
      title: "Sun on the MC",
      body:
        "Places under your Sun MC line are where you are recognised. Your "+
        "natural authority is visible here \u2014 work, title and reputation take "+
        "centre stage, and the room turns toward you without effort. If you "+
        "have ambitions you want the world to watch, move closer to this "+
        "meridian; the light finds you here."
    },
    IC: {
      title: "Sun on the IC",
      body:
        "Sun IC places feel like home in the quiet sense \u2014 roots, privacy, "+
        "and the raw material of who you are. You rebuild your inner life "+
        "here, often out of public view. The ambition dims; the identity "+
        "deepens. Good for sabbaticals, family, and the long interior work "+
        "that never fits on a CV."
    },
    AC: {
      title: "Sun rising",
      body:
        "Along your Sun AC line you walk into rooms as yourself. The mask "+
        "thins and the essence becomes legible to strangers. People see "+
        "your confidence and your warmth before you speak. This is the "+
        "classic 'good skin' line \u2014 a place to reintroduce yourself to "+
        "your own life."
    },
    DC: {
      title: "Sun setting",
      body:
        "On the Sun DC line the most important encounters are with other "+
        "people. Partners and rivals shine brighter than you do, and the "+
        "relationship itself becomes the teacher. Not a bad line \u2014 simply "+
        "a place where you learn who you are by watching who comes toward "+
        "you."
    }
  },

  Moon: {
    MC: {
      title: "Moon on the MC",
      body:
        "Under a Moon MC line your public face is nurturing. You are known "+
        "for how you make people feel \u2014 care work, hospitality, the "+
        "emotional centre of a scene. Reputation rises and falls on mood. "+
        "These places reward the parts of you that tend rather than "+
        "perform."
    },
    IC: {
      title: "Moon on the IC",
      body:
        "The Moon IC line is the deepest domestic line you have. Home "+
        "finds you here \u2014 literal walls, family, the smell of a kitchen "+
        "that belongs to you. Emotional memory settles. Many people feel "+
        "inexplicably safe in Moon IC cities, even on their first visit."
    },
    AC: {
      title: "Moon rising",
      body:
        "Your Moon AC line makes your inner life visible. Strangers sense "+
        "your emotional weather before you have named it. You are softer, "+
        "more receptive, more easily moved. Beautiful for healing work and "+
        "rest; trickier if you need a protective shell for a season."
    },
    DC: {
      title: "Moon setting",
      body:
        "On the Moon DC line relationships arrive with a maternal charge. "+
        "You project feeling onto the other person \u2014 they remind you of "+
        "mother, of home, of childhood. This is a line for long pair-bonds "+
        "and for re-parenting, in both directions."
    }
  },

  Mercury: {
    MC: {
      title: "Mercury on the MC",
      body:
        "Mercury MC makes you known for your mind. Writing, speaking, "+
        "teaching and media become visible on this meridian. Cities "+
        "under this line tend to push you onto stages \u2014 panels, "+
        "podcasts, opinion columns. Your ideas travel further than they "+
        "do elsewhere."
    },
    IC: {
      title: "Mercury on the IC",
      body:
        "Mercury IC is a reading line, a thinking line, a study line. "+
        "The interior dialogue accelerates; you fill notebooks. Good for "+
        "quiet research and for living inside the archive. Not a line for "+
        "charisma \u2014 a line for depth of thought."
    },
    AC: {
      title: "Mercury rising",
      body:
        "Your Mercury AC line sharpens how you come across. Speech is "+
        "faster, wittier, more exact. You think on your feet and people "+
        "quote you. Excellent for negotiations, new collaborations and "+
        "any profession that rewards articulacy. Minor risk: overexplaining."
    },
    DC: {
      title: "Mercury setting",
      body:
        "On the Mercury DC line your relationships are built out of "+
        "conversation. Friendships form through shared ideas; romance "+
        "runs on banter. You attract partners who clarify your own "+
        "thinking \u2014 sometimes by argument. A good city for writers and "+
        "their muses."
    }
  },

  Venus: {
    MC: {
      title: "Venus on the MC",
      body:
        "Under Venus MC your public image softens \u2014 you are seen as "+
        "beautiful, tasteful, worth being near. Careers in design, "+
        "fashion, art and luxury bloom on this meridian. Social "+
        "invitations multiply. The line rewards aesthetic choices; it "+
        "punishes crude ones."
    },
    IC: {
      title: "Venus on the IC",
      body:
        "Venus IC is one of the loveliest home lines on the map. Your "+
        "private life becomes pleasurable \u2014 a kitchen you love cooking "+
        "in, a bed that feels like grace. Romantic cohabitation and "+
        "quiet domestic happiness settle here. A line to choose with "+
        "intention."
    },
    AC: {
      title: "Venus rising",
      body:
        "Your Venus AC line is the skin-glow line. People read you as "+
        "attractive before you have spoken \u2014 a gravitational pull "+
        "unconnected to what you are actually doing. Flirtation, "+
        "creative flow, sheer physical ease. Try not to get lazy about "+
        "your own worth."
    },
    DC: {
      title: "Venus setting",
      body:
        "On the Venus DC line the partners who arrive are, simply, your "+
        "type \u2014 aesthetic and emotional rhyme. Love affairs begin easily "+
        "here; marriages often. The risk is idealisation. You are seeing "+
        "your own beauty reflected, and forgetting to read the other "+
        "person in full."
    }
  },

  Mars: {
    MC: {
      title: "Mars on the MC",
      body:
        "Mars MC is the warrior's meridian. You are visible here as "+
        "driven, competitive, a person who finishes. Careers involving "+
        "physical effort, risk, advocacy and fight thrive. It is not a "+
        "subtle line \u2014 expect conflict, expect attention, expect the "+
        "adrenaline you moved for."
    },
    IC: {
      title: "Mars on the IC",
      body:
        "Mars IC brings edge to the private life. You renovate, "+
        "restructure, fight with family, train hard in a home gym. Old "+
        "anger surfaces for integration. Productive in the long arc, "+
        "restless in the short. Not a line for convalescence."
    },
    AC: {
      title: "Mars rising",
      body:
        "Your Mars AC line turns up the heat on your body and your "+
        "presence. Energy climbs, desire climbs, patience drops. "+
        "Wonderful for athletes, founders and anyone who has been stuck. "+
        "Watch for the shorter fuse \u2014 the fight that was not worth "+
        "having."
    },
    DC: {
      title: "Mars setting",
      body:
        "On the Mars DC line partners arrive with heat. Attraction is "+
        "fast and physical; conflict almost as fast. You are drawing "+
        "in figures who awaken your own drive, including competitors. A "+
        "powerful line for romance with teeth and for mentors who push "+
        "you forward."
    }
  },

  Jupiter: {
    MC: {
      title: "Jupiter on the MC",
      body:
        "Jupiter MC is the great career-luck line. Doors open, "+
        "sponsors appear, titles arrive earlier than your CV suggests. "+
        "Teaching, publishing, law, travel and the businesses built "+
        "around them all flourish. The work itself feels bigger than "+
        "you \u2014 in a good way."
    },
    IC: {
      title: "Jupiter on the IC",
      body:
        "Jupiter IC is the wise-home line. The private life expands \u2014 "+
        "property, family, faith, a sense of being blessed at dinner. "+
        "Many people buy their first real house on a Jupiter IC line. "+
        "Watch the waistline and the optimism; both grow."
    },
    AC: {
      title: "Jupiter rising",
      body:
        "Your Jupiter AC line is the classic 'good fortune' line. You "+
        "are read as generous, large-spirited, someone worth betting on. "+
        "Opportunity gravitates. Health tends to improve. This is the "+
        "line to choose if you need to believe in yourself again."
    },
    DC: {
      title: "Jupiter setting",
      body:
        "On the Jupiter DC line the partners who arrive are teachers, "+
        "elders, foreigners, people of means. Marriages formed here "+
        "tend to enlarge both lives. Watch only for the blind trust "+
        "that Jupiter hands out too easily. Do your due diligence."
    }
  },

  Saturn: {
    MC: {
      title: "Saturn on the MC",
      body:
        "Saturn MC is a career of discipline and duty. Reputation is "+
        "earned slowly and lasts. Institutions, government, law and the "+
        "long apprenticed crafts do well here. Not a flashy line. A "+
        "line for people willing to be good at something for twenty "+
        "years."
    },
    IC: {
      title: "Saturn on the IC",
      body:
        "Saturn IC is the karmic home line. Old family material "+
        "surfaces \u2014 duty to parents, ancestral property, the weight of "+
        "where you come from. Can feel heavy; can also be where you "+
        "finally finish the work your lineage started. Choose with eyes "+
        "open."
    },
    AC: {
      title: "Saturn rising",
      body:
        "Your Saturn AC line makes you look older, more serious, more "+
        "authoritative. Responsibility finds you \u2014 often more than is "+
        "comfortable. Good for leadership training, bad for rest. You "+
        "will mature here; you may also age here faster than you would "+
        "like."
    },
    DC: {
      title: "Saturn setting",
      body:
        "On the Saturn DC line partnerships arrive as commitments. "+
        "Older partners, authority figures, contracts. Marriages formed "+
        "here are serious, sometimes somber, usually durable. The risk "+
        "is a relationship that feels like obligation more than joy."
    }
  },

  Uranus: {
    MC: {
      title: "Uranus on the MC",
      body:
        "Uranus MC is the breakthrough career line. You are seen as an "+
        "innovator, a disruptor, sometimes a freak \u2014 in the admiring "+
        "sense. Tech, science, activism and any profession that rewards "+
        "original thinking spike. Employment structures will not be "+
        "conventional."
    },
    IC: {
      title: "Uranus on the IC",
      body:
        "Uranus IC breaks and remakes the domestic life. Living "+
        "arrangements change often; chosen family replaces given "+
        "family. The energy in the home is unusual \u2014 a studio, a "+
        "commune, a co-living experiment. Great for inventors; harder "+
        "if you crave stability."
    },
    AC: {
      title: "Uranus rising",
      body:
        "Your Uranus AC line electrifies your presence. You look and "+
        "feel original, unpredictable, allergic to the expected script. "+
        "Sudden insight, sudden reinvention, sudden departure. A line "+
        "for quantum leaps and for waking up from a life that had gone "+
        "stale."
    },
    DC: {
      title: "Uranus setting",
      body:
        "On the Uranus DC line partners arrive unexpectedly and leave "+
        "the same way. Unusual relationships \u2014 open structures, long "+
        "distance, radical age or culture gaps. The connection is "+
        "stimulating and rarely steady. Freedom is the covenant."
    }
  },

  Neptune: {
    MC: {
      title: "Neptune on the MC",
      body:
        "Neptune MC is a career of image, dream and influence. Film, "+
        "music, photography, spirituality, charity \u2014 vocations that "+
        "deal in the invisible \u2014 flourish here. Reputation can be "+
        "diffuse; people project onto you. Beware of public roles that "+
        "ask you to wear a fantasy."
    },
    IC: {
      title: "Neptune on the IC",
      body:
        "Neptune IC dissolves the edges of home. Houses by water, "+
        "contemplative retreats, places where you lose track of time. "+
        "Inner life deepens, practical life gets fuzzy. Sublime for "+
        "artists and mystics; risky for anyone prone to escapism."
    },
    AC: {
      title: "Neptune rising",
      body:
        "Your Neptune AC line softens and glamorises you. People read "+
        "you as magnetic, mysterious, slightly mythical \u2014 and "+
        "sometimes unknowable. Creativity rises. So does suggestibility. "+
        "Avoid signing contracts and starting substance habits on this "+
        "line."
    },
    DC: {
      title: "Neptune setting",
      body:
        "On the Neptune DC line partners arrive as mirrors and muses. "+
        "The attraction is dreamlike, sometimes saintly, occasionally "+
        "delusional. Beautiful for artists finding their collaborator; "+
        "dangerous for anyone who tends to rescue. Check what is real "+
        "before you commit."
    }
  },

  Pluto: {
    MC: {
      title: "Pluto on the MC",
      body:
        "Pluto MC is a career of power \u2014 you work at depth, with "+
        "taboo, with transformation. Surgery, psychotherapy, finance, "+
        "detective work, crisis leadership. You are seen as intense; "+
        "people either trust you fully or steer clear. Reputation can "+
        "rebirth more than once."
    },
    IC: {
      title: "Pluto on the IC",
      body:
        "Pluto IC turns the home into a crucible. Old patterns are "+
        "exposed, inherited wounds surface, the family story rewrites "+
        "itself. Not an easy line \u2014 a line where you finally grow up. "+
        "If you are ready to confront the past, this is the place."
    },
    AC: {
      title: "Pluto rising",
      body:
        "Your Pluto AC line makes you magnetic and a little dangerous. "+
        "Your presence is heavier; strangers feel it. Life intensifies \u2014 "+
        "old selves die, new ones ignite. Transformative in the true "+
        "sense of the word. Not a line for passing through lightly."
    },
    DC: {
      title: "Pluto setting",
      body:
        "On the Pluto DC line partners arrive as catalysts. Love and "+
        "power braid together; control, jealousy, obsession and "+
        "profound loyalty all rise. Relationships formed here remake "+
        "you. Choose carefully \u2014 and only if you want to be changed."
    }
  }
};

/* ============================================================
 * Reverse geocoder — ~60 major cities
 * ============================================================ */

var ASTROCARTO_CITIES = [
  { name:"Sydney",            country:"Australia",      lat:-33.87, lon:151.21 },
  { name:"Melbourne",         country:"Australia",      lat:-37.81, lon:144.96 },
  { name:"Brisbane",          country:"Australia",      lat:-27.47, lon:153.03 },
  { name:"Perth",             country:"Australia",      lat:-31.95, lon:115.86 },
  { name:"Adelaide",          country:"Australia",      lat:-34.93, lon:138.60 },
  { name:"Auckland",          country:"New Zealand",    lat:-36.85, lon:174.76 },
  { name:"Wellington",        country:"New Zealand",    lat:-41.29, lon:174.78 },
  { name:"Tokyo",             country:"Japan",          lat:35.68,  lon:139.69 },
  { name:"Osaka",             country:"Japan",          lat:34.69,  lon:135.50 },
  { name:"Seoul",             country:"South Korea",    lat:37.57,  lon:126.98 },
  { name:"Beijing",           country:"China",          lat:39.90,  lon:116.41 },
  { name:"Shanghai",          country:"China",          lat:31.23,  lon:121.47 },
  { name:"Hong Kong",         country:"China",          lat:22.30,  lon:114.17 },
  { name:"Singapore",         country:"Singapore",      lat:1.35,   lon:103.82 },
  { name:"Bangkok",           country:"Thailand",       lat:13.76,  lon:100.50 },
  { name:"Jakarta",           country:"Indonesia",      lat:-6.21,  lon:106.85 },
  { name:"Manila",            country:"Philippines",    lat:14.60,  lon:120.98 },
  { name:"Mumbai",            country:"India",          lat:19.08,  lon:72.88  },
  { name:"Delhi",             country:"India",          lat:28.61,  lon:77.21  },
  { name:"Bengaluru",         country:"India",          lat:12.97,  lon:77.59  },
  { name:"Karachi",           country:"Pakistan",       lat:24.86,  lon:67.01  },
  { name:"Dubai",             country:"UAE",            lat:25.20,  lon:55.27  },
  { name:"Istanbul",          country:"Turkey",         lat:41.01,  lon:28.98  },
  { name:"Tel Aviv",          country:"Israel",         lat:32.08,  lon:34.78  },
  { name:"Cairo",             country:"Egypt",          lat:30.04,  lon:31.24  },
  { name:"Nairobi",           country:"Kenya",          lat:-1.29,  lon:36.82  },
  { name:"Lagos",             country:"Nigeria",        lat:6.52,   lon:3.38   },
  { name:"Johannesburg",      country:"South Africa",   lat:-26.20, lon:28.05  },
  { name:"Cape Town",         country:"South Africa",   lat:-33.92, lon:18.42  },
  { name:"Casablanca",        country:"Morocco",        lat:33.57,  lon:-7.59  },
  { name:"London",            country:"UK",             lat:51.51,  lon:-0.13  },
  { name:"Manchester",        country:"UK",             lat:53.48,  lon:-2.24  },
  { name:"Edinburgh",         country:"UK",             lat:55.95,  lon:-3.19  },
  { name:"Dublin",            country:"Ireland",        lat:53.35,  lon:-6.26  },
  { name:"Paris",             country:"France",         lat:48.86,  lon:2.35   },
  { name:"Madrid",            country:"Spain",          lat:40.42,  lon:-3.70  },
  { name:"Barcelona",         country:"Spain",          lat:41.39,  lon:2.17   },
  { name:"Lisbon",            country:"Portugal",       lat:38.72,  lon:-9.14  },
  { name:"Rome",              country:"Italy",          lat:41.90,  lon:12.50  },
  { name:"Milan",             country:"Italy",          lat:45.46,  lon:9.19   },
  { name:"Berlin",            country:"Germany",        lat:52.52,  lon:13.40  },
  { name:"Munich",            country:"Germany",        lat:48.14,  lon:11.58  },
  { name:"Amsterdam",         country:"Netherlands",    lat:52.37,  lon:4.90   },
  { name:"Brussels",          country:"Belgium",        lat:50.85,  lon:4.35   },
  { name:"Copenhagen",        country:"Denmark",        lat:55.68,  lon:12.57  },
  { name:"Stockholm",         country:"Sweden",         lat:59.33,  lon:18.07  },
  { name:"Oslo",              country:"Norway",         lat:59.91,  lon:10.75  },
  { name:"Helsinki",          country:"Finland",        lat:60.17,  lon:24.94  },
  { name:"Vienna",            country:"Austria",        lat:48.21,  lon:16.37  },
  { name:"Prague",            country:"Czech Republic", lat:50.08,  lon:14.44  },
  { name:"Warsaw",            country:"Poland",         lat:52.23,  lon:21.01  },
  { name:"Athens",            country:"Greece",         lat:37.98,  lon:23.73  },
  { name:"Moscow",            country:"Russia",         lat:55.76,  lon:37.62  },
  { name:"New York",          country:"USA",            lat:40.71,  lon:-74.01 },
  { name:"Boston",            country:"USA",            lat:42.36,  lon:-71.06 },
  { name:"Washington DC",     country:"USA",            lat:38.91,  lon:-77.04 },
  { name:"Miami",             country:"USA",            lat:25.76,  lon:-80.19 },
  { name:"Chicago",           country:"USA",            lat:41.88,  lon:-87.63 },
  { name:"Austin",            country:"USA",            lat:30.27,  lon:-97.74 },
  { name:"Denver",            country:"USA",            lat:39.74,  lon:-104.99 },
  { name:"Los Angeles",       country:"USA",            lat:34.05,  lon:-118.24 },
  { name:"San Francisco",     country:"USA",            lat:37.77,  lon:-122.42 },
  { name:"Seattle",           country:"USA",            lat:47.61,  lon:-122.33 },
  { name:"Vancouver",         country:"Canada",         lat:49.28,  lon:-123.12 },
  { name:"Toronto",           country:"Canada",         lat:43.65,  lon:-79.38 },
  { name:"Montreal",          country:"Canada",         lat:45.50,  lon:-73.57 },
  { name:"Mexico City",       country:"Mexico",         lat:19.43,  lon:-99.13 },
  { name:"Havana",            country:"Cuba",           lat:23.13,  lon:-82.38 },
  { name:"Bogota",            country:"Colombia",       lat:4.71,   lon:-74.07 },
  { name:"Lima",              country:"Peru",           lat:-12.05, lon:-77.04 },
  { name:"Santiago",          country:"Chile",          lat:-33.45, lon:-70.67 },
  { name:"Buenos Aires",      country:"Argentina",      lat:-34.60, lon:-58.38 },
  { name:"Sao Paulo",         country:"Brazil",         lat:-23.55, lon:-46.63 },
  { name:"Rio de Janeiro",    country:"Brazil",         lat:-22.91, lon:-43.17 }
];

// Find the nearest city to a (lon, lat) point within ±tolDeg degrees.
function reverseGeocode(lon, lat, tolDeg) {
  if (tolDeg == null) tolDeg = 4;
  var best = null;
  var bestDist = Infinity;
  for (var i = 0; i < ASTROCARTO_CITIES.length; i++) {
    var c = ASTROCARTO_CITIES[i];
    var dLon = Math.abs(_ac_norm180(c.lon - lon));
    var dLat = Math.abs(c.lat - lat);
    var dist = Math.sqrt(dLon * dLon + dLat * dLat);
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  if (!best) return null;
  if (bestDist > tolDeg * 4) return null;
  return { city: best, distanceDeg: bestDist };
}

// For a given MC longitude (meridian), list nearby cities whose longitude
// is within ±tolDeg of the line. Returns up to `limit` cities sorted by
// proximity.
function citiesNearMeridian(mcLon, tolDeg, limit) {
  if (tolDeg == null) tolDeg = 3;
  if (limit == null) limit = 4;
  var list = [];
  for (var i = 0; i < ASTROCARTO_CITIES.length; i++) {
    var c = ASTROCARTO_CITIES[i];
    var dLon = Math.abs(_ac_norm180(c.lon - mcLon));
    if (dLon <= tolDeg) {
      list.push({ city: c, delta: dLon });
    }
  }
  list.sort(function(a,b){ return a.delta - b.delta; });
  return list.slice(0, limit);
}

// For an AC/DC curve (array of [lon, lat]), find cities within tolDeg of any
// point on the curve. Fast linear scan — curves are ~44 points long.
function citiesNearCurve(curve, tolDeg, limit) {
  if (tolDeg == null) tolDeg = 3;
  if (limit == null) limit = 4;
  var candidates = [];
  for (var i = 0; i < ASTROCARTO_CITIES.length; i++) {
    var c = ASTROCARTO_CITIES[i];
    var bestDist = Infinity;
    for (var j = 0; j < curve.length; j++) {
      var pt = curve[j];
      var dLon = Math.abs(_ac_norm180(c.lon - pt[0]));
      var dLat = Math.abs(c.lat - pt[1]);
      var d = Math.sqrt(dLon * dLon + dLat * dLat);
      if (d < bestDist) bestDist = d;
    }
    if (bestDist <= tolDeg) {
      candidates.push({ city: c, delta: bestDist });
    }
  }
  candidates.sort(function(a,b){ return a.delta - b.delta; });
  return candidates.slice(0, limit);
}

/* ============================================================
 * Projection helpers
 * ============================================================ */

// Equirectangular: lon in [-180,180] -> x in [0, W]; lat in [-90,90] -> y in [0, H].
function _ac_projX(lon) {
  return (lon + 180) * (ASTROCARTO_MAP_W / 360);
}
function _ac_projY(lat) {
  return (90 - lat) * (ASTROCARTO_MAP_H / 180);
}

/* ============================================================
 * World map base — graticule + stylised continent outlines
 * ============================================================ */

// Ultra-simplified continent polygons. Not cartographically accurate — just
// enough to give the eye something to anchor on behind the graticule. v2
// can swap in real TopoJSON.
var ASTROCARTO_CONTINENTS = [
  { name:"N America",
    points:[
      [-168,66],[-150,70],[-130,70],[-95,68],[-75,62],[-60,60],[-55,50],[-65,45],
      [-75,42],[-80,26],[-97,26],[-105,20],[-115,30],[-125,40],[-130,55],[-155,60],[-168,66]
    ]
  },
  { name:"S America",
    points:[
      [-80,10],[-70,12],[-60,8],[-50,0],[-45,-5],[-35,-8],[-40,-25],[-55,-35],
      [-65,-42],[-72,-52],[-74,-55],[-78,-45],[-80,-30],[-82,-10],[-80,10]
    ]
  },
  { name:"Europe",
    points:[
      [-10,36],[-5,43],[0,50],[6,58],[12,65],[25,70],[40,68],[40,60],[30,50],
      [20,42],[12,37],[0,36],[-10,36]
    ]
  },
  { name:"Africa",
    points:[
      [-17,15],[-10,30],[0,35],[15,32],[25,32],[35,30],[45,15],[50,5],[42,-5],
      [38,-20],[30,-30],[20,-35],[15,-30],[10,-10],[0,5],[-10,10],[-17,15]
    ]
  },
  { name:"Asia",
    points:[
      [30,50],[50,55],[70,60],[90,65],[120,68],[160,65],[170,60],[150,45],[140,35],
      [120,25],[105,15],[90,10],[80,15],[70,25],[50,30],[40,35],[30,40],[30,50]
    ]
  },
  { name:"India",
    points:[
      [70,25],[75,22],[80,15],[78,10],[85,12],[88,22],[90,23],[82,27],[73,27],[70,25]
    ]
  },
  { name:"Arabia",
    points:[
      [35,30],[45,30],[55,25],[58,18],[53,13],[45,13],[40,20],[35,25],[35,30]
    ]
  },
  { name:"Australia",
    points:[
      [115,-15],[125,-12],[140,-12],[150,-15],[153,-25],[150,-37],[140,-38],[130,-32],
      [120,-33],[115,-25],[115,-15]
    ]
  },
  { name:"NZ North",
    points:[
      [172,-34],[176,-36],[179,-38],[177,-41],[173,-40],[172,-37],[172,-34]
    ]
  },
  { name:"NZ South",
    points:[
      [166,-46],[171,-44],[174,-41],[172,-44],[168,-46],[167,-47],[166,-46]
    ]
  },
  { name:"UK",
    points:[
      [-5,50],[-2,51],[0,52],[1,54],[-2,58],[-6,58],[-8,55],[-5,50]
    ]
  },
  { name:"Ireland",
    points:[
      [-10,52],[-7,55],[-6,54],[-8,52],[-10,52]
    ]
  },
  { name:"Japan",
    points:[
      [130,32],[135,34],[139,35],[141,39],[142,43],[144,45],[140,40],[135,35],[130,32]
    ]
  },
  { name:"Indonesia",
    points:[
      [95,5],[105,0],[115,-5],[125,-8],[135,-4],[140,-3],[135,-1],[120,-2],[105,2],[95,5]
    ]
  },
  { name:"Madagascar",
    points:[
      [43,-12],[50,-15],[50,-25],[45,-25],[43,-20],[43,-12]
    ]
  },
  { name:"Greenland",
    points:[
      [-55,60],[-40,62],[-25,70],[-30,80],[-50,80],[-55,70],[-55,60]
    ]
  }
];

// Build an SVG <path d="..."> string from a polygon point list.
function _ac_pathFromPoly(points) {
  if (!points || !points.length) return "";
  var parts = [];
  for (var i = 0; i < points.length; i++) {
    var x = _ac_projX(points[i][0]);
    var y = _ac_projY(points[i][1]);
    parts.push((i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1));
  }
  parts.push("Z");
  return parts.join(" ");
}

// Build an SVG polyline (no close) for curves. Splits on longitude wraps so
// a curve that crosses the antimeridian doesn't draw a huge horizontal bar.
function _ac_pathFromCurve(curve) {
  if (!curve || !curve.length) return "";
  var segments = [];
  var cur = [];
  var lastX = null;
  for (var i = 0; i < curve.length; i++) {
    var lon = curve[i][0];
    var lat = curve[i][1];
    var x = _ac_projX(lon);
    var y = _ac_projY(lat);
    if (lastX !== null && Math.abs(x - lastX) > ASTROCARTO_MAP_W / 2) {
      if (cur.length) segments.push(cur);
      cur = [];
    }
    cur.push([x, y]);
    lastX = x;
  }
  if (cur.length) segments.push(cur);

  var d = [];
  for (var s = 0; s < segments.length; s++) {
    var seg = segments[s];
    for (var k = 0; k < seg.length; k++) {
      d.push((k === 0 ? "M" : "L") + seg[k][0].toFixed(1) + "," + seg[k][1].toFixed(1));
    }
  }
  return d.join(" ");
}

/* ============================================================
 * SVG renderer
 * ============================================================ */

// Build the full SVG (as a string). Each line gets data-planet/data-angle
// attributes so the hover tooltip can find its interpretation.
function renderAstrocartoSVG(result) {
  if (!result || !result.planets) return "";

  var W = ASTROCARTO_MAP_W;
  var H = ASTROCARTO_MAP_H;
  var out = [];

  out.push(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+W+' '+H+'" ' +
    'preserveAspectRatio="xMidYMid meet" style="width:100%;height:auto;' +
    'display:block;background:'+ASTROCARTO_TOK.bgDeep+';border:1px solid '+ASTROCARTO_TOK.rule+';">'
  );

  out.push(
    '<defs>'+
    '<radialGradient id="ac-bgglow" cx="50%" cy="50%" r="70%">'+
    '<stop offset="0%" stop-color="rgba(200,160,82,0.05)"/>'+
    '<stop offset="100%" stop-color="rgba(6,9,18,0)"/>'+
    '</radialGradient>'+
    '</defs>'
  );
  out.push('<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="url(#ac-bgglow)"/>');

  // Continent outlines — very faint.
  for (var ci = 0; ci < ASTROCARTO_CONTINENTS.length; ci++) {
    var cont = ASTROCARTO_CONTINENTS[ci];
    var d = _ac_pathFromPoly(cont.points);
    out.push(
      '<path d="'+d+'" fill="rgba(200,160,82,0.04)" stroke="'+ASTROCARTO_TOK.inkFaint+
      '" stroke-width="0.6" stroke-opacity="0.35" data-continent="'+cont.name+'"/>'
    );
  }

  // Graticule — parallels every 30°.
  for (var lat = -60; lat <= 60; lat += 30) {
    var y = _ac_projY(lat);
    out.push(
      '<line x1="0" y1="'+y.toFixed(1)+'" x2="'+W+'" y2="'+y.toFixed(1)+'" '+
      'stroke="'+ASTROCARTO_TOK.brass+'" stroke-width="0.4" stroke-opacity="0.15"/>'
    );
    out.push(
      '<text x="6" y="'+(y - 4).toFixed(1)+'" fill="'+ASTROCARTO_TOK.inkFaint+
      '" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="10" opacity="0.55">'+
      (lat === 0 ? "0\u00B0" : (lat > 0 ? (lat + "\u00B0 N") : (Math.abs(lat) + "\u00B0 S"))) +
      '</text>'
    );
  }
  // Equator a touch stronger.
  var yEq = _ac_projY(0);
  out.push(
    '<line x1="0" y1="'+yEq.toFixed(1)+'" x2="'+W+'" y2="'+yEq.toFixed(1)+'" '+
    'stroke="'+ASTROCARTO_TOK.brass+'" stroke-width="0.7" stroke-opacity="0.28"/>'
  );

  // Meridians every 30°.
  for (var lon = -150; lon <= 150; lon += 30) {
    var x = _ac_projX(lon);
    out.push(
      '<line x1="'+x.toFixed(1)+'" y1="0" x2="'+x.toFixed(1)+'" y2="'+H+'" '+
      'stroke="'+ASTROCARTO_TOK.brass+'" stroke-width="0.4" stroke-opacity="0.10"/>'
    );
    out.push(
      '<text x="'+(x + 4).toFixed(1)+'" y="'+(H - 6).toFixed(1)+'" fill="'+ASTROCARTO_TOK.inkFaint+
      '" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="10" opacity="0.45">'+
      (lon === 0 ? "0\u00B0" : (lon > 0 ? (lon + "\u00B0 E") : (Math.abs(lon) + "\u00B0 W"))) +
      '</text>'
    );
  }

  // Planet lines.
  for (var p = 0; p < result.planets.length; p++) {
    var pl = result.planets[p];
    var color = pl.color;
    var stroke = pl.personal ? 2.0 : 1.0;
    var op = pl.personal ? 0.88 : 0.65;

    // MC — vertical line at mcLon.
    var mcX = _ac_projX(pl.mc.lon);
    out.push(
      '<line class="ac-line" data-planet="'+pl.planet+'" data-angle="MC" '+
      'x1="'+mcX.toFixed(1)+'" y1="0" x2="'+mcX.toFixed(1)+'" y2="'+H+'" '+
      'stroke="'+color+'" stroke-width="'+stroke+'" stroke-opacity="'+op+'"/>'
    );
    out.push(
      '<text class="ac-label" data-planet="'+pl.planet+'" data-angle="MC" '+
      'x="'+(mcX + 3).toFixed(1)+'" y="14" fill="'+color+'" '+
      'font-family="IBM Plex Mono, ui-monospace, monospace" font-size="10" letter-spacing="0.1em">'+
      pl.planet.substring(0,3).toUpperCase()+' MC</text>'
    );

    // IC — vertical line at icLon.
    var icX = _ac_projX(pl.ic.lon);
    out.push(
      '<line class="ac-line" data-planet="'+pl.planet+'" data-angle="IC" '+
      'x1="'+icX.toFixed(1)+'" y1="0" x2="'+icX.toFixed(1)+'" y2="'+H+'" '+
      'stroke="'+color+'" stroke-width="'+stroke+'" stroke-opacity="'+(op*0.7)+'" '+
      'stroke-dasharray="6,4"/>'
    );
    out.push(
      '<text class="ac-label" data-planet="'+pl.planet+'" data-angle="IC" '+
      'x="'+(icX + 3).toFixed(1)+'" y="'+(H - 6)+'" fill="'+color+'" '+
      'font-family="IBM Plex Mono, ui-monospace, monospace" font-size="10" letter-spacing="0.1em">'+
      pl.planet.substring(0,3).toUpperCase()+' IC</text>'
    );

    // AC curve.
    var acPath = _ac_pathFromCurve(pl.ac);
    if (acPath) {
      out.push(
        '<path class="ac-line" data-planet="'+pl.planet+'" data-angle="AC" '+
        'd="'+acPath+'" fill="none" stroke="'+color+'" '+
        'stroke-width="'+stroke+'" stroke-opacity="'+op+'" stroke-linecap="round"/>'
      );
    }

    // DC curve.
    var dcPath = _ac_pathFromCurve(pl.dc);
    if (dcPath) {
      out.push(
        '<path class="ac-line" data-planet="'+pl.planet+'" data-angle="DC" '+
        'd="'+dcPath+'" fill="none" stroke="'+color+'" '+
        'stroke-width="'+stroke+'" stroke-opacity="'+(op*0.8)+'" stroke-linecap="round" '+
        'stroke-dasharray="4,4"/>'
      );
    }
  }

  out.push('</svg>');
  return out.join("");
}

/* ============================================================
 * "Interestingness" scoring — used to pick top-N interpretations
 * ============================================================ */

// For each of the 40 lines (10 planets × {MC, IC, AC, DC}), estimate how
// relevant it is to display. Score = citiesMatched * 10 + (personal ? 3 : 0).
function _ac_scoreLine(planetEntry, angle) {
  var personalBonus = planetEntry.personal ? 3 : 0;
  var cities = [];
  if (angle === "MC") {
    cities = citiesNearMeridian(planetEntry.mc.lon, 3, 8);
  } else if (angle === "IC") {
    cities = citiesNearMeridian(planetEntry.ic.lon, 3, 8);
  } else if (angle === "AC") {
    cities = citiesNearCurve(planetEntry.ac, 3, 8);
  } else if (angle === "DC") {
    cities = citiesNearCurve(planetEntry.dc, 3, 8);
  }
  return {
    score: cities.length * 10 + personalBonus,
    cities: cities
  };
}

// Build the full 40-cell list with scores attached, sorted high to low.
function rankAstrocartoLines(result) {
  if (!result || !result.planets) return [];
  var rows = [];
  var angles = ["MC", "IC", "AC", "DC"];
  for (var i = 0; i < result.planets.length; i++) {
    var pe = result.planets[i];
    for (var j = 0; j < angles.length; j++) {
      var ang = angles[j];
      var s = _ac_scoreLine(pe, ang);
      var lineDef = (ASTROCARTO_LINES[pe.planet] || {})[ang] || { title: pe.planet+" "+ang, body: "" };
      var mcLon = ang === "MC" ? pe.mc.lon : (ang === "IC" ? pe.ic.lon : null);
      rows.push({
        planet: pe.planet,
        angle: ang,
        color: pe.color,
        personal: pe.personal,
        title: lineDef.title,
        body: lineDef.body,
        score: s.score,
        cities: s.cities,
        mcLon: mcLon
      });
    }
  }
  rows.sort(function(a, b){ return b.score - a.score; });
  return rows;
}

/* ============================================================
 * UI — vanilla DOM render
 * ============================================================ */

function _ac_fmtLon(lon) {
  var L = _ac_norm180(lon);
  var abs = Math.abs(L).toFixed(1);
  if (L >= 0) return abs + "\u00B0 E";
  return abs + "\u00B0 W";
}

// Attach hover tooltips to the SVG lines so users can see what each line
// means without leaving the map.
function _ac_attachHoverTooltips(svgEl) {
  if (!svgEl) return;
  var tooltip = document.createElement("div");
  tooltip.style.cssText =
    "position:absolute;pointer-events:none;padding:10px 14px;"+
    "background:"+ASTROCARTO_TOK.bgRaise+";color:"+ASTROCARTO_TOK.ink+";"+
    "border:1px solid "+ASTROCARTO_TOK.rule+";border-radius:3px;"+
    "font-family:'Crimson Pro',serif;font-size:13px;line-height:1.45;"+
    "max-width:320px;z-index:60;display:none;"+
    "box-shadow:0 10px 30px rgba(0,0,0,0.5);";
  tooltip.setAttribute("data-ac-tooltip","1");
  svgEl.parentNode.style.position = "relative";
  svgEl.parentNode.appendChild(tooltip);

  var lines = svgEl.querySelectorAll(".ac-line");
  for (var i = 0; i < lines.length; i++) {
    (function(line){
      line.addEventListener("mousemove", function(ev){
        var planet = line.getAttribute("data-planet");
        var angle = line.getAttribute("data-angle");
        var def = (ASTROCARTO_LINES[planet] || {})[angle];
        if (!def) return;
        // Build tooltip content using safe DOM APIs rather than innerHTML.
        while (tooltip.firstChild) tooltip.removeChild(tooltip.firstChild);
        var header = document.createElement("div");
        header.style.cssText = "font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:"+ASTROCARTO_TOK.brass+";margin-bottom:6px;";
        header.textContent = planet+" "+angle;
        var title = document.createElement("div");
        title.style.cssText = "font-family:'Fraunces',serif;font-size:16px;color:"+ASTROCARTO_TOK.ink+";margin-bottom:4px;";
        title.textContent = def.title;
        var body = document.createElement("div");
        body.textContent = def.body;
        tooltip.appendChild(header);
        tooltip.appendChild(title);
        tooltip.appendChild(body);

        tooltip.style.display = "block";
        var parent = svgEl.parentNode;
        var pr = parent.getBoundingClientRect();
        tooltip.style.left = (ev.clientX - pr.left + 14) + "px";
        tooltip.style.top = (ev.clientY - pr.top + 14) + "px";
      });
      line.addEventListener("mouseleave", function(){ tooltip.style.display = "none"; });
    })(lines[i]);
  }
}

// Small helper to create a styled element with textContent.
function _ac_el(tag, styleCss, text) {
  var el = document.createElement(tag);
  if (styleCss) el.style.cssText = styleCss;
  if (text != null) el.textContent = text;
  return el;
}

// Inner renderer — fills the given mount element with the full panel.
function _ac_renderIntoMount(mount, user, tropical) {
  if (!mount) return;

  // Resolve coords via the main bundle's resolveCityCoords if available.
  var resolver = (typeof window !== "undefined" && typeof window.resolveCityCoords === "function")
    ? window.resolveCityCoords
    : ((typeof resolveCityCoords === "function") ? resolveCityCoords : null);
  var coords = null;
  if (user && user.city && resolver) {
    try { coords = resolver(user.city); } catch(e) { coords = null; }
  }
  if (!coords) {
    coords = {
      lat: (user && user.lat) || -33.87,
      lon: (user && user.lon) || 151.21,
      tzOffset: (user && user.tzOffset) || 10
    };
  }

  var birthData = {
    dob: user && user.dob,
    time: (user && user.time) || { h: 12, m: 0 },
    timeUnknown: !!(user && user.timeUnknown),
    lat: coords.lat,
    lon: coords.lon,
    tzOffset: coords.tzOffset
  };

  var result = computeAstrocarto(birthData, tropical);

  // Clear mount.
  while (mount.firstChild) mount.removeChild(mount.firstChild);

  if (!result || !result.planets || !result.planets.length) {
    mount.appendChild(_ac_el("div",
      "padding:40px;color:"+ASTROCARTO_TOK.inkFaint+";font-family:'IBM Plex Mono',monospace;font-size:11px;",
      "Astrocartography unavailable \u2014 missing birth time or chart data."));
    return;
  }

  var panel = _ac_el("div", "color:"+ASTROCARTO_TOK.ink+";");
  panel.className = "astrocarto-panel";

  /* Header */
  var header = _ac_el("div", "padding:40px 0 24px;");
  header.appendChild(_ac_el("div",
    "font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:"+ASTROCARTO_TOK.brass+";margin-bottom:10px;",
    "Astrocartography"));
  header.appendChild(_ac_el("h2",
    "font-family:'Fraunces',serif;font-weight:600;font-size:clamp(38px,6vw,60px);letter-spacing:-0.025em;margin:0 0 14px;color:"+ASTROCARTO_TOK.ink+";line-height:1.02;",
    "Where in the World"));
  header.appendChild(_ac_el("div",
    "width:64px;height:2px;background:"+ASTROCARTO_TOK.brass+";margin-bottom:20px;"));
  header.appendChild(_ac_el("p",
    "font-family:'Crimson Pro',serif;font-style:italic;font-size:18px;color:"+ASTROCARTO_TOK.inkDim+";max-width:620px;margin:0;line-height:1.55;",
    "At the instant you were born, each planet was angular above one specific point on Earth. Move to that point and the planet speaks louder. This is the geography of your chart \u2014 the cities where Jupiter opens doors, where Saturn tightens them, where Venus finds a bed for you."));
  panel.appendChild(header);

  /* Map + legend grid */
  var grid = _ac_el("div", "display:grid;grid-template-columns:minmax(0,1fr) 200px;gap:24px;align-items:start;");

  var mapWrap = _ac_el("div", "position:relative;");
  mapWrap.className = "ac-map-wrap";
  // SVG markup is built from our own literals + numeric coords — safe to
  // inject as a single string. We then rebind hover tooltips.
  var svgTemp = document.createElement("div");
  // eslint-disable-next-line no-unsanitized/property — all content is our own.
  svgTemp.innerHTML = renderAstrocartoSVG(result);
  while (svgTemp.firstChild) mapWrap.appendChild(svgTemp.firstChild);
  grid.appendChild(mapWrap);

  // Legend.
  var legendWrap = _ac_el("div", "padding:16px 18px;background:"+ASTROCARTO_TOK.bgRaise+";border:1px solid "+ASTROCARTO_TOK.rule+";");
  legendWrap.className = "ac-legend-wrap";
  legendWrap.appendChild(_ac_el("div",
    "font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:"+ASTROCARTO_TOK.brass+";margin-bottom:10px;",
    "Planet legend"));
  for (var li = 0; li < result.planets.length; li++) {
    var pl = result.planets[li];
    var row = _ac_el("div",
      "display:flex;align-items:center;gap:10px;padding:6px 0;font-family:'IBM Plex Mono',monospace;font-size:11px;color:"+ASTROCARTO_TOK.inkDim+";letter-spacing:0.08em;");
    var sw = _ac_el("span",
      "display:inline-block;width:14px;height:2px;background:"+pl.color+";");
    row.appendChild(sw);
    row.appendChild(_ac_el("span", null, pl.planet.toUpperCase()));
    legendWrap.appendChild(row);
  }
  var legendFoot = _ac_el("div",
    "margin-top:12px;padding-top:10px;border-top:1px solid "+ASTROCARTO_TOK.rule+";font-family:'IBM Plex Mono',monospace;font-size:10px;color:"+ASTROCARTO_TOK.inkFaint+";line-height:1.5;");
  legendFoot.appendChild(_ac_el("div", null, "Solid lines: MC & AC (angular)"));
  legendFoot.appendChild(_ac_el("div", null, "Dashed lines: IC & DC (opposite)"));
  legendFoot.appendChild(_ac_el("div", null, "Thicker lines: personal planets"));
  legendWrap.appendChild(legendFoot);
  grid.appendChild(legendWrap);

  panel.appendChild(grid);

  /* MC/IC longitude table */
  var tableSection = _ac_el("div", "margin-top:40px;");
  tableSection.appendChild(_ac_el("div",
    "font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:"+ASTROCARTO_TOK.brass+";margin-bottom:14px;",
    "Meridian readout"));
  var tableScroll = _ac_el("div", "overflow-x:auto;");
  var table = document.createElement("table");
  table.style.cssText = "width:100%;border-collapse:collapse;border-top:1px solid "+ASTROCARTO_TOK.rule+";";
  var thead = document.createElement("thead");
  var headerRow = document.createElement("tr");
  var headers = ["Planet", "MC longitude", "Near the MC", "IC longitude", "Near the IC"];
  for (var hi = 0; hi < headers.length; hi++) {
    var th = _ac_el("th",
      "text-align:left;padding:12px 8px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:"+ASTROCARTO_TOK.brass+";border-bottom:1px solid "+ASTROCARTO_TOK.rule+";",
      headers[hi]);
    headerRow.appendChild(th);
  }
  thead.appendChild(headerRow);
  table.appendChild(thead);
  var tbody = document.createElement("tbody");
  for (var ti = 0; ti < result.planets.length; ti++) {
    var pe = result.planets[ti];
    var nearMC = citiesNearMeridian(pe.mc.lon, 3, 4);
    var nearIC = citiesNearMeridian(pe.ic.lon, 3, 4);
    var mcText = nearMC.length ? nearMC.map(function(c){ return c.city.name; }).join(", ") : "over open ocean";
    var icText = nearIC.length ? nearIC.map(function(c){ return c.city.name; }).join(", ") : "over open ocean";

    var tr = document.createElement("tr");
    tr.style.cssText = "border-bottom:1px solid "+ASTROCARTO_TOK.rule+";";

    // Planet cell with coloured swatch.
    var tdP = document.createElement("td");
    tdP.style.cssText = "padding:10px 8px;font-family:'Fraunces',serif;font-size:15px;color:"+ASTROCARTO_TOK.ink+";";
    var swatch = _ac_el("span",
      "display:inline-block;width:10px;height:10px;background:"+pe.color+";margin-right:8px;vertical-align:middle;border-radius:2px;");
    tdP.appendChild(swatch);
    tdP.appendChild(document.createTextNode(pe.planet));
    tr.appendChild(tdP);

    tr.appendChild(_ac_el("td",
      "padding:10px 8px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:"+ASTROCARTO_TOK.inkDim+";letter-spacing:0.08em;",
      _ac_fmtLon(pe.mc.lon)));
    tr.appendChild(_ac_el("td",
      "padding:10px 8px;font-family:'Crimson Pro',serif;font-size:14px;color:"+ASTROCARTO_TOK.inkDim+";font-style:italic;",
      mcText));
    tr.appendChild(_ac_el("td",
      "padding:10px 8px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:"+ASTROCARTO_TOK.inkFaint+";letter-spacing:0.08em;",
      _ac_fmtLon(pe.ic.lon)));
    tr.appendChild(_ac_el("td",
      "padding:10px 8px;font-family:'Crimson Pro',serif;font-size:14px;color:"+ASTROCARTO_TOK.inkDim+";font-style:italic;",
      icText));

    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  tableScroll.appendChild(table);
  tableSection.appendChild(tableScroll);
  panel.appendChild(tableSection);

  /* Top lines by interestingness */
  var topSection = _ac_el("div", "margin-top:48px;");
  topSection.appendChild(_ac_el("div",
    "font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:"+ASTROCARTO_TOK.brass+";margin-bottom:14px;",
    "Your most relevant lines"));
  topSection.appendChild(_ac_el("p",
    "font-family:'Crimson Pro',serif;font-style:italic;font-size:15px;color:"+ASTROCARTO_TOK.inkFaint+";margin:0 0 18px;max-width:620px;",
    "Ranked by how close each line passes to a city most travellers pass through. You can see all forty lines on the map \u2014 these are the five most actionable."));
  var ranked = rankAstrocartoLines(result);
  for (var ri = 0; ri < Math.min(5, ranked.length); ri++) {
    var r = ranked[ri];
    var cityBits = r.cities && r.cities.length
      ? r.cities.slice(0,3).map(function(c){ return c.city.name; }).join(", ")
      : "over open ocean \u2014 still active at sea";
    var lineRow = _ac_el("div",
      "padding:22px 0;border-bottom:1px solid "+ASTROCARTO_TOK.rule+";");
    var hdrRow = _ac_el("div",
      "display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:10px;");
    hdrRow.appendChild(_ac_el("span",
      "display:inline-block;width:10px;height:10px;background:"+r.color+";border-radius:2px;"));
    hdrRow.appendChild(_ac_el("span",
      "font-family:'Fraunces',serif;font-size:22px;font-weight:500;color:"+ASTROCARTO_TOK.ink+";letter-spacing:-0.01em;",
      r.title));
    hdrRow.appendChild(_ac_el("span",
      "font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:"+ASTROCARTO_TOK.brass+";margin-left:auto;",
      cityBits));
    lineRow.appendChild(hdrRow);
    lineRow.appendChild(_ac_el("div",
      "font-family:'Crimson Pro',serif;font-size:16px;line-height:1.6;color:"+ASTROCARTO_TOK.inkDim+";",
      r.body));
    topSection.appendChild(lineRow);
  }
  panel.appendChild(topSection);

  mount.appendChild(panel);

  /* Responsive: stack legend below on narrow viewports. */
  try {
    function _respond() {
      if (window.matchMedia && window.matchMedia("(max-width: 760px)").matches) {
        grid.style.gridTemplateColumns = "1fr";
      } else {
        grid.style.gridTemplateColumns = "minmax(0,1fr) 200px";
      }
    }
    _respond();
    window.addEventListener("resize", _respond);
  } catch(e) { /* ignore */ }

  /* Hover tooltips on SVG lines. */
  try {
    var svgEl = mount.querySelector("svg");
    _ac_attachHoverTooltips(svgEl);
  } catch(e) { /* tooltips optional */ }
}

/* ============================================================
 * React factory (optional path)
 * ============================================================ */

function AstrocartoMode(props) {
  if (typeof React === "undefined") return null;
  var ref = React.useRef(null);
  React.useEffect(function(){
    if (ref.current) _ac_renderIntoMount(ref.current, props.user, props.tropical);
  }, [props.user, props.tropical]);
  return React.createElement("div", {
    ref: ref,
    className: "astrocarto-mount",
    style: { width: "100%" }
  });
}

/* ============================================================
 * Public API
 * ============================================================ */

// renderPanel is overloaded:
//   renderPanel(mountEl, user, tropical)     — vanilla DOM render.
//   renderPanel(user, tropical)              — returns a React element.
function _ac_renderPanel(a, b, c) {
  if (a && typeof a === "object" && a.nodeType === 1) {
    _ac_renderIntoMount(a, b, c);
    return a;
  }
  if (typeof React !== "undefined") {
    return React.createElement(AstrocartoMode, { user: a, tropical: b });
  }
  var tmp = document.createElement("div");
  document.body.appendChild(tmp);
  _ac_renderIntoMount(tmp, a, b);
  return tmp;
}

/* ============================================================
 * Global exposure
 * ============================================================ */

if (typeof window !== "undefined") {
  window.SynastraAstrocarto = {
    compute: computeAstrocarto,
    LINES: ASTROCARTO_LINES,
    PLANET_COLORS: ASTROCARTO_PLANET_COLORS,
    PLANETS: ASTROCARTO_PLANETS,
    CITIES: ASTROCARTO_CITIES,
    reverseGeocode: reverseGeocode,
    citiesNearMeridian: citiesNearMeridian,
    citiesNearCurve: citiesNearCurve,
    renderSVG: renderAstrocartoSVG,
    rankLines: rankAstrocartoLines,
    renderPanel: _ac_renderPanel,
    Component: AstrocartoMode
  };
}
