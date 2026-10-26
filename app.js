// Plant Doctor AR: stage logic.
// Each run picks random soil readings, so a replay gives students new values to reason about.
// All words shown to students live in TEXT (English and Hindi). The 3D label shows numbers only,
// because A-Frame's built-in font has no Hindi letters.
 
const DRY_BELOW = 35; // soil moisture % below this counts as dry
 
const $ = (id) => document.getElementById(id);
const rand = (lo, hi) => lo + Math.random() * (hi - lo);
 
let readings = null; // { moisture, ph, dry }
let stage = 0;
let lang = localStorage.getItem("plantDoctorLang") || "en";
const answers = JSON.parse(localStorage.getItem("plantDoctorAnswers") || "[]");
 
// ---------- Words (English and Hindi) ----------
// Functions receive the readings r = { moisture, ph, dry } so sentences can include the numbers.
 
const TEXT = {
  en: {
    switchTo: "हिंदी",
    appName: "Plant Doctor",
    tagline: "Notice · Decide · Act",
    introText: "Help a farm robot look after a crop. At each step, predict what the robot should do before it acts.",
    step1: "Put the Plant Doctor card on a table.",
    step2: "Press Start and allow the camera.",
    step3: "Point the camera at the card.",
    start: "Start",
    scanHint: "Point the camera at the Plant Doctor card",
    moisture: "💧 Soil moisture",
    ph: "🧪 Soil pH",
    of: "of",
    next: "Next",
    tryAgain: (r) => `Try again with ${r.dry ? "wet" : "dry"} soil`,
    wrong: "Not quite. Look at the clues and try again.",
    stages: [
      {
        name: "Notice",
        title: "The robot spots a drooping plant",
        text: () => "The robot drives along the crop row. Its camera notices one plant with drooping, yellow leaves. The plants next to it look healthy.",
        question: () => "What does this tell the robot?",
        options: ["The whole field is dry, so water every plant", "This plant or its soil is different, since its neighbours are fine", "It is sick, because yellow leaves always mean disease"],
        explain: () => "Right. Its neighbours look fine, so the problem is local to this plant. Yellow leaves can also come from thirst, so the robot should test the soil right here.",
      },
      {
        name: "Gather information",
        title: "The robot tests the soil",
        text: () => "The robot pushes its probe into the soil next to the plant and reads two sensors: moisture and pH.",
        question: (r) => `The probe reads ${r.moisture}% moisture. A second reading 10 cm away says ${r.other}%. What should the robot do?`,
        options: ["Trust the first reading, because it came first", "Use the average of the two readings", "Take a third reading before deciding"],
        explain: (r) => `Right. When two readings disagree, one may be wrong, for example if the probe hit a stone or a puddle. An average would hide the problem. The third reading is also about ${r.moisture}%, so the robot uses ${r.moisture}%.`,
      },
      {
        name: "Predict",
        title: "What should the robot do?",
        text: (r) => `The plant is drooping. Soil moisture is ${r.moisture}% (below ${DRY_BELOW}% counts as dry).`,
        question: () => "How should the robot decide what to do with this plant?",
        options: ["Water it if the leaves are yellow, otherwise do nothing", `Compare moisture with the ${DRY_BELOW}% line: water if below, flag if above`, "Water it if the pH is low, flag it if the pH is high", "Always water it, because drooping means thirst"],
        explain: (r) => `Right. The robot compares ${r.moisture}% with ${DRY_BELOW}%. ` + (r.dry
          ? "It is below the line, so the robot will water the plant. Watch what it does next."
          : "It is above the line, so the robot will flag the plant for the farmer. Watch what it does next."),
      },
      {
        name: "See the decision",
        title: "The robot follows its rules",
        text: (r) => r.dry
          ? `Rule: IF moisture is below ${DRY_BELOW}%, THEN water the plant. Moisture is ${r.moisture}%, so the robot waters it and saves the reading.`
          : `Rule: IF the soil is wet AND the plant droops, THEN flag it for the farmer. Moisture is ${r.moisture}%, so the robot places a flag and saves the reading.`,
        question: () => "The farmer says many flagged plants were fine by evening. On hot afternoons, plants often droop for a few hours and then recover. Which change to the robot's rule is best?",
        options: ["Recheck flagged plants next morning; flag only those still drooping", "Water every drooping plant instead of flagging it", "Stop flagging plants; the farmer can walk the field"],
        explain: () => "Right. A morning recheck filters out plants that only drooped in the afternoon heat, so the farmer gets fewer false alarms. Watering wet soil would harm the roots, and dropping flags throws away the robot's help.",
      },
      {
        name: "Apply it elsewhere",
        title: "A new field",
        text: () => "Use what you learned in a new situation.",
        question: () => "In another field, the soil moisture is 70% and three plants side by side are drooping. What should the robot do?",
        options: ["Water all three, since many plants are thirsty", "Flag them; sick plants close together may mean a spreading disease", "Do nothing; wet soil means the plants are fine"],
        explain: (r) => `Right. Wet soil rules out thirst, and several drooping plants side by side can mean a disease is spreading, so the farmer should check soon. Now run the robot again with ${r.dry ? "wet" : "dry"} soil.`,
      },
    ],
  },
 
  hi: {
    switchTo: "English",
    appName: "प्लांट डॉक्टर",
    tagline: "पहचानो · तय करो · काम करो",
    introText: "एक खेत के रोबोट को फसल की देखभाल करने में मदद करो। हर कदम पर, रोबोट के काम करने से पहले अंदाज़ा लगाओ कि उसे क्या करना चाहिए।",
    step1: "प्लांट डॉक्टर कार्ड को मेज़ पर रखो।",
    step2: "शुरू करें दबाओ और कैमरा चालू करने की अनुमति दो।",
    step3: "कैमरे को कार्ड की ओर करो।",
    start: "शुरू करें",
    scanHint: "कैमरे को प्लांट डॉक्टर कार्ड की ओर करो",
    moisture: "💧 मिट्टी की नमी",
    ph: "🧪 मिट्टी का pH",
    of: "/",
    next: "आगे",
    tryAgain: (r) => `${r.dry ? "गीली" : "सूखी"} मिट्टी के साथ फिर से करो`,
    wrong: "पूरी तरह सही नहीं। सुरागों को देखो और फिर से कोशिश करो।",
    stages: [
      {
        name: "ध्यान दो",
        title: "रोबोट को एक मुरझाया पौधा दिखता है",
        text: () => "रोबोट फसल की कतार के साथ चलता है। उसका कैमरा एक पौधा देखता है जिसकी पत्तियाँ पीली हैं और झुकी हुई हैं। उसके पास वाले पौधे ठीक दिख रहे हैं।",
        question: () => "इससे रोबोट को क्या पता चलता है?",
        options: ["पूरा खेत सूखा है, इसलिए हर पौधे को पानी दो", "इस पौधे या इसकी मिट्टी में कुछ अलग है, क्योंकि पास वाले पौधे ठीक हैं", "यह बीमार है, क्योंकि पीली पत्तियों का मतलब हमेशा बीमारी होता है"],
        explain: () => "सही। पास वाले पौधे ठीक हैं, इसलिए समस्या सिर्फ़ इसी पौधे की जगह पर है। पीली पत्तियाँ प्यास से भी हो सकती हैं, इसलिए रोबोट को यहीं की मिट्टी जाँचनी चाहिए।",
      },
      {
        name: "जानकारी इकट्ठा करो",
        title: "रोबोट मिट्टी की जाँच करता है",
        text: () => "रोबोट अपना प्रोब पौधे के पास मिट्टी में डालता है और दो सेंसर पढ़ता है: नमी और pH।",
        question: (r) => `प्रोब ${r.moisture}% नमी बताता है। 10 सेमी दूर दूसरी रीडिंग ${r.other}% बताती है। रोबोट को क्या करना चाहिए?`,
        options: ["पहली रीडिंग पर भरोसा करो, क्योंकि वह पहले आई", "दोनों रीडिंग का औसत लेकर फ़ैसला करो", "फ़ैसला करने से पहले तीसरी रीडिंग लो"],
        explain: (r) => `सही। जब दो रीडिंग अलग-अलग हों, तो एक गलत हो सकती है, जैसे प्रोब किसी पत्थर या पानी के गड्ढे से टकरा गया हो। औसत लेने से यह गड़बड़ी छिप जाती। तीसरी रीडिंग भी लगभग ${r.moisture}% है, इसलिए रोबोट ${r.moisture}% मानता है।`,
      },
      {
        name: "अंदाज़ा लगाओ",
        title: "रोबोट को क्या करना चाहिए?",
        text: (r) => `पौधा मुरझा रहा है। मिट्टी की नमी ${r.moisture}% है (${DRY_BELOW}% से कम को सूखा माना जाता है)।`,
        question: () => "रोबोट को कैसे तय करना चाहिए कि इस पौधे के साथ क्या करे?",
        options: ["पत्तियाँ पीली हों तो पानी दो, नहीं तो कुछ मत करो", `नमी को ${DRY_BELOW}% की रेखा से मिलाओ: कम हो तो पानी, ज़्यादा हो तो झंडा`, "pH कम हो तो पानी दो, pH ज़्यादा हो तो झंडा लगाओ", "हमेशा पानी दो, क्योंकि मुरझाने का मतलब प्यास है"],
        explain: (r) => `सही। रोबोट ${r.moisture}% को ${DRY_BELOW}% से मिलाता है। ` + (r.dry
          ? "यह रेखा से कम है, इसलिए रोबोट पौधे को पानी देगा। अब देखो वह क्या करता है।"
          : "यह रेखा से ज़्यादा है, इसलिए रोबोट किसान के लिए झंडा लगाएगा। अब देखो वह क्या करता है।"),
      },
      {
        name: "फ़ैसला देखो",
        title: "रोबोट अपने नियम का पालन करता है",
        text: (r) => r.dry
          ? `नियम: अगर नमी ${DRY_BELOW}% से कम है, तो पौधे को पानी दो। नमी ${r.moisture}% है, इसलिए रोबोट पानी देता है और रीडिंग सेव करता है।`
          : `नियम: अगर मिट्टी गीली है और पौधा मुरझाया है, तो किसान के लिए झंडा लगाओ। नमी ${r.moisture}% है, इसलिए रोबोट झंडा लगाता है और रीडिंग सेव करता है।`,
        question: () => "किसान कहता है कि झंडे वाले कई पौधे शाम तक ठीक हो गए। गर्म दोपहर में पौधे अक्सर कुछ घंटों के लिए झुकते हैं और फिर ठीक हो जाते हैं। रोबोट के नियम में कौन-सा बदलाव सबसे अच्छा है?",
        options: ["अगली सुबह फिर जाँचो; सिर्फ़ तब भी झुके पौधों पर झंडा लगाओ", "झंडा लगाने की जगह हर मुरझाए पौधे को पानी दो", "झंडे लगाना बंद करो; किसान खुद खेत में घूम लेगा"],
        explain: () => "सही। सुबह की दोबारा जाँच उन पौधों को हटा देती है जो सिर्फ़ दोपहर की गर्मी में झुके थे, इसलिए किसान को कम झूठी चेतावनियाँ मिलती हैं। गीली मिट्टी में पानी देने से जड़ों को नुकसान होगा, और झंडे बंद करने से रोबोट की मदद खत्म हो जाएगी।",
      },
      {
        name: "नई जगह पर आज़माओ",
        title: "एक नया खेत",
        text: () => "जो सीखा, उसे नई स्थिति में लगाओ।",
        question: () => "दूसरे खेत में मिट्टी की नमी 70% है और पास-पास के तीन पौधे मुरझा रहे हैं। रोबोट को क्या करना चाहिए?",
        options: ["तीनों को पानी दो, क्योंकि कई पौधे प्यासे हैं", "झंडा लगाओ; पास-पास के बीमार पौधे फैलती बीमारी का संकेत हो सकते हैं", "कुछ मत करो; गीली मिट्टी का मतलब पौधे ठीक हैं"],
        explain: (r) => `सही। गीली मिट्टी में प्यास कारण नहीं हो सकती, और पास-पास कई मुरझाए पौधे फैलती बीमारी का संकेत हो सकते हैं, इसलिए किसान को जल्दी जाँच करनी चाहिए। अब ${r.dry ? "गीली" : "सूखी"} मिट्टी के साथ रोबोट को फिर से चलाओ।`,
      },
    ],
  },
};
 
const t = () => TEXT[lang];
 
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
 
function makePlant(el, sick) {
  const stem = sick ? "#9e9d24" : "#2e7d32";
  const leaf = sick ? "#d4e157" : "#43a047";
  const tilt = sick ? 55 : 20; // drooping leaves hang lower
  el.innerHTML = `
    <a-cylinder color="${stem}" radius="0.006" height="0.11" rotation="90 0 0" position="0 0 0.055"></a-cylinder>
    <a-sphere color="${leaf}" radius="0.03" scale="1.6 0.5 0.25" position="0.035 0 ${sick ? 0.07 : 0.085}" rotation="0 ${tilt} 0"></a-sphere>
    <a-sphere color="${leaf}" radius="0.03" scale="1.6 0.5 0.25" position="-0.035 0 ${sick ? 0.06 : 0.075}" rotation="0 ${-tilt} 0"></a-sphere>
    <a-sphere color="${leaf}" radius="0.028" scale="1 0.5 1.4" position="0 0 ${sick ? 0.1 : 0.12}" rotation="${sick ? 40 : 0} 0 0"></a-sphere>`;
  if (sick) {
    el.setAttribute("animation__sway", { property: "rotation", from: "0 -4 0", to: "0 4 0", dur: 1400, dir: "alternate", loop: true });
  }
}
 
function resetScene() {
  $("robot").setAttribute("position", "-0.5 -0.1 0");
  $("probe").setAttribute("position", "0.1 0.03 0.07");
  $("water").setAttribute("visible", false);
  $("flag").setAttribute("visible", false);
  $("readingLabel").setAttribute("visible", false);
  $("soilPatch").setAttribute("color", "#6d4c41");
}
 
function showReadings() {
  const r = readings;
  $("readings").classList.remove("hidden");
  $("moistureFill").style.width = r.moisture + "%";
  $("moistureValue").textContent = r.moisture + "%";
  $("phMarker").style.left = ((r.ph - 0) / 14) * 100 + "%";
  $("phValue").textContent = r.ph.toFixed(1);
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
      animate($("robot"), "drive", "position", "-0.1 -0.1 0", 2500);
    },
    correct: () => 1,
  },
  {
    enter: () => {
      animate($("probe"), "down", "position", "0.1 0.08 0.03", 1200);
      setTimeout(showReadings, 1300);
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
        w.setAttribute("position", "0 0.06 0.25");
        w.setAttribute("visible", true);
        w.removeAttribute("animation__fall");
        w.setAttribute("animation__fall", { property: "position", from: "0 0.06 0.25", to: "0 0.06 0.03", dur: 900, loop: 3 });
        $("soilPatch").setAttribute("color", "#4e342e");
      } else {
        $("flag").setAttribute("visible", true);
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
  document.querySelectorAll(".langBtn").forEach((b) => (b.textContent = t().switchTo));
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
  $("stageName").textContent = `${stage + 1} ${t().of} ${stages.length} · ${w.name}`;
  $("title").textContent = w.title;
  $("text").textContent = w.text(readings);
  $("feedback").textContent = "";
  $("options").innerHTML = "";
  $("question").textContent = "";
 
  const next = $("nextBtn");
  next.classList.toggle("hidden", Boolean(w.question));
  next.textContent = s.replay ? t().tryAgain(readings) : t().next;
 
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
          // Choices are saved in English so answers from both languages can be counted together.
          answers.push({ stage: stage + 1, lang, moisture: readings.moisture, ph: readings.ph, choice: TEXT.en.stages[stage].options[i], firstTryCorrect: right, time: Date.now() });
          localStorage.setItem("plantDoctorAnswers", JSON.stringify(answers));
        }
        b.className = right ? "right" : "wrong";
        if (right) {
          $("feedback").textContent = w.explain(readings);
          next.classList.remove("hidden");
        } else {
          $("feedback").textContent = t().wrong;
        }
      };
      $("options").appendChild(b);
    });
  }
  if (runEnter) s.enter();
}
 
document.querySelectorAll(".langBtn").forEach((b) => {
  b.onclick = () => {
    lang = lang === "en" ? "hi" : "en";
    localStorage.setItem("plantDoctorLang", lang);
    applyStaticText();
    if (readings) render(false);
  };
});
 
$("nextBtn").onclick = () => {
  if (stages[stage].replay) {
    readings = newReadings(!readings.dry);
    stage = 0;
  } else {
    stage = Math.min(stage + 1, stages.length - 1);
  }
  render();
};
 
// ---------- Start ----------
 
applyStaticText();
 
const sceneEl = document.querySelector("a-scene");
 
sceneEl.addEventListener("loaded", () => {
  document.querySelectorAll(".plant").forEach((el) => makePlant(el, false));
  makePlant($("sickPlant"), true);
 
  const target = $("target");
  target.addEventListener("targetFound", () => $("scanHint").classList.add("hidden"));
  target.addEventListener("targetLost", () => $("scanHint").classList.remove("hidden"));
});
 
$("startBtn").onclick = () => {
  $("intro").classList.add("hidden");
  $("topbar").classList.remove("hidden");
  $("panel").classList.remove("hidden");
  $("scanHint").classList.remove("hidden");
  sceneEl.systems["mindar-image-system"].start();
  readings = newReadings(Math.random() < 0.5);
  stage = 0;
  render();
};
 