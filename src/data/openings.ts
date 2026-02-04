export interface Opening {
  id: string
  name: string
  description: string
  mainLine: string[]  // SAN moves in order
  userColor: 'white' | 'black'
}

export const openings: Opening[] = [
  {
    id: 'scotch',
    name: 'Scotch Game',
    description: 'An aggressive opening where White immediately challenges the center with 3.d4.',
    mainLine: [
      'e4', 'e5',     // 1. e4 e5
      'Nf3', 'Nc6',   // 2. Nf3 Nc6
      'd4', 'exd4',   // 3. d4 exd4
      'Nxd4', 'Nf6',  // 4. Nxd4 Nf6 (Schmidt Variation)
      'Nxc6', 'bxc6', // 5. Nxc6 bxc6
      'e5', 'Qe7',    // 6. e5 Qe7
      'Qe2', 'Nd5',   // 7. Qe2 Nd5
    ],
    userColor: 'white',
  },
  {
    id: 'italian',
    name: 'Italian Game',
    description: 'A classical opening emphasizing rapid development and pressure on f7.',
    mainLine: [
      'e4', 'e5',     // 1. e4 e5
      'Nf3', 'Nc6',   // 2. Nf3 Nc6
      'Bc4', 'Bc5',   // 3. Bc4 Bc5 (Giuoco Piano)
      'c3', 'Nf6',    // 4. c3 Nf6
      'd3', 'a6',     // 5. d3 a6 (Giuoco Pianissimo)
      'O-O', 'Ba7',   // 6. O-O Ba7
      'Re1', 'O-O',   // 7. Re1 O-O
    ],
    userColor: 'white',
  },
  {
    id: 'sicilian-najdorf',
    name: 'Sicilian Defense: Najdorf Variation',
    description: 'The most popular and deeply studied response to 1.e4. Black fights for counterplay.',
    mainLine: [
      'e4', 'c5',     // 1. e4 c5
      'Nf3', 'd6',    // 2. Nf3 d6
      'd4', 'cxd4',   // 3. d4 cxd4
      'Nxd4', 'Nf6',  // 4. Nxd4 Nf6
      'Nc3', 'a6',    // 5. Nc3 a6 (Najdorf)
      'Bg5', 'e6',    // 6. Bg5 e6
      'f4', 'Be7',    // 7. f4 Be7
    ],
    userColor: 'black',
  },
]

export function getOpening(id: string): Opening | undefined {
  return openings.find((o) => o.id === id)
}
