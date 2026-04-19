import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = join(import.meta.dirname, '..');

// ── 1. テスト実行 ──────────────────────────────────
const testResult = spawnSync(process.execPath, ['--test'], {
  cwd: root,
  stdio: 'inherit',
  encoding: 'utf8',
});
if (testResult.status !== 0) process.exit(1);

// ── 2. 禁止パターン ───────────────────────────────
const FORBIDDEN = [
  { pattern: /console\.log\b/, label: 'console.log (use console.warn/error)' },
  { pattern: /debugger\b/, label: 'debugger statement' },
  { pattern: /TODO.*HACK/i, label: 'TODO HACK comment' },
];

const JS_DIRS = [join(root, 'src'), join(root, 'script.js')];

function collectJsFiles(pathOrFile) {
  try {
    if (statSync(pathOrFile).isFile()) return [pathOrFile];
    return readdirSync(pathOrFile, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory()
        ? collectJsFiles(join(pathOrFile, e.name))
        : extname(e.name) === '.js'
        ? [join(pathOrFile, e.name)]
        : []
    );
  } catch {
    return [];
  }
}

const jsFiles = JS_DIRS.flatMap(collectJsFiles);
let forbidden = 0;

for (const file of jsFiles) {
  const lines = readFileSync(file, 'utf8').split('\n');
  for (const { pattern, label } of FORBIDDEN) {
    lines.forEach((line, i) => {
      if (pattern.test(line)) {
        console.error(`FORBIDDEN [${label}] ${file}:${i + 1}  ${line.trim()}`);
        forbidden += 1;
      }
    });
  }
}

if (forbidden > 0) {
  console.error(`\n禁止パターン ${forbidden} 件`);
  process.exit(1);
}

// ── 3. ビルド確認 ────────────────────────────────
const buildResult = spawnSync(process.execPath, ['scripts/build-web-assets.js'], {
  cwd: root,
  stdio: 'inherit',
  encoding: 'utf8',
});
if (buildResult.status !== 0) process.exit(1);

console.log('\nharness:check PASS');
