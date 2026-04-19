import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = join(import.meta.dirname, '..');
const testResult = spawnSync(process.execPath, ['--test'], { cwd: root, stdio: 'inherit', encoding: 'utf8' });
if (testResult.status !== 0) process.exit(1);

const FORBIDDEN = [
  { pattern: /console\.log\b/, label: 'console.log' },
  { pattern: /debugger\b/, label: 'debugger statement' },
];

function collectJsFiles(p) {
  try {
    if (statSync(p).isFile()) return [p];
    return readdirSync(p, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? collectJsFiles(join(p, e.name)) : extname(e.name) === '.js' ? [join(p, e.name)] : []
    );
  } catch { return []; }
}

const jsFiles = [join(root, 'src'), join(root, 'script.js')].flatMap(collectJsFiles);
let forbidden = 0;
for (const file of jsFiles) {
  const lines = readFileSync(file, 'utf8').split('\n');
  for (const { pattern, label } of FORBIDDEN) {
    lines.forEach((line, i) => { if (pattern.test(line)) { console.error(`FORBIDDEN [${label}] ${file}:${i+1}`); forbidden++; } });
  }
}
if (forbidden > 0) { console.error(`\n禁止パターン ${forbidden} 件`); process.exit(1); }

const buildResult = spawnSync(process.execPath, ['scripts/build-web-assets.js'], { cwd: root, stdio: 'inherit', encoding: 'utf8' });
if (buildResult.status !== 0) process.exit(1);
console.log('\nharness:check PASS');
