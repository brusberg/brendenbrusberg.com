# Art Photo and Label Cleanup Design

## Goal

Add the supplied clover artwork photo to the Art scene, displayed 90 degrees counterclockwise from the uploaded orientation, remove the numbered `ARTWORK ##` labels from the canvas cards, and remove the sentence `Plus an interactive art gallery scene.` from the Projects & Writing summary.

## Scope

### Image asset

- Create a rotated copy of the supplied PNG with a 90-degree counterclockwise orientation.
- Store the new image under `public/art/`.
- Create a lightweight thumbnail under `public/art/thumbs/` for the animated canvas scene.
- Preserve the full image for the expanded popout.

### Art registry

- Append the new photo as the eighth entry in `artImages`.
- Keep a stable internal ID and descriptive title so the existing popout and image alternative text remain useful.
- Use the new thumbnail in the canvas and the full image in the popout.

### Canvas presentation

- Remove the visible label band beneath every art image.
- Remove the `ARTWORK ##` text draw call.
- Recalculate each card's height from the image area alone so the removed label does not leave empty space.
- Preserve the existing frame, hover physics, pan behavior, click hitboxes, loading state, and popout behavior.

### Summary copy

Change the Art panel summary from:

`Art, writing, projects, friends, mentors, and the people whose work keeps me learning. Plus an interactive art gallery scene.`

to:

`Art, writing, projects, friends, mentors, and the people whose work keeps me learning.`

No other Art-page copy changes.

## Files

- Add: `public/art/clover.png`
- Add: `public/art/thumbs/clover.png`
- Modify: `index.html`
- Modify: `public/panels/projects.js`

## Verification

- Run a source contract that confirms the eighth image, its full/thumbnail paths, the removed summary sentence, and absence of the canvas label draw call.
- Run `pnpm build`.
- Verify `http://localhost:4000/#art` at desktop and mobile sizes.
- Confirm eight framed artworks render without numbered label bands.
- Confirm the clover artwork is visually upright after the 90-degree counterclockwise rotation.
- Click the clover artwork and confirm its expanded image opens.
- Confirm no new browser console errors and no new horizontal overflow from the Art cards.

## Non-Goals

- Renaming or recaptioning the seven existing artworks.
- Changing the gallery's starfield, physics, frame styling, navigation, or popout mechanics.
- Editing Projects, Writing, Friends, Mentors, or any other panel.
