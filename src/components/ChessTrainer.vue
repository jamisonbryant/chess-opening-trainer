<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { TheChessboard } from 'vue3-chessboard'
import 'vue3-chessboard/style.css'
import type { BoardApi, BoardConfig } from 'vue3-chessboard'
import { Chess } from 'chess.js'
import { useTrainingStore } from '../stores/training'
import { useSettingsStore } from '../stores/settings'
import { StockfishService } from '../services/stockfish'
import { AnthropicProvider } from '../services/ai/anthropic'
import { OllamaProvider } from '../services/ai/ollama'
import { buildEvaluationPrompt, type AiProvider } from '../services/ai'
import OpeningSelector from './OpeningSelector.vue'
import SettingsPanel from './SettingsPanel.vue'
import TrainingPanel from './TrainingPanel.vue'

const training = useTrainingStore()
const settings = useSettingsStore()

const boardAPI = ref<BoardApi>()
const chess = ref(new Chess())
const stockfish = ref<StockfishService>()
const messages = ref<Array<{ role: 'trainer' | 'user' | 'system'; text: string }>>([])
const pendingUserMove = ref<string | null>(null)

const boardConfig = ref<BoardConfig>({
  coordinates: true,
  animation: { enabled: true, duration: 300 },
})

function getAiProvider(): AiProvider {
  if (settings.aiProvider === 'anthropic') {
    return new AnthropicProvider(settings.anthropicApiKey)
  }
  return new OllamaProvider(settings.ollamaModel, settings.ollamaBaseUrl)
}

onMounted(async () => {
  stockfish.value = new StockfishService()
  try {
    await stockfish.value.init()
  } catch {
    messages.value.push({
      role: 'system',
      text: 'Stockfish failed to load. Engine analysis will be unavailable.',
    })
  }
})

onUnmounted(() => {
  stockfish.value?.destroy()
})

// Watch for session start -- reset board and play opening moves
watch(
  () => training.openingId,
  () => {
    if (!training.openingId) return
    chess.value = new Chess()
    messages.value = []
    boardAPI.value?.resetBoard()

    const opening = training.currentOpening!
    if (opening.userColor === 'black') {
      boardAPI.value?.toggleOrientation()
    }

    messages.value.push({
      role: 'trainer',
      text: `Let's study the ${opening.name}. You're playing as ${opening.userColor}. Make your moves on the board.`,
    })

    nextTick(() => playOpponentMovesIfNeeded())
  }
)

function playOpponentMovesIfNeeded() {
  if (training.isComplete || training.isUserTurn) return

  const move = training.expectedMove
  if (!move) return

  try {
    chess.value.move(move)
    boardAPI.value?.setPosition(chess.value.fen())
    const moveNum = Math.floor(training.currentMoveIndex / 2) + 1
    const dots = training.currentMoveIndex % 2 === 0 ? '.' : '...'
    messages.value.push({
      role: 'system',
      text: `Book move: ${moveNum}${dots}${move}`,
    })
    training.advanceMove()
    // Check if there are more opponent moves to play
    nextTick(() => playOpponentMovesIfNeeded())
  } catch {
    messages.value.push({ role: 'system', text: `Error playing book move: ${move}` })
  }
}

function handleMove(move: { san: string }) {
  if (training.phase !== 'playing' || !training.isUserTurn) return

  const expected = training.expectedMove
  if (!expected) return

  if (move.san === expected) {
    // Correct move
    training.advanceMove()
    training.addExchange({
      moveNumber: training.currentMoveIndex - 1,
      expectedMove: expected,
      userMove: move.san,
      userExplanation: '',
      wasCorrect: true,
      aiResponse: '',
    })
    messages.value.push({
      role: 'trainer',
      text: `Correct! ${move.san} is the main line move.`,
    })

    if (training.isComplete) return

    nextTick(() => playOpponentMovesIfNeeded())
  } else {
    // Wrong move -- ask for explanation
    pendingUserMove.value = move.san
    training.setPhase('explaining')
    messages.value.push({
      role: 'system',
      text: `You played ${move.san}. The book move is different.`,
    })
  }
}

async function handleExplanation(explanation: string) {
  if (!pendingUserMove.value || !training.expectedMove) return

  messages.value.push({ role: 'user', text: explanation })
  training.setPhase('evaluating')

  const fen = chess.value.fen()
  const bookMove = training.expectedMove
  const userMove = pendingUserMove.value

  let bookEval = 'N/A'
  let userEval = 'N/A'
  let evalDelta = 'Engine analysis unavailable.'

  // Evaluate both moves with Stockfish if available
  if (stockfish.value) {
    try {
      const tempChessBook = new Chess(fen)
      tempChessBook.move(bookMove)
      const bookCp = await stockfish.value.evaluate(tempChessBook.fen())

      const tempChessUser = new Chess(fen)
      tempChessUser.move(userMove)
      const userCp = await stockfish.value.evaluate(tempChessUser.fen())

      bookEval = stockfish.value.formatEval(bookCp)
      userEval = stockfish.value.formatEval(userCp)
      evalDelta = stockfish.value.describeEvalDelta(bookCp, userCp)
    } catch {
      // Eval failed, continue with N/A
    }
  }

  const prompt = buildEvaluationPrompt({
    openingName: training.currentOpening!.name,
    fen,
    moveNumber: Math.floor(training.currentMoveIndex / 2) + 1,
    bookMove,
    bookEval,
    userMove,
    userEval,
    evalDelta,
    userExplanation: explanation,
  })

  try {
    const provider = getAiProvider()
    const response = await provider.evaluate(prompt)

    messages.value.push({ role: 'trainer', text: response })

    training.addExchange({
      moveNumber: training.currentMoveIndex,
      expectedMove: bookMove,
      userMove,
      userExplanation: explanation,
      wasCorrect: false,
      aiResponse: response,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    messages.value.push({
      role: 'system',
      text: `AI error: ${message}. Check your settings.`,
    })
  }

  // Undo the wrong move on the chess.js instance and reset board
  chess.value.undo()
  boardAPI.value?.setPosition(chess.value.fen())

  pendingUserMove.value = null
  training.setPhase('playing')
}
</script>

<template>
  <div class="chess-trainer">
    <aside class="sidebar-left">
      <OpeningSelector />
      <SettingsPanel />
    </aside>

    <main class="board-area">
      <div v-if="training.currentOpening" class="board-header">
        <h1>{{ training.currentOpening.name }}</h1>
        <span>Move {{ Math.floor(training.currentMoveIndex / 2) + 1 }}</span>
      </div>
      <div v-else class="board-header">
        <h1>Chess Opening Trainer</h1>
        <span>Select an opening to begin</span>
      </div>
      <TheChessboard
        :board-config="boardConfig"
        @board-created="(api) => (boardAPI = api)"
        @move="handleMove"
      />
    </main>

    <aside class="sidebar-right">
      <TrainingPanel
        v-model:messages="messages"
        @submit-explanation="handleExplanation"
      />
    </aside>
  </div>
</template>
