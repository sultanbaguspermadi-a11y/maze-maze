// Writes precache.json (file list + content hash) consumed by sw.js. Run after any source change.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
async function walk(d) { const out = []; for (const e of await readdir(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) out.push(...await walk(p)); else out.push(p); } return out; }
const files = [...(await walk(join(root, 'src'))), ...(await walk(join(root, 'public'))), join(root, 'index.html'), join(root, 'styles.css'), join(root, 'manifest.webmanifest')].map((f) => './' + relative(root, f)).sort();
const hash = createHash('sha256');
for (const f of files) hash.update(f).update(await readFile(join(root, f)));
await writeFile(join(root, 'precache.json'), JSON.stringify({ version: hash.digest('hex').slice(0, 12), files: ['./', ...files] }, null, 1));
console.log(`precache.json: ${files.length + 1} files`);
