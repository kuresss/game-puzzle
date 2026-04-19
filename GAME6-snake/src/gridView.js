export function buildGridViewModel({ snake, food, status }) {
  const snakeSet = new Set(snake.map((s) => s.y * 20 + s.x));
  const headKey = snake.length > 0 ? snake[0].y * 20 + snake[0].x : -1;
  const foodKey = food ? food.y * 20 + food.x : -1;

  return Array.from({ length: 400 }, (_, i) => {
    const isHead = i === headKey;
    const isSnake = snakeSet.has(i);
    const isFood = i === foodKey;
    return { index: i, isHead, isSnake, isFood, isActive: status === 'playing' || status === 'over' };
  });
}
