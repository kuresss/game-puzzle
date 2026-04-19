import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
const root = join(import.meta.dirname, '..');
mkdirSync(join(root, 'www'), { recursive: true });
await build({
  entryPoints: [join(root, 'script.js')],
  bundle: true, format: 'esm', outfile: join(root, 'www/script.js'),
  logLevel: 'info',
});
