# Poker Snake Project Entry Design

## Goal

Add Poker Snake to the portfolio's Projects section with a concise description
grounded in the Poker Snake repository's `AGENTS.md`.

## Content

The new entry will read:

> [Poker Snake](https://poker-snake.com/): build poker hands by drawing connected
> paths through a 6x6 card board in a twelve-round roguelike campaign.

This avoids generic product language such as "mobile-friendly" while retaining
the game's distinctive path-building, poker, board, and campaign structure.

## Placement And Scope

Add the entry as the first project under the existing Projects subheading,
immediately before Dungeons and Kittens.

The implementation will modify only `public/panels/projects.js`. It will not
change CSS, layout, navigation, artwork, the writing section, or any other
project entry.

## Behavior

The Poker Snake title will be an ordinary external link to
`https://poker-snake.com/`, matching the markup and behavior of neighboring
project links. No new runtime data flow or error handling is required.

## Verification

- Run `pnpm build`.
- Load the Projects and Writing panel at desktop and mobile viewport sizes.
- Confirm the entry appears first, the link resolves to the intended URL, and
  the added copy introduces no overflow or console errors.
