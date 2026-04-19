import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROWS, COLS, CELL_COUNT, MINE_COUNT,
  DIFFICULTIES,
  createBoard, placeMines, revealCell, toggleFlag,
  checkWin, checkLose, countFlags, countRevealed,
} from '../src/gameCore.js';

test('DIFFICULTIES has 4 levels', () => {
  assert.ok(DIFFICULTIES.easy);
  assert.ok(DIFFICULTIES.normal);
  assert.ok(DIFFICULTIES.hard);
  assert.ok(DIFFICULTIES.oni);
  assert.equal(Object.keys(DIFFICULTIES).length, 4);
});

test('DIFFICULTIES easy matches legacy constants', () => {
  assert.equal(DIFFICULTIES.easy.rows, ROWS);
  assert.equal(DIFFICULTIES.easy.cols, COLS);
  assert.equal(DIFFICULTIES.easy.mines, MINE_COUNT);
});

test('DIFFICULTIES oni is 30x20 with 150 mines', () => {
  assert.equal(DIFFICULTIES.oni.rows, 30);
  assert.equal(DIFFICULTIES.oni.cols, 20);
  assert.equal(DIFFICULTIES.oni.mines, 150);
});

test('createBoard default returns 9x9=81 cells', () => {
  const b = createBoard();
  assert.equal(b.length, CELL_COUNT);
  assert.ok(b.every((c) => !c.isMine && !c.isRevealed && !c.isFlagged));
});

test('createBoard(16,16) returns 256 cells', () => {
  const b = createBoard(16, 16);
  assert.equal(b.length, 256);
  assert.ok(b.every((c) => !c.isMine && !c.isRevealed && !c.isFlagged));
});

test('createBoard(30,20) returns 600 cells for oni', () => {
  const b = createBoard(30, 20);
  assert.equal(b.length, 600);
});

test('placeMines default places 10 mines on 9x9', () => {
  const b = placeMines(createBoard(), 0);
  assert.equal(b.filter((c) => c.isMine).length, MINE_COUNT);
});

test('placeMines with custom mines count', () => {
  const b = placeMines(createBoard(16, 16), 0, 40, 16, 16);
  assert.equal(b.filter((c) => c.isMine).length, 40);
});

test('placeMines oni: 150 mines on 30x20', () => {
  const { rows, cols, mines } = DIFFICULTIES.oni;
  const b = placeMines(createBoard(rows, cols), 0, mines, rows, cols);
  assert.equal(b.filter((c) => c.isMine).length, 150);
});

test('placeMines never places mine on safeIndex', () => {
  for (let i = 0; i < 20; i++) {
    const b = placeMines(createBoard(), 40);
    assert.ok(!b[40].isMine);
  }
});

test('placeMines computes neighborCounts correctly', () => {
  const board = createBoard();
  // Force mine at index 1
  const b = placeMines(board, 99, MINE_COUNT, ROWS, COLS, () => 0); // always picks first candidates
  // index 0 should have neighborCount >= 1 if index 1 is a mine
  const mineIndexes = b.map((c, i) => c.isMine ? i : -1).filter((i) => i >= 0);
  for (const mi of mineIndexes) {
    const row = Math.floor(mi / COLS);
    const col = mi % COLS;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr; const nc = col + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          const ni = nr * COLS + nc;
          if (!b[ni].isMine) {
            assert.ok(b[ni].neighborCount >= 1);
          }
        }
      }
    }
  }
});

test('revealCell reveals the target cell', () => {
  let b = placeMines(createBoard(), 40);
  // find a non-mine cell
  const idx = b.findIndex((c) => !c.isMine);
  b = revealCell(b, idx);
  assert.ok(b[idx].isRevealed);
});

test('revealCell does not reveal flagged cell', () => {
  let b = placeMines(createBoard(), 40);
  const idx = b.findIndex((c) => !c.isMine);
  b = toggleFlag(b, idx);
  b = revealCell(b, idx);
  assert.ok(!b[idx].isRevealed);
});

test('revealCell flood fills from zero-neighbor cell', () => {
  // Create a board where corner has 0 neighbors
  // Hard to guarantee with random, so test that revealed count > 1 when hitting a 0-cell
  const b = placeMines(createBoard(), 40);
  const zeroIdx = b.findIndex((c) => !c.isMine && c.neighborCount === 0);
  if (zeroIdx >= 0) {
    const revealed = revealCell(b, zeroIdx);
    assert.ok(countRevealed(revealed) > 1);
  }
});

test('revealCell works on 16x16 board', () => {
  const b = placeMines(createBoard(16, 16), 0, 40, 16, 16);
  const idx = b.findIndex((c) => !c.isMine);
  const revealed = revealCell(b, idx, 16, 16);
  assert.ok(revealed[idx].isRevealed);
});

test('toggleFlag toggles flag on unrevealed cell', () => {
  let b = placeMines(createBoard(), 0);
  const idx = b.findIndex((c) => !c.isMine);
  b = toggleFlag(b, idx);
  assert.ok(b[idx].isFlagged);
  b = toggleFlag(b, idx);
  assert.ok(!b[idx].isFlagged);
});

test('toggleFlag does not flag revealed cell', () => {
  let b = placeMines(createBoard(), 40);
  const idx = b.findIndex((c) => !c.isMine);
  b = revealCell(b, idx);
  b = toggleFlag(b, idx);
  assert.ok(!b[idx].isFlagged);
});

test('checkWin returns true when all non-mine cells revealed', () => {
  let b = placeMines(createBoard(), 0);
  b = b.map((c) => c.isMine ? c : { ...c, isRevealed: true });
  assert.ok(checkWin(b));
});

test('checkWin returns false when some non-mine cells unrevealed', () => {
  const b = placeMines(createBoard(), 0);
  assert.equal(checkWin(b), false);
});

test('checkWin with mines param', () => {
  let b = placeMines(createBoard(), 0);
  b = b.map((c) => c.isMine ? c : { ...c, isRevealed: true });
  assert.ok(checkWin(b, MINE_COUNT));
});

test('checkLose returns true when mine revealed', () => {
  let b = placeMines(createBoard(), 40);
  const mineIdx = b.findIndex((c) => c.isMine);
  b = b.map((c, i) => i === mineIdx ? { ...c, isRevealed: true } : c);
  assert.ok(checkLose(b, mineIdx));
});

test('countFlags returns correct count', () => {
  let b = placeMines(createBoard(), 0);
  const nonMine = b.findIndex((c) => !c.isMine);
  b = toggleFlag(b, nonMine);
  assert.equal(countFlags(b), 1);
});

test('countRevealed returns correct count', () => {
  let b = placeMines(createBoard(), 40);
  const idx = b.findIndex((c) => !c.isMine);
  b = revealCell(b, idx);
  assert.ok(countRevealed(b) >= 1);
});
