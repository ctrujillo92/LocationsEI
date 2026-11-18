/*
 * Locations – Expressive Identification: teaching state machine.
 *
 * Pure logic, no DOM. The whole session is one plain JSON-serialisable object,
 * so it can be saved to localStorage after every change and restored exactly.
 *
 * Recording a trial works like Skills Logbook:
 *   1. (Optional) the BT selects a prompt type: "full" or "partial" echoic.
 *   2. The BT marks the outcome: "correct" | "incorrect" | "noresp".
 *   One outcome tap = one trial. A prompt selection alone records nothing.
 *
 * Stages of the current target:
 *   "initial"  – first presentation of this target
 *   "followup" – same photo again after a prompted correct (BT may prompt or fade)
 *   "prompt"   – after an error: the BT must select a prompt before marking
 *
 * Rules:
 *   - Unprompted Correct ends the target and moves to a new one. Only an
 *     unprompted Correct on the initial presentation celebrates and counts
 *     toward photo unlocking.
 *   - Unprompted Incorrect / No Response → "prompt" stage, same photo.
 *   - Prompted Correct → "followup", same photo, new SD.
 *   - Prompted Incorrect / No Response → "prompt" again; after 2 in a row,
 *     move to another target.
 *   - The session ends immediately when the 15th trial is recorded.
 */
(function (root) {
  "use strict";

  var MAX_TRIALS = 15;
  var STREAK_TO_UNLOCK = 3;
  var MAX_PROMPT_FAILS = 2;
  var PHOTOS_PER_LOCATION = 3;
  var MIN_SELECT = 2;
  var MAX_SELECT = 6;
  var MODES = ["errorless", "correction"];
  var OUTCOMES = ["correct", "incorrect", "noresp"];
  var PROMPTS = ["full", "partial"];

  var GENERAL_SDS = ["Where is this?", "Where is it?", "Where's that?", "Where is this at?"];
  var PERSON_SDS = {
    male: ["Where is he?"],
    female: ["Where is she?"],
    group: ["Where are they?"]
  };

  var OUTCOME_LABELS = { correct: "Correct", incorrect: "Incorrect", noresp: "No Response" };
  var PROMPT_LABELS = { full: "Full Echoic", partial: "Partial Echoic" };

  function labelFor(outcome, prompt) {
    return prompt ? PROMPT_LABELS[prompt] + " \u2013 " + OUTCOME_LABELS[outcome] : OUTCOME_LABELS[outcome];
  }

  function sdsForPhoto(meta) {
    var extra = (meta && PERSON_SDS[meta.people]) || [];
    return GENERAL_SDS.concat(extra);
  }

  function pick(list, rng) {
    return list[Math.floor(rng() * list.length)];
  }

  function pickSD(meta, rng) {
    return pick(sdsForPhoto(meta), rng);
  }

  /*
   * Choose the next target. Underrepresented locations are strongly favoured,
   * but any location can be chosen (including the same one twice in a row).
   * `exclude` is used when the error limit is reached, so a different location follows.
   */
  function chooseLocation(s, rng, exclude) {
    var pool = s.selected.filter(function (id) { return id !== exclude; });
    if (!pool.length) pool = s.selected.slice();
    var min = Infinity;
    pool.forEach(function (id) { if (s.initialCounts[id] < min) min = s.initialCounts[id]; });
    var weights = pool.map(function (id) {
      var d = s.initialCounts[id] - min;
      // Least-presented locations are strongly preferred; one presentation ahead
      // is still possible (uneven counts and repeats allowed); two ahead is not.
      return d === 0 ? 1 : d === 1 ? 0.12 : 0;
    });
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = rng() * total;
    for (var i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r < 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function presentInitial(s, photos, rng, exclude) {
    var loc = chooseLocation(s, rng, exclude);
    var unlocked = s.progress[loc].unlocked;
    var photoIdx = Math.floor(rng() * unlocked); // any unlocked photo, repeats allowed
    s.initialCounts[loc] += 1;
    s.current = {
      loc: loc,
      photoIdx: photoIdx,
      stage: "initial",
      sd: pickSD(photos[loc][photoIdx], rng),
      prompt: null, // selected prompt type, waiting for an outcome
      promptFails: 0
    };
  }

  function createSession(selected, photos, rng, mode) {
    rng = rng || Math.random;
    mode = mode || "correction";
    if (MODES.indexOf(mode) === -1) throw new Error("Unknown mode: " + mode);
    if (!Array.isArray(selected) || selected.length < MIN_SELECT || selected.length > MAX_SELECT) {
      throw new Error("Select between " + MIN_SELECT + " and " + MAX_SELECT + " locations.");
    }
    var s = {
      schema: 3,
      status: "active", // "active" | "complete"
      mode: mode, // "errorless" | "correction" (shown on screen and results)
      selected: selected.slice(),
      trials: [],
      progress: {},
      initialCounts: {},
      current: null,
      paused: false,
      undo: null, // JSON snapshot of the state before the last trial
      startedAt: Date.now()
    };
    s.selected.forEach(function (id) {
      s.progress[id] = { unlocked: 1, streak: 0 };
      s.initialCounts[id] = 0;
    });
    presentInitial(s, photos, rng, null);
    return s;
  }

  function snapshot(s) {
    var copy = JSON.parse(JSON.stringify(s));
    copy.undo = null;
    return JSON.stringify(copy);
  }

  function canScore(s) {
    return !!s && s.status === "active" && !s.paused && !!s.current;
  }

  /* Select (or clear) a prompt type for the current trial. Records nothing. */
  function selectPrompt(s, level) {
    if (!canScore(s)) return s;
    if (level !== null && PROMPTS.indexOf(level) === -1) throw new Error("Unknown prompt: " + level);
    s.current.prompt = (s.current.prompt === level) ? null : level; // tap again to clear
    return s;
  }

  /* True when an outcome can be marked now (the "prompt" stage needs a prompt first). */
  function canMark(s) {
    return canScore(s) && !(s.current.stage === "prompt" && !s.current.prompt);
  }

  /* Record one trial with the given outcome. Mutates and returns the session, plus UI flags. */
  function score(s, outcome, photos, rng) {
    rng = rng || Math.random;
    if (!canScore(s)) return { session: s, recorded: false };
    if (OUTCOMES.indexOf(outcome) === -1) throw new Error("Unknown outcome: " + outcome);
    if (!canMark(s)) return { session: s, recorded: false, needsPrompt: true };

    var before = snapshot(s);
    var c = s.current;
    var stage = c.stage;
    var prompt = c.prompt;
    s.trials.push({
      n: s.trials.length + 1,
      target: c.loc,
      photoIdx: c.photoIdx,
      sd: c.sd,
      stage: stage,
      prompt: prompt,
      code: outcome,
      response: labelFor(outcome, prompt)
    });

    var celebrate = false;
    var next = null; // "initial" | "initial-exclude" | null (stay on same photo)
    var p = s.progress[c.loc];
    c.prompt = null;

    if (!prompt) {
      if (outcome === "correct") {
        if (stage === "initial") {
          p.streak += 1;
          if (p.streak >= STREAK_TO_UNLOCK && p.unlocked < PHOTOS_PER_LOCATION) {
            p.unlocked += 1; // silent unlock
            p.streak = 0; // "another 3 consecutive" needed for the next photo
          }
          celebrate = true;
        }
        next = "initial";
      } else {
        if (stage === "initial") p.streak = 0;
        c.stage = "prompt";
        c.promptFails = 0;
      }
    } else {
      if (stage === "initial") p.streak = 0; // a prompted response isn't independent
      if (outcome === "correct") {
        c.stage = "followup";
        c.promptFails = 0;
      } else {
        c.promptFails += 1;
        if (c.promptFails >= MAX_PROMPT_FAILS) next = "initial-exclude";
        else c.stage = "prompt";
      }
    }
    if (next === null) c.sd = pickSD(photos[c.loc][c.photoIdx], rng); // same photo, new SD

    // Trial limit overrides all other teaching logic.
    if (s.trials.length >= MAX_TRIALS) {
      s.status = "complete";
      s.current = null;
      s.paused = false;
      s.undo = null;
      s.completedAt = Date.now();
      return { session: s, recorded: true, celebrate: celebrate, complete: true };
    }

    if (next === "initial") presentInitial(s, photos, rng, null);
    else if (next === "initial-exclude") presentInitial(s, photos, rng, c.loc);

    s.undo = before;
    return { session: s, recorded: true, celebrate: celebrate, complete: false };
  }

  /* Reverse only the most recent trial (one level only). */
  function undo(s) {
    if (!s || s.status !== "active" || s.paused || !s.undo) return s;
    var restored = JSON.parse(s.undo);
    restored.undo = null; // repeated Undo cannot reach older trials
    restored.paused = false;
    return restored;
  }

  function canUndo(s) {
    return !!s && s.status === "active" && !s.paused && !!s.undo;
  }

  function pause(s) { if (s && s.status === "active") s.paused = true; return s; }
  function resume(s) { if (s && s.status === "active") s.paused = false; return s; }

  var api = {
    MAX_TRIALS: MAX_TRIALS,
    STREAK_TO_UNLOCK: STREAK_TO_UNLOCK,
    MAX_PROMPT_FAILS: MAX_PROMPT_FAILS,
    labelFor: labelFor,
    selectPrompt: selectPrompt,
    canMark: canMark,
    MIN_SELECT: MIN_SELECT,
    MAX_SELECT: MAX_SELECT,
    MODES: MODES,
    GENERAL_SDS: GENERAL_SDS,
    PERSON_SDS: PERSON_SDS,
    OUTCOME_LABELS: OUTCOME_LABELS,
    PROMPT_LABELS: PROMPT_LABELS,
    sdsForPhoto: sdsForPhoto,
    createSession: createSession,
    score: score,
    undo: undo,
    canUndo: canUndo,
    canScore: canScore,
    pause: pause,
    resume: resume
  };
  root.LocEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);
