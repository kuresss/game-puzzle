import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(rootDir, 'www');

const pathsToCopy = [
  'index.html',
  'styles.css',
  'assets/icon.png',
  'assets/splash.png',
];

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

for (const relativePath of pathsToCopy) {
  const source = join(rootDir, relativePath);
  const destination = join(outputDir, relativePath);

  if (!existsSync(source)) {
    throw new Error(`Missing web asset: ${relativePath}`);
  }

  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true });
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
