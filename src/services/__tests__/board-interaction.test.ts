// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('BoardInteraction', () => {
  describe('getSquareCenter', () => {
    it('returns center coordinates for a1 when playing as white', async () => {
      const { getSquareCenter } = await import('../board-interaction')
      const boardEl = createMockBoard(0, 0, 800, 800)
      const { x, y } = getSquareCenter('a1', boardEl, true)
      // a1 = file 0, rank 0 → col 0, row 7 (white perspective)
      // center = (0 + 0.5) * 100, (7 + 0.5) * 100 = 50, 750
      expect(x).toBe(50)
      expect(y).toBe(750)
    })

    it('returns center coordinates for e4 when playing as white', async () => {
      const { getSquareCenter } = await import('../board-interaction')
      const boardEl = createMockBoard(0, 0, 800, 800)
      const { x, y } = getSquareCenter('e4', boardEl, true)
      // e4 = file 4, rank 3 → col 4, row 4 (white perspective)
      // center = (4 + 0.5) * 100, (4 + 0.5) * 100 = 450, 450
      expect(x).toBe(450)
      expect(y).toBe(450)
    })

    it('returns center coordinates for e4 when playing as black', async () => {
      const { getSquareCenter } = await import('../board-interaction')
      const boardEl = createMockBoard(0, 0, 800, 800)
      const { x, y } = getSquareCenter('e4', boardEl, false)
      // e4 = file 4, rank 3 → col 3, row 3 (black perspective: col = 7-4, row = 3)
      // center = (3 + 0.5) * 100, (3 + 0.5) * 100 = 350, 350
      expect(x).toBe(350)
      expect(y).toBe(350)
    })

    it('accounts for board offset from viewport edge', async () => {
      const { getSquareCenter } = await import('../board-interaction')
      const boardEl = createMockBoard(100, 50, 400, 400)
      const { x, y } = getSquareCenter('a8', boardEl, true)
      // a8 = file 0, rank 7 → col 0, row 0 (white perspective)
      // squareSize = 400/8 = 50
      // center = 100 + (0 + 0.5) * 50, 50 + (0 + 0.5) * 50 = 125, 75
      expect(x).toBe(125)
      expect(y).toBe(75)
    })

    it('returns h8 at top-right when playing as white', async () => {
      const { getSquareCenter } = await import('../board-interaction')
      const boardEl = createMockBoard(0, 0, 800, 800)
      const { x, y } = getSquareCenter('h8', boardEl, true)
      // h8 = file 7, rank 7 → col 7, row 0
      // center = 750, 50
      expect(x).toBe(750)
      expect(y).toBe(50)
    })
  })

  describe('selectPiece', () => {
    it('dispatches mousedown and mouseup events on the board element', async () => {
      const { selectPiece } = await import('../board-interaction')
      const boardEl = createMockBoard(0, 0, 800, 800)
      const events: MouseEvent[] = []
      boardEl.dispatchEvent = vi.fn((e: Event) => {
        events.push(e as MouseEvent)
        return true
      })

      selectPiece('e2', boardEl, true)

      expect(events).toHaveLength(2)
      expect(events[0]!.type).toBe('mousedown')
      expect(events[1]!.type).toBe('mouseup')
      // e2 = file 4, rank 1 → col 4, row 6 → center (450, 650)
      expect(events[0]!.clientX).toBe(450)
      expect(events[0]!.clientY).toBe(650)
    })

    it('events bubble and are cancelable', async () => {
      const { selectPiece } = await import('../board-interaction')
      const boardEl = createMockBoard(0, 0, 800, 800)
      const events: MouseEvent[] = []
      boardEl.dispatchEvent = vi.fn((e: Event) => {
        events.push(e as MouseEvent)
        return true
      })

      selectPiece('a1', boardEl, true)

      expect(events[0]!.bubbles).toBe(true)
      expect(events[0]!.cancelable).toBe(true)
      expect(events[1]!.bubbles).toBe(true)
      expect(events[1]!.cancelable).toBe(true)
    })
  })

  describe('clickSquare', () => {
    it('dispatches mousedown and mouseup on the target square', async () => {
      const { clickSquare } = await import('../board-interaction')
      const boardEl = createMockBoard(0, 0, 800, 800)
      const events: MouseEvent[] = []
      boardEl.dispatchEvent = vi.fn((e: Event) => {
        events.push(e as MouseEvent)
        return true
      })

      clickSquare('e4', boardEl, true)

      expect(events).toHaveLength(2)
      expect(events[0]!.type).toBe('mousedown')
      expect(events[1]!.type).toBe('mouseup')
      expect(events[0]!.clientX).toBe(450)
      expect(events[0]!.clientY).toBe(450)
    })

    it('uses black orientation when asWhite is false', async () => {
      const { clickSquare } = await import('../board-interaction')
      const boardEl = createMockBoard(0, 0, 800, 800)
      const events: MouseEvent[] = []
      boardEl.dispatchEvent = vi.fn((e: Event) => {
        events.push(e as MouseEvent)
        return true
      })

      clickSquare('e4', boardEl, false)

      // Black perspective: col = 7-4 = 3, row = 3
      expect(events[0]!.clientX).toBe(350)
      expect(events[0]!.clientY).toBe(350)
    })
  })

  describe('findPieceOnSquare', () => {
    beforeEach(() => {
      document.body.innerHTML = ''
    })

    it('finds a piece by its transform position (white orientation)', async () => {
      const { findPieceOnSquare } = await import('../board-interaction')
      const { pieceEl } = setupBoardWithPiece('e4', 'white')

      const found = findPieceOnSquare('e4')
      expect(found).toBe(pieceEl)
    })

    it('finds a piece with black orientation', async () => {
      const { findPieceOnSquare } = await import('../board-interaction')
      const { pieceEl } = setupBoardWithPiece('e4', 'black')

      const found = findPieceOnSquare('e4')
      expect(found).toBe(pieceEl)
    })

    it('returns null when no board exists', async () => {
      const { findPieceOnSquare } = await import('../board-interaction')
      const found = findPieceOnSquare('e4')
      expect(found).toBeNull()
    })

    it('returns null when no piece is on the square', async () => {
      const { findPieceOnSquare } = await import('../board-interaction')
      setupBoardWithPiece('e4', 'white')

      const found = findPieceOnSquare('d5')
      expect(found).toBeNull()
    })
  })

  describe('pickRandomAnimation', () => {
    it('returns one of the three animation types', async () => {
      const { pickRandomAnimation, PIECE_ANIMATIONS } = await import('../board-interaction')
      const result = pickRandomAnimation()
      expect(PIECE_ANIMATIONS).toContain(result)
    })
  })

  describe('animatePieceArrival', () => {
    let mockAnimation: { onfinish: (() => void) | null }

    beforeEach(() => {
      vi.useFakeTimers()
      document.body.innerHTML = ''
      mockAnimation = { onfinish: null }
      // happy-dom doesn't implement Web Animations API
      Element.prototype.animate = vi.fn(() => mockAnimation) as any
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('calls element.animate with correct animation type', async () => {
      const { animatePieceArrival } = await import('../board-interaction')
      const { pieceEl } = setupBoardWithPiece('e4', 'white')

      animatePieceArrival('e4', { animation: 'spin' })
      vi.advanceTimersByTime(0)

      expect(pieceEl.animate).toHaveBeenCalledTimes(1)
      const [keyframes, options] = (pieceEl.animate as any).mock.calls[0]
      expect(keyframes.length).toBeGreaterThan(1)
      expect(options.easing).toBe('ease')
    })

    it('respects delay before animating', async () => {
      const { animatePieceArrival } = await import('../board-interaction')
      const { pieceEl } = setupBoardWithPiece('e4', 'white')

      animatePieceArrival('e4', { delay: 500 })

      vi.advanceTimersByTime(499)
      expect(pieceEl.animate).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(pieceEl.animate).toHaveBeenCalledTimes(1)
    })

    it('does nothing if no piece is found on the square', async () => {
      const { animatePieceArrival } = await import('../board-interaction')
      setupBoardWithPiece('e4', 'white')

      expect(() => {
        animatePieceArrival('d5')
        vi.advanceTimersByTime(0)
      }).not.toThrow()
    })

    it('applies glow class for wrong effect and removes on finish', async () => {
      const { animatePieceArrival } = await import('../board-interaction')
      const { pieceEl } = setupBoardWithPiece('e4', 'white')

      animatePieceArrival('e4', { effect: 'wrong' })
      vi.advanceTimersByTime(0)

      expect(pieceEl.classList.contains('piece-wrong-glow')).toBe(true)
      mockAnimation.onfinish?.()
      expect(pieceEl.classList.contains('piece-wrong-glow')).toBe(false)
    })

    it('applies glow class for complete effect', async () => {
      const { animatePieceArrival } = await import('../board-interaction')
      const { pieceEl } = setupBoardWithPiece('e4', 'white')

      animatePieceArrival('e4', { animation: 'celebration-bounce', effect: 'complete' })
      vi.advanceTimersByTime(0)

      expect(pieceEl.classList.contains('piece-complete-glow')).toBe(true)
    })

    it('exports PIECE_ANIMATIONS with all types', async () => {
      const { PIECE_ANIMATIONS } = await import('../board-interaction')
      expect(PIECE_ANIMATIONS).toContain('spin')
      expect(PIECE_ANIMATIONS).toContain('sway')
      expect(PIECE_ANIMATIONS).toHaveLength(2)
    })
  })
})

/**
 * Creates a mock element with a stubbed getBoundingClientRect.
 */
function createMockBoard(left: number, top: number, width: number, height: number): HTMLElement {
  const el = document.createElement('div')
  el.getBoundingClientRect = () => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON() { return {} },
  })
  return el
}

/**
 * Set up a mock cg-wrap > cg-board with a piece positioned via transform,
 * matching how chessground renders pieces in the real DOM.
 */
function setupBoardWithPiece(
  square: string,
  orientation: 'white' | 'black',
): { pieceEl: HTMLElement; boardEl: HTMLElement } {
  const BOARD_SIZE = 800
  const SQUARE_SIZE = BOARD_SIZE / 8

  const wrap = document.createElement('div')
  wrap.className = `cg-wrap orientation-${orientation}`

  const board = document.createElement('cg-board')
  board.getBoundingClientRect = () => ({
    left: 0, top: 0,
    width: BOARD_SIZE, height: BOARD_SIZE,
    right: BOARD_SIZE, bottom: BOARD_SIZE,
    x: 0, y: 0,
    toJSON() { return {} },
  })
  wrap.appendChild(board)

  const file = square.charCodeAt(0) - 97
  const rank = parseInt(square[1]!) - 1
  const isWhite = orientation === 'white'
  const col = isWhite ? file : 7 - file
  const row = isWhite ? 7 - rank : rank
  const x = Math.round(col * SQUARE_SIZE)
  const y = Math.round(row * SQUARE_SIZE)

  const piece = document.createElement('piece')
  piece.className = 'white pawn'
  piece.style.transform = `translate(${x}px, ${y}px)`
  board.appendChild(piece)

  document.body.appendChild(wrap)
  return { pieceEl: piece, boardEl: board }
}
