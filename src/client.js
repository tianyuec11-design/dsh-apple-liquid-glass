/* ============================================================================
 * DSH Apple Liquid Glass — browser half
 *
 * This file is the factory body. `scripts/build.mjs` wraps it in the
 * `window.__ModuleLoader__.load({ id, factory })` envelope used by the DSH
 * browser plugin loader and substitutes the stylesheet placeholder.
 *
 * No React dependency: the only rendered surface is the intensity controller,
 * which is plain DOM. The material itself is pure CSS over host elements.
 * ========================================================================== */

var CSS = "__DSLG_CSS__";

var PACKAGE_ID = "dsh-apple-liquid-glass";
var STORAGE_KEY = "dsh-apple-liquid-glass.settings.v1";
var DEFAULT_LEVEL = 62;
var TITLE_ID = "dslg-title";

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

var DROP_SVG = [
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">',
  '<path d="M12 2.9c3.82 4.2 6.3 7.35 6.3 10.45a6.3 6.3 0 1 1-12.6 0C5.7 10.25 8.18 7.1 12 2.9Z" fill="currentColor" opacity=".9"/>',
  '<path d="M12 6.55c2.42 2.7 3.95 4.72 3.95 6.8a3.95 3.95 0 1 1-7.9 0c0-2.08 1.53-4.1 3.95-6.8Z" fill="#fff" opacity=".32"/>',
  '<ellipse cx="9.35" cy="13.1" rx="1.35" ry="2.15" fill="#fff" opacity=".55" transform="rotate(-26 9.35 13.1)"/>',
  "</svg>",
].join("");

var CHEV_SVG = [
  '<svg viewBox="0 0 12 12" width="10" height="10" fill="none" aria-hidden="true">',
  '<path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  "</svg>",
].join("");

var X_SVG = [
  '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">',
  '<path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  "</svg>",
].join("");

var STRINGS = {
  zh: {
    title: "液态玻璃",
    fab: "调节液态玻璃强度",
    close: "关闭",
    slider: "液态玻璃强度",
    presets: "快捷强度",
    note: "只作用于输入框、侧边栏按钮、模型选择与发送按钮，页面背景保持不变。",
    reset: "重置",
    off: "已关闭 · 原生外观",
    light: "轻盈玻璃",
    medium: "中等玻璃",
    strong: "强玻璃",
    presetOff: "关闭",
    presetLight: "轻",
    presetMid: "中",
    presetStrong: "强",
    brand: "Liquid Glass",
  },
  en: {
    title: "Liquid Glass",
    fab: "Adjust liquid glass intensity",
    close: "Close",
    slider: "Liquid glass intensity",
    presets: "Quick intensity",
    note: "Applies to the composer, sidebar controls, model picker, and send button. The page background stays untouched.",
    reset: "Reset",
    off: "Off · native appearance",
    light: "Light glass",
    medium: "Medium glass",
    strong: "Strong glass",
    presetOff: "Off",
    presetLight: "Light",
    presetMid: "Mid",
    presetStrong: "Strong",
    brand: "Liquid Glass",
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

function strings() {
  return isZhUi() ? STRINGS.zh : STRINGS.en;
}

function clampLevel(value) {
  var number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_LEVEL;
  return Math.min(100, Math.max(0, Math.round(number)));
}

function readLevel() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LEVEL;
    var parsed = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && Number.isFinite(parsed.level)) {
      return clampLevel(parsed.level);
    }
  } catch (error) {
    /* Private mode / disabled storage: keep the in-memory default. */
  }
  return DEFAULT_LEVEL;
}

function readLevelFromRaw(raw) {
  try {
    var parsed = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && Number.isFinite(parsed.level)) {
      return clampLevel(parsed.level);
    }
  } catch (error) {
    return null;
  }
  return null;
}

function labelForLevel(level, text) {
  if (level <= 0) return text.off;
  if (level <= 30) return text.light;
  if (level <= 70) return text.medium;
  return text.strong;
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

function buildController() {
  var root = document.createElement("div");
  root.className = "dslg-root";
  root.setAttribute("data-dslg-root", "");
  root.innerHTML = [
    '<div class="dslg-panel" data-dslg-panel role="dialog" aria-labelledby="' + TITLE_ID + '" hidden>',
    '  <div class="dslg-head">',
    '    <span class="dslg-head__mark" aria-hidden="true">' + DROP_SVG + "</span>",
    '    <span class="dslg-head__copy">',
    '      <span class="dslg-title" data-dslg-title id="' + TITLE_ID + '"></span>',
    '      <span class="dslg-sub" data-dslg-sub></span>',
    "    </span>",
    '    <button class="dslg-iconbtn" type="button" data-dslg-close></button>',
    "  </div>",
    '  <div class="dslg-readout" aria-hidden="true"><span data-dslg-value>0</span><span class="dslg-readout__pct">%</span></div>',
    '  <div class="dslg-sliderbox">',
    '    <input class="dslg-slider" data-dslg-range type="range" min="0" max="100" step="1" value="0" />',
    '    <div class="dslg-scale" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>',
    "  </div>",
    '  <div class="dslg-presets" data-dslg-presets role="group">',
    '    <button type="button" data-dslg-preset="0"></button>',
    '    <button type="button" data-dslg-preset="35"></button>',
    '    <button type="button" data-dslg-preset="65"></button>',
    '    <button type="button" data-dslg-preset="100"></button>',
    "  </div>",
    '  <p class="dslg-note" data-dslg-note></p>',
    '  <div class="dslg-foot">',
    '    <span class="dslg-brand">Liquid Glass</span>',
    '    <span class="dslg-dot" aria-hidden="true"></span>',
    '    <button type="button" class="dslg-reset" data-dslg-reset></button>',
    "  </div>",
    "</div>",
    '<button class="dslg-fab" data-dslg-fab type="button" aria-haspopup="dialog" aria-expanded="false">',
    '  <span class="dslg-fab__drop" aria-hidden="true">' + DROP_SVG + "</span>",
    '  <span class="dslg-fab__text"><span data-dslg-fab-pct>0</span><span class="dslg-fab__pct">%</span></span>',
    '  <span class="dslg-fab__chev" aria-hidden="true">' + CHEV_SVG + "</span>",
    "</button>",
  ].join("\n");
  document.body.appendChild(root);

  return {
    root: root,
    panel: root.querySelector("[data-dslg-panel]"),
    fab: root.querySelector("[data-dslg-fab]"),
    fabPct: root.querySelector("[data-dslg-fab-pct]"),
    close: root.querySelector("[data-dslg-close]"),
    title: root.querySelector("[data-dslg-title]"),
    sub: root.querySelector("[data-dslg-sub]"),
    value: root.querySelector("[data-dslg-value]"),
    range: root.querySelector("[data-dslg-range]"),
    presetsWrap: root.querySelector("[data-dslg-presets]"),
    presets: Array.prototype.slice.call(root.querySelectorAll("[data-dslg-preset]")),
    note: root.querySelector("[data-dslg-note]"),
    reset: root.querySelector("[data-dslg-reset]"),
    brand: root.querySelector(".dslg-brand"),
  };
}

/**
 * Mount one controller and return its idempotent disposer.
 * @returns {{ dispose: () => void }}
 */
function mount() {
  var style = document.createElement("style");
  style.setAttribute("data-plugin", PACKAGE_ID);
  style.textContent = CSS;
  document.head.appendChild(style);

  var ui = buildController();
  var state = { level: readLevel(), open: false };
  var disposed = false;
  var saveTimer = 0;
  var raf = 0;
  var focusRaf = 0;
  var pendingSurface = null;
  var pressed = null;

  function text() {
    return strings();
  }

  function updateCopy() {
    var s = text();
    var level = state.level;
    ui.title.textContent = s.title;
    ui.note.textContent = s.note;
    ui.reset.textContent = s.reset;
    ui.close.setAttribute("aria-label", s.close);
    ui.fab.setAttribute("aria-label", s.fab + " · " + level + "%");
    ui.fab.setAttribute("title", s.fab);
    ui.range.setAttribute("aria-label", s.slider);
    ui.presetsWrap.setAttribute("aria-label", s.presets);
    ui.brand.textContent = s.brand;
    ui.sub.textContent = labelForLevel(level, s);
    ui.presets[0].textContent = s.presetOff;
    ui.presets[1].textContent = s.presetLight;
    ui.presets[2].textContent = s.presetMid;
    ui.presets[3].textContent = s.presetStrong;
  }

  function updatePresets() {
    var level = state.level;
    var active = level <= 0 ? 0 : level <= 30 ? 35 : level <= 70 ? 65 : 100;
    for (var index = 0; index < ui.presets.length; index += 1) {
      var button = ui.presets[index];
      var value = Number(button.getAttribute("data-dslg-preset"));
      var on = value === active;
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function renderLevel() {
    var level = state.level;
    applyLevel(level);
    ui.range.value = String(level);
    ui.range.style.setProperty("--dslg-fill", level + "%");
    ui.range.setAttribute("aria-valuetext", level + "%");
    ui.value.textContent = String(level);
    ui.fabPct.textContent = String(level);
    updateCopy();
    updatePresets();
  }

  function flushSave() {
    try {
      if (saveTimer !== 0) {
        clearTimeout(saveTimer);
        saveTimer = 0;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, level: state.level }));
    } catch (error) {
      /* Storage is a convenience; the live theme keeps working without it. */
    }
  }

  function scheduleSave() {
    try {
      if (saveTimer !== 0) clearTimeout(saveTimer);
      saveTimer = setTimeout(flushSave, 160);
    } catch (error) {
      saveTimer = 0;
    }
  }

  function setLevel(next, options) {
    if (disposed) return;
    var level = clampLevel(next);
    state.level = level;
    renderLevel();
    if (!options || options.persist !== false) scheduleSave();
  }

  function openPanel() {
    if (disposed || state.open) return;
    state.open = true;
    ui.panel.hidden = false;
    ui.fab.setAttribute("aria-expanded", "true");
    document.addEventListener("pointerdown", onOutsidePointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    if (focusRaf === 0) {
      focusRaf = requestAnimationFrame(function () {
        focusRaf = 0;
        if (state.open) ui.range.focus({ preventScroll: true });
      });
    }
  }

  function closePanel(options) {
    if (!state.open) return;
    state.open = false;
    ui.panel.hidden = true;
    ui.fab.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", onOutsidePointerDown, true);
    document.removeEventListener("keydown", onKeyDown, true);
    if (!options || options.restoreFocus !== false) {
      try {
        ui.fab.focus({ preventScroll: true });
      } catch (error) {
        ui.fab.focus();
      }
    }
  }

  function togglePanel() {
    if (state.open) closePanel();
    else openPanel();
  }

  function onOutsidePointerDown(event) {
    if (!(event.target instanceof Element)) return;
    if (ui.root.contains(event.target)) return;
    closePanel({ restoreFocus: false });
  }

  function onKeyDown(event) {
    if (event.key !== "Escape" || !state.open) return;
    event.preventDefault();
    closePanel();
  }

  function onRangeInput() {
    setLevel(ui.range.value, { persist: false });
    scheduleSave();
  }

  function onRangeWheel(event) {
    event.preventDefault();
    var step = event.shiftKey ? 5 : 1;
    var delta = event.deltaY < 0 ? step : -step;
    setLevel(state.level + delta);
  }

  function onPresetClick(event) {
    if (!(event.target instanceof Element)) return;
    var button = event.target.closest("[data-dslg-preset]");
    if (!button || !ui.root.contains(button)) return;
    setLevel(button.getAttribute("data-dslg-preset"));
    flushSave();
  }

  function onResetClick() {
    setLevel(DEFAULT_LEVEL);
    flushSave();
  }

  function onPointerMove(event) {
    if (state.level <= 0 || !(event.target instanceof Element)) return;
    var surface = event.target.closest(SURFACE_SELECTOR);
    if (!surface || ui.root.contains(surface)) return;
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
    if (event.button !== 0 || state.level <= 0 || !(event.target instanceof Element)) return;
    var surface = event.target.closest(PRESS_SELECTOR);
    if (!surface || ui.root.contains(surface)) return;
    clearPress();
    pressed = surface;
    surface.classList.add("dslg-pressed");
  }

  function onStorage(event) {
    if (event.key !== STORAGE_KEY) return;
    var next = event.newValue === null ? DEFAULT_LEVEL : readLevelFromRaw(event.newValue);
    if (next !== null) setLevel(next, { persist: false });
  }

  function onLanguageChange() {
    renderLevel();
  }

  var languageObserver = new MutationObserver(onLanguageChange);
  languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  ui.fab.addEventListener("click", togglePanel);
  ui.close.addEventListener("click", function () {
    closePanel();
  });
  ui.range.addEventListener("input", onRangeInput);
  ui.range.addEventListener("change", flushSave);
  ui.range.addEventListener("wheel", onRangeWheel, { passive: false });
  ui.presetsWrap.addEventListener("click", onPresetClick);
  ui.reset.addEventListener("click", onResetClick);
  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("pointerup", clearPress, true);
  window.addEventListener("pointercancel", clearPress, true);
  window.addEventListener("blur", clearPress);
  window.addEventListener("storage", onStorage);

  renderLevel();

  function dispose() {
    if (disposed) return;
    disposed = true;
    flushSave();
    closePanel({ restoreFocus: false });
    clearPress();
    if (raf !== 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    if (focusRaf !== 0) {
      cancelAnimationFrame(focusRaf);
      focusRaf = 0;
    }
    if (saveTimer !== 0) {
      clearTimeout(saveTimer);
      saveTimer = 0;
    }
    languageObserver.disconnect();
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerdown", onPointerDown, true);
    window.removeEventListener("pointerup", clearPress, true);
    window.removeEventListener("pointercancel", clearPress, true);
    window.removeEventListener("blur", clearPress);
    window.removeEventListener("storage", onStorage);
    style.remove();
    ui.root.remove();
    clearLevelVars();
    try {
      var leftovers = document.querySelectorAll(".dslg-pressed");
      for (var index = 0; index < leftovers.length; index += 1) {
        leftovers[index].classList.remove("dslg-pressed");
      }
    } catch (error) {
      /* Detached document: nothing to clean. */
    }
    if (window.__DSH_LIQUID_GLASS_DISPOSE__ === dispose) {
      delete window.__DSH_LIQUID_GLASS_DISPOSE__;
    }
  }

  window.__DSH_LIQUID_GLASS_DISPOSE__ = dispose;
  return { dispose: dispose };
}

/**
 * DSH browser plugin entrypoint.
 * @param {object} ctx Cordis client context.
 */
function apply(ctx) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  function start() {
    try {
      if (typeof window.__DSH_LIQUID_GLASS_DISPOSE__ === "function") {
        window.__DSH_LIQUID_GLASS_DISPOSE__();
      }
      var instance = mount();
      if (ctx && typeof ctx.effect === "function") {
        ctx.effect(function () {
          return function () {
            instance.dispose();
          };
        }, "dsh-apple-liquid-glass: surface material");
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
exports.inject = [];
