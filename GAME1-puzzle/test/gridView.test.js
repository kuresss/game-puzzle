import test from 'node:test';
import assert from 'node:assert/strict';
import { GRID_VIEW_LABELS, buildGridViewModel } from '../src/gridView.js';
import { SOLVED_TILES } from '../src/puzzleCore.js';

test('solved state disables every cell and sets canMove=false', () => {
  const viewModel = buildGridViewModel({ tiles: SOLVED_TILES, isSolved: true });

  assert.equal(viewModel.length, 16);
  for (const cell of viewModel) {
    assert.equal(cell.disabled, true);
    assert.equal(cell.canMove, false);
  }
});

test('empty cell uses "tile empty" className and blank label', () => {
  const viewModel = buildGridViewModel({ tiles: SOLVED_TILES, isSolved: true });
  const emptyCell = viewModel[15];

  assert.equal(emptyCell.number, null);
  assert.equal(emptyCell.text, '');
  assert.equal(emptyCell.className, 'tile empty');
  assert.equal(emptyCell.ariaLabel, GRID_VIEW_LABELS.blank);
});

test('adjacent non-empty cell in unsolved state is movable', () => {
  // Swap the empty cell (index 15) with tile 15 (index 14) so tile 15 is now adjacent to the empty cell
  const tiles = [...SOLVED_TILES];
  tiles[14] = 0;
  tiles[15] = 15;

  const viewModel = buildGridViewModel({ tiles, isSolved: false });
  const movableCell = viewModel[15];

  assert.equal(movableCell.number, 15);
  assert.equal(movableCell.canMove, true);
  assert.equal(movableCell.disabled, false);
  assert.ok(movableCell.className.includes('can-move'));
});

test('non-adjacent cell is not movable and has no can-move class', () => {
  const viewModel = buildGridViewModel({ tiles: SOLVED_TILES, isSolved: false });
  const farCell = viewModel[0];

  assert.equal(farCell.canMove, false);
  assert.equal(farCell.disabled, true);
  assert.ok(!farCell.className.includes('can-move'));
});

test('number cell ariaLabel follows "<number> のタイル" format', () => {
  const viewModel = buildGridViewModel({ tiles: SOLVED_TILES, isSolved: true });
  assert.equal(viewModel[0].ariaLabel, `1 ${GRID_VIEW_LABELS.tileSuffix}`);
  assert.equal(viewModel[14].ariaLabel, `15 ${GRID_VIEW_LABELS.tileSuffix}`);
});
