# Plant Doctor AR

A browser-based AR activity. Students point a phone at the Plant Doctor card and watch a farm robot notice a drooping plant, test the soil, and decide what to do. They answer a question at each step before the robot acts. The soil readings are random on every run, so a replay gives new values to reason about.

## Files

Keep this folder structure exactly; the files find each other by these paths.

```
plant-doctor/
  index.html         the page: start screen, question panel, 3D scene
  style.css          colours, fonts and layout of the panel
  app.js             the logic: random readings, the five stages, answer checking
  assets/
    marker.png       the Plant Doctor card. Print it, or show it on another screen
    marker.mind      the card compiled for MindAR (tracking data)
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
5. Print `marker.png` (A4 works well) and point the phone at it. Holding the phone at an angle, as if looking down at a table, makes the 3D look best.

## How the code is organised

| File | Part | What it does |
| --- | --- | --- |
| `index.html` | `#intro` | Start screen |
| `index.html` | `#topbar`, `#panel` | Progress dots, question panel, sensor bars |
| `index.html` | `<a-entity id="target">` | The 3D objects on the card: soil patch, 5 plants, robot, reading label, water, flag |
| `app.js` | `newReadings()` | Picks a random moisture (8 to 30% when dry, 45 to 90% when wet) and pH (4.8 to 8.6) |
| `app.js` | `stages` | The five stages: text, question, options, correct answer, explanation, and what moves |
| `app.js` | `render()` | Shows a stage and checks answers. Each first answer is saved in the browser under `plantDoctorAnswers` |
| `style.css` | | Look of everything outside the 3D scene |

**Coordinates on the card:** `x` runs left to right, `y` runs up the card, `z` comes out of the card towards you. The card is 1 unit wide and 0.667 units tall, with (0, 0) at its centre.

## The five stages

1. **Notice:** the robot drives to the drooping plant. *Why might it droop?* (Answer: it could be either thirst or sickness.)
2. **Gather information:** the probe goes in; moisture and pH appear as bars and above the robot. *Is this pH acidic, neutral or basic?* (The answer depends on the random pH.)
3. **Predict:** *What should the robot do?* (Dry soil: water it. Wet soil: flag it for the farmer.)
4. **See the decision:** the rule appears and the robot waters the plant or plants a flag. *Can the robot be sure what is wrong?* (No, readings are clues.)
5. **Change an input:** replay with the opposite soil and new random readings.

## What I tested

I ran it in a headless Chrome with a simulated camera showing the card. The card was found, the robot and plants appeared on it, all five stages worked, random readings changed the correct answers, and answers were saved. Tracking on a real phone, in real light, still needs your test.

## This week's tasks (about 2 hours)

| # | Task | Time |
| --- | --- | --- |
| 1 | Replace your old files with these, run on your laptop, and play through all five stages twice | 20 min |
| 2 | Read A-Frame's [Building a Basic Scene](https://aframe.io/docs/1.6.0/guides/building-a-basic-scene.html), then change the robot's colour in `index.html` | 45 min |
| 3 | Put it on GitHub Pages, print the card, and test on your phone | 40 min |
| 4 | Write down anything that looks wrong or confusing and send it to me | 15 min |
