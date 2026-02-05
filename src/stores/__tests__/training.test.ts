import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTrainingStore } from '../training'
import { openings } from '../../data/openings'

const testOpening = openings[0]!

describe('training store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts a session for an opening', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'white')
    expect(store.openingId).toBe(testOpening.id)
    expect(store.currentMoveIndex).toBe(0)
    expect(store.history).toEqual([])
    expect(store.phase).toBe('playing')
  })

  it('tracks the current opening data', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'white')
    expect(store.currentOpening?.name).toBe(testOpening.name)
  })

  it('identifies whose turn it is', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'white') // user is white
    // move index 0 = white's first move = user's turn
    expect(store.isUserTurn).toBe(true)
  })

  it('advances move index', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'white')
    store.advanceMove()
    expect(store.currentMoveIndex).toBe(1)
  })

  it('detects session complete', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'white')
    const totalMoves = store.currentOpening!.mainLine.length
    for (let i = 0; i < totalMoves; i++) {
      store.advanceMove()
    }
    expect(store.isComplete).toBe(true)
  })
})
