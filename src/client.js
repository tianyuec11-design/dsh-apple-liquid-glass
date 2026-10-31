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

function defaultSettings() {
  return { level: DEFAULT_LEVEL, splashEnabled: true };
}

function parseSettings(value) {
  if (value === null || typeof value !== "object") return null;
  return {
    level: clampLevel(value.level),
    splashEnabled: typeof value.splashEnabled === "boolean" ? value.splashEnabled : true,
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

function clearLevelVars() {
  var body = document.body;
  if (!body) return;
  for (var index = 0; index < LEVEL_VARS.length; index += 1) {
    body.style.removeProperty(LEVEL_VARS[index]);
  }
  body.removeAttribute("data-dslg-glass");
  body.removeAttribute("data-dslg-level");
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
        version: 2,
        level: snapshot.level,
        splashEnabled: snapshot.splashEnabled,
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
      snapshot = { level: level, splashEnabled: snapshot.splashEnabled };
      scheduleSave();
      emit();
    },
    setSplashEnabled: function (next) {
      if (disposed) return;
      var enabled = next === true;
      if (enabled === snapshot.splashEnabled) return;
      snapshot = { level: snapshot.level, splashEnabled: enabled };
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
    applyLevel(store.getSnapshot().level);
  }

  var unsubscribe = store.subscribe(apply);
  apply();

  function onPointerMove(event) {
    if (store.getSnapshot().level <= 0 || !(event.target instanceof Element)) return;
    var surface = event.target.closest(SURFACE_SELECTOR);
    if (!surface) return;
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
      '<div class="dslg-splash__stage">',
      '  <div class="dslg-splash__word">',
      '    <span class="dslg-splash__hello">hello</span>',
      '    <span class="dslg-splash__pen" aria-hidden="true"></span>',
      "  </div>",
      "</div>",
      '<div class="dslg-splash__hint"></div>',
    ].join("\n");
    var hint = overlay.querySelector(".dslg-splash__hint");
    hint.textContent = t("splash.skip");
    document.body.appendChild(overlay);
    document.documentElement.classList.add("dslg-splash-lock");

    var gone = false;
    var leaving = false;
    var readyTimer = 0;
    var removeTimer = 0;
    var skipTimer = 0;

    function ready() {
      if (gone || leaving || overlay.classList.contains("is-ready")) return;
      overlay.classList.add("is-ready");
      if (readyTimer !== 0) {
        clearTimeout(readyTimer);
        readyTimer = 0;
      }
      if (reducedMotion) {
        skipTimer = setTimeout(skip, 1900);
      } else {
        removeTimer = setTimeout(skip, 5400);
      }
    }

    function cleanup() {
      if (gone) return;
      gone = true;
      if (readyTimer !== 0) clearTimeout(readyTimer);
      if (removeTimer !== 0) clearTimeout(removeTimer);
      if (skipTimer !== 0) clearTimeout(skipTimer);
      readyTimer = 0;
      removeTimer = 0;
      skipTimer = 0;
      document.removeEventListener("keydown", onKeyDown, true);
      document.documentElement.classList.remove("dslg-splash-lock");
      overlay.remove();
      if (active !== null && active.overlay === overlay) active = null;
    }

    function skip() {
      if (gone || leaving) return;
      leaving = true;
      overlay.classList.add("is-leaving");
      if (removeTimer !== 0) {
        clearTimeout(removeTimer);
        removeTimer = 0;
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

    overlay.addEventListener("click", skip);
    document.addEventListener("keydown", onKeyDown, true);

    if (document.fonts && typeof document.fonts.load === "function") {
      document.fonts.load('600 1em "DSLG Hello"').then(ready, ready);
      readyTimer = setTimeout(ready, 700);
    } else {
      ready();
    }

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
   Settings section
   -------------------------------------------------------------------------- */

function createSettingsComponent(store, splash) {
  if (!React || typeof useSyncExternalStore !== "function") return null;

  function LiquidGlassSettings(props) {
    var snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
    var tr = props && typeof props.t === "function" ? props.t : t;
    var level = snapshot.level;
    var enabled = snapshot.splashEnabled;
    var activePreset = level <= 0 ? 0 : level <= 30 ? 35 : level <= 70 ? 65 : 100;
    var presets = [
      { value: 0, key: "settings.preset.off" },
      { value: 35, key: "settings.preset.light" },
      { value: 65, key: "settings.preset.mid" },
      { value: 100, key: "settings.preset.strong" },
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
