/**
 * Creates keyboard and swipe controls for grid-based movement.
 *
 * @param {Object} options
 * @param {(dir: 'up'|'down'|'left'|'right', source: 'touch'|'keyboard') => void} options.onMove
 * @param {() => boolean} [options.canAcceptInput]
 * @param {EventTarget} [options.touchTarget]
 * @param {EventTarget} [options.keyTarget]
 * @param {number} [options.minSwipeDistance]
 */
export function createInputController({
  onMove,
  canAcceptInput = () => true,
  touchTarget = window,
  keyTarget = window,
  minSwipeDistance = 30,
}) {
  if (typeof onMove !== 'function') {
    throw new Error('createInputController: onMove must be a function.');
  }

  const touchState = {
    startX: null,
    startY: null,
  };

  const keyToDirection = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
  };

  const emitMove = (direction, source) => {
    if (!canAcceptInput()) {
      return;
    }
    onMove(direction, source);
  };

  const handleTouchStart = (event) => {
    if (!canAcceptInput()) {
      return;
    }

    const touch = event.changedTouches?.[0] ?? event.touches?.[0];
    if (!touch) {
      return;
    }

    touchState.startX = touch.clientX;
    touchState.startY = touch.clientY;
  };

  const handleTouchEnd = (event) => {
    if (!canAcceptInput()) {
      touchState.startX = null;
      touchState.startY = null;
      return;
    }

    if (touchState.startX === null || touchState.startY === null) {
      return;
    }

    const touch = event.changedTouches?.[0] ?? event.touches?.[0];
    if (!touch) {
      return;
    }

    const dx = touch.clientX - touchState.startX;
    const dy = touch.clientY - touchState.startY;

    touchState.startX = null;
    touchState.startY = null;

    if (Math.hypot(dx, dy) < minSwipeDistance) {
      return;
    }

    if (Math.abs(dx) >= Math.abs(dy)) {
      emitMove(dx >= 0 ? 'right' : 'left', 'touch');
    } else {
      emitMove(dy >= 0 ? 'down' : 'up', 'touch');
    }
  };

  const handleKeyDown = (event) => {
    const direction = keyToDirection[event.key];
    if (!direction) {
      return;
    }

    if (!canAcceptInput()) {
      return;
    }

    event.preventDefault();
    emitMove(direction, 'keyboard');
  };

  touchTarget.addEventListener('touchstart', handleTouchStart, { passive: true });
  touchTarget.addEventListener('touchend', handleTouchEnd, { passive: true });
  keyTarget.addEventListener('keydown', handleKeyDown);

  return {
    destroy() {
      touchTarget.removeEventListener('touchstart', handleTouchStart);
      touchTarget.removeEventListener('touchend', handleTouchEnd);
      keyTarget.removeEventListener('keydown', handleKeyDown);
    },
    setCanAcceptInput(nextCanAcceptInput) {
      if (typeof nextCanAcceptInput !== 'function') {
        throw new Error('setCanAcceptInput: expected a function.');
      }
      canAcceptInput = nextCanAcceptInput;
    },
  };
}
