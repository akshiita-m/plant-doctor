// Plant Doctor AR: stage logic.
// Each run picks random soil readings, so a replay gives students new values to reason about.
// All words shown to students live in TEXT (English and Hindi). The 3D label shows numbers only,
// because A-Frame's built-in font has no Hindi letters.

const DRY_BELOW = 35; // soil moisture % below this counts as dry

// Where things sit on the farm photo (card units, see index.html).
const SICK_AT = "-0.02 -0.03";       // the sick plant
const ROBOT_START = "0.1 -0.61 0";   // bottom of the furrow
const ROBOT_STOP = "0.14 -0.05 0";   // in the furrow, beside the sick plant

const $ = (id) => document.getElementById(id);
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

let readings = null; // { moisture, ph, dry }
let stage = 0;
let lang = localStorage.getItem("plantDoctorLang") || "en";
const answers = JSON.parse(localStorage.getItem("plantDoctorAnswers") || "[]");
let firstTry = []; // per stage of this run: was the first answer right?

// ---------- Words (English and Hindi) ----------
// Functions receive the readings r = { moisture, ph, dry } so sentences can include the numbers.

const TEXT = {
  en: {
    appName: "Plant Doctor",
    tagline: "Science on Wheels · Farm robot activity",
    howTo: "Before you start",
    foot: "Runs in the phone's browser. No app to install.",
    step: "Step",
    dryTag: "DRY", wetTag: "WET",
    phTags: ["ACIDIC", "NEUTRAL", "BASIC"],
    introText: "Meet Doc, a farm robot. Help Doc look after a soybean field. At each step, Doc asks you what to do before it acts.",
    step1: "Put the printed farm photo on a table.",
    step2: "Press Start and allow the camera.",
    step3: "Point the camera at the photo.",
    start: "Start",
    scanHint: "Point the camera at the farm photo",
    moisture: "Soil moisture",
    ph: "Soil pH",
    of: "of",
    next: "Next",
    tryAgain: (r) => `Try again with ${r.dry ? "wet" : "dry"} soil`,
    wrong: "Hmm, I don't think that works. Look at the clues and try again.",
    soundOn: "Sound on", soundOff: "Sound off",
    finish: "See summary",
    summaryTitle: "Run summary",
    firstTry: "Correct on first try",
    score: (n, total) => `${n} / ${total}`,
    outcome: (r) => r.dry
      ? "Result: the sick plant was watered and stands up again."
      : "Result: the sick plant is flagged for the farmer to inspect.",
    ideasTitle: "What you did",
    idea1: "Noticed what was different about one plant",
    idea2: "Measured the soil, and checked again when readings disagreed",
    idea3: "Decided with a rule, then made the rule better",
    stages: [
      {
        name: "Notice",
        title: "Doc spots a drooping plant",
        text: () => "Doc drives along the crop row. Its camera notices one plant with drooping, yellow leaves. The plants next to it look healthy.",
        question: () => "What does this tell me?",
        options: ["The whole field is dry, so water every plant", "This plant or its soil is different, since its neighbours are fine", "It is sick, because yellow leaves always mean disease"],
        explain: () => "Right. Its neighbours look fine, so the problem is local to this plant. Yellow leaves can also come from thirst, so Doc should test the soil right here.",
      },
      {
        name: "Gather information",
        title: "Doc tests the soil",
        text: () => "Doc pushes its probe into the soil next to the plant and reads two sensors: moisture and pH.",
        question: (r) => `My probe reads ${r.moisture}% moisture. A second reading 10 cm away says ${r.other}%. What should I do?`,
        options: ["Trust the first reading, because it came first", "Use the average of the two readings", "Take a third reading before deciding"],
        explain: (r) => `Right. When two readings disagree, one may be wrong, for example if the probe hit a stone or a puddle. An average would hide the problem. The third reading is also about ${r.moisture}%, so Doc uses ${r.moisture}%.`,
      },
      {
        name: "Predict",
        title: "What should Doc do?",
        text: (r) => `The plant is drooping. Soil moisture is ${r.moisture}% (below ${DRY_BELOW}% counts as dry).`,
        question: () => "How should I decide what to do with this plant?",
        options: ["Water it if the leaves are yellow, otherwise do nothing", `Compare moisture with the ${DRY_BELOW}% line: water if below, flag if above`, "Water it if the pH is low, flag it if the pH is high", "Always water it, because drooping means thirst"],
        explain: (r) => `Right. Doc compares ${r.moisture}% with ${DRY_BELOW}%. ` + (r.dry
          ? "It is below the line, so Doc will water the plant. Watch what it does next."
          : "It is above the line, so Doc will flag the plant for the farmer. Watch what it does next."),
      },
      {
        name: "See the decision",
        title: "Doc follows its rules",
        text: (r) => r.dry
          ? `Rule: IF moisture is below ${DRY_BELOW}%, THEN water the plant. Moisture is ${r.moisture}%, so Doc waters it and saves the reading.`
          : `Rule: IF the soil is wet AND the plant droops, THEN flag it for the farmer. Moisture is ${r.moisture}%, so Doc places a flag and saves the reading.`,
        question: () => "The farmer says many plants I flagged were fine by evening. On hot afternoons, plants often droop for a few hours and then recover. Which change to my rule is best?",
        options: ["Recheck flagged plants next morning; flag only those still drooping", "Water every drooping plant instead of flagging it", "Stop flagging plants; the farmer can walk the field"],
        explain: () => "Right. A morning recheck filters out plants that only drooped in the afternoon heat, so the farmer gets fewer false alarms. Watering wet soil would harm the roots, and dropping flags throws away Doc's help.",
      },
      {
        name: "Apply it elsewhere",
        title: "A new field",
        text: () => "Use what you learned in a new situation.",
        question: () => "In another field, the soil moisture is 70% and three plants side by side are drooping. What should I do?",
        options: ["Water all three, since many plants are thirsty", "Flag them; sick plants close together may mean a spreading disease", "Do nothing; wet soil means the plants are fine"],
        explain: (r) => `Right. Wet soil rules out thirst, and several drooping plants side by side can mean a disease is spreading, so the farmer should check soon.`,
      },
    ],
  },

  hi: {
    appName: "प्लांट डॉक्टर",
    tagline: "साइंस ऑन व्हील्स · खेत के रोबोट की गतिविधि",
    howTo: "शुरू करने से पहले",
    foot: "यह फ़ोन के ब्राउज़र में चलता है। कोई ऐप इंस्टॉल नहीं करना।",
    step: "चरण",
    dryTag: "सूखी", wetTag: "गीली",
    phTags: ["अम्लीय", "उदासीन", "क्षारीय"],
    introText: "मिलो डॉक से, खेत का एक रोबोट। सोयाबीन के खेत की देखभाल में डॉक की मदद करो। हर कदम पर, कुछ करने से पहले डॉक तुमसे पूछता है कि क्या करना चाहिए।",
    step1: "छपी हुई खेत की फ़ोटो को मेज़ पर रखो।",
    step2: "शुरू करें दबाओ और कैमरा चालू करने की अनुमति दो।",
    step3: "कैमरे को फ़ोटो की ओर करो।",
    start: "शुरू करें",
    scanHint: "कैमरे को खेत की फ़ोटो की ओर करो",
    moisture: "मिट्टी की नमी",
    ph: "मिट्टी का pH",
    of: "/",
    next: "आगे",
    tryAgain: (r) => `${r.dry ? "गीली" : "सूखी"} मिट्टी के साथ फिर से करो`,
    wrong: "हम्म, मुझे नहीं लगता यह ठीक है। सुरागों को देखो और फिर से कोशिश करो।",
    soundOn: "आवाज़ चालू", soundOff: "आवाज़ बंद",
    finish: "सारांश देखो",
    summaryTitle: "इस बार का सारांश",
    firstTry: "पहली बार में सही",
    score: (n, total) => `${n} / ${total}`,
    outcome: (r) => r.dry
      ? "नतीजा: बीमार पौधे को पानी मिला और वह फिर से सीधा खड़ा है।"
      : "नतीजा: किसान जाँच करे, इसके लिए बीमार पौधे पर झंडा लगा है।",
    ideasTitle: "तुमने क्या किया",
    idea1: "देखा कि एक पौधे में क्या अलग था",
    idea2: "मिट्टी को मापा, और रीडिंग अलग आने पर दोबारा जाँचा",
    idea3: "नियम से फ़ैसला किया, फिर नियम को बेहतर बनाया",
    stages: [
      {
        name: "ध्यान दो",
        title: "डॉक को एक मुरझाया पौधा दिखता है",
        text: () => "डॉक फसल की कतार के साथ चलता है। उसका कैमरा एक पौधा देखता है जिसकी पत्तियाँ पीली हैं और झुकी हुई हैं। उसके पास वाले पौधे ठीक दिख रहे हैं।",
        question: () => "इससे मुझे क्या पता चलता है?",
        options: ["पूरा खेत सूखा है, इसलिए हर पौधे को पानी दो", "इस पौधे या इसकी मिट्टी में कुछ अलग है, क्योंकि पास वाले पौधे ठीक हैं", "यह बीमार है, क्योंकि पीली पत्तियों का मतलब हमेशा बीमारी होता है"],
        explain: () => "सही। पास वाले पौधे ठीक हैं, इसलिए समस्या सिर्फ़ इसी पौधे की जगह पर है। पीली पत्तियाँ प्यास से भी हो सकती हैं, इसलिए डॉक को यहीं की मिट्टी जाँचनी चाहिए।",
      },
      {
        name: "जानकारी इकट्ठा करो",
        title: "डॉक मिट्टी की जाँच करता है",
        text: () => "डॉक अपना प्रोब पौधे के पास मिट्टी में डालता है और दो सेंसर पढ़ता है: नमी और pH।",
        question: (r) => `मेरा प्रोब ${r.moisture}% नमी बताता है। 10 सेमी दूर दूसरी रीडिंग ${r.other}% बताती है। मुझे क्या करना चाहिए?`,
        options: ["पहली रीडिंग पर भरोसा करो, क्योंकि वह पहले आई", "दोनों रीडिंग का औसत लेकर फ़ैसला करो", "फ़ैसला करने से पहले तीसरी रीडिंग लो"],
        explain: (r) => `सही। जब दो रीडिंग अलग-अलग हों, तो एक गलत हो सकती है, जैसे प्रोब किसी पत्थर या पानी के गड्ढे से टकरा गया हो। औसत लेने से यह गड़बड़ी छिप जाती। तीसरी रीडिंग भी लगभग ${r.moisture}% है, इसलिए डॉक ${r.moisture}% मानता है।`,
      },
      {
        name: "अंदाज़ा लगाओ",
        title: "डॉक को क्या करना चाहिए?",
        text: (r) => `पौधा मुरझा रहा है। मिट्टी की नमी ${r.moisture}% है (${DRY_BELOW}% से कम को सूखा माना जाता है)।`,
        question: () => "मुझे कैसे तय करना चाहिए कि इस पौधे के साथ क्या करूँ?",
        options: ["पत्तियाँ पीली हों तो पानी दो, नहीं तो कुछ मत करो", `नमी को ${DRY_BELOW}% की रेखा से मिलाओ: कम हो तो पानी, ज़्यादा हो तो झंडा`, "pH कम हो तो पानी दो, pH ज़्यादा हो तो झंडा लगाओ", "हमेशा पानी दो, क्योंकि मुरझाने का मतलब प्यास है"],
        explain: (r) => `सही। डॉक ${r.moisture}% को ${DRY_BELOW}% से मिलाता है। ` + (r.dry
          ? "यह रेखा से कम है, इसलिए डॉक पौधे को पानी देगा। अब देखो वह क्या करता है।"
          : "यह रेखा से ज़्यादा है, इसलिए डॉक किसान के लिए झंडा लगाएगा। अब देखो वह क्या करता है।"),
      },
      {
        name: "फ़ैसला देखो",
        title: "डॉक अपने नियम का पालन करता है",
        text: (r) => r.dry
          ? `नियम: अगर नमी ${DRY_BELOW}% से कम है, तो पौधे को पानी दो। नमी ${r.moisture}% है, इसलिए डॉक पानी देता है और रीडिंग सेव करता है।`
          : `नियम: अगर मिट्टी गीली है और पौधा मुरझाया है, तो किसान के लिए झंडा लगाओ। नमी ${r.moisture}% है, इसलिए डॉक झंडा लगाता है और रीडिंग सेव करता है।`,
        question: () => "किसान कहता है कि जिन पौधों पर मैंने झंडा लगाया, उनमें से कई शाम तक ठीक हो गए। गर्म दोपहर में पौधे अक्सर कुछ घंटों के लिए झुकते हैं और फिर ठीक हो जाते हैं। मेरे नियम में कौन-सा बदलाव सबसे अच्छा है?",
        options: ["अगली सुबह फिर जाँचो; सिर्फ़ तब भी झुके पौधों पर झंडा लगाओ", "झंडा लगाने की जगह हर मुरझाए पौधे को पानी दो", "झंडे लगाना बंद करो; किसान खुद खेत में घूम लेगा"],
        explain: () => "सही। सुबह की दोबारा जाँच उन पौधों को हटा देती है जो सिर्फ़ दोपहर की गर्मी में झुके थे, इसलिए किसान को कम झूठी चेतावनियाँ मिलती हैं। गीली मिट्टी में पानी देने से जड़ों को नुकसान होगा, और झंडे बंद करने से डॉक की मदद खत्म हो जाएगी।",
      },
      {
        name: "नई जगह पर आज़माओ",
        title: "एक नया खेत",
        text: () => "जो सीखा, उसे नई स्थिति में लगाओ।",
        question: () => "दूसरे खेत में मिट्टी की नमी 70% है और पास-पास के तीन पौधे मुरझा रहे हैं। मुझे क्या करना चाहिए?",
        options: ["तीनों को पानी दो, क्योंकि कई पौधे प्यासे हैं", "झंडा लगाओ; पास-पास के बीमार पौधे फैलती बीमारी का संकेत हो सकते हैं", "कुछ मत करो; गीली मिट्टी का मतलब पौधे ठीक हैं"],
        explain: (r) => `सही। गीली मिट्टी में प्यास कारण नहीं हो सकती, और पास-पास कई मुरझाए पौधे फैलती बीमारी का संकेत हो सकते हैं, इसलिए किसान को जल्दी जाँच करनी चाहिए।`,
      },
    ],
  },
};

const t = () => TEXT[lang];

// ---------- Doc, the robot who asks the questions ----------
// The face matches the 3D robot: blue body, dark screen, yellow eyes, red antenna light.
// Its mood (normal, happy, puzzled) is a class on the .doc element.
const DOC_SVG = `<svg viewBox="0 0 48 48" aria-hidden="true">
  <line x1="24" y1="5" x2="24" y2="12" stroke="#455a64" stroke-width="2"/>
  <circle class="light" cx="24" cy="5" r="3" fill="#e53935"/>
  <rect x="8" y="12" width="32" height="24" rx="5" fill="#1e88e5" stroke="#0d47a1" stroke-width="2"/>
  <rect x="13" y="17" width="22" height="13" rx="3" fill="#263238"/>
  <g class="eyes-n" fill="#ffeb3b"><circle cx="19" cy="23.5" r="2.6"/><circle cx="29" cy="23.5" r="2.6"/></g>
  <g class="eyes-h" stroke="#ffeb3b" stroke-width="2.2" stroke-linecap="round" fill="none"><path d="M16.5 25 q2.5 -4 5 0"/><path d="M26.5 25 q2.5 -4 5 0"/></g>
  <g class="eyes-p" stroke="#ffeb3b" stroke-width="2.2" stroke-linecap="round" fill="#ffeb3b"><circle cx="19" cy="23" r="2.2" stroke="none"/><line x1="26.5" y1="24.5" x2="31.5" y2="22.5"/></g>
  <rect x="12" y="36" width="24" height="5" rx="2" fill="#263238"/>
  <circle cx="16" cy="42" r="3.5" fill="#212121"/><circle cx="32" cy="42" r="3.5" fill="#212121"/>
</svg>`;
document.querySelectorAll(".doc").forEach((el) => (el.innerHTML = DOC_SVG));

function docMood(mood) {
  $("docFace").className = "doc " + mood;
}

// The 3D robot does a little hop.
function docHop() {
  const r = $("robot");
  r.removeAttribute("animation__hop");
  r.setAttribute("animation__hop", { property: "scale", from: "0.8 0.8 0.8", to: "0.9 0.9 0.9", dur: 160, dir: "alternate", loop: 2, easing: "easeOutQuad" });
}

// ---------- Sounds ----------
// Made in the browser with the Web Audio API, so there are no sound files to download.
let audio = null;
let soundOn = localStorage.getItem("plantDoctorSound") !== "off";

function tone(freq, start, dur, type = "triangle", vol = 0.15) {
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, audio.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + start + dur);
  o.connect(g).connect(audio.destination);
  o.start(audio.currentTime + start);
  o.stop(audio.currentTime + start + dur);
}

function splash(start) {
  const n = audio.sampleRate * 0.25, buf = audio.createBuffer(1, n, audio.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
  src.buffer = buf;
  f.type = "bandpass"; f.frequency.value = 1400;
  g.gain.value = 0.35;
  src.connect(f).connect(g).connect(audio.destination);
  src.start(audio.currentTime + start);
}

const sfx = {
  hello: () => { tone(520, 0, 0.1); tone(780, 0.12, 0.14); },
  drive: () => tone(90, 0, 2.8, "sawtooth", 0.03),
  beep: () => { tone(1000, 0, 0.08, "square", 0.06); tone(1000, 0.14, 0.08, "square", 0.06); },
  right: () => { tone(660, 0, 0.12); tone(880, 0.12, 0.2); },
  wrong: () => { tone(260, 0, 0.14); tone(200, 0.15, 0.22); },
  water: () => { splash(0); splash(0.9); splash(1.8); },
  flag: () => { tone(523, 0, 0.15); tone(659, 0.12, 0.15); tone(784, 0.24, 0.3); },
};

function play(name) {
  if (soundOn && audio) sfx[name]();
}

function renderSoundBtn() {
  const b = $("soundBtn");
  b.classList.toggle("off", !soundOn);
  b.setAttribute("aria-label", soundOn ? t().soundOn : t().soundOff);
  b.title = soundOn ? t().soundOn : t().soundOff;
}

$("soundBtn").onclick = () => {
  soundOn = !soundOn;
  localStorage.setItem("plantDoctorSound", soundOn ? "on" : "off");
  renderSoundBtn();
};

function newReadings(dry) {
  const moisture = Math.round(dry ? rand(8, 30) : rand(45, 90));
  const ph = Math.round(rand(4.8, 8.6) * 10) / 10;
  const other = Math.round(dry ? rand(70, 90) : rand(5, 20)); // a faulty second reading that disagrees
  return { moisture, ph, dry, other };
}

// ---------- 3D helpers ----------

function animate(el, name, prop, to, dur) {
  el.removeAttribute("animation__" + name);
  el.setAttribute("animation__" + name, { property: prop, to: to, dur: dur, easing: "easeInOutQuad" });
}

// The sick plant is a cut-out from the photo. Sick: yellow leaves, drooping and swaying.
// Healed: the original green cut-out, standing up again.
function makePlant(el, sick) {
  const img = el.querySelector("a-plane");
  img.setAttribute("material", "src", sick ? "#plantSick" : "#plantHealed");
  el.querySelector(".lean").setAttribute("rotation", sick ? "35 0 0" : "60 0 0");
  if (sick) {
    el.setAttribute("animation__sway", { property: "rotation", from: "0 0 -5", to: "0 0 5", dur: 1400, dir: "alternate", loop: true });
  } else {
    el.removeAttribute("animation__sway");
    el.setAttribute("rotation", "0 0 0");
  }
}

function resetScene() {
  $("robot").setAttribute("position", ROBOT_START);
  $("probe").setAttribute("position", "0.1 0.03 0.07");
  $("water").setAttribute("visible", false);
  $("flag").setAttribute("visible", false);
  $("readingLabel").setAttribute("visible", false);
  $("soilPatch").setAttribute("color", "#6d4c41");
  makePlant($("sickPlant"), true);
}

function showReadings() {
  const r = readings;
  $("readings").classList.remove("hidden");
  $("moistureFill").style.width = r.moisture + "%";
  $("moistureValue").textContent = r.moisture + "%";
  $("phMarker").style.left = ((r.ph - 0) / 14) * 100 + "%";
  $("phValue").textContent = r.ph.toFixed(1);
  $("moistureTag").textContent = r.dry ? t().dryTag : t().wetTag;
  $("moistureTag").className = "tag " + (r.dry ? "dry" : "wet");
  $("phTag").textContent = t().phTags[r.ph < 6.5 ? 0 : r.ph <= 7.5 ? 1 : 2];
  // Dry soil looks pale; wet soil looks dark.
  $("soilPatch").setAttribute("color", r.dry ? "#c8a27a" : "#4e342e");
  $("readingText").setAttribute("value", `${r.moisture}%   |   pH ${r.ph.toFixed(1)}`);
  $("readingLabel").setAttribute("visible", true);
}

// ---------- Stages ----------
// What moves and which answer is right. The words for each stage are in TEXT.

const stages = [
  {
    enter: () => {
      resetScene();
      $("readings").classList.add("hidden");
      animate($("robot"), "drive", "position", ROBOT_STOP, 3000);
      play("drive");
    },
    correct: () => 1,
  },
  {
    enter: () => {
      animate($("probe"), "down", "position", "0.1 0.08 0.03", 1200);
      setTimeout(() => { showReadings(); play("beep"); }, 1300);
    },
    correct: () => 2,
  },
  {
    enter: () => {},
    correct: () => 1,
  },
  {
    enter: () => {
      $("probe").setAttribute("position", "0.1 0.03 0.07");
      if (readings.dry) {
        const w = $("water");
        w.setAttribute("position", `${SICK_AT} 0.25`);
        w.setAttribute("visible", true);
        w.removeAttribute("animation__fall");
        w.setAttribute("animation__fall", { property: "position", from: `${SICK_AT} 0.25`, to: `${SICK_AT} 0.03`, dur: 900, loop: 3 });
        $("soilPatch").setAttribute("color", "#4e342e");
        play("water");
      } else {
        $("flag").setAttribute("visible", true);
        play("flag");
      }
    },
    correct: () => 0,
  },
  {
    enter: () => {},
    correct: () => 1,
    replay: true,
  },
];

// ---------- Rendering ----------

function applyStaticText() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t()[el.dataset.i18n];
  });
  document.querySelectorAll("[data-lang]").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
  renderSoundBtn();
}

function renderDots() {
  $("dots").innerHTML = stages
    .map((_, i) => `<span class="dot ${i < stage ? "done" : i === stage ? "now" : ""}"></span>`)
    .join("");
}

// Shows the current stage's words and buttons. runEnter is false when only the language changed,
// so the 3D scene keeps its place.
function render(runEnter = true) {
  const s = stages[stage];
  const w = t().stages[stage];
  renderDots();
  $("stageName").textContent = `${t().step} ${stage + 1}/${stages.length} · ${w.name}`;
  $("title").textContent = w.title;
  $("text").textContent = w.text(readings);
  $("feedback").textContent = "";
  $("feedback").className = "";
  $("options").innerHTML = "";
  $("question").textContent = "";
  if (runEnter) docMood("");
  $("docSays").classList.toggle("hidden", !w.question);

  const next = $("nextBtn");
  next.classList.toggle("hidden", Boolean(w.question));
  next.textContent = s.replay ? t().finish : t().next;

  if (w.question) {
    $("question").textContent = w.question(readings);
    let answered = false;
    w.options.forEach((label, i) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.onclick = () => {
        const right = i === s.correct();
        if (!answered) {
          answered = true;
          firstTry[stage] = right;
          // Choices are saved in English so answers from both languages can be counted together.
          answers.push({ stage: stage + 1, lang, moisture: readings.moisture, ph: readings.ph, choice: TEXT.en.stages[stage].options[i], firstTryCorrect: right, time: Date.now() });
          localStorage.setItem("plantDoctorAnswers", JSON.stringify(answers));
        }
        b.className = right ? "right" : "wrong";
        if (right) {
          $("feedback").textContent = w.explain(readings);
          $("feedback").className = "ok";
          next.classList.remove("hidden");
          docMood("happy");
          docHop();
          play("right");
        } else {
          $("feedback").textContent = t().wrong;
          $("feedback").className = "no";
          docMood("puzzled");
          play("wrong");
        }
      };
      $("options").appendChild(b);
    });
  }
  if (runEnter) s.enter();
}

document.querySelectorAll("[data-lang]").forEach((b) => {
  b.onclick = () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang;
    localStorage.setItem("plantDoctorLang", lang);
    applyStaticText();
    if (readings) {
      render(false);
      if (!$("readings").classList.contains("hidden")) showReadings();
    }
    if (!$("finale").classList.contains("hidden")) renderFinale();
  };
});

$("nextBtn").onclick = () => {
  if (stages[stage].replay) {
    showFinale();
  } else {
    stage = Math.min(stage + 1, stages.length - 1);
    render();
  }
};

// ---------- Summary ----------

function renderFinale() {
  const n = firstTry.filter(Boolean).length;
  $("finaleScore").textContent = t().score(n, stages.length);
  $("finaleOutcome").textContent = t().outcome(readings);
  $("againBtn").textContent = t().tryAgain(readings);
}

function showFinale() {
  renderFinale();
  $("panel").classList.add("hidden");
  $("finale").classList.remove("hidden");
  if (readings.dry) makePlant($("sickPlant"), false); // the watered plant recovers
}

$("againBtn").onclick = () => {
  $("finale").classList.add("hidden");
  $("panel").classList.remove("hidden");
  readings = newReadings(!readings.dry);
  firstTry = [];
  stage = 0;
  render();
};

// ---------- Start ----------

applyStaticText();

const sceneEl = document.querySelector("a-scene");

sceneEl.addEventListener("loaded", () => {
  makePlant($("sickPlant"), true);

  const target = $("target");
  target.addEventListener("targetFound", () => { $("scanHint").classList.add("hidden"); play("hello"); });
  target.addEventListener("targetLost", () => $("scanHint").classList.remove("hidden"));
});

$("startBtn").onclick = () => {
  // Browsers only allow sound after a tap, so the audio starts here.
  try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; }
  $("intro").classList.add("hidden");
  $("topbar").classList.remove("hidden");
  $("panel").classList.remove("hidden");
  $("scanHint").classList.remove("hidden");
  sceneEl.systems["mindar-image-system"].start();
  readings = newReadings(Math.random() < 0.5);
  firstTry = [];
  stage = 0;
  render();
};
