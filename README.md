# Liquid Glass — DSH Apple Liquid Glass

An Apple-style liquid-glass material for the DeepSeek Harness web client: composer, sidebar controls, model picker, and send button, with a faint flowing blue glow along the composer's top edge and sides that freezes while you type. A ~6 second handwritten **hello** opening animation and the original four per-surface **scope** switches are included. Intensity, scope, and splash are configured in **Settings → Liquid Glass**; the chat surface has no floating control. The page background stays untouched.

![Light](docs/preview-light.png)

![Dark](docs/preview-dark.png)

![Settings](docs/preview-settings.png)

![Opening animation](docs/preview-splash.png)

> Captured in a real DSH 0.2.1-rc.5 web profile.

---

## Install

Repository: <https://github.com/tianyuec11-design/dsh-apple-liquid-glass>

### From GitHub (recommended)

**DSH Desktop**

1. Open **Plugins** in the sidebar.
2. Click **Add plugin / +** and choose **Install a third-party plugin**.
3. Paste the repository URL:

   ```text
   https://github.com/tianyuec11-design/dsh-apple-liquid-glass
   ```

4. Install, then **Enable** it. Refresh the page (or restart if the host asks).
5. Open **Settings** (bottom-left account menu → Settings) → **Liquid Glass**. The intensity slider and the **Opening animation** switch live there.

**`dsh web`**

```powershell
dsh plugin --profile web add 'github:tianyuec11-design/dsh-apple-liquid-glass'
```

Restart `dsh web` afterwards. `dsh plugin` needs pnpm on `PATH`; the Desktop app ships its own package manager.

**GitHub Release tarball**

A pinned release is also available as:

```text
https://github.com/tianyuec11-design/dsh-apple-liquid-glass/releases/download/v0.2.1/dsh-apple-liquid-glass-0.2.1.tgz
```

> dshmarket's **Themes** tab only lists themes in its catalog. A GitHub-installed theme appears under **Installed plugins**; it is still a complete bundle theme and can be enabled or disabled normally.

### From a local folder (development)

1. **Plugins → Add plugin / + → Install a third-party plugin**.
2. Paste the absolute path to this folder (replace with your local checkout):

   ```text
   C:\path\to\dsh-apple-liquid-glass
   ```

3. Install → **Enable** → refresh.

Local `dsh web` install:

```powershell
dsh plugin --profile web add "C:\path\to\dsh-apple-liquid-glass"
```

### From a self-built tarball

```powershell
node scripts/build.mjs
npm pack
```

Then install `dsh-apple-liquid-glass-0.2.1.tgz` through the plugin manager.

---

## Use

Everything lives in **Settings → Liquid Glass**; the chat surface has no floating button.

- **Glass intensity**: 0–100% slider with presets **Off / Light / Mid / Strong** = 0 / 35 / 65 / 100; applies live and saves automatically.
- **Surfaces**: the original four independent switches — composer card, sidebar controls, model picker, send button. Turn one off and it keeps its native look while the rest stay glass.
- **Opening animation**: switch. Enabling it previews once; afterwards it plays once per DSH window session (a same-tab refresh does not repeat it).
- The choice persists per browser in `localStorage` (key `dsh-apple-liquid-glass.settings.v1`).
- **0% removes every surface override**; the opening animation remains controlled by its own switch.

### Surfaces

In **Settings → Liquid Glass → Surfaces**, each switch is independent:

| Switch | Covers |
| --- | --- |
| Composer card | The input card, `+`, access-mode pill, and the blue top/side glow |
| Sidebar controls | New session, panel rows, workspace rows, session rows, icon buttons, search field |
| Model picker | The model trigger inside the composer |
| Send button | Send / stop button |

All four are on by default. Turning one off restores that surface to native immediately while the others stay glass; the choice survives a reload. The blue edge glow belongs to **Composer card**, so turning that off removes it too. At 0% every surface is native, but the four switch states are preserved.

### Composer edge glow

- When glass is on, a blue gradient halo runs along the composer's top edge and both sides.
- A 2px strip plus a 1.5px blur keeps the visible thickness under **1.5mm (about 5.67 CSS px)**.
- Typing, key presses, or IME composition freeze the flow immediately; it resumes about 1.1s after the last input.
- At 0% or with glass off, the glow disappears completely.

### Opening animation

- An Apple-event-style handwritten lowercase **hello**: a translucent frosted-black stage, a light blue/white gradient, glassy highlights, and a small glowing pen tip drawing left-to-right.
- About 6 seconds; click anywhere or press `Esc` to skip.
- The bundled **Dancing Script** font (SIL OFL 1.1) balances a small lowercase script with rounded, even strokes; Snell Roundhand / Apple Chancery are listed as system fallbacks.
- With `prefers-reduced-motion`, a static hello is shown for about 2 seconds.

### Material scope

| Area | Elements |
| --- | --- |
| Composer | Input card, `+` add button, access-mode pill |
| Composer edges | Flowing blue glow on the top edge and both sides |
| Left sidebar | Brand/new-session, panel nav rows, workspace rows, session rows, settings/account row; small icon buttons on hover/focus |
| Model picker | The model trigger inside the composer |
| Send | Send/stop button |

The page background, message bubbles, header, and the model dropdown menu itself are out of scope for this version. See **Surfaces** above for which switch covers which area.

---

## How it works

- Pure CSS material, a tiny DOM controller, and a React settings section; the material and opening animation have no third-party dependency.
- The composer's `backdrop-filter` lives on a `::before` pseudo-element so the card never becomes the backdrop root of its fixed-position popups; `isolation: isolate` keeps the stacking local.
- The blue edge glow lives on the card's `::after`: two side gradients plus a top gradient animated through `background-position`. While typing, the controller sets `data-dslg-typing="true"` on the card and CSS pauses the animation.
- Sidebar styling targets clickable elements, never the whole column, so the background stays native.
- Pointer movement updates `--dslg-mx/--dslg-my` for a moving specular highlight. Press feedback uses the individual `scale` property so the host's own `transform` survives.
- At 0% the controller removes `body[data-dslg-glass="on"]` and every `--dslg-*` variable; all surface selectors stop matching.
- The Settings section registers through DSH's `settings.section` slot (`slots` + `locale`); no button is added to the chat surface.
- Surface scope is stored as `surfaces` (composer / sidebar / model / send). The controller writes `body[data-dslg-composer|sidebar|model|send="on|off"]`, and every material selector is narrowed by its surface attribute, so turning one off removes only that group of overrides.
- The opening animation is a full-screen DOM layer: an embedded Dancing Script WOFF2, a soft mask driven by `@property --dslg-reveal`, gradient text, and a pen-tip dot. Writing starts after the font is ready, avoiding a fallback-font flash.
- `prefers-reduced-motion` and `prefers-reduced-transparency` are respected.
- Light/dark follows the host through `body[data-ds-dark-theme]`.

### Files

```text
dsh-apple-liquid-glass/
├─ package.json
├─ cordis.patch.yml          # bundle registration
├─ lib/
│  ├─ index.js               # host half: intentional no-op
│  └─ client.js              # built browser bundle
├─ src/
│  ├─ client.js              # material, settings, splash source
│  └─ style.css              # material, settings, splash styles
├─ assets/
│  ├─ fonts/                 # Dancing Script WOFF2 + OFL
│  └─ icon.svg
├─ scripts/build.mjs         # wraps the ModuleLoader bundle and inlines the font
├─ preview/harness.html      # static development preview
├─ docs/                     # README screenshots
└─ LICENSE
```

### Development

```powershell
node scripts/build.mjs
start .\preview\harness.html
```

The preview accepts `?theme=light|dark&level=0..100&splash=1&typing=1&hover=1&lang=en`. It uses a mock host DOM; the settings section needs a real DSH host.

After installing from a local folder, DSH HMR may reload the bundle automatically. If not, refresh the page or restart the host. The Desktop plugin manager installs a copy, so reinstall after source changes, or use a link install during development.

---

## Compatibility

- DSH **>= 0.2.1-0**.
- Verified on **DSH 0.2.1-rc.5** (web profile): light/dark, 0%/62%/100%, glow pause while typing, all four surface switches and their persistence across reload, settings slider and splash switch, splash playback and skip.
- Desktop uses the same web client; the settings section relies on the host's `settings.section` / `slots` / `locale` services, available in 0.2.1.
- Chromium/Electron only; Safari/Firefox are not tested.

### Known limitations

- The model dropdown menu, message bubbles, and header are not themed yet.
- Small sidebar icon buttons get the material on hover/focus only, to avoid a wall of blur.
- No SVG edge refraction yet; the current material is blur + saturation + translucent tint + specular highlight + bevel + shadow.
- The opening animation is an approximation of Apple's event style, not Apple's proprietary artwork; it uses bundled Dancing Script with Snell Roundhand / Apple Chancery as system fallbacks.
- The splash plays once per window session; a same-tab refresh does not repeat it. Toggle it off and on in Settings to preview again.
- The glow resumes about 1.1s after the last keystroke by design.
- No wallpaper and no page-background changes.

---

## Uninstall

- **Desktop**: Plugins page → this plugin → **Remove**; restart if prompted.
- **Web**:

  ```powershell
  dsh plugin --profile web remove dsh-apple-liquid-glass
  ```

---

## License

MIT. See [LICENSE](LICENSE).

The opening font **Dancing Script** © The Dancing Script Project Authors, distributed under the SIL Open Font License 1.1; see [assets/fonts/OFL.txt](assets/fonts/OFL.txt).

"Liquid Glass" describes the visual material. This project is not affiliated with or endorsed by Apple Inc.
