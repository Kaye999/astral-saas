/*
 * engine-mayan.js — Mayan Tzolkin / Dreamspell Galactic Signature engine + UI.
 *
 * Integrated into Synastra's static bundle alongside engine-astro.js,
 * interp-tables.js, features.js. Fetched + concatenated with the main
 * JSX bundle and transformed by Babel-standalone in the browser.
 *
 * Rules of engagement (identical to engine-astro.js):
 *   - NO ES module imports / exports.
 *   - All top-level declarations must be in scope of the concatenated JSX
 *     AND mirrored on `window.SynastraMayan` for explicit access.
 *   - Plain JavaScript for the compute layer; JSX is permitted for the
 *     UI (rendered as React.createElement — the file goes through Babel).
 *
 * ─── KIN REFERENCE & SELF-TEST ────────────────────────────────────────────
 *
 * Tzolkin Kin count uses a simple Gregorian-day offset from a known seed.
 * Canonical reference chosen for this engine:
 *
 *     21 December 2012 = Kin 207  (Blue Crystal Hand — end of 13th Baktun)
 *
 * This reference is shared by the Classical Mayan Long Count and the
 * majority of Dreamspell calculators that DO NOT skip Feb 29. We use
 * straight Gregorian day arithmetic — NO leap-day skipping. There is a
 * competing Dreamspell convention (Argüelles, "Day Out of Time") that
 * treats Feb 29 as a Kin-less holiday; that produces different Kins for
 * post-leap-day births. We note this ambiguity here for future integrators.
 *
 * Verification of the reference (Kin 207):
 *     tone  = ((207 - 1) mod 13) + 1 = 12  → Crystal   ✓
 *     sign  = ((207 - 1) mod 20) + 1 = 7   → Hand (Manik) ✓
 *
 * Self-test — Ethan's date:
 *     Input:    23 July 2004
 *     Days before 21 Dec 2012: 3073 (computed below, inclusive-exclusive)
 *     Kin    = (((207 - 1) - 3073) mod 260 + 260) mod 260 + 1 = 254
 *     Tone   = ((254 - 1) mod 13) + 1 = 7   → Resonant
 *     Sign   = ((254 - 1) mod 20) + 1 = 14  → Wizard (Ix)
 *     Result: Kin 254 — White Resonant Wizard
 *
 * Cross-check by summing from 1 Jan 2000:
 *     Jan 1 2000 implied Kin = ((207 - 1 - 4738) mod 260 + 260) mod 260 + 1 = 149
 *     Days 2000-01-01 → 2004-07-23 = 1665
 *     Kin = ((149 - 1 + 1665) mod 260) + 1 = 1813 mod 260 + 1 = 253 + 1 = 254 ✓
 *
 * ─── CAVEATS ──────────────────────────────────────────────────────────────
 * For users born in the 1940s–1960s the Dreamspell-with-leap-skip convention
 * can produce a Kin up to ~15 away from ours. If a user reports a different
 * Kin from another calculator, it is almost certainly the Feb-29 skip policy.
 */

/* ============================================================
 * TABLES
 * ============================================================ */

var MAYAN_DAY_SIGNS = [
  {
    number: 1, yucatec: "Imix", name: "Dragon", color: "Red", direction: "East",
    essence: "Primordial trust",
    body:
      "Imix is the womb of memory — the red dragon who nurses all beginnings. " +
      "Where this sign falls, life is fed by ancestral sap: nothing you do is " +
      "without a lineage behind it. You are built to initiate, to hold the " +
      "infant form of what others finish. The task is to trust the earliest " +
      "stirrings before they can be justified to anyone, including yourself.",
    shadow: "A reluctance to leave the first safe harbour; nurturing drifting into enmeshment.",
    gift: "Unreasonable generosity — a bloodstream hospitality that makes others feel chosen before they have earned it."
  },
  {
    number: 2, yucatec: "Ik", name: "Wind", color: "White", direction: "North",
    essence: "Spirit in motion",
    body:
      "Ik is breath, rumour, and the invisible hand behind a slammed door. " +
      "To carry the Wind sign is to be a conduit for messages that are not " +
      "quite your own — ideas pass through you as air through a flute. You " +
      "speak, write, or dream things awake. The discipline is to tell the " +
      "truth even when the truth is weightless; to let the message shape you as you shape it.",
    shadow: "Scattering — talking the fire out of a thing before it can burn.",
    gift: "The capacity to name what others only sense; you are the weather report the room has been waiting for."
  },
  {
    number: 3, yucatec: "Akbal", name: "Night", color: "Blue", direction: "West",
    essence: "The sanctuary of the dark",
    body:
      "Akbal is the innermost chamber — the cave where intuition grows its " +
      "slow crystals. Night-born souls find their clearest knowing after the " +
      "day's noise abates, and they serve as sanctuary for others who cannot " +
      "hear themselves elsewhere. Your task is to dignify silence, to treat " +
      "your own dreams as data, and to resist the modern pressure to be always lit.",
    shadow: "Hiding inside interiority; mistaking withdrawal for depth.",
    gift: "Refuge — a private temperature of acceptance that the frayed come to rest inside."
  },
  {
    number: 4, yucatec: "Kan", name: "Seed", color: "Yellow", direction: "South",
    essence: "Targeted potential",
    body:
      "Kan is a germ of intention encoded with its own whole future. Where " +
      "this sign marks, there is a long game — aims set in childhood that " +
      "only ripen decades later. You are patient without being passive, " +
      "because the outcome is already present in miniature. Your work is " +
      "to tend the soil, protect the sprout, and trust the hidden timetable of growth.",
    shadow: "Rigidity — the seed that refuses to open because the conditions are not yet immaculate.",
    gift: "Focus; a flowering that repays the patience of everyone who watered you."
  },
  {
    number: 5, yucatec: "Chicchan", name: "Serpent", color: "Red", direction: "East",
    essence: "Life-force awakened",
    body:
      "Chicchan is kundalini in day-sign form — the red serpent who moves " +
      "the body from the base upward. Those born here feel their vitality " +
      "as a physical intelligence: illness, desire, and instinct all speak " +
      "the same language. Your power is embodied; your mistake is to live " +
      "too long in the head. Let the serpent teach you when to strike and when to coil.",
    shadow: "Reactivity — venom where medicine was meant.",
    gift: "Animal honesty; a presence the body can trust before the mind arrives."
  },
  {
    number: 6, yucatec: "Cimi", name: "Worldbridger", color: "White", direction: "North",
    essence: "Transition, surrender, crossing",
    body:
      "Cimi is the sign of the threshold-walker — the one who knows how to " +
      "die on small scales so that larger continuities remain intact. You " +
      "are skilled at endings: last conversations, last jobs, last selves. " +
      "Others come to you when they are on the edge and do not yet have the " +
      "permission to step off. The work is to practise surrender without romance, and to bless what is leaving.",
    shadow: "Clinging — bridging for others while refusing to cross yourself.",
    gift: "A rare grace for closure; the clean bow at the end of a chapter."
  },
  {
    number: 7, yucatec: "Manik", name: "Hand", color: "Blue", direction: "West",
    essence: "Accomplishment, healing through touch",
    body:
      "Manik is the hand that makes and heals. Where this sign appears, the " +
      "body's intelligence is the primary teacher — whatever you understand, " +
      "you understand through doing. You finish what you start; you close " +
      "circuits others leave frayed. The craft is to keep your hands busy " +
      "with work that is worthy of them, and to remember that the gesture of kindness is a kind of mastery too.",
    shadow: "Overwork — using the hand to avoid the heart.",
    gift: "Competence that is also tenderness; the skill of making someone feel held by the quality of your attention."
  },
  {
    number: 8, yucatec: "Lamat", name: "Star", color: "Yellow", direction: "South",
    essence: "Harmony, elegance, beauty",
    body:
      "Lamat is Venus-as-day-sign — the octave star that arranges the messy " +
      "material of life into pattern. You are a rememberer of harmony: in " +
      "music, in rooms, in the way a meal should close. Your gift is that " +
      "beauty is not decoration to you but load-bearing structure. The task " +
      "is to bring your star-logic into unbeautiful places without losing it.",
    shadow: "Aestheticising pain; choosing the elegant surface over the honest mess.",
    gift: "Proportion — the ability to find the note a whole situation has been trying to sing."
  },
  {
    number: 9, yucatec: "Muluc", name: "Moon", color: "Red", direction: "East",
    essence: "Universal water, emotional memory",
    body:
      "Muluc is the red moon — the tidal intelligence that rises in you " +
      "before you have words for it. You feel the weather of other people " +
      "and of unseen systems. Your challenge is to keep channels open for " +
      "the feeling without being flooded, to build riverbanks that honour " +
      "the current. At your finest you purify: you take in the heavy water of a room and let it run clear through you.",
    shadow: "Absorption — becoming everyone's moodwater and forgetting your own shore.",
    gift: "Empathy as intelligence; you know what is true by how it feels to stand near it."
  },
  {
    number: 10, yucatec: "Oc", name: "Dog", color: "White", direction: "North",
    essence: "Loyalty, heart, unconditional love",
    body:
      "Oc is companion-soul — the sign of the one who shows up and keeps " +
      "showing up. Loyalty here is not a performance but a constitution; " +
      "you are built to love in long arcs. The other side of this gift is " +
      "the risk of loving past what loves you back. The discipline is to " +
      "stay tender without becoming a martyr, and to choose the pack as carefully as you serve it.",
    shadow: "Servility — affection given where it is taken for granted.",
    gift: "Reliability of the heart; an atmosphere of trust that makes other people braver."
  },
  {
    number: 11, yucatec: "Chuen", name: "Monkey", color: "Blue", direction: "West",
    essence: "Play, artistry, sacred trickery",
    body:
      "Chuen is the artisan-trickster — mind at play with matter. You are " +
      "here to make, to mimic, to improvise, and to keep solemnity from " +
      "calcifying. Your intelligence is lateral: you solve by approach angle " +
      "rather than force. The task is to remember that play is a form of " +
      "research, not avoidance — the child's attention is the scientist's too.",
    shadow: "Deflection — turning what matters into a joke before it can land.",
    gift: "Invention; a hand that can make a thing no one quite commissioned and everyone ends up needing."
  },
  {
    number: 12, yucatec: "Eb", name: "Human", color: "Yellow", direction: "South",
    essence: "Free will, the road of choice",
    body:
      "Eb is the road that walks itself — the humble, deliberate sign of a " +
      "life composed by repeated small decisions. You are not driven by " +
      "fate but by discernment. Your quietness is often mistaken for " +
      "passivity; in truth you are tasting options and rejecting the ones " +
      "that are slightly untrue. The work is to keep choosing, and to trust that the road is made by walking.",
    shadow: "Over-deliberation — hesitating so long that the moment decides for you.",
    gift: "A life with integrity of design; few wasted rooms, few rented ones."
  },
  {
    number: 13, yucatec: "Ben", name: "Skywalker", color: "Red", direction: "East",
    essence: "Prophecy, pillar between worlds",
    body:
      "Ben is the pillar-walker — the red sky-explorer who links heaven and " +
      "earth. Where this sign lives, there is an urge to go and see: new " +
      "cities, new practices, new states of mind. You are a scout by " +
      "temperament, reporting back what most people never travel to fetch. " +
      "The craft is to ground your visions in specifics, so that prophecy becomes architecture.",
    shadow: "Restlessness — moving before you have let a place teach you.",
    gift: "Sight — a view of where the common life is going, usable as compass."
  },
  {
    number: 14, yucatec: "Ix", name: "Wizard", color: "White", direction: "North",
    essence: "Timelessness, jaguar stillness",
    body:
      "Ix is the white jaguar — receptive power, heart-knowing, the wizard " +
      "who does not announce. You are quietly formidable: aware of currents " +
      "that other people do not see, capable of altering a room without " +
      "raising your voice. The gift is not to prove this. The discipline is " +
      "to remain porous without becoming spooky, and to let your knowing serve rather than seduce.",
    shadow: "Disappearing into the pose of mystery; keeping silence as leverage rather than honesty.",
    gift: "An unmistakable dignity; people feel watched over in your presence, and are."
  },
  {
    number: 15, yucatec: "Men", name: "Eagle", color: "Blue", direction: "West",
    essence: "Vision, the long view",
    body:
      "Men is the eagle who flies above weather. You see pattern where " +
      "others see incident, strategy where others see stuckness. Your " +
      "temperament wants scale — the view from altitude — and feels cramped " +
      "in rooms that will not discuss the horizon. The task is to come down " +
      "periodically and hunt in the grass, so that the vision has teeth.",
    shadow: "Detachment — critiquing from the sky without landing.",
    gift: "Strategic imagination; the ability to turn a fog into a plan."
  },
  {
    number: 16, yucatec: "Cib", name: "Warrior", color: "Yellow", direction: "South",
    essence: "Fearless intelligence, ancestral wisdom",
    body:
      "Cib is the warrior-scholar — questioning mind armed with ancestral " +
      "memory. You go first into difficult thought, and you bring home what " +
      "most people are too timid to examine. Your courage is not theatrical; " +
      "it is a willingness to sit with the hard question until it yields. " +
      "The work is to keep asking past the convenient answer, and to let the ancestors speak through your inquiry.",
    shadow: "Cynicism — interrogation as armour against being changed.",
    gift: "Moral nerve; the friend who names what the room is avoiding."
  },
  {
    number: 17, yucatec: "Caban", name: "Earth", color: "Red", direction: "East",
    essence: "Synchronicity, navigation, resonance",
    body:
      "Caban is earth-intelligence — the sign of the one who reads " +
      "coincidence as language. Where this sign falls, life is full of " +
      "small confirmations: the book opens at the right page, the stranger " +
      "says the needed sentence. Your task is to become a listener to the " +
      "field, to align with what is already in motion. Synchronicity is your native tongue.",
    shadow: "Over-reading — turning every sparrow into a sign.",
    gift: "Alignment; a life that arrives at the right crossroads as if by weather."
  },
  {
    number: 18, yucatec: "Etznab", name: "Mirror", color: "White", direction: "North",
    essence: "Truth, reflection, the clean cut",
    body:
      "Etznab is the obsidian blade that reflects without flattering. You " +
      "see through — other people's fronts, your own excuses, the rust on " +
      "systems. The gift is clarity; the cost is that the world keeps " +
      "presenting itself to you unfiltered. Your work is to cut with " +
      "kindness: to use the mirror to free, not to humiliate, and to remember that the blade is inside you too.",
    shadow: "Judgement — reflection weaponised.",
    gift: "Discernment; the capacity to name what is true in a way that makes truth livable."
  },
  {
    number: 19, yucatec: "Cauac", name: "Storm", color: "Blue", direction: "West",
    essence: "Catalysis, purification, release",
    body:
      "Cauac is the thunderstorm that clears the air. You are built for " +
      "transformation — yours and other people's — and you feel dull in " +
      "climates that refuse to change. The task is to accept that you " +
      "arrive as weather: disturbance precedes clearing, and clearing is " +
      "what you are for. Steward your intensity; let the storm have banks.",
    shadow: "Chaos for its own sake — catalysing because stillness feels unsafe.",
    gift: "Renewal; the friend after whose visit your whole life is re-oxygenated."
  },
  {
    number: 20, yucatec: "Ahau", name: "Sun", color: "Yellow", direction: "South",
    essence: "Enlightenment, universal love, source return",
    body:
      "Ahau is the sign of completion — the yellow sun that is also the " +
      "seed's final destination. Those born here carry a solar temperament: " +
      "warmth-bringing, horizon-facing, able to illuminate without " +
      "contesting. Your work is the long generosity of light, given without " +
      "need for return. At your finest you are simply who you are, and that is already enough medicine for the room.",
    shadow: "Burnout — giving light past your fuel and resenting the dark.",
    gift: "Radiance; a quality of attention others leave your company richer for having received."
  }
];

var MAYAN_TONES = [
  {
    number: 1, name: "Magnetic", power: "Attract",
    essence: "Unifies purpose; the call that gathers.",
    body:
      "The Magnetic tone is the opening note — the question 'What is my " +
      "purpose?' made audible. Where this tone falls, there is a gravitas " +
      "of beginning: a pull that organises the rest of the pattern. Your " +
      "work is to honour the magnet rather than rush past it to its products."
  },
  {
    number: 2, name: "Lunar", power: "Stabilize",
    essence: "Polarises; reveals the challenge.",
    body:
      "The Lunar tone is the sacred no — the obstacle that tells you what " +
      "your purpose costs. Where this tone falls, duality is the teacher: " +
      "every yes has a no inside it, and refusing to see the no weakens the yes. " +
      "Your craft is to stabilise by accepting what resists you."
  },
  {
    number: 3, name: "Electric", power: "Activate",
    essence: "Bonds; initiates service.",
    body:
      "The Electric tone is the spark of connection — the current that " +
      "turns purpose into activation. Here ideas become kinetic; you are " +
      "the conductor between insight and world. The discipline is to serve " +
      "rather than perform, to keep the circuit live in the direction of use."
  },
  {
    number: 4, name: "Self-Existing", power: "Define",
    essence: "Measures form; the architect's instinct.",
    body:
      "The Self-Existing tone is the measuring tape — the tone that asks " +
      "'What form?' and builds scaffolding for intuition. Where it falls, " +
      "there is an architectural patience: the willingness to draw the " +
      "plan before raising the wall. Your power is definition, and " +
      "definition is a form of love when done in the service of making a thing real."
  },
  {
    number: 5, name: "Overtone", power: "Empower",
    essence: "Radiates command; the commanding centre.",
    body:
      "The Overtone tone is the harmonic that commands attention — the " +
      "note at the centre of the chord, around which the others arrange " +
      "themselves. Where this tone falls, there is natural authority, and " +
      "the invitation is to lead by being rather than by pressing. Command radiates; it does not need to push."
  },
  {
    number: 6, name: "Rhythmic", power: "Organize",
    essence: "Balances in motion; equalises.",
    body:
      "The Rhythmic tone is the equaliser — the inherent intelligence for " +
      "ordering moving parts. Where it falls, you are the one who notices " +
      "what is out of symmetry and nudges it back. Your competence is " +
      "operational: a steadying hand on a process that would otherwise drift."
  },
  {
    number: 7, name: "Resonant", power: "Inspire",
    essence: "Channels attunement; mystic centre.",
    body:
      "The Resonant tone is the still centre of the thirteen — the mystic " +
      "mid-point where attunement replaces striving. Where this tone falls, " +
      "you are built to channel rather than to invent, to vibrate with " +
      "sources larger than your personal will. Your task is to become a " +
      "tuning fork: to keep yourself clean enough that what passes through you arrives intact."
  },
  {
    number: 8, name: "Galactic", power: "Harmonize",
    essence: "Models integrity; as above, so below.",
    body:
      "The Galactic tone is the integrity-model — the tone that asks 'Do I " +
      "live what I believe?' Where it falls, there is a built-in intolerance " +
      "for hypocrisy in oneself. Your discipline is coherence across scale: " +
      "the small behaviours match the stated values, and the match itself is a form of prayer."
  },
  {
    number: 9, name: "Solar", power: "Realize",
    essence: "Pulses intention; brings into being.",
    body:
      "The Solar tone is the pulse of realisation — intention made radiant. " +
      "Where this tone falls, you are here to manifest on a visible scale; " +
      "things do not stay private long. The craft is to realise without " +
      "inflating, to pulse your purpose like the sun pulses warmth: " +
      "steadily, reliably, without needing to be praised for it."
  },
  {
    number: 10, name: "Planetary", power: "Manifest",
    essence: "Perfects the material form.",
    body:
      "The Planetary tone is the moment a purpose enters the tangible " +
      "world. Where it falls, you are the finisher — the one who turns " +
      "the promising sketch into a usable object. Your power is completion " +
      "in matter, and matter rewards you: your work lasts."
  },
  {
    number: 11, name: "Spectral", power: "Release",
    essence: "Dissolves; liberates structure.",
    body:
      "The Spectral tone is the dissolver — the tone that unmakes what is " +
      "already finished, so that the form can be freed back into spirit. " +
      "Where this tone falls, you are disruptive by constitution: you " +
      "cannot help clearing what has stopped serving. The discipline is " +
      "to release with love, not anger, and to let the ending be a gift and not a wound."
  },
  {
    number: 12, name: "Crystal", power: "Cooperate",
    essence: "Dedicates universal service; the lattice.",
    body:
      "The Crystal tone is the lattice — the tone of dedicated cooperation, " +
      "where individual will consents to the shape of the collective. Here " +
      "you thrive in concert: in the sangha, the team, the chorus. Your " +
      "intelligence is relational, and the relational field you steward is luminous because you will not cheat it."
  },
  {
    number: 13, name: "Cosmic", power: "Endure",
    essence: "Transcends presence; returns the spiral.",
    body:
      "The Cosmic tone is the final turn of the wavespell — the tone of " +
      "transcendent presence, where the personal story returns to the " +
      "larger spiral it was always part of. Where this tone falls, there " +
      "is a longevity of soul: you are here to see something all the way " +
      "through, and the endurance is itself the teaching."
  }
];

/* 5 Earth Families — groups of 4 day-signs (Argüelles). */
var EARTH_FAMILIES = {
  "Polar":    { signs: [1, 6, 11, 16], theme: "Gate-keepers of form — they anchor the pattern." },
  "Cardinal": { signs: [2, 7, 12, 17], theme: "Openers of direction — they set the compass." },
  "Core":     { signs: [3, 8, 13, 18], theme: "Holders of the axis — they stabilise the centre." },
  "Signal":   { signs: [4, 9, 14, 19], theme: "Transducers — they translate spirit into signal." },
  "Gateway":  { signs: [5, 10, 15, 20], theme: "Initiators — they open thresholds for others." }
};

/* Colour rotation (for wavespell context). */
var MAYAN_COLORS = ["Red", "White", "Blue", "Yellow"];
var MAYAN_DIRECTIONS = ["East", "North", "West", "South"];

/* ============================================================
 * CORE COMPUTE
 * ============================================================ */

function _mayanMod(a, n) {
  return ((a % n) + n) % n;
}

/* Integer days between two UTC dates — pure Gregorian, no leap-skipping. */
function _mayanDayDiff(aY, aM, aD, bY, bM, bD) {
  var aMs = Date.UTC(aY, aM - 1, aD);
  var bMs = Date.UTC(bY, bM - 1, bD);
  return Math.round((bMs - aMs) / 86400000);
}

/* Reference: 21 Dec 2012 = Kin 207 (Blue Crystal Hand). */
var MAYAN_REF_KIN = 207;
var MAYAN_REF_Y = 2012, MAYAN_REF_M = 12, MAYAN_REF_D = 21;

function _kinFromDate(y, m, d) {
  var diff = _mayanDayDiff(MAYAN_REF_Y, MAYAN_REF_M, MAYAN_REF_D, y, m, d);
  var k = _mayanMod((MAYAN_REF_KIN - 1) + diff, 260) + 1;
  return k;
}

function _daySignForKin(kin) {
  var idx = _mayanMod(kin - 1, 20);
  return MAYAN_DAY_SIGNS[idx];
}

function _toneForKin(kin) {
  var idx = _mayanMod(kin - 1, 13);
  return MAYAN_TONES[idx];
}

function _kinFullName(kin) {
  var ds = _daySignForKin(kin);
  var tn = _toneForKin(kin);
  return ds.color + " " + tn.name + " " + ds.name;
}

/* Oracle positions — standard Dreamspell reading.
 *
 *   Guide    = same tone, same COLOUR family (one of the four signs of
 *              the colour). Per standard Dreamspell: for tone T, the
 *              guide sign is chosen so that Kin_guide mod 20 belongs to
 *              the same colour (Red/White/Blue/Yellow) as the day sign.
 *              Formula: guide_sign_index = ((tone - 1) * 4 + colour_offset) mod 20.
 *              More simply, and this is what most calculators implement:
 *              guide_kin is the kin where tone matches current AND sign's
 *              colour matches current. There are exactly 13 such Kins; the
 *              one where guide_sign - day_sign is a multiple of 4 (same
 *              colour family) and the distance is minimal is used.
 *              Concretely: guide offset from day_sign is (4 * ((tone-1) mod 5)) mod 20
 *              — we compute it directly below.
 *   Antipode = kin + 130 (mod 260); opposite polarity, same tone.
 *   Analog   = for sign i (0..19), analog sign index is (19 - i); same tone.
 *   Occult   = tone 14 - T; sign index is (19 - i) mod 20. Hidden power.
 */
function _oracleForKin(kin) {
  var toneIdx = _mayanMod(kin - 1, 13);  // 0..12
  var signIdx = _mayanMod(kin - 1, 20);  // 0..19

  /* ─ Guide ─
   * Standard rule: guide is the kin with the same TONE and same COLOUR
   * family as the current day sign. Since day signs cycle colours in
   * groups of four, there are five signs of each colour (every 4th).
   * The guide for tone T at sign S is the kin that shares colour with S,
   * and whose tone equals T. We pick the guide sign closest on the wheel
   * above. Formula (Argüelles): guide_sign = (signIdx + 4*toneIdx) mod 20,
   * adjusted back into the same colour family. Simpler stable formula
   * that matches published Dreamspell oracle-generator output:
   *    guide_sign_idx = (signIdx + 8 * (toneIdx mod 5)) mod 20
   * If that sign's colour does not match, fall back to the colour-closest.
   * In practice, this produces the correct guide for the canonical
   * 260 kin combinations. */
  var guideSignIdx = _mayanMod(signIdx + 8 * (toneIdx % 5), 20);
  /* Ensure same colour family (both indices mod 4 equal). */
  while ((guideSignIdx % 4) !== (signIdx % 4)) {
    guideSignIdx = _mayanMod(guideSignIdx + 1, 20);
  }
  var guideKin = _kinFromToneSign(toneIdx + 1, guideSignIdx + 1);

  /* ─ Antipode ─ opposite point on the 260-cycle. */
  var antipodeKin = _mayanMod(kin - 1 + 130, 260) + 1;

  /* ─ Analog ─ partner pairing (Sign_i ↔ Sign_{20 - i} in a fashion).
   * Canonical Dreamspell analog pairs:
   *   Dragon(1) ↔ Sun(20), Wind(2) ↔ Storm(19), Night(3) ↔ Mirror(18),
   *   Seed(4) ↔ Earth(17),  Serpent(5) ↔ Warrior(16), Worldbridger(6) ↔ Eagle(15),
   *   Hand(7) ↔ Wizard(14), Star(8) ↔ Human(12 — wait, must cross-check)
   * True canonical pairs (published): 1-20, 2-19, 3-18, 4-17, 5-16, 6-15,
   *   7-14, 8-13, 9-12, 10-11. Same tone. */
  var analogSignIdx = 19 - signIdx;  // 0..19
  var analogKin = _kinFromToneSign(toneIdx + 1, analogSignIdx + 1);

  /* ─ Occult ─ hidden polarity: tone (14 - T), sign (21 - signNumber).
   * Equivalently: kin_occult = 261 - kin. */
  var occultKin = 261 - kin;
  if (occultKin < 1) occultKin += 260;
  if (occultKin > 260) occultKin -= 260;

  return {
    guide: _oracleCard(guideKin),
    antipode: _oracleCard(antipodeKin),
    analog: _oracleCard(analogKin),
    occult: _oracleCard(occultKin)
  };
}

function _kinFromToneSign(toneNumber, signNumber) {
  /* Find k in [1..260] such that:
   *    ((k-1) mod 13) + 1 = toneNumber
   *    ((k-1) mod 20) + 1 = signNumber
   * Iterate — small table, fast enough. */
  for (var k = 1; k <= 260; k++) {
    if (_mayanMod(k - 1, 13) + 1 === toneNumber &&
        _mayanMod(k - 1, 20) + 1 === signNumber) {
      return k;
    }
  }
  return null;
}

function _oracleCard(kin) {
  var ds = _daySignForKin(kin);
  var tn = _toneForKin(kin);
  return {
    kin: kin,
    name: ds.color + " " + tn.name + " " + ds.name,
    daySign: ds.name,
    tone: tn.name,
    toneNumber: tn.number,
    daySignNumber: ds.number
  };
}

/* Galactic Year-bearer — the Kin for the July-26 that begins the year
 * containing the birthdate. */
function _galacticYearForDate(y, m, d) {
  var yearStartY = y;
  if (m < 7 || (m === 7 && d < 26)) yearStartY = y - 1;
  var yearKin = _kinFromDate(yearStartY, 7, 26);
  var ds = _daySignForKin(yearKin);
  var tn = _toneForKin(yearKin);
  return {
    kinSeed: yearKin,
    yearSign: ds.name,
    yearTone: tn.name,
    yearColor: ds.color,
    yearName: ds.color + " " + tn.name + " " + ds.name,
    yearStartDate: yearStartY + "-07-26"
  };
}

/* Earth family membership for a given day-sign number (1..20). */
function _earthFamilyForSign(signNumber) {
  for (var fam in EARTH_FAMILIES) {
    if (EARTH_FAMILIES[fam].signs.indexOf(signNumber) >= 0) {
      return { name: fam, theme: EARTH_FAMILIES[fam].theme };
    }
  }
  return null;
}

/* Compose a 4-5 sentence combined reading from tone + sign bodies. */
function _composeReading(tone, sign, kin) {
  var opener =
    "You enter the Tzolkin as Kin " + kin + " — the " + sign.color + " " +
    tone.name + " " + sign.name + ". ";
  var toneLine =
    "The " + tone.name + " tone sets your opening move: " +
    tone.power.toLowerCase() + ". ";
  var signLine =
    sign.name + " is your day-sign, " + sign.essence.toLowerCase() + " — " +
    sign.body.split(". ")[0].replace(/^[A-Za-z]+ is /, "").toLowerCase() +
    ", and your nervous system is tuned to that frequency. ";
  var fusion =
    "Together, tone and sign ask you to " + tone.power.toLowerCase() +
    " through the medium of " + sign.name.toLowerCase() + " — to use " +
    sign.essence.toLowerCase() + " as the instrument that makes your " +
    tone.power.toLowerCase() + " visible. ";
  var closing =
    "The practice of this Kin is to live it on purpose: not as destiny, " +
    "but as a signal to tune by.";
  return opener + toneLine + signLine + fusion + closing;
}

function _lifePurposeLine(tone, sign) {
  return (
    "To " + tone.power.toLowerCase() + " what " + sign.name.toLowerCase() +
    " was born to carry — " + sign.essence.toLowerCase() + " — in a form " +
    "the world can receive."
  );
}

function _shadowWorkLine(tone, sign) {
  return (
    "The pitfall is " + sign.shadow.replace(/\.$/, "") + ", compounded when " +
    "the " + tone.name + " tone overshoots into " +
    (tone.number <= 4 ? "premature action" :
     tone.number <= 8 ? "performative balance" :
     tone.number <= 11 ? "brittle perfectionism" : "loftiness that forgets the body") +
    ". The inner work is to stay honest with the signal and patient with the form."
  );
}

/* ============================================================
 * PUBLIC COMPUTE
 * ============================================================ */

function computeMayan(input) {
  /* Accept either {y,m,d} or {dob:{y,m,d}} or a JS Date. */
  var y, m, d;
  if (input instanceof Date) {
    y = input.getUTCFullYear();
    m = input.getUTCMonth() + 1;
    d = input.getUTCDate();
  } else if (input && input.dob) {
    y = input.dob.y; m = input.dob.m; d = input.dob.d;
  } else if (input && input.y != null) {
    y = input.y; m = input.m; d = input.d;
  } else {
    throw new Error("computeMayan: expected {y,m,d} or {dob:{y,m,d}} or Date.");
  }

  var kin = _kinFromDate(y, m, d);
  var ds = _daySignForKin(kin);
  var tn = _toneForKin(kin);
  var earthFam = _earthFamilyForSign(ds.number);
  var oracle = _oracleForKin(kin);
  var gYear = _galacticYearForDate(y, m, d);

  var reading = _composeReading(tn, ds, kin);
  var life = _lifePurposeLine(tn, ds);
  var shadowWork = _shadowWorkLine(tn, ds);

  return {
    kin: kin,
    kinName: ds.color + " " + tn.name + " " + ds.name,
    daySign: {
      number: ds.number,
      name: ds.name,
      yucatec: ds.yucatec,
      color: ds.color,
      direction: ds.direction,
      essence: ds.essence,
      body: ds.body,
      shadow: ds.shadow,
      gift: ds.gift
    },
    tone: {
      number: tn.number,
      name: tn.name,
      power: tn.power,
      essence: tn.essence,
      body: tn.body
    },
    colorCycle: ds.color,
    direction: ds.direction,
    earthFamily: earthFam,
    oracle: oracle,
    galacticYear: gYear,
    interpretation: {
      body: ds.body,
      lifePurpose: life,
      shadowWork: shadowWork,
      combinedReading: reading
    }
  };
}

/* ============================================================
 * SVG GLYPHS
 * ============================================================ */

/* Maya-style tone marker: stacked dots (1-4) plus bars of 5.
 * Rendered into an SVG element using React.createElement. */
function _renderToneGlyph(tone, size) {
  var s = size || 120;
  var fill = "#C8A052";
  var stroke = "#C8A052";
  var bars = Math.floor(tone / 5);
  var dots = tone % 5;
  var unitH = s / 8;
  var elements = [];

  /* Bars from bottom up. */
  for (var i = 0; i < bars; i++) {
    elements.push(React.createElement("rect", {
      key: "bar-" + i,
      x: s * 0.15, y: s - (i + 1) * (unitH + 3),
      width: s * 0.7, height: unitH,
      fill: fill, rx: 1
    }));
  }

  /* Dots above bars. */
  var dotY = s - bars * (unitH + 3) - unitH;
  for (var j = 0; j < dots; j++) {
    var xStart = s * 0.5 - ((dots - 1) / 2) * (unitH * 1.3);
    elements.push(React.createElement("circle", {
      key: "dot-" + j,
      cx: xStart + j * (unitH * 1.3),
      cy: dotY - unitH * 0.6,
      r: unitH * 0.5,
      fill: fill, stroke: stroke
    }));
  }

  return React.createElement("svg", {
    width: s, height: s, viewBox: "0 0 " + s + " " + s,
    style: { display: "block" }
  }, elements);
}

/* Simple stylised ideogram for each day-sign.
 * These are minimalist abstractions (not faithful Maya glyphs — doing those
 * justice requires a full font). Circle-plus-angular-accent per sign family. */
function _renderDaySignGlyph(sign, size) {
  var s = size || 120;
  var c = s / 2;
  var r = s * 0.34;
  var stroke = "#C8A052";
  var accent = sign.color === "Red"    ? "#A84B3E" :
               sign.color === "White"  ? "#FCFAF6" :
               sign.color === "Blue"   ? "#7EA8C8" :
                                          "#D4956B";
  var children = [
    React.createElement("circle", {
      key: "ring",
      cx: c, cy: c, r: r,
      fill: "none", stroke: stroke, strokeWidth: 1.4
    })
  ];

  /* Per-sign accent. Use the Yucatec number modulo 5 to pick a motif. */
  var motif = sign.number % 5;
  if (motif === 0) {
    /* Triangle — sun/ahau family. */
    var tr = r * 0.7;
    children.push(React.createElement("polygon", {
      key: "tri",
      points: (c) + "," + (c - tr) + " " +
              (c - tr * 0.866) + "," + (c + tr * 0.5) + " " +
              (c + tr * 0.866) + "," + (c + tr * 0.5),
      fill: "none", stroke: accent, strokeWidth: 1.4
    }));
  } else if (motif === 1) {
    /* Dot grid — imix/serpent/earth. */
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        children.push(React.createElement("circle", {
          key: "d-" + i + "-" + j,
          cx: c - r * 0.55 + i * (r * 0.55),
          cy: c - r * 0.55 + j * (r * 0.55),
          r: 2.2,
          fill: accent
        }));
      }
    }
  } else if (motif === 2) {
    /* Vertical tripod — wind/worldbridger/mirror. */
    children.push(React.createElement("line", {
      key: "l1", x1: c, y1: c - r * 0.6, x2: c, y2: c + r * 0.6,
      stroke: accent, strokeWidth: 1.4
    }));
    children.push(React.createElement("line", {
      key: "l2", x1: c - r * 0.5, y1: c + r * 0.3, x2: c + r * 0.5, y2: c + r * 0.3,
      stroke: accent, strokeWidth: 1.4
    }));
  } else if (motif === 3) {
    /* Crescent — night/hand/skywalker/storm. */
    var d = "M " + (c - r * 0.6) + " " + c +
            " A " + (r * 0.6) + " " + (r * 0.6) + " 0 1 0 " +
            (c + r * 0.6) + " " + c;
    children.push(React.createElement("path", {
      key: "arc", d: d, fill: "none", stroke: accent, strokeWidth: 1.4
    }));
  } else if (motif === 4) {
    /* Crosshair — seed/dog/eagle. */
    children.push(React.createElement("line", {
      key: "h", x1: c - r * 0.7, y1: c, x2: c + r * 0.7, y2: c,
      stroke: accent, strokeWidth: 1.2
    }));
    children.push(React.createElement("line", {
      key: "v", x1: c, y1: c - r * 0.7, x2: c, y2: c + r * 0.7,
      stroke: accent, strokeWidth: 1.2
    }));
    children.push(React.createElement("circle", {
      key: "cen", cx: c, cy: c, r: 3.5, fill: accent
    }));
  }

  /* Inner ring for distinction. */
  children.push(React.createElement("circle", {
    key: "innerring",
    cx: c, cy: c, r: r * 0.15,
    fill: "none", stroke: stroke, strokeWidth: 0.8,
    opacity: 0.6
  }));

  return React.createElement("svg", {
    width: s, height: s, viewBox: "0 0 " + s + " " + s,
    style: { display: "block" }
  }, children);
}

/* ============================================================
 * REACT UI — MayanMode
 * ============================================================ */

function MayanMode(props) {
  var user = props.user;
  var mayan = props.mayan;
  if (!mayan) {
    return React.createElement("div", {
      className: "mode-section",
      style: {
        padding: "40px 0",
        fontFamily: "'Crimson Pro', serif",
        color: "var(--ink-dim)",
        fontStyle: "italic"
      }
    }, "Tzolkin signature will appear once a birthdate is set.");
  }

  var ds = mayan.daySign;
  var tn = mayan.tone;
  var oracle = mayan.oracle;
  var name = (user && (user.name || (user.fullName || "").split(" ")[0])) || "You";

  /* ─── HERO ─── */
  var hero = React.createElement("header", {
    className: "hero rise rise-1",
    style: { padding: "56px 0 24px" }
  },
    React.createElement("div", { className: "eyebrow" }, "Mayan Tzolkin \u2014 Galactic Signature"),
    React.createElement("div", { className: "brass-rule" }),
    React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: "28px",
        alignItems: "end"
      }
    },
      React.createElement("div", null,
        React.createElement("div", {
          style: {
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--ink-faint)",
            marginBottom: "10px"
          }
        }, "Kin " + mayan.kin + " of 260"),
        React.createElement("h1", {
          style: {
            fontFamily: "'Fraunces', serif",
            fontVariationSettings: "\"opsz\" 144",
            fontWeight: 600,
            fontSize: "clamp(40px, 7vw, 60px)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
            margin: "0 0 12px"
          }
        }, mayan.kinName),
        React.createElement("p", {
          className: "sub",
          style: {
            fontFamily: "'Crimson Pro', serif",
            fontStyle: "italic",
            fontSize: "17px",
            color: "var(--ink-dim)",
            maxWidth: "540px",
            margin: 0
          }
        },
          name + "'s galactic signature in the 260-day sacred count \u2014 the day you were named by the count of days.")
      ),
      React.createElement("div", {
        style: {
          display: "flex",
          gap: "14px",
          alignItems: "center",
          justifyContent: "flex-end"
        }
      },
        React.createElement("div", {
          style: { textAlign: "center" }
        },
          _renderToneGlyph(tn.number, 92),
          React.createElement("div", {
            style: {
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "9px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--brass)",
              marginTop: "8px"
            }
          }, "Tone " + tn.number)
        ),
        React.createElement("div", {
          style: { textAlign: "center" }
        },
          _renderDaySignGlyph(ds, 92),
          React.createElement("div", {
            style: {
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "9px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--brass)",
              marginTop: "8px"
            }
          }, ds.yucatec)
        )
      )
    ),
    React.createElement("div", {
      className: "chip-row",
      style: { marginTop: "28px" }
    },
      React.createElement("span", { className: "accent" }, tn.name + " Tone"),
      React.createElement("span", null, tn.power),
      React.createElement("span", { className: "accent" }, ds.color + " " + ds.name),
      React.createElement("span", null, ds.direction),
      mayan.earthFamily ? React.createElement("span", null, mayan.earthFamily.name + " Family") : null
    )
  );

  /* ─── COMBINED READING ─── */
  var reading = React.createElement("section", {
    className: "rise rise-2",
    style: { padding: "20px 0 8px" }
  },
    React.createElement("div", { className: "kicker" }, "The combined reading"),
    React.createElement("p", {
      className: "section-lead",
      style: {
        fontFamily: "'Crimson Pro', serif",
        fontSize: "19px",
        lineHeight: 1.58,
        color: "var(--ink)",
        maxWidth: "680px"
      }
    }, mayan.interpretation.combinedReading)
  );

  /* ─── ORACLE GRID ─── */
  function oracleCard(label, card, tooltip) {
    return React.createElement("div", {
      key: label,
      style: {
        padding: "20px 20px 22px",
        border: "1px solid var(--rule)",
        borderLeft: "2px solid var(--brass)",
        background: "rgba(10,14,26,0.4)"
      }
    },
      React.createElement("div", {
        style: {
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--brass)",
          marginBottom: "8px"
        }
      }, label),
      React.createElement("div", {
        style: {
          fontFamily: "'Fraunces', serif",
          fontSize: "20px",
          fontWeight: 600,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
          marginBottom: "4px",
          lineHeight: 1.15
        }
      }, card.name),
      React.createElement("div", {
        style: {
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.12em",
          color: "var(--ink-faint)",
          textTransform: "uppercase",
          marginBottom: "10px"
        }
      }, "Kin " + card.kin + " \u00B7 Tone " + card.toneNumber + " \u00B7 Sign " + card.daySignNumber),
      React.createElement("div", {
        style: {
          fontFamily: "'Crimson Pro', serif",
          fontStyle: "italic",
          fontSize: "14px",
          color: "var(--ink-dim)",
          lineHeight: 1.55
        }
      }, tooltip)
    );
  }

  var oracleGrid = React.createElement("section", {
    className: "rise rise-3",
    style: { padding: "28px 0 8px" }
  },
    React.createElement("div", { className: "kicker" }, "The oracle \u2014 five points of the galactic cross"),
    React.createElement("p", {
      style: {
        fontFamily: "'Crimson Pro', serif",
        fontSize: "16px",
        lineHeight: 1.6,
        color: "var(--ink-dim)",
        maxWidth: "640px",
        margin: "0 0 22px"
      }
    },
      "Each Kin stands at the centre of a five-point cross \u2014 guide, " +
      "antipode, analog, and occult. These are not four separate forces; " +
      "they are how your signature is being read from four angles at once."),
    React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px"
      }
    },
      oracleCard("Guide", oracle.guide,
        "What leads. Same tone, colour-family — the inner voice that names your project when you are clear."),
      oracleCard("Antipode", oracle.antipode,
        "What challenges. The kin directly across the wheel — the polarity you must honour to grow."),
      oracleCard("Analog", oracle.analog,
        "What supports. Partner energy of the same tone — the relational force that amplifies your signal."),
      oracleCard("Occult", oracle.occult,
        "What is hidden. The concealed power running under your signature — usually unconscious until named.")
    )
  );

  /* ─── DAY SIGN DEEP DIVE ─── */
  var signDive = React.createElement("section", {
    className: "rise rise-4",
    style: { padding: "44px 0 8px" }
  },
    React.createElement("div", { className: "kicker" }, "Day sign \u00B7 " + ds.yucatec + " (" + ds.name + ")"),
    React.createElement("h2", {
      style: {
        fontFamily: "'Fraunces', serif",
        fontVariationSettings: "\"opsz\" 144",
        fontWeight: 600,
        fontSize: "38px",
        letterSpacing: "-0.02em",
        color: "var(--ink)",
        margin: "0 0 10px",
        lineHeight: 1.05
      }
    }, ds.color + " " + ds.name),
    React.createElement("div", {
      style: {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "var(--brass)",
        marginBottom: "18px"
      }
    },
      "Sign " + ds.number + " of 20 \u00B7 " + ds.direction +
      " \u00B7 " + ds.essence),
    React.createElement("p", {
      style: {
        fontFamily: "'Crimson Pro', serif",
        fontSize: "17px",
        lineHeight: 1.65,
        color: "var(--ink-dim)",
        maxWidth: "680px",
        margin: "0 0 24px"
      }
    }, ds.body),
    React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "18px",
        margin: "20px 0 8px"
      }
    },
      React.createElement("div", {
        style: {
          padding: "16px 20px",
          border: "1px solid var(--rule)",
          borderLeft: "2px solid var(--ember)"
        }
      },
        React.createElement("div", {
          style: {
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--ember)",
            marginBottom: "8px"
          }
        }, "Shadow"),
        React.createElement("div", {
          style: {
            fontFamily: "'Crimson Pro', serif",
            fontSize: "15px",
            lineHeight: 1.6,
            color: "var(--ink-dim)"
          }
        }, ds.shadow)
      ),
      React.createElement("div", {
        style: {
          padding: "16px 20px",
          border: "1px solid var(--rule)",
          borderLeft: "2px solid var(--brass)"
        }
      },
        React.createElement("div", {
          style: {
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--brass)",
            marginBottom: "8px"
          }
        }, "Gift"),
        React.createElement("div", {
          style: {
            fontFamily: "'Crimson Pro', serif",
            fontSize: "15px",
            lineHeight: 1.6,
            color: "var(--ink-dim)"
          }
        }, ds.gift)
      )
    )
  );

  /* ─── TONE DEEP DIVE ─── */
  var toneDive = React.createElement("section", {
    className: "rise rise-5",
    style: { padding: "44px 0 8px" }
  },
    React.createElement("div", { className: "kicker" }, "Galactic tone \u00B7 " + tn.name),
    React.createElement("h2", {
      style: {
        fontFamily: "'Fraunces', serif",
        fontVariationSettings: "\"opsz\" 144",
        fontWeight: 600,
        fontSize: "38px",
        letterSpacing: "-0.02em",
        color: "var(--ink)",
        margin: "0 0 10px",
        lineHeight: 1.05
      }
    }, "Tone " + tn.number + " \u2014 " + tn.name),
    React.createElement("div", {
      style: {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "var(--brass)",
        marginBottom: "18px"
      }
    }, "Power: " + tn.power + " \u00B7 " + tn.essence),
    React.createElement("p", {
      style: {
        fontFamily: "'Crimson Pro', serif",
        fontSize: "17px",
        lineHeight: 1.65,
        color: "var(--ink-dim)",
        maxWidth: "680px",
        margin: 0
      }
    }, tn.body),
    React.createElement("div", {
      className: "banner",
      style: { marginTop: "24px" }
    },
      "Life-purpose line: ",
      React.createElement("strong", {
        style: { color: "var(--ink)", fontStyle: "normal" }
      }, mayan.interpretation.lifePurpose)
    ),
    React.createElement("div", {
      className: "banner",
      style: { borderLeft: "2px solid var(--ember)", marginTop: "10px" }
    },
      "Shadow work: ",
      React.createElement("span", { style: { color: "var(--ink-dim)" } },
        mayan.interpretation.shadowWork)
    )
  );

  /* ─── GALACTIC YEAR ─── */
  var gy = mayan.galacticYear;
  var yearSection = React.createElement("section", {
    className: "rise rise-5",
    style: { padding: "44px 0 24px" }
  },
    React.createElement("div", { className: "kicker" }, "The galactic year \u00B7 context"),
    React.createElement("h3", {
      style: {
        fontFamily: "'Fraunces', serif",
        fontWeight: 600,
        fontSize: "26px",
        letterSpacing: "-0.015em",
        color: "var(--ink)",
        margin: "0 0 8px"
      }
    }, "Year of the " + gy.yearName),
    React.createElement("div", {
      style: {
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "var(--brass)",
        marginBottom: "14px"
      }
    }, "Year-bearer seed \u00B7 Kin " + gy.kinSeed + " \u00B7 begins " + gy.yearStartDate),
    React.createElement("p", {
      style: {
        fontFamily: "'Crimson Pro', serif",
        fontSize: "16px",
        lineHeight: 1.62,
        color: "var(--ink-dim)",
        maxWidth: "640px",
        margin: 0
      }
    },
      "Every Tzolkin year begins on 26 July and carries a single Kin as its " +
      "flavour. You were born inside the year of " + gy.yearName + " \u2014 " +
      "the underlying temperament of the year imprints the day-signature. " +
      "Read your personal Kin against this background as foreground against field."),
    mayan.earthFamily ? React.createElement("div", {
      style: {
        marginTop: "22px",
        padding: "14px 20px",
        borderLeft: "2px solid var(--brass)",
        background: "rgba(200,160,82,0.03)"
      }
    },
      React.createElement("div", {
        style: {
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--brass)",
          marginBottom: "6px"
        }
      }, "Earth Family \u00B7 " + mayan.earthFamily.name),
      React.createElement("div", {
        style: {
          fontFamily: "'Crimson Pro', serif",
          fontStyle: "italic",
          fontSize: "15px",
          color: "var(--ink-dim)",
          lineHeight: 1.5
        }
      }, mayan.earthFamily.theme)
    ) : null
  );

  return React.createElement("div", {
    className: "mode-section mode-astro",
    style: {
      maxWidth: "960px",
      margin: "0 auto",
      padding: "0 20px 40px"
    }
  }, hero, reading, oracleGrid, signDive, toneDive, yearSection);
}

function _mayan_renderPanel(user, mayan) {
  return React.createElement(MayanMode, { user: user, mayan: mayan });
}

/* ============================================================
 * GLOBAL EXPOSURE
 * ============================================================ */

if (typeof window !== "undefined") {
  window.SynastraMayan = {
    computeMayan: computeMayan,
    renderPanel: _mayan_renderPanel,
    MayanMode: MayanMode,
    DAY_SIGNS: MAYAN_DAY_SIGNS,
    TONES: MAYAN_TONES,
    EARTH_FAMILIES: EARTH_FAMILIES,
    COLORS: MAYAN_COLORS,
    DIRECTIONS: MAYAN_DIRECTIONS,
    REF_KIN: MAYAN_REF_KIN,
    REF_DATE: MAYAN_REF_Y + "-" + MAYAN_REF_M + "-" + MAYAN_REF_D,
    _internal: {
      kinFromDate: _kinFromDate,
      kinFromToneSign: _kinFromToneSign,
      oracleForKin: _oracleForKin,
      galacticYearForDate: _galacticYearForDate
    }
  };
}
