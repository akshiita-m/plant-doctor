// Plant Doctor AR: stage logic.
// Each run picks random soil readings, so a replay gives students new values to reason about.
 
const DRY_BELOW = 35; // soil moisture % below this counts as dry
 
const $ = (id) => document.getElementById(id);
const rand = (lo, hi) => lo + Math.random() * (hi - lo);
 
let readings = null; // { moisture, ph, dry }
let stage = 0;
const answers = JSON.parse(localStorage.getItem("plantDoctorAnswers") || "[]");
 
function newReadings(dry) {
  const moisture = Math.round(dry ? rand(8, 30) : rand(45, 90));
  const ph = Math.round(rand(4.8, 8.6) * 10) / 10;
  return { moisture, ph, dry };
}
 
function phType(ph) {
  if (ph < 6.5) return 0; // acidic
  if (ph <= 7.5) return 1; // neutral
  return 2; // basic
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
  $("readingText").setAttribute("value", `Moisture ${r.moisture}%   pH ${r.ph.toFixed(1)}`);
  $("readingLabel").setAttribute("visible", true);
}
 
// ---------- Stages ----------
 
const stages = [
  {
    name: "Notice",
    title: "The robot spots a drooping plant",
    text: () => "The robot drives along the crop row. Its camera notices one plant with drooping, yellow leaves.",
    enter: () => {
      resetScene();
      $("readings").classList.add("hidden");
      animate($("robot"), "drive", "position", "-0.1 -0.1 0", 2500);
    },
    question: "Why might this plant be drooping?",
    options: () => ["It needs water", "It could be sick", "It could be either"],
    correct: () => 2,
    explain: () => "Right. A drooping plant could be thirsty or sick, so the robot needs more information.",
  },
  {
    name: "Gather information",
    title: "The robot tests the soil",
    text: () => "The robot pushes its probe into the soil next to the plant and reads two sensors.",
    enter: () => {
      animate($("probe"), "down", "position", "0.1 0.08 0.03", 1200);
      setTimeout(showReadings, 1300);
    },
    question: () => `The soil pH is ${readings.ph.toFixed(1)}. Is this soil acidic, neutral or basic?`,
    options: () => ["Acidic (below 6.5)", "Neutral (6.5 to 7.5)", "Basic (above 7.5)"],
    correct: () => phType(readings.ph),
    explain: () => ["Acidic, because the pH is below 6.5.", "Neutral, because the pH is between 6.5 and 7.5.", "Basic, because the pH is above 7.5."][phType(readings.ph)],
  },
  {
    name: "Predict",
    title: "What should the robot do?",
    text: () => `The plant is drooping. Soil moisture is ${readings.moisture}% (below ${DRY_BELOW}% counts as dry).`,
    enter: () => {},
    question: "Choose the robot's next action:",
    options: () => ["Water the plant", "Flag the plant for the farmer to check", "Do nothing"],
    correct: () => (readings.dry ? 0 : 1),
    explain: () => readings.dry
      ? "Yes. The soil is dry, so the plant is probably thirsty. The robot waters it."
      : "Yes. The soil is already wet, so thirst is unlikely. Something else may be wrong, so a person should check.",
  },
  {
    name: "See the decision",
    title: "The robot follows its rules",
    text: () => readings.dry
      ? `Rule: IF moisture is below ${DRY_BELOW}%, THEN water the plant. Moisture is ${readings.moisture}%, so the robot waters it and saves the reading.`
      : `Rule: IF the soil is wet AND the plant droops, THEN flag it for the farmer. Moisture is ${readings.moisture}%, so the robot places a flag and saves the reading.`,
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
    question: "Can the robot be sure what is wrong with the plant?",
    options: () => ["Yes, its sensors prove it", "No, readings are clues and a person should check"],
    correct: () => 1,
    explain: () => "Correct. Sensors give clues, not a diagnosis. That is why the robot records the readings for the farmer.",
  },
  {
    name: "Change an input",
    title: "What if the soil were different?",
    text: () => `This time the soil was ${readings.dry ? "dry" : "wet"}. Try again with ${readings.dry ? "wet" : "dry"} soil and new readings. Does the robot decide differently?`,
    enter: () => {},
    replay: true,
  },
];
 
// ---------- Rendering ----------
 
function renderDots() {
  $("dots").innerHTML = stages
    .map((_, i) => `<span class="dot ${i < stage ? "done" : i === stage ? "now" : ""}"></span>`)
    .join("");
}
 
function render() {
  const s = stages[stage];
  renderDots();
  $("stageName").textContent = `${stage + 1} of ${stages.length} · ${s.name}`;
  $("title").textContent = s.title;
  $("text").textContent = s.text();
  $("feedback").textContent = "";
  $("options").innerHTML = "";
  $("question").textContent = "";
 
  const next = $("nextBtn");
  next.classList.toggle("hidden", Boolean(s.question));
  next.textContent = s.replay ? `Try again with ${readings.dry ? "wet" : "dry"} soil` : "Next";
 
  if (s.question) {
    $("question").textContent = typeof s.question === "function" ? s.question() : s.question;
    let answered = false;
    s.options().forEach((label, i) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.onclick = () => {
        const right = i === s.correct();
        if (!answered) {
          answered = true;
          answers.push({ stage: stage + 1, moisture: readings.moisture, ph: readings.ph, choice: label, firstTryCorrect: right, time: Date.now() });
          localStorage.setItem("plantDoctorAnswers", JSON.stringify(answers));
        }
        b.className = right ? "right" : "wrong";
        if (right) {
          $("feedback").textContent = s.explain();
          next.classList.remove("hidden");
        } else {
          $("feedback").textContent = "Not quite. Look at the clues and try again.";
        }
      };
      $("options").appendChild(b);
    });
  }
  s.enter();
}
 
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