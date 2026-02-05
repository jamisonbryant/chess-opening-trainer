/**
 * Programmatic board interaction API.
 * Wraps low-level DOM mouse events on the chessground board element
 * into a clean interface for selecting pieces and clicking squares.
 */

export interface SquareCoords {
  x: number
  y: number
}

export type PieceAnimation = 'spin' | 'sway'

export const PIECE_ANIMATIONS: readonly PieceAnimation[] = [
  'spin',
  'sway',
] as const

export type MoveEffect = 'wrong' | 'complete'

export interface AnimationOptions {
  animation?: PieceAnimation | 'celebration-bounce'
  delay?: number
  effect?: MoveEffect
  /** Pause (ms) between repetitions. When set, animation loops until cancelled. */
  loopGap?: number
}

/**
 * Pick a random piece animation from the available set.
 * Use once per training session so the animation stays consistent.
 */
export function pickRandomAnimation(): PieceAnimation {
  const index = Math.floor(Math.random() * PIECE_ANIMATIONS.length)
  return PIECE_ANIMATIONS[index]!
}

/**
 * Calculate the pixel center of a given algebraic square on the board.
 *
 * @param square - Algebraic notation (e.g. "e4")
 * @param boardEl - The cg-board HTML element
 * @param asWhite - true if board is oriented with white at bottom
 */
export function getSquareCenter(
  square: string,
  boardEl: HTMLElement,
  asWhite: boolean,
): SquareCoords {
  const bounds = boardEl.getBoundingClientRect()
  const file = square.charCodeAt(0) - 97 // 'a' = 0, 'h' = 7
  const rank = parseInt(square[1]!) - 1   // '1' = 0, '8' = 7

  let col = file
  let row = 7 - rank
  if (!asWhite) {
    col = 7 - file
    row = rank
  }

  const squareSize = bounds.width / 8
  return {
    x: bounds.left + (col + 0.5) * squareSize,
    y: bounds.top + (row + 0.5) * squareSize,
  }
}

function dispatchClickPair(boardEl: HTMLElement, x: number, y: number): void {
  boardEl.dispatchEvent(
    new MouseEvent('mousedown', {
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
    }),
  )
  boardEl.dispatchEvent(
    new MouseEvent('mouseup', {
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
    }),
  )
}

/**
 * Select a piece on the given square (shows legal move indicators).
 */
export function selectPiece(
  square: string,
  boardEl: HTMLElement,
  asWhite: boolean,
): void {
  const { x, y } = getSquareCenter(square, boardEl, asWhite)
  dispatchClickPair(boardEl, x, y)
}

/**
 * Click a target square to execute a move (piece must already be selected).
 */
export function clickSquare(
  square: string,
  boardEl: HTMLElement,
  asWhite: boolean,
): void {
  const { x, y } = getSquareCenter(square, boardEl, asWhite)
  dispatchClickPair(boardEl, x, y)
}

/**
 * Find the piece DOM element on a given square by matching its
 * transform position. Chessground positions pieces with
 * `transform: translate(Xpx, Ypx)` — no data attributes.
 */
export function findPieceOnSquare(square: string): HTMLElement | null {
  const board = document.querySelector('cg-board') as HTMLElement | null
  if (!board) return null

  const wrap = board.closest('.cg-wrap')
  const isWhite = !wrap || wrap.classList.contains('orientation-white')
  const squareSize = board.getBoundingClientRect().width / 8

  const file = square.charCodeAt(0) - 97
  const rank = parseInt(square[1]!) - 1
  const col = isWhite ? file : 7 - file
  const row = isWhite ? 7 - rank : rank
  const expectedX = Math.round(col * squareSize)
  const expectedY = Math.round(row * squareSize)

  const TOLERANCE = 2
  for (const el of board.querySelectorAll('piece')) {
    const match = (el as HTMLElement).style.transform.match(
      /translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/,
    )
    if (!match) continue
    const x = Math.round(parseFloat(match[1]!))
    const y = Math.round(parseFloat(match[2]!))
    if (Math.abs(x - expectedX) <= TOLERANCE && Math.abs(y - expectedY) <= TOLERANCE) {
      return el as HTMLElement
    }
  }
  return null
}

const EFFECT_CLASSES: Record<MoveEffect, string> = {
  wrong: 'piece-wrong-glow',
  complete: 'piece-complete-glow',
}

/**
 * Parse the current translate(Xpx, Ypx) from a piece's inline style.
 */
function getTranslate(piece: HTMLElement): { x: number; y: number } {
  const match = piece.style.transform.match(
    /translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/,
  )
  if (!match) return { x: 0, y: 0 }
  return { x: parseFloat(match[1]!), y: parseFloat(match[2]!) }
}

/** Shorthand: build a transform string preserving the piece's position. */
const t = (x: number, y: number, extra = '') =>
  `translate(${x}px, ${y}px)${extra ? ' ' + extra : ''}`

type AnimationName = PieceAnimation | 'celebration-bounce'

/**
 * Build Web Animations API keyframes for each animation type.
 * Every keyframe includes the piece's translate so it stays anchored.
 */
function buildKeyframes(
  name: AnimationName,
  x: number,
  y: number,
): { keyframes: Keyframe[]; duration: number } {
  switch (name) {
    case 'sway':
      return {
        duration: 650,
        keyframes: [
          { transform: t(x, y), offset: 0 },
          { transform: t(x + 8, y), offset: 0.15 },
          { transform: t(x - 7, y), offset: 0.35 },
          { transform: t(x + 5, y), offset: 0.5 },
          { transform: t(x - 3.5, y), offset: 0.65 },
          { transform: t(x + 1.5, y), offset: 0.8 },
          { transform: t(x, y), offset: 1 },
        ],
      }
    case 'spin':
      return {
        duration: 700,
        keyframes: [
          { transform: t(x, y, 'rotate(0deg) scale(1)'), offset: 0 },
          { transform: t(x, y, 'rotate(180deg) scale(1.05)'), offset: 0.25 },
          { transform: t(x, y, 'rotate(360deg) scale(1.02)'), offset: 0.5 },
          { transform: t(x, y, 'rotate(540deg) scale(1.05)'), offset: 0.75 },
          { transform: t(x, y, 'rotate(720deg) scale(1)'), offset: 1 },
        ],
      }
    case 'celebration-bounce':
      return {
        duration: 1800,
        keyframes: [
          { transform: t(x, y), offset: 0 },
          { transform: t(x, y - 14), offset: 0.08 },
          { transform: t(x, y), offset: 0.18 },
          { transform: t(x, y - 11), offset: 0.28 },
          { transform: t(x, y), offset: 0.38 },
          { transform: t(x, y - 8), offset: 0.48 },
          { transform: t(x, y), offset: 0.58 },
          { transform: t(x, y - 5), offset: 0.68 },
          { transform: t(x, y), offset: 0.78 },
          { transform: t(x, y - 2.5), offset: 0.88 },
          { transform: t(x, y), offset: 1 },
        ],
      }
  }
}

/**
 * Animate a piece on the given square with a playful arrival animation.
 *
 * Uses the Web Animations API so every keyframe includes the piece's
 * current translate position, preventing any drift from chessground's
 * inline transform.
 *
 * Returns a cancel function. For one-shot animations it's a no-op;
 * for looping animations (loopGap set) it stops the loop.
 *
 * @param square - The algebraic square where the piece has arrived
 * @param options - Animation type, delay, and optional loop gap
 */
export function animatePieceArrival(
  square: string,
  options: AnimationOptions = {},
): () => void {
  const { animation = 'sway', delay = 0, effect, loopGap } = options
  const effectClass = effect ? EFFECT_CLASSES[effect] : null
  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const cancel = () => {
    cancelled = true
    if (timer != null) clearTimeout(timer)
  }

  const playOnce = () => {
    const piece = findPieceOnSquare(square)
    if (!piece || cancelled) return

    const { x, y } = getTranslate(piece)
    const { keyframes, duration } = buildKeyframes(animation, x, y)

    if (effectClass) piece.classList.add(effectClass)

    const anim = piece.animate(keyframes, { duration, easing: 'ease' })
    anim.onfinish = () => {
      if (effectClass && !loopGap) piece.classList.remove(effectClass)
      if (loopGap != null && !cancelled) {
        timer = setTimeout(playOnce, loopGap)
      }
    }
  }

  timer = setTimeout(playOnce, delay)
  return cancel
}
