# Locations – Expressive Identification

A static, offline-capable ABA teaching web app (PWA) for iPad Safari. It runs on GitHub Pages with no backend, no database, and no paid services.

---

## Photograph status: 69 of 69 included

All 23 locations have their 3 photos, so every location can be selected. `photos/CREDITS.csv` lists each photo's SD setting and any notes. Photos to replace when you find better ones:

- **Watermarked:** swimming-pool-3, police-station-2, police-station-3, park-2
- **Text naming the location (placed as Photo 3 so they unlock last):** post-office-3, police-station-3, fire-station-3
- **Brand names a learner may say instead:** gas-station-2 (Shell), gas-station-3 (7-Eleven), restaurant-3 (McDonald's)
- **Small/soft on the iPad:** living-room-3, hospital-2, hospital-3, police-station-1, dentists-office-3, zoo-1, gym-2, gym-3

To replace a photo, keep the same file name, update its `people` value in `js/data.js` if needed, and bump `CACHE_VERSION` in `sw.js`.

### Adding or replacing photographs

1. For each location, get 3 photos that meet the clinical criteria in the build spec: a recognisable real place, meaningfully different from each other, no text labels, watermarks or logos, and a mix with and without people.
2. Recommended sources, which allow free inclusion in an app:
   - **Pexels** (pexels.com): Pexels License, free to use, no attribution required.
   - **Unsplash** (unsplash.com): Unsplash License, free to use. Don't build a competing photo service with the images.
   - **Wikimedia Commons**: filter for **CC0 / Public domain** to avoid attribution rules. CC BY images are fine too if you keep the credit in `photos/CREDITS.csv`.
   - Avoid any image showing identifiable children, signage that names the place (e.g. "POST OFFICE", "SCHOOL"), or brand logos (gas stations and grocery stores often have these).
3. Resize each photo to about **1600 px on the long side** and save it as JPEG at roughly 75–80% quality (≈200–400 KB each). This keeps the offline cache small (≈12–20 MB in total).
4. Name the files exactly like this and put them in `photos/`:
   `bedroom-1.jpg, bedroom-2.jpg, bedroom-3.jpg, … dentists-office-3.jpg` (23 locations × 3 = 69 files)
   The full list is in `photos/CREDITS.csv`. Photo 1 is shown first. Photos 2 and 3 unlock as the learner progresses.
5. Fill in `photos/CREDITS.csv` (source URL, author, licence) for your licensing records.
6. **Set SD metadata** in `js/data.js`. Each photo has `people: "none"`. Change it only when the photo clearly supports a person-specific SD:

   | value | when | extra SD allowed |
   |---|---|---|
   | `"none"` | no people | (general SDs only) |
   | `"male"` | exactly one clearly identifiable male | "Where is he?" |
   | `"female"` | exactly one clearly identifiable female | "Where is she?" |
   | `"group"` | multiple people | "Where are they?" |
   | `"unclear"` | a person whose gender isn't clearly established | (general SDs only) |

   General SDs (always available): "Where is this?", "Where is it?", "Where's that?", "Where is this at?"

7. Bump `CACHE_VERSION` in `sw.js` (for example `v1.0.0` → `v1.0.1`) and upload. See *Updating* below.

---

## Accepted responses (BT reference)

The BT decides whether a response is correct. If unsure, the BT taps **Show Answer** on the teaching screen: a full-screen card (covering the photo) shows the target and any agreed extra answers. It records nothing; tap anywhere to hide it. Turn the iPad toward yourself first so the learner doesn't see it.

These agreed variations count as correct. Natural phrasing like "the school" or "we're at school" also counts. To add more, edit `ACCEPTED` in `js/data.js` (and bump `CACHE_VERSION` in `sw.js`).

| Target | Also correct |
|---|---|
| Bedroom | room |
| Bathroom | restroom, potty |
| Swimming pool | pool |
| School | classroom, class |
| Grocery store | store |
| Park | playground |
| Restaurant | McDonald's or any restaurant name |
| Dentist's office | doctor's office (score correct, then model "dentist's office" to shape) |
| Hair salon | salon, barbershop |

## Project structure

```
locations-ei/
├── index.html              App shell (setup, teaching, results screens)
├── manifest.webmanifest    PWA manifest (installable, landscape)
├── sw.js                   Service worker: offline caching of app + photos
├── .nojekyll               Tells GitHub Pages to serve files as-is
├── css/styles.css
├── js/
│   ├── data.js             Fixed 23-location bank + photo files + SD metadata
│   ├── engine.js           Teaching state machine (pure logic, tested)
│   └── app.js              UI, saving, pause/resume, celebration
├── icons/                  App icons (192, 512, Apple touch)
├── photos/                 ← put the 69 JPEGs here (+ CREDITS.csv)
└── tests/engine.test.js    Automated state-machine tests (node tests/engine.test.js)
```

All paths are relative, so the app works under a repository subpath such as `https://yourname.github.io/locations-ei/`.

---

## Deploy to GitHub Pages (step by step)

1. Sign in at github.com and click **New repository**. Name it, for example, `locations-ei`. Set it to **Public** (free GitHub Pages needs a public repo unless you're on a paid plan). Click **Create repository**.
2. On the new repo page, click **uploading an existing file**.
3. Unzip this package on your computer. Open the `locations-ei` folder, select **everything inside it** (including the `css`, `js`, `icons` and `photos` folders, and `.nojekyll`), and drag it into the upload area.
   - On a Mac, press **⌘ Shift .** in Finder to show the hidden `.nojekyll` file. (It's optional; the app works without it.)
   - `index.html` must sit at the top level of the repository, not inside a subfolder.
4. Click **Commit changes**.
5. Go to **Settings → Pages**. Under *Build and deployment*, choose **Source: Deploy from a branch**, **Branch: main**, folder **/ (root)**, then click **Save**.
6. After about 1–2 minutes the page shows your URL, e.g. `https://yourname.github.io/locations-ei/`.

## Updating later (keeps the same URL)

1. Change or add files in the repo. Use **Add file → Upload files** with the same names to replace them. Photos go into `photos/`.
2. **Always bump `CACHE_VERSION` in `sw.js`** whenever anything changes. Without this, iPads keep serving the old cached version.
3. Commit. The URL stays the same as long as you don't rename the repository.
4. On each iPad, open the app once while online. The new version downloads in the background and is used on the next launch. (Close the app fully and reopen it.)

Unfinished sessions are stored on the iPad, not on GitHub, so updating doesn't erase a session in progress.

---

## Testing on an iPad

1. Open the GitHub Pages URL in **Safari**, while online.
2. Tap **Share → Add to Home Screen** for a full-screen app. Launch it from the home-screen icon after that.
3. Leave it open for about 30 seconds so all photos are cached. Then turn on **Airplane Mode**, close the app, reopen it, and run a session to confirm offline use.
4. Suggested checks:
   - Pick a teaching mode, select 2 locations and run 15 trials. Do the same with 6 locations.
   - Tap Incorrect → the screen says "Prompt" and the response buttons lock until you pick Full or Partial Echoic.
   - Pick Full Echoic, then Correct → recorded as "Full Echoic – Correct"; same photo stays with a new SD.
   - Tap Correct with no prompt → the app moves to a new target.
   - Two prompted misses in a row → the app moves to a different location.
   - Tap Undo → the previous trial number, photo and SD return. Undo then greys out.
   - Press the Home button or lock the iPad mid-session → on return, *Session Paused / Resume Session* appears.
   - Pull down to refresh, or close Safari, mid-session → reopening shows the same trial, paused.
   - After Trial 15: 15 rows appear, and Start New Session stays disabled until you tick the checkbox.

> Note: iOS clears website storage for sites not opened in a long time (about 7 days without use, for sites not added to the Home Screen). Adding the app to the Home Screen avoids this. Session data never leaves the iPad.

---

## How trial counting works

Recording a trial works like Skills Logbook: **pick a prompt type if one was used, then mark the response.** Only the response tap records a trial.

| BT taps | Recorded as |
|---|---|
| Correct | Correct |
| Incorrect | Incorrect |
| No Response | No Response |
| Full Echoic, then Correct / Incorrect / No Response | Full Echoic – Correct / – Incorrect / – No Response |
| Partial Echoic, then Correct / Incorrect / No Response | Partial Echoic – Correct / – Incorrect / – No Response |

Tapping Full Echoic or Partial Echoic highlights it (✓) and records nothing. Tap it again to clear it, or tap the other one to switch. The session ends the moment trial 15 is recorded (no Trial 16).

**What happens after each trial**

- **Correct (no prompt):** the target is done; the app moves to a new randomly chosen target.
- **Incorrect / No Response (no prompt):** same photo; the instruction just says **"Prompt"**. Correct / Incorrect / No Response stay locked until the BT picks Full Echoic or Partial Echoic.
- **Prompted Correct:** same photo with a new SD. The BT can prompt again or fade to independent; an unprompted Correct then moves on.
- **Prompted Incorrect / No Response:** same photo, "Prompt" again. After **2 prompted misses in a row**, the app moves to a different target.

Examples:
- Errorless (introducing Bedroom): Full Echoic – Correct, Full Echoic – Correct, Partial Echoic – Correct, Correct = 4 trials.
- Error correction: Incorrect, Full Echoic – Correct, Correct = 3 trials.

**Teaching mode** (Errorless Learning / Error Correction) is chosen on the setup screen for the whole session. It's shown on the teaching screen and at the top of the results; the buttons work the same in both.

**Behind the scenes (not shown in the results)**

- **Celebration:** only for an unprompted Correct on the *first* presentation of a target.
- **Photo unlocking:** each location has its own streak of first-try, unprompted Corrects. After 3, Photo 2 unlocks (streak resets); after another 3, Photo 3. A first-try error or prompt resets the streak. Unlocks are silent and last for the session.
- **Target choice:** least-presented locations are strongly preferred; repeats and back-to-back targets can happen. The session is never extended to even things out.
- **Undo** restores a full snapshot from before the last trial (trial number, photo, SD, stage, streaks, unlocks, counts). One level only.
- **Saving:** the session (including a selected prompt) is saved to `localStorage` after every change. A session restored after a refresh or close always comes back **paused**.

### Small additions beyond the spec
- A 350 ms double-tap guard ignores an accidental second tap on the same press, so one tap can't record two trials.
- Scoring buttons are disabled during the 1-second celebration.
- A small label ("New target" / "Same target" / "Prompt") tells the BT where they are. It never names the location.

## Running the tests

```
node tests/engine.test.js
```
30 state-machine tests, including a 2,000-session random fuzz test of the invariants.
