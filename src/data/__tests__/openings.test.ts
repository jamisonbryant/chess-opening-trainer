import { describe, it, expect } from 'vitest'
import { openings, getOpening } from '../openings'
import { parseOpeningsTsv } from '../openings-parser'

describe('openings', () => {
  it('contains a large number of openings from ECO database', () => {
    expect(openings.length).toBeGreaterThan(100)
  })

  it('each opening has required fields', () => {
    for (const opening of openings) {
      expect(opening.id).toBeTruthy()
      expect(opening.name).toBeTruthy()
      expect(opening.mainLine.length).toBeGreaterThanOrEqual(3)
      expect(['white', 'black']).toContain(opening.userColor)
    }
  })

  it('getOpening returns correct opening by id', () => {
    const first = openings[0]!
    const found = getOpening(first.id)
    expect(found?.name).toBe(first.name)
  })

  it('getOpening returns undefined for unknown id', () => {
    expect(getOpening('unknown-nonexistent-id')).toBeUndefined()
  })

  it('all opening ids are unique', () => {
    const ids = openings.map((o) => o.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})

describe('parseOpeningsTsv', () => {
  it('parses a TSV string into Opening objects', () => {
    const tsv = [
      'eco\tname\tpgn',
      'C50\tItalian Game\t1. e4 e5 2. Nf3 Nc6 3. Bc4',
    ].join('\n')

    const result = parseOpeningsTsv(tsv)
    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('italian-game')
    expect(result[0]!.name).toBe('Italian Game')
    expect(result[0]!.mainLine).toEqual(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'])
    expect(result[0]!.userColor).toBe('white')
    expect(result[0]!.description).toBe('')
  })

  it('filters out entries with fewer than 3 moves', () => {
    const tsv = [
      'eco\tname\tpgn',
      'A00\tShort Opening\t1. e4',
      'C50\tItalian Game\t1. e4 e5 2. Nf3 Nc6 3. Bc4',
    ].join('\n')

    const result = parseOpeningsTsv(tsv)
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('Italian Game')
  })

  it('infers black for defense/declined/accepted openings', () => {
    const tsv = [
      'eco\tname\tpgn',
      'B01\tScandinavian Defense\t1. e4 d5 2. exd5 Qxd5 3. Nc3',
    ].join('\n')

    const result = parseOpeningsTsv(tsv)
    expect(result[0]!.userColor).toBe('black')
  })

  it('strips result markers from PGN', () => {
    const tsv = [
      'eco\tname\tpgn',
      'C50\tItalian Game\t1. e4 e5 2. Nf3 Nc6 3. Bc4 1-0',
    ].join('\n')

    const result = parseOpeningsTsv(tsv)
    expect(result[0]!.mainLine).toEqual(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'])
  })

  it('skips empty lines and header', () => {
    const tsv = [
      'eco\tname\tpgn',
      '',
      'C50\tItalian Game\t1. e4 e5 2. Nf3 Nc6 3. Bc4',
      '',
    ].join('\n')

    const result = parseOpeningsTsv(tsv)
    expect(result).toHaveLength(1)
  })

  it('skips lines with missing name or pgn fields', () => {
    const tsv = [
      'eco\tname\tpgn',
      'C50',
      'C50\tItalian Game',
      'C50\tItalian Game\t1. e4 e5 2. Nf3 Nc6 3. Bc4',
    ].join('\n')

    const result = parseOpeningsTsv(tsv)
    expect(result).toHaveLength(1)
    expect(result[0]!.name).toBe('Italian Game')
  })
})
