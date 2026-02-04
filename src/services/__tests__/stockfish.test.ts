import { describe, it, expect } from 'vitest'
import { StockfishService } from '../stockfish'

describe('StockfishService', () => {
  it('formats evaluation as human-readable text', () => {
    const service = new StockfishService()
    expect(service.formatEval(150)).toBe('+1.50 pawns (White is better)')
    expect(service.formatEval(-80)).toBe('-0.80 pawns (Black is better)')
    expect(service.formatEval(15)).toBe('+0.15 pawns (roughly equal)')
    expect(service.formatEval(0)).toBe('0.00 pawns (roughly equal)')
  })

  it('calculates eval delta description', () => {
    const service = new StockfishService()
    expect(service.describeEvalDelta(50, -100)).toBe(
      'Your move loses about 1.50 pawns of advantage.'
    )
    expect(service.describeEvalDelta(50, 55)).toBe(
      'Your move is roughly as good as the book move.'
    )
  })
})
