# Plant Doctor AR

A browser-based AR activity. Students point a phone at the Plant Doctor card and watch a farm robot notice a drooping plant, test the soil, and decide what to do. They answer a question at each step before the robot acts. The soil readings are random on every run, so a replay gives new values to reason about.

## Files

Keep this folder structure exactly; the files find each other by these paths.

```
plant-doctor/
  index.html         the page: start screen, question panel, 3D scene
  style.css          colours, fonts and layout of the panel
  app.js             the logic: random readings, the five stages, answer checking, the finale
  assets/
    marker.png       the Plant Doctor card. Print it (best), or show it on another screen
    marker.mind      the card compiled for MindAR (tracking data)
    photo-texture.jpg, height.png       the photo and its height map, which raise the photo into 3D
    plant-a.png, plant-b.png, plant-sick.png, plant-sick-healed.png   real plants cut out of the photo
  make3d.py          rebuilds the height map and cut-out plants from marker.png (Python, needs numpy and Pillow)
  README.md          this file
```

Yes, this is the whole app. There is no server, database or app store. That is a strength: it is free and runs on any phone with a browser.

## Run it on your laptop

The camera only works on `localhost` or an `https://` page.

1. Open a terminal in the `plant-doctor` folder.
2. Run `python -m http.server 8000`.
3. In Chrome, open `http://localhost:8000`, press **Start** and allow the camera.
4. Open `assets/marker.png` on your phone (or print it) and hold it in front of the webcam.

After any change to a file, save it and refresh the browser.

## Run it on your phone

1. Create a public GitHub repository called `plant-doctor`.
2. Upload all the files, keeping the `assets` folder (drag the whole folder onto the upload page).
3. Settings > Pages > Source: "Deploy from a branch", branch `main`, folder `/ (root)`, Save.
4. After a minute or two, open `https://<your-username>.github.io/plant-doctor/` on your phone.
5. Print `marker.png` in portrait (A4 works well) and point the phone at it. Start almost straight above the card, wait until the robot appears, then tilt for a better 3D view.

## The marker card

`marker.png` and `marker.mind` are a pair. If you change the picture, you must recompile the `.mind` file (MindAR's online compiler: https://hiukim.github.io/mind-ar-js-doc/tools/compile), or the card will never be found.

The card is now a **real photo of a soybean field** (portrait, 1000 x 1334), as the professor suggested. On the phone the photo itself becomes 3D: the same picture is laid over the card and pushed up wherever there are leaves (`height.png`), so the crop rows stand out of the paper. Three real plants are cut out of the photo and stand up from where they grow; the middle one is the sick plant, shown yellow and drooping, and it stands up green again if the robot waters it. The robot starts at the bottom of the furrow to the right of the middle row and drives up to stop beside the sick plant. All positions are in `index.html`, and the sick plant and robot path are also at the top of `app.js` (`SICK_AT`, `ROBOT_START`, `ROBOT_STOP`). If you change the photo, run `python make3d.py` to rebuild the 3D layers (change the crop boxes in it to pick other plants), and update those numbers.

In simulated camera shots (4 sizes, 3 tilts, with and without blur) the photo was found in 23 of 24, against 20 of 24 for the previous field map card. The field map card is saved in `plant-doctor-previews/field-map-card/` if you ever want it back.

For reliable tracking:
- **Print it** on matte paper, at least A5 (A4 is better). A laptop or phone screen works, but its glare and moiré make it much harder.
- **Fill about half the screen** with the card, about 25 to 40 cm away. The whole card must be in view.
- **Tilt no more than about 45 degrees.** Past about 60 degrees it is not found at all.
- **Good, even light**, no shadow of the phone across the card. Hold still for 2 seconds.
- Keep the card in the **top half of the screen**: the question panel covers the bottom.

## How the code is organised

| File | Part | What it does |
| --- | --- | --- |
| `index.html` | `#intro` | Start screen |
| `index.html` | `#topbar`, `#panel` | Progress dots, question panel, sensor bars |
| `index.html` | `<a-entity id="target">` | The 3D objects on the card: the raised photo (`#relief`), soil patch, 3 cut-out plants, robot, reading label, water, flag |
| `app.js` | `newReadings()` | Picks a random moisture (8 to 30% when dry, 45 to 90% when wet) and pH (4.8 to 8.6) |
| `app.js` | `TEXT` | Every word students see, in English (`en`) and Hindi (`hi`). Fix a translation here |
| `app.js` | `stages` | The five stages: the correct answer and what moves in 3D |
| `app.js` | `render()` | Shows a stage and checks answers. Each first answer is saved in the browser under `plantDoctorAnswers`, with the language used |
| `index.html` | `.langBtn` | The English / हिंदी switch, on the start screen and in the top bar. The choice is remembered |
| `index.html` | `#finale` | The ending: a plain run summary |
| `app.js` | `showFinale()` | Shows what happened to the plant, the first-try score and what the student did |
| `style.css` | | Look of everything outside the 3D scene |

**Coordinates on the card:** `x` runs left to right, `y` runs up the card, `z` comes out of the card towards you. The card is 1 unit wide and 1.334 units tall, with (0, 0) at its centre.

## The five stages

Each question is at Bloom's apply, analyse or evaluate level (week 2 feedback). The full table and the thinking-process chart are in the "Plant Doctor: thinking process and higher-order questions" doc.

1. **Notice** (analyse): the robot drives to the drooping plant; its neighbours look healthy. *What does this tell the robot?* (Something about this plant or its soil is different.)
2. **Gather information** (evaluate): the probe goes in; moisture and pH appear as bars and above the robot. *A second reading 10 cm away disagrees. What should the robot do?* (Take a third reading, not trust one or average.)
3. **Predict** (apply): *How should the robot decide what to do?* (Compare moisture with the 35% line: water if below, flag if above.)
4. **See the decision** (evaluate): the robot waters the plant or plants a flag. *Plants often droop on hot afternoons and recover. Best change to the rule?* (Recheck next morning, flag only those still drooping.)
5. **Apply it elsewhere** (evaluate): *Moisture 70%, three plants side by side drooping. What should the robot do?* (Flag them: possible spreading disease.) Then replay with the opposite soil and new random readings.

## What I tested

I ran it in a headless Chrome with a simulated camera showing the card. The card was found, the robot and plants appeared on it, all five stages worked, random readings changed the correct answers, and answers were saved. Tracking on a real phone, in real light, still needs your test.

## Doc, the robot

The robot is called **Doc** (डॉक in Hindi). Doc asks each question in a speech bubble, in its own voice ("What should I do?"). Doc's face in the panel matches the 3D robot. It smiles and the 3D robot hops when an answer is right, and it looks puzzled when an answer is wrong. The face is drawn in `DOC_SVG` in `app.js`.

Sounds play when Doc finds the card, drives, reads the sensors, waters or flags the plant, and when an answer is right or wrong. They are made in the browser (Web Audio), so there are no sound files. The speaker button in the top bar turns sound off, and the phone remembers the choice. Change a sound in `sfx` in `app.js`.

## The ending

After stage 5, **See summary** opens a plain run summary: what happened to the sick plant (watered, or flagged for the farmer), how many questions were right on the first try, and the three things the student did. If the soil was dry, the watered plant stands up again on the card. **Try again** starts a new run with the opposite soil and new random readings.

## Language

The **English | हिंदी** switch is on the start screen, and **EN | हि** is in the top bar during the activity. Everything outside the 3D scene switches, including the sensor tags (DRY/सूखी). Hindi uses the Noto Sans Devanagari font, so it looks the same on every phone. The 3D label above the robot shows only numbers (`15%  |  pH 6.3`), because A-Frame's built-in font has no Hindi letters.

## Week 3 tasks (about 2 hours): show the prototype

| # | Task | Time |
| --- | --- | --- |
| 1 | Upload the latest `index.html`, `style.css` and `app.js` to GitHub, and open the page on your phone | 20 min |
| 2 | Print the card (A4) and play through all five stages twice, once with dry soil and once with wet | 20 min |
| 3 | Practise a 3-minute demo: the problem, the five stages live on your phone, and how SoW will measure it | 40 min |
| 4 | Take 2 screenshots or a short screen recording as a backup in case the camera fails in the meeting | 20 min |
| 5 | Write down what your mentors say and send it to me | 20 min |

## Week 4 tasks (about 2 hours): Hindi and first users

| # | Task | Time |
| --- | --- | --- |
| 1 | Replace `index.html`, `style.css` and `app.js` in your GitHub repository with these. Wait a minute, then refresh the page on your phone | 15 min |
| 2 | Play through all five stages once in English and once in Hindi, on two different phones if you can | 30 min |
| 3 | Ask a Hindi speaker to read every Hindi screen and mark any word a Class 6 to 8 student might not know | 30 min |
| 4 | Show it to 2 or 3 people who have not seen it. Do not explain; watch where they get stuck | 30 min |
| 5 | Send me the list of problems and word changes | 15 min |

## If the 3D photo floats above the card

A-Frame lifts a displaced surface by half a unit unless told not to, which hides the plants and robot under the photo. Keep `displacementBias: 0` in the `#relief` material in `index.html`.
