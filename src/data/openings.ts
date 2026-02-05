export interface Opening {
  id: string
  name: string
  description: string
  mainLine: string[]  // SAN moves in order
  userColor: 'white' | 'black'
}

import { allOpenings } from './openings-parser'

export const openings: Opening[] = allOpenings

export function getOpening(id: string): Opening | undefined {
  return openings.find((o) => o.id === id)
}
