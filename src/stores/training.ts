import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
  | 'idle'            // no session active
  | 'playing'         // waiting for user or auto-playing opponent move
  | 'explaining'      // user made wrong move, asking for explanation
  | 'evaluating'      // AI is generating response
  | 'reflecting'      // session done, trainer asked for thoughts, waiting for user
  | 'reflecting-eval' // AI is generating reflection response
  | 'complete'        // reached end of main line, reflection done

export type UserColor = 'white' | 'black'

interface QueryParamState {
  openingId: string
  moveIndex: number
  userColor: UserColor
}

const hasBrowserApi = typeof window !== 'undefined' && typeof window.location !== 'undefined'

function readQueryParams(): QueryParamState | null {
  if (!hasBrowserApi) return null
  const params = new URLSearchParams(window.location.search)
  const opening = params.get('op')
  const move = params.get('mv')
  const color = params.get('c')

  if (!opening) return null

  const openingData = getOpening(opening)
  if (!openingData) return null

  const moveIndex = move !== null ? parseInt(move, 10) : 0
  if (isNaN(moveIndex) || moveIndex < 0) return null

  const clampedMove = Math.min(moveIndex, openingData.mainLine.length)
  const validColor: UserColor = color === 'black' ? 'black' : 'white'

  return { openingId: opening, moveIndex: clampedMove, userColor: validColor }
}

function writeQueryParams(openingId: string, moveIndex: number, userColor: UserColor) {
  if (!hasBrowserApi) return
  const params = new URLSearchParams()
  params.set('op', openingId)
  params.set('mv', String(moveIndex))
  params.set('c', userColor)
  const url = `${window.location.pathname}?${params.toString()}`
  window.history.replaceState({}, '', url)
}

export const useTrainingStore = defineStore('training', () => {
  const urlState = readQueryParams()

  const openingId = ref<string | null>(urlState?.openingId ?? null)
  const userColor = ref<UserColor>(urlState?.userColor ?? 'white')
  const currentMoveIndex = ref(urlState?.moveIndex ?? 0)
  const history = ref<TrainingExchange[]>([])
  const phase = ref<TrainingPhase>(urlState ? 'playing' : 'idle')
  const restoredFromUrl = ref(urlState !== null)

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

  function syncQueryParams(moveOverride?: number) {
    if (!openingId.value) return
    const move = moveOverride ?? currentMoveIndex.value
    writeQueryParams(openingId.value, move, userColor.value)
  }

  function startSession(id: string, color: UserColor) {
    openingId.value = id
    userColor.value = color
    currentMoveIndex.value = 0
    history.value = []
    phase.value = 'playing'
    syncQueryParams()
  }

  function advanceMove() {
    currentMoveIndex.value++
    if (isComplete.value) {
      phase.value = 'reflecting'
    }
    syncQueryParams()
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
    if (hasBrowserApi) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  function clearRestoredFlag() {
    restoredFromUrl.value = false
  }

  return {
    openingId,
    userColor,
    currentMoveIndex,
    history,
    phase,
    restoredFromUrl,
    currentOpening,
    isUserTurn,
    expectedMove,
    isComplete,
    progress,
    syncQueryParams,
    startSession,
    advanceMove,
    setPhase,
    addExchange,
    reset,
    clearRestoredFlag,
  }
})
