import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { getOpening, type Opening } from '../data/openings'

export interface TrainingExchange {
  moveNumber: number
  expectedMove: string
  userMove: string
  userExplanation: string
  wasCorrect: boolean
  aiResponse: string
}

export type TrainingPhase =
  | 'idle'        // no session active
  | 'playing'     // waiting for user or auto-playing opponent move
  | 'explaining'  // user made wrong move, asking for explanation
  | 'evaluating'  // AI is generating response
  | 'complete'    // reached end of main line

export type UserColor = 'white' | 'black'

const SESSION_KEY = 'chess-trainer-session'

interface PersistedSession {
  openingId: string | null
  userColor: UserColor
  currentMoveIndex: number
  history: TrainingExchange[]
  phase: TrainingPhase
}

const hasSessionStorage = typeof sessionStorage !== 'undefined'

function loadSession(): PersistedSession | null {
  if (!hasSessionStorage) return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedSession
  } catch {
    return null
  }
}

export const useTrainingStore = defineStore('training', () => {
  const saved = loadSession()
  // If the saved phase was mid-interaction (explaining/evaluating), fall back to playing
  const restoredPhase = saved
    ? (saved.phase === 'explaining' || saved.phase === 'evaluating' ? 'playing' : saved.phase)
    : 'idle'

  const openingId = ref<string | null>(saved?.openingId ?? null)
  const userColor = ref<UserColor>(saved?.userColor ?? 'white')
  const currentMoveIndex = ref(saved?.currentMoveIndex ?? 0)
  const history = ref<TrainingExchange[]>(saved?.history ?? [])
  const phase = ref<TrainingPhase>(restoredPhase)
  const restoredFromSession = ref(saved !== null && restoredPhase !== 'idle')

  function persist() {
    const data: PersistedSession = {
      openingId: openingId.value,
      userColor: userColor.value,
      currentMoveIndex: currentMoveIndex.value,
      history: history.value,
      phase: phase.value,
    }
    if (hasSessionStorage) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
    }
  }

  watch([openingId, userColor, currentMoveIndex, history, phase], persist, { deep: true })

  const currentOpening = computed<Opening | undefined>(() =>
    openingId.value ? getOpening(openingId.value) : undefined
  )

  const isUserTurn = computed(() => {
    if (!currentOpening.value) return false
    const moveIsWhite = currentMoveIndex.value % 2 === 0
    return userColor.value === 'white' ? moveIsWhite : !moveIsWhite
  })

  const expectedMove = computed(() =>
    currentOpening.value?.mainLine[currentMoveIndex.value]
  )

  const isComplete = computed(() => {
    const opening = currentOpening.value
    if (!opening) return false
    return currentMoveIndex.value >= opening.mainLine.length
  })

  const progress = computed(() => {
    const opening = currentOpening.value
    if (!opening) return 0
    return currentMoveIndex.value / opening.mainLine.length
  })

  function startSession(id: string, color: UserColor) {
    openingId.value = id
    userColor.value = color
    currentMoveIndex.value = 0
    history.value = []
    phase.value = 'playing'
  }

  function advanceMove() {
    currentMoveIndex.value++
    if (isComplete.value) {
      phase.value = 'complete'
    }
  }

  function setPhase(p: TrainingPhase) {
    phase.value = p
  }

  function addExchange(exchange: TrainingExchange) {
    history.value.push(exchange)
  }

  function reset() {
    openingId.value = null
    userColor.value = 'white'
    currentMoveIndex.value = 0
    history.value = []
    phase.value = 'idle'
    if (hasSessionStorage) sessionStorage.removeItem(SESSION_KEY)
  }

  function clearRestoredFlag() {
    restoredFromSession.value = false
  }

  return {
    openingId,
    userColor,
    currentMoveIndex,
    history,
    phase,
    restoredFromSession,
    currentOpening,
    isUserTurn,
    expectedMove,
    isComplete,
    progress,
    startSession,
    advanceMove,
    setPhase,
    addExchange,
    reset,
    clearRestoredFlag,
  }
})
