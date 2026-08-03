import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const fullPath = fileURLToPath(new URL('../public/art/davallia-fejeensis.png', import.meta.url));
const thumbnailPath = fileURLToPath(new URL('../public/art/thumbs/davallia-fejeensis.png', import.meta.url));

function pngDetails(path) {
  const bytes = readFileSync(path);
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${path} must be a PNG`);

  return {
    bytes: bytes.length,
    height: bytes.readUInt32BE(20),
    sha256: createHash('sha256').update(bytes).digest('hex').toUpperCase(),
    width: bytes.readUInt32BE(16)
  };
}

test('the full fern asset is the untouched uploaded image', () => {
  assert.ok(existsSync(fullPath), 'the full fern asset must exist');
  const full = pngDetails(fullPath);

  assert.equal(full.sha256, 'C6E7C7972A339E4934DD1067C9BE67EAFB68477D96E9F5730C56ED1D95F0FB55');
  assert.equal(full.width, 1372);
  assert.equal(full.height, 1824);
});

test('the fern thumbnail is smaller, portrait, and bounded to 640 px', () => {
  assert.ok(existsSync(fullPath), 'the full fern asset must exist');
  assert.ok(existsSync(thumbnailPath), 'the fern thumbnail must exist');

  const full = pngDetails(fullPath);
  const thumbnail = pngDetails(thumbnailPath);

  assert.ok(thumbnail.width <= 640);
  assert.ok(thumbnail.height <= 640);
  assert.ok(thumbnail.height > thumbnail.width);
  assert.ok(thumbnail.bytes < full.bytes);
  assert.ok(Math.abs((thumbnail.width / thumbnail.height) - (full.width / full.height)) < 0.002);
});
