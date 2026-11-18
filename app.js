/*
 * Locations – Expressive Identification: UI controller.
 * All teaching logic lives in engine.js; this file renders state and saves it.
 */
(function () {
  "use strict";

  var DATA = window.LOC_DATA;
  var E = window.LocEngine;
  var STORAGE_KEY = "locations-ei-session-v1";
  var CELEBRATION_MS = 1000;
  var DOUBLE_TAP_GUARD_MS = 350; // ignores an accidental second tap on the same press

  var MESSAGES = ["AWESOME!", "YOU DID IT!", "AMAZING!", "WAY TO GO!", "FANTASTIC!",
    "NICE WORK!", "EXCELLENT!", "WOOHOO!", "SUPERSTAR!", "YOU GOT IT!"];
  var CONFETTI_COLORS = ["#ff4d6d", "#ffbe0b", "#3a86ff", "#06d6a0", "#8338ec", "#fb5607", "#00bbf9"];

  var STAGE_TAGS = {
    initial: "New target",
    followup: "Same target",
    prompt: "Prompt"
  };
  var PROMPT_NAMES = { full: "Full Echoic", partial: "Partial Echoic" };

  var NAME_BY_ID = {};
  DATA.LOCATIONS.forEach(function (l) { NAME_BY_ID[l.id] = l.name; });

  var MODE_NAMES = { errorless: "Errorless Learning", correction: "Error Correction" };

  var session = null;
  var selected = [];
  var selectedMode = null;
  var missingByLoc = {}; // id -> [photo numbers missing]
  var busy = false;
  var lastTapAt = 0;
  var lastMessage = null;

  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- Storage ---------------- */
  function save() {
    try {
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* storage unavailable (e.g. private mode quota) – keep running */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !Array.isArray(s.trials)) return null;
      if (s.schema !== 3) {
        // Older saved session: keep its trials, continue on the same photo.
        s.schema = 3;
        if (s.current) {
          if (s.current.stage !== "initial") s.current.stage = "followup";
          if (!s.current.sd) s.current.sd = "Where is this?";
          s.current.prompt = null;
          s.current.promptFails = 0;
        }
        delete s.beforePrompt;
      }
      return s;
    } catch (e) { return null; }
  }

  /* ---------------- Screens ---------------- */
  function show(name) {
    ["setup", "teach", "results"].forEach(function (n) {
      $("screen-" + n).hidden = n !== name;
    });
  }

  /* ---------------- Setup ---------------- */
  function buildSetup() {
    var list = $("location-list");
    list.innerHTML = "";
    DATA.LOCATIONS.forEach(function (loc) {
      var li = document.createElement("li");
      var label = document.createElement("label");
      label.id = "lbl-" + loc.id;
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = loc.id;
      cb.id = "cb-" + loc.id;
      cb.addEventListener("change", onToggleLocation);
      var span = document.createElement("span");
      span.textContent = loc.name;
      label.appendChild(cb);
      label.appendChild(span);
      li.appendChild(label);
      list.appendChild(li);
    });
    renderSetup();
  }

  function onToggleLocation(e) {
    var id = e.target.value;
    if (e.target.checked) {
      if (selected.length >= E.MAX_SELECT) { e.target.checked = false; return; }
      selected.push(id);
    } else {
      selected = selected.filter(function (x) { return x !== id; });
    }
    renderSetup();
  }

  function renderSetup() {
    var full = selected.length >= E.MAX_SELECT;
    DATA.LOCATIONS.forEach(function (loc) {
      var cb = $("cb-" + loc.id);
      var label = $("lbl-" + loc.id);
      var missing = missingByLoc[loc.id] && missingByLoc[loc.id].length;
      if (missing && cb.checked) {
        cb.checked = false;
        selected = selected.filter(function (x) { return x !== loc.id; });
      }
      cb.checked = selected.indexOf(loc.id) !== -1;
      cb.disabled = !!missing || (full && !cb.checked);
      label.classList.toggle("checked", cb.checked);
      label.classList.toggle("disabled", cb.disabled);
      var note = label.querySelector(".missing-note");
      if (missing && !note) {
        note = document.createElement("span");
        note.className = "missing-note";
        label.querySelector("span").appendChild(note);
      }
      if (note) note.textContent = missing ? "Photo " + missingByLoc[loc.id].join(", ") + " missing" : "";
    });
    var n = selected.length;
    var counter = $("select-counter");
    counter.textContent = n + " of " + E.MAX_SELECT + " selected";
    counter.classList.toggle("full", full);
    $("btn-start").disabled = n < E.MIN_SELECT || !selectedMode;
    ["errorless", "correction"].forEach(function (m) {
      $("mode-" + m).setAttribute("aria-checked", selectedMode === m ? "true" : "false");
    });
  }

  /* Check every photo file exists, so a location with missing images can't be taught. */
  function checkPhotos() {
    var pending = 0;
    var missingTotal = [];
    var totalPhotos = 0;
    DATA.LOCATIONS.forEach(function (loc) {
      DATA.PHOTOS[loc.id].forEach(function (p, i) {
        pending++;
        totalPhotos++;
        var img = new Image();
        img.onload = function () { done(); };
        img.onerror = function () {
          (missingByLoc[loc.id] = missingByLoc[loc.id] || []).push(i + 1);
          missingTotal.push(p.file);
          done();
        };
        img.src = p.file;
      });
    });
    function done() {
      pending--;
      if (pending > 0) return;
      Object.keys(missingByLoc).forEach(function (k) { missingByLoc[k].sort(); });
      var warn = $("photo-warning");
      if (missingTotal.length) {
        warn.hidden = false;
        warn.innerHTML = "<strong>" + missingTotal.length + " of " + totalPhotos + " photographs are missing.</strong> " +
          "Locations without all three photographs can't be selected until their files are added to the photos folder." +
          "<details><summary>Show missing files</summary><div>" +
          missingTotal.map(escapeHtml).join("<br>") + "</div></details>";
      } else {
        warn.hidden = true;
      }
      if (!$("screen-setup").hidden) renderSetup();
    }
  }

  function onPickMode(e) {
    selectedMode = e.currentTarget.getAttribute("data-mode");
    renderSetup();
  }

  function startSession() {
    if (selected.length < E.MIN_SELECT || selected.length > E.MAX_SELECT || !selectedMode) return;
    // Keep the bank's order so the selection is stable; target order is randomised by the engine.
    var ordered = DATA.LOCATIONS.map(function (l) { return l.id; })
      .filter(function (id) { return selected.indexOf(id) !== -1; });
    session = E.createSession(ordered, DATA.PHOTOS, undefined, selectedMode);
    preloadSessionPhotos();
    save();
    show("teach");
    renderTeach();
  }

  function preloadSessionPhotos() {
    if (!session) return;
    session.selected.forEach(function (id) {
      DATA.PHOTOS[id].forEach(function (p) { var img = new Image(); img.src = p.file; });
    });
  }

  /* ---------------- Teaching ---------------- */
  function renderTeach() {
    if (!session || session.status !== "active") return;
    var c = session.current;
    $("trial-counter").textContent = "Trial " + (session.trials.length + 1) + " of " + E.MAX_TRIALS;
    var mode = session.mode || "correction";
    $("mode-badge").textContent = MODE_NAMES[mode];
    $("mode-badge").className = "mode-badge " + mode;

    var photo = DATA.PHOTOS[c.loc][c.photoIdx];
    var img = $("photo");
    if (img.getAttribute("src") !== photo.file) {
      $("photo-missing").hidden = true;
      img.setAttribute("src", photo.file);
    }

    var tag = $("stage-tag");
    tag.textContent = STAGE_TAGS[c.stage] || STAGE_TAGS.followup;
    tag.className = "stage-tag " + c.stage;

    // After an error the screen just says "Prompt": the BT picks a prompt type,
    // then marks Correct / Incorrect / No Response.
    var mustPrompt = c.stage === "prompt";
    $("sd-box").hidden = mustPrompt;
    $("instruction-box").hidden = !mustPrompt;
    $("sd-text").textContent = "\u201C" + c.sd + "\u201D";
    $("prompt-chosen").hidden = !c.prompt;
    $("prompt-chosen").textContent = c.prompt ? PROMPT_NAMES[c.prompt] + " selected \u2013 now mark the response" : "";
    $("instruction-sub").textContent = c.prompt
      ? PROMPT_NAMES[c.prompt] + " selected \u2013 now mark the response."
      : "Choose Full Echoic or Partial Echoic.";
    $("score-buttons").classList.toggle("need-prompt", mustPrompt && !c.prompt);

    var disabled = session.paused || busy;
    var canMark = E.canMark(session);
    ["btn-correct", "btn-incorrect", "btn-noresp"].forEach(function (id) {
      $(id).disabled = disabled || !canMark;
    });
    $("btn-prompt").disabled = disabled;
    $("btn-prompt-partial").disabled = disabled;
    $("btn-prompt").setAttribute("aria-pressed", c.prompt === "full" ? "true" : "false");
    $("btn-prompt-partial").setAttribute("aria-pressed", c.prompt === "partial" ? "true" : "false");
    $("btn-answer").disabled = busy || session.paused;
    $("btn-undo").disabled = busy || !E.canUndo(session);
    $("btn-pause").disabled = busy || session.paused;
    $("btn-startover").disabled = busy;
    $("paused-overlay").hidden = !session.paused;
  }

  /* Select / clear a prompt type. Records nothing; the outcome tap records the trial. */
  function onPromptSelect(e) {
    if (busy || !E.canScore(session)) return;
    E.selectPrompt(session, e.currentTarget.getAttribute("data-prompt"));
    save();
    renderTeach();
  }

  function onScore(e) {
    var btn = e.currentTarget;
    var now = Date.now();
    if (busy || now - lastTapAt < DOUBLE_TAP_GUARD_MS) return;
    if (!E.canMark(session)) return;
    lastTapAt = now;

    var result = E.score(session, btn.getAttribute("data-response"), DATA.PHOTOS);
    if (!result.recorded) return;
    session = result.session;
    save();

    if (result.celebrate) {
      celebrate(function () {
        if (result.complete) showResults();
        else renderTeach();
      });
    } else if (result.complete) {
      showResults();
    } else {
      renderTeach();
    }
  }

  function celebrate(after) {
    busy = true;
    ["btn-correct", "btn-incorrect", "btn-noresp", "btn-prompt", "btn-prompt-partial", "btn-undo", "btn-pause", "btn-startover", "btn-answer"]
      .forEach(function (id) { $(id).disabled = true; });

    var choices = MESSAGES.filter(function (m) { return m !== lastMessage; });
    var msg = choices[Math.floor(Math.random() * choices.length)];
    lastMessage = msg;
    $("celebrate-text").textContent = msg;

    var conf = $("confetti");
    conf.innerHTML = "";
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 80; i++) {
      var p = document.createElement("i");
      var size = 8 + Math.random() * 10;
      p.style.left = (Math.random() * 100) + "%";
      p.style.width = size + "px";
      p.style.height = (size * 1.5) + "px";
      p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      p.style.setProperty("--dx", ((Math.random() - 0.5) * 240) + "px");
      p.style.setProperty("--rot", ((Math.random() - 0.5) * 1440) + "deg");
      p.style.setProperty("--d", (0.75 + Math.random() * 0.3) + "s");
      p.style.setProperty("--delay", (Math.random() * 0.15) + "s");
      if (i % 3 === 0) p.style.borderRadius = "50%";
      frag.appendChild(p);
    }
    conf.appendChild(frag);

    var overlay = $("celebration");
    // restart the text animation
    var text = $("celebrate-text");
    text.style.animation = "none";
    void text.offsetWidth;
    text.style.animation = "";
    overlay.hidden = false;

    setTimeout(function () {
      overlay.hidden = true;
      conf.innerHTML = "";
      busy = false;
      after();
    }, CELEBRATION_MS);
  }

  function onUndo() {
    if (busy || !E.canUndo(session)) return;
    session = E.undo(session);
    save();
    renderTeach();
  }

  function onPause() {
    if (!session || session.status !== "active" || busy) return;
    E.pause(session);
    save();
    renderTeach();
  }

  function onResume() {
    if (!session || session.status !== "active") return;
    E.resume(session);
    save();
    renderTeach();
  }

  function autoPause() {
    hideAnswer();
    if (session && session.status === "active" && !session.paused) {
      E.pause(session);
      save();
      if (!busy) renderTeach();
      else $("paused-overlay").hidden = false;
    }
  }

  /* ---------------- Show Answer (BT reference, records nothing) ---------------- */
  function onShowAnswer() {
    if (busy || !session || session.status !== "active" || session.paused) return;
    var id = session.current.loc;
    var name = NAME_BY_ID[id];
    var extra = (DATA.ACCEPTED && DATA.ACCEPTED[id]) || [];
    $("answer-name").textContent = name;
    $("answer-accept").textContent = extra.length ? "Also accept: " + extra.join(", ") : "";
    $("answer-accept").hidden = !extra.length;
    $("answer-example").textContent = name.toLowerCase();
    var note = (DATA.NOTES && DATA.NOTES[id]) || "";
    $("answer-bt-note").textContent = note;
    $("answer-bt-note").hidden = !note;
    $("answer-overlay").hidden = false;
  }
  function hideAnswer() {
    $("answer-overlay").hidden = true;
    $("answer-name").textContent = "";
    $("answer-example").textContent = "";
  }

  /* ---------------- Start Over ---------------- */
  function onStartOver() {
    if (busy) return;
    $("confirm-overlay").hidden = false;
  }
  function onCancelStartOver() { $("confirm-overlay").hidden = true; }
  function onConfirmStartOver() {
    $("confirm-overlay").hidden = true;
    session = null;
    save();
    resetSetup();
  }

  function resetSetup() {
    selected = [];
    selectedMode = null;
    show("setup");
    renderSetup();
    window.scrollTo(0, 0);
  }

  /* ---------------- Results ---------------- */
  function showResults() {
    $("results-mode").textContent = "Mode: " + MODE_NAMES[session.mode || "correction"];
    var tbody = $("results-rows");
    tbody.innerHTML = "";
    session.trials.forEach(function (t) {
      var tr = document.createElement("tr");
      [t.n, NAME_BY_ID[t.target] || t.target, t.response].forEach(function (v) {
        var td = document.createElement("td");
        td.textContent = v;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    $("chk-logbook").checked = false;
    $("btn-new").disabled = true;
    show("results");
    window.scrollTo(0, 0);
  }

  function onNewSession() {
    if (!$("chk-logbook").checked) return;
    session = null; // clears trial history and photograph progression
    save();
    resetSetup();
  }

  /* ---------------- Helpers ---------------- */
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------------- Init ---------------- */
  function init() {
    buildSetup();

    $("btn-start").addEventListener("click", startSession);
    $("mode-errorless").addEventListener("click", onPickMode);
    $("mode-correction").addEventListener("click", onPickMode);
    ["btn-correct", "btn-incorrect", "btn-noresp"].forEach(function (id) {
      $(id).addEventListener("click", onScore);
    });
    $("btn-prompt").addEventListener("click", onPromptSelect);
    $("btn-prompt-partial").addEventListener("click", onPromptSelect);
    $("btn-undo").addEventListener("click", onUndo);

    $("btn-answer").addEventListener("click", onShowAnswer);
    $("answer-overlay").addEventListener("click", hideAnswer);
    $("btn-pause").addEventListener("click", onPause);
    $("btn-resume").addEventListener("click", onResume);
    $("btn-startover").addEventListener("click", onStartOver);
    $("btn-cancel").addEventListener("click", onCancelStartOver);
    $("btn-confirm-startover").addEventListener("click", onConfirmStartOver);
    $("chk-logbook").addEventListener("change", function (e) { $("btn-new").disabled = !e.target.checked; });
    $("btn-new").addEventListener("click", onNewSession);
    $("photo").addEventListener("error", function () { $("photo-missing").hidden = false; });
    $("photo").addEventListener("load", function () { $("photo-missing").hidden = true; });
    $("photo").addEventListener("contextmenu", function (e) { e.preventDefault(); });

    // Automatic pause when Safari is backgrounded, the app is switched or the iPad locks.
    document.addEventListener("visibilitychange", function () { if (document.hidden) autoPause(); });
    window.addEventListener("pagehide", autoPause);

    session = load();
    if (session && session.status === "active") {
      // Restored after a refresh/close: always come back paused, showing Resume Session.
      session.paused = true;
      save();
      preloadSessionPhotos();
      show("teach");
      renderTeach();
    } else if (session && session.status === "complete") {
      showResults();
    } else {
      session = null;
      show("setup");
    }

    checkPhotos();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(function () {});
    }
  }

  init();
})();
