import { copyFileSync, mkdirSync, readdirSync, statSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import glslPlugin from 'esbuild-plugin-glsl';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const wwwDir  = join(rootDir, 'www');

mkdirSync(wwwDir, { recursive: true });
mkdirSync(join(wwwDir, 'stages'), { recursive: true });

for (const file of ['index.html', 'styles.css', 'manifest.json']) {
  try { copyFileSync(join(rootDir, file), join(wwwDir, file)); } catch { /* optional */ }
}

// Copy stages JSON
try {
  const stagesSrc = join(rootDir, 'stages');
  for (const f of readdirSync(stagesSrc)) {
    if (f.endsWith('.json')) {
      copyFileSync(join(stagesSrc, f), join(wwwDir, 'stages', f));
    }
  }
} catch { /* no stages yet */ }

await build({
  entryPoints: [join(rootDir, 'src', 'main.ts')],
  bundle:   true,
  format:   'esm',
  platform: 'browser',
  target:   ['es2020'],
  outfile:  join(wwwDir, 'script.js'),
  plugins:  [glslPlugin()],
  logLevel: 'info',
});
