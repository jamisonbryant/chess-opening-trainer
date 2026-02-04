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
  | 'idle'        // no session active
  | 'playing'     // waiting for user or auto-playing opponent move
  | 'explaining'  // user made wrong move, asking for explanation
  | 'evaluating'  // AI is generating response
  | 'complete'    // reached end of main line

export const useTrainingStore = defineStore('training', () => {
  const openingId = ref<string | null>(null)
  const currentMoveIndex = ref(0)
  const history = ref<TrainingExchange[]>([])
  const phase = ref<TrainingPhase>('idle')

  const currentOpening = computed<Opening | undefined>(() =>
    openingId.value ? getOpening(openingId.value) : undefined
  )

  const isUserTurn = computed(() => {
    const opening = currentOpening.value
    if (!opening) return false
    const moveIsWhite = currentMoveIndex.value % 2 === 0
    return opening.userColor === 'white' ? moveIsWhite : !moveIsWhite
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

  function startSession(id: string) {
    openingId.value = id
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
    currentMoveIndex.value = 0
    history.value = []
    phase.value = 'idle'
  }

  return {
    openingId,
    currentMoveIndex,
    history,
    phase,
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
  }
})
