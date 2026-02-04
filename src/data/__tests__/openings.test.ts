import { describe, it, expect } from 'vitest'
import { openings, getOpening } from '../openings'

describe('openings', () => {
  it('contains three openings', () => {
    expect(openings).toHaveLength(3)
  })

  it('each opening has required fields', () => {
    for (const opening of openings) {
      expect(opening.id).toBeTruthy()
      expect(opening.name).toBeTruthy()
      expect(opening.mainLine.length).toBeGreaterThan(4)
      expect(['white', 'black']).toContain(opening.userColor)
    }
  })

  it('getOpening returns correct opening by id', () => {
    const scotch = getOpening('scotch')
    expect(scotch?.name).toBe('Scotch Game')
  })

  it('getOpening returns undefined for unknown id', () => {
    expect(getOpening('unknown')).toBeUndefined()
  })

  it('Scotch Game main line is valid', () => {
    const scotch = getOpening('scotch')!
    expect(scotch.mainLine[0]).toBe('e4')
    expect(scotch.mainLine[1]).toBe('e5')
    expect(scotch.mainLine[2]).toBe('Nf3')
    expect(scotch.mainLine[3]).toBe('Nc6')
    expect(scotch.mainLine[4]).toBe('d4')
    expect(scotch.userColor).toBe('white')
  })
})
