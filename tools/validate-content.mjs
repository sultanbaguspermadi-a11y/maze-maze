import { validateContent, PRD_TARGETS } from '../src/content/schema.js';
const r = validateContent();
console.log('Content inventory vs PRD minimums (KM-057..060):');
for (const [k, t] of Object.entries(PRD_TARGETS)) console.log(`  ${k.padEnd(11)} ${String(r.inventory[k]).padStart(4)} / ${t}${r.inventory[k] >= t ? '' : '   ← SHORTFALL'}`);
console.log(`  review      reviewed=${r.inventory.reviewed}  draft=${r.inventory.draft}  (no item is expert-reviewed; KM-062/114 open)`);
for (const w of r.warnings) console.log('warning:', w);
for (const e of r.errors) console.error('ERROR:', e);
console.log(`\n${r.errors.length} error(s), ${r.warnings.length} warning(s)`);
process.exit(r.errors.length ? 1 : 0);
