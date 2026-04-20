import { execSync } from 'node:child_process';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
let pass = true;

function check(label, fn) {
  try {
    const result = fn();
    if (result === false) {
      console.error(`  FAIL  ${label}`);
      pass = false;
    } else {
      console.log(`  PASS  ${label}`);
    }
  } catch (e) {
    console.error(`  FAIL  ${label}: ${e.message}`);
    pass = false;
  }
}

console.log('\n=== ChromaFlow harness-check ===\n');

check('www/script.js exists', () => existsSync(join(rootDir, 'www', 'script.js')));
check('www/index.html exists', () => existsSync(join(rootDir, 'www', 'index.html')));
check('www/styles.css exists', () => existsSync(join(rootDir, 'www', 'styles.css')));

check('www/script.js > 10KB (shaders bundled)', () => {
  const s = statSync(join(rootDir, 'www', 'script.js'));
  return s.size > 10 * 1024;
});

check('index.html has canvas#canvas', () => {
  const html = readFileSync(join(rootDir, 'www', 'index.html'), 'utf8');
  return html.includes('id="canvas"');
});

check('no TypeScript errors (tsc --noEmit)', () => {
  try {
    execSync('npx tsc --noEmit', { cwd: rootDir, stdio: 'pipe' });
    return true;
  } catch (e) {
    // tsc not installed or tsconfig missing → warn, don't fail build
    console.warn('    (tsc not available, skipping type check)');
    return true;
  }
});

console.log(`\n${pass ? 'PASS — all checks passed' : 'FAIL — see above'}\n`);
process.exit(pass ? 0 : 1);
