# Project And Writing Item Blocks Design

## Goal

Give the Projects and Writing sections a consistent, scannable item pattern.
Each project becomes a separate clickable block with a title and description,
and the poem block no longer repeats the Writing category label inside itself.

## Project Blocks

The Projects section keeps its existing section heading but replaces its loose
paragraphs with a responsive grid of four bordered links. Each entire block is
clickable and contains a strong title followed by a short description.

The blocks appear in this order:

1. **Poker Snake** - Build poker hands by drawing connected paths through a 6x6
   card board in a twelve-round roguelike campaign.
2. **Dungeons and Kittens** - Online tabletop.
3. **Rust Steaming Coffee** - Written by hand to learn.
4. **Emotion Archive** - Finding global empathy in a challenging time.

The existing destinations remain unchanged:

- Poker Snake: `https://poker-snake.com/`
- Dungeons and Kittens: `https://dungeons-kitten-table.vercel.app/`
- Rust Steaming Coffee: `https://github.com/brusberg/coffee`
- Emotion Archive: the existing McKinsey Emotion Archive URL

## Writing Block

The Writing section heading and introductory paragraph remain unchanged. The
poem button keeps opening the existing popout, but its inner content becomes:

- Title: **Freighter-00G8**
- Description: **Poem**

The redundant uppercase `WRITING` label inside the button is removed.

## Visual Treatment

Project blocks and the poem button share the existing restrained border,
background, padding, hover border, and square-corner treatment. Titles use the
current bright text color and descriptions use the quieter body-text color.

Projects use a two-column grid when the available content width supports it and
collapse to one column on mobile. The poem remains a single block with its
existing maximum width. No page section becomes a containing card, and no card
is nested inside another card.

## Implementation Scope

- Update `public/panels/projects.js` to render the four project blocks in the
  approved order.
- Update `index.html` to add the project-grid and project-block styles and to
  change the poem button's inner title and description.
- Preserve the artwork scene, section copy, popout behavior, navigation, and
  all content outside Projects and the poem button.

No new dependencies, runtime data flow, or error handling are required.

## Verification

- Run a pre-change content assertion that fails until the project-block markup,
  approved order, and simplified poem contents exist.
- Run `pnpm build`.
- Verify `#art` at `1440x900` and `390x844`.
- Confirm all four project blocks are visible in the approved order and their
  links retain the intended destinations.
- Confirm the poem block displays `Freighter-00G8` and `Poem`, omits the inner
  `WRITING` label, and still opens the existing poem popout.
- Confirm there is no horizontal overflow and no new browser-console error.
