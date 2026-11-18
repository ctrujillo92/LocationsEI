/* Run with:  node tests/engine.test.js */
"use strict";
var assert = require("assert");
var E = require("../js/engine.js");
var DATA = require("../js/data.js");

var P = JSON.parse(JSON.stringify(DATA.PHOTOS));
P.kitchen[0].people = "female";
P.park[0].people = "group";
P.garage[0].people = "male";

function seeded(seed) {
  return function () {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

var passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { console.error("  ✗ " + name + "\n    " + e.stack); process.exitCode = 1; }
}

/* Shorthand: "C" / "I" / "NR" = unprompted outcome; "F:C" = Full Echoic then Correct; "P:NR" = Partial then No Response. */
var OUT = { C: "correct", I: "incorrect", NR: "noresp" };
function tap(s, token, rng) {
  var parts = token.split(":");
  if (parts.length === 2) {
    E.selectPrompt(s, parts[0] === "F" ? "full" : "partial");
    return E.score(s, OUT[parts[1]], P, rng);
  }
  return E.score(s, OUT[token], P, rng);
}
function run(s, tokens, rng) { tokens.forEach(function (t) { tap(s, t, rng); }); return s; }
function labels(s) { return s.trials.map(function (t) { return t.response; }); }
function randomToken(s, rng) {
  var o = ["C", "I", "NR"][Math.floor(rng() * 3)];
  var needs = s.current.stage === "prompt";
  var usePrompt = needs || rng() < 0.3;
  return usePrompt ? (rng() < 0.5 ? "F:" : "P:") + o : o;
}

console.log("Engine tests");

test("rejects bad selections and unknown modes", function () {
  assert.throws(function () { E.createSession(["kitchen"], P); });
  assert.throws(function () { E.createSession(["a", "b", "c", "d", "e", "f", "g"], P); });
  assert.throws(function () { E.createSession(["kitchen", "bedroom"], P, seeded(1), "bogus"); });
});

test("mode is stored (default: correction)", function () {
  assert.strictEqual(E.createSession(["kitchen", "bedroom"], P, seeded(1)).mode, "correction");
  assert.strictEqual(E.createSession(["kitchen", "bedroom"], P, seeded(1), "errorless").mode, "errorless");
});

test("selecting a prompt records nothing; tapping it again clears it", function () {
  var rng = seeded(2);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  E.selectPrompt(s, "full");
  assert.strictEqual(s.trials.length, 0);
  assert.strictEqual(s.current.prompt, "full");
  E.selectPrompt(s, "partial");
  assert.strictEqual(s.current.prompt, "partial");
  E.selectPrompt(s, "partial");
  assert.strictEqual(s.current.prompt, null);
});

test("prompt + outcome = one trial labelled with both", function () {
  var rng = seeded(3);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  run(s, ["F:C", "P:I", "P:NR"], rng);
  assert.deepStrictEqual(labels(s), ["Full Echoic – Correct", "Partial Echoic – Incorrect", "Partial Echoic – No Response"]);
  assert.strictEqual(s.current.prompt, null);
});

test("result labels: unprompted outcomes are just Correct / Incorrect / No Response", function () {
  var rng = seeded(4);
  var allowed = ["Correct", "Incorrect", "No Response",
    "Full Echoic – Correct", "Full Echoic – Incorrect", "Full Echoic – No Response",
    "Partial Echoic – Correct", "Partial Echoic – Incorrect", "Partial Echoic – No Response"];
  for (var seed = 1; seed <= 200; seed++) {
    var r = seeded(seed);
    var s = E.createSession(["kitchen", "bedroom", "park"], P, r);
    while (s.status === "active") tap(s, randomToken(s, r), r);
    s.trials.forEach(function (t) { assert.ok(allowed.indexOf(t.response) !== -1, t.response); });
  }
});

test("after an unprompted error the BT must choose a prompt before marking", function () {
  var rng = seeded(5);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  var loc = s.current.loc, photo = s.current.photoIdx;
  tap(s, "I", rng);
  assert.strictEqual(s.current.stage, "prompt");
  assert.strictEqual(s.current.loc, loc);
  assert.strictEqual(s.current.photoIdx, photo);
  assert.strictEqual(E.canMark(s), false);
  var r = E.score(s, "correct", P, rng);
  assert.strictEqual(r.recorded, false);
  assert.strictEqual(r.needsPrompt, true);
  assert.strictEqual(s.trials.length, 1);
  E.selectPrompt(s, "full");
  assert.strictEqual(E.canMark(s), true);
  E.score(s, "correct", P, rng);
  assert.strictEqual(s.trials[1].response, "Full Echoic – Correct");
});

test("no response also goes to the prompt stage", function () {
  var rng = seeded(6);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  tap(s, "NR", rng);
  assert.strictEqual(s.current.stage, "prompt");
});

test("prompted correct -> same photo, new SD, BT may prompt again or fade", function () {
  var rng = seeded(7);
  var s = E.createSession(["kitchen", "park"], P, rng);
  var loc = s.current.loc, photo = s.current.photoIdx;
  tap(s, "F:C", rng);
  assert.strictEqual(s.current.stage, "followup");
  assert.strictEqual(s.current.loc, loc);
  assert.strictEqual(s.current.photoIdx, photo);
  assert.ok(E.sdsForPhoto(P[loc][photo]).indexOf(s.current.sd) !== -1);
  assert.strictEqual(E.canMark(s), true); // unprompted is allowed (fade)
});

test("errorless intro: Full–C, Full–C, Partial–C, Correct = 4 trials on one target", function () {
  var rng = seeded(8);
  var s = E.createSession(["kitchen", "bedroom"], P, rng, "errorless");
  var loc = s.current.loc;
  run(s, ["F:C", "F:C", "P:C", "C"], rng);
  assert.deepStrictEqual(labels(s), ["Full Echoic – Correct", "Full Echoic – Correct", "Partial Echoic – Correct", "Correct"]);
  s.trials.forEach(function (t) { assert.strictEqual(t.target, loc); });
  assert.strictEqual(s.current.stage, "initial");
});

test("error correction: Incorrect, Full–C, Correct = 3 trials, then a new target", function () {
  var rng = seeded(9);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  var loc = s.current.loc;
  run(s, ["I", "F:C", "C"], rng);
  assert.deepStrictEqual(labels(s), ["Incorrect", "Full Echoic – Correct", "Correct"]);
  s.trials.forEach(function (t) { assert.strictEqual(t.target, loc); });
  assert.strictEqual(s.current.stage, "initial");
});

test("follow-up error restarts prompting", function () {
  var rng = seeded(10);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  run(s, ["I", "F:C", "NR"], rng);
  assert.strictEqual(s.current.stage, "prompt");
  assert.strictEqual(s.current.promptFails, 0);
});

test("two failed prompted trials in a row move to ANOTHER target", function () {
  var rng = seeded(11);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  var loc = s.current.loc;
  run(s, ["I", "F:I"], rng);
  assert.strictEqual(s.current.stage, "prompt");
  assert.strictEqual(s.current.loc, loc);
  tap(s, "P:NR", rng);
  assert.strictEqual(s.current.stage, "initial");
  assert.notStrictEqual(s.current.loc, loc);
});

test("one failed prompt then a prompted correct does not move on", function () {
  var rng = seeded(12);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  var loc = s.current.loc;
  run(s, ["I", "F:I", "F:C"], rng);
  assert.strictEqual(s.current.stage, "followup");
  assert.strictEqual(s.current.loc, loc);
});

test("2 locations: exactly 15 trials, then complete; no 16th", function () {
  var rng = seeded(13);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  while (s.status === "active") tap(s, randomToken(s, rng), rng);
  assert.strictEqual(s.trials.length, 15);
  assert.strictEqual(E.score(s, "correct", P, rng).recorded, false);
  s.trials.forEach(function (t, i) { assert.strictEqual(t.n, i + 1); });
});

test("trial 15 ends the session mid-correction (no Trial 16)", function () {
  var rng = seeded(14);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  for (var i = 0; i < 14; i++) tap(s, "C", rng);
  tap(s, "I", rng);
  assert.strictEqual(s.status, "complete");
  assert.strictEqual(s.current, null);
  assert.strictEqual(s.trials[14].response, "Incorrect");
});

test("6 locations, all correct: distribution within 2 of each other", function () {
  for (var seed = 1; seed <= 200; seed++) {
    var rng = seeded(seed);
    var locs = ["kitchen", "bedroom", "park", "garage", "beach", "library"];
    var s = E.createSession(locs, P, rng);
    for (var i = 0; i < 15; i++) tap(s, "C", rng);
    var counts = locs.map(function (id) { return s.trials.filter(function (t) { return t.target === id; }).length; });
    assert.ok(Math.max.apply(null, counts) - Math.min.apply(null, counts) <= 2, String(counts));
  }
});

test("distribution is usually 3,3,3,2,2,2 but not forced", function () {
  var exact = 0, uneven = 0;
  for (var seed = 1; seed <= 500; seed++) {
    var rng = seeded(seed);
    var locs = ["kitchen", "bedroom", "park", "garage", "beach", "library"];
    var s = E.createSession(locs, P, rng);
    for (var i = 0; i < 15; i++) tap(s, "C", rng);
    var c = locs.map(function (id) { return s.trials.filter(function (t) { return t.target === id; }).length; }).sort().join("");
    if (c === "222333") exact++; else uneven++;
  }
  assert.ok(exact > 250 && uneven > 0, exact + "/" + uneven);
});

test("same location can appear consecutively; same photo can repeat", function () {
  var loc = false, photo = false;
  for (var seed = 1; seed <= 300 && !(loc && photo); seed++) {
    var rng = seeded(seed);
    var s = E.createSession(["kitchen", "bedroom", "park"], P, rng);
    for (var i = 0; i < 15; i++) {
      tap(s, "C", rng);
      if (i && s.trials[i].target === s.trials[i - 1].target) {
        loc = true;
        if (s.trials[i].photoIdx === s.trials[i - 1].photoIdx) photo = true;
      }
    }
  }
  assert.ok(loc && photo);
});

test("3 unprompted initial corrects unlock Photo 2; another 3 unlock Photo 3", function () {
  var rng = seeded(15);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  var k = 0;
  while (s.status === "active" && k < 6) {
    var isK = s.current.loc === "kitchen";
    tap(s, "C", rng);
    if (isK) {
      k++;
      if (k === 2) assert.strictEqual(s.progress.kitchen.unlocked, 1);
      if (k === 3) assert.strictEqual(s.progress.kitchen.unlocked, 2);
      if (k === 5) assert.strictEqual(s.progress.kitchen.unlocked, 2);
      if (k === 6) assert.strictEqual(s.progress.kitchen.unlocked, 3);
    }
  }
  assert.strictEqual(k, 6);
});

test("initial error or prompted initial trial resets the streak", function () {
  ["I", "NR", "F:C", "P:C"].forEach(function (t, i) {
    var rng = seeded(16 + i);
    var s = E.createSession(["kitchen", "bedroom"], P, rng);
    var loc = s.current.loc;
    s.progress[loc].streak = 2;
    tap(s, t, rng);
    assert.strictEqual(s.progress[loc].streak, 0, t);
    assert.strictEqual(s.progress[loc].unlocked, 1);
  });
});

test("only an unprompted initial correct celebrates; prompted / follow-up never do", function () {
  var rng = seeded(21);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  assert.strictEqual(tap(s, "C", rng).celebrate, true);
  assert.strictEqual(tap(s, "F:C", rng).celebrate, false);
  assert.strictEqual(tap(s, "C", rng).celebrate, false); // follow-up correct
  var loc = s.current.loc;
  s.progress[loc].streak = 2;
  run(s, ["P:C", "C"], rng);
  assert.strictEqual(s.progress[loc].unlocked, 1);
});

test("progression counters are independent per location", function () {
  var rng = seeded(22);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  s.progress.kitchen.streak = 2;
  s.current = { loc: "bedroom", photoIdx: 0, stage: "initial", sd: "Where is this?", prompt: null, promptFails: 0 };
  tap(s, "I", rng);
  assert.strictEqual(s.progress.kitchen.streak, 2);
});

test("only unlocked photos are selected", function () {
  for (var seed = 1; seed <= 100; seed++) {
    var rng = seeded(seed);
    var s = E.createSession(["kitchen", "bedroom", "park"], P, rng);
    while (s.status === "active") {
      assert.ok(s.current.photoIdx < s.progress[s.current.loc].unlocked);
      tap(s, randomToken(s, rng), rng);
    }
  }
});

test("undo restores everything (incl. prompt stage) and only one level", function () {
  var rng = seeded(23);
  var s = E.createSession(["kitchen", "bedroom", "park"], P, rng);
  run(s, ["C", "I"], rng);
  var before = JSON.stringify(Object.assign({}, s, { undo: null }));
  E.selectPrompt(s, "full");
  E.score(s, "incorrect", P, rng);
  s = E.undo(s);
  var restored = JSON.parse(JSON.stringify(s)); restored.undo = null;
  restored.current.prompt = null; // the selection made just before scoring is restored too
  assert.strictEqual(JSON.stringify(restored), before);
  assert.strictEqual(s.current.stage, "prompt");
  assert.strictEqual(E.canUndo(s), false);
});

test("undo reverses a photo unlock and a move-on", function () {
  var rng = seeded(24);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  s.current = { loc: "kitchen", photoIdx: 0, stage: "initial", sd: "Where is this?", prompt: null, promptFails: 0 };
  s.progress.kitchen.streak = 2;
  tap(s, "C", rng);
  assert.strictEqual(s.progress.kitchen.unlocked, 2);
  s = E.undo(s);
  assert.strictEqual(s.progress.kitchen.unlocked, 1);
  run(s, ["I", "F:I", "F:I"], rng);
  assert.notStrictEqual(s.current.loc, "kitchen");
  s = E.undo(s);
  assert.strictEqual(s.current.loc, "kitchen");
  assert.strictEqual(s.current.promptFails, 1);
});

test("undo unavailable after trial 15", function () {
  var rng = seeded(25);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  for (var i = 0; i < 15; i++) tap(s, "C", rng);
  assert.strictEqual(E.canUndo(s), false);
});

test("pause blocks scoring, prompt selection and undo; resume returns to the same opportunity", function () {
  var rng = seeded(26);
  var s = E.createSession(["kitchen", "bedroom"], P, rng);
  tap(s, "I", rng);
  E.selectPrompt(s, "partial");
  var cur = JSON.stringify(s.current);
  E.pause(s);
  assert.strictEqual(E.score(s, "correct", P, rng).recorded, false);
  E.selectPrompt(s, "full");
  assert.strictEqual(s.current.prompt, "partial");
  assert.strictEqual(E.canUndo(s), false);
  E.resume(s);
  assert.strictEqual(JSON.stringify(s.current), cur);
});

test("session survives JSON round-trip (refresh recovery), including a selected prompt", function () {
  var rng = seeded(27);
  var s = E.createSession(["kitchen", "bedroom", "park"], P, rng);
  run(s, ["C", "I"], rng);
  E.selectPrompt(s, "full");
  var restored = JSON.parse(JSON.stringify(s));
  assert.deepStrictEqual(restored, s);
  E.score(restored, "correct", P, rng);
  assert.strictEqual(restored.trials[2].response, "Full Echoic – Correct");
});

test("SDs respect photo people metadata", function () {
  assert.deepStrictEqual(E.sdsForPhoto({ people: "none" }), E.GENERAL_SDS);
  assert.deepStrictEqual(E.sdsForPhoto({ people: "unclear" }), E.GENERAL_SDS);
  assert.ok(E.sdsForPhoto({ people: "female" }).indexOf("Where is she?") !== -1);
  assert.ok(E.sdsForPhoto({ people: "male" }).indexOf("Where is he?") !== -1);
  assert.ok(E.sdsForPhoto({ people: "group" }).indexOf("Where are they?") !== -1);
  for (var seed = 1; seed <= 100; seed++) {
    var rng = seeded(seed);
    var s = E.createSession(["kitchen", "park", "garage", "beach"], P, rng);
    while (s.status === "active") {
      assert.ok(E.sdsForPhoto(P[s.current.loc][s.current.photoIdx]).indexOf(s.current.sd) !== -1);
      tap(s, randomToken(s, rng), rng);
    }
  }
});

test("random fuzz: invariants hold over 2000 sessions", function () {
  for (var seed = 1; seed <= 2000; seed++) {
    var rng = seeded(seed * 31);
    var n = 2 + Math.floor(rng() * 5);
    var ids = DATA.LOCATIONS.map(function (l) { return l.id; }).sort(function () { return rng() - 0.5; }).slice(0, n);
    var s = E.createSession(ids, P, rng, rng() < 0.5 ? "errorless" : "correction");
    var steps = 0;
    while (s.status === "active") {
      if (rng() < 0.1 && E.canUndo(s)) { s = E.undo(s); continue; }
      // occasionally try to mark without a prompt in the prompt stage: must be refused
      if (s.current.stage === "prompt" && !s.current.prompt && rng() < 0.2) {
        var before = s.trials.length;
        assert.strictEqual(E.score(s, "correct", P, rng).recorded, false);
        assert.strictEqual(s.trials.length, before);
      }
      tap(s, randomToken(s, rng), rng);
      if (++steps > 300) throw new Error("runaway");
      if (s.status === "active") {
        assert.ok(s.current.promptFails < E.MAX_PROMPT_FAILS);
        assert.strictEqual(s.current.prompt, null);
        assert.ok(ids.indexOf(s.current.loc) !== -1);
      }
    }
    assert.strictEqual(s.trials.length, 15);
    for (var i = 1; i < 15; i++) {
      var a = s.trials[i - 1], b = s.trials[i];
      if (!a.prompt && a.code !== "correct") { assert.strictEqual(b.stage, "prompt"); assert.ok(b.prompt); assert.strictEqual(b.target, a.target); }
      if (!a.prompt && a.code === "correct") assert.strictEqual(b.stage, "initial");
      if (a.prompt && a.code === "correct") { assert.strictEqual(b.stage, "followup"); assert.strictEqual(b.target, a.target); }
      if (b.stage === "prompt") assert.ok(b.prompt, "prompt stage trials always carry a prompt");
    }
  }
});

console.log("\n" + passed + " tests passed" + (process.exitCode ? " (with failures)" : ""));
