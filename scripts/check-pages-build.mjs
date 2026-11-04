import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

// Validate the emitted artifact under a real project prefix, not just localhost /.
const root = new URL('../dist/', import.meta.url);
const page = new URL('https://example.github.io/monk/');
const html = await readFile(new URL('index.html', root), 'utf8');
const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]);
let checked = 0;
for (const reference of references) {
  const url = new URL(reference, page);
  if (url.origin !== page.origin) continue;
  assert.ok(url.pathname.startsWith(page.pathname), `Asset escapes /monk/: ${reference}`);
  const asset = new URL(url.pathname.slice(page.pathname.length), root);
  assert.ok((await stat(asset)).isFile(), `Missing built asset: ${reference}`);
  checked++;
}
assert.ok(checked >= 2, 'Expected a bundled module and favicon in the built HTML');
assert.ok((await stat(new URL('favicon.svg', root))).isFile());
console.log(`Validated ${checked} asset references under /monk/.`);
