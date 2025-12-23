# WebGL Stick Figure Interactive Website

An interactive website featuring an animated stick figure character controlled via keyboard or touch, rendered with raw WebGL 2.0.

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Build Tool:** Vite
- **Package Manager:** pnpm
- **Rendering:** Raw WebGL 2.0
- **Hosting:** GitHub Pages
- **Domain:** AWS Route 53

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Opens at http://localhost:3000

### Build

```bash
pnpm build
```

Output goes to `dist/` folder.

## Controls

| Input | Action |
|-------|--------|
| W / ↑ | Move up |
| S / ↓ | Move down |
| A / ← | Move left |
| D / → | Move right |
| Diagonal combinations | 8-directional movement |
| Space | Interact with elements |
| Mobile tap | Move toward tap location |

## Project Structure

```
src/
├── main.ts                 # Entry point
├── engine/                 # WebGL rendering engine
│   ├── WebGLRenderer.ts    # Context, viewport, clear
│   ├── ShaderProgram.ts    # Shader compilation
│   ├── TextureLoader.ts    # Image → GL texture
│   └── SpriteBatch.ts      # Batched sprite rendering
├── game/                   # Game logic
│   ├── Game.ts             # Main loop
│   ├── Character.ts        # Player character
│   ├── Background.ts       # Background layers
│   └── Interactable.ts     # Interactive elements
├── input/                  # Input handling
│   ├── InputManager.ts     # Unified input API
│   ├── KeyboardInput.ts    # Keyboard controls
│   └── TouchInput.ts       # Touch/tap controls
├── shaders/                # GLSL shaders
│   ├── sprite.vert         # Vertex shader
│   └── sprite.frag         # Fragment shader
└── types/                  # TypeScript types
    └── index.ts
```

## Adding Your Own Art

### Character Sprites

Place your hand-drawn animation frames in `public/assets/sprites/`:

- `idle.png` - Standing still
- `walk_n_1.png`, `walk_n_2.png`, ... - Walking north
- `walk_ne_1.png`, `walk_ne_2.png`, ... - Walking northeast
- (repeat for all 8 directions: n, ne, e, se, s, sw, w, nw)

### Backgrounds

Place background images in `public/assets/backgrounds/`.

## Deployment

### GitHub Pages

1. Push to GitHub
2. Enable GitHub Pages in repository settings
3. Set source to `gh-pages` branch or GitHub Actions

### Custom Domain (AWS Route 53)

1. In Route 53, add a CNAME record:
   - Name: `www` (or subdomain)
   - Value: `<your-username>.github.io`
   
2. For apex domain, add A records pointing to GitHub's IPs:
   - 185.199.108.153
   - 185.199.109.153
   - 185.199.110.153
   - 185.199.111.153

3. Update `public/CNAME` with your domain name

## Architecture

The project uses a layered architecture:

1. **Input Layer** - Handles keyboard and touch input, provides unified direction API
2. **Game Layer** - Game loop, character logic, interactables
3. **Engine Layer** - Raw WebGL rendering, shaders, texture management

## Documentation

### Learning Guide
See **[TUTORIAL.md](./TUTORIAL.md)** for a comprehensive guide that explains:
- Every file in the project, in learning order
- Code snippets with explanations
- How WebGL rendering works
- Game loop and delta time concepts
- Links to free tutorials for TypeScript, WebGL, Vite, and game development

### Deployment Guide
See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step instructions on:
- Hosting on GitHub Pages
- Automatic CI/CD with GitHub Actions
- Custom domain setup with AWS Route 53
- HTTPS configuration

## Future Enhancements

- [ ] Run animation (shift to run)
- [ ] Dialog system for interactables
- [ ] Link interactables to external URLs
- [ ] Particle effects with WebGL
- [ ] Multiple background layers with parallax
- [ ] Sound effects

