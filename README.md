# brendenbrusberg.com

Personal site for Brenden Brusberg.

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
src/styles.css                 Ant simulation layout
src/profile.css                Responsive homepage profile
resume/index.html              Searchable, responsive resume
src/sim/AntPatchSimulation.ts  WebGL patch simulation
public/assets/                 Resume PDF and static assets
```

## Notes

- No writing or poetry sections are included.
- The simulation is decorative and runs entirely locally in the browser.
- The resume link opens the responsive `resume/index.html` page at `/resume/`. Its download link points to `public/assets/brenden-brusberg-resume.pdf`.
- Keep the HTML resume and PDF content synchronized when updating experience. The PDF sends a canonical Link header to `/resume/`.
- The canonical host is `www.brendenbrusberg.com`, matching the Vercel domain redirect.
- Deployment and DNS handoff lives in `DEPLOYMENT.md`.
