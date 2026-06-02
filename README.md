# brendenbrusberg.com

One-screen personal site for Brenden Brusberg.

The page is a small Vite + TypeScript app with a raw WebGL background inspired by the main patch overview in SimAnt: surface food paths, pheromone trails, rival ants, and an underground nest cutaway. The foreground stays focused on resume and contact links.

## Commands

```sh
pnpm install
pnpm dev
pnpm build
pnpm preview
```

## Structure

```text
src/main.ts                    App entry point
src/styles.css                 Responsive one-screen layout
src/sim/AntPatchSimulation.ts  WebGL patch simulation
public/assets/                 Resume PDF and static assets
```

## Notes

- No writing or poetry sections are included.
- The simulation is decorative and runs entirely locally in the browser.
- The resume link points to `public/assets/brenden-brusberg-resume.pdf`.
- Deployment and DNS handoff lives in `DEPLOYMENT.md`.
