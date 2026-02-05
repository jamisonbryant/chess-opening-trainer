// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMyOpeningsStore } from '../my-openings'

describe('my-openings store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with empty openings when no localStorage data', () => {
    const store = useMyOpeningsStore()
    expect(store.openings).toEqual([])
    expect(store.sortedOpenings).toEqual([])
  })

  it('adds a new opening', () => {
    const store = useMyOpeningsStore()
    store.addOrIncrement('scotch-game', 'white')
    expect(store.openings).toHaveLength(1)
    expect(store.openings[0]!.openingId).toBe('scotch-game')
    expect(store.openings[0]!.userColor).toBe('white')
    expect(store.openings[0]!.timesCompleted).toBe(1)
  })

  it('increments an existing opening', () => {
    const store = useMyOpeningsStore()
    store.addOrIncrement('scotch-game', 'white')

    store.addOrIncrement('scotch-game', 'white')

    expect(store.openings).toHaveLength(1)
    expect(store.openings[0]!.timesCompleted).toBe(2)
  })

  it('treats different colors as separate entries', () => {
    const store = useMyOpeningsStore()
    store.addOrIncrement('scotch-game', 'white')
    store.addOrIncrement('scotch-game', 'black')
    expect(store.openings).toHaveLength(2)

    const white = store.find('scotch-game', 'white')
    const black = store.find('scotch-game', 'black')
    expect(white?.timesCompleted).toBe(1)
    expect(black?.timesCompleted).toBe(1)
  })

  it('detects presence with has()', () => {
    const store = useMyOpeningsStore()
    expect(store.has('scotch-game', 'white')).toBe(false)
    store.addOrIncrement('scotch-game', 'white')
    expect(store.has('scotch-game', 'white')).toBe(true)
    expect(store.has('scotch-game', 'black')).toBe(false)
  })

  it('removes an opening', () => {
    const store = useMyOpeningsStore()
    store.addOrIncrement('scotch-game', 'white')
    store.addOrIncrement('italian-game', 'white')
    expect(store.openings).toHaveLength(2)

    store.remove('scotch-game', 'white')
    expect(store.openings).toHaveLength(1)
    expect(store.has('scotch-game', 'white')).toBe(false)
    expect(store.has('italian-game', 'white')).toBe(true)
  })

  it('remove is a no-op for non-existent entries', () => {
    const store = useMyOpeningsStore()
    store.addOrIncrement('scotch-game', 'white')
    store.remove('italian-game', 'black')
    expect(store.openings).toHaveLength(1)
  })

  it('persists to localStorage on mutation', async () => {
    const store = useMyOpeningsStore()
    store.addOrIncrement('scotch-game', 'white')

    // Vue watch is async, need to flush
    await new Promise((r) => setTimeout(r, 0))

    const stored = JSON.parse(localStorage.getItem('myOpenings')!)
    expect(stored).toHaveLength(1)
    expect(stored[0].openingId).toBe('scotch-game')
  })

  it('loads from localStorage on init', () => {
    const data = [
      {
        openingId: 'italian-game',
        userColor: 'white',
        timesCompleted: 3,
        lastCompletedAt: '2025-01-15T00:00:00.000Z',
      },
    ]
    localStorage.setItem('myOpenings', JSON.stringify(data))

    setActivePinia(createPinia())
    const store = useMyOpeningsStore()
    expect(store.openings).toHaveLength(1)
    expect(store.openings[0]!.openingId).toBe('italian-game')
    expect(store.openings[0]!.timesCompleted).toBe(3)
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('myOpenings', 'not-valid-json')

    setActivePinia(createPinia())
    const store = useMyOpeningsStore()
    expect(store.openings).toEqual([])
  })

  it('handles non-array localStorage gracefully', () => {
    localStorage.setItem('myOpenings', '{"not": "array"}')

    setActivePinia(createPinia())
    const store = useMyOpeningsStore()
    expect(store.openings).toEqual([])
  })

  it('sorts by most recently completed first', () => {
    const store = useMyOpeningsStore()

    // Manually push with known timestamps for deterministic ordering
    store.openings.push(
      {
        openingId: 'older',
        userColor: 'white',
        timesCompleted: 1,
        lastCompletedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        openingId: 'newer',
        userColor: 'white',
        timesCompleted: 1,
        lastCompletedAt: '2025-06-01T00:00:00.000Z',
      },
      {
        openingId: 'middle',
        userColor: 'black',
        timesCompleted: 2,
        lastCompletedAt: '2025-03-01T00:00:00.000Z',
      }
    )

    const sorted = store.sortedOpenings
    expect(sorted[0]!.openingId).toBe('newer')
    expect(sorted[1]!.openingId).toBe('middle')
    expect(sorted[2]!.openingId).toBe('older')
  })
})
