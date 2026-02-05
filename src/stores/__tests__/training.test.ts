// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTrainingStore } from '../training'
import { openings } from '../../data/openings'

const testOpening = openings[0]!

function setUrlParams(params: Record<string, string>) {
  const search = new URLSearchParams(params).toString()
  window.history.replaceState({}, '', `${window.location.pathname}?${search}`)
}

function clearUrl() {
  window.history.replaceState({}, '', window.location.pathname)
}

describe('training store', () => {
  beforeEach(() => {
    clearUrl()
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

  it('transitions to reflecting phase when all moves complete', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'white')
    const totalMoves = store.currentOpening!.mainLine.length
    for (let i = 0; i < totalMoves; i++) {
      store.advanceMove()
    }
    expect(store.phase).toBe('reflecting')
  })

  it('computes progress as a fraction', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'white')
    expect(store.progress).toBe(0)

    store.advanceMove()
    const totalMoves = store.currentOpening!.mainLine.length
    expect(store.progress).toBeCloseTo(1 / totalMoves)
  })

  it('progress is 0 with no opening', () => {
    const store = useTrainingStore()
    expect(store.progress).toBe(0)
  })

  it('sets phase directly', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'white')
    store.setPhase('explaining')
    expect(store.phase).toBe('explaining')
    store.setPhase('evaluating')
    expect(store.phase).toBe('evaluating')
  })

  it('adds an exchange to history', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'white')

    const exchange = {
      moveNumber: 1,
      expectedMove: 'e4',
      userMove: 'd4',
      userExplanation: 'I wanted to control the center.',
      wasCorrect: false,
      aiResponse: 'Good idea, but e4 is the main line.',
    }
    store.addExchange(exchange)

    expect(store.history).toHaveLength(1)
    expect(store.history[0]).toEqual(exchange)
  })

  it('resets all state to idle', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'white')
    store.advanceMove()
    store.addExchange({
      moveNumber: 1,
      expectedMove: 'e4',
      userMove: 'd4',
      userExplanation: 'test',
      wasCorrect: false,
      aiResponse: 'test',
    })

    store.reset()
    expect(store.openingId).toBeNull()
    expect(store.userColor).toBe('white')
    expect(store.currentMoveIndex).toBe(0)
    expect(store.history).toEqual([])
    expect(store.phase).toBe('idle')
  })

  it('isUserTurn is false when no opening is set', () => {
    const store = useTrainingStore()
    expect(store.isUserTurn).toBe(false)
  })

  it('expectedMove returns the correct move for current index', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'white')
    expect(store.expectedMove).toBe(testOpening.mainLine[0])
    store.advanceMove()
    expect(store.expectedMove).toBe(testOpening.mainLine[1])
  })

  it('isComplete is false with no opening', () => {
    const store = useTrainingStore()
    expect(store.isComplete).toBe(false)
  })

  it('clearRestoredFlag sets restoredFromUrl to false', () => {
    const store = useTrainingStore()
    store.clearRestoredFlag()
    expect(store.restoredFromUrl).toBe(false)
  })

  it('identifies opponent turn for black user', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'black')
    // move index 0 = white's first move, but user is black = not user's turn
    expect(store.isUserTurn).toBe(false)
    store.advanceMove()
    // move index 1 = black's first move = user's turn
    expect(store.isUserTurn).toBe(true)
  })
})

describe('training store URL persistence', () => {
  beforeEach(() => {
    clearUrl()
    setActivePinia(createPinia())
  })

  it('writes query params when starting a session', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'white')

    const params = new URLSearchParams(window.location.search)
    expect(params.get('op')).toBe(testOpening.id)
    expect(params.get('mv')).toBe('0')
    expect(params.get('c')).toBe('white')
  })

  it('updates query params on advanceMove', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'black')
    store.advanceMove()

    const params = new URLSearchParams(window.location.search)
    expect(params.get('mv')).toBe('1')
    expect(params.get('c')).toBe('black')
  })

  it('clears query params on reset', () => {
    const store = useTrainingStore()
    store.startSession(testOpening.id, 'white')
    store.reset()

    expect(window.location.search).toBe('')
  })

  it('restores state from URL query params', () => {
    setUrlParams({ op: testOpening.id, mv: '3', c: 'black' })

    setActivePinia(createPinia())
    const store = useTrainingStore()

    expect(store.openingId).toBe(testOpening.id)
    expect(store.currentMoveIndex).toBe(3)
    expect(store.userColor).toBe('black')
    expect(store.phase).toBe('playing')
    expect(store.restoredFromUrl).toBe(true)
  })

  it('defaults to white when color param is missing', () => {
    setUrlParams({ op: testOpening.id, mv: '0' })

    setActivePinia(createPinia())
    const store = useTrainingStore()

    expect(store.userColor).toBe('white')
  })

  it('defaults to move 0 when mv param is missing', () => {
    setUrlParams({ op: testOpening.id })

    setActivePinia(createPinia())
    const store = useTrainingStore()

    expect(store.currentMoveIndex).toBe(0)
  })

  it('clamps move index to opening length', () => {
    setUrlParams({ op: testOpening.id, mv: '9999' })

    setActivePinia(createPinia())
    const store = useTrainingStore()

    expect(store.currentMoveIndex).toBe(testOpening.mainLine.length)
  })

  it('ignores invalid opening id in URL', () => {
    setUrlParams({ op: 'nonexistent-opening-xyz', mv: '2' })

    setActivePinia(createPinia())
    const store = useTrainingStore()

    expect(store.openingId).toBeNull()
    expect(store.phase).toBe('idle')
  })

  it('ignores negative move index in URL', () => {
    setUrlParams({ op: testOpening.id, mv: '-5' })

    setActivePinia(createPinia())
    const store = useTrainingStore()

    expect(store.openingId).toBeNull()
    expect(store.phase).toBe('idle')
  })

  it('ignores non-numeric move index in URL', () => {
    setUrlParams({ op: testOpening.id, mv: 'abc' })

    setActivePinia(createPinia())
    const store = useTrainingStore()

    expect(store.openingId).toBeNull()
    expect(store.phase).toBe('idle')
  })
})
