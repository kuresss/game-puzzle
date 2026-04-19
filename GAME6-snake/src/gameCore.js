export const COLS = 20;
export const ROWS = 20;
export const CELL_COUNT = COLS * ROWS;

export const DIR = { UP: 'up', DOWN: 'down', LEFT: 'left', RIGHT: 'right' };

const OPPOSITES = { up: 'down', down: 'up', left: 'right', right: 'left' };

export const DIFFICULTIES = {
  easy:   { initialInterval: 200, wallWrap: true,  label: 'かんたん'  },
  normal: { initialInterval: 150, wallWrap: true,  label: 'ふつう'    },
  hard:   { initialInterval: 100, wallWrap: true,  label: 'むずかしい' },
  oni:    { initialInterval: 70,  wallWrap: false, label: '🔴 鬼'      },
};

export function isOpposite(a, b) {
  return OPPOSITES[a] === b;
}

// Snake: array of {x, y} — index 0 is HEAD
export function createSnake() {
  return [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
}

export function moveHead(head, direction) {
  const { x, y } = head;
  if (direction === DIR.UP)    return { x, y: y - 1 };
  if (direction === DIR.DOWN)  return { x, y: y + 1 };
  if (direction === DIR.LEFT)  return { x: x - 1, y };
  return { x: x + 1, y };
}

export function isOutOfBounds(head, cols = COLS, rows = ROWS) {
  return head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows;
}

export function isSelfCollision(snake, newHead) {
  return snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y);
}

export function spawnFood(snake, random = Math.random) {
  const occupied = new Set(snake.map((s) => s.y * COLS + s.x));
  const candidates = [];
  for (let i = 0; i < CELL_COUNT; i++) {
    if (!occupied.has(i)) candidates.push(i);
  }
  if (candidates.length === 0) return null;
  const idx = candidates[Math.floor(random() * candidates.length)];
  return { x: idx % COLS, y: Math.floor(idx / COLS) };
}

export function isFoodEaten(head, food) {
  return food !== null && head.x === food.x && head.y === food.y;
}

// Returns { snake, grew } — does NOT spawn new food or check collisions
// wallWrap=false: head is allowed to go out of bounds (caller checks isOutOfBounds)
export function stepSnake(snake, direction, grow, wallWrap = true) {
  let newHead = moveHead(snake[0], direction);
  if (wallWrap) {
    newHead = {
      x: ((newHead.x % COLS) + COLS) % COLS,
      y: ((newHead.y % ROWS) + ROWS) % ROWS,
    };
  }
  const newSnake = [newHead, ...snake];
  if (!grow) newSnake.pop();
  return { snake: newSnake, grew: grow };
}

export function getInterval(foodEaten, initialInterval = 150) {
  return Math.max(80, initialInterval - Math.floor(foodEaten / 5) * 10);
}
