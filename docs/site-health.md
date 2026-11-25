# Site health: WebGL freezes, design drift, and what to fix next

Local tooling added 2026-11-24. Nothing here ships to production visitors.

## 1. The WebGL freeze — root cause confirmed

**The page can lose its WebGL context and will never recover.** Reproduced locally,
in a browser, on this machine.

### What happens

`index.html` creates exactly one WebGL2 context, on the `#stagegl` canvas. Both GL
scenes share it:

| Scene | Where | Gets its context |
|---|---|---|
| `MandelbrotScene` | `index.html:1340` | `glCanvas.getContext('webgl2', {...})` on mount |
| `ArtScene` starfield | `index.html:7700` | `glCanvas.getContext('webgl2')` in `setupGl()` |
| Ant sim | `src/sim/AntPatchSimulation.ts:82` | its own canvas, on `/ant.html` |

There is **no `webglcontextlost` listener anywhere in the codebase.** That single
omission is the whole bug, and it has two consequences:

1. **The loss is permanent.** The browser fires `webglcontextlost`, and unless a
   handler calls `event.preventDefault()`, the browser will never fire
   `webglcontextrestored`. Nobody calls it, so the context is gone for the life of
   the tab.
2. **Nothing notices.** Every subsequent `gl.*` call on the dead context is a silent
   no-op — no exception, no console error. The render loop keeps "running" against a
   corpse.

`ArtScene.setupGl()` makes recovery impossible even in principle:

```js
setupGl() {
  if (this.gl || this.glFailed) return;   // <- this.gl is still truthy after loss
```

Once `this.gl` is set it is never cleared, so re-entering the scene reuses the dead
context rather than building a new one.

### The reproduction

With the watchdog armed, forcing a loss via `WEBGL_lose_context`:

```
context lost: #1 "stagegl" — preventDefaultCalled: false
              "nobody called preventDefault — this context can never be restored"
restoredCount: 0
frames before loss ............ 3054
frames during the 2s after .... 3119   (~32fps, still ticking)
frames over the next 4s ....... 3123   (4 frames — ~1fps)
errors logged ................. 0
```

Four frames in four seconds, no error of any kind. That is the freeze, and it matches
"over time it happens": a GPU driver reset, a long sleep/wake, memory pressure, or
switching GPUs will drop a context on a page that has been open a while — and this
page never comes back from it.

### The fix — applied on `fix/webgl-context-loss`

`Scene` gained two lifecycle hooks, `glLost()` and `glRestored()`, and the shared
`#stagegl` canvas now has real handlers:

- **`webglcontextlost` calls `event.preventDefault()`.** This is the line that makes a
  restore possible at all. It then tells every cached scene to drop its GL handles.
- **`webglcontextrestored`** remounts the active scene so it rebuilds its program,
  VAO, buffers and uniforms against the new context.
- **`MandelbrotScene.glLost()`** flips to its existing 2d fallback and shows
  "Graphics context lost — restoring" in the readout.
- **`ArtScene`** gained a `glSuspended` flag, so `setupGl()`'s guard stops lying about
  owning a live context — and `drawBackground()` falls through to the 2d starfield, so
  the art panel keeps working during a loss.
- **The render loop keeps running** through a loss (it is what notices the restore) but
  skips Mandelbrot's tick rather than issuing calls that silently do nothing.
- **`src/sim/AntPatchSimulation.ts`** got the same treatment for `/ant.html`: its
  `program`, `texture` and `vertexArray` are rebuilt on restore. Colony state lives in
  plain arrays, so the simulation itself survives untouched.

Measured before and after, forcing a loss with `WEBGL_lose_context`:

| | before | after |
|---|---|---|
| `preventDefault` called | no | **yes** |
| context restored | never | **yes** (`restoredCount: 1`) |
| frames in the 3s after | 4 | **~74/s** (main page), **~119/s** (ant sim) |
| errors logged | 0 | 0 |
| ant colony state | — | preserved across the loss |

## 1b. Frame rate: capped at 30fps, and a speed bug fixed

Two separate problems, found while capping the render rate.

**The page rendered at the display's native rate.** On a 120Hz panel the ants, art
and Mandelbrot scenes drew 120 times a second. Only `stats` (50ms) and `mandelbrot`
(32ms) had budgets; everything else was uncapped. All panels now default to
`1000 / 30`, with a 2ms tolerance — without it, four 120Hz frames (33.33ms) miss a
33.34ms target and the cadence collapses to 24fps.

**Capping alone would have halved every animation's speed.** `frame()` passed a
hardcoded `1 / 60` as dt, and scenes integrate against it:

```js
train.progress += train.speed * ... * dt * 60;   // stats panel
const k = Math.min(1.4, dt * 60);                // art card physics
```

Animation speed was tied to frame *count*, not time — so the site ran at **2× speed on
a 120Hz display** and correct speed on 60Hz. `frame()` now passes real elapsed
seconds, clamped to 100ms so a backgrounded tab doesn't integrate one huge jump.

Measured after the change:

| Panel | draws/sec | sim seconds per real second |
|---|---|---|
| ants | 30 | 1.000 |
| art | 30 | 1.000 |
| mandelbrot | 30 | 1.000 |
| stats (train) | 20 | 1.000 |
| ant sim (iframe) | 30 | 1.013 |

Every panel now advances at real time regardless of refresh rate. On a 120Hz display
animations look half as fast as they used to, because they are no longer double speed.

**The colony is not slowed by the cap.** `AntModel` runs a fixed `FRAME_STEP = 1/60`
timestep behind an accumulator, so a 33ms frame simply runs two model steps instead of
one. Note the corollary: capping saves the *draw* half of the work only. The 60Hz model
updates still run every second, so if the sim is slow on a phone, profile
`model.update` — not rendering.

## 2. Catching it in the wild: the watchdog

`public/dev/watchdog.js`. Loads **only** on localhost, or anywhere with `?watchdog=1`,
or when `localStorage.watchdog === '1'`. Production visitors never fetch it.

```
pnpm dev
open http://localhost:5173/?watchdog=1
```

A small HUD appears bottom-left (parent page only — the embedded ant frame logs without one, and its numbers fold into the parent HUD and report). Leave the tab open as long as you like; click the HUD
to copy a full report to the clipboard.

It records, and persists across reloads in `localStorage`:

- every WebGL context created, and whether any was lost or restored
- **real GPU draws per second**, counted by wrapping `drawArrays`/`drawElements`, shown
  next to the rAF rate. These differ on purpose: a frame-rate cap keeps requesting
  frames and skips the work, so rAF stays at 120/s while draws sit at 30/s. Reading
  rAF as "fps" will mislead you — the HUD labels them separately for that reason.
- frame stalls (>250ms) and freezes (>1s), with the worst gap and when it happened
- a timer-based check that catches rAF dying entirely — the real "page froze" case
- long tasks over 200ms
- JS heap trend, flagging a sustained climb over 50MB
- uncaught errors and unhandled rejections

```js
__watchdog.report()   // printable summary, including earlier sessions
__watchdog.json()     // same as data
__watchdog.clear()    // wipe history
__watchdog.off()      // stop arming on reload
```

The persistence is the point: a freeze usually happens when you aren't watching, and
the log survives it.

## 3. Unattended soaking

`scripts/soak-webgl.mjs` — zero npm dependencies, drives a Chromium over the DevTools
protocol using Node's built-in WebSocket.

```sh
pnpm soak                      # 10 minutes, headless
pnpm soak:long                 # 60 minutes, headful
node scripts/soak-webgl.mjs --minutes 30 --url https://www.brendenbrusberg.com
```

It builds and serves the site, opens it with the watchdog armed, cycles
`#ants → #mandelbrot → #art → #stats` to force the GL scenes to mount and unmount,
samples the watchdog every 15s, and writes `.soak/report-<stamp>.json`. Exits non-zero
on context loss, a freeze, or >150MB of heap growth, so it can gate CI later.

**This machine has no Chromium** — only Firefox and Safari, which do not speak CDP. To
use the runner:

```sh
pnpm dlx playwright install chromium
```

The script finds that cached download automatically. Until then, use the watchdog
manually in Firefox or Safari, which works fine.

Also worth knowing: headless Chromium renders WebGL through SwiftShader, which will
**not** reproduce a GPU-driver context loss. Headless is good for leaks, freezes and
long tasks; use `--headful` when hunting the real thing.

## 4. Design drift

`pnpm audit:design` (add `--json` for data, `--strict` to fail on budget overruns).

Current state:

| | count | budget |
|---|---|---|
| distinct colors | **83** | 24 |
| distinct font sizes | **54** | 14 |
| font families | 3 | 3 |
| border radii | 4 | 8 |
| box shadows | 3 | 6 |
| z-indexes | 6 | 8 |
| CSS custom properties | **3** | — |

The last row explains the first two. There are three custom properties in the whole
site and none of them is a color or a font size, so **there is no token layer to drift
from** — every page re-invents its own values.

Three independent style systems, none importing another:

| Page | Stylesheets linked | Inline CSS |
|---|---|---|
| `index.html` | `/src/profile.css` | 827 lines |
| `ant.html` | none | 0 lines |
| `resume/index.html` | none | 29 lines |

Concrete near-duplicates the audit found — same color, written differently:

```
#fff8e8  ~  #f7f1df  ~  #fff9e9     (cream, 3 ways across 4 files)
#08100b  ~  #07100b  ~  #111111  ~  #151812  ~  #11140f  ~  #10170f
                                     (near-black, 6 ways)
#d6bd68  ~  #d9c56d                 (gold, index.html vs error.css)
#3b3e2c  ~  #333333                 (both inside resume/index.html alone)
```

46 of the 54 font sizes appear in exactly one place.

Head inconsistencies:

- `index.html` and `ant.html` ship an **identical `<title>`** and both claim
  `canonical https://www.brendenbrusberg.com/`. Intentional for the iframe, but the
  duplicate title is an SEO own-goal.
- `theme-color` disagrees: `#08100b` on index and resume, `#191d19` on ant.

### Suggested order of attack

1. Define `:root` tokens once — ~8 colors, a 6-step type scale — in a file all three
   pages import.
2. Collapse the near-duplicate clusters above onto those tokens. That alone should
   take colors from 83 to roughly the low 20s.
3. Lower the budgets in `scripts/audit-design.mjs` as you go, and wire
   `pnpm audit:design --strict` into `.github/workflows/ci.yml` so it can't drift back.

## 5. Other things worth improving

- **`index.html` is 8,943 lines** with an 827-line `<style>` and a ~7,900-line inline
  `<script>`. None of it is type-checked, linted or minified; `tsc` only sees
  `src/`. Extracting the scenes into `src/` modules would put them under the same
  compiler as the ant sim.
- **The ant simulation exists twice** — `src/sim/AntModel.ts` (3,544 lines) and a
  separate copy inline in `index.html`. Two implementations of one thing will diverge.
- **Shader compiles look expensive.** Switching into a GL scene showed ~1–3s frame gaps
  locally. Worth confirming with a headful soak before acting — it may be an artifact
  of the automation pane rather than a real stall.
- **No error reporting from production.** Vercel runtime logs only cover server-side;
  a client-side freeze leaves no trace. The watchdog could be made to POST its report
  if you ever want real-visitor data.
- **`.github/workflows/ci.yml` runs build checks only.** `pnpm test:artwork` and
  `pnpm audit:design --strict` are both cheap enough to add.

## 6. Projects panel

`public/panels/projects.js` now splits the grid into **Vibe coded** and **Written by
hand**, driven by a `mode` field on each project so re-filing one is a one-word edit.

Current split — **check these, they are my inference, not your word**:

| Project | Filed as | Why |
|---|---|---|
| Poker Snake | vibe | recent TypeScript, built in the Codex era |
| This site | vibe | the repo's branches are literally `codex/*` |
| Dungeons and Kittens | vibe | assumption — correct me |
| Rust Steaming Coffee | hand | its own blurb says "Written by hand to learn" |
| Emotion Archive | hand | professional design work, pre-dates all this |
