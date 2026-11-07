/* ============================================================================
 * DSH Apple Liquid Glass — browser half
 *
 * This file is the factory body. `scripts/build.mjs` wraps it in the
 * `window.__ModuleLoader__.load({ id, factory })` envelope used by the DSH
 * browser plugin loader, substitutes the stylesheet placeholder, and inlines
 * the bundled hello-script font.
 *
 * The material is CSS over host elements. The only React surface is the
 * plugin's Settings section; the opening splash is plain DOM so it can be
 * shown before/independently of React rendering.
 * ========================================================================== */

var CSS = "__DSLG_CSS__";

var PACKAGE_ID = "dsh-apple-liquid-glass";
var LOCALE_NS = "dsh-apple-liquid-glass";
var STORAGE_KEY = "dsh-apple-liquid-glass.settings.v1";
var SPLASH_SESSION_KEY = "dsh-apple-liquid-glass.splash-played.v1";
var DEFAULT_LEVEL = 62;
var SURFACE_KEYS = ["composer", "sidebar", "model", "send"];

var React = null;
try {
  React = require("react");
} catch (error) {
  /* Static preview / non-DSH host: the material and splash still work. */
  React = null;
}

var h = React ? React.createElement : null;
var useSyncExternalStore = React ? React.useSyncExternalStore : null;

var LEVEL_VARS = [
  "--dslg-level",
  "--dslg-blur",
  "--dslg-sat",
  "--dslg-bri",
  "--dslg-tint",
  "--dslg-border",
  "--dslg-highlight",
  "--dslg-shadow",
  "--dslg-radius",
  "--dslg-press",
];

var SURFACE_SELECTOR = [
  "[data-composer-card]",
  "[class*='_sidebarCol'] button",
  "[class*='_sidebarCol'] [role='button']",
  "[class*='_sidebarCol'] [role='treeitem']",
  "[class*='_sidebarCol'] [data-row-key]",
  "[class*='_sidebarCol'] a[href]",
  "[class*='_sidebarCol'] [class*='_searchExpanded']",
].join(",");

var PRESS_SELECTOR = [
  "[class*='_sidebarCol'] button",
  "[class*='_sidebarCol'] [role='button']",
  "[class*='_sidebarCol'] [role='treeitem']",
  "[class*='_sidebarCol'] [data-row-key]",
  "[class*='_sidebarCol'] a[href]",
  "[data-composer-card] button",
].join(",");

var LOCALES = {
  zh: {
    "settings.title": "液态玻璃",
    "settings.intro": "控制液态玻璃材质强度与开屏动效。只影响输入框、侧边栏、模型选择和发送按钮，页面背景保持不变。",
    "settings.intensity": "玻璃强度",
    "settings.intensity.description": "0% 完全恢复原生外观；拖动时立即生效，设置会自动保存。",
    "settings.presets": "快捷强度",
    "settings.preset.off": "关闭",
    "settings.preset.light": "轻",
    "settings.preset.mid": "中",
    "settings.preset.strong": "强",
    "settings.scope": "作用范围",
    "settings.scope.description": "关闭某一项，它会保持原生外观，其余部分不受影响。",
    "settings.scope.composer": "输入框卡片",
    "settings.scope.composer.hint": "输入卡片，以及卡片里的 + 与访问模式控件",
    "settings.scope.sidebar": "左侧栏控件",
    "settings.scope.sidebar.hint": "新建会话、面板行、工作区行、会话行与图标按钮",
    "settings.scope.model": "模型选择器",
    "settings.scope.model.hint": "输入框内的模型触发器",
    "settings.scope.send": "发送按钮",
    "settings.scope.send.hint": "发送与停止按钮",
    "settings.splash": "开屏动效",
    "settings.splash.description": "打开 DSH 时播放约 6 秒的 hello 书写动画。开启后会立即预览一次，之后每个窗口会话播放一次。",
    "splash.skip": "点击跳过",
  },
  en: {
    "settings.title": "Liquid Glass",
    "settings.intro": "Control the liquid-glass intensity and the opening animation. Applies only to the composer, sidebar, model picker, and send button. The page background stays untouched.",
    "settings.intensity": "Glass intensity",
    "settings.intensity.description": "0% restores the native appearance completely. Changes apply live and are saved automatically.",
    "settings.presets": "Quick intensity",
    "settings.preset.off": "Off",
    "settings.preset.light": "Light",
    "settings.preset.mid": "Mid",
    "settings.preset.strong": "Strong",
    "settings.scope": "Surfaces",
    "settings.scope.description": "Turn one off and it keeps its native look while the rest stay glass.",
    "settings.scope.composer": "Composer card",
    "settings.scope.composer.hint": "The input card, its + control, and the access-mode pill",
    "settings.scope.sidebar": "Sidebar controls",
    "settings.scope.sidebar.hint": "New session, panel rows, workspace rows, session rows, and icon buttons",
    "settings.scope.model": "Model picker",
    "settings.scope.model.hint": "The model trigger inside the composer",
    "settings.scope.send": "Send button",
    "settings.scope.send.hint": "The send and stop button",
    "settings.splash": "Opening animation",
    "settings.splash.description": "Plays a ~6 second handwritten hello when DSH opens. Enabling it previews once; afterwards it plays once per window session.",
    "splash.skip": "Click to skip",
  },
};

function isZhUi() {
  var lang = "";
  try {
    lang = (document.documentElement && document.documentElement.lang) || "";
  } catch (error) {
    lang = "";
  }
  if (!lang) {
    try {
      lang = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    } catch (error) {
      lang = "";
    }
  }
  return String(lang).toLowerCase().indexOf("zh") === 0;
}

function localeDictionary() {
  return isZhUi() ? LOCALES.zh : LOCALES.en;
}

function t(key) {
  var dictionary = localeDictionary();
  return dictionary[key] !== undefined ? dictionary[key] : key;
}

function clampLevel(value) {
  var number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_LEVEL;
  return Math.min(100, Math.max(0, Math.round(number)));
}

function defaultSurfaces() {
  return { composer: true, sidebar: true, model: true, send: true };
}

function normalizeSurfaces(value) {
  var source = value !== null && typeof value === "object" ? value : {};
  return {
    composer: source.composer !== false,
    sidebar: source.sidebar !== false,
    model: source.model !== false,
    send: source.send !== false,
  };
}

function defaultSettings() {
  return { level: DEFAULT_LEVEL, splashEnabled: true, surfaces: defaultSurfaces() };
}

function parseSettings(value) {
  if (value === null || typeof value !== "object") return null;
  return {
    level: clampLevel(value.level),
    splashEnabled: typeof value.splashEnabled === "boolean" ? value.splashEnabled : true,
    surfaces: normalizeSurfaces(value.surfaces),
  };
}

function readSettings() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    var parsed = parseSettings(JSON.parse(raw));
    return parsed === null ? defaultSettings() : parsed;
  } catch (error) {
    return defaultSettings();
  }
}

function readSettingsFromRaw(raw) {
  try {
    var parsed = parseSettings(JSON.parse(raw));
    return parsed;
  } catch (error) {
    return null;
  }
}

function applyLevel(level) {
  var body = document.body;
  if (!body) return;

  body.setAttribute("data-dslg-level", String(level));
  if (level <= 0) {
    body.removeAttribute("data-dslg-glass");
    for (var index = 0; index < LEVEL_VARS.length; index += 1) {
      body.style.removeProperty(LEVEL_VARS[index]);
    }
    return;
  }

  var tint = 0.05 + level * 0.003;
  var values = {
    "--dslg-level": (level / 100).toFixed(3),
    "--dslg-blur": (level * 0.28).toFixed(2) + "px",
    "--dslg-sat": (100 + level * 1.15).toFixed(1) + "%",
    "--dslg-bri": (100 + level * 0.08).toFixed(1) + "%",
    "--dslg-tint": tint.toFixed(4),
    "--dslg-border": (0.07 + level * 0.0036).toFixed(4),
    "--dslg-highlight": (0.07 + level * 0.0046).toFixed(4),
    "--dslg-shadow": (0.025 + level * 0.0024).toFixed(4),
    "--dslg-radius": (8 + level * 0.07).toFixed(1) + "px",
    "--dslg-press": (1 - level * 0.00018).toFixed(4),
  };

  body.setAttribute("data-dslg-glass", "on");
  Object.keys(values).forEach(function (name) {
    body.style.setProperty(name, values[name]);
  });
}

function applyScope(surfaces) {
  var body = document.body;
  if (!body) return;
  for (var index = 0; index < SURFACE_KEYS.length; index += 1) {
    var key = SURFACE_KEYS[index];
    body.setAttribute("data-dslg-" + key, surfaces[key] !== false ? "on" : "off");
  }
}

function clearLevelVars() {
  var body = document.body;
  if (!body) return;
  for (var index = 0; index < LEVEL_VARS.length; index += 1) {
    body.style.removeProperty(LEVEL_VARS[index]);
  }
  body.removeAttribute("data-dslg-glass");
  body.removeAttribute("data-dslg-level");
  for (var scopeIndex = 0; scopeIndex < SURFACE_KEYS.length; scopeIndex += 1) {
    body.removeAttribute("data-dslg-" + SURFACE_KEYS[scopeIndex]);
  }
}

/* --------------------------------------------------------------------------
   Preference store
   -------------------------------------------------------------------------- */

function createStore() {
  var snapshot = readSettings();
  var listeners = new Set();
  var saveTimer = 0;
  var disposed = false;

  function emit() {
    listeners.forEach(function (listener) {
      try {
        listener();
      } catch (error) {
        /* A settings component must not break the material. */
      }
    });
  }

  function saveNow() {
    if (saveTimer !== 0) {
      clearTimeout(saveTimer);
      saveTimer = 0;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 3,
        level: snapshot.level,
        splashEnabled: snapshot.splashEnabled,
        surfaces: snapshot.surfaces,
      }));
    } catch (error) {
      /* Private mode / disabled storage: keep the in-memory values. */
    }
  }

  function scheduleSave() {
    if (disposed) return;
    if (saveTimer !== 0) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 160);
  }

  function onStorage(event) {
    if (event.key !== STORAGE_KEY) return;
    var next = event.newValue === null ? defaultSettings() : readSettingsFromRaw(event.newValue);
    if (next === null) return;
    snapshot = next;
    emit();
  }

  window.addEventListener("storage", onStorage);

  return {
    getSnapshot: function () {
      return snapshot;
    },
    subscribe: function (listener) {
      if (disposed) return function () {};
      listeners.add(listener);
      return function () {
        listeners.delete(listener);
      };
    },
    setLevel: function (next) {
      if (disposed) return;
      var level = clampLevel(next);
      if (level === snapshot.level) return;
      snapshot = { level: level, splashEnabled: snapshot.splashEnabled, surfaces: snapshot.surfaces };
      scheduleSave();
      emit();
    },
    setSplashEnabled: function (next) {
      if (disposed) return;
      var enabled = next === true;
      if (enabled === snapshot.splashEnabled) return;
      snapshot = { level: snapshot.level, splashEnabled: enabled, surfaces: snapshot.surfaces };
      saveNow();
      emit();
    },
    setSurface: function (key, next) {
      if (disposed || SURFACE_KEYS.indexOf(key) < 0) return;
      var enabled = next === true;
      if (enabled === snapshot.surfaces[key]) return;
      var surfaces = {
        composer: snapshot.surfaces.composer,
        sidebar: snapshot.surfaces.sidebar,
        model: snapshot.surfaces.model,
        send: snapshot.surfaces.send,
      };
      surfaces[key] = enabled;
      snapshot = { level: snapshot.level, splashEnabled: snapshot.splashEnabled, surfaces: surfaces };
      saveNow();
      emit();
    },
    flush: saveNow,
    dispose: function () {
      if (disposed) return;
      disposed = true;
      saveNow();
      window.removeEventListener("storage", onStorage);
      listeners.clear();
    },
  };
}

/* --------------------------------------------------------------------------
   Material
   -------------------------------------------------------------------------- */

function createMaterial(store) {
  var style = document.createElement("style");
  style.setAttribute("data-plugin", PACKAGE_ID);
  style.textContent = CSS;
  document.head.appendChild(style);

  var disposed = false;
  var raf = 0;
  var pendingSurface = null;
  var pressed = null;
  var typingCard = null;
  var typingTimer = 0;

  function apply() {
    var snapshot = store.getSnapshot();
    applyLevel(snapshot.level);
    applyScope(snapshot.surfaces);
  }

  var unsubscribe = store.subscribe(apply);
  apply();

  function surfaceKeyFor(element) {
    if (element.closest("[class*='_sidebarCol']")) return "sidebar";
    if (element.closest("[data-composer-card]")) {
      if (element.matches("button[class*='_primary']")) return "send";
      var aria = element.getAttribute("aria-label") || "";
      if (/模型|model|modell|modèle|モデル|모델/i.test(aria)) return "model";
      return "composer";
    }
    return null;
  }

  function onPointerMove(event) {
    if (store.getSnapshot().level <= 0 || !(event.target instanceof Element)) return;
    var surface = event.target.closest(SURFACE_SELECTOR);
    if (!surface) return;
    var key = surfaceKeyFor(surface);
    if (key === null || store.getSnapshot().surfaces[key] === false) return;
    var rect = surface.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    pendingSurface = {
      element: surface,
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    };
    if (raf !== 0) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      if (pendingSurface === null) return;
      var current = pendingSurface;
      pendingSurface = null;
      current.element.style.setProperty("--dslg-mx", current.x.toFixed(1) + "%");
      current.element.style.setProperty("--dslg-my", current.y.toFixed(1) + "%");
    });
  }

  function clearPress() {
    if (pressed !== null) {
      pressed.classList.remove("dslg-pressed");
      pressed = null;
    }
  }

  function onPointerDown(event) {
    if (event.button !== 0 || store.getSnapshot().level <= 0 || !(event.target instanceof Element)) return;
    var surface = event.target.closest(PRESS_SELECTOR);
    if (!surface) return;
    var key = surfaceKeyFor(surface);
    if (key === null || store.getSnapshot().surfaces[key] === false) return;
    clearPress();
    pressed = surface;
    surface.classList.add("dslg-pressed");
  }

  function pauseIconFlow(event) {
    if (store.getSnapshot().level <= 0 || !(event.target instanceof Element)) return;
    var card = event.target.closest("[data-composer-card]");
    if (!card) return;
    if (typingCard !== null && typingCard !== card) {
      typingCard.removeAttribute("data-dslg-typing");
    }
    typingCard = card;
    card.setAttribute("data-dslg-typing", "true");
    if (typingTimer !== 0) clearTimeout(typingTimer);
    typingTimer = setTimeout(function () {
      typingTimer = 0;
      if (typingCard !== null) {
        typingCard.removeAttribute("data-dslg-typing");
        typingCard = null;
      }
    }, 1100);
  }

  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("input", pauseIconFlow, true);
  document.addEventListener("keydown", pauseIconFlow, true);
  document.addEventListener("compositionstart", pauseIconFlow, true);
  document.addEventListener("compositionend", pauseIconFlow, true);
  window.addEventListener("pointerup", clearPress, true);
  window.addEventListener("pointercancel", clearPress, true);
  window.addEventListener("blur", clearPress);

  function dispose() {
    if (disposed) return;
    disposed = true;
    unsubscribe();
    if (raf !== 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (typingTimer !== 0) {
      clearTimeout(typingTimer);
      typingTimer = 0;
    }
    if (typingCard !== null) {
      typingCard.removeAttribute("data-dslg-typing");
      typingCard = null;
    }
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("input", pauseIconFlow, true);
    document.removeEventListener("keydown", pauseIconFlow, true);
    document.removeEventListener("compositionstart", pauseIconFlow, true);
    document.removeEventListener("compositionend", pauseIconFlow, true);
    window.removeEventListener("pointerup", clearPress, true);
    window.removeEventListener("pointercancel", clearPress, true);
    window.removeEventListener("blur", clearPress);
    clearPress();
    style.remove();
    clearLevelVars();
    try {
      var leftovers = document.querySelectorAll(".dslg-pressed");
      for (var index = 0; index < leftovers.length; index += 1) {
        leftovers[index].classList.remove("dslg-pressed");
      }
    } catch (error) {
      /* Detached document. */
    }
  }

  return { dispose: dispose };
}

/* --------------------------------------------------------------------------
   Opening splash
   -------------------------------------------------------------------------- */

var DSLG_EARTH_POLYGONS = [
  [[-168, 65], [-165, 71], [-150, 71], [-135, 70], [-120, 72], [-100, 74], [-85, 73], [-70, 70], [-60, 66], [-55, 58], [-63, 50], [-70, 45], [-75, 38], [-81, 31], [-81, 25], [-90, 20], [-97, 18], [-105, 20], [-114, 28], [-124, 40], [-132, 54], [-145, 60], [-158, 58], [-168, 65]],
  [[-97, 18], [-90, 15], [-84, 10], [-78, 8], [-80, 7], [-86, 12], [-92, 16], [-97, 18]],
  [[-58, 82], [-20, 82], [-18, 70], [-30, 60], [-45, 60], [-55, 68], [-58, 82]],
  [[-81, 10], [-70, 12], [-60, 10], [-50, 0], [-35, -6], [-38, -20], [-48, -25], [-58, -38], [-65, -55], [-72, -52], [-75, -40], [-78, -20], [-81, -5], [-81, 10]],
  [[-10, 36], [-9, 43], [-2, 48], [0, 50], [-5, 58], [2, 62], [10, 64], [18, 70], [30, 70], [40, 60], [40, 48], [30, 45], [28, 40], [18, 40], [12, 38], [3, 38], [-5, 36], [-10, 36]],
  [[-17, 15], [-17, 25], [-10, 35], [10, 37], [25, 32], [35, 30], [43, 12], [51, 10], [42, -10], [35, -25], [25, -34], [15, -35], [8, -25], [0, -5], [-10, 5], [-17, 15]],
  [[30, 70], [50, 75], [70, 75], [90, 76], [110, 74], [130, 72], [150, 70], [170, 68], [180, 66], [180, 55], [165, 50], [155, 45], [145, 40], [135, 35], [125, 30], [122, 22], [115, 15], [108, 10], [105, 2], [100, -5], [98, 8], [90, 20], [80, 25], [70, 25], [60, 28], [50, 32], [42, 40], [35, 50], [30, 60], [30, 70]],
  [[68, 24], [72, 20], [75, 12], [80, 8], [87, 20], [88, 24], [80, 28], [72, 28], [68, 24]],
  [[97, 20], [102, 20], [109, 12], [105, 5], [100, 8], [97, 20]],
  [[35, 30], [43, 30], [52, 22], [58, 22], [55, 15], [45, 12], [38, 20], [35, 30]],
  [[113, -22], [122, -18], [130, -12], [142, -11], [153, -25], [150, -38], [140, -38], [130, -32], [115, -34], [113, -22]],
  [[-180, -70], [180, -70], [180, -90], [-180, -90]],
  [[-5, 50], [-3, 58], [1, 58], [2, 52], [-4, 50]],
  [[43, -13], [50, -16], [49, -25], [44, -22], [43, -13]]
];
var DSLG_EARTH_ISLANDS = [
  [138, 37, 4], [141, 41, 3], [132, 33, 2.5], [120, -2, 3], [110, -7, 4], [125, 2, 3],
  [135, -4, 3], [100, 1, 2.5], [174, -41, 2], [168, -45, 2], [122, 12, 2.5], [125, 10, 2],
  [-77, 20, 1.8], [-72, 19, 1.2], [55, -21, 1.2]
];
var dslgEarthCache = null;

var DSLG_EARTH_TEXTURE_URI = "data:image/jpeg;base64,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";


var DSLG_EARTH_MASK_B64 = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/////+AAAAAD///////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////8AP8/3///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///////////////////////gHwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4/////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf8/////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////8Af///////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////wAf///////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////wAAf//////////////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////AD////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/////AP////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADn///gAP////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///AAP////////////////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOH+D///+AAD////////////////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/+f///8AAB////////////////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/+f///4AAAAAB/////////////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//////+AAAAAAAA/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/+f///4AAAAAAP////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////+AAAAAAAA/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+P///wAAAAAAD////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////+AAAAAAAA/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/gAAAAAAAf/B+AAAAAAAAB////////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//wAAAAP8f8B+AAAAAAAAA////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////////AAAcAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///AA/A/+f8f///4AAAAAAf//////////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAD////////////8B/+AAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////A/+fw////8AAAAAAf//////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/gAf/////////////z//AAAB/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////A/+fA/////gAAAAAP//////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/h//////////////////gAAP/g8AAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////gD/+A/////4AAAAAH//////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/n//////////////////gAA//z/AAAAAAAAAAAAAAAAADgAAAAAAAAAD4P////wBz/A//////wAAAAD//////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////////////////x//////8AAAAAAAAAAAAAAAB//wAAAAAAAAAAD////4AD/gf//////AAAAD//////////8AAAAAAAAAAAAAAH/+AAAAAAAAAAAAP//////////////////////////////gAAAAAAAAAAAAH////AAAAAAcAAB/////wD/4H//////4AAAD//////////4AAAAAAAAAAAAAH///4AAAAAAAAAAAP//////////////////////////////wAAAAAAAAAAAD//////+AAB/+B4Af////wf/8AP/4///8AAAD//////////AAAAAAAAAAAAAA/////AAAAAAAAH8AP//////////////////////////////4AAB/+AAAAAAH////////D/////5/////4///gH/gf//8AAAB/////////+AAAAAAAAAAAAAf/////4AAAAAAAH/8f////////////////////////////////////+AAAAA/////////////////////7///8H/AP//+AAAA/////////4AAAAAAAAAAAAD///////4AAAADgP////////////////////////////////////////AAAAA/////////////////////////+f+AP///AAAAf///////4AAAAAAAAAAAAAD////////AB4B///////////////////////////////////////////AAAAA///////////////////////////+AP///4AAA///////wAAAAAAAAAAAAAAD////////8D4f///////////////////////////////////////////AAAAAP//////////////////////////+APD///AAA///////AAAAAAAAAAAAAAAH////////+D/////////////////////////////////////////////AAAAAH//////////////////////////+AAD///wAA//////+AAAAAAAAAAAAAAAP/////////H/////////////////////////////////////////////AAAAB///////////////////////////4AAP///wAA//////4AAAAAAAAAAAAAAAf///////////////////////////////////////////////////////AAAAH///////////////////////////gAA////wAAf/////AAAAAAAAAAAAAAAA////////////////////////////////////////////////////////AAAAH///////////////////////////wAf////AAAP///+AAAAAAAAAAAAAAAAB////////////////////////////////////////////////////////AAAAH///////////////////////////8Af///8AAAH///8AAAAAAAAAAAAAAAAH////////////////////////////////////////////////////////AAAAAAf/////////////////////////8Af///4AAAH///4AAAAAAAAAAAAAAAAP///////////////////////////////////////////////////////8AAAAAAf///////////////////////h/8AAH//4AAAD///4AAAAAAAAAAAAAAAB////////////////////////////////////////////////////////8AAAAAD///////////////////////+APAAAA//4AAAB///wAAAAAAAAAAAAAAAH////////////////////////////////////////////////////////8AAAAAH///////////////////////8AAAAAAf/4AAAA///gAAAAAAAAAAAAAAA/////////////////////////////////////////////////////////8AAAAD////////////////////////wAAAA/+B/4AAAAf//AAAAAAAAAAAAAAAD////////////////////////////////////////////////////////+AAAAAD////////////////////////gAAAA//AB4AAAAP//AAAAAAAAAAAAAAAH////////////////////////////////////////////////////3///wAAAAAD///////////////////////+AAAAA//wAAAAAAD//AAAAAAAAAAAAAAAH//////////////////////////////////////////////////wf///+AAAAAAB///////////////////////8AAAAA//+AAAAAAB/+AAAAAAAAAAAAAAAH//////////////////////////////////////////////////AO///4AAAAAAA///////////////////////4AAAAA//+AAAAAAAD8AAAAAAAAAAAAAAAH/////////////////////////////////////////////////+AB//HAAAAAAAAc////+AB///////////////4AAAAA///AcAAAAAAAAAAAAAAAAAAAAAAH/////////////////////////////////////////////////8AD/wAAAAAAAAAA///+AAAH//////////////8AAAAA///g+AAAAAAAAAAAAAAAAAAAAAAD///////////////////////////////////////////////8P4AP4AAAAAAAAAAAf//8AAAA//////////////+AAAAA///x/AAAAAAAAAAAAAAAAAAAAAAB/3///////////////////////////////////////////wAAHAAfwAAAAAAAAAAAAf/4AAAAf//////////////AAAAA/////gAAAAAAAAAAAAAAAAAD/AAA/D///////////////////////////////////////////AAAAAB/wAAAAAAAAAAAAP/wAAAAP//////////////gAAAA/////wAAAAAAAAAAAAAAAAAD/AAAAB//////////////////////////////////////////+AAAAAP/wAAAAAAAAAAAAPPgAAAAD//////////////wAAAAP////4AAAAAAAAAAAAAAAAAD/wAAAA//////////////////////////////////////////4AAAAAf/wAAAAAAAAAAAAOAAAAAAB///////////////4AAAP////8AAAAAAAAAAAAAAAAAD/wAAB8f/////////////////////////////////////////gAAAAA//wAAAAAAAAAAAHAAAAAAAA///////////////+AAAf////+AAAAAAAAAAAAAAAAAB/wAAD8f/////////////////////////////////////////AAAAAB//wAAAAAAAAAAAHAAAAAAAAf///////////////wAA//////AAAAAAAAAAAAAAAAAD/wAAD//////////////////////////////////////////+AAAAAB//AAAAAAAAAAAAHAAAAAAAAP////////////////gB//////wAAAAAAAAAAAAAAAAP/4AAD//////////////////////////////////////////+AAAAAB//AAAAAAAAAAAAAAAAAAAAAH////////////////4H//////8AAAAAAAAAAAAAAAA//8AAB//////////////////////////////////////////+AAAAAB/+AAAAAAAAAAAAAAAAAAAAAHf///////////////8P///////AAAAAAAAAAAAAAAD//+AAB///////////////////////////////////////////gAAAAB/4AAAAAAAAAAAAAAAAAAAAAAf///////////////8P///////gAAAAAAAAAAAAAAD/D/AAD///////////////////////////////////////////+AAAAB/wAAAAAAAAAAAAAAAAAAAAAAH///////////////+f///////wAAAAAAAAAAAAAAD/H/gD/////////////////////////////////////////////+AAAA/gAAAAAAAAAAAAAAAAAAAAAAB////////////////////////4AAAAAAAAAAAAAAD/H/4H/////////////////////////////////////////////+AAAA/AAAAAAAAAAAAAAAAAAAAAAAA////////////////////////4AAAAAAAAAAAAAAD+H/4P/////////////////////////////////////////////+AAAAeAAAAAAAAAAAAAAAAAAAAAAAAf///////////////////////4AAAAAAAAAAAAAAD4H/4f/////////////////////////////////////////////+AAAAcAAAAAAAAAAAAAAAAAAAAAAAAf///////////////////////4AAAAAAAAAAAAAAAAH/4//////////////////////////////////////////////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////////////////////4AAAAAAAAAAAAAAAAH/////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////////////////////j4AAAAAAAAAAAAAAAAAAP///////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////////////////wD8AAAAAAAAAAAAAAAAAAf///////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/////////////////////AH/AAAAAAAAAAAAAAAAA/////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////////////////+AP/gAAAAAAAAAAAAAAAB////////////////////////////////////////////////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////////////////8AP/wAAAAAAAAAAAAAAAB////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////////////////4AP/wAAAAAAAAAAAAAAAB////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///////////////////4AAfwAAAAAAAAAAAAAAAB////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///////////////////8AAPwAAAAAAAAAAAAAAAAf///////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH////////////////////8AAAAAAAAAAAAAAAAAAAP///////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////////////////////8AAAAAAAAAAAAAAAAAAAH///////////////////////////////////////////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////////////////////8AAAAAAAAAAAAAAAAAAAH///////////////////////////////////////////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH////////////////////4AAAAAAAAAAAAAAAAAAAH///////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//////////////////7+AAAAAAAAAAAAAAAAAAAAH///////////////////////////////////////////////+OAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//////////////////h4AAAAAAAAAAAAAAAAAAAAH////////////////////////////////////////////////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////////////8AAAAAAAAAAAAAAAAAAAA///////////////////////////////////////////////////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////////////4AAAAAAAAAAAAAAAAAAAA///////////////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////////////4AAAAAAAAAAAAAAAAAAAA///////////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////////////4AAAAAAAAAAAAAAAAAAAA//////////////////////////////////////////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////////////4AAAAAAAAAAAAAAAAAAAA//////////////////////////////////////////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////////////gAAAAAAAAAAAAAAAAAAAA//////////////////////////////////////////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH////////////////4AAAAAAAAAAAAAAAAAAAAA///////////////////////////////////////////n//////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////////////////wAAAAAAAAAAAAAAAAAAAAA///////////////////////////////////////////H//////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////////////////wAAAAAAAAAAAAAAAAAAAAB//////////////////////////////////////////8AH/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////////////////gAAAAAAAAAAAAAAAAAAAAB//////////////////////////////////////////4AH/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB////////////////AAAAAAAAAAAAAAAAAAAAAB//////////////////////////////////////////4AH/////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////////////AAAAAAAAAAAAAAAAAAAAAA//////////////////////////////////////////4AD/////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////////////+AAAAAAAAAAAAAAAAAAAAAA//////////////////////////////////////////+AB/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////////////+AAAAAAAAAAAAAAAAAAAAAAf//////////////////////////////////////////AA/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////////////+AAAAAAAAAAAAAAAAAAAAAAB//////////////////////////////////////////AA/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////////////+AAAAAAAAAAAAAAAAAAAAAAB//////////////////////////////////////////AA/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//////////////+AAAAAAAAAAAAAAAAAAAAAAB/////////////////////////////////////////+AA////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////8AAAAAAAAAAAAAAAAAAAAAAB/////////////////////////////////////////+AB////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////wAAAAAAAAAAAAAAAAAAAAAAD//////////////////////////////////////////AB9//8cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//////////////gAAAAAAAAAAAAAAAAAAAAAAH//////////////////////////////////////////gBw//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////////+AAAAAAAAAAAAAAAAAAAAAAAf//////////////////////////////////////////wAA/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////////////4AAAAAAAAAAAAAAAAAAAAAAA///////////////////////////////////////////wAA/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////////wAAAAAAAAAAAAAAAAAAAAAAB///////////////////////////////////////////wAA/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////////gAAAAAAAAAAAAAAAAAAAAAAD///////////////////////////////////////////wAAeAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////////AAAAAAAAAAAAAAAAAAAAAAAD///////////////////////////////////////////wAAeAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////////AAAAAAAAAAAAAAAAAAAAAAAD///////////////////////////////////////////wAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////////AAAAAAAAAAAAAAAAAAAAAAAD///////////////////////////////////////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////4P/AAAAAAAAAAAAAAAAAAAAAAAD///////////////////////////////////////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//////8/gAfAAAAAAAAAAAAAAAAAAAAAAAH///////////////////////////////////////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//////wAAAPgAAAAAAAAAAAAAAAAAAAAAAf///////////////////////////////////////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//////AAAAPgAAAAAAAAAAAAAAAAAAAAAA////////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH9////+AAAAPgAAAAAAAAAAAAAAAAAAAAAD////////////////////////////////////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8////8AAAAPwAAAAAAAAAAAAAAAAAAAAAH////////////////////////////////////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8P///8AAAAHwAAAAAAAAAAAAAAAAAAAAAP////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///8AAAAHwAAAAAAAAAAAAAAAAAAAAAf////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHH///8AAAADwAAAAAAAAAAAAAAAAAAAAA////////////////////////////////////////////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHj///4AAAABwAAAAAAAAAAAAAAAAAAAAA///////////////////////+P///////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHh///4AAAAAAAAAAAAAAAAAAAAAAAAAAA///////////////////////+AAAf////////////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADg///4AAAAAAAAAAAAAAAAAAAAAAAAAAB////////////////////////AAAP////////////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//4AAAAAAAAAAAAAAAAAAAAAAAAAAD////////////////////////gAAH////////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//4AAAAAAAAAAAAAAAAAAAAAAAAAAD////////////////////////8AAD////////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//4AAAAAAAAAAAAAAAAAAAAAAAAAAH////////////////////////+AAB///////////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//4AAAAAAAAAAAAAAAAAAAAAAAAAAP////////////////////////+AAB///////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//4AAAAAAAAAAAAAAAAAAAAAAAAAAP////////////////////////+AAA//////////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//8AA/AAAAAAAAAAAAAAAAAAAAAAAP////////////////////////+AAAf/////8D/////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//8AB/AAAAAAAAAAAAAAAAAAAAAAAP////////////////////////8AAAP/////AD////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//+AB/AAAAAAAAAAAAAAAAAAAAAAAH////////////////////////4AAAAf////AB////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB///AD/AAAAAAAAAAAAAAAAAAAAAAAH////////////////////////4AAAAf///+AA////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///AH/AAAAAAAAAAAAAAAAAAAAAAAH////////////////////////wAAAAf///4AAf///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//gP/AAAAAAAAAAAAAAAAAAAAAAAH////////////////////////gAAAAf///wAAf///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////+AAAAAAAAAAAAAAAAAAAAAAAH////////////////////////AAAAAP///gAAP///4AAAAeAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////+AAAAAAAAAAAAAAAAAAAAAAAH///////////////////////+AAAAAP///AAAP///4AAAA+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///+AAAAAAAAAAAAAAAAAAAAAAAH///////////////////////8AAAAAP//+AAAP///8AAAA+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///8AAAAAAAAAAAAAAAAAAAAAAAH///////////////////////wAAAAAP//wAAAP///+AAAA+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///+4AAAAAAAAAAAAAAAAAAAAAAH//////////////////////8AAAAAAP//wAAAP////AAAB+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPj///AAAAAAAAAAAAAAAAAAAAAAH//////////////////////4AAAAAAH//gAAAHP///wAAB8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB///gAAAAAAAAAAAAAAAAAAAAAP//////////////////////wAAAAAAH//AAAAAH///4AAB8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAAAAAAAAAAAAP/////////////////////+AAAAAAAD/+AAAAAH///4AAB+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//wAAAAAAAAAAAAAAAAAAAAAP/////////////////////4AAAAAAAD/+AAAAAH///4AAA/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//wAAAAAAAAAAAAAAAAAAAAAP/////////////////////gAAAAAAAB/+AAAAAH///4AAA/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//gAAAAAAAAAAAAAAAAAAAAAP////////////////////+AAAAAAAAB/+AAAAAD///4AAA/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/gAAAAAAAAAAAAAAAAAAAAAP////////////////////gAAAAAAAAB/+AAAAAD///4AAAf8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAAAP///////////////////8AAAAAAAAAB/+AAAAAH7//4AAAf8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/gAAD/AAAAAAAAAAAAAAAAAH///////////////////4AAAAAAAAAA/8AAAAAHw//4AAD/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfgAAP/wAAAAAAAAAAAAAAAAH///////////////////4A/gAAAAAAAf8AAAAAHwf/wAAH//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgAA//wOAAAAAAAAAAAAAAAD///////////////////8f/gAAAAAAAf8AAAAAHgP/gAAH//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwAD////8AAAAAAAAAAAAAAA//////////////////////gAAAAAAAP8AAAAAHgH/AAAH//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP4AD////8AAAAAAAAAAAAAAAf/////////////////////AAAAAAAAP+AAAAAHwB8AAAH//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8fH////8AAAAAAAAAAAAAAAP/////////////////////AAAAAAAAP/AAAAAHwB4AAAf//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///////8AAAAAAAAAAAAAAAH/////////////////////AAAAAAAAH/AAAAAHwBwAAA///gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////gAAAAAAAAAAAAAAH////////////////////+AAAAAAAAHnAAAAAD4AAAAB///gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7//////wAAAAAAAAAAAAAAD////////////////////+AAAAAAAAAHgAAAAD4AAAAB///gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADh//////4AAAAAAAAAAAAAAB////////////////////8AAAAAAAAAHgAAAAA4AAAAB///gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////8AAAAAAAAAAAAAAA////////////////////4AAAAAAAAAHgAAAAA/AAAAB//fgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////AAAAAAAAAAAAAAAf////v//////////////4AAAAAAAAADgAAAAAfgAAAD/+PgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////AAAAAAAAAAAAAAH///wH//////////////wAAAAAAAAAAAAAAAAfwAAAH/8HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////4AAAAAAAAAAAAAD///AD//////////////wAAAAAAAAAAAAAAB4P4AAAP/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////8AAAAAAAAAAAAAB//8AD//////////////gAAAAAAAAAAAAAAB8P4AAAf/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////8AAAAAAAAAAAAAAeAAAB//////////////AAAAAAAAAAAAAAAB+H4AAB/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////+AAAAAAAAAAAAAAAAAAAD/////////////AAAAAAAAAAAAAAAA/H4AAH/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf////////AAAAAAAAAAAAAAAAAAAA////////////+AAAAAAAAAAAAAAAAfj4AAP/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////gAAAAAAAAAAAAAAAAAAAf///////////8AAAAAAAAAAAAAAAAP38AAf/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/////////wAAAAAAAAAAAAAAAAAAAf///////////wAAAAAAAAAAAAAAAAP/+AA//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////////wAAAAAAAAAAAAAAAAAAAf///////////gAAAAAAAAAAAAAAAAP/+AP//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////4AAAAAAAAAAAAAAAAAAAf///////////AAAAAAAAAAAAAAAAAP/+AP//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/////////4AAAAAAAAAAAAAAAAAAA///////////wAAAAAAAAAAAAAAAAAP/+AP//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/////////8AAAAAAAAAAAAAAAAAAA///////////gAAAAAAAAAAAAAAAAAH//AP//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////////AAAAAAAAAAAAAAAAAAA///////////gAAAAAAAAAAAAAAAAAH//AH//wAAAfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////////4AAAAAAAAAAAAAAAAAA///////////gAAAAAAAAAAAAAAAAAD//AH//gAAAf/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////////AAAAAAAAAAAAAAAAAA///////////AAAAAAAAAAAAAAAAAAB//AH//gAAAf/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////////gAAAAAAAAAAAAAAAAA///////////AAAAAAAAAAAAAAAAAAB//wH//AAAAf//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////////////wAAAAAAAAAAAAAAAAAf/////////+AAAAAAAAAAAAAAAAAAA//4H/+AAAAB//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////////gAAAAAAAAAAAAAAAAf/////////8AAAAAAAAAAAAAAAAAAAf/4D/+AAAAA///gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////////////AAAAAAAAAAAAAAAAP/////////4AAAAAAAAAAAAAAAAAAAH/4B/+AAAAA///4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////////////gAAAAAAAAAAAAAAAH/////////wAAAAAAAAAAAAAAAAAAAB/4AB+AAAAAf///gAHgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//////////////wAAAAAAAAAAAAAAAD/////////wAAAAAAAAAAAAAAAAAAAA/wAAeAAAAAP///4AHgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//////////////8AAAAAAAAAAAAAAAB/////////wAAAAAAAAAAAAAAAAAAAAfwAAAAAAAAAf//8AHgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB///////////////gAAAAAAAAAAAAAAA/////////wAAAAAAAAAAAAAAAAAAAAPwAAAAAAAAAH///AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB///////////////wAAAAAAAAAAAAAAA/////////wAAAAAAAAAAAAAAAAAAAAD4AAAAAAAAAB///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///////////////wAAAAAAAAAAAAAAA/////////gAAAAAAAAAAAAAAAAAAAAB/gAAAAAAAAA///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///////////////wAAAAAAAAAAAAAAAf////////gAAAAAAAAAAAAAAAAAAAAA/xwAAAAAAAAf//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////////////4AAAAAAAAAAAAAAAf////////gAAAAAAAAAAAAAAAAAAAAAfz/gAAAAAAAf//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////////////4AAAAAAAAAAAAAAAP////////gAAAAAAAAAAAAAAAAAAAAADz/8AAB4AAAf//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//////////////4AAAAAAAAAAAAAAAP////////gAAAAAAAAAAAAAAAAAAAAAAD///8f4AAAf/n4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////wAAAAAAAAAAAAAAAP////////gAAAAAAAAAAAAAAAAAAAAAAAf//8f4AAAD/D8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//////////////wAAAAAAAAAAAAAAAP////////gAAAAAAAAAAAAAAAAAAAAAAAAP/8fgAAAB+B/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//////////////gAAAAAAAAAAAAAAAP////////wAAAAAAAAAAAAAAAAAAAAAAAAAD4eAAAAAcA/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//////////////gAAAAAAAAAAAAAAAP////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAfwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////////////AAAAAAAAAAAAAAAAH////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////////8AAAAAAAAAAAAAAAAH////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////////4AAAAAAAAAAAAAAAAH////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAH8cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf////////////4AAAAAAAAAAAAAAAAH////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/8AeAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////////wAAAAAAAAAAAAAAAAP////////8AAcAAAAAAAAAAAAAAAAAAAAAAAAAAH/8AeAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH////////////gAAAAAAAAAAAAAAAAf////////8AA8AAAAAAAAAAAAAAAAAAAAAAAAAAP/8AfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH////////////gAAAAAAAAAAAAAAAAf////////8AB+AAAAAAAAAAAAAAAAAAAAAAAAAAf/8AfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH////////////gAAAAAAAAAAAAAAAA/////////8AB+AAAAAAAAAAAAAAAAAAAAAAAAB8f/4AfgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH////////////AAAAAAAAAAAAAAAAA/////////8AB+AAAAAAAAAAAAAAAAAAAAAAAAD///4AfwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////////////AAAAAAAAAAAAAAAAA/////////8AD+AAAAAAAAAAAAAAAAAAAAAAAAH///4Af4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB////////////AAAAAAAAAAAAAAAAA/////////8Af+AAAAAAAAAAAAAAAAAAAAAAAAP///+Af4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///////////AAAAAAAAAAAAAAAAB/////////4A/+AAAAAAAAAAAAAAAAAAAAAAAA/////A/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///////////AAAAAAAAAAAAAAAAB/////////wB/+AAAAAAAAAAAAAAAAAAAAAAAB/////w/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB///////////AAAAAAAAAAAAAAAAB/////////gD/8AAAAAAAAAAAAAAAAAAAAAAAD/////9/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////////AAAAAAAAAAAAAAAAB////////8AD/4AAAAAAAAAAAAAAAAAAAAAAAD///////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////////AAAAAAAAAAAAAAAAB////////4AD/4AAAAAAAAAAAAAAAAAAAAAAAD///////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////+AAAAAAAAAAAAAAAAA////////gAD/4AAAAAAAAAAAAAAAAAAAAAAAH////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////+AAAAAAAAAAAAAAAAAf///////AAD/wAAAAAAAAAAAAAAAAAAAAAAAP////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////+AAAAAAAAAAAAAAAAAf//////+AAD/wAAAAAAAAAAAAAAAAAAAAAAAf////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////8AAAAAAAAAAAAAAAAAP//////8AAD/wAAAAAAAAAAAAAAAAAAAAAAH/////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////8AAAAAAAAAAAAAAAAAP//////8AAD/wAAAAAAAAAAAAAAAAAAAAAD//////////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////4AAAAAAAAAAAAAAAAAP//////+AAH/gAAAAAAAAAAAAAAAAAAAAAP//////////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////wAAAAAAAAAAAAAAAAAH//////+AAP/gAAAAAAAAAAAAAAAAAAAAAf///////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////gAAAAAAAAAAAAAAAAAD//////+AAP/gAAAAAAAAAAAAAAAAAAAAB////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////////AAAAAAAAAAAAAAAAAAD//////+AAP/AAAAAAAAAAAAAAAAAAAAAB////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////8AAAAAAAAAAAAAAAAAAD//////+AAP/AAAAAAAAAAAAAAAAAAAAAB////////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////AAAAAAAAAAAAAAAAAAAD//////+AAH/AAAAAAAAAAAAAAAAAAAAAB////////////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////8AAAAAAAAAAAAAAAAAAAD//////+AAH+AAAAAAAAAAAAAAAAAAAAAD////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///////wAAAAAAAAAAAAAAAAAAAB//////8AAH+AAAAAAAAAAAAAAAAAAAAAD/////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////gAAAAAAAAAAAAAAAAAAAB//////4AAD8AAAAAAAAAAAAAAAAAAAAAD/////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///////AAAAAAAAAAAAAAAAAAAAB//////gAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////+AAAAAAAAAAAAAAAAAAAAA//////AAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////+AAAAAAAAAAAAAAAAAAAAA//////AAAAAAAAAAAAAAAAAAAAAAAAAAD/////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////+AAAAAAAAAAAAAAAAAAAAA//////AAAAAAAAAAAAAAAAAAAAAAAAAAB/////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//////+AAAAAAAAAAAAAAAAAAAAAf/////AAAAAAAAAAAAAAAAAAAAAAAAAAA/////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////+AAAAAAAAAAAAAAAAAAAAAf////+AAAAAAAAAAAAAAAAAAAAAAAAAAA/////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////+AAAAAAAAAAAAAAAAAAAAAP////+AAAAAAAAAAAAAAAAAAAAAAAAAAAf////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////8AAAAAAAAAAAAAAAAAAAAAH////8AAAAAAAAAAAAAAAAAAAAAAAAAAAf////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////4AAAAAAAAAAAAAAAAAAAAAD////4AAAAAAAAAAAAAAAAAAAAAAAAAAAP////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////wAAAAAAAAAAAAAAAAAAAAAD////wAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////wAAAAAAAAAAAAAAAAAAAAAD////wAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//////gAAAAAAAAAAAAAAAAAAAAAB////gAAAAAAAAAAAAAAAAAAAAAAAAAAAP////////////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/////+AAAAAAAAAAAAAAAAAAAAAAA////AAAAAAAAAAAAAAAAAAAAAAAAAAAAH////////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/////8AAAAAAAAAAAAAAAAAAAAAAA///+AAAAAAAAAAAAAAAAAAAAAAAAAAAAH///+A///////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/////8AAAAAAAAAAAAAAAAAAAAAAA///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAH///AAH/////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////4AAAAAAAAAAAAAAAAAAAAAAA///4AAAAAAAAAAAAAAAAAAAAAAAAAAAAH//8AAD/////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////wAAAAAAAAAAAAAAAAAAAAAAA///AAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//wAAB/////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////gAAAAAAAAAAAAAAAAAAAAAAAf/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/wAAAA/////4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////AAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH+AAAAA/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4AAAAAf////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB///AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB///AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB5wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH5wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/8AAAAAAAAAAAAAB//wB/wAAAAP/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//gAAAAAAAAA//////////Aff8////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB///8AAAAAAAA////////////////////+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///////wAAAAf/////////////////////gAAAAAAAAAA////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////";
var DSLG_EARTH_MASK_WIDTH = 720;
var DSLG_EARTH_MASK_HEIGHT = 360;
var dslgEarthMaskCache = null;



function dslgEarthMask() {
  if (dslgEarthMaskCache !== null) return dslgEarthMaskCache;
  try {
    var raw = atob(DSLG_EARTH_MASK_B64);
    var bytes = new Uint8Array(raw.length);
    for (var index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
    dslgEarthMaskCache = bytes;
  } catch (error) {
    dslgEarthMaskCache = false;
  }
  return dslgEarthMaskCache;
}

function dslgEarthIsLand(latitude, longitude) {
  if (latitude < -68) return true;
  var mask = dslgEarthMask();
  if (mask) {
    var x = Math.floor((longitude + 180) / 360 * DSLG_EARTH_MASK_WIDTH);
    var y = Math.floor((90 - latitude) / 180 * DSLG_EARTH_MASK_HEIGHT);
    if (x < 0) x = 0;
    if (x >= DSLG_EARTH_MASK_WIDTH) x = DSLG_EARTH_MASK_WIDTH - 1;
    if (y < 0) y = 0;
    if (y >= DSLG_EARTH_MASK_HEIGHT) y = DSLG_EARTH_MASK_HEIGHT - 1;
    var bit = y * DSLG_EARTH_MASK_WIDTH + x;
    return (mask[bit >> 3] & (0x80 >> (bit & 7))) !== 0;
  }
  for (var index = 0; index < DSLG_EARTH_POLYGONS.length; index += 1) {
    var polygon = DSLG_EARTH_POLYGONS[index];
    var inside = false;
    for (var current = 0, previous = polygon.length - 1; current < polygon.length; previous = current, current += 1) {
      var xi = polygon[current][0];
      var yi = polygon[current][1];
      var xj = polygon[previous][0];
      var yj = polygon[previous][1];
      if (((yi > latitude) !== (yj > latitude)) && (longitude < (xj - xi) * (latitude - yi) / (yj - yi) + xi)) inside = !inside;
    }
    if (inside) return true;
  }
  for (var island = 0; island < DSLG_EARTH_ISLANDS.length; island += 1) {
    var item = DSLG_EARTH_ISLANDS[island];
    var dx = (longitude - item[0]) * Math.cos(latitude * Math.PI / 180);
    var dy = latitude - item[1];
    if (dx * dx + dy * dy < item[2] * item[2]) return true;
  }
  return false;
}

function dslgEarthParticles() {
  if (dslgEarthCache !== null) return dslgEarthCache;
  var target = window.innerWidth < 720 ? 2200 : 3400;
  var candidates = target * 9;
  var golden = Math.PI * (3 - Math.sqrt(5));
  var points = [];
  for (var index = 0; index < candidates && points.length < target; index += 1) {
    var y = 1 - (index / (candidates - 1)) * 2;
    var radius = Math.sqrt(Math.max(0, 1 - y * y));
    var theta = golden * index;
    var x = Math.cos(theta) * radius;
    var z = Math.sin(theta) * radius;
    var latitude = Math.asin(y) * 180 / Math.PI;
    var longitude = Math.atan2(z, x) * 180 / Math.PI;
    if (!dslgEarthIsLand(latitude, longitude)) continue;
    points.push({
      x: x,
      y: y,
      z: z,
      phase: Math.random() * Math.PI * 2,
      spark: Math.random(),
      size: 0.8 + Math.random() * 1.55
    });
  }
  dslgEarthCache = points;
  return points;
}

function dslgGeoFallback() {
  var zone = "";
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch (error) {
    zone = "";
  }
  var zones = {
    "Asia/Shanghai": [31.23, 121.47],
    "Asia/Hong_Kong": [22.32, 114.17],
    "Asia/Taipei": [25.03, 121.56],
    "Asia/Tokyo": [35.68, 139.69],
    "Asia/Seoul": [37.57, 126.98],
    "Asia/Singapore": [1.35, 103.82],
    "Asia/Bangkok": [13.76, 100.5],
    "Asia/Kolkata": [22.57, 88.36],
    "Asia/Dubai": [25.2, 55.27],
    "Europe/London": [51.5, -0.12],
    "Europe/Paris": [48.86, 2.35],
    "Europe/Berlin": [52.52, 13.4],
    "Europe/Moscow": [55.76, 37.62],
    "America/New_York": [40.71, -74.0],
    "America/Chicago": [41.88, -87.63],
    "America/Denver": [39.74, -104.99],
    "America/Los_Angeles": [34.05, -118.24],
    "America/Sao_Paulo": [-23.55, -46.63],
    "Australia/Sydney": [-33.87, 151.21],
    "Australia/Perth": [-31.95, 115.86]
  };
  var point = zones[zone] || [20, 0];
  return { lat: point[0], lon: point[1], label: zone ? zone.replace(/_/g, " ") : "", fallback: true };
}

function dslgGeoValid(geo) {
  return geo && isFinite(geo.lat) && isFinite(geo.lon) && geo.lat >= -90 && geo.lat <= 90 && geo.lon >= -180 && geo.lon <= 180;
}

function dslgGeoCache() {
  try {
    var raw = window.sessionStorage.getItem("dsh-apple-liquid-glass.geo.v1");
    if (!raw) return null;
    var parsed = JSON.parse(raw);
    return dslgGeoValid(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

function dslgGeoFetchJson(url, timeout) {
  var controller = typeof AbortController === "function" ? new AbortController() : null;
  var timer = 0;
  var request = fetch(url, {
    cache: "no-store",
    credentials: "omit",
    signal: controller ? controller.signal : undefined,
    headers: { Accept: "application/json" }
  }).then(function (response) {
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
  });
  var timeoutPromise = new Promise(function (resolve, reject) {
    timer = setTimeout(function () {
      if (controller) controller.abort();
      reject(new Error("timeout"));
    }, timeout);
  });
  return Promise.race([request, timeoutPromise]).then(function (value) {
    if (timer !== 0) clearTimeout(timer);
    return value;
  }, function (error) {
    if (timer !== 0) clearTimeout(timer);
    throw error;
  });
}

function dslgAmapKey() {
  try {
    return (window.localStorage.getItem("dsh-apple-liquid-glass.amapKey") || "").trim();
  } catch (error) {
    return "";
  }
}

function dslgAmapLabel(parts) {
  var seen = {};
  var values = [];
  parts.forEach(function (part) {
    var value = String(part || "").trim();
    if (!value || value === "[]" || seen[value]) return;
    seen[value] = true;
    values.push(value);
  });
  return values.slice(0, 2).join(" · ");
}

function dslgFetchAmapGeo(key) {
  var ipUrl = "https://restapi.amap.com/v3/ip?key=" + encodeURIComponent(key);
  return dslgGeoFetchJson(ipUrl, 1800).then(function (ip) {
    if (!ip || String(ip.status) !== "1") throw new Error("amap ip failed");
    var rectangle = String(ip.rectangle || "");
    var corners = rectangle.split(";");
    if (corners.length !== 2) throw new Error("amap rectangle missing");
    var first = corners[0].split(",").map(Number);
    var second = corners[1].split(",").map(Number);
    if (first.length !== 2 || second.length !== 2 || !isFinite(first[0]) || !isFinite(first[1]) || !isFinite(second[0]) || !isFinite(second[1])) {
      throw new Error("amap rectangle invalid");
    }
    var lon = (first[0] + second[0]) / 2;
    var lat = (first[1] + second[1]) / 2;
    var label = dslgAmapLabel([ip.city, ip.province]);
    var geoUrl = "https://restapi.amap.com/v3/geocode/regeo?key=" + encodeURIComponent(key) +
      "&location=" + lon.toFixed(6) + "," + lat.toFixed(6);
    return dslgGeoFetchJson(geoUrl, 1800).catch(function () {
      return null;
    }).then(function (regeo) {
      if (regeo && String(regeo.status) === "1" && regeo.regeocode) {
        var component = regeo.regeocode.addressComponent || {};
        var detailed = dslgAmapLabel([component.district, component.city, component.province]);
        if (detailed) label = detailed;
      }
      var result = { lat: lat, lon: lon, label: label, source: "amap" };
      try {
        window.sessionStorage.setItem("dsh-apple-liquid-glass.geo.v1", JSON.stringify(result));
      } catch (error) {
        /* Storage may be unavailable. */
      }
      return result;
    });
  });
}

function dslgFetchGeo() {
  var cached = dslgGeoCache();
  if (cached) return Promise.resolve(cached);
  if (typeof fetch !== "function") return Promise.resolve(dslgGeoFallback());
  var providers = [
    {
      url: "https://ipwho.is/",
      parse: function (data) {
        return {
          lat: Number(data.latitude),
          lon: Number(data.longitude),
          label: dslgAmapLabel([data.city, data.region, data.country])
        };
      }
    },
    {
      url: "https://ipapi.co/json/",
      parse: function (data) {
        return {
          lat: Number(data.latitude),
          lon: Number(data.longitude),
          label: dslgAmapLabel([data.city, data.region, data.country_name])
        };
      }
    },
    {
      url: "https://ipinfo.io/json",
      parse: function (data) {
        if (!data.loc) return null;
        var parts = String(data.loc).split(",");
        return {
          lat: Number(parts[0]),
          lon: Number(parts[1]),
          label: dslgAmapLabel([data.city, data.region, data.country])
        };
      }
    }
  ];
  function attempt(index) {
    if (index >= providers.length) return Promise.resolve(dslgGeoFallback());
    var provider = providers[index];
    return dslgGeoFetchJson(provider.url, 1400).then(function (data) {
      var geo = provider.parse(data);
      if (!dslgGeoValid(geo)) throw new Error("invalid geo");
      try {
        window.sessionStorage.setItem("dsh-apple-liquid-glass.geo.v1", JSON.stringify(geo));
      } catch (error) {
        /* Session storage may be unavailable. */
      }
      return geo;
    }).catch(function () {
      return attempt(index + 1);
    });
  }
  var amapKey = dslgAmapKey();
  if (amapKey) {
    return dslgFetchAmapGeo(amapKey).catch(function () {
      return attempt(0);
    });
  }
  return attempt(0);
}

function dslgCreateGlobeRenderer(canvas) {
  var gl = null;
  try {
    gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false }) ||
      canvas.getContext("experimental-webgl", { alpha: true, antialias: true });
  } catch (error) {
    gl = null;
  }
  if (!gl) return null;

  var vertexSource = [
    "attribute vec3 aPos;",
    "attribute vec3 aNormal;",
    "attribute vec2 aUv;",
    "uniform mat3 uRot;",
    "uniform float uScaleX;",
    "uniform float uScaleY;",
    "varying vec2 vUv;",
    "varying vec3 vNormal;",
    "void main() {",
    "  vec3 p = uRot * aPos;",
    "  vNormal = uRot * aNormal;",
    "  vUv = aUv;",
    "  gl_Position = vec4(p.x * uScaleX, p.y * uScaleY, p.z * 0.5 + 0.5, 1.0);",
    "}"
  ].join("\n");
  var fragmentSource = [
    "precision highp float;",
    "uniform sampler2D uTexture;",
    "varying vec2 vUv;",
    "varying vec3 vNormal;",
    "void main() {",
    "  vec3 tex = texture2D(uTexture, vUv).rgb;",
    "  float water = smoothstep(0.015, 0.10, tex.b - max(tex.r, tex.g));",
    "  float lum = dot(tex, vec3(0.299, 0.587, 0.114));",
    "  vec3 deep = vec3(0.018, 0.10, 0.32);",
    "  vec3 lightBlue = vec3(0.42, 0.84, 1.0);",
    "  vec3 color = mix(deep, lightBlue, clamp(lum * 1.38, 0.0, 1.0));",
    "  color = mix(color, tex, 0.30);",
    "  vec3 normal = normalize(vNormal);",
    "  float light = 0.52 + 0.62 * max(dot(normal, normalize(vec3(-0.55, 0.62, 0.82))), 0.0);",
    "  color *= light;",
    "  float rim = pow(1.0 - abs(normal.z), 2.35);",
    "  color += vec3(0.18, 0.52, 1.0) * rim * 0.9;",
    "  float alpha = mix(0.96, 0.27, water);",
    "  alpha = clamp(alpha + rim * 0.28, 0.0, 1.0);",
    "  gl_FragColor = vec4(color, alpha);",
    "}"
  ].join("\n");

  function compile(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  }
  var vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
  var fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  var positions = [];
  var normals = [];
  var uvs = [];
  var indices = [];
  var latSegments = 48;
  var lonSegments = 72;
  for (var latIndex = 0; latIndex <= latSegments; latIndex += 1) {
    var lat = -Math.PI / 2 + (latIndex / latSegments) * Math.PI;
    var cosLat = Math.cos(lat);
    var sinLat = Math.sin(lat);
    for (var lonIndex = 0; lonIndex <= lonSegments; lonIndex += 1) {
      var lon = -Math.PI + (lonIndex / lonSegments) * Math.PI * 2;
      var x = cosLat * Math.cos(lon);
      var z = cosLat * Math.sin(lon);
      positions.push(x, sinLat, z);
      normals.push(x, sinLat, z);
      uvs.push(lonIndex / lonSegments, (lat + Math.PI / 2) / Math.PI);
    }
  }
  var row = lonSegments + 1;
  for (var y = 0; y < latSegments; y += 1) {
    for (var x = 0; x < lonSegments; x += 1) {
      var a = y * row + x;
      var b = a + 1;
      var c = a + row;
      var d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  function buffer(data, usage) {
    var item = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, item);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    return item;
  }
  var positionBuffer = buffer(new Float32Array(positions), gl.STATIC_DRAW);
  var normalBuffer = buffer(new Float32Array(normals), gl.STATIC_DRAW);
  var uvBuffer = buffer(new Float32Array(uvs), gl.STATIC_DRAW);
  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  var positionLocation = gl.getAttribLocation(program, "aPos");
  var normalLocation = gl.getAttribLocation(program, "aNormal");
  var uvLocation = gl.getAttribLocation(program, "aUv");
  var rotationLocation = gl.getUniformLocation(program, "uRot");
  var scaleXLocation = gl.getUniformLocation(program, "uScaleX");
  var scaleYLocation = gl.getUniformLocation(program, "uScaleY");
  var textureLocation = gl.getUniformLocation(program, "uTexture");

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([18, 70, 170, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  var ready = false;
  var textureImage = new Image();
  textureImage.onload = function () {
    try {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
      ready = true;
    } catch (error) {
      ready = false;
    }
  };
  textureImage.onerror = function () {
    ready = false;
  };
  textureImage.src = DSLG_EARTH_TEXTURE_URI;

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.CULL_FACE);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);
  gl.useProgram(program);

  function rotationMatrix(angle, tilt) {
    var cy = Math.cos(angle);
    var sy = Math.sin(angle);
    var cz = Math.cos(tilt);
    var sz = Math.sin(tilt);
    var y = new Float32Array([cy, 0, -sy, 0, 1, 0, sy, 0, cy]);
    var z = new Float32Array([cz, sz, 0, -sz, cz, 0, 0, 0, 1]);
    var out = new Float32Array(9);
    for (var col = 0; col < 3; col += 1) {
      for (var rowIndex = 0; rowIndex < 3; rowIndex += 1) {
        out[col * 3 + rowIndex] =
          z[rowIndex] * y[col * 3] +
          z[3 + rowIndex] * y[col * 3 + 1] +
          z[6 + rowIndex] * y[col * 3 + 2];
      }
    }
    return out;
  }

  return {
    ready: function () { return ready; },
    render: function (angle, tilt, width, height, radius) {
      if (!gl) return;
      var pixelWidth = canvas.width;
      var pixelHeight = canvas.height;
      if (pixelWidth <= 0 || pixelHeight <= 0) return;
      gl.viewport(0, 0, pixelWidth, pixelHeight);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniformMatrix3fv(rotationLocation, false, rotationMatrix(angle, tilt));
      gl.uniform1f(scaleXLocation, (2 * radius) / Math.max(1, width));
      gl.uniform1f(scaleYLocation, (2 * radius) / Math.max(1, height));
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(textureLocation, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.enableVertexAttribArray(normalLocation);
      gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
      gl.enableVertexAttribArray(uvLocation);
      gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
  };
}

function createSplash(store) {
  var active = null;
  var reducedMotion = false;
  try {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (error) {
    reducedMotion = false;
  }

  function play(options) {
    if (!(options && options.force) && !store.getSnapshot().splashEnabled) return;
    disposeActive();

    var overlay = document.createElement("div");
    overlay.className = "dslg-splash" + (reducedMotion ? " is-reduced" : "");
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = [
      '<div class="dslg-splash__glow" aria-hidden="true"></div>',
      '<canvas class="dslg-splash__globe" aria-hidden="true"></canvas>',
      '<canvas class="dslg-splash__canvas" aria-label="旋转的地球"></canvas>',
      '<div class="dslg-splash__place"></div>',
      '<div class="dslg-splash__credit">© 高德地图</div>',
      '<button class="dslg-splash__skip" type="button"></button>',
    ].join("\n");
    var skipButton = overlay.querySelector(".dslg-splash__skip");
    var placeEl = overlay.querySelector(".dslg-splash__place");
    var language = "";
    try {
      language = (document.documentElement.lang || navigator.language || "zh").toLowerCase();
    } catch (error) {
      language = "zh";
    }
    skipButton.textContent = language.indexOf("zh") === 0 ? "跳过" : "Skip";
    skipButton.setAttribute("aria-label", t("splash.skip"));
    document.body.appendChild(overlay);
    document.documentElement.classList.add("dslg-splash-lock");

    var canvas = overlay.querySelector(".dslg-splash__canvas");
    var globeCanvas = overlay.querySelector(".dslg-splash__globe");
    var globe = dslgCreateGlobeRenderer(globeCanvas);
    var currentAngle = 0.32;
    var context = canvas.getContext("2d");
    var points = dslgEarthParticles();
    var gone = false;
    var leaving = false;
    var frameHandle = 0;
    var resizeHandler = null;
    var skipTimer = 0;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var phase = "locating";
    var fixedAngle = 0.32;
    var targetLat = 20;
    var targetLon = 0;
    var targetLabel = "";
    var spinStart = 0;
    var spinFrom = fixedAngle;
    var spinTo = fixedAngle;
    var spinDuration = 4000;
    var spotStart = 0;
    var geoDone = false;
    var placeShown = false;
    var fallback = dslgGeoFallback();
    targetLat = fallback.lat;
    targetLon = fallback.lon;

    function beginSpin(geo) {
      if (gone || leaving || geoDone) return;
      geoDone = true;
      targetLat = geo.lat;
      targetLon = geo.lon;
      targetLabel = geo.label || "";
      var latitude = targetLat * Math.PI / 180;
      var longitude = targetLon * Math.PI / 180;
      var finalAngle = longitude - Math.PI / 2;
      var fullTurn = Math.PI * 2;
      var delta = ((finalAngle - fixedAngle) % fullTurn + fullTurn) % fullTurn;
      spinFrom = fixedAngle;
      spinTo = fixedAngle + fullTurn + delta;
      if (reducedMotion) {
        phase = "spot";
        spotStart = performance.now();
        if (targetLabel) {
          placeEl.textContent = targetLabel;
          placeEl.classList.add("is-visible");
          placeShown = true;
        }
        draw(spotStart);
        skipTimer = setTimeout(skip, 3000);
        return;
      }
      spinStart = performance.now();
      phase = "spin";
    }

    function targetPoint() {
      var latitude = targetLat * Math.PI / 180;
      var longitude = targetLon * Math.PI / 180;
      return {
        x: Math.cos(latitude) * Math.cos(longitude),
        y: Math.sin(latitude),
        z: Math.cos(latitude) * Math.sin(longitude)
      };
    }

    function resize() {
      var width = window.innerWidth;
      var height = window.innerHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      globeCanvas.width = Math.max(1, Math.round(width * dpr));
      globeCanvas.height = Math.max(1, Math.round(height * dpr));
      globeCanvas.style.width = width + "px";
      globeCanvas.style.height = height + "px";
    }

    function draw(now) {
      if (!context) return;
      var width = window.innerWidth;
      var height = window.innerHeight;
      var centerX = width / 2;
      var centerY = height * 0.5;
      var globeRadius = Math.min(width, height) * 0.3;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";

      var atmosphere = context.createRadialGradient(centerX, centerY, globeRadius * 0.86, centerX, centerY, globeRadius * 1.3);
      atmosphere.addColorStop(0, "rgba(28, 90, 220, 0)");
      atmosphere.addColorStop(0.55, "rgba(44, 132, 255, 0.07)");
      atmosphere.addColorStop(1, "rgba(92, 190, 255, 0)");
      context.fillStyle = atmosphere;
      context.beginPath();
      context.arc(centerX, centerY, globeRadius * 1.3, 0, Math.PI * 2);
      context.fill();

      var angle = fixedAngle;
      if (phase === "spin") {
        var spinProgress = Math.max(0, Math.min(1, (now - spinStart) / spinDuration));
        var spinEased = spinProgress * spinProgress * (3 - 2 * spinProgress);
        angle = spinFrom + (spinTo - spinFrom) * spinEased;
        if (spinProgress >= 1) {
          phase = "spot";
          spotStart = now;
          angle = spinTo;
        }
      } else if (phase === "spot") {
        angle = spinTo;
      }
      var tilt = -0.19;
      currentAngle = angle;
      var cosAngle = Math.cos(angle);
      var sinAngle = Math.sin(angle);
      var cosTilt = Math.cos(tilt);
      var sinTilt = Math.sin(tilt);

      for (var index = 0; index < points.length; index += 1) {
        if (globe && globe.ready()) break;
        var point = points[index];
        var rotatedX = point.x * cosAngle + point.z * sinAngle;
        var rotatedZ = -point.x * sinAngle + point.z * cosAngle;
        var tiltedX = rotatedX * cosTilt - point.y * sinTilt;
        var tiltedY = rotatedX * sinTilt + point.y * cosTilt;
        if (rotatedZ <= 0.015) continue;
        var depth = rotatedZ;
        var screenX = centerX + tiltedX * globeRadius;
        var screenY = centerY - tiltedY * globeRadius;
        var flow = 0.5 + 0.5 * Math.sin(now * 0.0014 + point.phase + tiltedX * 2.1 + tiltedY * 2.6);
        var red = Math.round(24 + 132 * flow);
        var green = Math.round(92 + 146 * flow);
        var blue = 255;
        var alpha = (0.22 + 0.78 * Math.pow(depth, 0.7)) * (0.78 + 0.22 * flow);
        var size = point.size * (0.55 + depth * 0.9);
        if (point.spark > 0.5) {
          context.globalAlpha = alpha * 0.2;
          context.fillStyle = "rgba(" + red + ", " + Math.min(255, green + 20) + ", " + blue + ", 1)";
          context.beginPath();
          context.arc(screenX, screenY, size * 4, 0, Math.PI * 2);
          context.fill();
        }
        context.globalAlpha = alpha;
        context.fillStyle = "rgb(" + red + ", " + green + ", " + blue + ")";
        context.beginPath();
        context.arc(screenX, screenY, Math.max(0.55, size), 0, Math.PI * 2);
        context.fill();
      }

      var rimCount = 360;
      for (var rimIndex = 0; rimIndex < rimCount; rimIndex += 1) {
        var rimAngle = (rimIndex / rimCount) * Math.PI * 2;
        var twinkle = 0.5 + 0.5 * Math.sin(now * 0.0024 + rimIndex * 1.7);
        var rimRadius = globeRadius + 1.2 + Math.sin(now * 0.0018 + rimIndex * 2.3) * 1.6;
        var rimX = centerX + Math.cos(rimAngle) * rimRadius;
        var rimY = centerY + Math.sin(rimAngle) * rimRadius;
        var rimAlpha = 0.38 + twinkle * 0.62;
        if (rimIndex % 3 === 0) {
          context.globalAlpha = rimAlpha * 0.18;
          context.fillStyle = "rgb(160, 230, 255)";
          context.beginPath();
          context.arc(rimX, rimY, 5 + twinkle * 3, 0, Math.PI * 2);
          context.fill();
        }
        context.globalAlpha = rimAlpha;
        context.fillStyle = twinkle > 0.55 ? "rgb(190, 240, 255)" : "rgb(88, 176, 255)";
        context.beginPath();
        context.arc(rimX, rimY, 1.1 + twinkle * 1.35, 0, Math.PI * 2);
        context.fill();
      }

      var haloCount = 90;
      for (var haloIndex = 0; haloIndex < haloCount; haloIndex += 1) {
        var haloAngle = (haloIndex / haloCount) * Math.PI * 2 + Math.sin(now * 0.0002) * 0.1;
        var haloRadius = globeRadius + 10 + Math.sin(now * 0.0011 + haloIndex) * 3;
        var haloAlpha = 0.12 + 0.2 * (0.5 + 0.5 * Math.sin(now * 0.0017 + haloIndex * 2.2));
        context.globalAlpha = haloAlpha;
        context.fillStyle = "rgb(120, 210, 255)";
        context.beginPath();
        context.arc(centerX + Math.cos(haloAngle) * haloRadius, centerY + Math.sin(haloAngle) * haloRadius, 1, 0, Math.PI * 2);
        context.fill();
      }

      if (phase === "spot") {
        if (!placeShown && targetLabel) {
          placeEl.textContent = targetLabel;
          placeEl.classList.add("is-visible");
          placeShown = true;
        }
        var point = targetPoint();
        var spotX = point.x * cosAngle + point.z * sinAngle;
        var spotZ = -point.x * sinAngle + point.z * cosAngle;
        var spotTiltedX = spotX * cosTilt - point.y * sinTilt;
        var spotTiltedY = spotX * sinTilt + point.y * cosTilt;
        var elapsed = Math.max(0, now - spotStart);
        if (spotZ > 0.02) {
          var screenSpotX = centerX + spotTiltedX * globeRadius;
          var screenSpotY = centerY - spotTiltedY * globeRadius;
          var pulse = 0.45 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(now * 0.013), 0.7);
          var halo = context.createRadialGradient(screenSpotX, screenSpotY, 0, screenSpotX, screenSpotY, 34);
          halo.addColorStop(0, "rgba(255, 196, 184, " + (0.8 * pulse) + ")");
          halo.addColorStop(0.22, "rgba(255, 70, 58, " + (0.65 * pulse) + ")");
          halo.addColorStop(0.58, "rgba(255, 38, 38, " + (0.22 * pulse) + ")");
          halo.addColorStop(1, "rgba(255, 0, 0, 0)");
          context.globalAlpha = 1;
          context.fillStyle = halo;
          context.beginPath();
          context.arc(screenSpotX, screenSpotY, 34, 0, Math.PI * 2);
          context.fill();
          context.globalAlpha = 0.9;
          context.fillStyle = "rgb(255, 88, 74)";
          context.beginPath();
          context.arc(screenSpotX, screenSpotY, 2.4 + pulse * 2.6, 0, Math.PI * 2);
          context.fill();
          var ringProgress = (elapsed % 1100) / 1100;
          context.globalAlpha = (1 - ringProgress) * 0.5 * pulse;
          context.strokeStyle = "rgb(255, 96, 82)";
          context.lineWidth = 1.4;
          context.beginPath();
          context.arc(screenSpotX, screenSpotY, 7 + ringProgress * 27, 0, Math.PI * 2);
          context.stroke();
        }
        if (elapsed >= 3000) skip();
      }

      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    }

    function renderGlobe() {
      if (!globe || !globe.ready()) return;
      globe.render(
        currentAngle,
        -0.19,
        window.innerWidth,
        window.innerHeight,
        Math.min(window.innerWidth, window.innerHeight) * 0.3
      );
    }

    function frame(now) {
      if (gone || leaving) return;
      draw(now);
      renderGlobe();
      frameHandle = requestAnimationFrame(frame);
    }

    function cleanup() {
      if (gone) return;
      gone = true;
      if (frameHandle !== 0) cancelAnimationFrame(frameHandle);
      if (skipTimer !== 0) clearTimeout(skipTimer);
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      frameHandle = 0;
      skipTimer = 0;
      resizeHandler = null;
      document.removeEventListener("keydown", onKeyDown, true);
      document.documentElement.classList.remove("dslg-splash-lock");
      overlay.remove();
      if (active !== null && active.overlay === overlay) active = null;
    }

    function skip() {
      if (gone || leaving) return;
      leaving = true;
      overlay.classList.add("is-leaving");
      if (skipTimer !== 0) {
        clearTimeout(skipTimer);
        skipTimer = 0;
      }
      var currentOpacity = 1;
      try {
        currentOpacity = parseFloat(window.getComputedStyle(overlay).opacity) || 0;
      } catch (error) {
        currentOpacity = 1;
      }
      overlay.style.animation = "none";
      overlay.style.opacity = String(currentOpacity);
      void overlay.offsetWidth;
      overlay.style.transition = "opacity 300ms ease";
      overlay.style.opacity = "0";
      skipTimer = setTimeout(cleanup, 330);
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        skip();
      }
    }

    resize();
    resizeHandler = resize;
    window.addEventListener("resize", resizeHandler);
    skipButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      skip();
    });
    overlay.addEventListener("click", skip);
    document.addEventListener("keydown", onKeyDown, true);

    if (reducedMotion) {
      draw(performance.now());
      renderGlobe();
    } else {
      frameHandle = requestAnimationFrame(frame);
    }
    skipTimer = setTimeout(skip, 16000);
    dslgFetchGeo().then(function (geo) {
      beginSpin(geo);
    }).catch(function () {
      beginSpin(dslgGeoFallback());
    });

    active = {
      overlay: overlay,
      cleanup: cleanup,
      skip: skip,
    };
  }

  function disposeActive() {
    if (active !== null) {
      var current = active;
      active = null;
      current.cleanup();
    }
  }

  return {
    play: play,
    dispose: disposeActive,
    isActive: function () {
      return active !== null;
    },
  };
}

/* --------------------------------------------------------------------------
   Dynamic Island
   A compact glass pill at the top of the conversation column. Collapsed it
   shows only a state dot; expanded it carries the conversation title, mode,
   tabs and the Liquid Glass settings shortcut.
   -------------------------------------------------------------------------- */

function createDynamicIsland(store, splash, ctx) {
  if (!document.body) return { dispose: function () {} };

  var host = document.createElement("div");
  host.className = "dslg-island";
  host.setAttribute("role", "button");
  host.setAttribute("tabindex", "0");
  host.setAttribute("aria-expanded", "false");
  host.setAttribute("aria-label", "灵动岛，当前空闲");
  host.innerHTML = [
    '<span class="dslg-island__dot" aria-hidden="true"></span>',
    '<div class="dslg-island__content">',
    '  <div class="dslg-island__top">',
    '    <div class="dslg-island__heading">',
    '      <span class="dslg-island__title">DSH</span>',
    '      <span class="dslg-island__mode">标准模式</span>',
    '    </div>',
    '    <button class="dslg-island__projects" type="button">工作区</button>',
    '    <button class="dslg-island__gear" type="button" aria-label="液态玻璃设置">',
    '      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm8.1 4.9v-2.2l-2.1-.8a7.2 7.2 0 0 0-.7-1.7l1-2-1.6-1.6-2 1a7.2 7.2 0 0 0-1.7-.7L12.2 3H10l-.8 2.1a7.2 7.2 0 0 0-1.7.7l-2-1-1.6 1.6 1 2a7.2 7.2 0 0 0-.7 1.7l-2.1.8v2.2l2.1.8c.2.6.4 1.2.7 1.7l-1 2 1.6 1.6 2-1c.5.3 1.1.5 1.7.7l.8 2.1h2.2l.8-2.1c.6-.2 1.2-.4 1.7-.7l2 1 1.6-1.6-1-2c.3-.5.5-1.1.7-1.7l2.1-.8Z"/></svg>',
    '      <span>液态玻璃设置</span>',
    '    </button>',
    '  </div>',
    '  <div class="dslg-island__tabs" role="tablist" aria-label="会话视图">',
    '    <button class="dslg-island__tab is-active" type="button" data-dslg-tab="对话">对话</button>',
    '    <button class="dslg-island__tab" type="button" data-dslg-tab="轨迹">轨迹</button>',
    '    <button class="dslg-island__more" type="button" aria-label="更多">…</button>',
    '  </div>',
    '  <div class="dslg-island__meta">',
    '    <span class="dslg-island__time">00:00:00</span>',
    '    <span class="dslg-island__balance">余额 —</span>',
    '    <span class="dslg-island__context">上下文 —</span>',
    '  </div>',
    '</div>',
  ].join("");
  document.body.appendChild(host);

  var panel = document.createElement("div");
  panel.className = "dslg-island-panel";
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = [
    '<div class="dslg-island-panel__head">',
    '  <span>液态玻璃</span>',
    '  <button class="dslg-island-panel__close" type="button" aria-label="关闭">×</button>',
    '</div>',
    '<div class="dslg-island-panel__body">',
    '  <div class="dslg-island-panel__section">',
    '    <div class="dslg-island-panel__line"><span>玻璃强度</span><strong class="dslg-island-panel__value">62%</strong></div>',
    '    <input class="dslg-island-panel__range" type="range" min="0" max="100" step="1" aria-label="玻璃强度">',
    '    <div class="dslg-island-panel__presets">',
    '      <button type="button" data-preset="0">关闭</button>',
    '      <button type="button" data-preset="35">轻</button>',
    '      <button type="button" data-preset="65">中</button>',
    '      <button type="button" data-preset="100">强</button>',
    '    </div>',
    '  </div>',
    '  <div class="dslg-island-panel__section">',
    '    <div class="dslg-island-panel__caption">作用范围</div>',
    '    <div class="dslg-island-panel__scope">',
    '      <div class="dslg-island-panel__scope-row"><div><b>输入框卡片</b><small>输入卡、+ 与访问模式</small></div><button type="button" role="switch" data-surface="composer" aria-checked="true"><span></span></button></div>',
    '      <div class="dslg-island-panel__scope-row"><div><b>左侧栏控件</b><small>会话行、工作区、图标按钮</small></div><button type="button" role="switch" data-surface="sidebar" aria-checked="true"><span></span></button></div>',
    '      <div class="dslg-island-panel__scope-row"><div><b>模型选择器</b><small>输入框内的模型触发器</small></div><button type="button" role="switch" data-surface="model" aria-checked="true"><span></span></button></div>',
    '      <div class="dslg-island-panel__scope-row"><div><b>发送按钮</b><small>发送与停止按钮</small></div><button type="button" role="switch" data-surface="send" aria-checked="true"><span></span></button></div>',
    '    </div>',
    '  </div>',
    '  <div class="dslg-island-panel__line dslg-island-panel__splash">',
    '    <div><b>开屏动效</b><small>旋转地球、IP 红点与跳过按钮</small></div>',
    '    <button type="button" role="switch" class="dslg-island-panel__splash-switch" aria-checked="true"><span></span></button>',
    '  </div>',
    '  <div class="dslg-island-panel__section">',
    '    <div class="dslg-island-panel__caption">高德定位</div>',
    '    <input class="dslg-island-panel__amap" type="text" autocomplete="off" spellcheck="false" placeholder="高德 Web 服务 Key（可选）">',
    '    <small class="dslg-island-panel__note">用于 IP 定位与城市反查，仅保存在本机。未填写时使用 IP 服务/系统时区估算。</small>',
    '  </div>',
    '</div>',
  ].join("");
  document.body.appendChild(panel);

  var projectModal = document.createElement("div");
  projectModal.className = "dslg-project-modal dslg-carousel";
  projectModal.setAttribute("aria-hidden", "true");
  projectModal.innerHTML = [
    '<div class="dslg-carousel__head">',
    '  <button class="dslg-carousel__back" type="button" aria-label="返回">‹</button>',
    '  <span class="dslg-carousel__title">工作区</span>',
    '  <button class="dslg-carousel__close" type="button" aria-label="关闭">×</button>',
    '</div>',
    '<div class="dslg-carousel__stage">',
    '  <button class="dslg-carousel__nav dslg-carousel__prev" type="button" aria-label="上一个">‹</button>',
    '  <div class="dslg-carousel__track"></div>',
    '  <button class="dslg-carousel__nav dslg-carousel__next" type="button" aria-label="下一个">›</button>',
    '</div>',
    '<div class="dslg-carousel__foot">',
    '  <span class="dslg-carousel__counter">1 / 1</span>',
    '  <span class="dslg-carousel__hint">滚轮或拖动切换</span>',
    '</div>',
    '<div class="dslg-task-list"></div>',
  ].join("");
  document.body.appendChild(projectModal);
  var panelOpen = false;

  var dot = host.querySelector(".dslg-island__dot");
  var titleEl = host.querySelector(".dslg-island__title");
  var modeEl = host.querySelector(".dslg-island__mode");
  var gear = host.querySelector(".dslg-island__gear");
  var more = host.querySelector(".dslg-island__more");
  var timeEl = host.querySelector(".dslg-island__time");
  var balanceEl = host.querySelector(".dslg-island__balance");
  var contextEl = host.querySelector(".dslg-island__context");
  var tabButtons = Array.prototype.slice.call(host.querySelectorAll("[data-dslg-tab]"));
  var panelRange = panel.querySelector(".dslg-island-panel__range");
  var panelValue = panel.querySelector(".dslg-island-panel__value");
  var panelPresets = Array.prototype.slice.call(panel.querySelectorAll("[data-preset]"));
  var panelSurfaces = Array.prototype.slice.call(panel.querySelectorAll("[data-surface]"));
  var panelSplash = panel.querySelector(".dslg-island-panel__splash-switch");
  var panelClose = panel.querySelector(".dslg-island-panel__close");
  var panelAmap = panel.querySelector(".dslg-island-panel__amap");
  var projectsButton = host.querySelector(".dslg-island__projects");
  var projectBack = projectModal.querySelector(".dslg-carousel__back");
  var projectClose = projectModal.querySelector(".dslg-carousel__close");
  var projectTitle = projectModal.querySelector(".dslg-carousel__title");
  var projectTrack = projectModal.querySelector(".dslg-carousel__track");
  var projectStage = projectModal.querySelector(".dslg-carousel__stage");
  var projectPrev = projectModal.querySelector(".dslg-carousel__prev");
  var projectNext = projectModal.querySelector(".dslg-carousel__next");
  var projectCounter = projectModal.querySelector(".dslg-carousel__counter");
  var projectHint = projectModal.querySelector(".dslg-carousel__hint");
  var projectTaskList = projectModal.querySelector(".dslg-task-list");
  var projectItems = [];
  var projectIndex = 0;
  var wheelAt = 0;
  var dragState = null;
  var dragSuppress = 0;
  var projectLoading = false;
  var projectLoadTimer = 0;
  var liveBalance = { text: "—", at: 0, busy: false };
  var projectOpen = false;
  var projectView = "workspaces";
  var currentWorkspace = "";
  var currentWorkspaceId = "";
  var isOpen = false;
  var isBusy = false;
  var hiddenHeader = null;
  var headerVisibility = "";
  var pollTimer = 0;
  var headerTimer = 0;
  var metaTimer = 0;
  var settingTimers = [];
  var unsubscribePanel = null;

  function visible(element) {
    return !!element && element.getClientRects().length > 0;
  }

  function textOf(element) {
    return element ? (element.textContent || "").replace(/\s+/g, " ").trim() : "";
  }

  function insideHost(node) {
    return !!node && (node === host || host.contains(node));
  }

  function findHeader() {
    var candidates = Array.prototype.slice.call(document.querySelectorAll('button, [role="tab"]'))
      .filter(function (node) {
        return !insideHost(node) && visible(node) && (textOf(node) === "对话" || textOf(node) === "轨迹");
      });
    for (var index = 0; index < candidates.length; index += 1) {
      var node = candidates[index];
      for (var depth = 0; depth < 6 && node.parentElement; depth += 1) {
        node = node.parentElement;
        if (insideHost(node)) break;
        if (node.querySelector("[data-composer-card]")) break;
        var text = textOf(node);
        if (text.length > 400) break;
        if (text.indexOf("标准模式") >= 0 && text.indexOf("对话") >= 0 && text.indexOf("轨迹") >= 0) {
          return node;
        }
      }
    }
    return null;
  }

  function cleanTitle(value) {
    return value
      .replace(/^[\s◌●•·…⋯]+/, "")
      .replace(/(?:[\s⋯.]*(?:刚刚|昨天|今天|\d{1,2}:\d{2}))+[\s⋯.]*$/g, "")
      .replace(/[\s⋯.]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function readTitle(header) {
    if (header) {
      var headings = Array.prototype.slice.call(header.querySelectorAll("h1, h2, h3, [class*='title'], [class*='Title']"))
        .filter(function (node) {
          if (!visible(node)) return false;
          if (node.children.length > 0 && !/^H[1-3]$/i.test(node.tagName)) return false;
          var value = cleanTitle(textOf(node));
          if (!value || value.length < 2 || value.length > 90) return false;
          if (/刚刚|昨天|今天|\d{1,2}:\d{2}|⋯/.test(value)) return false;
          return true;
        })
        .sort(function (a, b) { return textOf(a).length - textOf(b).length; });
      if (headings.length) return cleanTitle(textOf(headings[0]));
    }
    var rows = Array.prototype.slice.call(document.querySelectorAll("[data-row-key]"));
    for (var index = 0; index < rows.length; index += 1) {
      var row = rows[index];
      var cls = String(row.className || "");
      if (visible(row) && (/active|selected|current/i.test(cls) || row.getAttribute("aria-current") === "page" || row.getAttribute("aria-selected") === "true")) {
        var value = cleanTitle(textOf(row));
        if (value.length >= 2 && value.length <= 90) return value;
      }
    }
    var docTitle = cleanTitle(document.title || "");
    if (docTitle && !/deepseek harness|dsh/i.test(docTitle)) return docTitle;
    return "DSH";
  }

  function readMode(header) {
    var root = header || document;
    var nodes = Array.prototype.slice.call(root.querySelectorAll("button, span, [role='button']"));
    for (var index = 0; index < nodes.length; index += 1) {
      var node = nodes[index];
      if (insideHost(node) || !visible(node)) continue;
      var value = textOf(node);
      if (value.length <= 12 && /模式$/.test(value) && node.children.length === 0) return value;
    }
    return "标准模式";
  }

  function realTab(label) {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('button, [role="tab"], a'));
    for (var index = 0; index < nodes.length; index += 1) {
      if (!insideHost(nodes[index]) && visible(nodes[index]) && textOf(nodes[index]) === label) return nodes[index];
    }
    return null;
  }

  function updateHeader() {
    var header = findHeader();
    titleEl.textContent = readTitle(header);
    modeEl.textContent = readMode(header);
    var activeLabel = "对话";
    var realTabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"], button'))
      .filter(function (node) {
        return !insideHost(node) && visible(node) && (textOf(node) === "对话" || textOf(node) === "轨迹");
      });
    for (var index = 0; index < realTabs.length; index += 1) {
      if (realTabs[index].getAttribute("aria-selected") === "true" || /active|selected/i.test(String(realTabs[index].className || ""))) {
        activeLabel = textOf(realTabs[index]);
        break;
      }
    }
    tabButtons.forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-dslg-tab") === activeLabel);
    });
  }

  function busyNow() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(
      '[data-state="running"], [data-thinking="true"], [class*="thinking"], [class*="Thinking"], [class*="reason"], [class*="Reason"]'
    ));
    for (var index = 0; index < nodes.length; index += 1) {
      var node = nodes[index];
      if (insideHost(node) || !visible(node)) continue;
      var state = (
        (node.getAttribute("aria-label") || "") + " " +
        (node.getAttribute("title") || "") + " " +
        (node.getAttribute("data-state") || "") + " " +
        (node.textContent || "") + " " +
        String(node.className || "")
      ).toLowerCase();
      if (/kema|reason|think|思考|推理/.test(state)) return true;
    }
    return false;
  }

  function updateBusy() {
    var next = busyNow();
    if (next === isBusy) return;
    isBusy = next;
    host.classList.toggle("is-busy", isBusy);
    host.setAttribute("data-busy", isBusy ? "true" : "false");
    host.setAttribute("aria-label", isBusy ? "灵动岛，DSH 正在思考" : "灵动岛，当前空闲");
  }

  function overlapsIsland(node) {
    if (!node || insideHost(node) || panel.contains(node)) return false;
    if (!visible(node)) return false;
    var style = window.getComputedStyle(node);
    if (style.position !== "fixed" && style.position !== "absolute") return false;
    var zIndex = parseInt(style.zIndex, 10) || 0;
    if (zIndex < 100 && !node.matches('[role="dialog"], [role="alertdialog"], [role="menu"], [data-radix-popper-content-wrapper], .dslg-splash')) return false;
    var other = node.getBoundingClientRect();
    var own = host.getBoundingClientRect();
    if (other.width < 2 || other.height < 2) return false;
    var isPopup = node.matches('[role="dialog"], [role="alertdialog"], [role="menu"], [data-radix-popper-content-wrapper], .dslg-splash');
    if (!isPopup && other.width * other.height < window.innerWidth * window.innerHeight * 0.25) return false;
    var margin = 8;
    return !(
      other.right < own.left - margin ||
      other.left > own.right + margin ||
      other.bottom < own.top - margin ||
      other.top > own.bottom + margin
    );
  }

  function updateConflict() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(
      '[role="dialog"], [role="alertdialog"], [role="menu"], [data-radix-popper-content-wrapper], [class*="mask"], [class*="Mask"], [class*="overlay"], [class*="Overlay"], .dslg-splash'
    ));
    var conflict = false;
    for (var index = 0; index < nodes.length; index += 1) {
      if (overlapsIsland(nodes[index])) {
        conflict = true;
        break;
      }
    }
    if (conflict === host.classList.contains("is-conflicted")) return;
    host.classList.toggle("is-conflicted", conflict);
    if (conflict) {
      closePanel();
      closeProjects();
    }
  }

  function matchContextText(text) {
    if (!text || text.length > 60) return "";
    var match = text.match(/~?\s*[\d.,]+\s*[KMGkmg]?\s*\/\s*[\d.,]+\s*[KMGkmg]?/);
    return match ? match[0].replace(/\s+/g, " ") : "";
  }

  function percentFromText(text) {
    if (!text || text.length > 80) return "";
    var match = text.match(/(?:上下文|context)[^%]{0,24}?(\d{1,3})\s*%/i) ||
      text.match(/(\d{1,3})\s*%[^%]{0,24}?(?:上下文|context)/i);
    if (match) {
      var value = Number(match[1]);
      if (value >= 0 && value <= 100) return value + "%";
    }
    return "";
  }

  function parseCompact(value, unit) {
    var number = Number(String(value).replace(/,/g, ""));
    if (!isFinite(number)) return 0;
    var suffix = String(unit || "").toUpperCase();
    if (suffix === "K") return number * 1000;
    if (suffix === "M") return number * 1000000;
    if (suffix === "G") return number * 1000000000;
    return number;
  }

  function readContextUsage() {
    var data = workspaceSnapshots();
    if (data && data.sessions && data.sessions.current) {
      var summary = data.sessions.byId ? data.sessions.byId[data.sessions.current] : null;
      var pressure = summary && summary.projectionValues ? summary.projectionValues.contextPressure : null;
      if (pressure) {
        var usedTokens = pressure.projectedTokens !== undefined ? pressure.projectedTokens : pressure.pressureTokens;
        var contextWindow = pressure.contextWindow;
        if (usedTokens !== undefined && contextWindow > 0) {
          return Math.min(100, Math.round(usedTokens / contextWindow * 100)) + "%";
        }
      }
    }
    var labelled = Array.prototype.slice.call(document.querySelectorAll('button[aria-label*="%"], [aria-label*="上下文"], [aria-label*="context" i]'));
    for (var labelIndex = 0; labelIndex < labelled.length; labelIndex += 1) {
      var labelNode = labelled[labelIndex];
      if (insideHost(labelNode) || !visible(labelNode)) continue;
      var percent = percentFromText(labelNode.getAttribute("aria-label") || "") || percentFromText(labelNode.getAttribute("title") || "");
      if (percent) return percent;
    }
    var roots = Array.prototype.slice.call(document.querySelectorAll('[class*="context" i], [class*="Context"], [class*="meter" i], [data-context-usage]'));
    for (var rootIndex = 0; rootIndex < roots.length; rootIndex += 1) {
      var root = roots[rootIndex];
      if (!root || insideHost(root) || !visible(root)) continue;
      var text = textOf(root);
      var direct = percentFromText(text);
      if (direct) return direct;
      var plain = text.match(/(?:^|\s)(\d{1,3})\s*%(?:\s|$)/);
      if (plain) {
        var plainValue = Number(plain[1]);
        if (plainValue >= 0 && plainValue <= 100) return plainValue + "%";
      }
    }
    var pair = "";
    for (var pairIndex = 0; pairIndex < roots.length && !pair; pairIndex += 1) {
      var pairNode = roots[pairIndex];
      if (!pairNode || insideHost(pairNode) || !visible(pairNode)) continue;
      var pairText = matchContextText(textOf(pairNode));
      if (pairText) pair = pairText;
    }
    if (!pair) {
      var composer = document.querySelector("[data-composer-card]");
      if (composer && composer.parentElement) {
        var parentText = matchContextText(textOf(composer.parentElement));
        if (parentText) pair = parentText;
      }
    }
    if (pair) {
      var figures = pair.replace(/~/g, "").split("/");
      if (figures.length === 2) {
        var usedMatch = figures[0].match(/([\d.,]+)\s*([KMGkmg]?)/);
        var totalMatch = figures[1].match(/([\d.,]+)\s*([KMGkmg]?)/);
        if (usedMatch && totalMatch) {
          var used = parseCompact(usedMatch[1], usedMatch[2]);
          var total = parseCompact(totalMatch[1], totalMatch[2]);
          if (total > 0) return Math.min(100, Math.round(used / total * 100)) + "%";
        }
      }
    }
    return "—";
  }

  function readBalance() {
    var candidates = document.querySelectorAll('[class*="balance"], [class*="Balance"], [aria-label*="余额"], [aria-label*="balance" i]');
    for (var index = 0; index < candidates.length; index += 1) {
      var node = candidates[index];
      if (insideHost(node) || !visible(node)) continue;
      var text = textOf(node);
      if (text.length <= 30 && /[¥$]\s?[\d.,]+|余额/.test(text)) return text;
    }
    return "—";
  }

  function updateMeta() {
    if (timeEl) timeEl.textContent = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    refreshBalance();
    var balance = liveBalance.text !== "—" ? liveBalance.text : readBalance();
    if (balanceEl) balanceEl.textContent = "余额 " + balance;
    if (contextEl) contextEl.textContent = "上下文 " + readContextUsage();
  }

  function place() {
    var composer = document.querySelector("[data-composer-card]");
    var center = window.innerWidth / 2;
    if (composer) {
      var rect = composer.getBoundingClientRect();
      if (rect.width > 0) center = rect.left + rect.width / 2;
    }
    var half = (isOpen ? Math.min(window.innerWidth * 0.92, 680) : 188.98) / 2;
    var left = Math.max(half + 12, Math.min(window.innerWidth - half - 12, center));
    host.style.left = Math.round(left) + "px";
  }

  function restoreHeader() {
    if (hiddenHeader) {
      hiddenHeader.style.visibility = headerVisibility;
      hiddenHeader = null;
      headerVisibility = "";
    }
  }

  function setOpen(next) {
    if (next === isOpen) return;
    isOpen = next;
    host.classList.toggle("is-open", isOpen);
    host.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (isOpen) {
      updateHeader();
      hiddenHeader = findHeader();
      if (hiddenHeader && !hiddenHeader.contains(host)) {
        headerVisibility = hiddenHeader.style.visibility;
        hiddenHeader.style.visibility = "hidden";
      }
    } else {
      restoreHeader();
    }
    place();
  }

  function onHostClick(event) {
    if (event.target.closest("button")) return;
    setOpen(!isOpen);
  }

  function renderPanel() {
    var snapshot = store.getSnapshot();
    if (panelRange) {
      panelRange.value = String(snapshot.level);
      panelRange.style.setProperty("--dslg-fill", snapshot.level + "%");
    }
    if (panelValue) panelValue.textContent = snapshot.level + "%";
    var activePreset = snapshot.level <= 0 ? 0 : snapshot.level <= 30 ? 35 : snapshot.level <= 70 ? 65 : 100;
    panelPresets.forEach(function (button) {
      button.classList.toggle("is-active", Number(button.getAttribute("data-preset")) === activePreset);
    });
    panelSurfaces.forEach(function (button) {
      var key = button.getAttribute("data-surface");
      var on = snapshot.surfaces[key] !== false;
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-checked", on ? "true" : "false");
    });
    if (panelSplash) {
      panelSplash.classList.toggle("is-on", snapshot.splashEnabled);
      panelSplash.setAttribute("aria-checked", snapshot.splashEnabled ? "true" : "false");
    }
  }

  function placePanel() {
    if (!panelOpen) return;
    var rect = host.getBoundingClientRect();
    var width = Math.min(window.innerWidth - 24, 430);
    panel.style.width = width + "px";
    var left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + rect.width / 2 - width / 2));
    panel.style.left = Math.round(left) + "px";
    panel.style.top = Math.round(rect.bottom + 10) + "px";
  }

  function togglePanel(next) {
    var value = typeof next === "boolean" ? next : !panelOpen;
    if (value === panelOpen) return;
    panelOpen = value;
    panel.classList.toggle("is-on", panelOpen);
    panel.setAttribute("aria-hidden", panelOpen ? "false" : "true");
    if (panelOpen) {
      renderPanel();
      placePanel();
    }
  }

  function closePanel() {
    togglePanel(false);
  }

  function service(name) {
    try {
      return (ctx && typeof ctx.get === "function" ? ctx.get(name) : undefined) || (ctx ? ctx[name] : undefined);
    } catch (error) {
      return ctx ? ctx[name] : undefined;
    }
  }

  function workspaceSnapshots() {
    var workspaceService = service("workspaces");
    var sessionService = service("sessions");
    if (!workspaceService || !workspaceService.list) return null;
    var workspaceSnapshot;
    try {
      workspaceSnapshot = workspaceService.list.getSnapshot();
    } catch (error) {
      return null;
    }
    if (!workspaceSnapshot || !Array.isArray(workspaceSnapshot.items)) return null;
    var sessionSnapshot = null;
    try {
      sessionSnapshot = sessionService && sessionService.list ? sessionService.list.getSnapshot() : null;
    } catch (error) {
      sessionSnapshot = null;
    }
    return { workspaces: workspaceSnapshot.items, sessions: sessionSnapshot, workspaceService: workspaceService, sessionService: sessionService };
  }

  function sidebarRoot() {
    return document.querySelector('[class*="_sidebarCol"]') || document.body;
  }

  function rowText(node) {
    return textOf(node).replace(/\s+\d{1,2}:\d{2}$/, "").replace(/\s+(刚刚|昨天|今天)$/, "").trim();
  }

  function collectWorkspaces() {
    var data = workspaceSnapshots();
    if (data) {
      return data.workspaces.map(function (workspace) {
        var name = workspace.title || String(workspace.path || "").split(/[\\/]/).filter(Boolean).pop() || "工作区";
        return {
          text: name,
          workspaceId: workspace.workspaceId,
          target: null,
        };
      });
    }
    var root = sidebarRoot();
    var nodes = Array.prototype.slice.call(root.querySelectorAll('[data-row-key], [class*="workspace" i], [class*="project" i]'));
    var seen = new Set();
    var out = [];
    nodes.forEach(function (node) {
      if (insideHost(node) || !visible(node)) return;
      var key = node.getAttribute("data-row-key") || "";
      if (/^session[:_-]/i.test(key)) return;
      var text = rowText(node);
      if (!text || text.length > 60 || /新会话|新建会话|^工作区$/.test(text)) return;
      var target = node.closest("button, [role='button'], a") || node;
      if (seen.has(text)) return;
      seen.add(text);
      out.push({ text: text, target: target });
    });
    if (out.length === 0) {
      nodes = Array.prototype.slice.call(root.querySelectorAll('[class*="workspace" i] button, [class*="workspace" i] [role="button"]'));
      nodes.forEach(function (node) {
        if (insideHost(node) || !visible(node)) return;
        var text = rowText(node);
        if (!text || text.length > 60 || seen.has(text) || text === "新会话") return;
        seen.add(text);
        out.push({ text: text, target: node });
      });
    }
    if (out.length === 0) {
      nodes = Array.prototype.slice.call(root.querySelectorAll('[role="treeitem"][aria-expanded]'));
      nodes.forEach(function (node) {
        if (insideHost(node) || !visible(node) || /sessionRow/i.test(String(node.className || ""))) return;
        var text = rowText(node);
        if (!text || text.length > 60 || seen.has(text) || /^工作区$|新会话|新建会话/.test(text)) return;
        seen.add(text);
        out.push({ text: text, target: node });
      });
    }
    return out;
  }

  function collectSessions() {
    var data = workspaceSnapshots();
    if (data && currentWorkspaceId && data.sessions) {
      var workspace = data.workspaces.filter(function (item) { return item.workspaceId === currentWorkspaceId; })[0];
      if (workspace) {
        var ids = Array.isArray(workspace.sessionIds) ? workspace.sessionIds.slice() : [];
        if (ids.length === 0) {
          ids = Object.keys(data.sessions.byId || {}).filter(function (id) {
            return data.sessions.byId[id] && data.sessions.byId[id].cwd === workspace.path;
          });
        }
        var rows = [];
        ids.forEach(function (id) {
          var summary = data.sessions.byId ? data.sessions.byId[id] : null;
          if (!summary || summary.blank) return;
          var title = summary.displayTitle || summary.title || id;
          rows.push({ text: title, sessionId: id, target: null });
        });
        return rows;
      }
    }
    var root = sidebarRoot();
    var nodes = Array.prototype.slice.call(root.querySelectorAll('[class*="sessionRow"], [data-row-key]'));
    var seen = new Set();
    var out = [];
    nodes.forEach(function (node) {
      if (insideHost(node) || !visible(node)) return;
      var key = node.getAttribute("data-row-key") || "";
      var isSessionRow = /sessionRow/i.test(String(node.className || ""));
      if (!isSessionRow && key && !/^session[:_-]/i.test(key)) return;
      var text = rowText(node);
      if (!text || seen.has(text) || /新会话|新建会话|^工作区$/.test(text)) return;
      seen.add(text);
      out.push({ text: text, target: node.closest('[class*="sessionRow"]') || node.closest("button, [role='button'], a") || node });
    });
    if (out.length === 0) {
      nodes = Array.prototype.slice.call(root.querySelectorAll('[role="treeitem"]'));
      nodes.forEach(function (node) {
        if (insideHost(node) || !visible(node) || /projectRow/i.test(String(node.className || ""))) return;
        var text = rowText(node);
        if (!text || seen.has(text) || text === currentWorkspace || /新会话|新建会话|^工作区$/.test(text)) return;
        seen.add(text);
        out.push({ text: text, target: node });
      });
    }
    return out;
  }

  function projectStep() {
    return window.innerWidth < 720 ? 92 : 138;
  }

  function layoutProjects() {
    var cards = Array.prototype.slice.call(projectTrack.children);
    var total = cards.length;
    if (total === 0) return;
    var half = total / 2;
    var isTasks = projectView === "tasks";
    var step = isTasks ? (window.innerHeight < 720 ? 72 : 88) : projectStep();
    cards.forEach(function (card, index) {
      var offset = index - projectIndex;
      if (offset > half) offset -= total;
      if (offset < -half) offset += total;
      var distance = Math.abs(offset);
      var x = isTasks ? 0 : offset * step;
      var y = isTasks ? offset * step : 0;
      card.style.transform = "translate(-50%, -50%) translateX(" + x + "px) translateY(" + y + "px) translateZ(" +
        (distance === 0 ? 72 : -distance * 76) + "px) " +
        (isTasks ? "rotateX(" + (-offset * 28) + "deg)" : "rotateY(" + (-offset * 30) + "deg)") +
        " scale(" + Math.max(0.62, 1 - distance * 0.16) + ")";
      card.style.opacity = distance > 2 ? "0" : String(1 - distance * 0.22);
      card.style.pointerEvents = distance > 2 ? "none" : "auto";
      card.style.zIndex = String(20 - distance);
      card.classList.toggle("is-active", distance === 0);
      card.setAttribute("aria-hidden", distance === 0 ? "false" : "true");
    });
    if (projectCounter) projectCounter.textContent = (projectIndex + 1) + " / " + total;
  }

  function activateProject(item) {
    if (item.isNew) {
      if (projectView === "tasks") onNewTask();
      else onNewWorkspace();
      closeProjects();
      return;
    }
    if (item.workspaceId) {
      currentWorkspaceId = item.workspaceId;
      currentWorkspace = item.text;
      projectView = "tasks";
      projectIndex = 0;
      projectLoading = false;
      renderProjects();
      placeProjectModal();
      return;
    }
    if (item.sessionId) {
      var ui = service("uiWorkspace");
      if (ui && typeof ui.openSession === "function") ui.openSession(item.sessionId);
      closeProjects();
      return;
    }
    if (projectView === "workspaces") {
      var row = item.target.closest('[class*="projectRow"]') || item.target;
      if (!row.matches('[class*="projectRow"]')) {
        var candidates = Array.prototype.slice.call(document.querySelectorAll('[class*="projectRow"]')).filter(function (node) {
          return !insideHost(node) && visible(node) && rowText(node) === item.text;
        });
        if (candidates.length) row = candidates[0];
      }
      if (row.getAttribute("aria-expanded") !== "true") row.click();
      currentWorkspace = item.text;
      projectView = "tasks";
      projectIndex = 0;
      projectLoading = false;
      renderProjects();
      placeProjectModal();
      window.setTimeout(function () {
        if (projectOpen && projectView === "tasks") renderProjects();
      }, 600);
    } else {
      item.target.click();
      closeProjects();
    }
  }

  function moveProjects(delta) {
    var total = projectItems.length;
    if (total === 0) return;
    projectIndex = (projectIndex + delta + total) % total;
    layoutProjects();
  }

  function onProjectWheel(event) {
    if (!projectOpen) return;
    event.preventDefault();
    var now = Date.now();
    if (now - wheelAt < 110) return;
    wheelAt = now;
    moveProjects(event.deltaY > 0 ? 1 : -1);
  }

  function onProjectPointerDown(event) {
    if (!projectOpen || event.button !== 0) return;
    if (event.target.closest(".dslg-carousel__nav, .dslg-carousel__back, .dslg-carousel__close")) return;
    dragState = { x: event.clientX, y: event.clientY, moved: false, captured: false, id: event.pointerId };
  }

  function onProjectPointerMove(event) {
    if (!dragState) return;
    var delta = projectView === "tasks" ? event.clientY - dragState.y : event.clientX - dragState.x;
    if (Math.abs(delta) > 7) {
      dragState.moved = true;
      if (!dragState.captured) {
        try {
          projectStage.setPointerCapture(dragState.id);
          dragState.captured = true;
        } catch (error) {
          /* Pointer capture may be unavailable. */
        }
      }
    }
  }

  function onProjectPointerUp(event) {
    if (!dragState) return;
    var delta = projectView === "tasks" ? event.clientY - dragState.y : event.clientX - dragState.x;
    var moved = dragState.moved;
    var captured = dragState.captured;
    dragState = null;
    if (captured) {
      try {
        projectStage.releasePointerCapture(event.pointerId);
      } catch (error) {
        /* Pointer capture may be unavailable. */
      }
    }
    if (moved) {
      dragSuppress = Date.now() + 360;
      moveProjects(delta > 0 ? -1 : 1);
    }
  }

  function renderProjects() {
    if (!projectOpen) return;
    var isTasks = projectView === "tasks";
    projectModal.classList.toggle("is-tasks", isTasks);
    projectTitle.textContent = isTasks ? (currentWorkspace || "任务") : "工作区";
    projectBack.classList.toggle("is-visible", isTasks);
    projectTrack.innerHTML = "";
    projectTaskList.innerHTML = "";
    projectItems = (isTasks ? collectSessions() : collectWorkspaces()).slice();
    projectItems.push({ isNew: true, text: isTasks ? "＋ 新建任务" : "＋ 新建工作区" });
    if (projectIndex >= projectItems.length) projectIndex = 0;
    projectItems.forEach(function (item, index) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "dslg-carousel__card" + (item.isNew ? " is-new" : "");
      card.innerHTML = "<strong></strong><small></small>";
      card.querySelector("strong").textContent = item.text;
      card.querySelector("small").textContent = item.isNew
        ? (isTasks ? "创建新任务" : "创建新工作区")
        : (isTasks ? "打开任务" : "切换工作区");
      card.addEventListener("click", function () {
        if (Date.now() < dragSuppress) return;
        projectIndex = index;
        layoutProjects();
        activateProject(item);
      });
      projectTrack.appendChild(card);
    });
    if (projectHint) projectHint.textContent = isTasks ? "滚轮或上下拖动切换" : "滚轮或左右拖动切换";
    layoutProjects();
    placeProjectModal();
  }

  function placeProjectModal() {
    if (!projectOpen) return;
    var width = Math.min(window.innerWidth - 24, 680);
    var islandRect = host.getBoundingClientRect();
    projectModal.style.width = width + "px";
    projectModal.style.left = Math.round(Math.max(12, Math.min(window.innerWidth - width - 12, window.innerWidth / 2 - width / 2))) + "px";
    projectModal.style.top = Math.round(Math.min(window.innerHeight * 0.34, islandRect.bottom + 10)) + "px";
  }

  function toggleProjects(next) {
    var value = typeof next === "boolean" ? next : !projectOpen;
    if (value === projectOpen) return;
    projectOpen = value;
    projectModal.classList.toggle("is-on", projectOpen);
    projectModal.setAttribute("aria-hidden", projectOpen ? "false" : "true");
    if (!projectOpen) {
      if (projectLoadTimer !== 0) clearInterval(projectLoadTimer);
      projectLoadTimer = 0;
      projectLoading = false;
    }
    if (projectOpen) {
      closePanel();
      projectView = "workspaces";
      projectIndex = 0;
      currentWorkspace = "";
      currentWorkspaceId = "";
      renderProjects();
    }
  }

  function closeProjects() {
    toggleProjects(false);
  }

  function findSidebarButton(pattern) {
    var root = sidebarRoot();
    var buttons = Array.prototype.slice.call(root.querySelectorAll("button, [role='button']"));
    for (var index = 0; index < buttons.length; index += 1) {
      var button = buttons[index];
      if (insideHost(button) || !visible(button)) continue;
      var label = (button.getAttribute("aria-label") || "") + " " + (button.getAttribute("title") || "") + " " + textOf(button);
      if (pattern.test(label)) return button;
    }
    return null;
  }

  function onNewWorkspace() {
    var ui = service("uiWorkspace");
    var workspaceService = service("workspaces");
    if (ui && workspaceService && typeof ui.pickDirectory === "function" && typeof workspaceService.create === "function") {
      ui.pickDirectory().then(function (path) {
        if (!path) return;
        return workspaceService.create({ path: path });
      }).catch(function () {
        /* The native picker may be cancelled or unavailable. */
      });
      closeProjects();
      return;
    }
    var target = findSidebarButton(/新建工作区|创建工作区|添加工作区|New workspace|Add workspace/i);
    if (!target) {
      var labels = Array.prototype.slice.call(sidebarRoot().querySelectorAll("*")).filter(function (node) {
        return !insideHost(node) && visible(node) && textOf(node) === "工作区";
      });
      if (labels.length) {
        var section = labels[0].parentElement;
        var plus = section && section.querySelector('button[aria-label*="新" i], button[aria-label*="add" i]');
        if (plus) target = plus;
      }
    }
    if (target) target.click();
    closeProjects();
  }

  function onNewTask() {
    var ui = service("uiWorkspace");
    if (ui && currentWorkspaceId && typeof ui.startSession === "function") {
      ui.startSession(currentWorkspaceId);
      closeProjects();
      return;
    }
    var target = findSidebarButton(/新会话|新建会话|新建任务|New session|New chat/i);
    if (target) target.click();
    closeProjects();
  }

  function onProjectsClick(event) {
    event.preventDefault();
    event.stopPropagation();
    toggleProjects(!projectOpen);
  }

  function refreshBalance() {
    if (liveBalance.busy || Date.now() - liveBalance.at < 12000) return;
    if (typeof fetch !== "function") return;
    liveBalance.busy = true;
    liveBalance.at = Date.now();
    fetch("/dsh-apple-liquid-glass/balance", { cache: "no-store" })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (data) {
        if (data && data.ok) {
          var symbol = data.currency === "USD" ? "$" : data.currency === "CNY" ? "¥" : "";
          liveBalance.text = symbol + data.total;
        }
      })
      .catch(function () {
        /* The island falls back to DOM values or —. */
      })
      .then(function () {
        liveBalance.busy = false;
      });
  }

  function onGearClick(event) {
    event.preventDefault();
    event.stopPropagation();
    togglePanel(!panelOpen);
  }

  function onPanelClose(event) {
    event.preventDefault();
    event.stopPropagation();
    closePanel();
  }

  function onRangeInput(event) {
    store.setLevel(event.currentTarget.value);
  }

  function onPresetClick(event) {
    event.preventDefault();
    event.stopPropagation();
    store.setLevel(Number(event.currentTarget.getAttribute("data-preset")));
  }

  function onSurfaceClick(event) {
    event.preventDefault();
    event.stopPropagation();
    var key = event.currentTarget.getAttribute("data-surface");
    var on = store.getSnapshot().surfaces[key] !== false;
    store.setSurface(key, !on);
  }

  function onSplashClick(event) {
    event.preventDefault();
    event.stopPropagation();
    var next = !store.getSnapshot().splashEnabled;
    store.setSplashEnabled(next);
    if (next && splash) splash.play({ force: true });
  }

  function onTabClick(event) {
    event.preventDefault();
    event.stopPropagation();
    var label = event.currentTarget.getAttribute("data-dslg-tab");
    tabButtons.forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-dslg-tab") === label);
    });
    var target = realTab(label);
    if (target) target.click();
  }

  function onMoreClick(event) {
    event.preventDefault();
    event.stopPropagation();
    var target = Array.prototype.slice.call(document.querySelectorAll('button'))
      .filter(function (node) {
        return !insideHost(node) && visible(node) && /更多|more|\.\.\./i.test((node.getAttribute("aria-label") || "") + " " + textOf(node));
      })[0];
    if (target) target.click();
  }

  function onOutside(event) {
    if (projectOpen && !projectModal.contains(event.target) && !host.contains(event.target)) {
      closeProjects();
      return;
    }
    if (panelOpen && !panel.contains(event.target) && !host.contains(event.target) && !projectModal.contains(event.target)) {
      closePanel();
      return;
    }
    if (isOpen && !host.contains(event.target) && !panel.contains(event.target) && !projectModal.contains(event.target)) setOpen(false);
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      if (projectOpen) {
        closeProjects();
        return;
      }
      if (panelOpen) {
        closePanel();
        return;
      }
      if (isOpen) setOpen(false);
    }
    if ((event.key === "Enter" || event.key === " ") && event.target === host) {
      event.preventDefault();
      setOpen(!isOpen);
    }
  }

  host.addEventListener("click", onHostClick);
  host.addEventListener("keydown", onKeyDown);
  projectsButton.addEventListener("click", onProjectsClick);
  gear.addEventListener("click", onGearClick);
  more.addEventListener("click", onMoreClick);
  tabButtons.forEach(function (button) { button.addEventListener("click", onTabClick); });
  panelClose.addEventListener("click", onPanelClose);
  panelRange.addEventListener("input", onRangeInput);
  panelPresets.forEach(function (button) { button.addEventListener("click", onPresetClick); });
  panelSurfaces.forEach(function (button) { button.addEventListener("click", onSurfaceClick); });
  panelSplash.addEventListener("click", onSplashClick);
  try {
    panelAmap.value = dslgAmapKey();
  } catch (error) {
    panelAmap.value = "";
  }
  panelAmap.addEventListener("input", function () {
    try {
      var value = panelAmap.value.trim();
      if (value) window.localStorage.setItem("dsh-apple-liquid-glass.amapKey", value);
      else window.localStorage.removeItem("dsh-apple-liquid-glass.amapKey");
      window.sessionStorage.removeItem("dsh-apple-liquid-glass.geo.v1");
    } catch (error) {
      /* Local storage may be unavailable. */
    }
  });
  projectClose.addEventListener("click", closeProjects);
  projectBack.addEventListener("click", function () {
    if (projectLoadTimer !== 0) clearInterval(projectLoadTimer);
    projectLoadTimer = 0;
    projectLoading = false;
    projectView = "workspaces";
    projectIndex = 0;
    currentWorkspaceId = "";
    renderProjects();
  });
  projectPrev.addEventListener("click", function () { moveProjects(-1); });
  projectNext.addEventListener("click", function () { moveProjects(1); });
  projectStage.addEventListener("wheel", onProjectWheel, { passive: false });
  projectStage.addEventListener("pointerdown", onProjectPointerDown);
  projectStage.addEventListener("pointermove", onProjectPointerMove);
  projectStage.addEventListener("pointerup", onProjectPointerUp);
  projectStage.addEventListener("pointercancel", onProjectPointerUp);
  unsubscribePanel = store.subscribe(function () {
    if (panelOpen) renderPanel();
  });
  document.addEventListener("pointerdown", onOutside, true);
  window.addEventListener("resize", place);
  window.addEventListener("resize", placePanel);
  window.addEventListener("resize", placeProjectModal);
  updateHeader();
  updateBusy();
  updateMeta();
  updateConflict();
  place();
  pollTimer = setInterval(function () {
    updateBusy();
    updateConflict();
    place();
    placePanel();
    placeProjectModal();
  }, 360);
  headerTimer = setInterval(function () {
    if (isOpen && !hiddenHeader) updateHeader();
  }, 1600);
  metaTimer = setInterval(updateMeta, 1000);

  return {
    dispose: function () {
      if (pollTimer !== 0) clearInterval(pollTimer);
      if (headerTimer !== 0) clearInterval(headerTimer);
      if (metaTimer !== 0) clearInterval(metaTimer);
      pollTimer = 0;
      headerTimer = 0;
      metaTimer = 0;
      if (typeof unsubscribePanel === "function") unsubscribePanel();
      settingTimers.forEach(function (timer) { clearTimeout(timer); });
      settingTimers = [];
      restoreHeader();
      document.removeEventListener("pointerdown", onOutside, true);
      window.removeEventListener("resize", place);
      window.removeEventListener("resize", placePanel);
      window.removeEventListener("resize", placeProjectModal);
      host.remove();
      panel.remove();
      projectModal.remove();
    },
  };
}

/* --------------------------------------------------------------------------
   Model-switch particle sphere
   A small transparent canvas, centred in the viewport. It has no backdrop and
   no pointer capture: only the luminous particles are visible, and the whole
   UI stays usable while it flows and while it fades out.
   -------------------------------------------------------------------------- */

function createModelParticles() {
  var canvas = null;
  var ctx = null;
  var raf = 0;
  var removeTimer = 0;
  var resizeHandler = null;
  var observer = null;
  var checkTimer = 0;
  var initTimer = 0;
  var lastInteractionAt = 0;
  var lastLabel = "";
  var labelReady = false;
  var active = false;
  var startedAt = 0;
  var lastElapsed = 0;
  var size = 0;
  var dpr = 1;
  var particles = [];
  var sprites = [];
  var reduced = false;
  var darkTheme = false;

  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (error) {
    reduced = false;
  }

  function findTrigger() {
    var nodes = document.querySelectorAll("[data-composer-card] button[aria-label]");
    for (var index = 0; index < nodes.length; index += 1) {
      var node = nodes[index];
      var label = node.getAttribute("aria-label") || "";
      if (/模型|model|modell|modèle|モデル|모델/i.test(label) && node.getClientRects().length) return node;
    }
    return null;
  }

  function labelOf(trigger) {
    return (
      (trigger.getAttribute("aria-label") || "") + " " +
      (trigger.getAttribute("title") || "") + " " +
      (trigger.textContent || "")
    )
      .replace(/\s+/g, " ")
      .trim();
  }

  function onPointerDown(event) {
    var target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    var trigger = target.closest("[data-composer-card] button[aria-label]");
    if (trigger && /模型|model|modell|modèle|モデル|모델/i.test(trigger.getAttribute("aria-label") || "")) {
      lastInteractionAt = Date.now();
      return;
    }
    if (
      target.closest('[role="menu"], [role="listbox"], [data-radix-popper-content-wrapper]') &&
      target.closest('button, [role="menuitem"], [role="menuitemradio"], [role="option"]')
    ) {
      lastInteractionAt = Date.now();
    }
  }

  function onKeyDown(event) {
    if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
    var target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    var trigger = target.closest("[data-composer-card] button[aria-label]");
    if (trigger && /模型|model|modell|modèle|モデル|모델/i.test(trigger.getAttribute("aria-label") || "")) {
      lastInteractionAt = Date.now();
    } else if (target.closest('[role="menu"], [role="listbox"]')) {
      lastInteractionAt = Date.now();
    }
  }

  function checkLabel() {
    var trigger = findTrigger();
    if (!trigger) return;
    var label = labelOf(trigger);
    if (!label) return;
    if (!labelReady) {
      lastLabel = label;
      return;
    }
    if (label === lastLabel) return;
    lastLabel = label;
    if (Date.now() - lastInteractionAt < 15000) {
      play();
    }
  }

  function scheduleCheck() {
    if (checkTimer !== 0) return;
    checkTimer = setTimeout(function () {
      checkTimer = 0;
      checkLabel();
    }, 90);
  }

  function makeSprite(hue, lightness, whiteCore) {
    var sprite = document.createElement("canvas");
    sprite.width = 64;
    sprite.height = 64;
    var paint = sprite.getContext("2d");
    var gradient = paint.createRadialGradient(32, 32, 0, 32, 32, 32);
    var core = whiteCore ? 98 : lightness;
    var mid = whiteCore ? Math.min(92, lightness + 6) : Math.min(92, lightness + 16);
    gradient.addColorStop(0, "hsla(" + hue + ", 100%, " + core + "%, 1)");
    gradient.addColorStop(0.28, "hsla(" + hue + ", 100%, " + mid + "%, 0.96)");
    gradient.addColorStop(0.64, "hsla(" + hue + ", 98%, " + lightness + "%, 0.42)");
    gradient.addColorStop(1, "hsla(" + hue + ", 92%, " + lightness + "%, 0)");
    paint.fillStyle = gradient;
    paint.fillRect(0, 0, 64, 64);
    return sprite;
  }

  function buildSprites() {
    sprites = darkTheme
      ? [
        makeSprite(226, 46, false),
        makeSprite(222, 54, false),
        makeSprite(218, 61, false),
        makeSprite(213, 69, false),
        makeSprite(208, 76, false),
        makeSprite(203, 81, false),
        makeSprite(198, 85, false),
        makeSprite(193, 92, true),
      ]
      : [
        makeSprite(226, 40, false),
        makeSprite(222, 46, false),
        makeSprite(218, 52, false),
        makeSprite(213, 58, false),
        makeSprite(208, 65, false),
        makeSprite(203, 72, false),
        makeSprite(198, 79, false),
        makeSprite(193, 88, true),
      ];
  }

  function buildParticles() {
    particles = [];
    var count = reduced ? 260 : 680;
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var index = 0; index < count; index += 1) {
      var y = 1 - ((index + 0.5) / count) * 2;
      var lat = Math.asin(y);
      var lon = index * golden;
      var depth = (y + 1) / 2;
      var variant = Math.min(6, Math.floor(depth * 5.8 + Math.random() * 1.2));
      if (Math.random() < 0.045) variant = 7;
      particles.push({
        lat: lat,
        lon: lon,
        phase: Math.random() * Math.PI * 2,
        size: 0.8 + Math.random() * 2.6,
        alpha: 0.52 + Math.random() * 0.46,
        variant: variant,
        glow: Math.random() < 0.38,
        driftX: Math.cos(Math.random() * Math.PI * 2),
        driftY: Math.sin(Math.random() * Math.PI * 2),
      });
    }

    var bands = reduced ? 1 : 2;
    var perBand = reduced ? 40 : 60;
    for (var band = 0; band < bands; band += 1) {
      for (var point = 0; point < perBand; point += 1) {
        var angle = (point / perBand) * Math.PI * 2;
        var bandLat = -0.52 + band * 0.5 + Math.sin(angle * 2 + band * 1.7) * 0.17 + (Math.random() - 0.5) * 0.05;
        var bandLon = angle + band * 2.1 + Math.cos(angle * 3 + band) * 0.22 + (Math.random() - 0.5) * 0.05;
        particles.push({
          lat: Math.max(-1.38, Math.min(1.38, bandLat)),
          lon: bandLon,
          phase: Math.random() * Math.PI * 2,
          size: 0.9 + Math.random() * 2.8,
          alpha: 0.7 + Math.random() * 0.3,
          variant: 4 + Math.floor(Math.random() * 3),
          glow: true,
          driftX: Math.cos(Math.random() * Math.PI * 2),
          driftY: Math.sin(Math.random() * Math.PI * 2),
        });
      }
    }
  }

  function resizeCanvas() {
    if (!canvas) return;
    size = 96;
    dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function placeCanvas() {
    if (!canvas) return;
    var trigger = findTrigger();
    if (!trigger) {
      canvas.style.left = Math.round((window.innerWidth - size) / 2) + "px";
      canvas.style.top = Math.round((window.innerHeight - size) / 2) + "px";
      return;
    }
    var rect = trigger.getBoundingClientRect();
    canvas.style.left = Math.round(Math.max(8, Math.min(window.innerWidth - size - 8, rect.left + rect.width / 2 - size / 2))) + "px";
    canvas.style.top = Math.round(Math.max(8, rect.top - size - 8)) + "px";
  }

  function draw(elapsed) {
    if (!ctx || !canvas) return;
    lastElapsed = elapsed;
    ctx.clearRect(0, 0, size, size);
    ctx.globalCompositeOperation = "source-over";

    var t = elapsed / 1000;
    var fadeStart = reduced ? 1200 : 5000;
    var fadeDuration = reduced ? 1400 : 5000;
    var fade = 1;
    if (elapsed > fadeStart) {
      fade = Math.max(0, 1 - (elapsed - fadeStart) / fadeDuration);
      fade = fade * fade * (3 - 2 * fade);
    }
    var entrance = Math.min(1, 0.25 + elapsed / 700);
    var rotation = reduced ? 0.4 : t * 0.12;
    var tilt = 0.24;
    var center = size / 2;
    var radius = size * 0.4;

    for (var index = 0; index < particles.length; index += 1) {
      var particle = particles[index];
      var lon = particle.lon + rotation;
      var lat = particle.lat;
      if (!reduced) {
        lon += Math.sin(t * 0.45 + particle.phase) * 0.035;
        lat += Math.sin(t * 0.33 + particle.phase) * 0.018;
      }
      var cosLat = Math.cos(lat);
      var x = cosLat * Math.sin(lon);
      var y = Math.sin(lat);
      var z = cosLat * Math.cos(lon);
      var y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
      var z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
      var depth = (z2 + 1) / 2;
      var px = center + x * radius;
      var py = center + y2 * radius;

      if (elapsed > fadeStart) {
        var drift = Math.min(1, (elapsed - fadeStart) / fadeDuration);
        drift = drift * drift;
        px += particle.driftX * drift * size * 0.12;
        py += particle.driftY * drift * size * 0.12 - drift * size * 0.035;
      }

      var alpha = (0.16 + depth * 0.7) * fade * entrance * particle.alpha;
      if (alpha <= 0.004) continue;
      var scale = particle.size * (1.1 + depth * 1.3);
      if (elapsed > fadeStart) {
        scale *= 1 - Math.min(1, (elapsed - fadeStart) / fadeDuration) * 0.4;
      }
      if (particle.glow) {
        var halo = scale * 3.2;
        ctx.globalAlpha = Math.min(0.18, alpha * 0.22);
        ctx.drawImage(sprites[particle.variant], px - halo / 2, py - halo / 2, halo, halo);
      }
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.drawImage(sprites[particle.variant], px - scale / 2, py - scale / 2, scale, scale);
    }

    ctx.globalAlpha = 1;
    var tint = ctx.createRadialGradient(center, center, radius * 0.25, center, center, radius * 1.06);
    if (darkTheme) {
      tint.addColorStop(0, "rgba(90, 180, 255, 0.14)");
      tint.addColorStop(0.62, "rgba(30, 105, 255, 0.26)");
      tint.addColorStop(1, "rgba(15, 55, 200, 0.42)");
    } else {
      tint.addColorStop(0, "rgba(60, 145, 255, 0.12)");
      tint.addColorStop(0.62, "rgba(18, 80, 240, 0.24)");
      tint.addColorStop(1, "rgba(8, 35, 175, 0.38)");
    }
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = "source-over";
  }

  function frame(now) {
    if (!active || !canvas) return;
    if (startedAt === 0) startedAt = now;
    var elapsed = now - startedAt;
    draw(elapsed);
    var end = reduced ? 2600 : 10000;
    if (elapsed >= end) {
      stop();
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function onResize() {
    if (!canvas) return;
    resizeCanvas();
    placeCanvas();
    buildParticles();
    draw(lastElapsed);
  }

  function stop() {
    active = false;
    if (raf !== 0) cancelAnimationFrame(raf);
    if (removeTimer !== 0) clearTimeout(removeTimer);
    raf = 0;
    removeTimer = 0;
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null;
    ctx = null;
    particles = [];
    sprites = [];
    startedAt = 0;
    lastElapsed = 0;
  }

  function play() {
    if (!document.body) return;
    stop();
    active = true;
    darkTheme = document.body.hasAttribute("data-ds-dark-theme");
    canvas = document.createElement("canvas");
    canvas.className = "dslg-particles";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    resizeCanvas();
    placeCanvas();
    if (!canvas || !ctx) {
      stop();
      return;
    }
    buildSprites();
    buildParticles();
    startedAt = performance.now() - 320;
    draw(320);
    raf = requestAnimationFrame(frame);
    removeTimer = setTimeout(stop, reduced ? 2800 : 10400);
    resizeHandler = onResize;
    window.addEventListener("resize", resizeHandler, { passive: true });
    canvas.classList.add("is-on");
  }

  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("keydown", onKeyDown, true);
  if (document.body) {
    observer = new MutationObserver(scheduleCheck);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "title", "data-model"],
    });
  }
  initTimer = setTimeout(function () {
    initTimer = 0;
    labelReady = true;
    var trigger = findTrigger();
    lastLabel = trigger ? labelOf(trigger) : "";
  }, 1600);

  return {
    play: play,
    dispose: function () {
      stop();
      if (observer) observer.disconnect();
      observer = null;
      if (checkTimer !== 0) clearTimeout(checkTimer);
      if (initTimer !== 0) clearTimeout(initTimer);
      checkTimer = 0;
      initTimer = 0;
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    },
  };
}

/* --------------------------------------------------------------------------
   Settings section
   -------------------------------------------------------------------------- */

function createSettingsComponent(store, splash) {
  if (!React || typeof useSyncExternalStore !== "function") return null;

  function LiquidGlassSettings(props) {
    var snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
    var tr = props && typeof props.t === "function" ? props.t : t;
    var level = snapshot.level;
    var enabled = snapshot.splashEnabled;
    var surfaces = snapshot.surfaces;
    var activePreset = level <= 0 ? 0 : level <= 30 ? 35 : level <= 70 ? 65 : 100;
    var presets = [
      { value: 0, key: "settings.preset.off" },
      { value: 35, key: "settings.preset.light" },
      { value: 65, key: "settings.preset.mid" },
      { value: 100, key: "settings.preset.strong" },
    ];
    var scopeItems = [
      { key: "composer", label: "settings.scope.composer", hint: "settings.scope.composer.hint" },
      { key: "sidebar", label: "settings.scope.sidebar", hint: "settings.scope.sidebar.hint" },
      { key: "model", label: "settings.scope.model", hint: "settings.scope.model.hint" },
      { key: "send", label: "settings.scope.send", hint: "settings.scope.send.hint" },
    ];

    return h("section", { className: "dslg-settings", "aria-label": tr("settings.title") },
      h("h2", { className: "dslg-settings__title" }, tr("settings.title")),
      h("p", { className: "dslg-settings__intro" }, tr("settings.intro")),
      h("div", { className: "dslg-settings__card" },
        h("div", { className: "dslg-settings__row" },
          h("div", { className: "dslg-settings__copy" },
            h("div", { className: "dslg-settings__label" }, tr("settings.intensity")),
            h("p", { className: "dslg-settings__desc" }, tr("settings.intensity.description"))
          ),
          h("div", { className: "dslg-settings__value", "aria-hidden": "true" }, level + "%")
        ),
        h("input", {
          className: "dslg-settings__range",
          type: "range",
          min: 0,
          max: 100,
          step: 1,
          value: level,
          "aria-label": tr("settings.intensity"),
          "aria-valuetext": level + "%",
          style: { "--dslg-fill": level + "%" },
          onInput: function (event) {
            store.setLevel(event.currentTarget.value);
          },
        }),
        h("div", { className: "dslg-settings__scale", "aria-hidden": "true" },
          h("span", null, "0"),
          h("span", null, "25"),
          h("span", null, "50"),
          h("span", null, "75"),
          h("span", null, "100")
        ),
        h("div", { className: "dslg-settings__presets", role: "group", "aria-label": tr("settings.presets") },
          presets.map(function (preset) {
            var isOn = preset.value === activePreset;
            return h("button", {
              key: preset.key,
              type: "button",
              className: "dslg-settings__preset" + (isOn ? " is-on" : ""),
              "aria-pressed": isOn ? "true" : "false",
              onClick: function () {
                store.setLevel(preset.value);
              },
            }, tr(preset.key));
          })
        )
      ),
      h("div", { className: "dslg-settings__card" },
        h("div", { className: "dslg-settings__scope-head" },
          h("div", { className: "dslg-settings__label" }, tr("settings.scope")),
          h("p", { className: "dslg-settings__desc" }, tr("settings.scope.description"))
        ),
        h("div", { className: "dslg-settings__scope", role: "group", "aria-label": tr("settings.scope") },
          scopeItems.map(function (item) {
            var on = surfaces[item.key] !== false;
            return h("div", { className: "dslg-settings__scope-row", key: item.key },
              h("div", { className: "dslg-settings__scope-copy" },
                h("div", { className: "dslg-settings__scope-label" }, tr(item.label)),
                h("p", { className: "dslg-settings__scope-hint" }, tr(item.hint))
              ),
              h("button", {
                type: "button",
                role: "switch",
                className: "dslg-settings__switch dslg-settings__switch--compact" + (on ? " is-on" : ""),
                "aria-checked": on ? "true" : "false",
                "aria-label": tr(item.label),
                onClick: function () {
                  store.setSurface(item.key, !on);
                },
              }, h("span", { className: "dslg-settings__knob", "aria-hidden": "true" }))
            );
          })
        )
      ),
      h("div", { className: "dslg-settings__card" },
        h("div", { className: "dslg-settings__row dslg-settings__row--center" },
          h("div", { className: "dslg-settings__copy" },
            h("div", { className: "dslg-settings__label" }, tr("settings.splash")),
            h("p", { className: "dslg-settings__desc" }, tr("settings.splash.description"))
          ),
          h("button", {
            type: "button",
            role: "switch",
            className: "dslg-settings__switch" + (enabled ? " is-on" : ""),
            "aria-checked": enabled ? "true" : "false",
            "aria-label": tr("settings.splash"),
            onClick: function () {
              var next = !store.getSnapshot().splashEnabled;
              store.setSplashEnabled(next);
              if (next) {
                setTimeout(function () {
                  splash.play({ force: true });
                }, 260);
              }
            },
          }, h("span", { className: "dslg-settings__knob", "aria-hidden": "true" }))
        )
      )
    );
  }

  return LiquidGlassSettings;
}

function registerSettings(ctx, store, splash) {
  if (!React || !ctx || !ctx.slots || !ctx.locale) return null;
  var component = createSettingsComponent(store, splash);
  if (component === null) return null;

  ctx.effect(function () {
    return ctx.locale.register(LOCALE_NS, LOCALES);
  }, "dsh-apple-liquid-glass: settings locale");

  var bind = ctx.locale.bind(LOCALE_NS);
  var dispose = ctx.slots.inject("settings.section", function () {
    return ctx.slots.register({
      name: "settings.section",
      id: "dsh-apple-liquid-glass-settings",
      order: 47,
      label: function () {
        return bind("settings.title");
      },
      locale: LOCALE_NS,
      inject: function () {
        return { store: store, splash: splash };
      },
    }, component);
  });

  return typeof dispose === "function" ? dispose : null;
}

/* --------------------------------------------------------------------------
   Entrypoint
   -------------------------------------------------------------------------- */

function apply(ctx) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  function start() {
    try {
      if (typeof window.__DSH_LIQUID_GLASS_DISPOSE__ === "function") {
        window.__DSH_LIQUID_GLASS_DISPOSE__();
      }

      var store = createStore();
      var material = createMaterial(store);
      var splash = createSplash(store);
      var island = createDynamicIsland(store, splash, ctx);
      var modelParticles = createModelParticles();
      var settingsDispose = null;
      try {
        settingsDispose = registerSettings(ctx, store, splash);
      } catch (error) {
        try {
          console.warn("[dsh-apple-liquid-glass] settings section unavailable", error);
        } catch (ignored) {
          /* Console unavailable. */
        }
      }

      var played = false;
      try {
        played = sessionStorage.getItem(SPLASH_SESSION_KEY) === "1";
      } catch (error) {
        played = false;
      }
      if (store.getSnapshot().splashEnabled && !played) {
        try {
          sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
        } catch (error) {
          /* Private mode: play each load. */
        }
        splash.play();
      }

      var disposed = false;
      function dispose() {
        if (disposed) return;
        disposed = true;
        if (typeof settingsDispose === "function") {
          try {
            settingsDispose();
          } catch (error) {
            /* The slots service may already have torn the section down. */
          }
        }
        splash.dispose();
        if (island) island.dispose();
        if (modelParticles) modelParticles.dispose();
        material.dispose();
        store.dispose();
        if (window.__DSH_LIQUID_GLASS_DISPOSE__ === dispose) {
          delete window.__DSH_LIQUID_GLASS_DISPOSE__;
        }
      }

      window.__DSH_LIQUID_GLASS_DISPOSE__ = dispose;
      if (ctx && typeof ctx.effect === "function") {
        ctx.effect(function () {
          return dispose;
        }, "dsh-apple-liquid-glass: theme");
      }
    } catch (error) {
      try {
        console.warn("[dsh-apple-liquid-glass] could not mount", error);
      } catch (ignored) {
        /* Console unavailable. */
      }
    }
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
}

exports.apply = apply;
exports.inject = ["slots", "locale"];
