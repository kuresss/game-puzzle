// ── Constants ──────────────────────────────────────────────────────────────
export const CANVAS_W      = 400;
export const CANVAS_H      = 500;
export const PADDLE_W      = 80;
export const PADDLE_H      = 12;
export const PADDLE_Y      = 460;
export const BALL_RADIUS   = 8;
export const BALL_SPEED_INIT = 4;
export const BRICK_COLS    = 8;
export const BRICK_ROWS    = 5;
export const BRICK_W       = 44;
export const BRICK_H       = 18;
export const BRICK_PAD     = 4;
export const BRICK_OFFSET_X = 12;
export const BRICK_OFFSET_Y = 48;
export const LIVES         = 3;

// ── Difficulty presets ────────────────────────────────────────────────────
export const DIFFICULTIES = {
  easy:   { ballCount: 1, paddleW: 100, ballSpeed: 3.5, label: 'かんたん'  },
  normal: { ballCount: 1, paddleW: 80,  ballSpeed: 4,   label: 'ふつう'    },
  hard:   { ballCount: 1, paddleW: 60,  ballSpeed: 5,   label: 'むずかしい' },
  oni:    { ballCount: 2, paddleW: 40,  ballSpeed: 5,   label: '🔴 鬼'      },
};

// ── Factory functions ──────────────────────────────────────────────────────

/** Returns a flat array of { row, col, alive } objects. */
export function createBricks() {
  const bricks = [];
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      bricks.push({ row, col, alive: true });
    }
  }
  return bricks;
}

/** Returns initial ball state. */
export function createBall(paddleY = 460, canvasW = 400, speed = 4) {
  return { x: canvasW / 2, y: paddleY - 20, vx: 2, vy: -speed };
}

/** Returns initial paddle state. */
export function createPaddle(canvasW = 400, paddleW = 80) {
  return { x: (canvasW - paddleW) / 2 };
}

// ── Pure movement / collision functions ───────────────────────────────────

/** Move paddle by dx, clamped to canvas bounds. Pure — returns new paddle. */
export function movePaddle(paddle, dx, canvasW, paddleW) {
  const nx = Math.max(0, Math.min(canvasW - paddleW, paddle.x + dx));
  return { ...paddle, x: nx };
}

/** Advance ball one step. Pure — returns new ball. */
export function moveBall(ball) {
  return { ...ball, x: ball.x + ball.vx, y: ball.y + ball.vy };
}

/** Negate vx. Pure. */
export function reflectBallX(ball) {
  return { ...ball, vx: -ball.vx };
}

/** Negate vy. Pure. */
export function reflectBallY(ball) {
  return { ...ball, vy: -ball.vy };
}

/** True when ball has gone past the bottom of the canvas. */
export function isBallOutBottom(ball, canvasH) {
  return ball.y > canvasH;
}

/**
 * Reflect ball off left wall, right wall, and top wall.
 * Returns { ball, reflected }.
 */
export function checkWallCollision(ball, canvasW) {
  let b = ball;
  let reflected = false;

  // Left / right walls
  if (b.x - BALL_RADIUS <= 0) {
    b = { ...b, x: BALL_RADIUS, vx: Math.abs(b.vx) };
    reflected = true;
  } else if (b.x + BALL_RADIUS >= canvasW) {
    b = { ...b, x: canvasW - BALL_RADIUS, vx: -Math.abs(b.vx) };
    reflected = true;
  }

  // Top wall
  if (b.y - BALL_RADIUS <= 0) {
    b = { ...b, y: BALL_RADIUS, vy: Math.abs(b.vy) };
    reflected = true;
  }

  return { ball: b, reflected };
}

/**
 * Reflect ball off paddle.
 * The horizontal deflection angle depends on where the ball hits the paddle
 * (left side → negative vx, right side → positive vx).
 * Returns { ball, hit }.
 */
export function checkPaddleCollision(ball, paddle, paddleW, paddleH, paddleY) {
  const ballBottom = ball.y + BALL_RADIUS;
  const ballLeft   = ball.x - BALL_RADIUS;
  const ballRight  = ball.x + BALL_RADIUS;

  const paddleLeft  = paddle.x;
  const paddleRight = paddle.x + paddleW;
  const paddleTop   = paddleY;
  const paddleBot   = paddleY + paddleH;

  const overlapsX = ballRight >= paddleLeft && ballLeft <= paddleRight;
  const overlapsY = ballBottom >= paddleTop && ball.y <= paddleBot;

  if (!overlapsX || !overlapsY || ball.vy <= 0) {
    return { ball, hit: false };
  }

  // Hit position: -1 (far left) to +1 (far right)
  const hitPos = ((ball.x - paddleLeft) / paddleW) * 2 - 1;
  const speed  = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  const newVx  = hitPos * speed * 0.8;
  const newVy  = -Math.abs(ball.vy);

  const newBall = {
    ...ball,
    y: paddleTop - BALL_RADIUS,
    vx: newVx,
    vy: newVy,
  };

  return { ball: newBall, hit: true };
}

/**
 * Detect and resolve ball-brick collisions.
 * Returns { ball, bricks, points } — bricks is a new array.
 */
export function checkBrickCollisions(
  ball, bricks, brickW, brickH, brickOffsetX, brickOffsetY, brickCols, brickPad
) {
  let b = ball;
  let pts = 0;
  const newBricks = bricks.map((brick) => {
    if (!brick.alive) return brick;

    const bx = brickOffsetX + brick.col * (brickW + brickPad);
    const by = brickOffsetY + brick.row * (brickH + brickPad);

    const ballLeft   = b.x - BALL_RADIUS;
    const ballRight  = b.x + BALL_RADIUS;
    const ballTop    = b.y - BALL_RADIUS;
    const ballBottom = b.y + BALL_RADIUS;

    const overlapX = ballRight >= bx && ballLeft <= bx + brickW;
    const overlapY = ballBottom >= by && ballTop <= by + brickH;

    if (!overlapX || !overlapY) return brick;

    // Determine collision axis (which overlap is smaller → that axis is the penetration axis)
    const overlapLeft   = ballRight - bx;
    const overlapRight  = bx + brickW - ballLeft;
    const overlapTop    = ballBottom - by;
    const overlapBottom = by + brickH - ballTop;

    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapX < minOverlapY) {
      b = reflectBallX(b);
    } else {
      b = reflectBallY(b);
    }

    pts += (BRICK_ROWS - brick.row) * 10 + 10;
    return { ...brick, alive: false };
  });

  return { ball: b, bricks: newBricks, points: pts };
}

/** Count how many bricks are still alive. */
export function countAliveBricks(bricks) {
  return bricks.filter((b) => b.alive).length;
}

/**
 * Multiply vx and vy by factor.
 * Magnitude of each component is capped at 12.
 */
export function speedUpBall(ball, factor) {
  const cap = (v) => {
    const scaled = v * factor;
    const sign = scaled >= 0 ? 1 : -1;
    return sign * Math.min(Math.abs(scaled), 12);
  };
  return { ...ball, vx: cap(ball.vx), vy: cap(ball.vy) };
}
