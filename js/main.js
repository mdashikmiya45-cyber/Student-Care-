/* =====================================================
   Student Care - পাবলিক ওয়েবসাইটের স্ক্রিপ্ট
   ===================================================== */
(function () {
  "use strict";

  /* ---------- ডাটা লোড (প্রিভিউ মোড সহ) ---------- */
  var data = window.SITE_DATA || {};
  var isPreview = new URLSearchParams(window.location.search).get("preview") === "1";
  if (isPreview) {
    try {
      var draft = JSON.parse(localStorage.getItem("sc_draft") || "null");
      if (draft) {
        data = draft;
        showPreviewBar();
      }
    } catch (e) { /* ignore */ }
  }

  var BN = "০১২৩৪৫৬৭৮৯";
  var RING = 2 * Math.PI * 54;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- ছোট সহায়ক ফাংশন ---------- */
  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function toBn(n) {
    return String(n).replace(/\d/g, function (d) { return BN.charAt(Number(d)); });
  }

  function num(n) {
    return Number(n || 0).toLocaleString("bn-BD");
  }

  function hueOf(text) {
    var h = 0;
    for (var i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
    return h;
  }

  function initials(name) {
    return String(name || "").trim().split(/\s+/).slice(0, 2).map(function (p) { return p.charAt(0); }).join("");
  }

  var ICONS = {
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    check: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    award: '<circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || ICONS.star) + "</svg>";
  }

  function showPreviewBar() {
    var bar = document.createElement("div");
    bar.className = "preview-bar";
    bar.textContent = "প্রিভিউ মোড: এটি শুধু আপনার ব্রাউজারে দেখা যাচ্ছে। ওয়েবসাইটে দেখাতে data.js ডাউনলোড করে আপলোড করুন।";
    document.body.appendChild(bar);
  }

  /* ---------- কনটেন্ট রেন্ডার ---------- */
  function renderSite() {
    var c = data.center || {};
    var h = data.hero || {};
    var a = data.about || {};

    document.title = (c.name || "Student Care") + " | কোচিং সেন্টার";
    $("brandName").textContent = c.name || "";
    $("footerName").textContent = c.name || "";
    $("footerTagline").textContent = c.tagline || "";
    $("year").textContent = toBn(new Date().getFullYear());

    /* হিরো */
    $("heroTitle").innerHTML = String(h.title || "").split(/\s+/).filter(Boolean).map(function (w, i) {
      return '<span class="word" style="--i:' + i + '">' + esc(w) + "</span>";
    }).join(" ");
    $("heroBadge").textContent = h.badge || "";
    $("heroSub").textContent = h.subtitle || "";
    $("ctaPrimary").textContent = h.ctaPrimary || "";
    $("ctaSecondary").textContent = h.ctaSecondary || "";

    /* পরিসংখ্যান */
    $("statsGrid").innerHTML = (data.stats || []).map(function (s) {
      return '<div class="stat"><strong data-count="' + Number(s.value) + '" data-suffix="' + esc(s.suffix) + '">' +
        num(s.value) + esc(s.suffix) + "</strong><span>" + esc(s.label) + "</span></div>";
    }).join("");

    /* আমাদের কথা */
    $("aboutTitle").textContent = a.title || "";
    $("aboutText").textContent = a.text || "";
    $("featuresGrid").innerHTML = (data.features || []).map(function (f) {
      return '<article class="feature"><div class="feature-icon">' + icon(f.icon) + "</div><h3>" +
        esc(f.title) + "</h3><p>" + esc(f.text) + "</p></article>";
    }).join("");

    /* কোর্স */
    $("coursesGrid").innerHTML = (data.courses || []).map(function (course, i) {
      return '<article class="course reveal" style="--d:' + i * 90 + 'ms"><span class="chip">' + esc(course.level) +
        "</span><h3>" + esc(course.title) + "</h3><p>" + esc(course.note) +
        '</p><div class="course-foot"><span>' + esc(course.duration) +
        '</span><a href="#admission">ভর্তি হোন</a></div></article>';
    }).join("");

    /* কোর্স বাছাই ড্রপডাউন (ভর্তি ফর্ম) */
    var sel = $("courseSelect");
    (data.courses || []).forEach(function (course) {
      var opt = document.createElement("option");
      opt.value = course.title;
      opt.textContent = course.title;
      sel.appendChild(opt);
    });

    /* শিক্ষক */
    $("teachersGrid").innerHTML = (data.teachers || []).map(function (t, i) {
      var media = t.photo
        ? '<img src="' + esc(t.photo) + '" alt="' + esc(t.name) + '" loading="lazy">'
        : '<div class="avatar" style="background:hsl(' + hueOf(t.name || "") + ', 45%, 38%)">' + esc(initials(t.name)) + "</div>";
      return '<article class="teacher reveal" style="--d:' + i * 110 + 'ms">' +
        '<div class="photo">' + media + "</div>" +
        "<h3>" + esc(t.name) + '</h3><p class="subject">' + esc(t.subject) + "</p>" +
        '<ul class="meta">' +
        (t.qualification ? "<li>" + esc(t.qualification) + "</li>" : "") +
        (t.experience ? "<li>অভিজ্ঞতা: " + esc(t.experience) + "</li>" : "") +
        "</ul>" +
        (t.bio ? '<p class="bio">' + esc(t.bio) + "</p>" : "") +
        "</article>";
    }).join("");

    /* ঠিকানা ও যোগাযোগ */
    $("addrText").textContent = c.address || "";
    var phoneDigits = String(c.phone || "").replace(/[^\d+]/g, "");
    $("phoneLink").textContent = c.phone || "নম্বর যোগ করা হয়নি";
    $("phoneLink").href = phoneDigits ? "tel:" + phoneDigits : "#location";
    $("emailLink").textContent = c.email || "ইমেইল যোগ করা হয়নি";
    $("emailLink").href = c.email ? "mailto:" + c.email : "#location";
    $("hoursText").textContent = c.hours || "";

    var mapQ = c.mapQuery || c.address;
    if (mapQ) $("mapFrame").src = "https://www.google.com/maps?q=" + encodeURIComponent(mapQ) + "&output=embed";

    var waNum = String(c.whatsapp || "").replace(/\D/g, "");
    if (waNum) {
      $("waFloat").href = "https://wa.me/" + waNum;
      $("waFloat").hidden = false;
    }

    /* আইকন বসানো */
    document.querySelectorAll("[data-icon]").forEach(function (el) {
      el.innerHTML = icon(el.getAttribute("data-icon"));
    });
  }

  /* ---------- কাউন্টার অ্যানিমেশন ---------- */
  function animateCount(el) {
    var target = Number(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = num(target) + suffix; return; }

    var start = null;
    var duration = 1600;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = num(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = num(0) + suffix;
    requestAnimationFrame(step);
  }

  function initCounters() {
    var grid = $("statsGrid");
    var started = false;
    function run() {
      if (started) return;
      started = true;
      grid.querySelectorAll("[data-count]").forEach(animateCount);
    }
    if (!("IntersectionObserver" in window)) return run();
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { run(); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(grid);
  }

  /* ---------- স্ক্রল রিভিল ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- নেভবার ও মোবাইল মেনু ---------- */
  function initNav() {
    var nav = $("nav");
    function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 40); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var toggle = $("menuToggle");
    var links = $("navLinks");
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- অনুপ্রেরণার বাক্য ---------- */
  function initQuotes() {
    var list = (data.quotes || []).map(function (q) { return q.text; }).filter(Boolean);
    var el = $("quote");
    if (!list.length) return;
    var idx = 0;
    el.textContent = list[0];
    if (list.length < 2 || reduceMotion) return;
    setInterval(function () {
      el.classList.add("fade-out");
      setTimeout(function () {
        idx = (idx + 1) % list.length;
        el.textContent = list[idx];
        el.classList.remove("fade-out");
      }, 400);
    }, 6000);
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 3000);
  }

  /* ---------- ফোকাস টাইমার ---------- */
  var timer = { total: 25 * 60, remaining: 25 * 60, endAt: 0, id: null, running: false, sessions: 0 };

  function pad2(n) { return toBn(String(n).padStart(2, "0")); }

  function renderTimer() {
    var m = Math.floor(timer.remaining / 60);
    var s = timer.remaining % 60;
    $("timeText").textContent = pad2(m) + ":" + pad2(s);
    $("ringFg").style.strokeDashoffset = String(RING * (1 - timer.remaining / timer.total));
    $("sessionCount").textContent = "আজকে সম্পন্ন সেশন: " + toBn(timer.sessions);
  }

  function updateToggleLabel() {
    var label = timer.running ? "থামান" : (timer.remaining === timer.total ? "শুরু করুন" : "চালিয়ে যান");
    $("timerToggle").textContent = label;
  }

  function stopTimer() {
    if (timer.id) clearInterval(timer.id);
    timer.id = null;
    timer.running = false;
  }

  function beep() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      var ctx = new AC();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) { /* শব্দ না চললেও সমস্যা নেই */ }
  }

  function tick() {
    var left = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    timer.remaining = left;
    if (left <= 0) {
      stopTimer();
      timer.sessions++;
      beep();
      toast("সেশন শেষ! একটু বিরতি নিন।");
    }
    renderTimer();
    updateToggleLabel();
  }

  function toggleTimer() {
    if (timer.running) {
      timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
      stopTimer();
    } else {
      if (timer.remaining <= 0) timer.remaining = timer.total;
      timer.endAt = Date.now() + timer.remaining * 1000;
      timer.running = true;
      timer.id = setInterval(tick, 250);
    }
    renderTimer();
    updateToggleLabel();
  }

  function resetTimer() {
    stopTimer();
    timer.remaining = timer.total;
    renderTimer();
    updateToggleLabel();
  }

  function setPreset(min) {
    stopTimer();
    timer.total = min * 60;
    timer.remaining = timer.total;
    document.querySelectorAll(".preset").forEach(function (b) {
      b.classList.toggle("active", Number(b.getAttribute("data-min")) === min);
    });
    renderTimer();
    updateToggleLabel();
  }

  function initTimer() {
    $("ringFg").style.strokeDasharray = RING.toFixed(2);
    document.querySelectorAll(".preset").forEach(function (b) {
      b.addEventListener("click", function () { setPreset(Number(b.getAttribute("data-min"))); });
    });
    $("timerToggle").addEventListener("click", toggleTimer);
    $("timerReset").addEventListener("click", resetTimer);
    renderTimer();
    updateToggleLabel();
  }

  /* ---------- আজকের পড়ার তালিকা (এই ব্রাউজারে সংরক্ষিত) ---------- */
  var TASK_KEY = "sc_tasks";
  var tasks = [];
  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

  function saveTasks() {
    try { localStorage.setItem(TASK_KEY, JSON.stringify(tasks)); } catch (e) { /* ignore */ }
  }

  function renderTasks() {
    $("taskList").innerHTML = tasks.length
      ? tasks.map(function (t, i) {
          return '<li class="task' + (t.done ? " done" : "") + '">' +
            '<button class="task-toggle" type="button" data-i="' + i + '"><span class="box">' + CHECK_SVG + "</span><span>" + esc(t.text) + "</span></button>" +
            '<button class="task-del" type="button" data-i="' + i + '" aria-label="কাজটি মুছুন">×</button></li>';
        }).join("")
      : '<li class="empty-note">আজকের কাজ যোগ করুন</li>';

    var done = tasks.filter(function (t) { return t.done; }).length;
    $("taskCount").textContent = toBn(done) + "/" + toBn(tasks.length) + " সম্পন্ন";
    $("taskBar").style.width = (tasks.length ? (done / tasks.length) * 100 : 0) + "%";
  }

  function initTasks() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(TASK_KEY)); } catch (e) { /* ignore */ }
    tasks = Array.isArray(saved) ? saved : [
      { text: "আজকের গণিতের একটি অধ্যায় পড়ুন", done: false },
      { text: "ইংরেজি শব্দ ২০টি মুখস্থ করুন", done: false },
      { text: "পুরনো প্রশ্নের ৫টি অনুশীলন করুন", done: false }
    ];
    renderTasks();

    $("taskForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = $("taskInput");
      var text = input.value.trim();
      if (!text) return;
      tasks.push({ text: text, done: false });
      input.value = "";
      saveTasks();
      renderTasks();
    });

    $("taskList").addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var i = Number(btn.getAttribute("data-i"));
      if (!tasks[i]) return;
      if (btn.classList.contains("task-toggle")) tasks[i].done = !tasks[i].done;
      if (btn.classList.contains("task-del")) tasks.splice(i, 1);
      saveTasks();
      renderTasks();
    });

    $("clearDone").addEventListener("click", function () {
      tasks = tasks.filter(function (t) { return !t.done; });
      saveTasks();
      renderTasks();
    });
  }

  /* ---------- ভর্তি ফর্ম (Netlify Forms) ---------- */
  function showFormMsg(text, ok) {
    var m = $("formMsg");
    m.textContent = text;
    m.className = "form-msg " + (ok ? "ok" : "err");
  }

  function initForm() {
    var form = $("admissionForm");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (isPreview) {
        showFormMsg("প্রিভিউ মোডে ফর্ম পাঠানো হয় না।", false);
        return;
      }
      var btn = $("submitBtn");
      var oldText = btn.textContent;
      var body = new URLSearchParams(new FormData(form)).toString();

      btn.disabled = true;
      btn.textContent = "পাঠানো হচ্ছে...";

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body
      })
        .then(function (res) {
          if (!res.ok) throw new Error("request failed");
          showFormMsg("ধন্যবাদ! আপনার আবেদন জমা হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।", true);
          form.reset();
        })
        .catch(function () {
          showFormMsg("আবেদন পাঠানো যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন, অথবা WhatsApp-এ যোগাযোগ করুন।", false);
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = oldText;
        });
    });
  }

  /* ---------- চালু করা ---------- */
  renderSite();
  initNav();
  initCounters();
  initReveal();
  initQuotes();
  initTimer();
  initTasks();
  initForm();
})();
