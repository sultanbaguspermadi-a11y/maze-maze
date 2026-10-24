// Locates a Playwright install (dev-only; the game itself has no dependencies).
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
const cands = [process.env.PLAYWRIGHT_DIR, '/home/claude/.npm-global/lib/node_modules/playwright', 'playwright'].filter(Boolean);
export function loadPlaywright() {
  for (const c of cands) { try { return createRequire(import.meta.url)(c); } catch { /* try next */ } }
  throw new Error('Playwright not found. Set PLAYWRIGHT_DIR to a playwright package directory.');
}
export { existsSync };
