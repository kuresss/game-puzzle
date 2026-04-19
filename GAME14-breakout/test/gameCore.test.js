import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANVAS_W, CANVAS_H, PADDLE_W, PADDLE_H, PADDLE_Y,
  BALL_RADIUS, BALL_SPEED_INIT, BRICK_COLS, BRICK_ROWS,
  BRICK_W, BRICK_H, BRICK_PAD, BRICK_OFFSET_X, BRICK_OFFSET_Y, LIVES,
  DIFFICULTIES,
  createBricks, createBall, createPaddle,
  movePaddle, moveBall, reflectBallX, reflectBallY,
  isBallOutBottom, checkWallCollision, checkPaddleCollision,
  checkBrickCollisions, countAliveBricks, speedUpBall,
} from '../src/gameCore.js';

// ── createBricks ────────────────────────────────────────────────────────────

test('createBricks returns BRICK_ROWS * BRICK_COLS bricks', () => {
  const bricks = createBricks();
  assert.equal(bricks.length, BRICK_ROWS * BRICK_COLS);
});

test('createBricks all bricks are alive', () => {
  const bricks = createBricks();
  assert.ok(bricks.every((b) => b.alive === true));
});

test('createBricks row and col ranges are correct', () => {
  const bricks = createBricks();
  const rows = [...new Set(bricks.map((b) => b.row))];
  const cols = [...new Set(bricks.map((b) => b.col))];
  assert.equal(rows.length, BRICK_ROWS);
  assert.equal(cols.length, BRICK_COLS);
});

// ── createBall ──────────────────────────────────────────────────────────────

test('createBall returns correct initial position (default params)', () => {
  const ball = createBall();
  assert.equal(ball.x, CANVAS_W / 2);
  assert.equal(ball.y, PADDLE_Y - 20);
  assert.equal(ball.vx, 2);
  assert.equal(ball.vy, -BALL_SPEED_INIT);
});

test('createBall respects custom speed param', () => {
  const ball = createBall(460, 400, 3.5);
  assert.equal(ball.vy, -3.5);
});

test('createBall respects custom paddleY and canvasW', () => {
  const ball = createBall(460, 400, 5);
  assert.equal(ball.x, 200);
  assert.equal(ball.y, 440);
  assert.equal(ball.vy, -5);
});

// ── createPaddle ────────────────────────────────────────────────────────────

test('createPaddle returns centered paddle (default params)', () => {
  const paddle = createPaddle();
  assert.equal(paddle.x, (CANVAS_W - PADDLE_W) / 2);
});

test('createPaddle centers 40-wide paddle', () => {
  const paddle = createPaddle(400, 40);
  assert.equal(paddle.x, (400 - 40) / 2);
});

// ── DIFFICULTIES ─────────────────────────────────────────────────────────────

test('DIFFICULTIES has 4 keys', () => {
  assert.equal(Object.keys(DIFFICULTIES).length, 4);
});

test('DIFFICULTIES easy has correct values', () => {
  assert.equal(DIFFICULTIES.easy.ballCount, 1);
  assert.equal(DIFFICULTIES.easy.paddleW, 100);
  assert.equal(DIFFICULTIES.easy.ballSpeed, 3.5);
});

test('DIFFICULTIES normal has correct values', () => {
  assert.equal(DIFFICULTIES.normal.ballCount, 1);
  assert.equal(DIFFICULTIES.normal.paddleW, 80);
  assert.equal(DIFFICULTIES.normal.ballSpeed, 4);
});

test('DIFFICULTIES hard has correct values', () => {
  assert.equal(DIFFICULTIES.hard.ballCount, 1);
  assert.equal(DIFFICULTIES.hard.paddleW, 60);
  assert.equal(DIFFICULTIES.hard.ballSpeed, 5);
});

test('DIFFICULTIES oni has 2 balls and half-width paddle', () => {
  assert.equal(DIFFICULTIES.oni.ballCount, 2);
  assert.equal(DIFFICULTIES.oni.paddleW, 40);
  assert.equal(DIFFICULTIES.oni.ballSpeed, 5);
});

test('DIFFICULTIES all have label string', () => {
  for (const key of Object.keys(DIFFICULTIES)) {
    assert.equal(typeof DIFFICULTIES[key].label, 'string');
    assert.ok(DIFFICULTIES[key].label.length > 0);
  }
});

// ── movePaddle ──────────────────────────────────────────────────────────────

test('movePaddle moves right by dx', () => {
  const paddle = { x: 100 };
  const result = movePaddle(paddle, 10, CANVAS_W, PADDLE_W);
  assert.equal(result.x, 110);
});

test('movePaddle clamps to left boundary', () => {
  const paddle = { x: 5 };
  const result = movePaddle(paddle, -20, CANVAS_W, PADDLE_W);
  assert.equal(result.x, 0);
});

test('movePaddle clamps to right boundary', () => {
  const paddle = { x: CANVAS_W - PADDLE_W - 5 };
  const result = movePaddle(paddle, 20, CANVAS_W, PADDLE_W);
  assert.equal(result.x, CANVAS_W - PADDLE_W);
});

test('movePaddle does not mutate original', () => {
  const paddle = { x: 100 };
  movePaddle(paddle, 10, CANVAS_W, PADDLE_W);
  assert.equal(paddle.x, 100);
});

// ── moveBall ────────────────────────────────────────────────────────────────

test('moveBall advances ball by velocity', () => {
  const ball = { x: 50, y: 80, vx: 3, vy: -4 };
  const result = moveBall(ball);
  assert.equal(result.x, 53);
  assert.equal(result.y, 76);
});

test('moveBall does not mutate original', () => {
  const ball = { x: 50, y: 80, vx: 3, vy: -4 };
  moveBall(ball);
  assert.equal(ball.x, 50);
});

// ── reflectBallX / reflectBallY ─────────────────────────────────────────────

test('reflectBallX negates vx', () => {
  const ball = { x: 50, y: 80, vx: 3, vy: -4 };
  assert.equal(reflectBallX(ball).vx, -3);
  assert.equal(reflectBallX(ball).vy, -4);
});

test('reflectBallY negates vy', () => {
  const ball = { x: 50, y: 80, vx: 3, vy: -4 };
  assert.equal(reflectBallY(ball).vy, 4);
  assert.equal(reflectBallY(ball).vx, 3);
});

// ── isBallOutBottom ──────────────────────────────────────────────────────────

test('isBallOutBottom returns true when ball is below canvas', () => {
  assert.equal(isBallOutBottom({ y: CANVAS_H + 1 }, CANVAS_H), true);
});

test('isBallOutBottom returns false when ball is in canvas', () => {
  assert.equal(isBallOutBottom({ y: CANVAS_H - 10 }, CANVAS_H), false);
});

// ── checkWallCollision ───────────────────────────────────────────────────────

test('checkWallCollision reflects off left wall', () => {
  const ball = { x: BALL_RADIUS - 2, y: 200, vx: -3, vy: -4 };
  const { ball: b, reflected } = checkWallCollision(ball, CANVAS_W);
  assert.ok(b.vx > 0);
  assert.ok(reflected);
});

test('checkWallCollision reflects off right wall', () => {
  const ball = { x: CANVAS_W - BALL_RADIUS + 2, y: 200, vx: 3, vy: -4 };
  const { ball: b, reflected } = checkWallCollision(ball, CANVAS_W);
  assert.ok(b.vx < 0);
  assert.ok(reflected);
});

test('checkWallCollision reflects off top wall', () => {
  const ball = { x: 200, y: BALL_RADIUS - 2, vx: 2, vy: -4 };
  const { ball: b, reflected } = checkWallCollision(ball, CANVAS_W);
  assert.ok(b.vy > 0);
  assert.ok(reflected);
});

test('checkWallCollision no reflection when ball in middle', () => {
  const ball = { x: 200, y: 200, vx: 2, vy: -4 };
  const { reflected } = checkWallCollision(ball, CANVAS_W);
  assert.equal(reflected, false);
});

// ── checkPaddleCollision ─────────────────────────────────────────────────────

test('checkPaddleCollision hits when ball overlaps paddle', () => {
  const paddle = { x: 160 };
  const ball   = { x: 200, y: PADDLE_Y - BALL_RADIUS + 2, vx: 1, vy: 4 };
  const { hit, ball: b } = checkPaddleCollision(ball, paddle, PADDLE_W, PADDLE_H, PADDLE_Y);
  assert.equal(hit, true);
  assert.ok(b.vy < 0);
});

test('checkPaddleCollision misses when ball is above paddle', () => {
  const paddle = { x: 160 };
  const ball   = { x: 200, y: 200, vx: 1, vy: 4 };
  const { hit } = checkPaddleCollision(ball, paddle, PADDLE_W, PADDLE_H, PADDLE_Y);
  assert.equal(hit, false);
});

test('checkPaddleCollision no hit when ball moving upward', () => {
  const paddle = { x: 160 };
  const ball   = { x: 200, y: PADDLE_Y, vx: 1, vy: -4 };
  const { hit } = checkPaddleCollision(ball, paddle, PADDLE_W, PADDLE_H, PADDLE_Y);
  assert.equal(hit, false);
});

// ── checkBrickCollisions ─────────────────────────────────────────────────────

test('checkBrickCollisions kills hit brick and returns points', () => {
  // Place ball directly over brick at row=0, col=0
  const bx   = BRICK_OFFSET_X;
  const by   = BRICK_OFFSET_Y;
  const ball = { x: bx + BRICK_W / 2, y: by + BRICK_H / 2, vx: 0, vy: 4 };
  const bricks = createBricks();

  const { bricks: newBricks, points } = checkBrickCollisions(
    ball, bricks, BRICK_W, BRICK_H, BRICK_OFFSET_X, BRICK_OFFSET_Y, BRICK_COLS, BRICK_PAD
  );

  assert.ok(points > 0);
  const hitBrick = newBricks.find((b) => b.row === 0 && b.col === 0);
  assert.equal(hitBrick.alive, false);
});

test('checkBrickCollisions row 0 brick gives maximum points', () => {
  const bx   = BRICK_OFFSET_X;
  const by   = BRICK_OFFSET_Y;
  const ball = { x: bx + BRICK_W / 2, y: by + BRICK_H / 2, vx: 0, vy: 4 };
  const bricks = createBricks();

  const { points } = checkBrickCollisions(
    ball, bricks, BRICK_W, BRICK_H, BRICK_OFFSET_X, BRICK_OFFSET_Y, BRICK_COLS, BRICK_PAD
  );
  // row=0: (BRICK_ROWS - 0) * 10 + 10 = 60
  assert.equal(points, (BRICK_ROWS - 0) * 10 + 10);
});

test('checkBrickCollisions no hit when ball far away', () => {
  const ball   = { x: 0, y: 480, vx: 0, vy: 4 };
  const bricks = createBricks();
  const { points, bricks: newBricks } = checkBrickCollisions(
    ball, bricks, BRICK_W, BRICK_H, BRICK_OFFSET_X, BRICK_OFFSET_Y, BRICK_COLS, BRICK_PAD
  );
  assert.equal(points, 0);
  assert.equal(countAliveBricks(newBricks), countAliveBricks(bricks));
});

test('checkBrickCollisions does not mutate original bricks', () => {
  const bx     = BRICK_OFFSET_X;
  const by     = BRICK_OFFSET_Y;
  const ball   = { x: bx + BRICK_W / 2, y: by + BRICK_H / 2, vx: 0, vy: 4 };
  const bricks = createBricks();
  checkBrickCollisions(ball, bricks, BRICK_W, BRICK_H, BRICK_OFFSET_X, BRICK_OFFSET_Y, BRICK_COLS, BRICK_PAD);
  assert.ok(bricks.every((b) => b.alive));
});

// ── countAliveBricks ─────────────────────────────────────────────────────────

test('countAliveBricks counts all alive after createBricks', () => {
  const bricks = createBricks();
  assert.equal(countAliveBricks(bricks), BRICK_ROWS * BRICK_COLS);
});

test('countAliveBricks counts zero when all dead', () => {
  const bricks = createBricks().map((b) => ({ ...b, alive: false }));
  assert.equal(countAliveBricks(bricks), 0);
});

// ── speedUpBall ───────────────────────────────────────────────────────────────

test('speedUpBall multiplies velocity by factor', () => {
  const ball = { vx: 2, vy: -4 };
  const result = speedUpBall(ball, 1.05);
  assert.ok(Math.abs(result.vx) > Math.abs(ball.vx));
  assert.ok(Math.abs(result.vy) > Math.abs(ball.vy));
});

test('speedUpBall caps magnitude at 12', () => {
  const ball = { vx: 11, vy: -11 };
  const result = speedUpBall(ball, 2);
  assert.ok(Math.abs(result.vx) <= 12);
  assert.ok(Math.abs(result.vy) <= 12);
});

test('speedUpBall preserves sign of velocity', () => {
  const ball = { vx: -3, vy: -4 };
  const result = speedUpBall(ball, 1.1);
  assert.ok(result.vx < 0);
  assert.ok(result.vy < 0);
});

// ── Constants sanity ──────────────────────────────────────────────────────────

test('LIVES constant equals 3', () => {
  assert.equal(LIVES, 3);
});
