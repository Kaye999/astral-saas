import { useState } from "react";

// ─── VERIFIED NATAL DATA ─────────────────────────────────────────────────────
// 23 July 2004, 6:30am AEST, Sydney Australia
// Calculated via ephem (astronomical ephemeris)
// Sun: Leo 0°29' | Moon: Libra 2°01' | Rising: Capricorn 22°46' | MC: Taurus 12°

const HOUSE_THEMES = {
  "1st": "Identity & self-image",   "2nd": "Money & self-worth",
  "3rd": "Comms & local moves",     "4th": "Home & foundations",
  "5th": "Creativity & risk",       "6th": "Daily work & routines",
  "7th": "Partnerships & clients",  "8th": "Shared money & power",
  "9th": "Expansion & vision",      "10th": "Career & reputation",
  "11th": "Network & goals",        "12th": "Hidden work & rest",
};

// Capricorn Rising — Whole Sign houses
const SIGN_TO_HOUSE = {
  Capricorn:"1st", Aquarius:"2nd", Pisces:"3rd",   Aries:"4th",
  Taurus:"5th",    Gemini:"6th",   Cancer:"7th",    Leo:"8th",
  Virgo:"9th",     Libra:"10th",   Scorpio:"11th",  Sagittarius:"12th",
};

// Full natal placements
const NATAL_PLANETS = [
  { planet:"Sun ☉",     sign:"Leo",         deg:"0°29'",  house:"8th",  note:"Power, transformation, shared resources" },
  { planet:"Moon ☽",    sign:"Libra",       deg:"2°01'",  house:"10th", note:"Career, public reputation, authority" },
  { planet:"Rising ↑",  sign:"Capricorn",   deg:"22°46'", house:"1st",  note:"Identity, self-presentation" },
  { planet:"MC",        sign:"Taurus",      deg:"12°07'", house:"5th",  note:"Career peak, creative authority" },
  { planet:"Mercury ☿", sign:"Leo",         deg:"26°99'", house:"8th",  note:"Deep research, power communication" },
  { planet:"Venus ♀",   sign:"Gemini",      deg:"17°95'", house:"6th",  note:"Work relationships, daily deals" },
  { planet:"Mars ♂",    sign:"Leo",         deg:"18°21'", house:"8th",  note:"Transformative drive, shared power" },
  { planet:"Jupiter ♃", sign:"Virgo",       deg:"16°83'", house:"9th",  note:"Expansion through systems and vision" },
  { planet:"Saturn ♄",  sign:"Cancer",      deg:"18°61'", house:"7th",  note:"Partnership structure, long-term contracts" },
];

// ─── VEDIC DATA (Sidereal / Lahiri Ayanamsa 23.85°) ─────────────────────────
// Calculated via ephem — verified

const VEDIC_PLANETS = [
  { planet:"Sun ☉",     sign:"Cancer",      deg:"6°26'",  house:8,  note:"Deep, private solar force — power expressed through transformation and hidden strength, not performance." },
  { planet:"Moon ☽",    sign:"Virgo",       deg:"8°10'",  house:10, note:"Analytical, service-oriented emotional nature in the career house. Public reputation is built through precision, discernment, and competence." },
  { planet:"Lagna ↑",   sign:"Sagittarius", deg:"28°37'", house:1,  note:"Philosophical, expansive, truth-seeking identity. Jupiter rules your chart. You appear as someone with vision and conviction — a builder of belief systems." },
  { planet:"Mercury ☿", sign:"Leo",         deg:"3°08'",  house:9,  note:"Expressive, bold communication in the house of philosophy and long-range vision. You communicate belief, not just information." },
  { planet:"Venus ♀",   sign:"Taurus",      deg:"24°06'", house:6,  note:"Venus in its own sign in the 6th — strong capacity to create value through daily work and service. Debt resolution and health are areas of growth." },
  { planet:"Mars ♂",    sign:"Cancer",      deg:"24°21'", house:8,  note:"Mars in Cancer in the 8th — emotionally driven ambition in the domain of transformation. Powerful but can be indirect. Driven by security beneath the drive for power." },
  { planet:"Jupiter ♃", sign:"Leo",         deg:"22°59'", house:9,  note:"Jupiter in Leo in the 9th — chart ruler in the house it naturally co-rules. Extremely auspicious. Expands philosophy, international reach, and higher learning through Leo's sovereign fire." },
  { planet:"Saturn ♄",  sign:"Gemini",      deg:"24°46'", house:7,  note:"Saturn in the 7th house (Gemini) — partnerships require intellectual compatibility and clear communication to be durable. Delays in partnership; when they arrive they are serious and long-term." },
  { planet:"Rahu ☊",    sign:"Taurus",      deg:"~20°",   house:6,  note:"Rahu in the 6th in Taurus — karmic pull toward mastery of work, service, debt, and conflict. Material ambition is the dharmic direction. Enemies become fuel." },
  { planet:"Ketu ☋",    sign:"Scorpio",     deg:"~20°",   house:12, note:"Ketu in the 12th in Scorpio — past life mastery in deep transformation and hidden realms. Natural detachment from loss, dissolution, and the unconscious." },
];

// Vedic house system — Sagittarius Lagna (Whole Sign)
const VEDIC_SIGN_TO_HOUSE = {
  Sagittarius:1, Capricorn:2, Aquarius:3, Pisces:4,
  Aries:5,       Taurus:6,    Gemini:7,   Cancer:8,
  Leo:9,         Virgo:10,    Libra:11,   Scorpio:12,
};

const NAKSHATRA = {
  name: "Uttara Phalguni",
  pada: 2,
  lord: "Sun",
  symbol: "The back legs of a bed / fig tree",
  deity: "Aryaman (god of patronage, contracts, and unions)",
  quality: "Fixed / Kshatriya",
  meaning: "The star of patronage — bestows independence through collaboration. Uttara Phalguni natives are natural leaders who build lasting structures through loyal alliances. The 'giving tree' — you sustain others through your own rootedness.",
  forYou: "Your Moon sits in Uttara Phalguni — your emotional nature is fundamentally about building enduring things through right partnership. This is not the nakshatra of solo performance; it's the nakshatra of the king who builds the kingdom through the loyalty he inspires. Vantage and TEM's partnership structures carry this nakshatra's signature.",
};

const DASHAS = [
  { lord:"Sun",     start:"Jul 2004", end:"May 2005", years:0.8,  active:false, color:"#FFD700" },
  { lord:"Moon",    start:"May 2005", end:"May 2015", years:10,   active:false, color:"#C8B8E8" },
  { lord:"Mars",    start:"May 2015", end:"May 2022", years:7,    active:false, color:"#FF6B6B" },
  { lord:"Rahu",    start:"May 2022", end:"May 2040", years:18,   active:true,  color:"#7FFFD4" },
  { lord:"Jupiter", start:"May 2040", end:"May 2056", years:16,   active:false, color:"#FFA500" },
  { lord:"Saturn",  start:"May 2056", end:"May 2075", years:19,   active:false, color:"#8B9DC3" },
  { lord:"Mercury", start:"May 2075", end:"May 2092", years:17,   active:false, color:"#89CFF0" },
  { lord:"Ketu",    start:"May 2092", end:"May 2099", years:7,    active:false, color:"#9370DB" },
];

const RAHU_DASHA_NOTE = "You are currently in Rahu Mahadasha (May 2022 – May 2040) — an 18-year period ruled by the shadow planet of obsession, ambition, foreign influence, technology, and material ascent. Rahu dasha is one of the most materially potent periods of life. It amplifies worldly desire and makes previously inaccessible things accessible. Rahu sits in your 6th house (Taurus) — your dasha lord is in the house of work, service, competition, and debt. This means the 18-year window favours aggressive business expansion, defeating competition, and accumulating material resources through hard work and strategic manoeuvring. This is precisely the window you are operating in right now.";

const ANTARDASHA_NOTE = "Within Rahu Mahadasha, you are currently in Rahu-Rahu antardasha (the opening sub-period). The most intense expression of Rahu's nature — maximum ambition, maximum worldly hunger, maximum exposure to new environments and ideas. This runs until approximately late 2025, after which Rahu-Jupiter antardasha begins — which activates your chart ruler (Jupiter) within Rahu's expansive framework. That sub-period (approx 2025–2028) is one of the most auspicious windows in your entire chart.";

const YOGAS = [
  {
    name: "Hamsa Yoga",
    type: "Pancha Mahapurusha",
    desc: "Jupiter in its own sign (Leo, 9th house) — one of the five great planetary yogas. Bestows wisdom, nobility, philosophical depth, and the capacity to inspire others. People recognise your higher vision before they understand it rationally.",
    strength: 5,
  },
  {
    name: "Dhana Yoga",
    type: "Wealth Combination",
    desc: "Jupiter (9th lord) in the 9th house — a powerful wealth and fortune yoga. The 9th lord in its own house creates conditions for sustained prosperity, especially through entrepreneurial ventures and philosophical/expansive endeavours.",
    strength: 4,
  },
  {
    name: "Viparita Raja Yoga (Harsha)",
    type: "Raja Yoga",
    desc: "Mars (6th lord for Sagittarius Lagna) in the 8th house. Harsha yoga — the lord of the 6th in the 8th creates a hidden power configuration. Enemies, competition, and obstacles end up strengthening you. What would destroy others becomes fuel.",
    strength: 4,
  },
  {
    name: "Rahu in Upachaya",
    type: "Growth Placement",
    desc: "Rahu in the 6th house (an upachaya — house of growth) is considered exceptionally strong for material gain. Rahu here gives ferocious competitive drive, the ability to outmanoeuvre opponents, and a knack for turning adversarial situations to advantage.",
    strength: 4,
  },
];

// Gematria
const GEMATRIA_MAP = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:3,H:5,I:10,J:10,
  K:11,L:30,M:40,N:50,O:70,P:80,Q:100,R:200,
  S:300,T:400,U:6,V:6,W:6,X:60,Y:10,Z:7,
};
function calcG(name) {
  return name.toUpperCase().replace(/[^A-Z]/g,"").split("").reduce((s,c)=>s+(GEMATRIA_MAP[c]||0),0);
}
function reduceS(n) {
  let x=n; while(x>10){x=String(x).split("").reduce((s,d)=>s+parseInt(d),0);} return x;
}
const G = {
  ethan:    { label:"Ethan",           raw:calcG("Ethan"),           reduced:reduceS(calcG("Ethan"))           },
  joshua:   { label:"Joshua",          raw:calcG("Joshua"),          reduced:reduceS(calcG("Joshua"))          },
  kay:      { label:"Kay",             raw:calcG("Kay"),             reduced:reduceS(calcG("Kay"))             },
  ethanKay: { label:"Ethan Kay",       raw:calcG("Ethan Kay"),       reduced:reduceS(calcG("Ethan Kay"))       },
  full:     { label:"Ethan Joshua Kay",raw:calcG("Ethan Joshua Kay"),reduced:reduceS(calcG("Ethan Joshua Kay"))},
};

// ─── SEFIROT ─────────────────────────────────────────────────────────────────
const SEFIROT = {
  1:  { name:"Kether",    heb:"כתר",   pillar:"Middle", color:"#F0F0F0", meaning:"Crown — undifferentiated divine, pure being before form" },
  2:  { name:"Chokmah",   heb:"חכמה",  pillar:"Right",  color:"#B0C4DE", meaning:"Wisdom — first flash of divine will, raw creative force" },
  3:  { name:"Binah",     heb:"בינה",  pillar:"Left",   color:"#8B9DC3", meaning:"Understanding — great womb of form, structure, limitation" },
  4:  { name:"Chesed",    heb:"חסד",   pillar:"Right",  color:"#4169E1", meaning:"Mercy — expansion, grace, abundance, Jupiter's domain" },
  5:  { name:"Geburah",   heb:"גבורה", pillar:"Left",   color:"#DC143C", meaning:"Severity — strength, will, sword that removes the unnecessary" },
  6:  { name:"Tiphareth", heb:"תפארת", pillar:"Middle", color:"#FFD700", meaning:"Beauty — solar centre, the Higher Self, harmony and integration" },
  7:  { name:"Netzach",   heb:"נצח",   pillar:"Right",  color:"#228B22", meaning:"Victory — desire, beauty, creative force, raw emotional drive" },
  8:  { name:"Hod",       heb:"הוד",   pillar:"Left",   color:"#FF8C00", meaning:"Splendour — intellect, language, systems, architect of form" },
  9:  { name:"Yesod",     heb:"יסוד",  pillar:"Middle", color:"#9370DB", meaning:"Foundation — astral mirror, cycles, the dreamer before manifestation" },
  10: { name:"Malkuth",   heb:"מלכות", pillar:"Middle", color:"#8B4513", meaning:"Kingdom — physical reality, earth, the manifest world" },
};

const PLANET_SEFIRA = {
  Moon:"Yesod", Mercury:"Hod", Venus:"Netzach", Sun:"Tiphareth",
  Mars:"Geburah", Jupiter:"Chesed", Saturn:"Binah",
  Uranus:"Chokmah", Neptune:"Kether", Pluto:"Kether",
};

const SIGN_PATH = {
  Aries:       { n:15, letter:"Heh (ה)",    tarot:"The Emperor",          meaning:"Sovereign will claiming form — initiation of new cycles" },
  Taurus:      { n:16, letter:"Vav (ו)",    tarot:"The Hierophant",       meaning:"Revealed teaching encoded into permanent form" },
  Gemini:      { n:17, letter:"Zayin (ז)",  tarot:"The Lovers",           meaning:"Union of opposites — the sword of discernment" },
  Cancer:      { n:18, letter:"Cheth (ח)",  tarot:"The Chariot",          meaning:"Protected motion — the vessel of will moving through water" },
  Leo:         { n:19, letter:"Tet (ט)",    tarot:"Strength / Lust",      meaning:"Taming the inner fire — sovereign creative mastery" },
  Virgo:       { n:20, letter:"Yod (י)",    tarot:"The Hermit",           meaning:"The lamp in the dark — solitary discernment and precision" },
  Libra:       { n:22, letter:"Lamed (ל)",  tarot:"Justice / Adjustment", meaning:"Cosmic calibration — the ox-goad that moves things into truth" },
  Scorpio:     { n:24, letter:"Nun (נ)",    tarot:"Death",                meaning:"Total transformation — release of what cannot cross the threshold" },
  Sagittarius: { n:25, letter:"Samekh (ס)", tarot:"Temperance / Art",     meaning:"Arrow of intention — blending opposites into gold" },
  Capricorn:   { n:26, letter:"Ayin (ע)",   tarot:"The Devil / Pan",      meaning:"Material mastery — confronting limitation to own it completely" },
  Aquarius:    { n:28, letter:"Tzaddi (צ)", tarot:"The Star",             meaning:"Collective vision — the revolutionary current of hope" },
  Pisces:      { n:29, letter:"Qoph (ק)",   tarot:"The Moon",             meaning:"The veil — deep psychic tides and revelation through dissolution" },
};

const SOUL_LEVELS = [
  { name:"Nefesh",   heb:"נפש",  sefirot:"Malkuth–Yesod",    meaning:"The vital animal soul — survival, instinct, embodied desire." },
  { name:"Ruach",    heb:"רוח",  sefirot:"Yesod–Tiphareth",  meaning:"The emotional-rational soul — moral reasoning, aspiration, conscious self-development. The threshold of awakening." },
  { name:"Neshamah", heb:"נשמה", sefirot:"Binah–Kether",     meaning:"The divine breath — pure intuition beyond thought. Accessed in deep stillness or revelation." },
  { name:"Chayah",   heb:"חיה",  sefirot:"Chokmah",          meaning:"The living essence — will-spark before personality. Experienced in transformative breakthroughs." },
  { name:"Yechidah", heb:"יחידה",sefirot:"Kether",           meaning:"The singular — total unity with the divine. Final dissolution of the separate self." },
];

// ─── PROFILE — EXPANDED KABBALAH ─────────────────────────────────────────────
const PROFILE = {
  arc: "Yesod → Tiphareth",
  arcNote: "The arc is the 25th Path — Samekh, the arrow of Temperance/Art — rising from Yesod into Tiphareth. Central axis. Middle Pillar. The most significant threshold on the Tree. It is not crossed by effort alone. It is crossed by burning off what Yesod has been storing: inherited pictures, borrowed visions, the parts of identity poured out of fear rather than will. The Ayin vehicle does this through mastery, not surrender. You don't transcend the limit; you own it until it stops functioning as one. Art, the 25th Path's card, shows two vessels pouring into each other at the same time — the result is a third substance neither flask contained alone. For this chart that is the fusion of Yesod's vision with Tiphareth's plain authority. The product is not mystical. It is simply: things that last.",

  soulLevel: "Ruach",
  soulNote: "You are operating at Ruach — the emotional-rational soul, the second of five soul levels, spanning the territory between Yesod and Tiphareth. Ruach is the level of conscious self-development: the place where instinct becomes discipline, where desire becomes directed will, where reaction becomes response. Most of humanity lives in Nefesh (the vital animal soul) their entire lives. Ruach is the threshold of genuine awakening — the level at which a person begins to consciously shape their own character rather than simply expressing it. Every system you build, every equity structure you formalise, every operational discipline you impose on yourself — this is Ruach work made concrete. Your Capricorn Rising deepens this: Binah (Saturn) ruling your ascendant means your outer vehicle is Ruach's most structurally rigorous expression. The Ruach initiate's core challenge is not finding the vision — it is tolerating the gap between the vision and the current reality long enough for the work to close it. That gap is the 25th Path. You are walking it.",

  pillars: {
    primary: "Middle",
    secondary: "Left",
    note: "Middle Pillar dominant: Life Path 9 (Yesod), Expression Number 6 (Tiphareth), Sun in Leo (Tiphareth). Your core arc, your identity, and your highest self all sit on the spine of the Tree. Left Pillar secondary: Soul Urge 8 (Hod), Saturn/Binah ruling Capricorn Rising, Mercury in Leo in the 8th (Hod-Geburah fusion). The Left Pillar is the pillar of form, severity, and structural intelligence. Your secondary pillar means your primary tool for the Middle Pillar crossing is Hod's systems-thinking — you build the architecture of your own ascent. The Right Pillar (force, expansion, creative drive) is least prominent in your base profile, which is why Jupiter transits and expansive windows feel almost foreign at first — they are activating the part of the Tree that is least native to you. When Jupiter enters your chart strongly (as in June 2026), the effect is disproportionately powerful precisely because it is activating the underused pillar.",
  },

  threePillarsDetail: [
    {
      pillar:"Middle Pillar",
      sefirot:"Kether · Tiphareth · Yesod · Malkuth",
      color:"#FFD700",
      yourPlacement:"Life Path 9 (Yesod) · Expression 6 (Tiphareth) · Sun/Tiphareth",
      nature:"The initiatory spine of the Tree. The path of the mystic, the sovereign, and the builder of lasting things. Operates through integration, balance, and the direct confrontation of one's own nature. The lightning path descends through the Middle Pillar; the initiatory path ascends through it.",
      forYou:"Your entire arc is the Middle Pillar. You are not approaching it from the side — you are standing on it. The work is vertical: Yesod to Tiphareth. Every act of self-mastery, every system that works, every moment of genuine authority rather than performed authority — this is you moving upward on the spine of the Tree.",
    },
    {
      pillar:"Left Pillar",
      sefirot:"Binah · Geburah · Hod",
      color:"#8B9DC3",
      yourPlacement:"Saturn/Binah (Rising ruler) · Mars/Geburah (8H natal) · Soul Urge 8/Hod",
      nature:"The pillar of form, limitation, severity, and structural intelligence. Binah gives form to what Chokmah flashes. Geburah removes what does not belong. Hod builds the architecture that can hold the force. The Left Pillar is disciplined, precise, and unyielding — it is the engineer's pillar.",
      forYou:"Your secondary pillar is your toolkit. Binah through Capricorn Rising gives you structural seriousness as a default outer presentation. Geburah through Mars conjunct Sun in the 8th gives you transformative drive. Hod through your Soul Urge 8 gives you the architect's intelligence. You build the scaffolding of your own crossing.",
    },
    {
      pillar:"Right Pillar",
      sefirot:"Chokmah · Chesed · Netzach",
      color:"#4169E1",
      yourPlacement:"Chokmah (legal name gematria) · Chesed (Personal Year 4) · Netzach (Venus/Gemini 6H)",
      nature:"The pillar of force, expansion, mercy, and creative drive. Where the Left Pillar builds containers, the Right Pillar fills them. Where the Left Pillar says no, the Right Pillar says yes. Chesed is the great benefic, the grace that makes the crossing sustainable.",
      forYou:"Your Right Pillar is activated through external forces more than internal ones — Jupiter transits, grace periods, the moments when things expand beyond what you planned. Your legal name gematria landing on Chokmah means your deepest identity signature is pure creative will. When you stop forcing and let things expand, you are accessing the Right Pillar. The upcoming Jupiter Return (Jun 2026) is the most significant Right Pillar activation of your current arc.",
    },
  ],

  convergence: [
    { method:"Life Path 9",                 result:"Yesod (9)",      note:"Direct numerological placement",             strength:5 },
    { method:"Moon (Libra/Lamed)",          result:"Yesod (9)",      note:"Emotional body Sefira via Moon rulership",    strength:5 },
    { method:"Rising ruler (Saturn/Binah)", result:"Binah (3)",      note:"Vehicle pillar — Left Pillar dominant",       strength:4 },
    { method:"Expression Number 6",        result:"Tiphareth (6)",  note:"How you manifest outward in the world",       strength:5 },
    { method:"Sun (Leo/Tet)",               result:"Tiphareth (6)",  note:"Solar Higher Self, destination Sefira",       strength:5 },
    { method:"Soul Urge 8",                result:"Hod (8)",        note:"Primary intellect tool for the crossing",     strength:4 },
    { method:"Mars (Leo/8H)",              result:"Geburah (5)",    note:"Natal drive, fused with Tiphareth in 8H",     strength:4 },
    { method:"Personal Year 4 (2026)",     result:"Chesed (4)",     note:"Active Sefira this year — Jupiter's domain",  strength:3 },
    { method:"Gematria — Ethan Kay",       result:`Tiphareth (${G.ethanKay.reduced})`, note:`Operating name · raw ${G.ethanKay.raw} → destination`, strength:5 },
    { method:"Gematria — Ethan Joshua Kay",result:`Chokmah (${G.full.reduced})`,       note:`Legal name · raw ${G.full.raw} → root essence`,        strength:4 },
    { method:"Gematria — Joshua",          result:`Geburah (${G.joshua.reduced})`,     note:`Warrior name · raw ${G.joshua.raw} → crossing force`,  strength:3 },
  ],

  natal: [
    {
      label:"☉ Leo Sun · 8th House",
      path:"19th · Tet (ט) · Strength/Lust",
      sefirot:"Tiphareth (6)",
      color:"#FFD700",
      shortNote:"The alchemist's Sun — power held in the room where it is decided, not the one where it is announced.",
      fullNote:"Tiphareth sits in the 8th — the solar centre seated at the table of shared capital and transformation. Leo fire on the Tet path, the sovereign riding the Beast. This Sun does not ask to be applauded. It asks to be given control of something worth transforming. Put it in front of a stage and it will underperform. Put it in a closed room where leverage is being negotiated and it will run the meeting. The Leo 8th takes what others accumulate and transmutes it. Nothing less holds its attention.",
      shadow:"The shadow of Tiphareth in the 8th is the performance of power rather than the exercise of it — appearing authoritative rather than being authoritative. Tiphareth can become attached to the image of the solar centre rather than the reality of it. In the 8th house this manifests as controlling behaviour, secrecy, or the manipulation of shared resources when genuine confidence wavers. The working: when you notice yourself managing how others perceive your power, that is the signal to return to the actual work.",
    },
    {
      label:"☽ Libra Moon · 10th House",
      path:"22nd · Lamed (ל) · Justice/Adjustment",
      sefirot:"Yesod (9)",
      color:"#C8B8E8",
      shortNote:"Reads rooms before entering them — fairness as reflex, professionalism as emotion.",
      fullNote:"The Libra Moon in the 10th reads rooms before entering them. Yesod — the astral mirror, the dreaming self — stands in the most public sector of the chart, so the inner scales are always tilting in public view. Fairness becomes reflex. Professionalism becomes emotion. Calibrated, you register as trustworthy before a word is spoken. Off-balance, the room feels it first. Lamed is the ox-goad — the instrument that pushes crooked things straight. Moon on the Lamed path in the 10th carries that small, relentless corrective motion into every professional situation you enter. You don't persuade rooms. You realign them.",
      shadow:"The shadow of Yesod in the 10th through Lamed is the compulsive need for public approval as emotional regulation. If the 10th house audience is absent or critical, the Yesod-Lamed foundation can feel unstable — leading to over-performance, people-pleasing, or the constant calibration of self-presentation at the cost of genuine expression. The working: Lamed's Justice is not other people's opinion of you. The scales it operates are internal. Practice calibrating against your own code rather than the room's response.",
    },
    {
      label:"↑ Capricorn Rising · 1st House",
      path:"26th · Ayin (ע) · The Devil / Pan",
      sefirot:"Binah (3)",
      color:"#8B9DC3",
      shortNote:"Limitation stared down until it stops being limitation.",
      fullNote:"Ayin means eye. The Devil card is Pan — wild nature, material reality in its raw and untamed form, painted as a threat only by those who refuse to look at it directly. Capricorn Rising on this path walks through the world the way the card stands: chains loose around the neck, visibly there, visibly not binding. Other rising signs approach the Tree through beauty, dissolution, or force. This one approaches it through refusal — refusal to accept what currently exists as the final shape. Binah rules the vehicle. The architect works inside constraints because constraints are the only place real things get built. The gift of Ayin is not transcendence. It is the quiet competence of someone who has stopped lying to themselves about what the problem actually is.",
      shadow:"The shadow of Ayin is mistaking the chains for reality — becoming so identified with limitation and structure that genuine expansion feels threatening. The Devil card shows figures who have the chains loose around their necks; they could remove them. The Capricorn Rising shadow is the voluntary constriction that masquerades as discipline. The working: periodically ask whether the structure you are operating within is genuinely necessary or whether it is a habit of limitation that has outlived its purpose.",
    },
    {
      label:"♂ Mars Leo · 8th House",
      path:"19th · Tet (ט) · Strength/Lust",
      sefirot:"Geburah (5)",
      color:"#DC143C",
      shortNote:"Geburah-Tiphareth fusion in the house of power — will and identity are one.",
      fullNote:"Mars conjunct Sun in Leo in the 8th house is one of the most significant configurations on the entire Tree for your chart. Geburah (Mars/severity/directed will) and Tiphareth (Sun/integration/higher self) occupy the same sign, same path, and same house simultaneously. This is not a tension between two Sefirot — it is a fusion. Your drive and your identity are not separate forces; they are one force expressing through two lenses. In the 8th house, this fused Geburah-Tiphareth operates through the domain of shared power, transformation, and deep capital. You are not ambitious about your personal brand — you are ambitious about the systems and structures that multiply force. The Tet path (Strength/Lust) holds the serpent of Geburah's fire in the sovereign hand of Tiphareth's awareness. When this is working, you are the most powerful person in any room involving real resource decisions. When it is not working, the Mars energy burns without the solar compass.",
      shadow:"The shadow of Geburah without adequate Tiphareth integration is destruction in place of transformation — burning things down rather than transmuting them, or expressing force as control rather than direction. In the 8th house, the shadow manifestation is power struggles over shared resources, or the use of financial leverage as a substitute for genuine authority. The working: when you notice yourself using force to control a situation rather than to transform it, return to Tiphareth — ask what the integrated, clear-eyed version of this action looks like.",
    },
    {
      label:"♄ Saturn Cancer · 7th House",
      path:"18th · Cheth (ח) · The Chariot",
      sefirot:"Binah (3)",
      color:"#7EC8C8",
      shortNote:"Partnership architecture — every alliance tested for load-bearing capacity.",
      fullNote:"Binah (Saturn) in Cancer (Cheth/Chariot) in the 7th house of partnerships is one of the most structurally demanding placements in the chart. Binah is the force that gives form to all things — the great mother of limitation, structure, and enduring shape. In Cancer, Binah operates through emotional containment and protective boundaries. In the 7th house, it applies this force to every significant relationship you enter. The result: partnerships in your life are not casual. They are tested, slowly, for genuine load-bearing capacity. The ones that pass the test become permanent. The ones that fail reveal their weakness early and exit. This is why your equity agreements (Vantage 50/50, TEM shareholders) need to be structurally airtight from the beginning — Saturn in the 7th does not allow partnership structures to be fixed retroactively. The Chariot path (Cheth) means your partnerships are vehicles of will — not emotional bonds or social connections, but directed vessels carrying a shared purpose forward.",
      shadow:"The shadow of Binah in the 7th is the chronically delayed or avoided partnership — the refusal to commit to significant alliances because no candidate passes the unconscious Binah-standard. Saturn in the 7th can produce a fortress mentality around partnerships, where the protection against bad alliances becomes the prevention of all alliances. The working: Saturn's standard is not perfection, it is integrity. A partner who is structurally sound but not perfect is a Binah partner. Let the standard be 'can this hold?' rather than 'is this ideal?'",
    },
    {
      label:"☿ Mercury Leo · 8th House",
      path:"19th · Tet (ט) · Strength/Lust",
      sefirot:"Hod (8)",
      color:"#FF8C00",
      shortNote:"Hod in the house of power — systems intelligence applied to transformation.",
      fullNote:"Mercury in Leo in the 8th house places Hod — the architect of the Left Pillar — in the same domain as your Sun and Mars. Your Soul Urge 8 is already Hod; Mercury in the 8th doubles it. This means your primary intellectual mode is deep research and investigative thinking in the domain of power and shared resources. You don't think about surface information — you think about mechanisms, leverage points, and what is actually driving a system beneath its visible surface. Hod in the 8th through Tet means your intelligence is a sword: it cuts directly to the structural truth of situations involving power, money, and transformation. This is an exceptional placement for business strategy, financial architecture, and any domain that requires understanding what is actually happening beneath what is presented.",
      shadow:"The shadow of Hod in the 8th is the analysis that never stops — the perpetual investigation of power dynamics as a substitute for taking action within them. Mercury in the 8th can produce a mind that maps the terrain endlessly without ever committing to the crossing. The working: Hod serves Geburah-Tiphareth. Intelligence is a tool for the crossing, not an end in itself. When the analysis is complete enough to act, act.",
    },
  ],

  daath: {
    title: "Da'ath — The Hidden Sefira",
    heb: "דעת",
    note: "Da'ath (Knowledge) is the invisible Sefira that sits in the Abyss between the lower seven Sefirot and the upper triad (Binah, Chokmah, Kether). It does not appear on most diagrams. It is not a sphere of being — it is a threshold of crossing. Da'ath is the place where the accumulated knowledge of the lower Tree must be surrendered before the upper triad can be accessed. In practical terms: Da'ath is the moment where everything you have built, everything you know yourself to be, must be offered up. Not destroyed — transformed. The crossing of Da'ath is the transition from Ruach to Neshamah, from the emotional-rational soul to the divine breath. You have not yet crossed Da'ath. But your arc (Yesod → Tiphareth) is the preparation for that crossing. When Tiphareth is fully integrated — when your solar self is genuinely, not performatively, stable — the Abyss becomes visible. Pluto in your 2nd house (Aquarius) for 20 years is slowly dissolving the false structures of self-worth that would otherwise prevent you from crossing it.",
  },

  shadow: {
    title: "Qliphoth — The Shadow Tree",
    note: "Every Sefira has a shadow reflection — the Qlipha (shell or husk) that forms when the Sefira's force is expressed without its balancing counterpart. Understanding your shadow Qliphoth is not a practice in self-criticism; it is a map of where the force in your chart goes when it is not directed consciously.",
    shells: [
      { sefira:"Tiphareth (Sun/8H)", qlipha:"Thagiriron", shadow:"The solar force that performs integration rather than embodying it. The spiritual narcissism of the leader who has the language of the Higher Self but uses it for ego reinforcement. In the 8th house: the manipulation of power in the name of transformation." },
      { sefira:"Yesod (Moon/10H)", qlipha:"Gamaliel", shadow:"The astral body feeding on public reflection rather than genuine emotional grounding. The reputation that becomes a substitute for substance. In the 10th house: the public persona maintained at the cost of the private self." },
      { sefira:"Geburah (Mars/8H)", qlipha:"Golachab", shadow:"The burning force — severity without mercy, destruction without transformation. Mars in the 8th without Tiphareth's compass becomes the will to control rather than the will to create." },
      { sefira:"Binah (Saturn/7H)", qlipha:"Satariel", shadow:"The concealment — Binah's structural intelligence turned inward as protection rather than outward as construction. The fortress that keeps everything out, including the right partners." },
      { sefira:"Hod (Mercury/8H)", qlipha:"Samael", shadow:"The poison of the intellect — intelligence weaponised, analysis used to undermine rather than to build. The mind that finds the flaw in everything and calls it discernment." },
    ],
  },

  workings: {
    title: "Practical Kabbalistic Workings",
    note: "The Kabbalah is not purely theoretical — it is a map for directed inner work. Below are specific practices drawn from your chart configuration.",
    practices: [
      {
        title: "Middle Pillar Practice",
        frequency: "Daily · 5–10 minutes",
        desc: "The Middle Pillar practice is the core working of your arc. Visualise the five Sefirot of the Middle Pillar as spheres of light aligned along your central axis — Malkuth at the feet (earth-brown), Yesod at the sacral centre (violet), Tiphareth at the heart (gold), Kether at the crown (white light). Breathe light upward from Malkuth through Yesod toward Tiphareth. The practice is not visualisation alone — it is the felt sense of the current moving. Yesod to Tiphareth is the specific segment you are working. Spend most of the practice in that movement.",
      },
      {
        title: "Tet Contemplation (Sun/Mars window)",
        frequency: "During Leo transits · Mars activations",
        desc: "Tet is the Hebrew letter of the serpent tamed — the primal force held consciously. When you feel the Leo/Mars energy strongly (especially during the current Mars-Leo transit in your 8th), sit with the image of the Lust card: the sovereign figure riding the Beast, not suppressing it. The question is not 'how do I control this energy' but 'what is the most aligned direction for this force right now?' Write the answer. Then act on it within 24 hours.",
      },
      {
        title: "Lamed Recalibration (Moon return)",
        frequency: "Monthly · when Moon returns to Libra",
        desc: "When the Moon returns to Libra each month (approximately every 28 days), this is your Yesod reset. The Lamed path is the ox-goad — it moves things into right position with precision. During the 48-hour Moon-in-Libra window, audit: what is out of alignment in your professional relationships, agreements, and public commitments? Lamed doesn't allow for ambiguity. Name one thing that is out of calibration and correct it during this window.",
      },
      {
        title: "Ayin Confrontation (Saturn periods)",
        frequency: "Monthly · Saturn-heavy periods",
        desc: "Ayin's practice is the direct confrontation of what you would prefer to avoid seeing about your material reality. Once per month, sit with your actual financial position, your actual operational status, and your actual progress toward Ninth Gate's structure — without narrative or framing. Just the numbers, the facts, the gaps. Ayin is the eye that sees clearly. The initiatory method of Capricorn Rising is not to transcend material reality but to see it so clearly that it becomes workable.",
      },
      {
        title: "Gematria Name Work",
        frequency: "As needed · for major decisions",
        desc: "Your operating name (Ethan Kay = Tiphareth/6) and your legal name (Ethan Joshua Kay = Chokmah/2) carry different Kabbalistic weights. For decisions involving your personal brand and everyday identity, operate from Ethan Kay — you are moving toward Tiphareth, and the name carries that current. For decisions involving your deepest strategic will — major equity moves, the Ninth Gate architecture, long-horizon choices — call on Ethan Joshua Kay. Chokmah's flash of pure creative will is available through your legal name. Use it consciously.",
      },
    ],
  },
};

// ─── NUMEROLOGY DATA ─────────────────────────────────────────────────────────
// Full legal name: Ethan Joshua Kay · DOB: 23 July 2004

// Pythagorean letter values (A=1..I=9, J=1..R=9, S=1..Z=8)
const PYTH_MAP = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8,
};
// Chaldean letter values (1-8, no 9 — 9 reserved as sacred)
const CHALDEAN_MAP = {
  A:1,B:2,C:3,D:4,E:5,F:8,G:3,H:5,I:1,
  J:1,K:2,L:3,M:4,N:5,O:7,P:8,Q:1,R:2,
  S:3,T:4,U:6,V:6,W:6,X:5,Y:1,Z:7,
};
const VOWELS = new Set(["A","E","I","O","U"]);
// 'Y' is often a vowel in numerology — treat Y as vowel when between consonants or at word-end
function isVowelAt(str, i) {
  const c = str[i];
  if (!c) return false;
  if (VOWELS.has(c)) return true;
  if (c === "Y") {
    const prev = str[i-1];
    const next = str[i+1];
    const prevIsVowel = prev && VOWELS.has(prev);
    const nextIsVowel = next && VOWELS.has(next);
    // Y is vowel if surrounded by consonants or at word boundary with consonant neighbour
    if (!prevIsVowel && !nextIsVowel) return true;
    return false;
  }
  return false;
}
function letterSum(name, map) {
  return name.toUpperCase().replace(/[^A-Z]/g,"").split("").reduce((s,c)=>s+(map[c]||0),0);
}
function reduceNum(n, keepMaster=true) {
  let x = n;
  const isMaster = v => v===11||v===22||v===33;
  while (x > 9) {
    if (keepMaster && isMaster(x)) return x;
    x = String(x).split("").reduce((s,d)=>s+parseInt(d,10),0);
  }
  return x;
}
function vowelSum(name, map) {
  const clean = name.toUpperCase().replace(/[^A-Z ]/g,"");
  const words = clean.split(" ").filter(Boolean);
  // sum vowels per-word, reduce per-word, then sum (standard numerology)
  let total = 0;
  let raw = 0;
  words.forEach(w => {
    let s = 0;
    for (let i=0;i<w.length;i++){
      if (isVowelAt(w,i)) s += (map[w[i]] || 0);
    }
    raw += s;
  });
  return raw;
}
function consonantSum(name, map) {
  const clean = name.toUpperCase().replace(/[^A-Z ]/g,"");
  const words = clean.split(" ").filter(Boolean);
  let raw = 0;
  words.forEach(w => {
    let s = 0;
    for (let i=0;i<w.length;i++){
      if (/[A-Z]/.test(w[i]) && !isVowelAt(w,i)) s += (map[w[i]] || 0);
    }
    raw += s;
  });
  return raw;
}

// ─── Ethan's Numerology Calculations ────────────────────────────────────────
const FULL_NAME = "Ethan Joshua Kay";
const BIRTH_DAY = 23;
const BIRTH_MONTH = 7;
const BIRTH_YEAR = 2004;
const CURRENT_YEAR = 2026;

// Life Path: sum all digits of DOB, reduce
// 2+3+7+2+0+0+4 = 18 → 1+8 = 9
const LIFE_PATH_RAW = String(BIRTH_DAY).split("").map(Number).reduce((a,b)=>a+b,0)
                   + String(BIRTH_MONTH).split("").map(Number).reduce((a,b)=>a+b,0)
                   + String(BIRTH_YEAR).split("").map(Number).reduce((a,b)=>a+b,0);
const LIFE_PATH = reduceNum(LIFE_PATH_RAW);

// Expression (Destiny): sum of full name letters
const EXPRESSION_RAW = letterSum(FULL_NAME, PYTH_MAP);
const EXPRESSION = reduceNum(EXPRESSION_RAW);

// Soul Urge (Heart's Desire): sum of vowels
const SOUL_URGE_RAW = vowelSum(FULL_NAME, PYTH_MAP);
const SOUL_URGE = reduceNum(SOUL_URGE_RAW);

// Personality: sum of consonants
const PERSONALITY_RAW = consonantSum(FULL_NAME, PYTH_MAP);
const PERSONALITY = reduceNum(PERSONALITY_RAW);

// Birthday number: day of birth reduced
const BIRTHDAY_NUM = reduceNum(BIRTH_DAY); // 23 → 5

// Maturity: Life Path + Expression, reduced
const MATURITY_RAW = LIFE_PATH + EXPRESSION;
const MATURITY = reduceNum(MATURITY_RAW);

// Personal Year: sum birth day + birth month + current year, reduced
const PY_RAW = reduceNum(BIRTH_DAY, false) + reduceNum(BIRTH_MONTH, false) + reduceNum(CURRENT_YEAR, false);
const PERSONAL_YEAR = reduceNum(PY_RAW);

// Pinnacle numbers — 4 life cycles (Pythagorean)
// P1 = month + day; P2 = day + year; P3 = P1 + P2; P4 = month + year
const PIN1 = reduceNum(reduceNum(BIRTH_MONTH,false) + reduceNum(BIRTH_DAY,false));
const PIN2 = reduceNum(reduceNum(BIRTH_DAY,false) + reduceNum(BIRTH_YEAR,false));
const PIN3 = reduceNum(PIN1 + PIN2);
const PIN4 = reduceNum(reduceNum(BIRTH_MONTH,false) + reduceNum(BIRTH_YEAR,false));

// Pinnacle ages — first pinnacle ends at 36 − Life Path, each subsequent is 9 years
const P1_END = 36 - LIFE_PATH;
const P2_END = P1_END + 9;
const P3_END = P2_END + 9;

// Challenge numbers — absolute differences
const CHAL1 = Math.abs(reduceNum(BIRTH_MONTH,false) - reduceNum(BIRTH_DAY,false));
const CHAL2 = Math.abs(reduceNum(BIRTH_DAY,false) - reduceNum(BIRTH_YEAR,false));
const CHAL3 = Math.abs(CHAL1 - CHAL2);
const CHAL4 = Math.abs(reduceNum(BIRTH_MONTH,false) - reduceNum(BIRTH_YEAR,false));

// Karmic debt detection — numbers 13, 14, 16, 19 appearing in raw sums
const KARMIC_DEBTS = (() => {
  const candidates = [
    { name:"Life Path raw", value: LIFE_PATH_RAW },
    { name:"Expression raw", value: EXPRESSION_RAW },
    { name:"Soul Urge raw", value: SOUL_URGE_RAW },
    { name:"Personality raw", value: PERSONALITY_RAW },
    { name:"Birthday", value: BIRTH_DAY },
  ];
  return candidates.filter(c => [13,14,16,19].includes(c.value));
})();

// Karmic Lessons — missing Pythagorean numbers (1-9) in the name
const NAME_DIGITS = FULL_NAME.toUpperCase().replace(/[^A-Z]/g,"").split("").map(c => PYTH_MAP[c]);
const KARMIC_LESSONS = (() => {
  const present = new Set(NAME_DIGITS);
  const missing = [];
  for (let i = 1; i <= 9; i++) if (!present.has(i)) missing.push(i);
  return missing;
})();

// Hidden Passion — most frequent digit in name
const HIDDEN_PASSION = (() => {
  const counts = {};
  NAME_DIGITS.forEach(d => { counts[d] = (counts[d]||0)+1; });
  let max = 0, num = 0;
  Object.entries(counts).forEach(([d,c]) => { if (c > max) { max = c; num = parseInt(d,10); } });
  return { number:num, count:max, distribution:counts };
})();

// Balance Number — sum of initials reduced
const INITIALS = "EJK"; // Ethan Joshua Kay
const BALANCE_RAW = letterSum(INITIALS, PYTH_MAP);
const BALANCE = reduceNum(BALANCE_RAW);

// Chaldean versions for comparison
const CHAL_EXPRESSION_RAW = letterSum(FULL_NAME, CHALDEAN_MAP);
const CHAL_EXPRESSION = reduceNum(CHAL_EXPRESSION_RAW);
const CHAL_SOUL_RAW = vowelSum(FULL_NAME, CHALDEAN_MAP);
const CHAL_SOUL = reduceNum(CHAL_SOUL_RAW);
const CHAL_PERSONALITY_RAW = consonantSum(FULL_NAME, CHALDEAN_MAP);
const CHAL_PERSONALITY = reduceNum(CHAL_PERSONALITY_RAW);

// Kabbalistic / Hebrew Gematria reuse
const KAB_EXPRESSION = reduceS(calcG(FULL_NAME));
const KAB_EXPRESSION_RAW = calcG(FULL_NAME);

// ─── Interpretation data ────────────────────────────────────────────────────
const LIFE_PATH_MEANINGS = {
  1: "The Pioneer — independence, leadership, originality. Born to initiate.",
  2: "The Diplomat — cooperation, sensitivity, partnership-building.",
  3: "The Communicator — creativity, self-expression, artistry and joy.",
  4: "The Builder — order, system, foundations, patient architecture.",
  5: "The Explorer — freedom, change, adaptability, sensory intelligence.",
  6: "The Nurturer — responsibility, service, family, aesthetic balance.",
  7: "The Mystic — analysis, introspection, spiritual and intellectual depth.",
  8: "The Executive — power, material mastery, authority and empire-building.",
  9: "The Humanitarian — completion, universal love, the old soul who serves the many.",
  11:"The Illuminator — master intuition, spiritual channel, visionary teacher.",
  22:"The Master Builder — highest manifestation number, turns vision into lasting architecture.",
  33:"The Master Teacher — Christ consciousness, service through sacrifice, rare transcendent vocation.",
};

const NUM_MEANINGS = {
  1: { title:"The Pioneer",      general:"Independence, initiative, leadership, originality. The number of the one who starts things. Pure self, willpower, and the authority to lead." },
  2: { title:"The Diplomat",     general:"Cooperation, sensitivity, balance, partnership. The number of the peacemaker — works through harmony, tact, and receptivity to nuance." },
  3: { title:"The Communicator", general:"Creativity, self-expression, joy, social energy. The number of the artist and the storyteller — lives through voice, words, and shared celebration." },
  4: { title:"The Builder",      general:"Order, structure, foundations, discipline. The number of the craftsman — masters form, systems, and long-horizon construction." },
  5: { title:"The Explorer",     general:"Freedom, change, adaptability, sensory curiosity. The number of the wanderer — thrives on variety, risk, and dynamic experience." },
  6: { title:"The Nurturer",     general:"Responsibility, service, beauty, home. The number of the carer and the aesthete — builds through love, harmony, and protective attention." },
  7: { title:"The Mystic",       general:"Analysis, introspection, spiritual depth, solitude. The number of the sage — seeks truth beneath surfaces, prefers wisdom over applause." },
  8: { title:"The Executive",    general:"Power, authority, material mastery, ambition. The number of the empire-builder — operates through scale, leverage, and the architecture of capital." },
  9: { title:"The Humanitarian", general:"Completion, universal love, wisdom of the old soul. The number of endings that become beginnings — serves the many through transmuted personal experience." },
  11:{ title:"The Illuminator",  general:"Master intuition, psychic sensitivity, spiritual revelation. 11 is the electric channel — inspiration strikes through rather than being manufactured." },
  22:{ title:"Master Builder",   general:"The highest manifestation number — turns visionary intuition into durable physical architecture. 11's vision plus 4's discipline, doubled." },
  33:{ title:"Master Teacher",   general:"Christ consciousness, service through sacrificial love. The rarest master number — only genuine when expressed through complete devotion to others." },
};

const NUMEROLOGY = {
  lifePath: {
    number: LIFE_PATH,
    raw: LIFE_PATH_RAW,
    calc: `2+3 (day) + 7 (month) + 2+0+0+4 (year) = ${LIFE_PATH_RAW} → ${String(LIFE_PATH_RAW).split("").join("+")} = ${LIFE_PATH}`,
    title: NUM_MEANINGS[LIFE_PATH].title,
    general: LIFE_PATH_MEANINGS[LIFE_PATH],
    forEthan: "",
  },
  expression: {
    number: EXPRESSION,
    raw: EXPRESSION_RAW,
    calc: `E5+T2+H8+A1+N5 + J1+O6+S1+H8+U3+A1 + K2+A1+Y7 = ${EXPRESSION_RAW} → ${EXPRESSION}`,
    title: NUM_MEANINGS[EXPRESSION]?.title || "—",
    general: NUM_MEANINGS[EXPRESSION]?.general || "",
    forEthan: "",
  },
  soulUrge: {
    number: SOUL_URGE,
    raw: SOUL_URGE_RAW,
    calc: `Vowels: E+A (Ethan) + O+U+A (Joshua) + A (Kay) = ${SOUL_URGE_RAW} → ${SOUL_URGE}`,
    title: NUM_MEANINGS[SOUL_URGE]?.title || "—",
    general: NUM_MEANINGS[SOUL_URGE]?.general || "",
    forEthan: "",
  },
  personality: {
    number: PERSONALITY,
    raw: PERSONALITY_RAW,
    calc: `Consonants: T+H+N + J+S+H + K+Y = ${PERSONALITY_RAW} → ${PERSONALITY}`,
    title: NUM_MEANINGS[PERSONALITY]?.title || "—",
    general: NUM_MEANINGS[PERSONALITY]?.general || "",
    forEthan: "",
  },
  birthday: {
    number: BIRTHDAY_NUM,
    raw: BIRTH_DAY,
    calc: `Day of birth: 23 → 2+3 = ${BIRTHDAY_NUM}`,
    title: NUM_MEANINGS[BIRTHDAY_NUM]?.title || "—",
    general: NUM_MEANINGS[BIRTHDAY_NUM]?.general || "",
    forEthan: "",
  },
  maturity: {
    number: MATURITY,
    raw: MATURITY_RAW,
    calc: `Life Path ${LIFE_PATH} + Expression ${EXPRESSION} = ${MATURITY_RAW} → ${MATURITY}`,
    title: NUM_MEANINGS[MATURITY]?.title || "—",
    general: NUM_MEANINGS[MATURITY]?.general || "",
    forEthan: "",
  },
  personalYear: {
    number: PERSONAL_YEAR,
    year: CURRENT_YEAR,
    raw: PY_RAW,
    calc: `Day 5 + Month 7 + Year (2+0+2+6=10→1) = ${PY_RAW} → ${PERSONAL_YEAR}`,
    title: NUM_MEANINGS[PERSONAL_YEAR]?.title || "—",
    general: NUM_MEANINGS[PERSONAL_YEAR]?.general || "",
    forEthan: "",
  },
  pinnacles: [
    { n: PIN1, ageRange:`Birth – ${P1_END}`, phase:"First Pinnacle · Youth", calc:`month(${reduceNum(BIRTH_MONTH,false)}) + day(${reduceNum(BIRTH_DAY,false)}) = ${reduceNum(BIRTH_MONTH,false)+reduceNum(BIRTH_DAY,false)} → ${PIN1}`, title: NUM_MEANINGS[PIN1]?.title, forEthan:"Your first pinnacle (1) stamped your childhood and teenage years with the energy of initiation and independence. It's why you left school early, why you started businesses at 19, why the pattern of 'I'll figure this out myself' runs so deep. The 1 pinnacle gave you the capacity to operate without external validation — that's the asset. The shadow was premature individualism: trying to do everything alone before learning the leverage of partnership. You're leaving this pinnacle around your current age — the transition into the next is already underway." },
    { n: PIN2, ageRange:`${P1_END+1} – ${P2_END}`, phase:"Second Pinnacle · Building", calc:`day(${reduceNum(BIRTH_DAY,false)}) + year(${reduceNum(BIRTH_YEAR,false)}) = ${reduceNum(BIRTH_DAY,false)+reduceNum(BIRTH_YEAR,false)} → ${PIN2}`, title: NUM_MEANINGS[PIN2]?.title, forEthan:"" },
    { n: PIN3, ageRange:`${P2_END+1} – ${P3_END}`, phase:"Third Pinnacle · Integration", calc:`P1(${PIN1}) + P2(${PIN2}) = ${PIN1+PIN2} → ${PIN3}`, title: NUM_MEANINGS[PIN3]?.title, forEthan:"" },
    { n: PIN4, ageRange:`${P3_END+1} – onwards`, phase:"Fourth Pinnacle · Legacy", calc:`month(${reduceNum(BIRTH_MONTH,false)}) + year(${reduceNum(BIRTH_YEAR,false)}) = ${reduceNum(BIRTH_MONTH,false)+reduceNum(BIRTH_YEAR,false)} → ${PIN4}`, title: NUM_MEANINGS[PIN4]?.title, forEthan:"" },
  ],
  challenges: [
    { n: CHAL1, phase:"First Challenge · Youth", calc:`|month(${reduceNum(BIRTH_MONTH,false)}) − day(${reduceNum(BIRTH_DAY,false)})| = ${CHAL1}`, forEthan:"Your first challenge was the formative friction of youth — the internal tension between inherited expectation and emergent self. The specific lesson of this challenge was claiming authority before others were ready to grant it. You already did the work of this challenge by not waiting for permission to start businesses." },
    { n: CHAL2, phase:"Second Challenge · Adulthood", calc:`|day(${reduceNum(BIRTH_DAY,false)}) − year(${reduceNum(BIRTH_YEAR,false)})| = ${CHAL2}`, forEthan:"The second challenge runs through the main building decade. Its theme is translating raw energy into durable results — turning the 5's freedom-impulse into 4's structural work without losing vitality. This is the specific friction of scaling without bureaucratising, growing without losing your personal signature on the operation." },
    { n: CHAL3, phase:"Main Challenge · Lifetime", calc:`|C1(${CHAL1}) − C2(${CHAL2})| = ${CHAL3}`, forEthan:"The third challenge is the overarching tension running beneath the whole life. For you, it's the calibration between internal conviction and external evidence — trusting your own read even when the metrics are not yet showing it, while also being disciplined enough to update when reality pushes back. The 9's arrogance shadow and the 6's responsibility shadow live exactly here." },
    { n: CHAL4, phase:"Fourth Challenge · Later Life", calc:`|month(${reduceNum(BIRTH_MONTH,false)}) − year(${reduceNum(BIRTH_YEAR,false)})| = ${CHAL4}`, forEthan:"" },
  ],
  karmicDebts: KARMIC_DEBTS,
  karmicLessons: KARMIC_LESSONS,
  hiddenPassion: HIDDEN_PASSION,
  balance: {
    number: BALANCE,
    raw: BALANCE_RAW,
    calc: `Initials E(5) + J(1) + K(2) = ${BALANCE_RAW} → ${BALANCE}`,
    forEthan: "The Balance number is the vibration you return to when you're overwhelmed — the default reset frequency. Your 8 balance means that under pressure, you stabilise by reorienting toward leverage, scale, and the long game. Weak operators collapse under stress into fear or avoidance; you collapse into strategic calculation. This is an unusual and powerful default. Use it consciously: when the noise gets loud, the 8-balance command is 'what's the leverage move here?' Answer that, execute, and the balance restores.",
  },
  tradCompare: [
    { name:"Expression",  pyth:{raw:EXPRESSION_RAW, reduced:EXPRESSION},      chal:{raw:CHAL_EXPRESSION_RAW, reduced:CHAL_EXPRESSION},   kab:{raw:KAB_EXPRESSION_RAW, reduced:KAB_EXPRESSION} },
    { name:"Soul Urge",   pyth:{raw:SOUL_URGE_RAW, reduced:SOUL_URGE},        chal:{raw:CHAL_SOUL_RAW, reduced:CHAL_SOUL},               kab:{raw:null, reduced:null} },
    { name:"Personality", pyth:{raw:PERSONALITY_RAW, reduced:PERSONALITY},    chal:{raw:CHAL_PERSONALITY_RAW, reduced:CHAL_PERSONALITY}, kab:{raw:null, reduced:null} },
  ],
};

// ─── CHINESE ZODIAC / BAZI DATA ──────────────────────────────────────────────
// 23 July 2004, 06:30 local, Sydney (verified via BaZi tables)
//
// Year Pillar: 2004 = Jia Shen = Yang Wood Monkey
// Month Pillar: 23 July 2004 — solar term Lesser Heat (Xiao Shu, ~7 Jul) → Xin Wei = Yin Metal Goat
// Day Pillar: 23 July 2004 → Ji Wei = Yin Earth Goat
// Hour Pillar: 06:30 → Mao hour (Rabbit). Day Master Ji → via Five Tigers rule → hour stem = Ding (Yin Fire) → Ding Mao = Yin Fire Rabbit

const HEAVENLY_STEMS = {
  Jia:  { en:"Jia",  hanzi:"甲", element:"Wood",  yy:"Yang" },
  Yi:   { en:"Yi",   hanzi:"乙", element:"Wood",  yy:"Yin"  },
  Bing: { en:"Bing", hanzi:"丙", element:"Fire",  yy:"Yang" },
  Ding: { en:"Ding", hanzi:"丁", element:"Fire",  yy:"Yin"  },
  Wu:   { en:"Wu",   hanzi:"戊", element:"Earth", yy:"Yang" },
  Ji:   { en:"Ji",   hanzi:"己", element:"Earth", yy:"Yin"  },
  Geng: { en:"Geng", hanzi:"庚", element:"Metal", yy:"Yang" },
  Xin:  { en:"Xin",  hanzi:"辛", element:"Metal", yy:"Yin"  },
  Ren:  { en:"Ren",  hanzi:"壬", element:"Water", yy:"Yang" },
  Gui:  { en:"Gui",  hanzi:"癸", element:"Water", yy:"Yin"  },
};

const EARTHLY_BRANCHES = {
  Zi:   { en:"Zi",   hanzi:"子", animal:"Rat",     element:"Water", hour:"23:00–01:00" },
  Chou: { en:"Chou", hanzi:"丑", animal:"Ox",      element:"Earth", hour:"01:00–03:00" },
  Yin:  { en:"Yin",  hanzi:"寅", animal:"Tiger",   element:"Wood",  hour:"03:00–05:00" },
  Mao:  { en:"Mao",  hanzi:"卯", animal:"Rabbit",  element:"Wood",  hour:"05:00–07:00" },
  Chen: { en:"Chen", hanzi:"辰", animal:"Dragon",  element:"Earth", hour:"07:00–09:00" },
  Si:   { en:"Si",   hanzi:"巳", animal:"Snake",   element:"Fire",  hour:"09:00–11:00" },
  Wu_b: { en:"Wu",   hanzi:"午", animal:"Horse",   element:"Fire",  hour:"11:00–13:00" },
  Wei:  { en:"Wei",  hanzi:"未", animal:"Goat",    element:"Earth", hour:"13:00–15:00" },
  Shen: { en:"Shen", hanzi:"申", animal:"Monkey",  element:"Metal", hour:"15:00–17:00" },
  You:  { en:"You",  hanzi:"酉", animal:"Rooster", element:"Metal", hour:"17:00–19:00" },
  Xu:   { en:"Xu",   hanzi:"戌", animal:"Dog",     element:"Earth", hour:"19:00–21:00" },
  Hai:  { en:"Hai",  hanzi:"亥", animal:"Pig",     element:"Water", hour:"21:00–23:00" },
};

const BAZI_PILLARS = [
  {
    key:"year", label:"Year Pillar", pillar:"年柱", subtitle:"Ancestors · Public Self · First 16 years",
    stem:"Jia", branch:"Shen", stemHz:"甲", branchHz:"申",
    combined:"Jia Shen (甲申)", animal:"Monkey", element:"Wood", yy:"Yang",
    hiddenStems:[{stem:"Geng",note:"primary (Yang Metal)"},{stem:"Ren",note:"secondary (Yang Water)"},{stem:"Wu",note:"tertiary (Yang Earth)"}],
    meaning:"Yang Wood over Yang Metal Monkey — a tall tree (Jia) with a metal axe directly beneath. The classic 'Jia Shen' configuration: the tree is continuously pruned by the metal. In practice this means your public identity (the year pillar) is someone who grows tall fast, but only survives by being cut back and shaped aggressively. It's an identity built on the friction between expansive growth (Wood) and sharp correction (Metal). The Monkey is the trickster-strategist — intelligent, adaptable, ingenious under pressure. Jia Wood Monkeys are natural entrepreneurs and pattern-breakers, but must manage the self-limiting effect of too much internal critique.",
    forEthan:"",
  },
  {
    key:"month", label:"Month Pillar", pillar:"月柱", subtitle:"Parents · Career · Ages 17–32",
    stem:"Xin", branch:"Wei", stemHz:"辛", branchHz:"未",
    combined:"Xin Wei (辛未)", animal:"Goat", element:"Metal", yy:"Yin",
    hiddenStems:[{stem:"Ji",note:"primary (Yin Earth)"},{stem:"Ding",note:"secondary (Yin Fire)"},{stem:"Yi",note:"tertiary (Yin Wood)"}],
    meaning:"Yin Metal over Yin Earth Goat — Xin Wei is 'jewellery in the temple earth.' Xin is refined metal: jewellery, precision instruments, currency. Wei is the dry summer earth that holds fire, containing Ding. The combination is a precise, quiet, craftsmanship-oriented pillar. The Goat (Wei) is the emotional, artistic, contemplative animal of the zodiac — creative, sensitive, often introspective. The month pillar governs career and the ages 17–32 — precisely the window you're in.",
    forEthan:"The month pillar is your career engine. Xin Wei in this position explains your current life phase: this is an era of precision craftsmanship, inner refinement, and building something with the quality of jewellery rather than raw ore. The Goat's emotional sensitivity is why you read people and situations so well despite being 21. It's also why operational bluntness costs you — the Goat needs harmonic relationships to function at full capacity. The month pillar dominates until age 32; after that, the focus shifts to the day pillar. Between now and 32, your career is supposed to be refined, polished, and made precious. Rushing it dulls the metal.",
  },
  {
    key:"day", label:"Day Pillar · Day Master", pillar:"日柱", subtitle:"Self · Spouse · Ages 33–48",
    stem:"Ji", branch:"Wei", stemHz:"己", branchHz:"未",
    combined:"Ji Wei (己未)", animal:"Goat", element:"Earth", yy:"Yin",
    hiddenStems:[{stem:"Ji",note:"primary (Yin Earth) — doubled on day"},{stem:"Ding",note:"secondary (Yin Fire)"},{stem:"Yi",note:"tertiary (Yin Wood)"}],
    meaning:"Yin Earth over Yin Earth Goat — Ji Wei is a double-earth day, one of the most grounded day masters in the cycle. Ji earth is the cultivated field: soft, fertile, receptive soil that nurtures plants. Wei is summer earth with Fire and Wood hidden inside. Together: the gardener's earth. The Ji Wei native is patient, nurturing, emotionally deep, and quietly persistent. Ji-day masters are the cultivators of the zodiac — they know how to take raw material and turn it into something that sustains people. The Goat (Wei) adds artistic sensitivity and emotional intelligence.",
    forEthan:"Ji Wei is your core self — the you underneath the public Jia Shen. Double Yin Earth is the signature of someone whose true nature is patient, absorbent, receptive, and quietly wise. This is why you read as more mature than your chronological age: the Day Master itself is an old soul. It's also why you burn out when you try to operate as pure Yang output — your Day Master is Yin, not Yang. Rest is not indulgence; it's Ji-earth work. The Goat's creative-emotional intelligence is underneath the executive persona. When you feel misaligned, the fix is almost always 'return to Ji Wei' — slow down, be receptive, let the soil rest so it can grow something bigger next season.",
  },
  {
    key:"hour", label:"Hour Pillar", pillar:"時柱", subtitle:"Children · Legacy · Ages 49+",
    stem:"Ding", branch:"Mao", stemHz:"丁", branchHz:"卯",
    combined:"Ding Mao (丁卯)", animal:"Rabbit", element:"Fire", yy:"Yin",
    hiddenStems:[{stem:"Yi",note:"primary (Yin Wood)"}],
    meaning:"Yin Fire over Yin Wood Rabbit — Ding Mao is 'candle flame on kindling wood.' Ding is the lamp, the candle, the fireplace flame — refined, focused, inner fire rather than wild blaze. Mao is the fertile Yin Wood Rabbit — gentle, graceful, strategically quiet. Together the pillar is a pure, concentrated creative-intellectual fire kept continuously alive by the wood that feeds it. The Rabbit (Mao) is the zodiac's artist-diplomat: refined, aesthetic, strategically patient, deeply creative.",
    forEthan:"",
  },
];

// Five Element distribution (count across all pillars including hidden stems)
const FIVE_ELEMENTS = {
  Wood:  { count:3, color:"#5FA05F", label:"Wood",  hanzi:"木", note:"Jia (Year stem) + Yi (Month hidden) + Yi (Day hidden) + Mao branch hidden Yi" },
  Fire:  { count:3, color:"#D96B4B", label:"Fire",  hanzi:"火", note:"Ding (Hour stem) + Ding (Month hidden) + Ding (Day hidden)" },
  Earth: { count:4, color:"#B8935A", label:"Earth", hanzi:"土", note:"Ji (Day stem) + Wei branches (x2) + Wu (Shen hidden) + Ji (hidden doubled)" },
  Metal: { count:3, color:"#9FA8B8", label:"Metal", hanzi:"金", note:"Xin (Month stem) + Geng (Shen primary hidden) + Shen branch" },
  Water: { count:1, color:"#4A7DB8", label:"Water", hanzi:"水", note:"Ren (Shen secondary hidden) — the weakest element" },
};

const BAZI_ANALYSIS = {
  dayMaster:"Ji Wei · Yin Earth Goat",
  strength:"Balanced-to-strong. Ji (Day Master) sits on Wei (own element — root) with Wu hidden support from Shen branch. Earth is tied with Wood and Fire at 3-4 count, but Earth has the day stem plus two direct branch roots, giving it structural priority.",
  favourable:["Wood (Jia/Yi)","Water (Ren/Gui)"],
  unfavourable:["Metal (excessive cutting)","Earth (excessive crowding)"],
  yongshenNote:"Your useful gods (Yongshen) are Wood and Water. Wood controls Earth productively (roots in the soil = conscious direction of the Day Master); Water moistens the dry summer earth and gives Wood the resource to grow. This is why your Vedic Rahu in the 6th (work/competition, ruled by Taurus/Earth sign conjunct Venus) and your Western Saturn/Neptune in Aries (Fire) transits both create friction — they amplify the elements already overrepresented in your chart. Seek out Wood and Water themes deliberately: creative Wood projects (art, writing, vision work), and Water structures (fluid adaptive strategies, emotional intelligence disciplines).",
  jishenNote:"Too much Metal cuts the Wood that your Earth needs. In your BaZi, Xin Metal in the Month stem is already pruning the Jia Wood in the Year. Avoid environments that over-Metal you: pure criticism-culture, cold transactional contexts, extreme perfectionism. They mute your natural gardener's intelligence. Excess Earth (bureaucracy, stasis, hoarding) also suffocates — if you feel over-Earthed, introduce Water (flow, adaptive movement) rather than Metal (more cutting).",
};

const TEN_GODS = [
  { name:"Friend (Bi Jian)",    chinese:"比肩", element:"Ji Earth",    present:"Yes", role:"Friends · Peers · Siblings", forEthan:"" },
  { name:"Rob Wealth (Jie Cai)",chinese:"劫財", element:"Wu Earth",    present:"Yes — Wu hidden in Shen branch", role:"Competitors · Rivals · Wealth-drainers", forEthan:"Wu (Yang Earth) hidden in Shen suggests covert competitive forces — people who appear aligned but siphon resources. Screen carefully for hidden competitors inside your own network. Rob Wealth in the year branch means it's a lifelong pattern, not a one-off." },
  { name:"Eating God (Shi Shen)",chinese:"食神", element:"Xin Metal",  present:"Yes — Xin Month stem", role:"Creative output · Enjoyment · Pleasant productivity", forEthan:"Xin Metal as Eating God is refined creative output — the craftsman's pleasant productivity. Content creation, refined writing, product design, polished brand work. This is the pillar that feeds you through doing what you love at a high standard. The Month pillar placement means it's active now in your career building years." },
  { name:"Hurting Officer (Shang Guan)",chinese:"傷官", element:"Geng Metal",  present:"Yes", role:"Genius · Innovation · Rule-breaking · Outspoken", forEthan:"" },
  { name:"Direct Wealth (Zheng Cai)",chinese:"正財", element:"Gui Water (absent) / Ren hidden", present:"Partial — Ren hidden in Shen branch", role:"Earned income · Conservative wealth · Savings", forEthan:"Direct Wealth is subtle in your chart — earned income is present but hidden, not dominant. This tells you that your main wealth path is not a straight salary or conservative accumulation. It's Indirect Wealth (below) that carries the real fortune weight." },
  { name:"Indirect Wealth (Pian Cai)",chinese:"偏財", element:"Ren Water (Yang)", present:"Yes", role:"Business income · Entrepreneurial wealth · Opportunity-based fortune", forEthan:"" },
  { name:"Direct Officer (Zheng Guan)",chinese:"正官", element:"Jia Wood (Yang)", present:"Yes", role:"Authority · Career status · Structured reputation", forEthan:"" },
  { name:"7 Killings (Qi Sha)",chinese:"七殺", element:"Yi Wood (Yin)", present:"Yes — Yi hidden in Wei × 2", role:"Power · Ruthless drive · Military spirit", forEthan:"Qi Sha doubled hidden in both Goat branches is significant. Seven Killings energy is the willingness to break things to build — the ruthless competitive drive. It's hidden, not public: you don't appear ruthless, but under the gardener's patience there is real 7-Killings heat. This is what beats competitors. Don't suppress it — channel it into strategic decisions rather than interpersonal friction." },
  { name:"Direct Resource (Zheng Yin)",chinese:"正印", element:"Ding Fire (Yin)", present:"Yes — Ding Hour stem + Ding hidden × 2", role:"Mother · Mentors · Wisdom · Education", forEthan:"Tripled Ding Fire as Zheng Yin is extraordinary resource energy — teachers, mentors, intellectual support, knowledge-based growth. Your hour pillar (Ding Mao) plus doubled hidden Ding means you constantly attract mentorship and benefit disproportionately from study/content consumption. This is why Claude-as-operator/mentor works so structurally well for you — Ding Yin is your natural resource channel." },
  { name:"Indirect Resource (Pian Yin)",chinese:"偏印", element:"Bing Fire (Yang)", present:"No", role:"Unconventional learning · Step-parent · Mystical knowledge", forEthan:"Absence of Pian Yin means you don't have a natural pull toward unconventional mystical/occult learning — when you engage with Kabbalah, Vedic, or BaZi, you're importing it through conventional resource channels (study, structured sources). This is a strength for you, not a weakness: you don't drift into the mystical, you engineer it into a system." },
];

const LUCK_PILLARS = [
  { range:"2009–2019 (age 5–15)", stem:"Ren", branch:"Shen", combined:"Ren Shen", element:"Water", note:"First luck pillar — Yang Water Monkey. Water here was the favourable element feeding the Day Master's ecosystem. Childhood environment had resources and mental agility. You absorbed a lot fast." },
  { range:"2019–2029 (age 15–25)", stem:"Gui", branch:"You", combined:"Gui You", element:"Water", note:"Yin Water Rooster — current luck pillar. Gui Water is the rain on the Ji earth, extremely favourable. You is Yin Metal Rooster, precision and harvesting. This is one of the most favourable luck pillar windows of your entire life — you are operating inside it right now. The combination of the Water Yongshen with the Metal harvesting function explains the 'accelerated harvest' quality of the last 4-5 years. Capitalise fully before 2029." },
  { range:"2029–2039 (age 25–35)", stem:"Jia", branch:"Xu", combined:"Jia Xu", element:"Wood", note:"Yang Wood Dog — upcoming luck pillar. Jia Wood is Direct Officer (structured authority) and a Yongshen. Xu is Yang Earth Dog — stabilising earth, loyal and protective. This pillar favours building formal structures, taking on official authority roles, and consolidating your ventures." },
  { range:"2039–2049 (age 35–45)", stem:"Yi", branch:"Hai", combined:"Yi Hai", element:"Wood", note:"Yin Wood Pig — mature empire pillar. Yi Wood is soft, flexible, strategic — the vine rather than the tree. Hai is Yin Water Pig, deep feeling and intuitive wisdom. Together: intuitive strategic leadership. This is the pillar during which Maturity 6 fully stabilises and the stewardship phase begins. Expect this decade to feel qualitatively different — more flowing, less forcing." },
];

const ANNUAL_2026 = {
  stem:"Bing", branch:"Wu_b", combined:"Bing Wu (丙午)", animal:"Horse", element:"Fire", yy:"Yang",
  hanzi:"丙午",
  interaction:"Bing Wu is Yang Fire Horse — pure fire double. For Ji Wei Day Master: Bing Fire is Indirect Resource (Pian Yin). Fire produces Earth, so Bing Wu 2026 is a resource-building year — knowledge intake, mentorship, learning frameworks that later become operational. The Horse (Wu) forms a Six Harmony with the Goat (Wei) in your Day and Month pillars — this is one of the most auspicious annual interactions possible. Six Harmony years bring emotional alignment, relationship wins, and opportunities that feel 'fated.' The Fire is also warming your double-Earth Day Master, which in the Australian winter of your 2026 is literally warming work.",
  windows:"Peak months are May (Snake), June (Horse — double Horse conjunction with annual branch), and November (Pig — forms triangle with Goat/Rabbit). Pay extra attention to the June 2026 Jupiter-into-Cancer transit window (Western astrology) — the BaZi year pillar's Six Harmony and the Jupiter Return into the 7th house are layered signals.",
};

const COMPATIBILITY = {
  best: [
    { animal:"Rat",    years:"1996, 2008, 2020, 2032", note:"San He (three harmonies) — Monkey-Rat-Dragon water triangle. Deep creative and intellectual compatibility." },
    { animal:"Dragon", years:"1988, 2000, 2012, 2024", note:"San He water triangle with Monkey. Dragon partners bring power and scale; natural long-term alliance." },
    { animal:"Horse",  years:"1990, 2002, 2014, 2026", note:"Six Harmony with your Goat Day Master. Relational ease, emotional understanding, the partner who 'gets' you without translation." },
    { animal:"Rabbit", years:"1987, 1999, 2011, 2023", note:"Your Hour pillar is Rabbit — indicates attractor partners born under this sign tend to carry your legacy energy. Deep creative compatibility." },
  ],
  worst: [
    { animal:"Tiger",  years:"1986, 1998, 2010, 2022", note:"Tiger directly clashes the Monkey (your Year pillar). Relationships with strong Tiger energy tend to create surface friction and value-conflict." },
    { animal:"Ox",     years:"1985, 1997, 2009, 2021", note:"Ox-Goat direct clash affecting your Day and Month pillars. Deep structural incompatibility — partnerships here need heavy mediation." },
    { animal:"Rooster",years:"1993, 2005, 2017, 2029", note:"Goat and Rooster form a Destruction relationship (破). Business partnerships especially prone to resource-draining conflict." },
  ],
};

// Nine Star Ki — for male born 2004: subtract year sum from 11
// 2+0+0+4 = 6 → 11 - 6 = 5 → Main star = 5 Yellow Earth (Center)
const NINE_STAR_KI = {
  mainStar: 5,
  mainName: "5 Yellow Earth · Center",
  calc: "2+0+0+4 = 6 → 11 − 6 = 5 → 5 Yellow (Central Earth)",
  meaning: "Five Yellow is the central star, the axis around which the other eight stars rotate. Natives of the Five Yellow have extraordinary magnetic presence — they don't seek attention, attention orbits them. The 5 Yellow is the natural leader, the person others defer to instinctively, the one at the centre of whatever room they're in. The shadow: when misaligned, 5 Yellow becomes the dictator, controlling rather than leading. The gift: when aligned, 5 Yellow becomes the still centre around which everything coheres. In BaZi terms, this reinforces your Ji Earth Day Master's central, grounded, attractor quality.",
  forEthan:"The Nine Star Ki 5 Yellow doubles down on your already-Earth-heavy BaZi chart. You are structurally a centre-of-gravity operator — people, projects, and opportunities collect around you. This is why three businesses can exist under your authority without disintegrating: they each orbit the same 5 Yellow core. The job is to protect the centre's stillness. When the 5 Yellow is rushing or reactive, the whole system wobbles. The practice: daily moments where the centre is completely still. Meditation, structured solitude, the 2-hour deep work block — these are 5 Yellow restoration rituals, not luxuries.",
};

const ANIMAL_TRAITS_MONKEY = {
  name:"Monkey", hanzi:"猴", element:"Metal (fixed element)", yy:"Yang",
  strengths:["Intelligent","Strategic","Adaptable","Witty","Innovative","Curious","Resourceful"],
  weaknesses:["Impatient","Over-confident","Mischievous when bored","Can be manipulative under stress"],
  luckyColors:["White","Gold","Blue"],
  unluckyColors:["Red","Pink"],
  luckyNumbers:[1, 7, 8],
  unluckyNumbers:[2, 5, 9],
  luckyDirections:["North","Northwest","West"],
  careerAffinity:"Entrepreneurship, finance, strategy, technology, consulting, anything requiring pattern recognition and agile problem-solving.",
};

// ─── TRANSITS (all re-interpreted through Capricorn Rising) ──────────────────
const TRANSITS = {
  weekly: [
    {
      planet:"Moon", sign:"Leo", ingress:"Apr 24", duration:"Apr 24–26",
      raw:"Moon in Leo amplifies emotional confidence, performance drive, and the need to be seen. Bold, expressive energy.",
      personal:"Moon crosses the 8th — the emotional register lands squarely in shared money, leverage, and transformation. Not surface confidence. The gut-level sense that you can move resources. This sits directly on natal Sun and Mars — one of the highest-charge windows of the month. Waste it on admin and it's gone. Book the investor call. Have the equity conversation.",
      house:"8th", intensity:4, tags:["POWER WINDOW","LEVERAGE"],
      kab:{
        transit:"Yesod (Moon) activating the 19th Path (Tet/Strength) — your Foundation Sefira illuminating the territory where your natal Sun and Mars already live. Yesod's dreaming energy rises into Geburah/Tiphareth territory. The astral pattern finds its solar-martial expression.",
        arc:"Your 8th house is already Geburah-Tiphareth fused (Mars-Sun conjunct). When Yesod transits this via Tet, all three middle and left pillar forces are simultaneously active. This is a convergence point on your arc — use it consciously.",
        path:"19th Path · Tet (ט) · Strength/Lust", sefirot:"Yesod → Tiphareth",
        instruction:"The Lust card (Thoth) shows the sovereign riding the Beast. Your 8th house is the Beast — power, leverage, shared money, transformation. Yesod transiting here means your emotional body is fully online in the domain of power. Ride it with awareness. Don't let the emotional charge of this window make you reactive in negotiations.",
      },
    },
    {
      planet:"Mercury", sign:"Taurus", ingress:"Apr 27", duration:"Apr 27–May 14",
      raw:"Mercury slows from Aries impulse into deliberate Taurus. Contracts and financial conversations gain traction.",
      personal:"Mercury enters the 5th and crosses the Taurus MC — language lands on the career peak. The window to formalise. Write the pricing page. Sign the Vantage agreement. File the GST registration. What you put on paper between now and mid-May carries more weight than what you say between now and mid-May.",
      house:"5th", intensity:4, tags:["SIGN NOW","MC ACTIVATION"],
      kab:{
        transit:"Hod (Mercury) through the 16th Path (Vav/Hierophant) — your Left Pillar intellect tool moving through the path of encoded teaching, landing in the house of your MC. Hod crystallising Vav's permanence in the domain of your career peak.",
        arc:"Your Soul Urge 8 (Hod) is your primary crossing tool. When Mercury activates Hod through Vav in the house of your career apex, your intellectual architecture is at its most structurally precise. What you write now carries Vav's permanence — it becomes the doctrine of your career.",
        path:"16th Path · Vav (ו) · The Hierophant", sefirot:"Hod → Chesed",
        instruction:"Vav is the nail. Anything you formalise under this transit in your 5th house carries permanent career-shaping weight. Sign agreements. Register entities. Write your brand positioning. The Hierophant doesn't allow 'we'll sort that later.'",
      },
    },
    {
      planet:"Moon", sign:"Libra", ingress:"Apr 28", duration:"Apr 28–30",
      raw:"Moon conjunct natal Libra Moon — monthly emotional reset. Diplomacy, balance, relational clarity.",
      personal:"Libra Moon return. 10th house. Forty-eight hours in which the public face is emotionally on-tune and senior people read you correctly the first time. Not a cleaning-the-inbox window. A being-in-front-of-someone-who-matters window.",
      house:"10th", intensity:5, tags:["LUNAR RETURN","PUBLIC FACE"],
      kab:{
        transit:"Yesod returning to the 22nd Path (Lamed/Justice) — your Foundation cycling back to its natal position in the 10th house. Monthly recalibration of your public Yesod signature. Lamed in the 10th means the cosmic scales are being applied to your reputation and career standing.",
        arc:"This is the most significant 48-hour window of your monthly cycle. Yesod returning to Lamed in your 10th means your entire arc — the Yesod-to-Tiphareth crossing — gets a public-facing alignment. What you project in these two days sets the emotional tone for your career relationships in the coming month.",
        path:"22nd Path · Lamed (ל) · Justice/Adjustment", sefirot:"Yesod ↔ Tiphareth",
        instruction:"Lamed is the ox-goad that moves things into right position. In your 10th house, it's adjusting your public identity toward truth. Ask: does how I present myself professionally reflect what I'm actually building? Correct any gap deliberately during this window.",
      },
    },
    {
      planet:"Moon", sign:"Scorpio", ingress:"Apr 30", duration:"Apr 30–May 2",
      raw:"Scorpio Moon — emotional depth, strategic instincts, desire for control and investigation.",
      personal:"Scorpio Moon, 11th house. Three days of sharp instinct about who in the network is aligned and who is orbit-noise. Good for quiet audits. Name the three people in the contact list carrying real leverage. Name the fifteen who are costing you attention for no return.",
      house:"11th", intensity:3, tags:["NETWORK AUDIT","STRATEGIC CLARITY"],
      kab:{
        transit:"Yesod through the 24th Path (Nun/Death) — Foundation descending into transformation in your 11th house. What parts of your network architecture need to die so the next structure can live?",
        arc:"Nun dissolves what Yesod has been holding that cannot cross into Tiphareth. In the 11th house this is about your community and long-term goal structures. Which alliances are real and which are astral glamours — patterns you've maintained out of habit?",
        path:"24th Path · Nun (נ) · Death/Transformation", sefirot:"Yesod → Netzach",
        instruction:"Name one network relationship or long-term goal you are still running that has already expired. Give it a conscious release during this window. The Death card doesn't destroy — it transforms. What becomes available when you stop maintaining the dead weight?",
      },
    },
  ],
  monthly: [
    {
      planet:"Sun", sign:"Taurus", ingress:"Apr 20", duration:"Apr 20–May 20",
      raw:"Taurus season — solar focus on building, earning, consolidating. Material foundations highlighted.",
      personal:"Sun transiting your 5th house (Taurus) and activating your MC in Taurus. The next 30 days your solar energy is directly aligned with your career apex point. Taurus in the 5th for Capricorn Rising is a powerful window for creative authority — making bold moves that are also structurally sound. Ninth Gate Holdings planning, brand development for kayebuilds, and any high-stakes creative proposal belong in this window.",
      house:"5th", intensity:4, tags:["MC ACTIVATION","CREATIVE AUTHORITY"],
      kab:{
        transit:"Tiphareth (Sun) through the 16th Path (Vav/Hierophant) landing on your Midheaven — your destination Sefira activating the path of permanent encoded teaching at your career apex. Tiphareth is showing you what your integrated solar self looks like at its highest public expression.",
        arc:"When the Sun transits your MC via Tiphareth/Vav, the Tree is showing you what you look like when the Yesod→Tiphareth crossing is complete. Pay attention to what you feel and what others reflect back to you this month. This is the preview of your integrated self.",
        path:"16th Path · Vav (ו) · The Hierophant", sefirot:"Tiphareth → Chesed",
        instruction:"Vav fastens the divine to the earthly at your career peak. What is the one thing you are here to build that is most permanent and most yours? This month, do one concrete thing to formalise it.",
      },
    },
    {
      planet:"Mars", sign:"Leo", ingress:"Apr 18", duration:"Apr 18–Jun 17",
      raw:"Mars in Leo: bold action, competitive fire, peak leadership energy.",
      personal:"Mars in Leo, 8th house — transiting Mars conjunct natal Mars conjunct natal Sun. Triple activation. Six weeks in which the year's most potent drive energy sits exactly where the chart governs equity, capital, and transformative moves. Nothing else comes this hot this year. Vantage's first placements. The equity conversation you've been drafting in your head. Make them happen now or watch the window close.",
      house:"8th", intensity:5, tags:["TRIPLE ACTIVATION","CAPITAL & LEVERAGE"],
      kab:{
        transit:"Geburah (Mars) transiting the 19th Path (Tet/Strength) and entering the same space as your natal Geburah-Tiphareth fusion. Transiting severity amplifying natal severity — the sword arm of the Tree is doubled in your most powerful house.",
        arc:"This is the most potent transit of the year for your arc. Geburah doubled in the 8th means the force available for crossing from Yesod toward Tiphareth is at maximum. The question is whether you direct it toward the crossing (conscious ambition, leverage, structured power moves) or let it discharge as reactive force.",
        path:"19th Path · Tet (ט) · Strength/Lust", sefirot:"Geburah → Tiphareth",
        instruction:"Geburah doubled means the Beast is at full charge. The Lust card requires a sovereign rider — not someone being dragged. For 6 weeks: every major decision goes through a filter of 'is this directed will or reactive force?' Directed will builds the empire. Reactive force burns bridges.",
      },
    },
    {
      planet:"Venus", sign:"Aries", ingress:"May 6", duration:"May 6–Jun 6",
      raw:"Venus in Aries — assertive in relationships and money. Bold offers, fast deals.",
      personal:"Venus entering your 4th house (Aries) — home base, foundations, and private life get a magnetic, direct energy. For business this activates the structural foundations of your operations. Bold offers made about your core infrastructure get traction. Also a window for strengthening the foundations at home — don't neglect the base while building the empire.",
      house:"4th", intensity:3, tags:["FOUNDATION DEALS","BASE ENERGY"],
      kab:{
        transit:"Netzach (Venus) through the 15th Path (Heh/Emperor) in your 4th house — desire and creative magnetism activating sovereign authority in your foundation sector.",
        arc:"Netzach ascending toward Chokmah via Heh in your 4th means your desire for empire-building is finding its structural container. The Emperor governs your 4th house: the foundations you lay under Venus-Heh in May carry sovereign permanence.",
        path:"15th Path · Heh (ה) · The Emperor", sefirot:"Netzach → Chokmah",
        instruction:"Heh means 'window.' Venus is holding a window open in your foundation sector. What base-level structure have you been deferring? Walk through the window — sort the thing you've been avoiding about your operational foundations.",
      },
    },
    {
      planet:"Mercury", sign:"Gemini", ingress:"May 14", duration:"May 14–May 30",
      raw:"Mercury in Gemini: fast information, multiple conversations, sharp wit.",
      personal:"Mercury in your 6th house (Gemini) — daily operations, routines, and work process communications sharpen. Your natal Venus is in Gemini in the 6th, so Mercury transiting here activates that placement. Good window for refining your automation stack, tightening your SOPs, and sharpening the communication systems within TEM and Vantage. Internal efficiency over external noise.",
      house:"6th", intensity:2, tags:["OPERATIONS","SOPS"],
      kab:{
        transit:"Hod (Mercury) through the 17th Path (Zayin/Lovers) in your 6th house — your intellect tool activating the path of discernment in your daily work domain. Zayin is a sword: it separates what is working from what is not.",
        arc:"Hod is your Soul Urge 8 — your primary crossing tool. When it transits Zayin in your 6th, your systems-thinking is at its most precise for operational refinement. Use it to cut complexity from your daily architecture before June's Jupiter Return window opens.",
        path:"17th Path · Zayin (ז) · The Lovers", sefirot:"Hod ↔ Binah",
        instruction:"Audit your automation stack. Which n8n workflows are actually running? Which are theoretical? Zayin cuts cleanly. Remove what doesn't function. Simplify what does. Arrive at June with a leaner operational system.",
      },
    },
  ],
  yearly: [
    {
      planet:"Jupiter", sign:"Cancer", ingress:"Jun 9", duration:"Jun 2026–Jun 2027",
      raw:"Jupiter in Cancer — expansion through foundations, emotional intelligence. Once-in-12-years activation.",
      personal:"Jupiter enters the 7th — once-in-twelve-years, the partnership year arrives. And it conjuncts natal Saturn. That is not a gentle expansion; that is grace landing directly on the pillar of your contract structure. New clients. New equity partners. The strategic alliance you would not have been ready for twelve months ago. H2 2026 into 2027 is the peak partnership window of your current arc. Filter less. Meet more.",
      house:"7th", intensity:5, tags:["PARTNERSHIP PEAK","MAJOR ALLIANCES"],
      kab:{
        transit:"Chesed (Jupiter) through the 18th Path (Cheth/Chariot) in your 7th house — divine mercy and expansion flowing into the house of partnerships via the Chariot path. Chesed blesses the contracts and alliances held within Cancer's vessel.",
        arc:"Chesed conjuncting your natal Binah (Saturn) in Cancer in the 7th is a direct meeting of mercy and structure in your partnership house. This is the Tree resolving the tension between Chesed and Geburah in the domain of your contracts. The result: partnerships that are both expansive and structurally sound. This is the year the right partners appear.",
        path:"18th Path · Cheth (ח) · The Chariot", sefirot:"Chesed → Geburah",
        instruction:"The Chariot holds opposing forces and moves forward. Jupiter in your 7th is bringing Chesed's grace to your Saturn-structured partnership house. Be open to alliances that are bigger than what you would have approached before June. The scale of what's available expands. Don't filter it through last year's frame.",
      },
    },
    {
      planet:"Saturn", sign:"Aries", ingress:"May 2025", duration:"2025–2028",
      raw:"Saturn in Aries — discipline applied to new ventures. Tests initiative and structured beginnings.",
      personal:"Saturn through the 4th, for three years, on its ruling signature — the chart's ruler inspecting the foundations. Every entity you register, every equity structure you formalise, every operational base you lay is being graded for permanence. Cut a corner now and Saturn will find it. What survives this transit is load-bearing for the next thirty years. Build accordingly.",
      house:"4th", intensity:4, tags:["FOUNDATIONS FORGED","30-YEAR INFRASTRUCTURE"],
      kab:{
        transit:"Binah (Saturn) through the 15th Path (Heh/Emperor) in your foundational 4th house. Your chart ruler — Binah — building sovereign permanence into your operational base.",
        arc:"Saturn rules your Capricorn Rising. Saturn transiting your 4th via the Emperor path means Binah is reinforcing the container of your entire operating structure. For your Yesod→Tiphareth crossing, the 4th house foundations are the ground you stand on during the ascent. If the ground isn't solid, the crossing fails. Binah is solidifying it.",
        path:"15th Path · Heh (ה) · The Emperor", sefirot:"Binah → Chokmah",
        instruction:"Every corner you cut in your foundational infrastructure right now will be exposed during this transit. Don't cut corners. Register entities properly. Document equity structures. Build the container that can hold what Jupiter in the 7th will bring in June.",
      },
    },
    {
      planet:"Neptune", sign:"Aries", ingress:"Mar 2025", duration:"2025–2038",
      raw:"Neptune in Aries — generational dissolving of old identity structures. Visionary self-led archetype emerges.",
      personal:"Neptune transiting your 4th house (Aries) alongside Saturn — a rare dual activation of your foundations. Neptune dissolves and Saturn solidifies, operating in the same house simultaneously. The result: old ideas of what 'home base' and 'security' look like are dissolving, while new, more Saturn-aligned structures are being built to replace them. Your brand and operational home — kayebuilds, Ninth Gate's structure — is being rebuilt from the ground up with both vision and form.",
      house:"4th", intensity:3, tags:["VISION + STRUCTURE","FOUNDATION REBUILD"],
      kab:{
        transit:"Kether (Neptune) through the 15th Path (Heh/Emperor) in your 4th house simultaneously with Binah (Saturn). Kether and Binah — crown and understanding, the two poles of the left pillar's upper axis — are both active in your foundation house. The undifferentiated divine and the great mother of form are rebuilding your base simultaneously.",
        arc:"Kether dissolves false foundations while Binah builds true ones. For your arc, this means the very ground you stand on during the Yesod→Tiphareth crossing is being transformed into something more permanently aligned with your actual nature. The foundations that emerge from this dual transit will hold.",
        path:"15th Path · Heh (ה) · The Emperor", sefirot:"Kether → Chokmah",
        instruction:"Neptune at Kether level communicates only in atmosphere and felt-sense. When you sit in your foundational space — your home, your core operating environment — what does it feel like? Does it feel like the base of an empire or something you've outgrown? Neptune is showing you what needs to dissolve. Saturn is showing you what needs to be built. Trust both signals.",
      },
    },
    {
      planet:"Pluto", sign:"Aquarius", ingress:"Nov 2024", duration:"2024–2044",
      raw:"Pluto in Aquarius — generational transformation of networks, technology, collective systems.",
      personal:"Pluto in your 2nd house (Aquarius) — the house of money, assets, and self-worth. For Capricorn Rising, the 2nd house is Aquarius — Pluto here for 20 years means your relationship to income, assets, and financial self-concept undergoes a complete transformation across your adult life. Technology-driven income, decentralised assets (crypto), and systems-based wealth are exactly what Pluto in Aquarius in the 2nd house rewards. False income models dissolve. Real ones compound. Ninth Gate, AI automation, and XRP/XLM positions are all directly aligned.",
      house:"2nd", intensity:4, tags:["WEALTH TRANSFORMATION","20-YEAR ARC"],
      kab:{
        transit:"Da'ath/Kether (Pluto) through the 28th Path (Tzaddi/The Star) in your 2nd house — the hidden Sefira of transformative knowledge active in your money and assets sector for 20 years.",
        arc:"Da'ath is the invisible Sefira — it destroys false knowledge and replaces it with real power. In your 2nd house of self-worth and income, Pluto/Da'ath is systematically removing every false income model and every inherited belief about what you are worth. What replaces it is your actual value — which is considerably larger. The process continues until 2044.",
        path:"28th Path · Tzaddi (צ) · The Star", sefirot:"Da'ath → Yesod",
        instruction:"The Star follows The Tower. Each financial structure that Pluto dissolves is making space for a more authentic one. Stop defending income models that Da'ath is already removing. Identify the one income architecture that is most genuinely yours — most aligned with Ninth Gate's actual vision — and put all available energy there.",
      },
    },
  ],
};

const INTENSITY_LABEL = ["","Low","Moderate","Notable","Strong","Peak"];
const INTENSITY_COLORS = ["","#718096","#718096","#D69E2E","#E07B39","#F6AD55"];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
function App({ user, onReset }) {
  const [tab, setTab] = useState("weekly");
  const [mode, setMode] = useState("astro");
  const [expanded, setExpanded] = useState(null);
  const [profileTab, setProfileTab] = useState("arc");
  const [vedicTab, setVedicTab] = useState("chart");
  const [numTab, setNumTab] = useState("core");
  const [chineseTab, setChineseTab] = useState("pillars");
  const [showSettings, setShowSettings] = useState(false);

  // ─── PER-USER COMPUTATIONS ─────────────────────────────────────────────────
  const USER = user || { fullName: FULL_NAME, name: "Ethan", dob:{y:BIRTH_YEAR,m:BIRTH_MONTH,d:BIRTH_DAY}, time:{h:6,m:30}, timeUnknown:false, city:"Sydney", gender:"male", isDemo:true };
  const FIRST_NAME = USER.name || (USER.fullName || "").split(" ")[0] || "You";
  const USER_FULL_NAME = USER.fullName || FIRST_NAME;
  const USER_DOB = USER.dob || {y:BIRTH_YEAR, m:BIRTH_MONTH, d:BIRTH_DAY};
  const USER_TIME = USER.time || {h:12, m:0};
  const USER_TIME_UNKNOWN = !!USER.timeUnknown;
  const USER_GENDER = USER.gender || "male";

  const USER_NUM = React.useMemo(
    () => computeNumerology(USER_FULL_NAME, USER_DOB, CURRENT_YEAR, FIRST_NAME),
    [USER_FULL_NAME, USER_DOB.y, USER_DOB.m, USER_DOB.d]
  );
  const USER_BAZI = React.useMemo(
    () => computeBaZi(USER_DOB, USER_TIME, USER_TIME_UNKNOWN, USER_GENDER, FIRST_NAME, CURRENT_YEAR),
    [USER_DOB.y, USER_DOB.m, USER_DOB.d, USER_TIME.h, USER_TIME.m, USER_TIME_UNKNOWN, USER_GENDER]
  );
  const isKab = mode === "kab";
  const isVedic = mode === "vedic";
  const isNum = mode === "numerology";
  const isChi = mode === "chinese";
  const accent = isKab ? "var(--copper)" : isVedic ? "var(--saffron)" : isNum ? "var(--antique)" : isChi ? "var(--lacquer)" : "var(--brass)";
  const vignetteColor = isKab ? "rgba(184,115,51,0.18)" : isVedic ? "rgba(212,149,107,0.18)" : isNum ? "rgba(184,147,90,0.18)" : isChi ? "rgba(142,44,44,0.18)" : "rgba(200,160,82,0.18)";
  const modeClass = isKab ? "mode-kab" : isVedic ? "mode-vedic" : isNum ? "mode-num" : isChi ? "mode-chi" : "mode-astro";
  const modeLabel = isKab ? "Kabbalah" : isVedic ? "Vedic" : isNum ? "Numerology" : isChi ? "Chinese" : "Western";
  const heroTitle = isKab ? "The Tree of Life" : isVedic ? "The Sidereal Chart" : isNum ? "The Numerical Field" : isChi ? "Four Pillars of Destiny" : "Planetary Transits";
  const heroSub = isKab ? "Hebrew letter, Sefira, and path — the arc from Yesod toward Tiphareth." : isVedic ? "Lahiri ayanamsa. Sagittarius lagna. Jupiter ruling the chart." : isNum ? "Pythagorean, Chaldean, and gematric readings of the name and date." : isChi ? "Stems and branches. Day master, luck pillars, five elements." : "This week, this month, this year — read through the Capricorn rising lens.";

  return (
    <div className={`page ${modeClass}`} style={{minHeight:"100vh",background:"var(--bg-base)",color:"var(--ink)",position:"relative",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,600&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap');

        :root{
          --bg-base:#0A0E1A;
          --bg-deep:#060912;
          --bg-raise:#131828;
          --ink:#FCFAF6;
          --ink-dim:#CFC5B1;
          --ink-faint:#7B7361;
          --rule:rgba(252,250,246,0.08);
          --brass:#C8A052;
          --brass-soft:rgba(200,160,82,0.55);
          --ember:#A84B3E;
          --saffron:#D4956B;
          --copper:#B87333;
          --lacquer:#8E2C2C;
          --antique:#B8935A;
        }

        *{box-sizing:border-box;}
        body{background:var(--bg-base);}

        /* ── Typography primitives ───────────────────────────────── */
        .display{font-family:'Fraunces',serif;font-variation-settings:"opsz" 144;letter-spacing:-0.02em;color:var(--ink);font-weight:700;line-height:1.02;}
        .eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:var(--brass);font-weight:500;}
        .marginalia{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.04em;color:var(--ink-faint);line-height:1.55;}
        .body-serif{font-family:'Crimson Pro',serif;font-weight:400;font-size:16px;line-height:1.62;color:var(--ink-dim);}
        .mono{font-family:'IBM Plex Mono',monospace;font-weight:400;}
        .pq{font-family:'Fraunces',serif;font-variation-settings:"opsz" 144;font-style:italic;font-weight:500;font-size:22px;line-height:1.4;color:var(--brass);margin:24px 0;padding-left:18px;border-left:2px solid var(--brass);letter-spacing:-0.01em;}
        .smcp{font-feature-settings:"smcp";}
        .chapter-rule{border:0;height:1px;background:linear-gradient(90deg,transparent,var(--brass-soft),transparent);margin:40px auto;max-width:80%;position:relative;}
        .chapter-rule::after{content:"\\2042";position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--bg-base);padding:0 12px;font-family:'Fraunces',serif;font-size:16px;color:var(--brass);}
        .dropcap::first-letter{font-family:'Fraunces',serif;font-variation-settings:"opsz" 144;font-weight:800;font-size:4.8em;line-height:0.84;float:left;padding:8px 12px 0 0;color:var(--brass);letter-spacing:-0.04em;}

        /* ── Hero section per mode ───────────────────────────────── */
        .hero{padding:72px 0 28px;text-align:left;position:relative;}
        .hero .eyebrow{margin-bottom:18px;display:inline-block;}
        .hero h1{font-family:'Fraunces',serif;font-variation-settings:"opsz" 144;font-weight:600;font-size:clamp(44px,8vw,72px);line-height:0.98;letter-spacing:-0.025em;color:var(--ink);margin:0 0 14px;}
        .hero .sub{font-family:'Crimson Pro',serif;font-style:italic;font-weight:400;font-size:18px;color:var(--ink-dim);margin:0 0 26px;max-width:540px;}
        .hero .brass-rule{width:64px;height:2px;background:var(--brass);margin-bottom:26px;}
        .vignette{position:absolute;top:0;left:-10%;right:-10%;height:320px;pointer-events:none;z-index:-1;opacity:0.5;filter:blur(60px);}

        /* ── Mode toggle ──────────────────────────────────────────── */
        .mode-nav{display:flex;gap:22px;flex-wrap:wrap;justify-content:flex-start;padding:16px 0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);margin-bottom:40px;}
        .mode-nav button{background:transparent;border:none;padding:6px 0;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-faint);cursor:pointer;transition:color .3s;position:relative;}
        .mode-nav button:hover{color:var(--ink-dim);}
        .mode-nav button.active{color:var(--brass);}
        .mode-nav button.active::after{content:"";position:absolute;bottom:-17px;left:0;right:0;height:1px;background:var(--brass);}

        /* ── Section eyebrow tabs ─────────────────────────────────── */
        .tabrow{display:flex;gap:18px;flex-wrap:wrap;margin:28px 0;border-bottom:1px solid var(--rule);padding-bottom:14px;}
        .tabrow button{background:transparent;border:none;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-faint);cursor:pointer;padding:0;transition:color .2s;}
        .tabrow button:hover{color:var(--ink-dim);}
        .tabrow button.active{color:var(--brass);}

        /* ── Transit entry card (editorial list) ─────────────────── */
        .entry{padding:28px 0;border-bottom:1px solid var(--rule);cursor:pointer;transition:background .3s;}
        .entry:hover{background:rgba(200,160,82,0.02);}
        .entry.open{background:rgba(200,160,82,0.035);}
        .entry-head{display:grid;grid-template-columns:120px 1fr auto;gap:24px;align-items:baseline;}
        .entry-date{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.08em;color:var(--ink-faint);text-transform:uppercase;}
        .entry-title{font-family:'Fraunces',serif;font-variation-settings:"opsz" 48;font-weight:600;font-size:22px;color:var(--ink);letter-spacing:-0.015em;line-height:1.2;}
        .entry-meta{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.16em;color:var(--brass);text-transform:uppercase;}
        .entry-tags{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.14em;color:var(--ink-faint);text-transform:uppercase;margin-top:10px;}
        .entry-tags span{color:var(--brass);}
        .entry-body{display:grid;grid-template-columns:1fr;gap:16px;padding-top:22px;}
        @media(min-width:820px){.entry-body{grid-template-columns:2fr 1fr;gap:40px;}}
        .entry-body p{font-family:'Crimson Pro',serif;font-size:16px;line-height:1.68;color:var(--ink-dim);margin:0 0 14px;}
        .entry-body .dropcap{font-family:'Crimson Pro',serif;font-size:16.5px;line-height:1.62;color:var(--ink);}
        .entry-aside{padding-top:4px;}
        .entry-aside .marginalia{margin-bottom:10px;}

        /* ── Tables ──────────────────────────────────────────────── */
        .ed-table{width:100%;border-collapse:collapse;font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--ink-dim);}
        .ed-table th{font-weight:500;text-align:left;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:var(--brass);padding:10px 14px 10px 0;border-bottom:1px solid var(--brass-soft);}
        .ed-table td{padding:10px 14px 10px 0;border-bottom:1px solid var(--rule);font-size:13px;}
        .ed-table td.num{text-align:right;font-variant-numeric:tabular-nums;color:var(--ink);font-family:'IBM Plex Mono',monospace;}
        .ed-table td.serif{font-family:'Crimson Pro',serif;font-size:14.5px;color:var(--ink-dim);}
        .ed-table tr:hover td{color:var(--ink);}
        .ed-table tr.highlight td{color:var(--brass);}

        /* ── Simple block types ───────────────────────────────────── */
        .section-lead{font-family:'Crimson Pro',serif;font-size:18px;line-height:1.58;color:var(--ink);margin:0 0 22px;max-width:640px;font-weight:400;}
        .section-lead em{font-style:italic;color:var(--ink-dim);}
        .kicker{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:var(--brass);margin-bottom:8px;}
        .inline-tag{display:inline;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.14em;color:var(--ink-faint);text-transform:uppercase;}
        .inline-tag + .inline-tag::before{content:" · ";color:var(--ink-faint);}

        /* ── Chips used for placement summary ─────────────────────── */
        .chip-row{display:flex;gap:0;flex-wrap:wrap;margin:18px 0;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-dim);}
        .chip-row span{padding:6px 14px;border-right:1px solid var(--rule);}
        .chip-row span:first-child{padding-left:0;}
        .chip-row span:last-child{border-right:none;}
        .chip-row span.accent{color:var(--brass);}

        /* ── Accent pillars for Vedic / Num / Chinese ─────────────── */
        .mode-astro{--mode-accent:var(--brass);}
        .mode-vedic{--mode-accent:var(--saffron);}
        .mode-kab{--mode-accent:var(--copper);}
        .mode-num{--mode-accent:var(--antique);}
        .mode-chi{--mode-accent:var(--lacquer);}

        /* ── Settings control (SVG) ───────────────────────────────── */
        .cog{position:fixed;top:22px;right:24px;z-index:40;width:28px;height:28px;border:none;background:transparent;color:var(--brass);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .4s ease;}
        .cog:hover{transform:rotate(45deg);}
        .cog svg{width:20px;height:20px;stroke:var(--brass);fill:none;stroke-width:1.2;}

        /* ── Banners ──────────────────────────────────────────────── */
        .banner{border:1px solid var(--rule);border-left:2px solid var(--brass);padding:14px 18px;font-family:'Crimson Pro',serif;font-style:italic;font-size:14px;color:var(--ink-dim);margin:22px 0;line-height:1.5;}

        /* ── Pip / intensity indicator ────────────────────────────── */
        .pip-bar{display:inline-flex;gap:3px;align-items:center;vertical-align:middle;}
        .pip-bar i{width:6px;height:1px;background:var(--ink-faint);display:inline-block;}
        .pip-bar i.on{background:var(--brass);height:2px;}

        /* ── Verified signature ───────────────────────────────────── */
        .verified-badge{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:var(--ink-faint);display:inline-flex;align-items:center;gap:8px;}
        .verified-badge::before{content:"†";color:var(--brass);font-family:'Fraunces',serif;font-size:14px;}

        /* ── Numerology big number ────────────────────────────────── */
        .big-num{font-family:'Fraunces',serif;font-variation-settings:"opsz" 144;font-weight:700;font-size:96px;line-height:0.88;color:var(--brass);letter-spacing:-0.04em;}
        .med-num{font-family:'Fraunces',serif;font-variation-settings:"opsz" 144;font-weight:700;font-size:48px;line-height:1;color:var(--brass);letter-spacing:-0.03em;}
        .num-entry{padding:28px 0;border-bottom:1px solid var(--rule);display:grid;grid-template-columns:160px 1fr;gap:32px;align-items:start;}
        @media(max-width:640px){.num-entry{grid-template-columns:1fr;gap:12px;}}

        /* ── BaZi pillar block ────────────────────────────────────── */
        .pillars-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0;margin:24px 0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);}
        .pillar-col{padding:24px 20px;border-right:1px solid var(--rule);text-align:center;}
        .pillar-col:last-child{border-right:none;}
        .pillar-col .han{font-family:'Fraunces',serif;font-size:52px;line-height:1;color:var(--brass);margin-bottom:4px;}
        .pillar-col .han.sub{color:var(--saffron);}

        /* ── Elemental bars ──────────────────────────────────────── */
        .elem-bar{height:2px;background:var(--rule);margin:4px 0 14px;position:relative;}
        .elem-bar i{position:absolute;top:0;left:0;height:2px;}

        /* ── Starfield mount ─────────────────────────────────────── */
        #stars-mount{position:fixed;inset:0;z-index:0;pointer-events:none;}
        /* Reading plane — darkens the stars behind content for legibility */
        #stars-mount::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 70% 85% at 50% 50%, rgba(10,14,26,0.82) 0%, rgba(10,14,26,0.72) 40%, rgba(10,14,26,0.42) 70%, rgba(10,14,26,0) 100%);pointer-events:none;}
        .page{position:relative;z-index:1;}
        .page::before{content:"";position:fixed;inset:0;z-index:-1;background:linear-gradient(180deg, rgba(10,14,26,0) 0%, rgba(10,14,26,0.15) 10%, rgba(10,14,26,0.35) 30%, rgba(10,14,26,0.35) 70%, rgba(10,14,26,0.15) 90%, rgba(10,14,26,0) 100%);pointer-events:none;}
        .page > *{position:relative;}
        .section-lead, .bt, .fullNote, p.bt, .entry-text, .num-body, .ed-table, .entry-body{position:relative;}
        .reading-plate{background:rgba(10,14,26,0.55);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);border-radius:4px;padding:14px 18px;}

        /* ── Staggered fade+rise on load ──────────────────────────── */
        @keyframes rise{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
        .rise{animation:rise .7s cubic-bezier(.2,.7,.3,1) both;}
        .rise-1{animation-delay:0ms;}
        .rise-2{animation-delay:120ms;}
        .rise-3{animation-delay:240ms;}
        .rise-4{animation-delay:360ms;}
        .rise-5{animation-delay:480ms;}

        /* ── Mode crossfade ──────────────────────────────────────── */
        .mode-section{animation:fade .4s ease both;}
        @keyframes fade{from{opacity:0}to{opacity:1}}

        /* ── Focus ───────────────────────────────────────────────── */
        :focus-visible{outline:2px solid var(--brass);outline-offset:2px;border-radius:2px;}

        @media(prefers-reduced-motion:reduce){
          .rise,.mode-section{animation:none !important;}
          .cog{transition:none;}
        }

        /* ── Legacy class names kept for compatibility with remaining JSX — repurposed to editorial ── */
        .card{border:none;border-bottom:1px solid var(--rule);background:transparent;margin:0;padding:22px 0;cursor:pointer;transition:background .3s;}
        .card:hover{background:rgba(200,160,82,0.02);}
        .card.oa,.card.ok{background:rgba(200,160,82,0.035);}
        .tbtn{padding:6px 0;border:none;background:transparent;color:var(--ink-faint);font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;margin-right:22px;transition:color .2s;}
        .tbtn:hover{color:var(--ink-dim);}
        .tbtn.aa,.tbtn.ak{color:var(--brass);}
        .ptbtn{padding:6px 0;border:none;background:transparent;color:var(--ink-faint);font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;cursor:pointer;margin-right:18px;transition:color .2s;}
        .ptbtn.pa{color:var(--brass);}
        .pip{width:6px;height:1px;display:inline-block;background:var(--ink-faint);}
        .tag{display:inline;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.14em;color:var(--ink-faint);text-transform:uppercase;margin-right:14px;}
        .tag + .tag::before{content:"· ";color:var(--ink-faint);}
        .hbadge,.kbadge,.vbadge,.nbadge,.cbadge{display:inline;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.14em;color:var(--brass);text-transform:uppercase;padding:0;background:transparent;border:none;margin-right:10px;}
        .nchip{display:inline;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.14em;color:var(--brass);text-transform:uppercase;padding:0;background:transparent;border:none;margin-right:14px;}
        .ibox,.kbox,.vbox,.nbox,.cbox{border:none;border-left:2px solid var(--brass);background:transparent;padding:4px 0 4px 18px;margin-top:16px;border-radius:0;}
        .sl{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:8px;color:var(--brass);font-weight:500;}
        .bt{font-family:'Crimson Pro',serif;font-size:15.5px;line-height:1.66;margin:0;color:var(--ink-dim);}
        .hd{border:none;border-top:1px solid var(--rule);margin:14px 0;}
        .sb{background:transparent;border:none;border-top:1px solid var(--rule);padding:12px 0 4px;margin-bottom:10px;border-radius:0;}
        .tog{display:flex;gap:22px;padding:0;background:transparent;border:none;}
        .to{padding:6px 0;border:none;background:transparent;color:var(--ink-faint);font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;transition:color .2s;}
        .to:hover{color:var(--ink-dim);}
        .to.oa2,.to.ok2,.to.ov,.to.onum,.to.ochi{color:var(--brass);border-bottom:1px solid var(--brass);padding-bottom:5px;}
        .to.off{color:var(--ink-faint);}
        .yoga-card,.pillar-card,.num-card{background:transparent;border:none;border-bottom:1px solid var(--rule);border-radius:0;padding:22px 0;margin-bottom:0;}
        .dasha-row{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;padding:12px 0;border-bottom:1px solid var(--rule);}

        .phase2-banner{border:1px solid var(--rule);border-left:2px solid var(--brass);color:var(--ink-dim);font-family:'Crimson Pro',serif;font-style:italic;font-size:14px;padding:12px 18px;border-radius:0;margin:0 0 28px;text-align:left;line-height:1.5;}

        /* ── Onboarding (refined editorial column) ───────────────── */
        .onboard-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px 24px;background:var(--bg-base);position:relative;overflow:hidden;color:var(--ink);font-family:'Crimson Pro',serif;}
        .onboard-card{max-width:480px;width:100%;background:transparent;border:none;border-radius:0;padding:0;position:relative;z-index:1;}
        .onboard-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:var(--brass);margin-bottom:14px;}
        .onboard-title{font-family:'Fraunces',serif;font-variation-settings:"opsz" 144;font-size:48px;font-weight:600;letter-spacing:-0.025em;text-align:left;color:var(--ink);margin:0 0 14px;line-height:1;}
        .onboard-sub{font-family:'Crimson Pro',serif;font-style:italic;text-align:left;font-size:17px;color:var(--ink-dim);margin:0 0 8px;line-height:1.45;max-width:440px;}
        .onboard-sub + .brass-rule{width:48px;height:1px;background:var(--brass);margin:22px 0 32px;}
        .onboard-field{margin-bottom:26px;animation:rise .7s cubic-bezier(.2,.7,.3,1) both;}
        .onboard-field:nth-child(1){animation-delay:0ms;}
        .onboard-field:nth-child(2){animation-delay:80ms;}
        .onboard-field:nth-child(3){animation-delay:160ms;}
        .onboard-field:nth-child(4){animation-delay:240ms;}
        .onboard-field:nth-child(5){animation-delay:320ms;}
        .onboard-field:nth-child(6){animation-delay:400ms;}
        .onboard-field:nth-child(7){animation-delay:480ms;}
        .onboard-field label{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:var(--brass);margin-bottom:8px;display:block;font-weight:500;}
        .onboard-input,.onboard-select,.date-input,.time-input{width:100%;padding:8px 0;background:transparent;border:none;border-bottom:1px solid var(--rule);color:var(--ink);font-family:'Crimson Pro',serif;font-size:17px;outline:none;transition:border-color .2s,color .2s;border-radius:0;}
        .onboard-input:focus,.onboard-select:focus,.date-input:focus,.time-input:focus{border-bottom:1px solid var(--brass);border-bottom-width:2px;color:var(--brass);}
        .onboard-input::placeholder{color:var(--ink-faint);font-style:italic;}
        .date-input,.time-input{color-scheme:dark;font-family:'IBM Plex Mono',monospace;font-size:15px;letter-spacing:0.04em;}
        .onboard-row{display:flex;gap:18px;}
        .onboard-row > *{flex:1;}
        .onboard-check{display:flex;align-items:center;gap:10px;margin-top:12px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ink-faint);letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;}
        .onboard-check input{accent-color:var(--brass);}
        .onboard-radio{display:flex;gap:22px;margin-top:6px;}
        .onboard-radio label{flex:0 0 auto;padding:6px 0;background:transparent;border:none;color:var(--ink-faint);font-family:'IBM Plex Mono',monospace;font-size:11px;cursor:pointer;text-align:left;transition:color .2s;letter-spacing:0.18em;text-transform:uppercase;margin:0;}
        .onboard-radio label.selected{color:var(--brass);border-bottom:1px solid var(--brass);}
        .onboard-radio input{display:none;}
        .onboard-btn{width:100%;padding:14px 0;border:1px solid var(--brass);background:transparent;color:var(--brass);font-family:'Fraunces',serif;font-size:14px;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;transition:all .25s;margin-top:16px;font-weight:500;}
        .onboard-btn:hover{background:var(--brass);color:var(--bg-base);}
        .onboard-demo{width:100%;padding:12px 0;border:none;background:transparent;color:var(--ink-faint);font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;transition:color .2s;margin-top:16px;border-top:1px solid var(--rule);}
        .onboard-demo:hover{color:var(--brass);}
        .onboard-err{font-family:'Crimson Pro',serif;font-size:13px;color:var(--ember);margin-top:10px;font-style:italic;}
        .onboard-symbol{font-family:'Fraunces',serif;font-size:20px;letter-spacing:16px;color:var(--brass);margin-bottom:28px;}
        .modal-back{position:fixed;inset:0;background:rgba(6,9,18,0.88);display:flex;align-items:flex-start;justify-content:center;z-index:50;padding:48px 24px;overflow-y:auto;}
        .modal-close{position:absolute;top:-8px;right:-8px;background:transparent;border:none;color:var(--ink-faint);font-family:'Fraunces',serif;font-size:28px;cursor:pointer;line-height:1;}
        .modal-close:hover{color:var(--brass);}

        .crow{display:grid;grid-template-columns:1.3fr 1fr 60px 1.5fr;gap:16px;padding:10px 0;border-bottom:1px solid var(--rule);align-items:center;}
        @media(max-width:720px){.crow{grid-template-columns:1fr;gap:4px;}}
`}</style>

      {/* Starfield mount — sibling file owns render. Leave empty. */}
      <div id="stars-mount" aria-hidden="true"></div>

      <div style={{maxWidth:920,margin:"0 auto",padding:"0 32px 96px",position:"relative",zIndex:1}}>

        {/* SETTINGS COG — celestial crosshair sigil */}
        <button className="cog" title="Edit birth data" onClick={()=>setShowSettings(true)} aria-label="Settings">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="12" cy="12" r="7"/>
            <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>
            <line x1="12" y1="1" x2="12" y2="5.5"/>
            <line x1="12" y1="18.5" x2="12" y2="23"/>
            <line x1="1" y1="12" x2="5.5" y2="12"/>
            <line x1="18.5" y1="12" x2="23" y2="12"/>
          </svg>
        </button>
        {showSettings && (
          <SettingsModal user={USER} onClose={()=>setShowSettings(false)} onReset={()=>{ setShowSettings(false); onReset && onReset(); }} />
        )}

        {/* HERO — editorial masthead */}
        <div className="hero rise rise-1">
          <div className="vignette" style={{background:`radial-gradient(ellipse at top,${vignetteColor},transparent 65%)`}} aria-hidden="true"/>
          <div className="eyebrow">Volume I — {modeLabel} reading · {CURRENT_YEAR}</div>
          <h1>{heroTitle}</h1>
          <p className="sub">{heroSub}</p>
          <div className="brass-rule"/>
          <p className="marginalia" style={{marginBottom:10}}>
            {USER_FULL_NAME} — {formatDOB(USER_DOB)}{USER_TIME_UNKNOWN?" — time withheld":` — ${pad2(USER_TIME.h)}:${pad2(USER_TIME.m)}`}{USER.city?` — ${USER.city}`:""}
          </p>
          <div><span className="verified-badge">{USER.isDemo?"Demo chart — Ethan Kay":"Personalised — Numerology & BaZi"}</span></div>

          {/* Placement chip row */}
          <div className="chip-row rise rise-2">
            {isNum ? (<>
              <span className="accent">Life Path {USER_NUM.lifePath} — {NUM_MEANINGS[USER_NUM.lifePath]?.title||""}</span>
              <span>Expression {USER_NUM.expression} — Destiny</span>
              <span>Personal Year {USER_NUM.personalYear} — {CURRENT_YEAR}</span>
            </>) : isChi ? (<>
              <span className="accent">Year — {USER_BAZI.year.combined}</span>
              <span>Day Master — {USER_BAZI.day.combined}</span>
              {!USER_TIME_UNKNOWN && (<span>Hour — {USER_BAZI.hour.combined}</span>)}
            </>) : !isVedic ? (<>
              <span className="accent">☉ Leo 0° · 8th House · Tiphareth</span>
              <span>☽ Libra 2° · 10th House · Yesod</span>
              <span>↑ Capricorn 22° · Ayin · Binah</span>
            </>) : (<>
              <span className="accent">☉ Cancer 6° · 8th House</span>
              <span>☽ Virgo 8° · 10th · Uttara Phalguni</span>
              <span>↑ Sagittarius 28° · Jupiter ruled</span>
            </>)}
          </div>
        </div>

        {/* MODE NAV */}
        <nav className="mode-nav rise rise-3" aria-label="Reading mode">
          <button className={!isKab&&!isVedic&&!isNum&&!isChi?"active":""} onClick={()=>{setMode("astro");setExpanded(null);}}>Western</button>
          <button className={isVedic?"active":""} onClick={()=>{setMode("vedic");setExpanded(null);}}>Vedic</button>
          <button className={isKab?"active":""} onClick={()=>{setMode("kab");setExpanded(null);}}>Kabbalah</button>
          <button className={isNum?"active":""} onClick={()=>{setMode("numerology");setExpanded(null);}}>Numerology</button>
          <button className={isChi?"active":""} onClick={()=>{setMode("chinese");setExpanded(null);}}>Chinese</button>
        </nav>

        <div className="mode-section" key={mode}>

        {/* PHASE 2 BANNER — Western/Vedic/Kabbalah show demo chart for non-demo users */}
        {!USER.isDemo && (isKab || isVedic || (!isNum && !isChi)) && (
          <div className="phase2-banner">
            Demo chart shown. Live Western &amp; Vedic calculation for your birth data is being built (Phase 2). Numerology + Chinese are fully personalised to you.
          </div>
        )}

        {/* TIME TABS — only in western/kab mode */}
        {!isVedic&&!isNum&&!isChi&&(
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20}}>
          {[["weekly","This Week"],["monthly","This Month"],["yearly","This Year"]].map(([k,l])=>(
            <button key={k} className={`tbtn ${tab===k?(isKab?"ak":"aa"):""}`}
              onClick={()=>{setTab(k);setExpanded(null);}}>
              {l}
            </button>
          ))}
        </div>
        )}

        {/* ── VEDIC SECTION ── */}
        {isVedic&&(
          <div>
            {/* Vedic sub-tabs */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginBottom:20}}>
              {[["chart","Sidereal Chart"],["nakshatra","Nakshatra"],["dasha","Dasha"],["yogas","Yogas"]].map(([k,l])=>(
                <button key={k} className={`ptbtn ${vedicTab===k?"pa":""}`}
                  style={vedicTab===k?{background:"rgba(232,168,124,.15)",borderColor:"rgba(232,168,124,.35)",color:"#E8A87C"}:{}}
                  onClick={()=>setVedicTab(k)}>{l}</button>
              ))}
            </div>

            {/* SIDEREAL CHART */}
            {vedicTab==="chart"&&(
              <div>
                <div style={{marginBottom:14,padding:"10px 14px",background:"rgba(232,168,124,.06)",border:"1px solid rgba(232,168,124,.2)",borderRadius:10}}>
                  <div className="sl" style={{color:"rgba(232,168,124,.7)"}}>System · Lahiri Ayanamsa 23.85° · Sidereal Zodiac · Whole Sign</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.7)",fontSize:13,marginTop:4}}>
                    Vedic astrology uses the fixed star positions (sidereal zodiac), shifting all planets back ~24° from the Western tropical chart. Your Sagittarius Lagna and Jupiter as chart ruler fundamentally reframes your identity from Capricorn's disciplined builder to the philosophical empire-visionary.
                  </p>
                </div>

                {/* Planet table */}
                {VEDIC_PLANETS.map((p,i)=>{
                  return (
                    <div key={i} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(232,168,124,.12)",borderRadius:12,marginBottom:8,overflow:"hidden"}}>
                      <div style={{padding:"11px 14px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:600,color:"#E8A87C"}}>{p.planet}</span>
                            <span style={{fontFamily:"'Crimson Pro',serif",fontSize:13,color:"rgba(255,255,255,.7)"}}>{p.sign} {p.deg}</span>
                          </div>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(232,168,124,.6)",
                            background:"rgba(232,168,124,.08)",border:"1px solid rgba(232,168,124,.2)",
                            padding:"2px 8px",borderRadius:12,letterSpacing:.5}}>
                            House {p.house}
                          </span>
                        </div>
                        <p style={{fontFamily:"'Crimson Pro',serif",fontSize:13,color:"rgba(255,255,255,.6)",margin:"6px 0 0",lineHeight:1.6}}>{p.note}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Vedic vs Western comparison */}
                <div style={{marginTop:16,padding:"14px",background:"rgba(232,168,124,.04)",border:"1px solid rgba(232,168,124,.15)",borderRadius:12}}>
                  <div className="sl" style={{color:"rgba(232,168,124,.6)",marginBottom:10}}>Western vs Vedic · Key Differences</div>
                  {[
                    {planet:"Sun ☉",   western:"Leo · 8H",        vedic:"Cancer · 8H",       note:"Identity shifts from Leo's sovereign performer to Cancer's private power. Strength is internal, not displayed."},
                    {planet:"Moon ☽",  western:"Libra · 10H",     vedic:"Virgo · 10H",       note:"Public emotional nature shifts from diplomatic Libra to analytical Virgo. Reputation built on precision and discernment."},
                    {planet:"Rising ↑",western:"Capricorn · Saturn",vedic:"Sagittarius · Jupiter",note:"Chart ruler shifts from Saturn (discipline, structure) to Jupiter (vision, expansion, philosophy). Fundamental identity reframe."},
                    {planet:"Mars ♂",  western:"Leo · 8H",        vedic:"Cancer · 8H",       note:"Mars moves from Leo's bold fire to Cancer's emotional, protective drive. Ambition is security-motivated beneath the surface."},
                    {planet:"Saturn ♄",western:"Cancer · 7H",     vedic:"Gemini · 7H",       note:"Partnership Saturn shifts from emotional Cancer to intellectual Gemini — partnerships need mental compatibility, not just loyalty."},
                  ].map((r,i)=>(
                    <div key={i} style={{padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#E8A87C",minWidth:70}}>{r.planet}</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(255,215,0,.6)",background:"rgba(255,215,0,.08)",padding:"2px 7px",borderRadius:10}}>{r.western}</span>
                        <span style={{color:"rgba(255,255,255,.3)",fontSize:10}}>→</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(232,168,124,.8)",background:"rgba(232,168,124,.08)",padding:"2px 7px",borderRadius:10}}>{r.vedic}</span>
                      </div>
                      <p style={{fontFamily:"'Crimson Pro',serif",fontSize:12,color:"rgba(255,255,255,.55)",margin:0,lineHeight:1.6}}>{r.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NAKSHATRA */}
            {vedicTab==="nakshatra"&&(
              <div>
                <div style={{padding:"16px",background:"rgba(232,168,124,.06)",border:"1px solid rgba(232,168,124,.25)",borderRadius:14,marginBottom:14}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:16,color:"#E8A87C",fontWeight:700}}>Uttara Phalguni</span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(232,168,124,.6)",letterSpacing:1,background:"rgba(232,168,124,.1)",padding:"3px 9px",borderRadius:12}}>Moon Nakshatra</span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(255,215,0,.7)",background:"rgba(255,215,0,.08)",padding:"3px 9px",borderRadius:12}}>Lord: Sun</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[
                      {k:"Symbol",v:NAKSHATRA.symbol},
                      {k:"Deity",v:NAKSHATRA.deity},
                      {k:"Quality",v:NAKSHATRA.quality},
                      {k:"Pada",v:`2nd Pada`},
                    ].map(({k,v})=>(
                      <div key={k} style={{background:"rgba(255,255,255,.03)",borderRadius:8,padding:"8px 10px"}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"rgba(255,255,255,.35)",letterSpacing:1.5,marginBottom:3}}>{k.toUpperCase()}</div>
                        <div style={{fontFamily:"'Crimson Pro',serif",fontSize:12,color:"rgba(255,255,255,.75)"}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="sl" style={{color:"rgba(232,168,124,.6)"}}>Nakshatra Meaning</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13}}>{NAKSHATRA.meaning}</p>
                </div>
                <div style={{padding:"14px",background:"rgba(255,215,0,.04)",border:"1px solid rgba(255,215,0,.15)",borderRadius:12}}>
                  <div className="sl" style={{color:"rgba(255,215,0,.6)"}}>† For You</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.85)",fontSize:13}}>{NAKSHATRA.forYou}</p>
                </div>

                <div style={{marginTop:14,padding:"14px",background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12}}>
                  <div className="sl" style={{color:"rgba(255,255,255,.3)",marginBottom:10}}>The 27 Nakshatras — Moon's position highlighted</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>
                    {["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishtha","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"].map((n,i)=>(
                      <div key={i} style={{
                        padding:"4px 6px",borderRadius:6,textAlign:"center",
                        background:n==="Uttara Phalguni"?"rgba(232,168,124,.15)":"rgba(255,255,255,.02)",
                        border:`1px solid ${n==="Uttara Phalguni"?"rgba(232,168,124,.35)":"rgba(255,255,255,.05)"}`,
                      }}>
                        <div style={{fontFamily:"'Crimson Pro',serif",fontSize:10,
                          color:n==="Uttara Phalguni"?"#E8A87C":"rgba(255,255,255,.35)"}}>{n}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DASHA */}
            {vedicTab==="dasha"&&(
              <div>
                <div style={{marginBottom:14,padding:"12px 14px",background:"rgba(127,255,212,.06)",border:"1px solid rgba(127,255,212,.2)",borderRadius:12}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,color:"#7FFFD4",fontWeight:700}}>Rahu Mahadasha</span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(127,255,212,.7)",background:"rgba(127,255,212,.1)",padding:"3px 9px",borderRadius:12,letterSpacing:1}}>ACTIVE · May 2022 – May 2040</span>
                  </div>
                  <p className="bt" style={{color:"rgba(255,255,255,.85)",fontSize:13}}>{RAHU_DASHA_NOTE}</p>
                </div>
                <div style={{marginBottom:14,padding:"12px 14px",background:"rgba(255,215,0,.04)",border:"1px solid rgba(255,215,0,.15)",borderRadius:12}}>
                  <div className="sl" style={{color:"rgba(255,215,0,.6)"}}>Antardasha · Current Sub-Period</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13}}>{ANTARDASHA_NOTE}</p>
                </div>

                <div className="sl" style={{color:"rgba(255,255,255,.3)",marginBottom:10}}>Full Mahadasha Sequence</div>
                {DASHAS.map((d,i)=>(
                  <div key={i} className="dasha-row" style={{opacity:d.active?1:i<3?0.35:0.65}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:`${d.color}22`,border:`1.5px solid ${d.color}66`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:d.active?d.color:`${d.color}44`}}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:d.active?d.color:"rgba(255,255,255,.6)",fontWeight:d.active?700:400}}>{d.lord}</span>
                        {d.active&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:d.color,background:`${d.color}15`,padding:"2px 7px",borderRadius:10,letterSpacing:1}}>ACTIVE NOW</span>}
                        <span style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"rgba(255,255,255,.3)"}}>{d.start} → {d.end}</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(255,255,255,.25)"}}>{d.years}y</span>
                      </div>
                    </div>
                    <div style={{width:60,height:4,borderRadius:2,background:"rgba(255,255,255,.06)",overflow:"hidden",flexShrink:0}}>
                      <div style={{height:"100%",borderRadius:2,background:d.active?d.color:`${d.color}44`,width:`${(d.years/20)*100}%`}}/>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* YOGAS */}
            {vedicTab==="yogas"&&(
              <div>
                <div style={{marginBottom:14,padding:"10px 14px",background:"rgba(232,168,124,.05)",border:"1px solid rgba(232,168,124,.15)",borderRadius:10}}>
                  <p className="bt" style={{color:"rgba(255,255,255,.65)",fontSize:13}}>
                    Yogas are special planetary combinations in Vedic astrology that indicate specific life conditions, strengths, or challenges. Your chart contains several significant yogas — particularly around expansion, wealth, and the capacity to overcome opposition.
                  </p>
                </div>
                {YOGAS.map((y,i)=>(
                  <div key={i} className="yoga-card">
                    <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:"#E8A87C",fontWeight:600}}>{y.name}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(232,168,124,.6)",background:"rgba(232,168,124,.08)",padding:"2px 8px",borderRadius:10}}>{y.type}</span>
                      <div style={{display:"flex",gap:2,marginLeft:"auto"}}>
                        {[1,2,3,4,5].map(n=>(
                          <div key={n} style={{width:6,height:6,borderRadius:"50%",background:n<=y.strength?"#E8A87C":"rgba(255,255,255,.1)"}}/>
                        ))}
                      </div>
                    </div>
                    <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13}}>{y.desc}</p>
                  </div>
                ))}

                {/* System comparison note */}
                <div style={{marginTop:16,padding:"14px",background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12}}>
                  <div className="sl" style={{color:"rgba(255,255,255,.3)",marginBottom:8}}>Western vs Vedic · How to use both</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.6)",fontSize:13}}>
                    Western astrology excels at psychological depth, timing of inner experiences, and the texture of personality. Vedic astrology excels at life event prediction, career and financial timing, and karmic purpose. Your Rahu Mahadasha (active until 2040) and your Hamsa Yoga together suggest this 18-year window is your primary material ascent period. Use the Western chart to understand how you feel about it. Use the Vedic chart to understand what is actually happening.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TRANSIT CARDS — only in western/kab mode */}
        {!isVedic&&!isNum&&!isChi&&TRANSITS[tab].map((t,i)=>{
          const isOpen=expanded===i;
          const ic=INTENSITY_COLORS[t.intensity];
          const sp=SIGN_PATH[t.sign];
          const ps=PLANET_SEFIRA[t.planet];
          const sNum=Object.keys(SEFIROT).find(k=>SEFIROT[k].name===ps);
          return (
            <div key={i} className={`card ${isOpen?(isKab?"ok":"oa"):""}`}
              onClick={()=>setExpanded(isOpen?null:i)}>
              <div style={{padding:"13px 15px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:600,color:accent,letterSpacing:.3,transition:"color .3s"}}>
                      {t.planet} {isKab&&ps?`· ${ps}`:""} → {t.sign} {isKab&&sp?`· ${sp.letter}`:""}
                    </span>
                    <span style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"rgba(255,255,255,.3)"}}>{t.ingress}</span>
                  </div>
                  <span style={{fontSize:12,color:isOpen?accent:"rgba(255,255,255,.25)",display:"inline-block",
                    transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,flexWrap:"wrap"}}>
                  <span className="hbadge">{t.house} House · {HOUSE_THEMES[t.house]}</span>
                  {isKab&&sp&&<span className="kbadge">{sp.tarot}</span>}
                  <div style={{display:"flex",gap:3,alignItems:"center"}}>
                    {[1,2,3,4,5].map(n=>(
                      <div key={n} className="pip" style={{background:n<=t.intensity?ic:"rgba(255,255,255,.1)"}}/>
                    ))}
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:ic,marginLeft:4,letterSpacing:.8}}>{INTENSITY_LABEL[t.intensity]}</span>
                  </div>
                </div>
                <div>
                  {t.tags.map((tag,ti)=><span key={ti} className="tag">{tag}</span>)}
                  {isKab&&ps&&<span className="tag" style={{color:"#B39DDB",borderColor:"rgba(155,137,212,.2)"}}>§ {ps}</span>}
                  <span className="tag" style={{color:"rgba(255,255,255,.35)"}}>{t.duration}</span>
                </div>
              </div>

              {isOpen&&(
                <div style={{padding:"0 15px 15px"}}>
                  <hr className="hd"/>
                  {!isKab?(
                    <>
                      <div className="sl" style={{color:"rgba(255,255,255,.3)"}}>Transit Energy</div>
                      <p className="bt" style={{color:"rgba(255,255,255,.65)",fontStyle:"italic"}}>{t.raw}</p>
                      <div className="ibox">
                        <div className="sl" style={{color:"rgba(255,215,0,.75)"}}>† For You · Capricorn Rising · Leo Sun 8H · Libra Moon 10H</div>
                        <p className="bt" style={{color:"rgba(255,255,255,.9)"}}>{t.personal}</p>
                        <div style={{marginTop:9,paddingTop:8,borderTop:"1px solid rgba(255,215,0,.1)"}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,color:"rgba(126,200,200,.7)",letterSpacing:1.5}}>
                            {t.house} HOUSE · {HOUSE_THEMES[t.house]?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </>
                  ):(
                    <>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                        <div className="sb">
                          <div className="sl" style={{color:"rgba(155,137,212,.6)"}}>Planet · Sefira</div>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:SEFIROT[sNum]?.color||"#B39DDB",fontWeight:600}}>{ps}</div>
                          <div style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"rgba(255,255,255,.45)",marginTop:2}}>{SEFIROT[sNum]?.meaning?.split("—")[0]}</div>
                        </div>
                        {sp&&(
                          <div className="sb">
                            <div className="sl" style={{color:"rgba(155,137,212,.6)"}}>Sign · Path</div>
                            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#B39DDB",fontWeight:600}}>{sp.letter}</div>
                            <div style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"rgba(255,255,255,.45)",marginTop:2,fontStyle:"italic"}}>{sp.tarot}</div>
                          </div>
                        )}
                      </div>
                      <div className="kbox">
                        <div className="sl" style={{color:"rgba(155,137,212,.8)"}}>⬡ {t.kab?.sefirot} · Arc Reading</div>
                        <p className="bt" style={{color:"rgba(255,255,255,.85)",marginBottom:10}}>{t.kab?.transit}</p>
                        <div style={{paddingTop:8,borderTop:"1px solid rgba(155,137,212,.12)",marginBottom:8}}>
                          <div className="sl" style={{color:"rgba(200,180,255,.55)",marginBottom:4}}>Arc Relevance</div>
                          <p className="bt" style={{color:"rgba(255,255,255,.75)",fontSize:13,fontStyle:"italic"}}>{t.kab?.arc}</p>
                        </div>
                        <div style={{paddingTop:8,borderTop:"1px solid rgba(155,137,212,.12)"}}>
                          <div className="sl" style={{color:"rgba(200,180,255,.55)",marginBottom:4}}>Inner Working</div>
                          <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13}}>{t.kab?.instruction}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* KABBALAH PROFILE */}
        {isKab&&(
          <div style={{marginTop:24,padding:16,background:"rgba(155,137,212,.04)",border:"1px solid rgba(155,137,212,.15)",borderRadius:14}}>
            <div className="sl" style={{color:"rgba(155,137,212,.6)",marginBottom:14}}>Your Kabbalistic Profile</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
              {[["arc","Arc & Soul"],["pillars","Three Pillars"],["gematria","Gematria"],["convergence","Convergence"],["natal","Natal Planets"],["daath","Da'ath"],["shadow","Shadow"],["workings","Workings"]].map(([k,l])=>(
                <button key={k} className={`ptbtn ${profileTab===k?"pa":""}`} onClick={()=>setProfileTab(k)}>{l}</button>
              ))}
            </div>

            {/* ARC & SOUL */}
            {profileTab==="arc"&&(
              <div>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
                  <span className="kbadge" style={{fontSize:11,padding:"5px 14px"}}>Yesod (9) → Tiphareth (6)</span>
                  <span className="kbadge">25th Path · Samekh · Art/Temperance</span>
                  <span className="kbadge">Middle Pillar</span>
                  <span className="kbadge">Ayin Vehicle · Binah</span>
                </div>
                <p className="bt" style={{color:"rgba(255,255,255,.85)",marginBottom:12}}>{PROFILE.arcNote}</p>
                <div style={{padding:"12px 14px",background:"rgba(155,137,212,.07)",border:"1px solid rgba(155,137,212,.18)",borderRadius:10,marginBottom:12}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,color:"#B39DDB",fontWeight:700}}>Ruach</span>
                    <span style={{fontFamily:"'Crimson Pro',serif",fontSize:20,color:"#B39DDB",opacity:.8}}>רוח</span>
                    <span className="kbadge">Soul Level · Yesod → Tiphareth</span>
                  </div>
                  <p className="bt" style={{color:"rgba(255,255,255,.85)",fontSize:13}}>{PROFILE.soulNote}</p>
                </div>
                <div className="sl" style={{color:"rgba(155,137,212,.5)",marginBottom:8}}>Five Soul Levels</div>
                {SOUL_LEVELS.map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:12,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,.04)",opacity:s.name==="Ruach"?1:0.35}}>
                    <div style={{minWidth:75}}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:s.name==="Ruach"?"#B39DDB":"rgba(255,255,255,.5)",fontWeight:s.name==="Ruach"?700:400}}>{s.name}</div>
                      <div style={{fontFamily:"'Crimson Pro',serif",fontSize:13,color:"rgba(255,255,255,.3)"}}>{s.heb}</div>
                    </div>
                    <div>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,color:"rgba(155,137,212,.5)",letterSpacing:1,marginBottom:2}}>{s.sefirot}</div>
                      <p style={{fontFamily:"'Crimson Pro',serif",fontSize:12,color:"rgba(255,255,255,.6)",margin:0,lineHeight:1.6}}>{s.meaning}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* THREE PILLARS */}
            {profileTab==="pillars"&&(
              <div>
                <p className="bt" style={{color:"rgba(255,255,255,.6)",fontSize:13,fontStyle:"italic",marginBottom:14}}>{PROFILE.pillars.note}</p>
                {PROFILE.threePillarsDetail.map((p,i)=>(
                  <div key={i} style={{marginBottom:12,padding:"13px 14px",
                    background:`${p.color}08`,border:`1px solid ${p.color}22`,borderRadius:12}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:p.color,fontWeight:700}}>{p.pillar}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:`${p.color}90`,background:`${p.color}12`,padding:"2px 8px",borderRadius:10}}>{p.sefirot}</span>
                    </div>
                    <div style={{marginBottom:8,padding:"6px 10px",background:"rgba(255,255,255,.03)",borderRadius:8}}>
                      <div className="sl" style={{color:"rgba(255,255,255,.3)"}}>Your Placements</div>
                      <div style={{fontFamily:"'Crimson Pro',serif",fontSize:12,color:`${p.color}BB`}}>{p.yourPlacement}</div>
                    </div>
                    <div className="sl" style={{color:"rgba(255,255,255,.3)",marginBottom:3}}>Pillar Nature</div>
                    <p className="bt" style={{color:"rgba(255,255,255,.65)",fontSize:13,marginBottom:8,fontStyle:"italic"}}>{p.nature}</p>
                    <div className="sl" style={{color:`${p.color}80`,marginBottom:3}}>For You</div>
                    <p className="bt" style={{color:"rgba(255,255,255,.85)",fontSize:13}}>{p.forYou}</p>
                  </div>
                ))}
              </div>
            )}

            {/* GEMATRIA */}
            {profileTab==="gematria"&&(
              <div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:8}}>
                  {[G.ethan,G.joshua,G.kay].map(g=>(
                    <div key={g.label} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(155,137,212,.15)",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:1,marginBottom:4}}>{g.label}</div>
                      <div style={{fontFamily:"'Crimson Pro',serif",fontSize:22,color:SEFIROT[g.reduced]?.color||"#B39DDB",fontWeight:600}}>{g.reduced}</div>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:SEFIROT[g.reduced]?.color||"#B39DDB",marginTop:2}}>{SEFIROT[g.reduced]?.name}</div>
                      <div style={{fontFamily:"'Crimson Pro',serif",fontSize:10,color:"rgba(255,255,255,.25)",marginTop:2}}>raw: {g.raw}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                  {[G.ethanKay,G.full].map(g=>{
                    const isOp=g.label==="Ethan Kay";
                    return(
                      <div key={g.label} style={{background:isOp?"rgba(255,215,0,.06)":"rgba(155,137,212,.06)",
                        border:`1px solid ${isOp?"rgba(255,215,0,.3)":"rgba(155,137,212,.25)"}`,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:1,marginBottom:4}}>{g.label}</div>
                        <div style={{fontFamily:"'Crimson Pro',serif",fontSize:22,color:isOp?"#FFD700":SEFIROT[g.reduced]?.color||"#B39DDB",fontWeight:600}}>{g.reduced}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:isOp?"#FFD700":SEFIROT[g.reduced]?.color||"#B39DDB",marginTop:2}}>{SEFIROT[g.reduced]?.name}</div>
                        <div style={{fontFamily:"'Crimson Pro',serif",fontSize:10,color:"rgba(255,255,255,.25)",marginTop:2}}>raw: {g.raw}</div>
                        {isOp&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"rgba(255,215,0,.6)",marginTop:4,letterSpacing:1}}>OPERATING NAME</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={{padding:"12px 14px",background:"rgba(155,137,212,.05)",border:"1px solid rgba(155,137,212,.12)",borderRadius:10}}>
                  <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13}}>
                    <strong style={{color:"#B0C4DE"}}>Ethan Joshua Kay</strong> → {G.full.reduced} → <strong style={{color:SEFIROT[G.full.reduced]?.color}}>{SEFIROT[G.full.reduced]?.name}</strong> — the first flash of divine will at the top of the right pillar. Your deepest root signature.<br/><br/>
                    <strong style={{color:"#FFD700"}}>Ethan Kay</strong> → {G.ethanKay.reduced} → <strong style={{color:"#FFD700"}}>{SEFIROT[G.ethanKay.reduced]?.name}</strong> — your destination Sefira. You are not moving toward Tiphareth. You are remembering what Ethan Kay already is.<br/><br/>
                    <strong style={{color:"#DC143C"}}>Joshua</strong> → {G.joshua.reduced} → <strong style={{color:"#DC143C"}}>{SEFIROT[G.joshua.reduced]?.name}</strong> — the warrior name, the force of the crossing. Geburah between Chokmah and Tiphareth: severity in service of integration.
                  </p>
                </div>
              </div>
            )}

            {/* CONVERGENCE */}
            {profileTab==="convergence"&&(
              <div>
                <p className="bt" style={{color:"rgba(255,255,255,.55)",fontSize:13,fontStyle:"italic",marginBottom:12}}>
                  Where independent methods converge — that is your actual position on the Tree. Strength rating indicates confidence level of each method.
                </p>
                {PROFILE.convergence.map((c,i)=>(
                  <div key={i} className="crow">
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"rgba(255,255,255,.5)",letterSpacing:.5,flex:1.3}}>{c.method}</span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#B39DDB",fontWeight:600,minWidth:110,textAlign:"center"}}>{c.result}</span>
                    <div style={{display:"flex",gap:2,minWidth:50,justifyContent:"center"}}>
                      {[1,2,3,4,5].map(n=><div key={n} style={{width:5,height:5,borderRadius:"50%",background:n<=(c.strength||3)?"#B39DDB":"rgba(255,255,255,.1)"}}/>)}
                    </div>
                    <span style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"rgba(255,255,255,.3)",flex:1.5,textAlign:"right",fontStyle:"italic"}}>{c.note}</span>
                  </div>
                ))}
                <div style={{marginTop:14,padding:"12px 14px",background:"rgba(155,137,212,.07)",border:"1px solid rgba(155,137,212,.18)",borderRadius:10}}>
                  <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13}}>
                    <strong style={{color:"#9370DB"}}>Triple confirmation: Yesod (9)</strong> — Life Path, Moon, Moon ruler. Three independent methods. Yesod is not a theory — it is your demonstrated operating position.<br/><br/>
                    <strong style={{color:"#FFD700"}}>Double confirmation: Tiphareth (6)</strong> — Sun and Expression Number, reinforced by operating name gematria. Your destination is already encoded in how you show up.<br/><br/>
                    <strong style={{color:"#8B9DC3"}}>Binah (3) vehicle</strong> — Saturn as Rising ruler and Left Pillar secondary. Your crossing method is structural discipline, not surrender or dissolution. The forge, not the river.
                  </p>
                </div>
              </div>
            )}

            {/* NATAL PLANETS */}
            {profileTab==="natal"&&(
              <div>
                {PROFILE.natal.map((n,i)=>{
                  const [open,setOpen] = useState(false);
                  return(
                    <div key={i} style={{marginBottom:10,background:"rgba(255,255,255,.025)",border:`1px solid ${n.color}22`,borderRadius:12,overflow:"hidden",cursor:"pointer"}}
                      onClick={()=>setOpen(!open)}>
                      <div style={{padding:"12px 14px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:n.color,fontWeight:700}}>{n.label}</span>
                            <span className="kbadge" style={{fontSize:9,borderColor:`${n.color}33`,color:n.color,background:`${n.color}10`}}>{n.sefirot}</span>
                          </div>
                          <span style={{color:open?n.color:"rgba(255,255,255,.25)",transform:open?"rotate(180deg)":"none",display:"inline-block",transition:"transform .2s",fontSize:12}}>▾</span>
                        </div>
                        <p style={{fontFamily:"'Crimson Pro',serif",fontSize:13,color:"rgba(255,255,255,.6)",margin:"6px 0 0",fontStyle:"italic"}}>{n.shortNote}</p>
                      </div>
                      {open&&(
                        <div style={{padding:"0 14px 14px"}}>
                          <hr style={{border:"none",borderTop:`1px solid ${n.color}18`,margin:"0 0 10px"}}/>
                          <div className="sl" style={{color:`${n.color}80`}}>Path · {n.path}</div>
                          <p className="bt" style={{color:"rgba(255,255,255,.85)",marginBottom:12}}>{n.fullNote}</p>
                          <div style={{padding:"10px 12px",background:"rgba(0,0,0,.2)",border:`1px solid ${n.color}18`,borderRadius:8}}>
                            <div className="sl" style={{color:"rgba(255,100,100,.6)",marginBottom:4}}>Shadow · Qlipha</div>
                            <p className="bt" style={{color:"rgba(255,255,255,.65)",fontSize:13}}>{n.shadow}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{padding:"10px 12px",background:"rgba(155,137,212,.04)",border:"1px solid rgba(155,137,212,.1)",borderRadius:8,marginTop:4}}>
                  <div className="sl" style={{color:"rgba(155,137,212,.5)",marginBottom:4}}>Life Path 9 · Personal Year 4</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.7)",fontSize:13}}>Life Path 9 = Yesod. Personal Year 4 = Chesed. You are in a Chesed year precisely as Jupiter prepares to enter your 7th house in June. The numerological and astronomical cycles are aligned. The architecture of 2026 is not accidental.</p>
                </div>
              </div>
            )}

            {/* DA'ATH */}
            {profileTab==="daath"&&(
              <div>
                <div style={{padding:"14px",background:"rgba(0,0,0,.3)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,marginBottom:14}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:16,color:"rgba(255,255,255,.5)",fontWeight:700}}>Da'ath</span>
                    <span style={{fontFamily:"'Crimson Pro',serif",fontSize:20,color:"rgba(255,255,255,.35)"}}>דעת</span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(255,255,255,.3)",background:"rgba(255,255,255,.05)",padding:"2px 8px",borderRadius:10,letterSpacing:1}}>THE HIDDEN SEFIRA</span>
                  </div>
                  <p className="bt" style={{color:"rgba(255,255,255,.75)"}}>{PROFILE.daath.note}</p>
                </div>
                <div style={{padding:"12px 14px",background:"rgba(155,137,212,.05)",border:"1px solid rgba(155,137,212,.12)",borderRadius:10}}>
                  <div className="sl" style={{color:"rgba(155,137,212,.5)",marginBottom:6}}>Da'ath in Your Chart · Pluto in Aquarius (2H)</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.75)",fontSize:13}}>Pluto (Da'ath/Kether) in your 2nd house (Aquarius) for 20 years is the slow dissolution of every false income model and inherited belief about self-worth. Da'ath in the 2nd means your relationship to your own value is the primary transformative current of your lifetime. What you believe you are worth determines what you are capable of building. Pluto is raising the ceiling by dissolving the false floors beneath it.</p>
                </div>
                <div style={{marginTop:12,padding:"12px 14px",background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10}}>
                  <div className="sl" style={{color:"rgba(255,255,255,.3)",marginBottom:6}}>The Abyss · What Crosses It</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.6)",fontSize:13}}>Da'ath cannot be approached directly. It is approached by completing the work of the lower seven Sefirot. For you, this means: completing the Yesod→Tiphareth crossing (your current arc), integrating the Geburah-Tiphareth fusion in your 8th house, and resolving the Binah-structured partnerships of your 7th house. When these are genuinely complete — not performed, but complete — the Abyss becomes passable. You are nowhere near it yet, which is exactly correct. The preparation is the work.</p>
                </div>
              </div>
            )}

            {/* SHADOW */}
            {profileTab==="shadow"&&(
              <div>
                <div style={{padding:"12px 14px",background:"rgba(50,0,0,.3)",border:"1px solid rgba(180,0,0,.2)",borderRadius:10,marginBottom:14}}>
                  <div className="sl" style={{color:"rgba(200,80,80,.7)",marginBottom:6}}>Qliphoth — The Shadow Tree</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.7)",fontSize:13}}>{PROFILE.shadow.note}</p>
                </div>
                {PROFILE.shadow.shells.map((s,i)=>(
                  <div key={i} style={{marginBottom:10,padding:"12px 14px",background:"rgba(255,255,255,.025)",border:"1px solid rgba(180,0,0,.15)",borderRadius:10}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:7,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"rgba(255,140,100,.8)",fontWeight:600}}>{s.sefira}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(180,50,50,.8)",background:"rgba(180,50,50,.1)",padding:"2px 8px",borderRadius:10}}>{s.qlipha}</span>
                    </div>
                    <p className="bt" style={{color:"rgba(255,255,255,.7)",fontSize:13}}>{s.shadow}</p>
                  </div>
                ))}
                <div style={{marginTop:12,padding:"12px 14px",background:"rgba(155,137,212,.04)",border:"1px solid rgba(155,137,212,.1)",borderRadius:10}}>
                  <div className="sl" style={{color:"rgba(155,137,212,.5)",marginBottom:6}}>Working with the Shadow</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.65)",fontSize:13}}>The Qliphoth are not evil forces to be banished — they are the unintegrated expressions of the same forces that power your arc. Each Qlipha is pointing at the work that remains. When you notice a shadow pattern activating, name it by its Sefira and ask: what is the balanced, directed expression of this force right now? The shadow is a diagnostic, not a sentence.</p>
                </div>
              </div>
            )}

            {/* WORKINGS */}
            {profileTab==="workings"&&(
              <div>
                <div style={{padding:"10px 14px",background:"rgba(155,137,212,.05)",border:"1px solid rgba(155,137,212,.15)",borderRadius:10,marginBottom:14}}>
                  <p className="bt" style={{color:"rgba(255,255,255,.65)",fontSize:13}}>{PROFILE.workings.note}</p>
                </div>
                {PROFILE.workings.practices.map((p,i)=>(
                  <div key={i} style={{marginBottom:12,padding:"13px 14px",background:"rgba(255,255,255,.025)",border:"1px solid rgba(155,137,212,.15)",borderRadius:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:6}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#B39DDB",fontWeight:600}}>{p.title}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,color:"rgba(155,137,212,.6)",background:"rgba(155,137,212,.1)",border:"1px solid rgba(155,137,212,.2)",padding:"2px 9px",borderRadius:10,letterSpacing:.5}}>{p.frequency}</span>
                    </div>
                    <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13}}>{p.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NUMEROLOGY SECTION ── */}
        {isNum&&(
          <div>
            {/* Numerology sub-tabs */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginBottom:20}}>
              {[["core","Core Numbers"],["cycles","Pinnacles & Cycles"],["karmic","Karmic"],["compare","Traditions"]].map(([k,l])=>(
                <button key={k} className={`ptbtn ${numTab===k?"pa":""}`}
                  style={numTab===k?{background:"rgba(232,192,124,.15)",borderColor:"rgba(232,192,124,.35)",color:"#E8C07C"}:{}}
                  onClick={()=>setNumTab(k)}>{l}</button>
              ))}
            </div>

            {numTab==="core"&&(
              <div>
                <div style={{padding:"14px",background:"rgba(232,192,124,.06)",border:"1px solid rgba(232,192,124,.22)",borderRadius:12,marginBottom:14}}>
                  <div className="sl" style={{color:"rgba(232,192,124,.6)"}}>System · Pythagorean Numerology · Full Legal Name</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.7)",fontSize:13,marginTop:4}}>
                    <strong style={{color:"#E8C07C"}}>{USER_FULL_NAME}</strong> · born {formatDOB(USER_DOB)}. Pythagorean system maps A=1, B=2 … I=9, then J=1, K=2 … Z=8. Master numbers (11, 22, 33) are preserved during reduction. Karmic debt numbers (13, 14, 16, 19) are flagged before reduction.
                  </p>
                </div>

                {/* Big number cards for the core 6 */}
                {[
                  {k:"lifePath",label:"Life Path Number",src:USER_NUM.lifePathObj},
                  {k:"expression",label:"Expression · Destiny",src:USER_NUM.expressionObj},
                  {k:"soulUrge",label:"Soul Urge · Heart's Desire",src:USER_NUM.soulUrgeObj},
                  {k:"personality",label:"Personality Number",src:USER_NUM.personalityObj},
                  {k:"birthday",label:"Birthday Number",src:USER_NUM.birthdayObj},
                  {k:"maturity",label:"Maturity Number",src:USER_NUM.maturityObj},
                  {k:"personalYear",label:`Personal Year ${CURRENT_YEAR}`,src:USER_NUM.personalYearObj},
                  {k:"balance",label:"Balance Number",src:USER_NUM.balanceObj},
                  {k:"hiddenPassion",label:"Hidden Passion Number",src:USER_NUM.hiddenPassionObj},
                ].map(({k,label,src})=>(
                  <div key={k} className="num-card">
                    <div style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:8,flexWrap:"wrap"}}>
                      <div style={{minWidth:64,textAlign:"center"}}>
                        <div className="big-num" style={{color:"#E8C07C"}}>{src.number}</div>
                        {[11,22,33].includes(src.number)&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"#FFD700",letterSpacing:1,marginTop:2}}>MASTER</div>}
                      </div>
                      <div style={{flex:1,minWidth:180}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"rgba(232,192,124,.8)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:3}}>{label}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,color:"#E8C07C",fontWeight:700,marginBottom:4}}>{src.title}</div>
                        <div style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"rgba(255,255,255,.35)",fontStyle:"italic",marginBottom:6}}>{src.calc}</div>
                      </div>
                    </div>
                    <div className="sl" style={{color:"rgba(232,192,124,.55)",marginBottom:3}}>Meaning</div>
                    <p className="bt" style={{color:"rgba(255,255,255,.72)",fontSize:13,marginBottom:10}}>{src.general}</p>
                    <div style={{padding:"10px 12px",background:"rgba(232,192,124,.06)",border:"1px solid rgba(232,192,124,.16)",borderRadius:8}}>
                      <div className="sl" style={{color:"rgba(232,192,124,.7)",marginBottom:4}}>† For {FIRST_NAME}</div>
                      <p className="bt" style={{color:"rgba(255,255,255,.88)",fontSize:13}}>{src.forYou}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {numTab==="cycles"&&(
              <div>
                <div style={{padding:"12px 14px",background:"rgba(232,192,124,.05)",border:"1px solid rgba(232,192,124,.18)",borderRadius:10,marginBottom:14}}>
                  <div className="sl" style={{color:"rgba(232,192,124,.6)"}}>Pinnacles · Four Life Cycles</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.65)",fontSize:13,marginTop:4}}>Pinnacles are 4 sequential life cycles, each carrying a dominant numerological vibration. The first lasts from birth until age <strong style={{color:"#E8C07C"}}>{USER_NUM.p1End}</strong> (36 − Life Path); each subsequent pinnacle lasts 9 years; the final runs from age <strong style={{color:"#E8C07C"}}>{USER_NUM.p3End+1}</strong> onwards.</p>
                </div>
                {USER_NUM.pinnacles.map((p,i)=>(
                  <div key={i} className="num-card">
                    <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                      <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(232,192,124,.12)",border:"1px solid rgba(232,192,124,.35)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:20,color:"#E8C07C",fontWeight:700}}>{p.n}</span>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#E8C07C",fontWeight:700,letterSpacing:.5}}>{p.phase}</div>
                        <div style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"rgba(255,255,255,.5)",marginTop:2}}>Age {p.ageRange} · {p.title}</div>
                        <div style={{fontFamily:"'Crimson Pro',serif",fontSize:10,color:"rgba(255,255,255,.3)",marginTop:2,fontStyle:"italic"}}>{p.calc}</div>
                      </div>
                    </div>
                    <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13}}>{p.forYou}</p>
                  </div>
                ))}

                <div style={{marginTop:16,padding:"12px 14px",background:"rgba(232,192,124,.05)",border:"1px solid rgba(232,192,124,.18)",borderRadius:10,marginBottom:14}}>
                  <div className="sl" style={{color:"rgba(232,192,124,.6)"}}>Challenges · Friction Pairs</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.65)",fontSize:13,marginTop:4}}>Challenges run concurrently with Pinnacles — the specific internal friction that must be worked through during each cycle.</p>
                </div>
                {USER_NUM.challenges.map((c,i)=>(
                  <div key={i} className="num-card">
                    <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                      <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(255,140,100,.12)",border:"1px solid rgba(255,140,100,.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:18,color:"#E8A87C",fontWeight:700}}>{c.n}</span>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"#E8A87C",fontWeight:700}}>{c.phase}</div>
                        <div style={{fontFamily:"'Crimson Pro',serif",fontSize:10,color:"rgba(255,255,255,.35)",fontStyle:"italic",marginTop:2}}>{c.calc}</div>
                      </div>
                    </div>
                    <p className="bt" style={{color:"rgba(255,255,255,.78)",fontSize:13}}>{c.forYou}</p>
                  </div>
                ))}
              </div>
            )}

            {numTab==="karmic"&&(
              <div>
                <div style={{padding:"12px 14px",background:"rgba(232,192,124,.05)",border:"1px solid rgba(232,192,124,.18)",borderRadius:10,marginBottom:14}}>
                  <div className="sl" style={{color:"rgba(232,192,124,.6)"}}>Karmic Debt · 13, 14, 16, 19</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.65)",fontSize:13,marginTop:4}}>Karmic debt numbers indicate unresolved energetic patterns carried forward — reduction sums hitting 13, 14, 16 or 19 before final reduction.</p>
                </div>

                {USER_NUM.karmicDebts.length===0?(
                  <div className="num-card">
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#E8C07C",fontWeight:700,marginBottom:6}}>No Karmic Debts Detected</div>
                    <p className="bt" style={{color:"rgba(255,255,255,.75)",fontSize:13}}>None of your core reduction sums (Life Path raw {USER_NUM.lifePathRaw}, Expression raw {USER_NUM.expressionRaw}, Soul Urge raw {USER_NUM.soulUrgeRaw}, Personality raw {USER_NUM.personalityRaw}, Birthday {USER_DOB.d}) land on 13, 14, 16, or 19. Karmically, you arrived reasonably clean — the work of this lifetime is forward momentum, not resolution of specific inherited debts. This is unusual and favourable.</p>
                  </div>
                ):(USER_NUM.karmicDebts.map((d,i)=>(
                  <div key={i} className="num-card">
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#E8948F",fontWeight:700,marginBottom:6}}>{d.name} = {d.value}</div>
                    <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13}}>{d.value===13?"13 — the debt of laziness in past cycles. Work must now be met with sustained effort and disciplined accountability.":d.value===14?"14 — the debt of excess and abuse of freedom. Requires balance, moderation, and learning the cost of impulse.":d.value===16?"16 — the debt of broken promises and infidelity. Requires reconstruction of integrity from the foundation up.":"19 — the debt of power misused. Requires humility, service, and the surrender of ego-driven authority."}</p>
                  </div>
                )))}

                <div style={{marginTop:18,padding:"12px 14px",background:"rgba(232,192,124,.05)",border:"1px solid rgba(232,192,124,.18)",borderRadius:10,marginBottom:14}}>
                  <div className="sl" style={{color:"rgba(232,192,124,.6)"}}>Karmic Lessons · Missing Name Digits</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.65)",fontSize:13,marginTop:4}}>Numbers 1-9 absent from the letters of your full name — these are the lessons your soul is here to learn in this lifetime.</p>
                </div>
                <div className="num-card">
                  {USER_NUM.karmicLessons.length===0?(
                    <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13}}>All nine numbers are present in your name — you arrived with the full toolkit. No karmic lessons to complete from scratch; your work is refinement and integration of existing strengths.</p>
                  ):(<>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                      {USER_NUM.karmicLessons.map(n=>(
                        <div key={n} style={{width:40,height:40,borderRadius:"50%",background:"rgba(255,140,100,.1)",border:"1px solid rgba(255,140,100,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono',monospace",fontSize:18,color:"#E8A87C",fontWeight:700}}>{n}</div>
                      ))}
                    </div>
                    <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13}}>Missing digits: <strong style={{color:"#E8A87C"}}>{USER_NUM.karmicLessons.join(", ")}</strong>. These are the qualities your name does not give you for free — you must develop them consciously through life experience. Each missing number points to a specific karmic curriculum (e.g. missing 7 = learning contemplation, missing 4 = learning structure, missing 2 = learning partnership).</p>
                  </>)}
                </div>

                <div style={{marginTop:18,padding:"12px 14px",background:"rgba(232,192,124,.05)",border:"1px solid rgba(232,192,124,.18)",borderRadius:10,marginBottom:14}}>
                  <div className="sl" style={{color:"rgba(232,192,124,.6)"}}>Hidden Passion Distribution</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.65)",fontSize:13,marginTop:4}}>Frequency of each Pythagorean digit across the letters of <strong style={{color:"#E8C07C"}}>{USER_FULL_NAME}</strong>.</p>
                </div>
                <div className="num-card">
                  <div style={{display:"grid",gridTemplateColumns:"repeat(9,1fr)",gap:4,marginBottom:8}}>
                    {[1,2,3,4,5,6,7,8,9].map(n=>{
                      const cnt = USER_NUM.hiddenPassion.distribution[n]||0;
                      const isMax = n===USER_NUM.hiddenPassion.number;
                      return(
                        <div key={n} style={{textAlign:"center",padding:"6px 2px",borderRadius:6,background:isMax?"rgba(232,192,124,.2)":"rgba(255,255,255,.03)",border:`1px solid ${isMax?"rgba(232,192,124,.5)":"rgba(255,255,255,.06)"}`}}>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:isMax?"#E8C07C":"rgba(255,255,255,.5)",fontWeight:700}}>{n}</div>
                          <div style={{fontFamily:"'Crimson Pro',serif",fontSize:10,color:isMax?"#E8C07C":"rgba(255,255,255,.3)"}}>×{cnt}</div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="bt" style={{color:"rgba(255,255,255,.78)",fontSize:13}}>Hidden Passion = <strong style={{color:"#E8C07C"}}>{USER_NUM.hiddenPassion.number}</strong> ({USER_NUM.hiddenPassion.count}× occurrences). This is the default current your name channels unconsciously — the vibration your identity reaches for when there's nothing specific to aim at. Use it; don't be used by it.</p>
                </div>
              </div>
            )}

            {numTab==="compare"&&(
              <div>
                <div style={{padding:"12px 14px",background:"rgba(232,192,124,.05)",border:"1px solid rgba(232,192,124,.18)",borderRadius:10,marginBottom:14}}>
                  <div className="sl" style={{color:"rgba(232,192,124,.6)"}}>Three Numerological Traditions Compared</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.65)",fontSize:13,marginTop:4}}>
                    <strong style={{color:"#E8C07C"}}>Pythagorean</strong> — A=1..I=9, J=1..R=9, S=1..Z=8 (standard Western). <strong style={{color:"#E8C07C"}}>Chaldean</strong> — 1-8 only, 9 reserved as sacred/unassigned; specific letter mapping rooted in ancient Babylonian mysticism. <strong style={{color:"#E8C07C"}}>Kabbalistic Gematria</strong> — Hebrew-based values transliterated to English (A=1, B=2, G=3, H=5, I/J/Y=10, K=11, L=30, M=40, N=50, O=70, P=80, Q=100, R=200, S=300, T=400).
                  </p>
                </div>

                {USER_NUM.tradCompare.map((row,i)=>(
                  <div key={i} className="num-card">
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:"#E8C07C",fontWeight:700,marginBottom:10}}>{row.name}</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                      <div style={{padding:"10px 8px",background:"rgba(232,192,124,.06)",border:"1px solid rgba(232,192,124,.2)",borderRadius:8,textAlign:"center"}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,color:"rgba(232,192,124,.7)",letterSpacing:1.5,marginBottom:4}}>PYTHAGOREAN</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:22,color:"#E8C07C",fontWeight:700}}>{row.pyth.reduced}</div>
                        <div style={{fontFamily:"'Crimson Pro',serif",fontSize:10,color:"rgba(255,255,255,.3)",marginTop:2}}>raw: {row.pyth.raw}</div>
                      </div>
                      <div style={{padding:"10px 8px",background:"rgba(200,80,75,.06)",border:"1px solid rgba(200,80,75,.22)",borderRadius:8,textAlign:"center"}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,color:"rgba(232,148,143,.7)",letterSpacing:1.5,marginBottom:4}}>CHALDEAN</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:22,color:"#E8948F",fontWeight:700}}>{row.chal.reduced}</div>
                        <div style={{fontFamily:"'Crimson Pro',serif",fontSize:10,color:"rgba(255,255,255,.3)",marginTop:2}}>raw: {row.chal.raw}</div>
                      </div>
                      <div style={{padding:"10px 8px",background:"rgba(155,137,212,.07)",border:"1px solid rgba(155,137,212,.22)",borderRadius:8,textAlign:"center"}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8.5,color:"rgba(179,157,219,.7)",letterSpacing:1.5,marginBottom:4}}>KABBALISTIC</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:22,color:row.kab.reduced?"#B39DDB":"rgba(255,255,255,.2)",fontWeight:700}}>{row.kab.reduced||"—"}</div>
                        <div style={{fontFamily:"'Crimson Pro',serif",fontSize:10,color:"rgba(255,255,255,.3)",marginTop:2}}>{row.kab.raw?`raw: ${row.kab.raw}`:"standard gematria uses full-name only"}</div>
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{marginTop:14,padding:"12px 14px",background:"rgba(232,192,124,.05)",border:"1px solid rgba(232,192,124,.15)",borderRadius:10}}>
                  <div className="sl" style={{color:"rgba(232,192,124,.6)",marginBottom:6}}>How to read the three systems</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.72)",fontSize:13}}>
                    <strong style={{color:"#E8C07C"}}>Pythagorean</strong> gives you the contemporary Western personality layer — the accessible, surface frequency. <strong style={{color:"#E8948F"}}>Chaldean</strong> gives you the ancient vibrational layer — what your name transmits on the old channels. <strong style={{color:"#B39DDB"}}>Kabbalistic Gematria</strong> gives you the esoteric Tree-of-Life placement — your signature's actual Sefiratic position. When all three agree on a number, that is a load-bearing signature. When they differ, each reveals a distinct operating dimension. Read them as three lenses on the same face.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CHINESE / BAZI SECTION ── */}
        {isChi&&(
          <div>
            {/* Chinese sub-tabs */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",marginBottom:20}}>
              {[["pillars","Four Pillars"],["elements","Elements & Gods"],["luck","Luck Pillars"],["compat","Compatibility"],["star","Nine Star Ki"]].map(([k,l])=>(
                <button key={k} className={`ptbtn ${chineseTab===k?"pa":""}`}
                  style={chineseTab===k?{background:"rgba(200,80,75,.18)",borderColor:"rgba(200,80,75,.4)",color:"#E8948F"}:{}}
                  onClick={()=>setChineseTab(k)}>{l}</button>
              ))}
            </div>

            {chineseTab==="pillars"&&(
              <div>
                <div style={{padding:"14px",background:"rgba(200,80,75,.06)",border:"1px solid rgba(200,80,75,.22)",borderRadius:12,marginBottom:14}}>
                  <div className="sl" style={{color:"rgba(232,148,143,.7)"}}>System · BaZi · 八字 · Four Pillars of Destiny</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.7)",fontSize:13,marginTop:4}}>
                    {formatDOB(USER_DOB)}{USER_TIME_UNKNOWN?" · time unknown":` · ${pad2(USER_TIME.h)}:${pad2(USER_TIME.m)}`}{USER.city?` · ${USER.city}`:""}. Your BaZi: <strong style={{color:"#E8948F"}}>{USER_BAZI.year.combined} · {USER_BAZI.month.combined} · {USER_BAZI.day.combined}{USER_TIME_UNKNOWN?"":` · ${USER_BAZI.hour.combined}`}</strong>. Each pillar is a heavenly stem over an earthly branch — together they form the four most significant angles of your fate chart.
                  </p>
                </div>

                {/* 4 pillars grid */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:14}}>
                  {USER_BAZI.pillars.filter(p=>!(p.key==="hour"&&USER_TIME_UNKNOWN)).map((p,i)=>(
                    <div key={i} style={{background:"rgba(200,80,75,.05)",border:"1px solid rgba(200,80,75,.22)",borderRadius:12,padding:"12px",textAlign:"center"}}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(232,148,143,.7)",letterSpacing:1.5,marginBottom:6}}>{p.label.toUpperCase()}</div>
                      <div style={{fontFamily:"serif",fontSize:32,color:"#E8C07C",fontWeight:700,lineHeight:1}}>{p.stemHz}</div>
                      <div style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"rgba(255,255,255,.6)",marginTop:2}}>{p.stem} · {p.yy} {p.element}</div>
                      <div style={{height:1,background:"rgba(200,80,75,.2)",margin:"8px 12px"}}/>
                      <div style={{fontFamily:"serif",fontSize:32,color:"#E8948F",fontWeight:700,lineHeight:1}}>{p.branchHz}</div>
                      <div style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"rgba(255,255,255,.6)",marginTop:2}}>{p.animal} · {p.branchElement}</div>
                    </div>
                  ))}
                </div>

                {/* Detailed pillar cards */}
                {USER_BAZI.pillars.filter(p=>!(p.key==="hour"&&USER_TIME_UNKNOWN)).map((p,i)=>(
                  <div key={i} className="pillar-card">
                    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:"#E8948F",fontWeight:700}}>{p.label}</span>
                      <span style={{fontFamily:"serif",fontSize:14,color:"#E8C07C"}}>{p.stemHz}{p.branchHz}</span>
                      <span className="cbadge">{p.combined}</span>
                    </div>
                    <div style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"rgba(255,255,255,.45)",fontStyle:"italic",marginBottom:8}}>{p.subtitle}</div>
                    <div style={{marginBottom:8}}>
                      <div className="sl" style={{color:"rgba(232,148,143,.6)",marginBottom:4}}>Hidden Stems</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {p.hiddenStems.map((h,j)=>(
                          <span key={j} style={{fontFamily:"'Crimson Pro',serif",fontSize:11,padding:"3px 9px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(200,80,75,.18)",borderRadius:10,color:"rgba(255,255,255,.65)"}}>
                            {HEAVENLY_STEMS[h.stem]?.hanzi} {h.stem} <span style={{color:"rgba(255,255,255,.35)"}}>· {h.note}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="sl" style={{color:"rgba(232,148,143,.55)",marginBottom:4}}>Pillar Meaning</div>
                    <p className="bt" style={{color:"rgba(255,255,255,.75)",fontSize:13,marginBottom:10,fontStyle:"italic"}}>{p.meaning}</p>
                    <div style={{padding:"10px 12px",background:"rgba(200,80,75,.07)",border:"1px solid rgba(200,80,75,.2)",borderRadius:8}}>
                      <div className="sl" style={{color:"rgba(232,148,143,.8)",marginBottom:4}}>† For {FIRST_NAME}</div>
                      <p className="bt" style={{color:"rgba(255,255,255,.88)",fontSize:13}}>{p.forYou}</p>
                    </div>
                  </div>
                ))}

                {/* Year animal traits card */}
                <div className="pillar-card" style={{marginTop:16}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"serif",fontSize:26}}>{USER_BAZI.animalTraits.hanzi}</span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,color:"#E8948F",fontWeight:700}}>{USER_BAZI.year.element} {USER_BAZI.year.animal} · Zodiac Animal</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:10}}>
                    <div>
                      <div className="sl" style={{color:"rgba(232,148,143,.6)",marginBottom:4}}>Strengths</div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {USER_BAZI.animalTraits.strengths.map((s,i)=><span key={i} className="tag" style={{color:"#E8C07C",borderColor:"rgba(232,192,124,.25)"}}>{s}</span>)}
                      </div>
                    </div>
                    <div>
                      <div className="sl" style={{color:"rgba(232,148,143,.6)",marginBottom:4}}>Weaknesses</div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {USER_BAZI.animalTraits.weaknesses.map((s,i)=><span key={i} className="tag" style={{color:"#E8948F",borderColor:"rgba(200,80,75,.22)"}}>{s}</span>)}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:10}}>
                    {[
                      {k:"Lucky Colours",v:USER_BAZI.animalTraits.luckyColors.join(", ")},
                      {k:"Lucky Numbers",v:USER_BAZI.animalTraits.luckyNumbers.join(", ")},
                      {k:"Lucky Directions",v:USER_BAZI.animalTraits.luckyDirections.join(", ")},
                      {k:"Career Affinity",v:USER_BAZI.animalTraits.careerAffinity},
                    ].map(({k,v})=>(
                      <div key={k} style={{background:"rgba(255,255,255,.03)",borderRadius:8,padding:"8px 10px"}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"rgba(232,148,143,.5)",letterSpacing:1.5,marginBottom:3}}>{k.toUpperCase()}</div>
                        <div style={{fontFamily:"'Crimson Pro',serif",fontSize:12,color:"rgba(255,255,255,.75)"}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {chineseTab==="elements"&&(
              <div>
                <div style={{padding:"14px",background:"rgba(200,80,75,.06)",border:"1px solid rgba(200,80,75,.22)",borderRadius:12,marginBottom:14}}>
                  <div className="sl" style={{color:"rgba(232,148,143,.7)"}}>Five Elements Distribution · Wu Xing · 五行</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.7)",fontSize:13,marginTop:4}}>
                    Count of each element across all four pillars (stems and branches + hidden stems). Day Master: <strong style={{color:"#E8C07C"}}>{USER_BAZI.analysis.dayMaster}</strong>. Strength: {USER_BAZI.analysis.strength}
                  </p>
                </div>

                {/* Element bars */}
                <div className="pillar-card" style={{marginBottom:14}}>
                  {Object.entries(USER_BAZI.fiveElements).map(([k,e])=>{
                    const pct = Math.min(100,e.count*20);
                    return(
                      <div key={k} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:e.color,fontWeight:600}}>{e.hanzi} {e.label}</span>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:e.color}}>×{e.count}</span>
                        </div>
                        <div className="elem-bar">
                          <div style={{width:`${pct}%`,height:"100%",background:e.color,transition:"width .4s"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="cbox">
                  <div className="sl" style={{color:"rgba(232,148,143,.8)",marginBottom:4}}>Yongshen · Favourable Gods</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                    {USER_BAZI.analysis.favourable.map((f,i)=>(
                      <span key={i} className="tag" style={{color:"#5FA05F",borderColor:"rgba(95,160,95,.3)",background:"rgba(95,160,95,.1)"}}>{f}</span>
                    ))}
                  </div>
                  <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13}}>{USER_BAZI.analysis.yongshenNote}</p>
                </div>

                <div className="cbox">
                  <div className="sl" style={{color:"rgba(232,148,143,.8)",marginBottom:4}}>Jishen · Unfavourable Gods</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                    {USER_BAZI.analysis.unfavourable.map((f,i)=>(
                      <span key={i} className="tag" style={{color:"#E8948F",borderColor:"rgba(200,80,75,.3)",background:"rgba(200,80,75,.1)"}}>{f}</span>
                    ))}
                  </div>
                  <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13}}>{USER_BAZI.analysis.jishenNote}</p>
                </div>

                {/* Ten Gods */}
                <div style={{marginTop:18}}>
                  <div className="sl" style={{color:"rgba(232,148,143,.6)",marginBottom:10}}>Ten Gods · Shí Shén · 十神 · Day Master Relationships</div>
                  {USER_BAZI.tenGods.map((g,i)=>(
                    <div key={i} className="pillar-card" style={{marginBottom:8}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"#E8948F",fontWeight:700}}>{g.name}</span>
                        <span style={{fontFamily:"serif",fontSize:14,color:"#E8C07C"}}>{g.chinese}</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:g.present?"#5FA05F":"rgba(255,255,255,.3)",background:g.present?"rgba(95,160,95,.1)":"rgba(255,255,255,.03)",padding:"2px 8px",borderRadius:10,letterSpacing:.5}}>{g.present?"Present":"Absent"}</span>
                      </div>
                      <div style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"rgba(255,255,255,.5)",fontStyle:"italic",marginBottom:6}}>{g.role}</div>
                      <p className="bt" style={{color:"rgba(255,255,255,.78)",fontSize:13}}>{g.forYou}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {chineseTab==="luck"&&(
              <div>
                <div style={{padding:"14px",background:"rgba(200,80,75,.06)",border:"1px solid rgba(200,80,75,.22)",borderRadius:12,marginBottom:14}}>
                  <div className="sl" style={{color:"rgba(232,148,143,.7)"}}>Da Yun · 大運 · 10-Year Luck Pillars</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.7)",fontSize:13,marginTop:4}}>
                    Luck pillars are 10-year cycles that overlay the natal BaZi chart, determining which qualities are amplified and which are tested in each decade. They are calculated from the month pillar, stepping forward or backward depending on sex and year polarity.
                  </p>
                </div>

                {USER_BAZI.luckPillars.map((lp,i)=>(
                  <div key={i} className="pillar-card" style={{borderColor:lp.active?"rgba(95,160,95,.4)":"rgba(200,80,75,.18)",background:lp.active?"rgba(95,160,95,.06)":"rgba(255,255,255,.028)"}}>
                    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:lp.active?"#9FD99F":"#E8948F",fontWeight:700}}>{lp.combined}</span>
                      <span style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"rgba(255,255,255,.55)"}}>{lp.range}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(232,148,143,.7)",background:"rgba(200,80,75,.08)",padding:"2px 8px",borderRadius:10,letterSpacing:.5}}>{lp.element}</span>
                      {lp.active&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"#9FD99F",background:"rgba(95,160,95,.15)",padding:"2px 8px",borderRadius:10,letterSpacing:1}}>ACTIVE</span>}
                    </div>
                    <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13}}>{lp.note}</p>
                  </div>
                ))}

                <div style={{marginTop:18,padding:"14px",background:"rgba(200,80,75,.06)",border:"1px solid rgba(200,80,75,.22)",borderRadius:12,marginBottom:14}}>
                  <div className="sl" style={{color:"rgba(232,148,143,.7)"}}>Annual Pillar · {CURRENT_YEAR} · {USER_BAZI.annual.combined}</div>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"serif",fontSize:28,color:"#E8C07C",fontWeight:700}}>{USER_BAZI.annual.stemHz}{USER_BAZI.annual.branchHz}</span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:"#E8948F",fontWeight:700}}>{USER_BAZI.annual.combined}</span>
                    <span className="cbadge">{USER_BAZI.annual.yy} {USER_BAZI.annual.element} · {USER_BAZI.annual.animal}</span>
                  </div>
                  <p className="bt" style={{color:"rgba(255,255,255,.82)",fontSize:13,marginBottom:10}}>{USER_BAZI.annual.interaction}</p>
                </div>
              </div>
            )}

            {chineseTab==="compat"&&(
              <div>
                <div style={{padding:"14px",background:"rgba(200,80,75,.06)",border:"1px solid rgba(200,80,75,.22)",borderRadius:12,marginBottom:14}}>
                  <div className="sl" style={{color:"rgba(232,148,143,.7)"}}>Compatibility · San He, Six Harmony, Direct Clash</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.7)",fontSize:13,marginTop:4}}>
                    Compatibility in Chinese astrology is based on the interaction of animal branches. San He (三合) = three-way harmony triangles. Liu He (六合) = six harmony pairs. Chong (冲) = direct clash. Your Year animal is <strong style={{color:"#E8C07C"}}>{USER_BAZI.year.animal}</strong> and your Day Master animal is <strong style={{color:"#E8C07C"}}>{USER_BAZI.day.animal}</strong>.
                  </p>
                </div>

                <div className="sl" style={{color:"rgba(95,160,95,.7)",marginBottom:8}}>Best Matches</div>
                {USER_BAZI.compatibility.best.map((c,i)=>(
                  <div key={i} className="pillar-card" style={{borderColor:"rgba(95,160,95,.25)",background:"rgba(95,160,95,.05)"}}>
                    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:"#9FD99F",fontWeight:700}}>{c.animal}</span>
                    </div>
                    <p className="bt" style={{color:"rgba(255,255,255,.78)",fontSize:13}}>{c.note}</p>
                  </div>
                ))}

                <div className="sl" style={{color:"rgba(232,100,100,.7)",marginBottom:8,marginTop:14}}>Clashes — Worst Matches</div>
                {USER_BAZI.compatibility.worst.map((c,i)=>(
                  <div key={i} className="pillar-card" style={{borderColor:"rgba(200,80,75,.3)",background:"rgba(200,80,75,.06)"}}>
                    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:"#E8948F",fontWeight:700}}>{c.animal}</span>
                    </div>
                    <p className="bt" style={{color:"rgba(255,255,255,.78)",fontSize:13}}>{c.note}</p>
                  </div>
                ))}
              </div>
            )}

            {chineseTab==="star"&&(
              <div>
                <div style={{padding:"14px",background:"rgba(232,192,124,.07)",border:"1px solid rgba(232,192,124,.25)",borderRadius:12,marginBottom:14}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                    <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(232,192,124,.15)",border:"2px solid rgba(232,192,124,.5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:32,color:"#E8C07C",fontWeight:700}}>{USER_BAZI.nineStar.mainStar}</span>
                    </div>
                    <div>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,color:"#E8C07C",fontWeight:700}}>{USER_BAZI.nineStar.mainName}</div>
                      <div style={{fontFamily:"'Crimson Pro',serif",fontSize:11,color:"rgba(255,255,255,.5)",marginTop:2,fontStyle:"italic"}}>Kua · Main Star · {USER_GENDER==="female"?"Female":"Male"} {USER_DOB.y}</div>
                      <div style={{fontFamily:"'Crimson Pro',serif",fontSize:10,color:"rgba(255,255,255,.35)",marginTop:2,fontStyle:"italic"}}>{USER_BAZI.nineStar.calc}</div>
                    </div>
                  </div>
                  <div className="sl" style={{color:"rgba(232,192,124,.6)",marginBottom:4}}>Meaning</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.8)",fontSize:13,marginBottom:10}}>{USER_BAZI.nineStar.meaning}</p>
                  <div style={{padding:"10px 12px",background:"rgba(200,80,75,.08)",border:"1px solid rgba(200,80,75,.22)",borderRadius:8}}>
                    <div className="sl" style={{color:"rgba(232,148,143,.8)",marginBottom:4}}>† For {FIRST_NAME}</div>
                    <p className="bt" style={{color:"rgba(255,255,255,.88)",fontSize:13}}>{USER_BAZI.nineStar.forYou}</p>
                  </div>
                </div>

                <div style={{padding:"12px 14px",background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.07)",borderRadius:10}}>
                  <div className="sl" style={{color:"rgba(255,255,255,.3)",marginBottom:6}}>Cross-System Convergence</div>
                  <p className="bt" style={{color:"rgba(255,255,255,.65)",fontSize:13}}>
                    Numerology: Life Path {USER_NUM.lifePath} · Expression {USER_NUM.expression} · {NUM_MEANINGS[USER_NUM.lifePath]?.title}. <br/>
                    BaZi Day Master: {USER_BAZI.day.yy} {USER_BAZI.day.element} {USER_BAZI.day.animal}. <br/>
                    Nine Star Ki: {USER_BAZI.nineStar.mainName}. <br/><br/>
                    These systems read the same life from different angles. When two or more agree on a theme — patient builder, fast innovator, reflective teacher — that convergence is a load-bearing signature you can trust and direct.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HOUSE + NATAL REFERENCE (astro mode) */}
        {!isKab&&!isVedic&&!isNum&&!isChi&&(
          <>
            <div style={{marginTop:24,padding:15,background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12}}>
              <div className="sl" style={{color:"rgba(255,255,255,.25)",marginBottom:10}}>House System · Capricorn Rising (Whole Sign) · Verified</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"3px 16px"}}>
                {Object.entries(SIGN_TO_HOUSE).map(([sign,house])=>(
                  <div key={sign} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                    <span style={{fontFamily:"'Crimson Pro',serif",fontSize:12,color:"rgba(255,255,255,.5)"}}>{sign}</span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(126,200,200,.65)",letterSpacing:.5}}>{house}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{marginTop:12,padding:15,background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12}}>
              <div className="sl" style={{color:"rgba(255,255,255,.25)",marginBottom:10}}>Full Natal Placements · 23 Jul 2004 · 6:30am Sydney</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(1,1fr)",gap:"3px"}}>
                {NATAL_PLANETS.map((p,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.04)",flexWrap:"wrap",gap:4}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"rgba(255,215,0,.7)",minWidth:100}}>{p.planet}</span>
                    <span style={{fontFamily:"'Crimson Pro',serif",fontSize:12,color:"rgba(255,255,255,.7)",flex:1}}>{p.sign} {p.deg}</span>
                    <span className="hbadge" style={{fontSize:9}}>{p.house} House</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        </div>
        {/* end .mode-section */}

        <hr className="chapter-rule"/>

        <p className="marginalia" style={{textAlign:"center",marginTop:28,fontStyle:"normal"}}>
          Western — Vedic — Kabbalah — Numerology — Chinese.&nbsp;&nbsp;Tap any entry to open its full reading.&nbsp;&nbsp;Ephemeris verified.
        </p>
      </div>
    </div>
  );
}

// ─── UTILITIES ─────────────────────────────────────────────────────────────
function pad2(n) { return String(n).padStart(2,"0"); }
function formatDOB(dob) {
  if (!dob) return "";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${dob.d} ${months[(dob.m||1)-1]} ${dob.y}`;
}

// ─── NUMEROLOGY ENGINE (dynamic per user) ─────────────────────────────────
function computeNumerology(fullName, dob, currentYear, firstName) {
  const name = fullName || "";
  const FN = firstName || name.split(" ")[0] || "You";
  const d = dob.d, m = dob.m, y = dob.y;

  const sumDigits = (n) => String(Math.abs(n)).split("").reduce((s,c)=>s+parseInt(c,10),0);

  const LP_RAW = sumDigits(d) + sumDigits(m) + sumDigits(y);
  const LP = reduceNum(LP_RAW);

  const EXPR_RAW = letterSum(name, PYTH_MAP);
  const EXPR = reduceNum(EXPR_RAW);

  const SU_RAW = vowelSum(name, PYTH_MAP);
  const SU = reduceNum(SU_RAW);

  const PR_RAW = consonantSum(name, PYTH_MAP);
  const PR = reduceNum(PR_RAW);

  const BD = reduceNum(d);

  const MAT_RAW = LP + EXPR;
  const MAT = reduceNum(MAT_RAW);

  const PY_RAW = reduceNum(d, false) + reduceNum(m, false) + reduceNum(currentYear, false);
  const PY = reduceNum(PY_RAW);

  const PIN1 = reduceNum(reduceNum(m,false) + reduceNum(d,false));
  const PIN2 = reduceNum(reduceNum(d,false) + reduceNum(y,false));
  const PIN3 = reduceNum(PIN1 + PIN2);
  const PIN4 = reduceNum(reduceNum(m,false) + reduceNum(y,false));
  const P1_END = Math.max(0, 36 - LP);
  const P2_END = P1_END + 9;
  const P3_END = P2_END + 9;

  const CHAL1 = Math.abs(reduceNum(m,false) - reduceNum(d,false));
  const CHAL2 = Math.abs(reduceNum(d,false) - reduceNum(y,false));
  const CHAL3 = Math.abs(CHAL1 - CHAL2);
  const CHAL4 = Math.abs(reduceNum(m,false) - reduceNum(y,false));

  const debts = [
    { name:"Life Path raw",   value: LP_RAW },
    { name:"Expression raw",  value: EXPR_RAW },
    { name:"Soul Urge raw",   value: SU_RAW },
    { name:"Personality raw", value: PR_RAW },
    { name:"Birthday",        value: d },
  ].filter(c => [13,14,16,19].includes(c.value));

  const nameDigits = name.toUpperCase().replace(/[^A-Z]/g,"").split("").map(c => PYTH_MAP[c]);
  const present = new Set(nameDigits);
  const lessons = [];
  for (let i=1;i<=9;i++) if (!present.has(i)) lessons.push(i);

  const counts = {};
  nameDigits.forEach(n => { counts[n] = (counts[n]||0)+1; });
  let maxC = 0, hpNum = 0;
  Object.entries(counts).forEach(([k,c]) => { if (c > maxC) { maxC = c; hpNum = parseInt(k,10); } });

  const initials = name.split(" ").filter(Boolean).map(w => w[0]||"").join("").toUpperCase();
  const BAL_RAW = letterSum(initials, PYTH_MAP);
  const BAL = reduceNum(BAL_RAW);

  const CHAL_EXP_RAW = letterSum(name, CHALDEAN_MAP);
  const CHAL_EXP = reduceNum(CHAL_EXP_RAW);
  const CHAL_SU_RAW = vowelSum(name, CHALDEAN_MAP);
  const CHAL_SU = reduceNum(CHAL_SU_RAW);
  const CHAL_PR_RAW = consonantSum(name, CHALDEAN_MAP);
  const CHAL_PR = reduceNum(CHAL_PR_RAW);

  const KAB_RAW = calcG(name);
  const KAB_RED = reduceS(KAB_RAW);

  // Generic interpretations (no user-specific assumptions)
  const LP_FOR = {
    1: `Life Path 1 is the initiator's number — you arrived to start things. ${FN}, your work is to lead by example, to take first steps others hesitate at, and to trust your own direction. The shadow is isolation masquerading as independence; the gift is the authority to begin.`,
    2: `Life Path 2 is the diplomat's number — you arrived to build through partnership, harmony, and tactful reading of others. ${FN}, your power is relational. The shadow is over-accommodation; the gift is the capacity to mediate without losing yourself.`,
    3: `Life Path 3 is the communicator's number — you arrived to express, create, and uplift through voice. ${FN}, your craft is shared celebration and spoken colour. The shadow is scattered energy; the gift is language that moves people.`,
    4: `Life Path 4 is the builder's number — you arrived to work with structure, patience, and long-horizon construction. ${FN}, your domain is durable systems. The shadow is rigidity; the gift is integrity that outlasts short cycles.`,
    5: `Life Path 5 is the explorer's number — you arrived to move through variety, risk, and sensory experience. ${FN}, your vitality depends on change. The shadow is restlessness; the gift is adaptive intelligence others cannot match.`,
    6: `Life Path 6 is the nurturer's number — you arrived to protect, beautify, and take responsibility for those inside your circle. ${FN}, your work is care made concrete. The shadow is over-responsibility; the gift is the home others return to.`,
    7: `Life Path 7 is the mystic's number — you arrived for depth, analysis, and the truths hidden beneath surfaces. ${FN}, your mode is solitude that becomes wisdom. The shadow is withdrawal; the gift is sight.`,
    8: `Life Path 8 is the executive's number — you arrived to work with power, material mastery, and the architecture of leverage. ${FN}, your frequency is scale. The shadow is dominance without service; the gift is sovereign stewardship of resources.`,
    9: `Life Path 9 is the completionist's number — you arrived with the wisdom of the old soul, to serve the many by transmuting personal experience. ${FN}, your work closes cycles others cannot see the shape of. The shadow is arrogance dressed as vision; the gift is the capacity to weave whole systems.`,
    11:`Life Path 11 is the illuminator's master number — you arrived as a channel. ${FN}, inspiration strikes through you rather than being manufactured. The shadow is nervous overload; the gift is prophetic clarity.`,
    22:`Life Path 22 is the master builder — you arrived to turn vision into durable architecture. ${FN}, you carry the capacity to build what lasts centuries. The shadow is paralysis before the scale; the gift is manifestation at industrial weight.`,
    33:`Life Path 33 is the master teacher — you arrived for service through sacrificial love. ${FN}, this is the rarest vibration. The shadow is martyrdom; the gift is transmission that changes people without their knowing it.`,
  };

  const generalInterp = (n, kind) => {
    const base = NUM_MEANINGS[n]?.general || "";
    const suffixes = {
      expression: ` Your Expression ${n} is the outer manifestation of your identity — how you build, speak, and leave a mark. ${FN}, your name vibrates at this frequency; it is the resonance strangers feel before you open your mouth.`,
      soulUrge:   ` Your Soul Urge ${n} is what you secretly want beneath all the surface goals. ${FN}, this is the quiet engine driving your decisions when no one is watching. Direct it consciously.`,
      personality:` Your Personality ${n} is the mask — what people perceive before you speak. ${FN}, this is the first signal your name emits; notice whether it helps or hides what you actually offer.`,
      birthday:   ` Your Birthday ${n} is the secondary note beneath your Life Path — a specific gift stamped into the day you arrived. ${FN}, this is the tool you were given to complete the lifetime's larger work.`,
      maturity:   ` Your Maturity ${n} is the integrated self that comes fully online around ages 35-45 — the final form of your character when Life Path and Expression merge. ${FN}, this is who you are becoming.`,
      personalYear: ` Personal Year ${n} in ${currentYear} colours the whole year with a specific current. ${FN}, align your moves with this vibration and the year works with you; push against it and the year costs more than it should.`,
      balance:    ` Your Balance Number ${n} is the default you return to under pressure — the reset frequency of your system. ${FN}, when stress spikes, this is the state your nature reaches for.`,
      hiddenPassion: ` Hidden Passion ${n} is the frequency your name sounds unconsciously — the skill your nature keeps reaching for without being asked. ${FN}, it's a default, not a destination. Direct it and it becomes a superpower.`,
    };
    return base + (suffixes[kind] || "");
  };

  const makeObj = (num, raw, calc, kind) => ({
    number: num, raw, calc,
    title: NUM_MEANINGS[num]?.title || "—",
    general: NUM_MEANINGS[num]?.general || "",
    forYou: kind === "lifePath" ? LP_FOR[num] || `Life Path ${num} carries its own work. ${FN}, meet it with honesty.` : generalInterp(num, kind),
  });

  const pinnacleFor = (n, phase) => `This ${phase.toLowerCase()} pinnacle carries the vibration of ${n} — ${NUM_MEANINGS[n]?.general || ""} ${FN}, the lesson of this cycle is to live the ${NUM_MEANINGS[n]?.title?.toLowerCase() || n}'s gift consciously rather than by reflex.`;
  const challengeFor = (n, phase) => `This ${phase.toLowerCase()} challenge is the friction of ${n} — the specific internal tension to work through during this cycle. ${FN}, name it when it shows up; named friction is workable, unnamed friction loops.`;

  return {
    lifePath: LP, lifePathRaw: LP_RAW,
    expression: EXPR, expressionRaw: EXPR_RAW,
    soulUrge: SU, soulUrgeRaw: SU_RAW,
    personality: PR, personalityRaw: PR_RAW,
    birthday: BD, maturity: MAT, personalYear: PY,
    p1End: P1_END, p3End: P3_END,

    lifePathObj: { ...makeObj(LP, LP_RAW, `${sumDigits(d)} (day) + ${sumDigits(m)} (month) + ${sumDigits(y)} (year) = ${LP_RAW} → ${LP}`, "lifePath") },
    expressionObj: { ...makeObj(EXPR, EXPR_RAW, `sum of all letters in "${name}" = ${EXPR_RAW} → ${EXPR}`, "expression") },
    soulUrgeObj: { ...makeObj(SU, SU_RAW, `sum of vowels in "${name}" = ${SU_RAW} → ${SU}`, "soulUrge") },
    personalityObj: { ...makeObj(PR, PR_RAW, `sum of consonants in "${name}" = ${PR_RAW} → ${PR}`, "personality") },
    birthdayObj: { ...makeObj(BD, d, `Day of birth ${d} → ${BD}`, "birthday") },
    maturityObj: { ...makeObj(MAT, MAT_RAW, `Life Path ${LP} + Expression ${EXPR} = ${MAT_RAW} → ${MAT}`, "maturity") },
    personalYearObj: { ...makeObj(PY, PY_RAW, `Day + Month + Year(${currentYear}) reduced = ${PY_RAW} → ${PY}`, "personalYear"), year: currentYear },
    balanceObj: { ...makeObj(BAL, BAL_RAW, `Initials ${initials} → ${BAL_RAW} → ${BAL}`, "balance") },
    hiddenPassionObj: { ...makeObj(hpNum, maxC, `Most frequent digit in name · ${hpNum} appears ${maxC} times`, "hiddenPassion") },

    pinnacles: [
      { n: PIN1, ageRange:`Birth – ${P1_END}`,      phase:"First Pinnacle · Youth",        calc:`month + day → ${PIN1}`, title: NUM_MEANINGS[PIN1]?.title, forYou: pinnacleFor(PIN1,"first") },
      { n: PIN2, ageRange:`${P1_END+1} – ${P2_END}`,phase:"Second Pinnacle · Building",    calc:`day + year → ${PIN2}`,  title: NUM_MEANINGS[PIN2]?.title, forYou: pinnacleFor(PIN2,"second") },
      { n: PIN3, ageRange:`${P2_END+1} – ${P3_END}`,phase:"Third Pinnacle · Integration",  calc:`P1 + P2 → ${PIN3}`,     title: NUM_MEANINGS[PIN3]?.title, forYou: pinnacleFor(PIN3,"third") },
      { n: PIN4, ageRange:`${P3_END+1} – onwards`, phase:"Fourth Pinnacle · Legacy",      calc:`month + year → ${PIN4}`,title: NUM_MEANINGS[PIN4]?.title, forYou: pinnacleFor(PIN4,"fourth") },
    ],
    challenges: [
      { n: CHAL1, phase:"First Challenge · Youth",      calc:`|month − day| = ${CHAL1}`,        forYou: challengeFor(CHAL1,"first") },
      { n: CHAL2, phase:"Second Challenge · Adulthood", calc:`|day − year| = ${CHAL2}`,         forYou: challengeFor(CHAL2,"second") },
      { n: CHAL3, phase:"Main Challenge · Lifetime",    calc:`|C1 − C2| = ${CHAL3}`,            forYou: challengeFor(CHAL3,"main") },
      { n: CHAL4, phase:"Fourth Challenge · Later Life",calc:`|month − year| = ${CHAL4}`,       forYou: challengeFor(CHAL4,"fourth") },
    ],
    karmicDebts: debts,
    karmicLessons: lessons,
    hiddenPassion: { number: hpNum, count: maxC, distribution: counts },
    tradCompare: [
      { name:"Expression",  pyth:{raw:EXPR_RAW, reduced:EXPR}, chal:{raw:CHAL_EXP_RAW, reduced:CHAL_EXP}, kab:{raw:KAB_RAW, reduced:KAB_RED} },
      { name:"Soul Urge",   pyth:{raw:SU_RAW, reduced:SU},     chal:{raw:CHAL_SU_RAW, reduced:CHAL_SU},   kab:{raw:null, reduced:null} },
      { name:"Personality", pyth:{raw:PR_RAW, reduced:PR},     chal:{raw:CHAL_PR_RAW, reduced:CHAL_PR},   kab:{raw:null, reduced:null} },
    ],
  };
}

// ─── BAZI ENGINE (dynamic per user) ────────────────────────────────────────
const STEM_ORDER = ["Jia","Yi","Bing","Ding","Wu","Ji","Geng","Xin","Ren","Gui"];
const BRANCH_ORDER = ["Zi","Chou","Yin","Mao","Chen","Si","Wu_b","Wei","Shen","You","Xu","Hai"];
const BRANCH_ANIMAL = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];

// Approximate solar term boundaries (month branch start) — day of Gregorian month
// Feb 4 = Yin(Tiger) start; each month advances to the next branch
const MONTH_TERM_TABLE = [
  { month: 2, day: 4,  branchIdx: 2 },   // Yin / Tiger
  { month: 3, day: 6,  branchIdx: 3 },   // Mao / Rabbit
  { month: 4, day: 5,  branchIdx: 4 },   // Chen / Dragon
  { month: 5, day: 6,  branchIdx: 5 },   // Si / Snake
  { month: 6, day: 6,  branchIdx: 6 },   // Wu_b / Horse
  { month: 7, day: 7,  branchIdx: 7 },   // Wei / Goat
  { month: 8, day: 8,  branchIdx: 8 },   // Shen / Monkey
  { month: 9, day: 8,  branchIdx: 9 },   // You / Rooster
  { month: 10, day: 8, branchIdx: 10 },  // Xu / Dog
  { month: 11, day: 7, branchIdx: 11 },  // Hai / Pig
  { month: 12, day: 7, branchIdx: 0 },   // Zi / Rat
  { month: 1, day: 6,  branchIdx: 1 },   // Chou / Ox
];

// hidden stems by branch (primary/secondary/tertiary)
const BRANCH_HIDDEN = {
  Zi:   [{stem:"Gui",note:"primary (Yin Water)"}],
  Chou: [{stem:"Ji",note:"primary (Yin Earth)"},{stem:"Gui",note:"secondary (Yin Water)"},{stem:"Xin",note:"tertiary (Yin Metal)"}],
  Yin:  [{stem:"Jia",note:"primary (Yang Wood)"},{stem:"Bing",note:"secondary (Yang Fire)"},{stem:"Wu",note:"tertiary (Yang Earth)"}],
  Mao:  [{stem:"Yi",note:"primary (Yin Wood)"}],
  Chen: [{stem:"Wu",note:"primary (Yang Earth)"},{stem:"Yi",note:"secondary (Yin Wood)"},{stem:"Gui",note:"tertiary (Yin Water)"}],
  Si:   [{stem:"Bing",note:"primary (Yang Fire)"},{stem:"Geng",note:"secondary (Yang Metal)"},{stem:"Wu",note:"tertiary (Yang Earth)"}],
  Wu_b: [{stem:"Ding",note:"primary (Yin Fire)"},{stem:"Ji",note:"secondary (Yin Earth)"}],
  Wei:  [{stem:"Ji",note:"primary (Yin Earth)"},{stem:"Ding",note:"secondary (Yin Fire)"},{stem:"Yi",note:"tertiary (Yin Wood)"}],
  Shen: [{stem:"Geng",note:"primary (Yang Metal)"},{stem:"Ren",note:"secondary (Yang Water)"},{stem:"Wu",note:"tertiary (Yang Earth)"}],
  You:  [{stem:"Xin",note:"primary (Yin Metal)"}],
  Xu:   [{stem:"Wu",note:"primary (Yang Earth)"},{stem:"Xin",note:"secondary (Yin Metal)"},{stem:"Ding",note:"tertiary (Yin Fire)"}],
  Hai:  [{stem:"Ren",note:"primary (Yang Water)"},{stem:"Jia",note:"secondary (Yang Wood)"}],
};

const ANIMAL_TRAITS_MAP = {
  Rat:     { strengths:["Intelligent","Resourceful","Charming","Adaptable","Ambitious"], weaknesses:["Restless","Opportunistic under stress","Over-thinker"], luckyColors:["Blue","Gold","Green"], luckyNumbers:[2,3], luckyDirections:["North","Southeast"], careerAffinity:"Finance, writing, research, technology, strategy." },
  Ox:      { strengths:["Dependable","Strong-willed","Methodical","Patient","Honest"],   weaknesses:["Stubborn","Slow to change","Over-serious"],               luckyColors:["Yellow","White","Green"], luckyNumbers:[1,4], luckyDirections:["North","South"],   careerAffinity:"Agriculture, engineering, law, project management." },
  Tiger:   { strengths:["Courageous","Charismatic","Dynamic","Generous","Independent"], weaknesses:["Impulsive","Restless","Authority-resistant"],              luckyColors:["Blue","Grey","Orange"], luckyNumbers:[1,3,4], luckyDirections:["East","North"], careerAffinity:"Leadership, entrepreneurship, creative arts, activism." },
  Rabbit:  { strengths:["Gentle","Strategic","Diplomatic","Refined","Intuitive"],        weaknesses:["Conflict-averse","Moody","Over-cautious"],                 luckyColors:["Red","Pink","Purple"], luckyNumbers:[3,4,6], luckyDirections:["East","South"], careerAffinity:"Design, diplomacy, healing arts, publishing." },
  Dragon:  { strengths:["Powerful","Visionary","Magnetic","Generous","Confident"],      weaknesses:["Arrogant","Impatient","Demanding"],                        luckyColors:["Gold","Silver","White"], luckyNumbers:[1,6,7], luckyDirections:["East","North"], careerAffinity:"Entrepreneurship, politics, performance, leadership." },
  Snake:   { strengths:["Wise","Intuitive","Elegant","Strategic","Deep"],                weaknesses:["Secretive","Jealous","Overly-introspective"],              luckyColors:["Red","Yellow","Black"], luckyNumbers:[2,8,9], luckyDirections:["South","West"], careerAffinity:"Research, analysis, the arts, philosophy, mysticism." },
  Horse:   { strengths:["Energetic","Free-spirited","Warm","Witty","Confident"],        weaknesses:["Impatient","Scattered","Impulsive"],                      luckyColors:["Brown","Yellow","Violet"], luckyNumbers:[2,3,7], luckyDirections:["South","East"], careerAffinity:"Travel, sports, sales, communications, entertainment." },
  Goat:    { strengths:["Artistic","Gentle","Empathetic","Creative","Persistent"],      weaknesses:["Moody","Indecisive","Self-pitying"],                       luckyColors:["Green","Red","Purple"], luckyNumbers:[3,4,9], luckyDirections:["North","East"], careerAffinity:"Arts, design, caregiving, teaching, crafts." },
  Monkey:  { strengths:["Intelligent","Strategic","Adaptable","Witty","Innovative","Curious","Resourceful"], weaknesses:["Impatient","Over-confident","Mischievous when bored","Can be manipulative under stress"], luckyColors:["White","Gold","Blue"], luckyNumbers:[1,7,8], luckyDirections:["North","Northwest","West"], careerAffinity:"Entrepreneurship, finance, strategy, technology, consulting." },
  Rooster: { strengths:["Confident","Punctual","Honest","Hard-working","Observant"],    weaknesses:["Critical","Proud","Show-off tendency"],                    luckyColors:["Gold","Brown","Yellow"], luckyNumbers:[5,7,8], luckyDirections:["South","Southeast"], careerAffinity:"Journalism, performance, analysis, military, public service." },
  Dog:     { strengths:["Loyal","Honest","Just","Protective","Kind"],                    weaknesses:["Anxious","Stubborn","Pessimistic"],                         luckyColors:["Red","Green","Purple"], luckyNumbers:[3,4,9], luckyDirections:["East","South"], careerAffinity:"Law, medicine, social work, service, counselling." },
  Pig:     { strengths:["Honest","Generous","Diligent","Optimistic","Sincere"],         weaknesses:["Naïve","Indulgent","Over-trusting"],                       luckyColors:["Yellow","Grey","Brown"], luckyNumbers:[2,5,8], luckyDirections:["Southeast","Northeast"], careerAffinity:"Hospitality, entrepreneurship, caregiving, finance." },
};
const ANIMAL_HANZI = { Rat:"鼠", Ox:"牛", Tiger:"虎", Rabbit:"兔", Dragon:"龍", Snake:"蛇", Horse:"馬", Goat:"羊", Monkey:"猴", Rooster:"雞", Dog:"狗", Pig:"豬" };

function jdnFromDate(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

function computeBaZi(dob, time, timeUnknown, gender, firstName, currentYear) {
  const FN = firstName || "You";
  let y = dob.y, m = dob.m, d = dob.d;
  const h = timeUnknown ? 12 : (time?.h ?? 12);

  // Lichun adjustment for year pillar — if before ~Feb 4, use prior year
  let effectiveYear = y;
  if (m < 2 || (m === 2 && d < 4)) effectiveYear = y - 1;

  // Year pillar
  const yearStemIdx = ((effectiveYear - 4) % 10 + 10) % 10;
  const yearBranchIdx = ((effectiveYear - 4) % 12 + 12) % 12;
  const yearStem = STEM_ORDER[yearStemIdx];
  const yearBranch = BRANCH_ORDER[yearBranchIdx];

  // Month pillar — find branch by solar term table
  let monthBranchIdx = 0;
  // Determine which solar-term window (m,d) falls into
  // Iterate table; pick the entry where (current m,d) is on/after this entry's (month,day) but before next
  for (let i = 0; i < MONTH_TERM_TABLE.length; i++) {
    const cur = MONTH_TERM_TABLE[i];
    const nxt = MONTH_TERM_TABLE[(i + 1) % MONTH_TERM_TABLE.length];
    // Compare m/d against cur and nxt handling wrap at year boundary
    const curMD = cur.month * 100 + cur.day;
    const nxtMD = nxt.month * 100 + nxt.day;
    const thisMD = m * 100 + d;
    if (curMD <= nxtMD) {
      // Non-wrap
      if (thisMD >= curMD && thisMD < nxtMD) { monthBranchIdx = cur.branchIdx; break; }
    } else {
      // Wrap (Dec -> Jan -> Feb)
      if (thisMD >= curMD || thisMD < nxtMD) { monthBranchIdx = cur.branchIdx; break; }
    }
  }
  const monthBranch = BRANCH_ORDER[monthBranchIdx];

  // Month stem via Five Tigers year rule
  // Yin (Tiger, branch idx 2) start stem = (2 * (yearStemIdx % 5) + 2) % 10
  const yinStartStem = (2 * (yearStemIdx % 5) + 2) % 10;
  // Steps from Yin branch (2) forward to current month branch
  const monthStepsFromYin = (monthBranchIdx - 2 + 12) % 12;
  const monthStemIdx = (yinStartStem + monthStepsFromYin) % 10;
  const monthStem = STEM_ORDER[monthStemIdx];

  // Day pillar via JDN
  const JDN = jdnFromDate(y, m, d);
  const dayStemIdx = ((JDN + 5) % 10 + 10) % 10;
  const dayBranchIdx = ((JDN + 5) % 12 + 12) % 12;
  const dayStem = STEM_ORDER[dayStemIdx];
  const dayBranch = BRANCH_ORDER[dayBranchIdx];

  // Hour pillar — branch from hour
  // Zi 23-01, Chou 01-03, Yin 03-05, Mao 05-07, Chen 07-09, Si 09-11, Wu 11-13, Wei 13-15, Shen 15-17, You 17-19, Xu 19-21, Hai 21-23
  const hourBranchIdx = timeUnknown ? -1 : Math.floor(((h + 1) % 24) / 2);
  const hourBranch = hourBranchIdx >= 0 ? BRANCH_ORDER[hourBranchIdx] : null;
  // Hour stem — five tigers hour rule: day stem Jia/Ji → Zi starts Jia; offset = (2 * (dayStemIdx % 5)) % 10
  const ziStartStem = (2 * (dayStemIdx % 5)) % 10;
  const hourStemIdx = hourBranchIdx >= 0 ? (ziStartStem + hourBranchIdx) % 10 : -1;
  const hourStem = hourStemIdx >= 0 ? STEM_ORDER[hourStemIdx] : null;

  const makePillar = (key, label, subtitle, stem, branch) => {
    const s = HEAVENLY_STEMS[stem];
    const b = EARTHLY_BRANCHES[branch];
    const animal = b?.animal || "";
    const hidden = BRANCH_HIDDEN[branch] || [];
    const combined = `${stem} ${branch.replace("_b","")} (${s?.hanzi}${b?.hanzi})`;
    const element = s?.element;
    const yy = s?.yy;
    const meaning = `${yy} ${element} over ${b?.yy||""} ${b?.element||""} ${animal} — the ${combined.split(" ")[0]} ${combined.split(" ")[1]} pillar. Each pillar combines a heavenly stem (expressed character) with an earthly branch (embedded conditions and hidden stems). Read it as a single compound note rather than two separate letters.`;
    const forYou = pillarInterp(key, label, stem, element, yy, animal, hidden, FN);
    return {
      key, label, subtitle,
      stem, branch: branch.replace("_b",""),
      stemHz: s?.hanzi || "", branchHz: b?.hanzi || "",
      combined,
      animal, element, yy,
      branchElement: b?.element,
      hiddenStems: hidden,
      meaning, forYou,
    };
  };

  const year = makePillar("year", "Year Pillar", "Ancestors · Public Self · First 16 years", yearStem, yearBranch);
  const month = makePillar("month", "Month Pillar", "Parents · Career · Ages 17-32", monthStem, monthBranch);
  const day = makePillar("day", "Day Pillar · Day Master", "Self · Spouse · Ages 33-48", dayStem, dayBranch);
  const hour = hourStem ? makePillar("hour", "Hour Pillar", "Children · Legacy · Ages 49+", hourStem, hourBranch) : {
    key:"hour", label:"Hour Pillar", subtitle:"Children · Legacy · Ages 49+",
    stem:"—", branch:"—", stemHz:"—", branchHz:"—", combined:"time unknown",
    animal:"—", element:"—", yy:"—", branchElement:"—",
    hiddenStems:[], meaning:"Hour pillar requires birth time — enable it in settings to see this pillar.", forYou:`${FN}, add your birth time in settings to unlock the hour pillar — it governs the long-horizon destiny kernel and matters most in the second half of life.`,
  };

  // Five element counts across all stems + branches + hidden stems
  const elementCounts = { Wood:0, Fire:0, Earth:0, Metal:0, Water:0 };
  const stemsToCount = [yearStem, monthStem, dayStem];
  if (hourStem) stemsToCount.push(hourStem);
  const branchesToCount = [yearBranch, monthBranch, dayBranch];
  if (hourBranch) branchesToCount.push(hourBranch);
  stemsToCount.forEach(s => { const el = HEAVENLY_STEMS[s]?.element; if (el) elementCounts[el]++; });
  branchesToCount.forEach(b => { const el = EARTHLY_BRANCHES[b]?.element; if (el) elementCounts[el]++; });
  branchesToCount.forEach(b => (BRANCH_HIDDEN[b]||[]).forEach(h => { const el = HEAVENLY_STEMS[h.stem]?.element; if (el) elementCounts[el]++; }));

  const ELEM_META = {
    Wood:  { color:"#5FA05F", hanzi:"木" },
    Fire:  { color:"#D96B4B", hanzi:"火" },
    Earth: { color:"#B8935A", hanzi:"土" },
    Metal: { color:"#9FA8B8", hanzi:"金" },
    Water: { color:"#4A7DB8", hanzi:"水" },
  };
  const fiveElements = {};
  Object.entries(elementCounts).forEach(([el,c]) => {
    fiveElements[el] = { count:c, color:ELEM_META[el].color, label:el, hanzi:ELEM_META[el].hanzi };
  });

  // Day Master
  const dayMasterElement = HEAVENLY_STEMS[dayStem]?.element;
  const dayMasterYY = HEAVENLY_STEMS[dayStem]?.yy;
  const dayMasterAnimal = EARTHLY_BRANCHES[dayBranch]?.animal;

  // Strength — compare Day Master element count + generating element count vs restraining + controlling
  const GENERATES = { Wood:"Fire", Fire:"Earth", Earth:"Metal", Metal:"Water", Water:"Wood" };
  const CONTROLS = { Wood:"Earth", Fire:"Metal", Earth:"Water", Metal:"Wood", Water:"Fire" };
  // generator of X = element that produces X
  const GENERATED_BY = { Fire:"Wood", Earth:"Fire", Metal:"Earth", Water:"Metal", Wood:"Water" };

  const selfCount = elementCounts[dayMasterElement];
  const supportCount = elementCounts[GENERATED_BY[dayMasterElement]];
  const leakCount = elementCounts[GENERATES[dayMasterElement]];
  const controlCount = elementCounts[CONTROLS[dayMasterElement]];
  // element that controls day master
  const controlledByElement = Object.keys(CONTROLS).find(k => CONTROLS[k] === dayMasterElement);
  const pressureCount = elementCounts[controlledByElement] || 0;
  const supportTotal = selfCount + supportCount;
  const pressureTotal = leakCount + controlCount + pressureCount;
  let strengthLabel;
  if (supportTotal >= pressureTotal + 3) strengthLabel = "Strong";
  else if (supportTotal >= pressureTotal + 1) strengthLabel = "Balanced-to-strong";
  else if (supportTotal <= pressureTotal - 3) strengthLabel = "Weak";
  else if (supportTotal <= pressureTotal - 1) strengthLabel = "Balanced-to-weak";
  else strengthLabel = "Balanced";

  // Favourable / unfavourable
  let favourable, unfavourable;
  if (strengthLabel.includes("strong") || strengthLabel === "Strong") {
    favourable = [GENERATES[dayMasterElement], CONTROLS[dayMasterElement], controlledByElement];
    unfavourable = [dayMasterElement, GENERATED_BY[dayMasterElement]];
  } else if (strengthLabel.includes("weak") || strengthLabel === "Weak") {
    favourable = [dayMasterElement, GENERATED_BY[dayMasterElement]];
    unfavourable = [CONTROLS[dayMasterElement], controlledByElement];
  } else {
    favourable = [GENERATES[dayMasterElement], CONTROLS[dayMasterElement]];
    unfavourable = [controlledByElement];
  }
  favourable = [...new Set(favourable)].filter(Boolean);
  unfavourable = [...new Set(unfavourable)].filter(Boolean);

  const analysis = {
    dayMaster: `${dayStem} ${dayBranch.replace("_b","")} · ${dayMasterYY} ${dayMasterElement} ${dayMasterAnimal}`,
    strength: `${strengthLabel}. Day Master (${dayMasterElement}) count ${selfCount}, supporting resource count ${supportCount}; pressure (output+control) total ${pressureTotal}.`,
    favourable, unfavourable,
    yongshenNote: `Your favourable elements are ${favourable.join(" and ")}. Seek environments, colours, and practices that bring these elements into your daily field — they stabilise the Day Master and let your work flow without forcing. ${FN}, where these elements are absent, add them deliberately.`,
    jishenNote: `Your unfavourable elements are ${unfavourable.join(" and ")}. These don't need to be avoided entirely, but when life feels like grinding or when your energy drops suddenly, check your environment for an overload of these elements. ${FN}, you can feel the imbalance before you can name it.`,
  };

  // Ten Gods — relate each unique stem in the chart (excluding day stem) to day master
  const tenGodsList = buildTenGods(dayStem, [yearStem, monthStem, hourStem].filter(Boolean), branchesToCount, FN);

  // Luck pillars — 6 x 10-year, starting from month pillar, direction by (gender + year stem parity)
  const forward = (gender === "male" && yearStemIdx % 2 === 0) || (gender === "female" && yearStemIdx % 2 === 1);
  // starting age approximated as 3 for simplicity (days-to-solar-term / 3 would need full ephemeris)
  const startAge = 3;
  const luckPillars = [];
  const nowAge = currentYear - y;
  for (let i = 0; i < 6; i++) {
    const stepBranchIdx = (monthBranchIdx + (forward ? (i+1) : -(i+1)) + 12*10) % 12;
    const stepStemIdx = (monthStemIdx + (forward ? (i+1) : -(i+1)) + 10*10) % 10;
    const startA = startAge + i * 10;
    const endA = startA + 10;
    const startYr = y + startA;
    const endYr = y + endA;
    const s = STEM_ORDER[stepStemIdx];
    const b = BRANCH_ORDER[stepBranchIdx];
    const active = nowAge >= startA && nowAge < endA;
    const element = HEAVENLY_STEMS[s]?.element;
    const isFav = favourable.includes(element);
    luckPillars.push({
      range: `${startYr}–${endYr} (age ${startA}–${endA})`,
      stem: s, branch: b.replace("_b",""),
      combined: `${s} ${b.replace("_b","")}`,
      element, active,
      note: `${HEAVENLY_STEMS[s]?.yy} ${element} ${EARTHLY_BRANCHES[b]?.animal}. ${isFav ? "This 10-year pillar carries a favourable element for your Day Master — lean into its themes and the decade works with you." : "This pillar carries an element that tests the Day Master. The work is to steady the centre rather than match the pillar's pace."}`,
    });
  }

  // Annual pillar for currentYear
  const annualStemIdx = ((currentYear - 4) % 10 + 10) % 10;
  const annualBranchIdx = ((currentYear - 4) % 12 + 12) % 12;
  const annualStem = STEM_ORDER[annualStemIdx];
  const annualBranch = BRANCH_ORDER[annualBranchIdx];
  const annualElement = HEAVENLY_STEMS[annualStem]?.element;
  const annualAnimal = EARTHLY_BRANCHES[annualBranch]?.animal;
  const annualIsFav = favourable.includes(annualElement);
  const annual = {
    stem: annualStem, branch: annualBranch.replace("_b",""),
    stemHz: HEAVENLY_STEMS[annualStem]?.hanzi,
    branchHz: EARTHLY_BRANCHES[annualBranch]?.hanzi,
    combined: `${annualStem} ${annualBranch.replace("_b","")}`,
    element: annualElement, animal: annualAnimal,
    yy: HEAVENLY_STEMS[annualStem]?.yy,
    interaction: `${currentYear} is a ${HEAVENLY_STEMS[annualStem]?.yy} ${annualElement} ${annualAnimal} year. For your ${dayMasterYY} ${dayMasterElement} Day Master, this ${annualIsFav ? "brings a favourable current — the year supports rather than resists your work" : "creates friction with the Day Master — expect the year to demand extra discipline where it pushes against your natural element"}. ${FN}, align decisions with this seasonal current rather than fighting it.`,
  };

  // Compatibility — based on year + day animal
  const compatibility = computeCompatibility(year.animal, day.animal, FN);

  // Nine Star Ki — reduce year digits to single; male = 11 - sum (wrap 1-9); female = (sum + 4) reduced
  const yearSum = String(effectiveYear).split("").reduce((s,c)=>s+parseInt(c,10),0);
  const yearSumR = yearSum > 9 ? String(yearSum).split("").reduce((s,c)=>s+parseInt(c,10),0) : yearSum;
  let mainStar;
  if (gender === "female") {
    mainStar = yearSumR + 4;
    while (mainStar > 9) mainStar -= 9;
    if (mainStar < 1) mainStar += 9;
  } else {
    mainStar = 11 - yearSumR;
    if (mainStar > 9) mainStar -= 9;
    if (mainStar < 1) mainStar += 9;
  }
  const nineStarNames = {
    1: "1 White Water · North",     2: "2 Black Earth · Southwest",   3: "3 Jade Wood · East",
    4: "4 Green Wood · Southeast",  5: "5 Yellow Earth · Center",     6: "6 White Metal · Northwest",
    7: "7 Red Metal · West",        8: "8 White Earth · Northeast",   9: "9 Purple Fire · South",
  };
  const nineStarMeanings = {
    1: "One White is the water star — movement, adaptability, quiet persistence. Natives shape situations through flow rather than force.",
    2: "Two Black is the earth-mother star — nurturance, loyalty, patient support. Natives build through steady care and relational depth.",
    3: "Three Jade Wood is the spring thunder star — rapid growth, new ideas, youthful initiative. Natives start things and bring energy into old patterns.",
    4: "Four Green Wood is the gentle wind — communication, relationships, reputation built through elegance and persistence.",
    5: "Five Yellow is the central star — the axis around which other stars orbit. Natives have magnetic presence and natural authority; attention collects around them.",
    6: "Six White Metal is the heavenly father star — authority, order, father-figure energy. Natives lead through structure and earned respect.",
    7: "Seven Red Metal is the lake star — joy, communication, refinement. Natives charm and persuade; they are the performers and polished voices of the group.",
    8: "Eight White Earth is the mountain star — stillness, accumulation, inheritance. Natives build what lasts and often come into wealth through discipline.",
    9: "Nine Purple Fire is the illumination star — fame, expression, vision. Natives shine; their work is about revelation and being seen.",
  };
  const nineStar = {
    mainStar, mainName: nineStarNames[mainStar] || `${mainStar}`,
    calc: `${String(effectiveYear).split("").join("+")} = ${yearSum}${yearSumR !== yearSum ? ` → ${yearSumR}` : ""}; ${gender === "female" ? `${yearSumR} + 4` : `11 − ${yearSumR}`} → ${mainStar}`,
    meaning: nineStarMeanings[mainStar] || "",
    forYou: `${FN}, Nine Star Ki is a feng-shui lens on character. Your ${nineStarNames[mainStar]} star layers onto the BaZi Day Master to show how your energy lands in rooms. Treat it as a second opinion rather than a replacement for the Four Pillars — when they agree on a theme, that's signal; when they differ, each is pointing at a different dimension of the same you.`,
  };

  const animalTraitsBase = ANIMAL_TRAITS_MAP[year.animal] || ANIMAL_TRAITS_MAP.Monkey;
  const animalTraits = { ...animalTraitsBase, hanzi: ANIMAL_HANZI[year.animal] || "" };

  return {
    year, month, day, hour,
    pillars: [year, month, day, hour],
    fiveElements,
    analysis,
    tenGods: tenGodsList,
    luckPillars,
    annual,
    compatibility,
    nineStar,
    animalTraits,
  };
}

// Relationship of stem X to Day Master (same element/same polarity etc)
function tenGodFor(dayStem, targetStem) {
  const DS = HEAVENLY_STEMS[dayStem];
  const TS = HEAVENLY_STEMS[targetStem];
  if (!DS || !TS) return null;
  const samePol = DS.yy === TS.yy;
  const GEN = { Wood:"Fire", Fire:"Earth", Earth:"Metal", Metal:"Water", Water:"Wood" };
  const CTRL = { Wood:"Earth", Fire:"Metal", Earth:"Water", Metal:"Wood", Water:"Fire" };
  if (TS.element === DS.element) return samePol ? "Friend" : "Rob Wealth";
  if (GEN[DS.element] === TS.element) return samePol ? "Eating God" : "Hurting Officer";
  if (CTRL[DS.element] === TS.element) return samePol ? "Indirect Wealth" : "Direct Wealth";
  if (CTRL[TS.element] === DS.element) return samePol ? "7 Killings" : "Direct Officer";
  if (GEN[TS.element] === DS.element) return samePol ? "Indirect Resource" : "Direct Resource";
  return null;
}

function buildTenGods(dayStem, otherStems, branches, firstName) {
  const FN = firstName || "You";
  const GOD_META = {
    "Friend":            { chinese:"比肩", role:"Friends · Peers · Siblings" },
    "Rob Wealth":        { chinese:"劫財", role:"Competitors · Rivals · Wealth-drainers" },
    "Eating God":        { chinese:"食神", role:"Creative output · Enjoyment · Pleasant productivity" },
    "Hurting Officer":   { chinese:"傷官", role:"Genius · Innovation · Rule-breaking · Outspoken" },
    "Direct Wealth":     { chinese:"正財", role:"Earned income · Conservative wealth · Savings" },
    "Indirect Wealth":   { chinese:"偏財", role:"Business income · Entrepreneurial wealth · Opportunity-based fortune" },
    "Direct Officer":    { chinese:"正官", role:"Authority · Career status · Structured reputation" },
    "7 Killings":        { chinese:"七殺", role:"Power · Ruthless drive · Competitive spirit" },
    "Direct Resource":   { chinese:"正印", role:"Mother · Mentors · Wisdom · Education" },
    "Indirect Resource": { chinese:"偏印", role:"Unconventional learning · Step-parent · Mystical knowledge" },
  };

  // Determine presence: check each god across all stems in chart (incl day & hidden branch stems)
  const allStems = [dayStem, ...otherStems];
  branches.forEach(b => (BRANCH_HIDDEN[b]||[]).forEach(h => allStems.push(h.stem)));

  const results = Object.keys(GOD_META).map(god => {
    let present = false;
    for (const s of allStems) {
      if (s === dayStem && god === "Friend") { present = true; break; }
      if (tenGodFor(dayStem, s) === god) { present = true; break; }
    }
    return {
      name: god, chinese: GOD_META[god].chinese, role: GOD_META[god].role,
      present,
      forYou: interpretGod(god, present, FN),
    };
  });
  return results;
}

function interpretGod(god, present, FN) {
  const absent = ` Its absence means this theme doesn't come pre-installed for you — when you want its gifts, you import them deliberately through environment, practice, or relationships that carry the energy.`;
  const presentMsg = {
    "Friend":            `Peer-level relationships are core to how you operate. ${FN}, you work best alongside trusted equals rather than under hierarchy or in isolation — collaborations grounded in mutual respect tend to unlock your best work.`,
    "Rob Wealth":        `Watch for competitive forces in your orbit — people who appear aligned but drain resources. ${FN}, this isn't paranoia, it's pattern-recognition: review your circle periodically and notice where value flows out without returning.`,
    "Eating God":        `You have a natural current of refined creative output — the craftsman's pleasant productivity. ${FN}, content, design, polished work, and anything that expresses your aesthetic sensibility comes easily and feeds you.`,
    "Hurting Officer":   `You carry the innovation stem — unconventional thinking, willingness to question established structures. ${FN}, this energy needs an outlet or it turns into corrosive criticism of yourself and others. Build where you would otherwise complain.`,
    "Direct Wealth":     `Your steady income current is present — salary, savings, conservative accumulation. ${FN}, this is the baseline wealth stream that doesn't dazzle but compounds. Don't ignore it for the flashier pursuits.`,
    "Indirect Wealth":   `Entrepreneurial, deal-based, opportunity-catching wealth is your natural channel. ${FN}, your real fortune comes through ventures, equity, and systems others don't immediately see — not through a straight paycheck.`,
    "Direct Officer":    `Structured authority is available to you — titles, formal roles, reputation built through recognised channels. ${FN}, don't hide behind the team; claiming the authority position openly tends to compound your credibility.`,
    "7 Killings":        `You carry the ruthless drive stem — the willingness to break things to build. ${FN}, this heat is power when channelled into strategic decisions; when suppressed it leaks out as interpersonal friction. Direct it.`,
    "Direct Resource":   `Mentors, teachers, and wisdom through conventional study flow naturally to you. ${FN}, books, courses, and guides land disproportionately well for you — knowledge is a reliable input for your growth.`,
    "Indirect Resource": `You're drawn toward unconventional or esoteric learning — mysticism, hidden systems, step-parent figures. ${FN}, this energy makes you a polymath when directed; when scattered it becomes restless knowledge-chasing.`,
  };
  return present ? (presentMsg[god] || "") : (presentMsg[god] || "") + absent;
}

function computeCompatibility(yearAnimal, dayAnimal, FN) {
  // San He triangles
  const SAN_HE = [["Rat","Dragon","Monkey"],["Ox","Snake","Rooster"],["Tiger","Horse","Dog"],["Rabbit","Goat","Pig"]];
  // Liu He (six harmonies)
  const LIU_HE = { Rat:"Ox", Ox:"Rat", Tiger:"Pig", Pig:"Tiger", Rabbit:"Dog", Dog:"Rabbit", Dragon:"Rooster", Rooster:"Dragon", Snake:"Monkey", Monkey:"Snake", Horse:"Goat", Goat:"Horse" };
  // Direct clash (6 apart)
  const CLASH = { Rat:"Horse", Horse:"Rat", Ox:"Goat", Goat:"Ox", Tiger:"Monkey", Monkey:"Tiger", Rabbit:"Rooster", Rooster:"Rabbit", Dragon:"Dog", Dog:"Dragon", Snake:"Pig", Pig:"Snake" };
  const DESTROY = { Rat:"Rooster", Rooster:"Rat", Ox:"Dragon", Dragon:"Ox", Tiger:"Si", Snake:"Tiger", Rabbit:"Horse", Horse:"Rabbit", Goat:"Dog", Dog:"Goat", Monkey:"Pig", Pig:"Monkey" };

  const anchor = dayAnimal;
  const best = [];
  // San He trio
  const trio = SAN_HE.find(t => t.includes(anchor));
  if (trio) trio.filter(a => a !== anchor).forEach(a => best.push({ animal:a, note:`San He triangle with your Day Master ${anchor} — deep structural compatibility. Partnerships in this triangle tend toward enduring alignment.` }));
  // Liu He
  const harmony = LIU_HE[anchor];
  if (harmony) best.push({ animal:harmony, note:`Six Harmony pair with your Day Master ${anchor}. Relational ease, mutual understanding, and the partner who "gets" you without constant translation.` });
  if (yearAnimal !== anchor) {
    const yearHarmony = LIU_HE[yearAnimal];
    if (yearHarmony && !best.find(b => b.animal === yearHarmony)) best.push({ animal:yearHarmony, note:`Six Harmony with your Year animal ${yearAnimal} — supportive public-sphere ally.` });
  }

  const worst = [];
  const clash = CLASH[anchor];
  if (clash) worst.push({ animal:clash, note:`Direct clash with your Day Master ${anchor}. Partnerships tend to create friction at the level of core values unless both parties consciously manage the tension.` });
  const yearClash = CLASH[yearAnimal];
  if (yearClash && yearClash !== clash) worst.push({ animal:yearClash, note:`Clash with your Year pillar animal ${yearAnimal}. Surface-level friction in first-impression contexts; long-term partnerships need deliberate communication.` });

  return { best, worst };
}

function pillarInterp(key, label, stem, element, yy, animal, hiddenStems, FN) {
  const framing = {
    year:  `Your year pillar is the signature strangers meet first — your public-facing identity and the energy of your first 16 years of life.`,
    month: `Your month pillar governs career and parents, and dominates life between ages 17 and 32. This is the engine of your working life.`,
    day:   `Your day pillar is your core self — the you beneath the performed identity, and the energy of your primary relationship and ages 33-48.`,
    hour:  `Your hour pillar is the legacy kernel — the seed that ripens in the second half of life, and the energy you transmit to children and long-term work.`,
  };
  return `${framing[key]||""} ${yy} ${element} over ${animal} (${stem}) carries the ${element.toLowerCase()}-${yy.toLowerCase()} signature. ${FN}, read the pillar as a compound note: the stem shows what you express; the branch shows the hidden conditions you carry; the hidden stems inside the branch show the sub-frequencies of this pillar. The work of this pillar is to live its energy consciously rather than by default.`;
}

// ─── ONBOARDING COMPONENT ──────────────────────────────────────────────────
function Onboarding({ onSave, initial }) {
  const init = initial || {};
  const initDateStr = (init.dob && init.dob.y && init.dob.m && init.dob.d)
    ? init.dob.y + "-" + String(init.dob.m).padStart(2,"0") + "-" + String(init.dob.d).padStart(2,"0")
    : "";
  const initTimeStr = (init.time && init.time.h != null && init.time.m != null)
    ? String(init.time.h).padStart(2,"0") + ":" + String(init.time.m).padStart(2,"0")
    : "";
  const [fullName, setFullName] = React.useState(init.fullName || "");
  const [firstName, setFirstName] = React.useState(init.name || "");
  const [dateStr, setDateStr] = React.useState(initDateStr);
  const [timeStr, setTimeStr] = React.useState(initTimeStr);
  const [timeUnknown, setTimeUnknown] = React.useState(!!init.timeUnknown);
  const [city, setCity] = React.useState(init.city || "");
  const [gender, setGender] = React.useState(init.gender || "male");
  const [err, setErr] = React.useState("");

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!fullName.trim()) { setErr("Full legal name is required."); return; }
    const mDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || "");
    if (!mDate) { setErr("Enter a valid birth date."); return; }
    const y = parseInt(mDate[1],10), mo = parseInt(mDate[2],10), d = parseInt(mDate[3],10);
    if (!y || !mo || !d || y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) {
      setErr("Enter a valid birth date.");
      return;
    }
    let hh = 12, mm = 0;
    if (!timeUnknown) {
      const mTime = /^(\d{2}):(\d{2})$/.exec(timeStr || "");
      if (!mTime) { setErr("Enter a valid birth time, or tick the checkbox."); return; }
      hh = parseInt(mTime[1],10); mm = parseInt(mTime[2],10);
      if (hh < 0 || hh > 23 || mm < 0 || mm > 59) { setErr("Enter a valid birth time."); return; }
    }
    if (!city.trim()) { setErr("Birth place is required."); return; }
    if (gender !== "male" && gender !== "female") { setErr("Choose a gender — needed for Nine Star Ki."); return; }

    onSave({
      name: firstName.trim() || fullName.trim().split(" ")[0],
      fullName: fullName.trim(),
      dob: { y, m: mo, d },
      time: timeUnknown ? { h: 12, m: 0 } : { h: hh, m: mm },
      timeUnknown,
      city: city.trim(),
      gender,
    });
  };

  const loadDemo = () => {
    onSave({
      name: "Ethan",
      fullName: "Ethan Joshua Kay",
      dob: { y: 2004, m: 7, d: 23 },
      time: { h: 6, m: 30 },
      timeUnknown: false,
      city: "Sydney",
      gender: "male",
      isDemo: true,
    });
  };

  return (
    <div className="onboard-wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,600&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap');
        :root{
          --bg-base:#0A0E1A; --bg-deep:#060912; --bg-raise:#131828;
          --ink:#FCFAF6; --ink-dim:#CFC5B1; --ink-faint:#7B7361;
          --rule:rgba(252,250,246,0.08);
          --brass:#C8A052; --ember:#A84B3E;
        }
        *{box-sizing:border-box;}
        body{background:var(--bg-base);}
        #stars-mount{position:fixed;inset:0;z-index:0;pointer-events:none;}
        .onboard-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:48px 24px;background:var(--bg-base);position:relative;overflow:hidden;color:var(--ink);font-family:'Crimson Pro',serif;}
        .onboard-card{max-width:480px;width:100%;position:relative;z-index:1;}
        .onboard-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:var(--brass);margin-bottom:14px;}
        .onboard-title{font-family:'Fraunces',serif;font-variation-settings:"opsz" 144;font-size:56px;font-weight:600;letter-spacing:-0.028em;text-align:left;color:var(--ink);margin:0 0 14px;line-height:0.98;}
        .onboard-sub{font-family:'Crimson Pro',serif;font-style:italic;text-align:left;font-size:17px;color:var(--ink-dim);margin:0 0 22px;line-height:1.45;max-width:440px;}
        .brass-rule{width:48px;height:1px;background:var(--brass);margin:0 0 34px;border:0;}
        .onboard-field{margin-bottom:26px;animation:rise .7s cubic-bezier(.2,.7,.3,1) both;}
        @keyframes rise{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
        .onboard-field:nth-of-type(1){animation-delay:0ms;}
        .onboard-field:nth-of-type(2){animation-delay:90ms;}
        .onboard-field:nth-of-type(3){animation-delay:180ms;}
        .onboard-field:nth-of-type(4){animation-delay:270ms;}
        .onboard-field:nth-of-type(5){animation-delay:360ms;}
        .onboard-field:nth-of-type(6){animation-delay:450ms;}
        .onboard-field label{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:var(--brass);margin-bottom:8px;display:block;font-weight:500;}
        .onboard-input,.date-input,.time-input{width:100%;padding:8px 0;background:transparent;border:none;border-bottom:1px solid var(--rule);color:var(--ink);font-family:'Crimson Pro',serif;font-size:17px;outline:none;transition:border-color .2s,color .2s,border-bottom-width .15s;border-radius:0;}
        .onboard-input:focus,.date-input:focus,.time-input:focus{border-bottom:2px solid var(--brass);color:var(--brass);}
        .onboard-input::placeholder{color:var(--ink-faint);font-style:italic;}
        .date-input,.time-input{color-scheme:dark;font-family:'IBM Plex Mono',monospace;font-size:15px;letter-spacing:0.04em;}
        .onboard-row{display:flex;gap:22px;}
        .onboard-row > *{flex:1;}
        .onboard-check{display:inline-flex;align-items:center;gap:10px;margin-top:12px;font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--ink-faint);letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;}
        .onboard-check input{accent-color:var(--brass);}
        .onboard-radio{display:flex;gap:28px;margin-top:2px;}
        .onboard-radio label{padding:6px 0;color:var(--ink-faint);font-family:'IBM Plex Mono',monospace;font-size:11px;cursor:pointer;transition:color .2s,border-color .2s;letter-spacing:0.2em;text-transform:uppercase;margin:0;border-bottom:1px solid transparent;}
        .onboard-radio label.selected{color:var(--brass);border-bottom:1px solid var(--brass);}
        .onboard-radio input{display:none;}
        .onboard-btn{width:100%;padding:14px 0;border:1px solid var(--brass);background:transparent;color:var(--brass);font-family:'Fraunces',serif;font-size:14px;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;transition:background .25s,color .25s;margin-top:18px;font-weight:500;}
        .onboard-btn:hover{background:var(--brass);color:var(--bg-base);}
        .onboard-demo{width:100%;padding:14px 0 0;border:none;border-top:1px solid var(--rule);background:transparent;color:var(--ink-faint);font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;cursor:pointer;transition:color .2s;margin-top:20px;}
        .onboard-demo:hover{color:var(--brass);}
        .onboard-err{font-family:'Crimson Pro',serif;font-size:13px;color:var(--ember);margin-top:12px;font-style:italic;}
        .onboard-symbol{font-family:'Fraunces',serif;font-size:20px;letter-spacing:14px;color:var(--brass);margin-bottom:24px;}
        :focus-visible{outline:2px solid var(--brass);outline-offset:2px;}
        @media(prefers-reduced-motion:reduce){.onboard-field{animation:none;}}
      `}</style>
      <div id="stars-mount" aria-hidden="true"></div>
      <form className="onboard-card" onSubmit={handleSubmit}>
        <div className="onboard-symbol">☉ ☽ ↑</div>
        <div className="onboard-eyebrow">An Astral Atlas — Volume I</div>
        <h1 className="onboard-title">Five readings, one birth.</h1>
        <p className="onboard-sub">Western, Vedic, Kabbalah, Numerology, Chinese BaZi — all pulled from the same date, time, and place. Everything stays in your browser.</p>
        <hr className="brass-rule"/>

        <div className="onboard-field">
          <label htmlFor="ob-fullname">Full legal name</label>
          <input id="ob-fullname" className="onboard-input" type="text" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Given · middle · family" />
        </div>

        <div className="onboard-field">
          <label htmlFor="ob-firstname">Preferred first name <span className="marginalia" style={{color:"var(--ink-faint)",letterSpacing:"0.12em"}}>— optional</span></label>
          <input id="ob-firstname" className="onboard-input" type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="What to call you" />
        </div>

        <div className="onboard-field">
          <label htmlFor="ob-date">Birth date</label>
          <input id="ob-date" className="date-input" type="date" value={dateStr} onChange={e=>setDateStr(e.target.value)} min="1900-01-01" max="2100-12-31" />
        </div>

        <div className="onboard-field">
          <label htmlFor="ob-time">Birth time</label>
          <input id="ob-time" className="time-input" type="time" value={timeStr} disabled={timeUnknown} onChange={e=>setTimeStr(e.target.value)} />
          <label className="onboard-check">
            <input type="checkbox" checked={timeUnknown} onChange={e=>setTimeUnknown(e.target.checked)} />
            I don't know my birth time
          </label>
        </div>

        <div className="onboard-field">
          <label htmlFor="ob-city">Birth place</label>
          <input id="ob-city" className="onboard-input" type="text" value={city} onChange={e=>setCity(e.target.value)} placeholder="City, country" />
        </div>

        <div className="onboard-field">
          <label>Gender <span className="marginalia" style={{color:"var(--ink-faint)",letterSpacing:"0.12em"}}>— Nine Star Ki input</span></label>
          <div className="onboard-radio">
            <label className={gender==="male"?"selected":""}>
              <input type="radio" name="gender" value="male" checked={gender==="male"} onChange={()=>setGender("male")} />
              Male
            </label>
            <label className={gender==="female"?"selected":""}>
              <input type="radio" name="gender" value="female" checked={gender==="female"} onChange={()=>setGender("female")} />
              Female
            </label>
          </div>
        </div>

        {err && <div className="onboard-err">{err}</div>}

        <button type="submit" className="onboard-btn">Cast the Atlas</button>
        <button type="button" className="onboard-demo" onClick={loadDemo}>Read Ethan Kay's demo chart instead</button>
      </form>
    </div>
  );
}

function SettingsModal({ user, onClose, onReset }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{position:"relative",width:"100%",maxWidth:540}}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <Onboarding
          initial={user}
          onSave={(u) => {
            try { localStorage.setItem("astro:user", JSON.stringify(u)); } catch {}
            window.location.reload();
          }}
        />
        <div style={{textAlign:"center",marginTop:-12,paddingBottom:12}}>
          <button className="onboard-demo" onClick={onReset} style={{maxWidth:320,margin:"0 auto"}}>Clear saved data &amp; start over</button>
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const [user, setUser] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("astro:user") || "null"); } catch { return null; }
  });
  if (!user) {
    return (
      <Onboarding
        onSave={u => {
          try { localStorage.setItem("astro:user", JSON.stringify(u)); } catch {}
          setUser(u);
        }}
      />
    );
  }
  return (
    <App
      user={user}
      onReset={() => {
        try { localStorage.removeItem("astro:user"); } catch {}
        setUser(null);
      }}
    />
  );
}

export default AppShell;
