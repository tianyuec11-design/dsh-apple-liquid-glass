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

function dslgEarthIsLand(latitude, longitude) {
  if (latitude < -70) return true;
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
  return { lat: point[0], lon: point[1], fallback: true };
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

function dslgFetchGeo() {
  var cached = dslgGeoCache();
  if (cached) return Promise.resolve(cached);
  if (typeof fetch !== "function") return Promise.resolve(dslgGeoFallback());
  var providers = [
    {
      url: "https://ipwho.is/",
      parse: function (data) {
        return { lat: Number(data.latitude), lon: Number(data.longitude) };
      }
    },
    {
      url: "https://ipapi.co/json/",
      parse: function (data) {
        return { lat: Number(data.latitude), lon: Number(data.longitude) };
      }
    },
    {
      url: "https://ipinfo.io/json",
      parse: function (data) {
        if (!data.loc) return null;
        var parts = String(data.loc).split(",");
        return { lat: Number(parts[0]), lon: Number(parts[1]) };
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
  return attempt(0);
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
      '<canvas class="dslg-splash__canvas" aria-label="旋转的地球"></canvas>',
      '<button class="dslg-splash__skip" type="button"></button>',
    ].join("\n");
    var skipButton = overlay.querySelector(".dslg-splash__skip");
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
    var spinStart = 0;
    var spinFrom = fixedAngle;
    var spinTo = fixedAngle;
    var spinDuration = 4000;
    var spotStart = 0;
    var geoDone = false;
    var fallback = dslgGeoFallback();
    targetLat = fallback.lat;
    targetLon = fallback.lon;

    function beginSpin(geo) {
      if (gone || leaving || geoDone) return;
      geoDone = true;
      targetLat = geo.lat;
      targetLon = geo.lon;
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
      var cosAngle = Math.cos(angle);
      var sinAngle = Math.sin(angle);
      var cosTilt = Math.cos(tilt);
      var sinTilt = Math.sin(tilt);

      for (var index = 0; index < points.length; index += 1) {
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

    function frame(now) {
      if (gone || leaving) return;
      draw(now);
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
    '    <div><b>开屏动效</b><small>约 6 秒 hello 书写动画</small></div>',
    '    <button type="button" role="switch" class="dslg-island-panel__splash-switch" aria-checked="true"><span></span></button>',
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
