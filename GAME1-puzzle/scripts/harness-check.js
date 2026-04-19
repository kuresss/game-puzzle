import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const ALLOWED_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.html',
  '.htm',
  '.css',
  '.md',
  '.json',
  '.xml',
]);

const IGNORED_DIRS = new Set(['node_modules', '.git', 'www', 'artifacts']);

function isIgnoredDir(name) {
  return IGNORED_DIRS.has(name) || name.startsWith('android.partial-backup-');
}

function listScannableFiles(target) {
  const stat = statSync(target);

  if (stat.isFile()) {
    return ALLOWED_EXTENSIONS.has(extname(target).toLowerCase()) ? [target] : [];
  }

  if (!stat.isDirectory()) {
    return [];
  }

  const entries = readdirSync(target, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(target, entry.name);

    if (entry.isDirectory()) {
      return isIgnoredDir(entry.name) ? [] : listScannableFiles(fullPath);
    }

    if (!entry.isFile()) {
      return [];
    }

    return ALLOWED_EXTENSIONS.has(extname(entry.name).toLowerCase()) ? [fullPath] : [];
  });
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function checkDisallowedPatterns(patterns, targets) {
  const matches = [];

  for (const target of targets) {
    for (const file of listScannableFiles(target)) {
      const content = readFileSync(file, 'utf8');
      const lines = content.split(/\r?\n/);

      lines.forEach((line, lineIndex) => {
        for (const pattern of patterns) {
          if (line.includes(pattern)) {
            matches.push(`${file}:${lineIndex + 1}: [${pattern}] ${line.trim()}`);
          }
        }
      });
    }
  }

  if (matches.length > 0) {
    throw new Error(`Disallowed patterns detected:\n${matches.join('\n')}`);
  }
}

function main() {
  const disallowedPatterns = [
    '2048',
    'score-up',
    'game-over',
    '\u7e67',
    '\u7e3a',
    '\u87b3',
    '\u8b41',
    '\u8389\u5893',
    `TO${'DO'}`,
    `FIX${'ME'}`,
    'single-file demo',
  ];

  const scanTargets = [
    'index.html',
    'script.js',
    'styles.css',
    'src',
    'README.md',
    'package.json',
  ];

  run('node', ['--check', 'script.js']);
  run('node', ['--test']);
  run('node', ['scripts/build-web-assets.js']);
  checkDisallowedPatterns(disallowedPatterns, scanTargets);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
