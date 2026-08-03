import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const indexPath = fileURLToPath(new URL('../index.html', import.meta.url));
const indexSource = readFileSync(indexPath, 'utf8');

function artworkRegistrySource() {
  const match = indexSource.match(/const artImages = \[([\s\S]*?)\n\s*\];/);
  assert.ok(match, 'index.html must define the artImages registry');
  return match[1];
}

test('the gallery exposes the nine approved artworks in display order', () => {
  const registry = artworkRegistrySource();
  const ids = [...registry.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]);

  assert.deepEqual(ids, [
    'art-0',
    'art-1',
    'art-2',
    'art-4',
    'art-3',
    'art-5',
    'art-6',
    'art-7',
    'art-8'
  ]);

  for (const title of [
    'Alocasia longiloba',
    'Kintsugi',
    'Oxalis Triangularis #1',
    'Oxalis Triangularis #1 (Colored)',
    'Oxalis Triangularis #7',
    'Goose Rocks Beach',
    'Conflagration',
    'Oxalis Triangularis #9',
    'Davallia fejeensis'
  ]) {
    assert.match(registry, new RegExp(`title:\\s*'${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`));
  }
});

test('only the two botanical scientific names use HTML titles', () => {
  const registry = artworkRegistrySource();
  const htmlTitles = [...registry.matchAll(/\btitleHtml:\s*'([^']+)'/g)].map((match) => match[1]);

  assert.deepEqual(htmlTitles, [
    '<em>Alocasia longiloba</em>',
    '<em>Davallia fejeensis</em>'
  ]);
});

test('artwork details include the approved care, materials, and poem copy', () => {
  const registry = artworkRegistrySource();

  assert.match(registry, /Rabbit(?:&apos;|')s Foot Fern/);
  assert.match(registry, /Cannot survive below 55&deg;F \(13&deg;C\)/);
  assert.match(registry, /PIGMA Micron 0\.25 mm pen and watercolor/);
  assert.match(registry, /100% cotton, cold-pressed, 140 lb/);
  assert.match(registry, /The knight(?:&apos;|')s knees buckled as he dropped/);
  assert.match(registry, /My brain turned off today/);
  assert.match(registry, /propelled from the internal threat of oxidation\./);
  assert.match(registry, /art\/davallia-fejeensis\.png/);
  assert.match(registry, /art\/thumbs\/davallia-fejeensis\.png/);
});

test('expanded artwork uses responsive image-and-copy layout hooks', () => {
  assert.match(indexSource, /class="artwork-popout"/);
  assert.match(indexSource, /class="artwork-media"/);
  assert.match(indexSource, /class="artwork-details"/);
  assert.match(indexSource, /class="artwork-poem"/);
  assert.match(indexSource, /item\.titleHtml/);

  assert.match(indexSource, /\.artwork-popout\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)\s+minmax\(16rem, 0\.78fr\)/);
  const mobileStyles = indexSource.slice(indexSource.indexOf('@media (max-width: 980px)'));
  assert.match(mobileStyles, /\.artwork-popout\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);\s*\}/);
});
