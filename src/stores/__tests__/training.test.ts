import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTrainingStore } from '../training'

describe('training store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts a session for an opening', () => {
    const store = useTrainingStore()
    store.startSession('scotch')
    expect(store.openingId).toBe('scotch')
    expect(store.currentMoveIndex).toBe(0)
    expect(store.history).toEqual([])
    expect(store.phase).toBe('playing')
  })

  it('tracks the current opening data', () => {
    const store = useTrainingStore()
    store.startSession('scotch')
    expect(store.currentOpening?.name).toBe('Scotch Game')
  })

  it('identifies whose turn it is', () => {
    const store = useTrainingStore()
    store.startSession('scotch') // user is white
    // move index 0 = white's first move = user's turn
    expect(store.isUserTurn).toBe(true)
  })

  it('advances move index', () => {
    const store = useTrainingStore()
    store.startSession('scotch')
    store.advanceMove()
    expect(store.currentMoveIndex).toBe(1)
  })

  it('detects session complete', () => {
    const store = useTrainingStore()
    store.startSession('scotch')
    const totalMoves = store.currentOpening!.mainLine.length
    for (let i = 0; i < totalMoves; i++) {
      store.advanceMove()
    }
    expect(store.isComplete).toBe(true)
  })
})
