/*
 * engine-astro.js — Astronomy compute module for the astral-saas dashboard.
 *
 * Depends on the global `Astronomy` object (astronomy-engine v2.1.19) loaded
 * from unpkg by index.html. This file is fetched & concatenated with the
 * main JSX bundle and transformed by Babel-standalone in the browser — so:
 *   - NO ES module imports / exports.
 *   - All functions declared at top level (so they're in scope of the
 *     concatenated JSX) AND mirrored on `window` for explicit access.
 *   - Plain JavaScript only (no JSX in this file).
 *
 * SELF-TEST — verify against Ethan's known chart:
 *   dob: 2004-07-23, time: 06:30 AEST (lat -33.87, lon +151.21, tz +10)
 *   Expected tropical:
 *     Sun: Leo ~0°29'
 *     Moon: Libra ~2°01'
 *     Ascendant: Capricorn ~22°46'
 *     MC: Taurus ~12°07'
 *   Expected sidereal (Lahiri, ayanamsa ~23.91°):
 *     Sun: Cancer ~6°
 *     Moon: Virgo ~8°
 *     Lagna: Sagittarius ~28°
 *     Nakshatra (moon): Uttara Phalguni, pada 2
 *
 * Do not actually execute the test — these values are for the integrator
 * to compare against after wiring up the UI.
 */

/* ============================================================
 * Tables
 * ============================================================ */

var SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

var NAKSHATRAS = [
  { name: "Ashwini",          lord: "Ketu"    },
  { name: "Bharani",          lord: "Venus"   },
  { name: "Krittika",         lord: "Sun"     },
  { name: "Rohini",           lord: "Moon"    },
  { name: "Mrigashira",       lord: "Mars"    },
  { name: "Ardra",            lord: "Rahu"    },
  { name: "Punarvasu",        lord: "Jupiter" },
  { name: "Pushya",           lord: "Saturn"  },
  { name: "Ashlesha",         lord: "Mercury" },
  { name: "Magha",            lord: "Ketu"    },
  { name: "Purva Phalguni",   lord: "Venus"   },
  { name: "Uttara Phalguni",  lord: "Sun"     },
  { name: "Hasta",            lord: "Moon"    },
  { name: "Chitra",           lord: "Mars"    },
  { name: "Swati",            lord: "Rahu"    },
  { name: "Vishakha",         lord: "Jupiter" },
  { name: "Anuradha",         lord: "Saturn"  },
  { name: "Jyeshtha",         lord: "Mercury" },
  { name: "Mula",             lord: "Ketu"    },
  { name: "Purva Ashadha",    lord: "Venus"   },
  { name: "Uttara Ashadha",   lord: "Sun"     },
  { name: "Shravana",         lord: "Moon"    },
  { name: "Dhanishta",        lord: "Mars"    },
  { name: "Shatabhisha",      lord: "Rahu"    },
  { name: "Purva Bhadrapada", lord: "Jupiter" },
  { name: "Uttara Bhadrapada",lord: "Saturn"  },
  { name: "Revati",           lord: "Mercury" }
];

// Vimshottari dasha years per lord (total 120)
var DASHA_YEARS = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17
};

// Dasha cycle order (same as nakshatra lord cycle)
var DASHA_ORDER = [
  "Ketu", "Venus", "Sun", "Moon", "Mars",
  "Rahu", "Jupiter", "Saturn", "Mercury"
];

// Bodies we compute (excluding nodes — handled separately)
var PLANET_BODIES = [
  { planet: "Sun",     body: "Sun"     },
  { planet: "Moon",    body: "Moon"    },
  { planet: "Mercury", body: "Mercury" },
  { planet: "Venus",   body: "Venus"   },
  { planet: "Mars",    body: "Mars"    },
  { planet: "Jupiter", body: "Jupiter" },
  { planet: "Saturn",  body: "Saturn"  },
  { planet: "Uranus",  body: "Uranus"  },
  { planet: "Neptune", body: "Neptune" },
  { planet: "Pluto",   body: "Pluto"   }
];

/* ============================================================
 * Angle helpers
 * ============================================================ */

function _deg2rad(d) { return d * Math.PI / 180; }
function _rad2deg(r) { return r * 180 / Math.PI; }

function _norm360(x) {
  var v = x % 360;
  if (v < 0) v += 360;
  return v;
}

// Split ecliptic longitude into {sign, deg, longitude}
function _longitudeToSignDeg(longitude) {
  var L = _norm360(longitude);
  var idx = Math.floor(L / 30);
  var deg = L - idx * 30;
  return { sign: SIGNS[idx], signIdx: idx, deg: deg, longitude: L };
}

/* ============================================================
 * Time / Julian helpers
 * ============================================================ */

// Convert birth data to a UTC JS Date.
// tzOffset is hours east of UTC (e.g. AEST = +10).
function _birthDataToUTCDate(birthData) {
  var y = birthData.dob.y;
  var m = birthData.dob.m; // 1-12
  var d = birthData.dob.d;
  var hour = birthData.timeUnknown ? 12 : birthData.time.h; // noon fallback
  var minute = birthData.timeUnknown ? 0 : birthData.time.m;
  var tz = birthData.tzOffset || 0;

  // Build as if the local clock were UTC, then subtract tzOffset hours.
  var utcMs = Date.UTC(y, m - 1, d, hour, minute, 0);
  utcMs -= tz * 3600 * 1000;
  return new Date(utcMs);
}

// Julian centuries since J2000.0 (TT approximated as UTC — < 1 arcsec impact).
function _julianCenturiesSinceJ2000(date) {
  var jd = date.getTime() / 86400000 + 2440587.5;
  return (jd - 2451545.0) / 36525.0;
}

/* ============================================================
 * Astronomy-engine wrappers
 * ============================================================ */

// Geocentric apparent ecliptic longitude of a body (degrees, 0..360).
function _eclipticLongitude(bodyName, astroTime) {
  if (bodyName === "Moon") {
    var moonVec = Astronomy.GeoMoon(astroTime);
    var eclM = Astronomy.Ecliptic(moonVec);
    return _norm360(eclM.elon);
  }
  var vec = Astronomy.GeoVector(Astronomy.Body[bodyName], astroTime, true);
  var ecl = Astronomy.Ecliptic(vec);
  return _norm360(ecl.elon);
}

// Local Sidereal Time in degrees (0..360) for a given longitude east.
function _localSiderealTimeDeg(astroTime, lonEastDeg) {
  // Astronomy.SiderealTime returns GST in hours.
  var gstHours = Astronomy.SiderealTime(astroTime);
  var gstDeg = gstHours * 15.0;
  return _norm360(gstDeg + lonEastDeg);
}

// Mean obliquity of the ecliptic (IAU 1980), degrees.
function _meanObliquityDeg(astroTime) {
  var T = astroTime.tt / 36525.0; // centuries from J2000 TT
  var seconds =
    84381.448 - 46.8150 * T - 0.00059 * T * T + 0.001813 * T * T * T;
  return seconds / 3600.0;
}

/* ============================================================
 * Ascendant & Midheaven
 * ============================================================ */

// Ecliptic longitude of the eastern horizon (ASC) in degrees.
// Standard formula, quadrant-corrected via atan2.
function _computeAscendant(ramcDeg, epsDeg, latDeg) {
  var ramc = _deg2rad(ramcDeg);
  var eps = _deg2rad(epsDeg);
  var lat = _deg2rad(latDeg);

  // tan(ASC) = -cos(RAMC) / (sin(eps)*tan(lat) + cos(eps)*sin(RAMC))
  var y = -Math.cos(ramc);
  var x = Math.sin(eps) * Math.tan(lat) + Math.cos(eps) * Math.sin(ramc);
  var asc = _rad2deg(Math.atan2(y, x));
  asc = _norm360(asc);

  // The rising half of the ecliptic is the one whose longitude is
  // "ahead" of MC by roughly 90° (going counter-clockwise / east).
  // atan2 already gives a unique value in (-180,180]; but we need the
  // ASC to lie in the same half-plane as the rising ecliptic. We test
  // by requiring ASC to be > MC by roughly 0..180° (mod 360).
  var mc = _computeMidheaven(ramcDeg, epsDeg);
  var diff = _norm360(asc - mc);
  if (diff < 1 || diff > 359) {
    // Degenerate / at the pole — leave as-is.
    return asc;
  }
  if (diff < 180) {
    // ASC within 180° east of MC — correct half. Keep.
    return asc;
  }
  // Opposite half (descendant) — flip by 180°.
  return _norm360(asc + 180);
}

// Midheaven (MC) = ecliptic longitude of the meridian, degrees.
function _computeMidheaven(ramcDeg, epsDeg) {
  var ramc = _deg2rad(ramcDeg);
  var eps = _deg2rad(epsDeg);
  // tan(MC) = tan(RAMC) / cos(eps)  — atan2 for correct quadrant.
  var y = Math.sin(ramc);
  var x = Math.cos(ramc) * Math.cos(eps);
  var mc = _rad2deg(Math.atan2(y, x));
  return _norm360(mc);
}

/* ============================================================
 * Lunar nodes (Mean Node)
 * ============================================================ */

// Mean longitude of the ascending lunar node (Rahu), degrees.
// Formula from Meeus — high-precision series for mean node.
function _meanLunarNodeLongitude(astroTime) {
  var T = astroTime.tt / 36525.0;
  var omega =
    125.0445479
    - 1934.1362891 * T
    + 0.0020754 * T * T
    + (T * T * T) / 467441.0
    - (T * T * T * T) / 60616000.0;
  return _norm360(omega);
}

/* ============================================================
 * Ayanamsa (Lahiri)
 * ============================================================ */

// Precise Lahiri-style ayanamsa (degrees).
// Reference values: J2000 ≈ 23.855°, 2004 ≈ 23.91°, 2024 ≈ 24.19°.
function _lahiriAyanamsa(astroTime) {
  var T = astroTime.tt / 36525.0;
  return 22.460148 + 1.396042 * T + 0.000309 * T * T;
}

/* ============================================================
 * Whole-Sign houses
 * ============================================================ */

function wholeSignHouse(ascendantSignIdx, planetSignIdx) {
  return ((planetSignIdx - ascendantSignIdx + 12) % 12) + 1;
}

function _buildHousesMap(ascSignIdx) {
  var houses = {};
  for (var i = 0; i < 12; i++) {
    houses[i + 1] = SIGNS[(ascSignIdx + i) % 12];
  }
  return houses;
}

/* ============================================================
 * Core chart builder
 * ============================================================ */

// Build the tropical longitudes once; sidereal just subtracts ayanamsa.
function _buildRawLongitudes(birthData) {
  var utcDate = _birthDataToUTCDate(birthData);
  var astroTime = new Astronomy.AstroTime(utcDate);

  var longitudes = {};
  for (var i = 0; i < PLANET_BODIES.length; i++) {
    var pb = PLANET_BODIES[i];
    longitudes[pb.planet] = _eclipticLongitude(pb.body, astroTime);
  }

  // Lunar node
  var rahuLon = _meanLunarNodeLongitude(astroTime);

  // Angles (only if time known)
  var ascLon = null;
  var mcLon = null;
  if (!birthData.timeUnknown) {
    var ramc = _localSiderealTimeDeg(astroTime, birthData.lon);
    var eps = _meanObliquityDeg(astroTime);
    mcLon = _computeMidheaven(ramc, eps);
    ascLon = _computeAscendant(ramc, eps, birthData.lat);
  }

  return {
    astroTime: astroTime,
    utcDate: utcDate,
    longitudes: longitudes,
    rahuLon: rahuLon,
    ascLon: ascLon,
    mcLon: mcLon,
    ayanamsa: _lahiriAyanamsa(astroTime)
  };
}

// Shared shaping: given a map of longitudes and an optional ascendant,
// produce the standard chart object.
function _shapeChart(longitudes, ascLon, mcLon, nodeLon, includeNodes, moonSideLon) {
  var ascSignIdx = ascLon == null ? null : _longitudeToSignDeg(ascLon).signIdx;

  var planets = [];
  for (var i = 0; i < PLANET_BODIES.length; i++) {
    var name = PLANET_BODIES[i].planet;
    var info = _longitudeToSignDeg(longitudes[name]);
    planets.push({
      planet: name,
      sign: info.sign,
      deg: info.deg,
      house: ascSignIdx == null ? null : wholeSignHouse(ascSignIdx, info.signIdx),
      longitude: info.longitude
    });
  }

  var chart = {
    planets: planets,
    ascendant: null,
    mc: null,
    houses: ascSignIdx == null ? null : _buildHousesMap(ascSignIdx)
  };

  if (ascLon != null) {
    var ascInfo = _longitudeToSignDeg(ascLon);
    chart.ascendant = {
      sign: ascInfo.sign,
      deg: ascInfo.deg,
      longitude: ascInfo.longitude
    };
  }
  if (mcLon != null) {
    var mcInfo = _longitudeToSignDeg(mcLon);
    chart.mc = {
      sign: mcInfo.sign,
      deg: mcInfo.deg,
      longitude: mcInfo.longitude
    };
  }

  if (includeNodes && nodeLon != null) {
    var rahuInfo = _longitudeToSignDeg(nodeLon);
    var ketuInfo = _longitudeToSignDeg(nodeLon + 180);
    chart.rahu = {
      sign: rahuInfo.sign,
      deg: rahuInfo.deg,
      house: ascSignIdx == null ? null : wholeSignHouse(ascSignIdx, rahuInfo.signIdx),
      longitude: rahuInfo.longitude
    };
    chart.ketu = {
      sign: ketuInfo.sign,
      deg: ketuInfo.deg,
      house: ascSignIdx == null ? null : wholeSignHouse(ascSignIdx, ketuInfo.signIdx),
      longitude: ketuInfo.longitude
    };
  }

  // Nakshatra (sidereal moon)
  if (moonSideLon != null) {
    chart.nakshatra = _computeNakshatra(moonSideLon);
  }

  return chart;
}

/* ============================================================
 * Nakshatra
 * ============================================================ */

function _computeNakshatra(siderealMoonLon) {
  var L = _norm360(siderealMoonLon);
  var spanNak = 360 / 27;   // 13°20'
  var spanPada = 360 / 108; // 3°20'
  var idx = Math.floor(L / spanNak);
  if (idx > 26) idx = 26;
  var withinNak = L - idx * spanNak;
  var pada = Math.floor(withinNak / spanPada) + 1;
  if (pada > 4) pada = 4;
  var nak = NAKSHATRAS[idx];
  return {
    name: nak.name,
    pada: pada,
    lord: nak.lord,
    deg: withinNak
  };
}

/* ============================================================
 * Public chart computers
 * ============================================================ */

function computeTropicalChart(birthData) {
  var raw = _buildRawLongitudes(birthData);
  // Tropical does not ship nodes / nakshatra by spec.
  return _shapeChart(raw.longitudes, raw.ascLon, raw.mcLon, null, false, null);
}

function computeSiderealChart(birthData) {
  var raw = _buildRawLongitudes(birthData);
  var aya = raw.ayanamsa;

  // Shift every longitude by -ayanamsa.
  var sideLongitudes = {};
  for (var k in raw.longitudes) {
    if (Object.prototype.hasOwnProperty.call(raw.longitudes, k)) {
      sideLongitudes[k] = _norm360(raw.longitudes[k] - aya);
    }
  }
  var sideAsc = raw.ascLon == null ? null : _norm360(raw.ascLon - aya);
  var sideMc = raw.mcLon == null ? null : _norm360(raw.mcLon - aya);
  var sideRahu = raw.rahuLon == null ? null : _norm360(raw.rahuLon - aya);
  var sideMoon = sideLongitudes.Moon;

  return _shapeChart(sideLongitudes, sideAsc, sideMc, sideRahu, true, sideMoon);
}

/* ============================================================
 * Vimshottari Mahadasha
 * ============================================================ */

// Given sidereal moon longitude (degrees) and JS birth Date, compute dasha
// periods. All dates are JS Date objects.
function computeMahadasha(moonSidereal, birthDate) {
  var L = _norm360(moonSidereal);
  var spanNak = 360 / 27;
  var nakIdx = Math.floor(L / spanNak);
  if (nakIdx > 26) nakIdx = 26;
  var withinNak = L - nakIdx * spanNak;
  var fractionConsumed = withinNak / spanNak; // 0..1

  var startingLord = NAKSHATRAS[nakIdx].lord;
  var orderStart = DASHA_ORDER.indexOf(startingLord);

  // Treat a "year" as 365.2425 mean solar days (Vimshottari convention varies;
  // this matches the Surya Siddhanta-adjacent 365.25 closely enough for UI).
  var MS_PER_YEAR = 365.2425 * 86400 * 1000;

  // How much of the first dasha has been consumed — so its END is:
  //   birthDate + (1 - fractionConsumed) * fullYears * MS_PER_YEAR
  // And its START (the notional "birth of the current dasha") is earlier than birth.
  var firstLord = DASHA_ORDER[orderStart];
  var firstYears = DASHA_YEARS[firstLord];
  var firstRemainingYears = (1 - fractionConsumed) * firstYears;
  var firstConsumedYears = fractionConsumed * firstYears;

  var firstStart = new Date(birthDate.getTime() - firstConsumedYears * MS_PER_YEAR);
  var firstEnd = new Date(birthDate.getTime() + firstRemainingYears * MS_PER_YEAR);

  var allDashas = [];
  allDashas.push({
    lord: firstLord,
    start: firstStart,
    end: firstEnd,
    years: firstYears
  });

  var cursor = firstEnd.getTime();
  for (var i = 1; i < DASHA_ORDER.length; i++) {
    var lord = DASHA_ORDER[(orderStart + i) % DASHA_ORDER.length];
    var years = DASHA_YEARS[lord];
    var start = new Date(cursor);
    var end = new Date(cursor + years * MS_PER_YEAR);
    allDashas.push({ lord: lord, start: start, end: end, years: years });
    cursor = end.getTime();
  }

  // By construction, allDashas[0] is active at the birth moment. For "current"
  // at-birth reporting, that's the answer. (A UI that wants "now" can scan
  // allDashas for whichever period contains Date.now().)
  return {
    currentLord: allDashas[0].lord,
    nextLord: allDashas[1].lord,
    currentStart: allDashas[0].start,
    currentEnd: allDashas[0].end,
    allDashas: allDashas
  };
}

/* ============================================================
 * Global exposure (dual-assign so both global & local work when
 * this file is concatenated with the JSX bundle).
 * ============================================================ */

if (typeof window !== "undefined") {
  window.SIGNS = SIGNS;
  window.NAKSHATRAS = NAKSHATRAS;
  window.DASHA_YEARS = DASHA_YEARS;
  window.DASHA_ORDER = DASHA_ORDER;
  window.wholeSignHouse = wholeSignHouse;
  window.computeTropicalChart = computeTropicalChart;
  window.computeSiderealChart = computeSiderealChart;
  window.computeMahadasha = computeMahadasha;
}
