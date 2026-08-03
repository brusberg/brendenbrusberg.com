# Artwork Catalog Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the uploaded fern to the art gallery, replace placeholder titles with approved artwork metadata, preserve poem formatting, and keep the expanded artwork view usable on desktop and mobile.

**Architecture:** Keep the existing single-file artwork registry, inline page styles, and popout system in `index.html`. Add trusted static `titleHtml` and `detailsHtml` fields to the artwork entries, render those fields inside a responsive `.artwork-popout`, and validate the static contract and image assets with dependency-free Node tests.

**Tech Stack:** HTML, vanilla JavaScript, CSS, Node.js built-in test runner, Vite, PowerShell `System.Drawing` for deterministic thumbnail resizing.

## Global Constraints

- Use the exact uploaded fern pixels for `public/art/davallia-fejeensis.png`; do not rotate, generate, crop, recolor, or retouch the full image.
- The full fern image must remain `1372x1824` with SHA-256 `C6E7C7972A339E4934DD1067C9BE67EAFB68477D96E9F5730C56ED1D95F0FB55`.
- Keep gallery canvas interaction, unlabeled frames, navigation, simulations, and non-art panel copy unchanged.
- Use no visible metadata category labels or colons.
- Put optional common-name and care lines first, materials second, and surface last.
- Italicize only `Alocasia longiloba` and `Davallia fejeensis`; keep every Oxalis title upright.
- Preserve poem stanza breaks and indentation, and render every poem line bold.

---

### Task 1: Artwork Source Contract

**Files:**
- Create: `tests/artwork-catalog.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `index.html` as a UTF-8 source file.
- Produces: `pnpm test:artwork-source`, which exits nonzero until the approved registry, copy, and responsive hooks exist.

- [ ] **Step 1: Write the failing source contract test**

Create `tests/artwork-catalog.test.mjs` with Node's built-in test runner. Assert that the `artImages` registry contains exactly nine IDs in this order:

```js
const expectedOrder = [
  'art-0', 'art-1', 'art-2', 'art-4', 'art-3',
  'art-5', 'art-6', 'art-7', 'art-8'
];
```

Assert the approved titles, `davallia-fejeensis.png` paths, `Rabbit's Foot Fern`, the `55&deg;F (13&deg;C)` care line, both poem opening lines, `.artwork-popout`, `.artwork-details`, `.artwork-poem`, and the mobile one-column override. Assert there are exactly two `titleHtml` values and that they contain `Alocasia longiloba` and `Davallia fejeensis`.

- [ ] **Step 2: Add the source test command**

Add this script to `package.json`:

```json
"test:artwork-source": "node --test tests/artwork-catalog.test.mjs"
```

- [ ] **Step 3: Run the source contract and verify RED**

Run:

```bash
pnpm test:artwork-source
```

Expected: FAIL because the registry still has eight placeholder entries and the responsive artwork popout hooks do not exist.

### Task 2: Artwork Registry And Responsive Popout

**Files:**
- Modify: `index.html:922-953`
- Modify: `index.html:7907-7914`
- Modify: `index.html:567-821` inline popout styles

**Interfaces:**
- Consumes: Existing `escapeAttr`, `escapeHtml`, `artImages`, `popoutItems`, and `openPopout` behavior.
- Produces: Nine ordered artwork objects with `title`, optional `titleHtml`, `src`, `thumb`, and trusted static `detailsHtml`; a two-column desktop and one-column mobile artwork popout.

- [ ] **Step 1: Replace placeholder registry metadata**

Keep each existing source image paired with its established ID, reorder `art-4` immediately after `art-2`, and append `art-8`. Use the exact gallery order and visible copy in `docs/superpowers/specs/2026-08-03-artwork-catalog-metadata-design.md`.

Use plain `title` values for image alt text. Add `titleHtml: '<em>...</em>'` only to `art-0` and `art-8`. Store poems as static HTML paragraphs with `<strong>` around all poem text and `.poem-indent` spans for indented lines.

- [ ] **Step 2: Render the artwork-specific popout body**

Build each artwork body with this structure:

```html
<div class="artwork-popout">
  <div class="artwork-media"><img src="..." alt="..."></div>
  <div class="artwork-details">...</div>
</div>
```

Carry optional `titleHtml` into `popoutItems`. In `openPopout`, assign `innerHTML` only when trusted static `titleHtml` exists; otherwise assign `textContent` so the existing writing popout behavior stays unchanged.

- [ ] **Step 3: Add responsive styles**

Add a bounded two-column grid for `.artwork-popout`, contain the image without cropping, style metadata spacing, preserve poem indentation, and add this mobile behavior inside the existing `@media (max-width: 980px)`:

```css
.artwork-popout {
  grid-template-columns: minmax(0, 1fr);
}
```

Ensure the existing `.popout-panel` remains the scrolling boundary and no new horizontal overflow is possible.

- [ ] **Step 4: Run the source contract and verify GREEN**

Run:

```bash
pnpm test:artwork-source
```

Expected: PASS with the nine-entry registry, exact ordering and titles, approved copy, two scientific-name italics, and responsive hooks present.

### Task 3: Fern Asset Contract And Exact Asset Addition

**Files:**
- Create: `tests/artwork-assets.test.mjs`
- Create: `public/art/davallia-fejeensis.png`
- Create: `public/art/thumbs/davallia-fejeensis.png`
- Modify: `package.json`

**Interfaces:**
- Consumes: The recovered raw upload at `artifacts/new-art-raw.png` in the shared Codex workspace.
- Produces: An untouched full asset and aspect-preserving thumbnail validated by `pnpm test:artwork-assets`.

- [ ] **Step 1: Write the failing asset contract**

Create `tests/artwork-assets.test.mjs` using `node:test`, `node:assert/strict`, `node:crypto`, and `node:fs`. Parse PNG width and height from bytes 16-23 of the IHDR header. Assert:

```js
full.sha256 === 'C6E7C7972A339E4934DD1067C9BE67EAFB68477D96E9F5730C56ED1D95F0FB55'
full.width === 1372
full.height === 1824
thumbnail.width <= 640
thumbnail.height <= 640
thumbnail.height > thumbnail.width
thumbnail.bytes < full.bytes
```

- [ ] **Step 2: Add the asset test command and verify RED**

Add:

```json
"test:artwork-assets": "node --test tests/artwork-assets.test.mjs",
"test:artwork": "pnpm test:artwork-source && pnpm test:artwork-assets"
```

Run `pnpm test:artwork-assets` and expect failure because `public/art/davallia-fejeensis.png` is absent.

- [ ] **Step 3: Copy the raw upload without transformation**

Copy the raw workspace file byte-for-byte to `public/art/davallia-fejeensis.png`. Verify the copy with `Get-FileHash -Algorithm SHA256` before creating the thumbnail.

- [ ] **Step 4: Generate only the thumbnail**

Use `System.Drawing.Image.FromFile`, compute an aspect-preserving fit inside `640x640`, draw to a new bitmap with high-quality bicubic interpolation, save as PNG, and dispose all image objects. Do not overwrite or reopen-save the full image.

- [ ] **Step 5: Run the asset and combined contracts and verify GREEN**

Run:

```bash
pnpm test:artwork-assets
pnpm test:artwork
```

Expected: PASS; the full hash and dimensions match, the thumbnail is portrait, bounded, and smaller, and all source assertions remain green.

### Task 4: Build And Browser Verification

**Files:**
- Verify: `dist/` generated output only; do not commit generated files unless already tracked and changed by the build.

**Interfaces:**
- Consumes: Completed source and asset changes.
- Produces: Evidence that the gallery and popouts work at desktop and mobile widths without regressions.

- [ ] **Step 1: Build production output**

Run:

```bash
pnpm build
```

Expected: TypeScript and Vite complete successfully with no warnings or errors.

- [ ] **Step 2: Start or reuse the local server on port 4000**

Run the Vite dev server bound to `0.0.0.0:4000` if it is not already responding, then open `http://localhost:4000/#art`.

- [ ] **Step 3: Verify desktop behavior**

At `1440x900`, confirm nine framed works render, the Oxalis #1 pair is adjacent, the fern opens with an italic title, its full image is upright, its copy is ordered correctly, and `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.

- [ ] **Step 4: Verify long poem behavior**

Open `Conflagration`, confirm the final `oxidation` line is reachable by scrolling inside the bounded dialog, all poem lines are bold, and the dialog does not overflow horizontally.

- [ ] **Step 5: Verify mobile behavior**

At `390x844`, open the fern and Kintsugi. Confirm the image and text stack into one column, no text overlaps the image, the content scrolls, and no horizontal overflow is introduced.

- [ ] **Step 6: Review the final diff**

Run `git diff --check`, `git status --short`, and `git diff -- index.html package.json tests public/art`. Confirm unrelated untracked files under `docs/superpowers/plans/` remain untouched.

### Task 5: Commit, Push, And Production Verification

**Files:**
- Commit only the approved artwork source, tests, assets, and this implementation plan.

**Interfaces:**
- Consumes: Green tests, successful build, and browser verification.
- Produces: A pushed `main` commit, a matching `READY` Vercel production deployment, and a working custom-domain gallery.

- [ ] **Step 1: Commit the implementation**

Stage exact paths and commit with:

```bash
git commit -m "feat: add artwork titles details and fern"
```

- [ ] **Step 2: Push `main`**

Push with the authenticated Windows Git client against the WSL UNC repository and record the pushed commit SHA.

- [ ] **Step 3: Monitor the matching Vercel deployment**

Find the deployment for the pushed SHA in team `team_TchN3O16e6cwBNwaYChMBtJc`, project `prj_G8UOfkyYIWTMJqhRqDRbDrrZQzd5`, and wait until its state is `READY`.

- [ ] **Step 4: Verify the production domain and asset**

Load `https://brendenbrusberg.com/#art` through its redirect to `www.brendenbrusberg.com`, confirm the new fern title is present, and verify `/art/davallia-fejeensis.png` returns HTTP 200.

- [ ] **Step 5: Report evidence**

Report the commit SHA, passing test/build commands, deployment state and URL, custom-domain result, and any unrelated files intentionally left uncommitted.
