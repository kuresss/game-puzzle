import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLS, ROWS, DIR, isOpposite, createSnake, moveHead, isOutOfBounds,
  isSelfCollision, spawnFood, isFoodEaten, stepSnake, getInterval,
  DIFFICULTIES,
} from '../src/gameCore.js';

test('createSnake returns 3-segment snake', () => {
  const s = createSnake();
  assert.equal(s.length, 3);
  assert.equal(s[0].x, 10);
  assert.equal(s[0].y, 10);
});

test('moveHead moves correctly in all 4 directions', () => {
  const h = { x: 5, y: 5 };
  assert.deepEqual(moveHead(h, DIR.UP),    { x: 5, y: 4 });
  assert.deepEqual(moveHead(h, DIR.DOWN),  { x: 5, y: 6 });
  assert.deepEqual(moveHead(h, DIR.LEFT),  { x: 4, y: 5 });
  assert.deepEqual(moveHead(h, DIR.RIGHT), { x: 6, y: 5 });
});

test('isOpposite returns true for opposites', () => {
  assert.ok(isOpposite(DIR.UP, DIR.DOWN));
  assert.ok(isOpposite(DIR.LEFT, DIR.RIGHT));
  assert.equal(isOpposite(DIR.UP, DIR.LEFT), false);
});

test('isOutOfBounds detects wall collisions (default cols/rows)', () => {
  assert.ok(isOutOfBounds({ x: -1, y: 5 }));
  assert.ok(isOutOfBounds({ x: COLS, y: 5 }));
  assert.ok(isOutOfBounds({ x: 5, y: -1 }));
  assert.ok(isOutOfBounds({ x: 5, y: ROWS }));
  assert.equal(isOutOfBounds({ x: 0, y: 0 }), false);
  assert.equal(isOutOfBounds({ x: COLS - 1, y: ROWS - 1 }), false);
});

test('isOutOfBounds accepts custom cols/rows', () => {
  assert.ok(isOutOfBounds({ x: 10, y: 0 }, 10, 10));
  assert.ok(isOutOfBounds({ x: 0, y: 10 }, 10, 10));
  assert.equal(isOutOfBounds({ x: 9, y: 9 }, 10, 10), false);
});

test('isSelfCollision detects body hit', () => {
  const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
  assert.ok(isSelfCollision(snake, { x: 4, y: 5 }));
  assert.equal(isSelfCollision(snake, { x: 6, y: 5 }), false);
});

test('spawnFood returns position not on snake', () => {
  const snake = createSnake();
  const food = spawnFood(snake);
  assert.ok(food !== null);
  assert.ok(!snake.some((s) => s.x === food.x && s.y === food.y));
});

test('spawnFood returns null when no empty cells', () => {
  const snake = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) snake.push({ x, y });
  assert.equal(spawnFood(snake), null);
});

test('isFoodEaten returns true when head on food', () => {
  assert.ok(isFoodEaten({ x: 3, y: 7 }, { x: 3, y: 7 }));
  assert.equal(isFoodEaten({ x: 3, y: 7 }, { x: 3, y: 8 }), false);
  assert.equal(isFoodEaten({ x: 3, y: 7 }, null), false);
});

test('stepSnake moves without growing', () => {
  const snake = createSnake();
  const { snake: next } = stepSnake(snake, DIR.RIGHT, false);
  assert.equal(next.length, 3);
  assert.equal(next[0].x, 11);
  assert.equal(next[0].y, 10);
});

test('stepSnake grows when grow=true', () => {
  const snake = createSnake();
  const { snake: next } = stepSnake(snake, DIR.RIGHT, true);
  assert.equal(next.length, 4);
  assert.equal(next[0].x, 11);
});

test('stepSnake does not mutate original snake', () => {
  const snake = createSnake();
  const original = snake.map((s) => ({ ...s }));
  stepSnake(snake, DIR.RIGHT, false);
  assert.deepEqual(snake, original);
});

test('stepSnake wraps at walls when wallWrap=true', () => {
  const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
  const { snake: next } = stepSnake(snake, DIR.LEFT, false, true);
  assert.equal(next[0].x, COLS - 1);
  assert.equal(next[0].y, 0);
});

test('stepSnake does NOT wrap when wallWrap=false', () => {
  const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
  const { snake: next } = stepSnake(snake, DIR.LEFT, false, false);
  assert.equal(next[0].x, -1);
  assert.equal(next[0].y, 0);
});

test('getInterval decreases with more food eaten (default initialInterval)', () => {
  assert.equal(getInterval(0), 150);
  assert.equal(getInterval(5), 140);
  assert.ok(getInterval(100) >= 80);
});

test('getInterval uses custom initialInterval', () => {
  assert.equal(getInterval(0, 200), 200);
  assert.equal(getInterval(5, 200), 190);
  assert.equal(getInterval(0, 70), 80); // clamps to 80
});

test('getInterval never goes below 80ms', () => {
  assert.equal(getInterval(1000), 80);
  assert.equal(getInterval(1000, 70), 80);
});

test('DIFFICULTIES has 4 entries with required fields', () => {
  const keys = Object.keys(DIFFICULTIES);
  assert.equal(keys.length, 4);
  for (const key of ['easy', 'normal', 'hard', 'oni']) {
    assert.ok(key in DIFFICULTIES, `missing difficulty: ${key}`);
    const d = DIFFICULTIES[key];
    assert.ok(typeof d.initialInterval === 'number');
    assert.ok(typeof d.wallWrap === 'boolean');
    assert.ok(typeof d.label === 'string');
  }
});

test('DIFFICULTIES oni has wallWrap=false, others true', () => {
  assert.equal(DIFFICULTIES.oni.wallWrap, false);
  assert.equal(DIFFICULTIES.easy.wallWrap, true);
  assert.equal(DIFFICULTIES.normal.wallWrap, true);
  assert.equal(DIFFICULTIES.hard.wallWrap, true);
});

test('DIFFICULTIES intervals are in descending order', () => {
  const { easy, normal, hard, oni } = DIFFICULTIES;
  assert.ok(easy.initialInterval > normal.initialInterval);
  assert.ok(normal.initialInterval > hard.initialInterval);
  assert.ok(hard.initialInterval > oni.initialInterval);
});
