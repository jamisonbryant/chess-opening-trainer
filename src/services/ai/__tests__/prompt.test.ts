import { describe, it, expect } from 'vitest'
import { buildEvaluationPrompt, SYSTEM_PROMPT } from '../types'

describe('AI prompt building', () => {
  it('system prompt instructs the AI to teach', () => {
    expect(SYSTEM_PROMPT).toContain('chess opening trainer')
    expect(SYSTEM_PROMPT).toContain('teach')
  })

  it('builds a structured evaluation prompt', () => {
    const prompt = buildEvaluationPrompt({
      openingName: 'Scotch Game',
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      moveNumber: 3,
      bookMove: 'd4',
      bookEval: '+0.30 pawns (roughly equal)',
      userMove: 'Bc4',
      userEval: '+0.25 pawns (roughly equal)',
      evalDelta: 'Your move is roughly as good as the book move.',
      userExplanation: 'I wanted to develop my bishop to target f7.',
    })

    expect(prompt).toContain('Scotch Game')
    expect(prompt).toContain('d4')
    expect(prompt).toContain('Bc4')
    expect(prompt).toContain('develop my bishop')
  })
})
