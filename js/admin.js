/* =====================================================
   Student Care - অ্যাডমিন প্যানেলের স্ক্রিপ্ট
   পরিবর্তনগুলো এই ব্রাউজারের localStorage-এ "draft" হিসেবে জমা হয়।
   চূড়ান্তভাবে ওয়েবসাইটে দেখাতে "data.js ডাউনলোড" করে GitHub-এ আপলোড করতে হবে।
   ===================================================== */
(function () {
  "use strict";

  var DRAFT_KEY = "sc_draft";
  var SESSION_KEY = "sc_admin_session";
  var BN = "০১২৩৪৫৬৭৮৯";

  var base = JSON.parse(JSON.stringify(window.SITE_DATA || {}));
  var draft = loadDraft();
  var currentTab = "dashboard";
  var currentList = null;
  var editIndex = -1;
  var toastTimer = null;

  /* ---------- ছোট সহায়ক ---------- */
  function $(id) { return document.getElementById(id); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function toBn(n) {
    return String(n).replace(/\d/g, function (d) { return BN.charAt(Number(d)); });
  }

  function getPath(obj, path) {
    return path.split(".").reduce(function (a, k) { return a == null ? undefined : a[k]; }, obj);
  }

  function setPath(obj, path, value) {
    var parts = path.split(".");
    var last = parts.pop();
    var target = parts.reduce(function (a, k) {
      if (a[k] == null) a[k] = {};
      return a[k];
    }, obj);
    target[last] = value;
  }

  function toast(msg, isError) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast show" + (isError ? " error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast"; }, 2600);
  }

  /* ---------- তালিকার কনফিগারেশন ---------- */
  var ICON_OPTIONS = [
    ["users", "দলগত ব্যাচ"],
    ["check", "যাচাই ও পরীক্ষা"],
    ["clock", "সময়ানুবর্তিতা"],
    ["book", "সহজ পাঠ"],
    ["award", "মেধার স্বীকৃতি"],
    ["heart", "ব্যক্তিগত যত্ন"]
  ];

  var TABS = {
    dashboard: { panel: "dashboard", title: "ড্যাশবোর্ড" },
    center: { panel: "center", title: "সেন্টারের তথ্য ও যোগাযোগ" },
    home: { panel: "home", title: "হোম পেজের লেখা" },
    teachers: { panel: "list", list: "teachers", title: "শিক্ষক" },
    courses: { panel: "list", list: "courses", title: "কোর্স" },
    features: { panel: "list", list: "features", title: "সুবিধাসমূহ" },
    stats: { panel: "list", list: "stats", title: "পরিসংখ্যান" },
    quotes: { panel: "list", list: "quotes", title: "অনুপ্রেরণার বাক্য" },
    security: { panel: "security", title: "নিরাপত্তা" }
  };

  var LISTS = {
    teachers: {
      single: "শিক্ষক",
      fields: [
        { k: "name", l: "নাম", req: true },
        { k: "subject", l: "বিষয়" },
        { k: "qualification", l: "শিক্ষাগত যোগ্যতা" },
        { k: "experience", l: "অভিজ্ঞতা (যেমন: ৫ বছর)" },
        { k: "photo", l: "ছবি", t: "image" },
        { k: "bio", l: "সংক্ষিপ্ত পরিচিতি", t: "textarea" }
      ],
      label: function (x) { return x.name || ""; },
      sub: function (x) { return x.subject || ""; },
      thumb: true
    },
    courses: {
      single: "কোর্স",
      fields: [
        { k: "title", l: "কোর্সের নাম", req: true },
        { k: "level", l: "শ্রেণি" },
        { k: "duration", l: "সময়কাল (যেমন: ১০ মাস)" },
        { k: "note", l: "বিবরণ", t: "textarea" }
      ],
      label: function (x) { return x.title || ""; },
      sub: function (x) { return x.level || ""; }
    },
    features: {
      single: "সুবিধা",
      fields: [
        { k: "icon", l: "আইকন", t: "select", opts: ICON_OPTIONS },
        { k: "title", l: "শিরোনাম", req: true },
        { k: "text", l: "বিবরণ", t: "textarea" }
      ],
      label: function (x) { return x.title || ""; },
      sub: function (x) { return x.text || ""; }
    },
    stats: {
      single: "পরিসংখ্যান",
      fields: [
        { k: "value", l: "সংখ্যা", t: "number", req: true },
        { k: "suffix", l: "চিহ্ন (যেমন + বা %)" },
        { k: "label", l: "লেবেল", req: true }
      ],
      label: function (x) { return x.label || ""; },
      sub: function (x) { return toBn(x.value || 0) + (x.suffix || ""); }
    },
    quotes: {
      single: "বাক্য",
      fields: [
        { k: "text", l: "অনুপ্রেরণার বাক্য", t: "textarea", req: true }
      ],
      label: function (x) { return x.text || ""; },
      sub: function () { return ""; }
    }
  };

  /* ---------- ডাটা লোড ও সেভ ---------- */
  function loadDraft() {
    try {
      var d = JSON.parse(localStorage.getItem(DRAFT_KEY));
      if (d && typeof d === "object") return d;
    } catch (e) { /* ignore */ }
    return clone(base);
  }

  function saveDraft(msg) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      $("draftStatus").textContent = "সংরক্ষিত: " + new Date().toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });
      toast(msg || "সংরক্ষণ হয়েছে");
    } catch (e) {
      toast("সংরক্ষণ করা যায়নি। ছবির আকার হয়তো অনেক বড়। ছোট ছবি ব্যবহার করুন।", true);
    }
    updateDashboard();
  }

  function hasUnpublished() {
    return JSON.stringify(draft) !== JSON.stringify(base);
  }

  function updateDashboard() {
    function card(n, label) {
      return '<div class="kpi"><b>' + toBn(n) + "</b><span>" + label + "</span></div>";
    }
    $("dashCards").innerHTML =
      card((draft.teachers || []).length, "শিক্ষক") +
      card((draft.courses || []).length, "কোর্স") +
      card((draft.features || []).length, "সুবিধা") +
      '<div class="kpi"><b>' + (hasUnpublished() ? "আছে" : "নেই") + "</b><span>অপ্রকাশিত পরিবর্তন</span></div>";
  }

  /* ---------- পাসওয়ার্ড ও লগইন ---------- */
  async function sha256(text) {
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function currentHash() {
    return draft.adminPasswordHash || base.adminPasswordHash || "";
  }

  function showAuth(mode) {
    $("authScreen").hidden = false;
    $("app").hidden = true;
    $("setupForm").hidden = mode !== "setup";
    $("loginForm").hidden = mode !== "login";
  }

  function showApp() {
    $("authScreen").hidden = true;
    $("app").hidden = false;
    showTab(currentTab);
  }

  /* ---------- ট্যাব ---------- */
  function showTab(name) {
    var t = TABS[name];
    if (!t) return;
    currentTab = name;
    currentList = t.list || null;
    closeItemForm();

    $$("#sideNav button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-tab") === name);
    });
    $$("[data-panel]").forEach(function (p) {
      p.hidden = p.getAttribute("data-panel") !== t.panel;
    });

    if (t.panel === "center") fillForm($("centerForm"));
    if (t.panel === "home") fillForm($("homeForm"));
    if (t.panel === "dashboard") updateDashboard();
    if (t.panel === "list") renderList();
    else $("pageTitle").textContent = t.title;
  }

  /* ---------- ফর্ম (data-path ভিত্তিক) ---------- */
  function fillForm(form) {
    form.querySelectorAll("[data-path]").forEach(function (el) {
      var v = getPath(draft, el.getAttribute("data-path"));
      el.value = v == null ? "" : v;
    });
  }

  function bindSaveForm(form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.querySelectorAll("[data-path]").forEach(function (el) {
        setPath(draft, el.getAttribute("data-path"), el.value.trim());
      });
      saveDraft("তথ্য সংরক্ষণ হয়েছে");
    });
  }

  /* ---------- তালিকা রেন্ডার ---------- */
  function renderList() {
    var cfg = LISTS[currentList];
    if (!cfg) return;
    var items = draft[currentList] || [];
    $("pageTitle").textContent = TABS[currentTab].title + " (" + toBn(items.length) + ")";

    $("listItems").innerHTML = items.length
      ? items.map(function (it, i) {
          var thumb = cfg.thumb && it.photo ? '<img class="thumb" src="' + esc(it.photo) + '" alt="">' : "";
          return '<div class="item"><div class="item-main">' + thumb +
            "<div><strong>" + esc(cfg.label(it)) + "</strong><small>" + esc(cfg.sub(it)) + "</small></div></div>" +
            '<div class="item-actions">' +
            '<button class="btn ghost small" type="button" data-act="edit" data-i="' + i + '">সম্পাদনা</button>' +
            '<button class="btn danger small" type="button" data-act="del" data-i="' + i + '">মুছুন</button>' +
            "</div></div>";
        }).join("")
      : '<p class="empty">এখনো কিছু যোগ করা হয়নি। “নতুন যোগ করুন” চাপুন।</p>';
  }

  function closeItemForm() {
    var f = $("itemForm");
    f.hidden = true;
    f.innerHTML = "";
    f.onsubmit = null;
    editIndex = -1;
  }

  function setImage(form, val) {
    var hidden = form.querySelector('input[type="hidden"]');
    var preview = $("imgPreview");
    if (hidden) hidden.value = val;
    if (preview) {
      if (val) { preview.src = val; preview.hidden = false; }
      else { preview.hidden = true; }
    }
  }

  function resizeImage(file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 500;
        var s = Math.min(1, max / Math.max(img.width, img.height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * s);
        canvas.height = Math.round(img.height * s);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        cb(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function openItemForm(i) {
    var cfg = LISTS[currentList];
    var form = $("itemForm");
    var item = i >= 0 ? clone(draft[currentList][i]) : {};
    editIndex = i;

    var html = "<h2>" + (i >= 0 ? cfg.single + " সম্পাদনা" : "নতুন " + cfg.single + " যোগ করুন") + "</h2>" +
      '<div class="grid-form">';

    cfg.fields.forEach(function (f) {
      var v = item[f.k] == null ? "" : item[f.k];
      var req = f.req ? " required" : "";
      var wrap = "";
      var control;

      if (f.t === "textarea") {
        wrap = " full";
        control = '<textarea name="' + f.k + '" rows="3"' + req + ">" + esc(v) + "</textarea>";
      } else if (f.t === "select") {
        control = '<select name="' + f.k + '">' + (f.opts || []).map(function (o) {
          return '<option value="' + o[0] + '"' + (o[0] === v ? " selected" : "") + ">" + esc(o[1]) + "</option>";
        }).join("") + "</select>";
      } else if (f.t === "image") {
        wrap = " full";
        var isData = String(v).indexOf("data:") === 0;
        control = '<div class="img-field">' +
          '<img id="imgPreview" alt=""' + (v ? ' src="' + esc(v) + '"' : " hidden") + ">" +
          '<input type="hidden" name="' + f.k + '" value="' + esc(v) + '">' +
          '<input type="file" id="imgFile" accept="image/*">' +
          '<input type="text" id="imgPath" placeholder="অথবা ছবির পথ লিখুন, যেমন: images/teacher-1.jpg" value="' + esc(isData ? "" : v) + '">' +
          "</div>";
      } else {
        control = '<input type="' + (f.t === "number" ? "number" : "text") + '" name="' + f.k + '" value="' + esc(v) + '"' + req + ">";
      }

      html += '<label class="fld' + wrap + '">' + esc(f.l) + control + "</label>";
    });

    html += "</div>" +
      '<div class="form-actions"><button class="btn primary" type="submit">সংরক্ষণ করুন</button>' +
      '<button class="btn ghost" type="button" id="cancelItem">বাতিল</button></div>';

    form.innerHTML = html;
    form.hidden = false;
    form.onsubmit = onItemSubmit;
    $("cancelItem").addEventListener("click", closeItemForm);

    var file = $("imgFile");
    if (file) {
      file.addEventListener("change", function () {
        if (!file.files || !file.files[0]) return;
        resizeImage(file.files[0], function (dataUrl) {
          setImage(form, dataUrl);
          $("imgPath").value = "";
        });
      });
      $("imgPath").addEventListener("input", function () {
        setImage(form, $("imgPath").value.trim());
      });
    }

    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onItemSubmit(e) {
    e.preventDefault();
    var cfg = LISTS[currentList];
    var form = $("itemForm");
    var obj = {};

    for (var k = 0; k < cfg.fields.length; k++) {
      var f = cfg.fields[k];
      var el = form.querySelector('[name="' + f.k + '"]');
      var v = el ? el.value : "";
      obj[f.k] = f.t === "number" ? (Number(v) || 0) : String(v).trim();
      if (f.req && (obj[f.k] === "" || obj[f.k] == null)) {
        toast(f.l + " লেখা প্রয়োজন।", true);
        return;
      }
    }

    if (!draft[currentList]) draft[currentList] = [];
    if (editIndex < 0) draft[currentList].push(obj);
    else draft[currentList][editIndex] = obj;

    saveDraft("সংরক্ষণ হয়েছে");
    closeItemForm();
    renderList();
  }

  /* ---------- ইভেন্ট বাইন্ডিং ---------- */
  function bindEvents() {
    $("sideNav").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b) showTab(b.getAttribute("data-tab"));
    });

    $("logoutBtn").addEventListener("click", function () {
      sessionStorage.removeItem(SESSION_KEY);
      location.reload();
    });

    $("loginForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      var ok = (await sha256($("loginPass").value)) === currentHash();
      if (ok) {
        sessionStorage.setItem(SESSION_KEY, "1");
        $("loginPass").value = "";
        $("loginErr").textContent = "";
        showApp();
      } else {
        $("loginErr").textContent = "পাসওয়ার্ড সঠিক নয়। আবার চেষ্টা করুন।";
      }
    });

    $("setupForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      var a = $("setupPass").value;
      var b = $("setupPass2").value;
      if (a.length < 6) {
        $("setupErr").textContent = "কমপক্ষে ৬ অক্ষর দিন।";
        return;
      }
      if (a !== b) {
        $("setupErr").textContent = "দুটি পাসওয়ার্ড মিলছে না।";
        return;
      }
      draft.adminPasswordHash = await sha256(a);
      sessionStorage.setItem(SESSION_KEY, "1");
      saveDraft("পাসওয়ার্ড সেট হয়েছে");
      showApp();
    });

    $("passForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      var a = $("newPass").value;
      var b = $("newPass2").value;
      if (a.length < 6) { toast("কমপক্ষে ৬ অক্ষর দিন।", true); return; }
      if (a !== b) { toast("দুটি পাসওয়ার্ড মিলছে না।", true); return; }
      draft.adminPasswordHash = await sha256(a);
      saveDraft("নতুন পাসওয়ার্ড সেট হয়েছে। data.js ডাউনলোড করে প্রকাশ করুন।");
      $("passForm").reset();
    });

    bindSaveForm($("centerForm"));
    bindSaveForm($("homeForm"));

    $("addItemBtn").addEventListener("click", function () { openItemForm(-1); });

    $("listItems").addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-act]");
      if (!btn) return;
      var i = Number(btn.getAttribute("data-i"));
      if (btn.getAttribute("data-act") === "edit") {
        openItemForm(i);
      } else if (btn.getAttribute("data-act") === "del") {
        if (!confirm("এটি মুছে ফেলতে চান?")) return;
        draft[currentList].splice(i, 1);
        saveDraft("মুছে ফেলা হয়েছে");
        renderList();
      }
    });

    $("exportBtn").addEventListener("click", function () {
      var content = "/* Student Care - আপডেট করা তথ্য (অ্যাডমিন প্যানেল থেকে তৈরি) */\n" +
        "window.SITE_DATA = " + JSON.stringify(draft, null, 2) + ";\n";
      var blob = new Blob([content], { type: "text/javascript;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "data.js";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      toast("data.js ডাউনলোড হয়েছে। এটি GitHub-এ js/data.js হিসেবে আপলোড করুন।");
    });

    $("resetBtn").addEventListener("click", function () {
      if (!confirm("এই ব্রাউজারের সব অপ্রকাশিত পরিবর্তন মুছে যাবে। নিশ্চিত?")) return;
      draft = clone(base);
      localStorage.removeItem(DRAFT_KEY);
      fillForm($("centerForm"));
      fillForm($("homeForm"));
      updateDashboard();
      showTab(currentTab);
      toast("প্রকাশিত তথ্যে ফিরে যাওয়া হয়েছে");
    });
  }

  /* ---------- শুরু ---------- */
  function init() {
    if (!window.crypto || !window.crypto.subtle) {
      document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">অ্যাডমিন প্যানেল চালাতে এই পেজটি HTTPS (যেমন Netlify) অথবা localhost-এ খুলুন।</p>';
      return;
    }
    bindEvents();

    var status = $("draftStatus");
    if (localStorage.getItem(DRAFT_KEY)) status.textContent = "এই ব্রাউজারে অপ্রকাশিত পরিবর্তন সংরক্ষিত আছে";

    if (sessionStorage.getItem(SESSION_KEY) === "1" && currentHash()) {
      showApp();
    } else {
      showAuth(currentHash() ? "login" : "setup");
    }
  }

  init();
})();
