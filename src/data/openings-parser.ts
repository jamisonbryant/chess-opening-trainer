import type { Opening } from './openings'

import aTsv from './eco/a.tsv?raw'
import bTsv from './eco/b.tsv?raw'
import cTsv from './eco/c.tsv?raw'
import dTsv from './eco/d.tsv?raw'
import eTsv from './eco/e.tsv?raw'

const RESULT_MARKERS = new Set(['1-0', '0-1', '1/2-1/2', '*'])

const BLACK_KEYWORDS = ['Defense', 'Declined', 'Accepted', 'Counter', 'Gambit']

function pgnToSan(pgn: string): string[] {
  return pgn
    .replace(/\d+\.\s*/g, '')
    .split(/\s+/)
    .filter((token) => token !== '' && !RESULT_MARKERS.has(token))
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function inferUserColor(name: string): 'white' | 'black' {
  for (const keyword of BLACK_KEYWORDS) {
    if (name.includes(keyword)) return 'black'
  }
  return 'white'
}

const MIN_MOVES = 3

export function parseOpeningsTsv(rawTsv: string): Opening[] {
  const lines = rawTsv.split('\n')
  const openings: Opening[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim()
    if (!line) continue

    const [_eco, name, pgn] = line.split('\t')
    if (!name || !pgn) continue

    const mainLine = pgnToSan(pgn)
    if (mainLine.length < MIN_MOVES) continue

    openings.push({
      id: slugify(name),
      name,
      description: '',
      mainLine,
      userColor: inferUserColor(name),
    })
  }

  return openings
}

function deduplicateIds(openings: Opening[]): Opening[] {
  const seen = new Map<string, number>()
  return openings.map((opening) => {
    const count = seen.get(opening.id) ?? 0
    seen.set(opening.id, count + 1)
    if (count === 0) return opening
    return { ...opening, id: `${opening.id}-${count}` }
  })
}

export const allOpenings: Opening[] = deduplicateIds([
  ...parseOpeningsTsv(aTsv),
  ...parseOpeningsTsv(bTsv),
  ...parseOpeningsTsv(cTsv),
  ...parseOpeningsTsv(dTsv),
  ...parseOpeningsTsv(eTsv),
])
