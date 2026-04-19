import { copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = join(rootDir, 'www');

mkdirSync(outputDir, { recursive: true });

for (const file of ['index.html', 'styles.css']) {
  copyFileSync(join(rootDir, file), join(outputDir, file));
}

await build({
  entryPoints: [join(rootDir, 'script.js')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  outfile: join(outputDir, 'script.js'),
  logLevel: 'info',
});
