# Artwork Catalog Metadata Design

## Goal

Add the uploaded upright Fern artwork to the existing interactive gallery, replace placeholder artwork names with final titles, add the supplied poems and material notes to expanded artwork views, and place the colored Oxalis #1 next to the uncolored version.

## Scope

- Keep the gallery canvas interaction and unlabeled frames unchanged.
- Extend the existing `artImages` registry in `index.html` with display metadata.
- Add one full-size Fern PNG and one bounded thumbnail.
- Use the exact uploaded Fern pixels without rotation, generation, color changes, or cropping.
- Show an artwork image and its text side by side on desktop and stacked on mobile.
- Keep the full expanded panel scrollable for long poems.
- Do not change navigation, Projects and Writing page copy, simulations, or other panels.

## Gallery Order

1. *Alocasia longiloba* (`art-0`)
2. Kintsugi (`art-1`)
3. Oxalis Triangularis #1 (`art-2`)
4. Oxalis Triangularis #1 (Colored) (`art-4`)
5. Oxalis Triangularis #7 (`art-3`)
6. Goose Rocks Beach (`art-5`)
7. Conflagration (`art-6`)
8. Oxalis Triangularis #9 (`art-7`)
9. *Davallia fejeensis* (`art-8`)

Only *Alocasia longiloba* and *Davallia fejeensis* are italicized. Oxalis Triangularis titles remain upright.

## Visible Copy

Metadata uses no category labels or colons. Optional common-name and care lines come first, followed by materials and then surface.

### *Alocasia longiloba*

```text
PIGMA Micron pens and gouache
100% cotton, cold-pressed, 140 lb
```

### Kintsugi

Every poem line is rendered bold, with stanza breaks and indentation preserved.

```text
The knight's knees buckled as he dropped
    onto the cold stone,
suffocating in his own armor.

Slowly, his plate popped
    as he stood, against his broken bones,
undoubting his attraction to harm.

"We must roll
    him up in bubble wrap."
And now, looking at his bones and their words,
        he felt no ease
            at his expense.

As if he was his own handicap,
he learned from those to withhold any mishap,
hating as though they could only see some bumbling sap
needing to dress head to soul in scrap.

Only when he rejected his armor's stranglehold
did he see his duty was to those who consoled,
that look past what mishaps mold,
knowing fractures can be fixed with gold,
not mail, shield, and strongholds.
```

```text
PIGMA Micron pens and gouache
100% cotton, cold-pressed, 140 lb
```

### Oxalis Triangularis #1

```text
"Purple Shamrock" or "False Clover"

PIGMA Micron 05 and 03 pens
Violet, rose, and cobalt blue gouache
100% cotton, cold-pressed, 140 lb
```

### Oxalis Triangularis #1 (Colored)

```text
"Purple Shamrock" or "False Clover"

PIGMA Micron 05 and 03 pens
Violet, rose, and cobalt blue gouache
100% cotton, cold-pressed, 140 lb
```

### Oxalis Triangularis #7

```text
"Purple Shamrock" or "False Clover"

PIGMA Micron 005 and 03 pens
Violet, rose, cobalt blue, yellow green, sky blue, acid blue, and ultramarine gouache
100% cotton, cold-pressed, 140 lb
```

### Goose Rocks Beach

```text
Gouache
100% cotton, cold-pressed, 140 lb
```

### Conflagration

Every poem line is rendered bold, with stanza breaks and indentation preserved.

```text
My brain turned off today,
stuck in the unable realization
that the rules I disobey
are the ones I make in desperation.

In hindsight, there was so much to be done
but I chose to ignore my infliction
of the sun.
    A semi-self-subconscious inoculation.

I remember the way my skin crawled
as every thought sought out an explanation.
Every second, an irrevocable countdown I cannot stall,
to get to the bottom of an endless spiral staircase to find salvation.

One deep breath can't stop two questions,
finding out the answer to irradiation
    was only a suggestion.
Every thought was an escalation to my justification.

How did I ever get this far,
    not getting any bit further from my own lamentation.
Missing every stop on my own trolley car,
propelled from the internal threat of oxidation.
```

```text
PIGMA Micron pens and gouache
100% cotton, cold-pressed, 140 lb
```

### Oxalis Triangularis #9

```text
PIGMA Micron 0.25 mm pen and watercolor
Watercolor paper
```

### *Davallia fejeensis*

```text
"Rabbit's Foot Fern"
Cannot survive below 55 F (13 C)

PIGMA Micron 0.25 mm pen and watercolor
Watercolor paper
```

## Data And Rendering

Each artwork keeps a plain `title` for alt text and accessible dialog naming. Entries may also provide `titleHtml` for the two italicized botanical titles and `detailsHtml` for trusted static copy. The popout item body contains a responsive artwork layout with the image and metadata. The existing poem popout remains unchanged.

On desktop, the artwork popout uses two columns so the image and text are visible together. On mobile, it uses one column so text never overlaps the image. Poem and metadata text scroll within the existing bounded panel.

## Asset Handling

- Full image: `public/art/davallia-fejeensis.png`
- Thumbnail: `public/art/thumbs/davallia-fejeensis.png`
- Full-image SHA-256 must match the recovered raw upload: `C6E7C7972A339E4934DD1067C9BE67EAFB68477D96E9F5730C56ED1D95F0FB55`.
- Full image dimensions remain `1372x1824`.
- Thumbnail preserves orientation and aspect ratio, is bounded to 640 px, and is smaller than the full asset.

## Verification

- A source contract test fails before implementation and then confirms nine entries, exact order, titles, key copy, and responsive artwork-popout hooks.
- An asset contract confirms the full image hash and dimensions plus thumbnail bounds and orientation.
- `pnpm build` succeeds.
- Desktop and mobile browser checks confirm all nine frames render, the new Fern opens, long poem content is reachable, scientific-name italics are limited to the requested titles, and there is no horizontal overflow.
- After push, the matching Vercel production deployment reaches `READY`, the custom domain loads, and the Fern asset returns HTTP 200.
