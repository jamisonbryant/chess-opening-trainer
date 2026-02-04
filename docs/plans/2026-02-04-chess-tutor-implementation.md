# Chess Opening Trainer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a client-side Vue 3 chess opening trainer that teaches users canonical opening lines through interactive play with AI-powered feedback addressing user reasoning.

**Architecture:** Single-page Vue 3 + Vite app. Chessboard via `vue3-chessboard`, game logic via `chess.js`, position evaluation via Stockfish WASM in a web worker, AI feedback via swappable Anthropic/Ollama providers. No backend — all client-side with localStorage for settings.

**Tech Stack:** Vue 3, Vite, TypeScript, vue3-chessboard, chess.js, stockfish (npm), Anthropic API, Ollama HTTP API

---

### Task 1: Scaffold Vue 3 + Vite project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.ts`, `src/App.vue`, `index.html`

**Step 1: Create the Vite project**

Run:
```bash
cd /Users/jamisonbryant/Code/experiments/chess-tutor
npm create vite@latest . -- --template vue-ts
```

Expected: Project scaffolded with Vue 3 + TypeScript template.

**Step 2: Install dependencies**

Run:
```bash
npm install
npm install vue3-chessboard chess.js stockfish
```

Expected: All packages installed successfully.

**Step 3: Verify dev server starts**

Run:
```bash
npm run dev
```

Expected: Vite dev server starts, displays local URL.

**Step 4: Initialize git and commit**

Run:
```bash
git init
git add -A
git commit -m "scaffold Vue 3 + Vite project with chess dependencies"
```

---

### Task 2: Opening data module

**Files:**
- Create: `src/data/openings.ts`
- Test: `src/data/__tests__/openings.test.ts`

**Step 1: Install Vitest**

Run:
```bash
npm install -D vitest
```

Add to `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`

**Step 2: Write the failing test**

```typescript
// src/data/__tests__/openings.test.ts
import { describe, it, expect } from 'vitest'
import { openings, getOpening } from '../openings'

describe('openings', () => {
  it('contains three openings', () => {
    expect(openings).toHaveLength(3)
  })

  it('each opening has required fields', () => {
    for (const opening of openings) {
      expect(opening.id).toBeTruthy()
      expect(opening.name).toBeTruthy()
      expect(opening.mainLine.length).toBeGreaterThan(4)
      expect(['white', 'black']).toContain(opening.userColor)
    }
  })

  it('getOpening returns correct opening by id', () => {
    const scotch = getOpening('scotch')
    expect(scotch?.name).toBe('Scotch Game')
  })

  it('getOpening returns undefined for unknown id', () => {
    expect(getOpening('unknown')).toBeUndefined()
  })

  it('Scotch Game main line is valid', () => {
    const scotch = getOpening('scotch')!
    expect(scotch.mainLine[0]).toBe('e4')
    expect(scotch.mainLine[1]).toBe('e5')
    expect(scotch.mainLine[2]).toBe('Nf3')
    expect(scotch.mainLine[3]).toBe('Nc6')
    expect(scotch.mainLine[4]).toBe('d4')
    expect(scotch.userColor).toBe('white')
  })
})
```

**Step 3: Run test to verify it fails**

Run: `npx vitest run src/data/__tests__/openings.test.ts`
Expected: FAIL — module not found.

**Step 4: Write the openings module**

```typescript
// src/data/openings.ts
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
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run src/data/__tests__/openings.test.ts`
Expected: All tests PASS.

**Step 6: Commit**

```bash
git add src/data/openings.ts src/data/__tests__/openings.test.ts package.json
git commit -m "add opening data module with three openings"
```

---

### Task 3: Stockfish engine service

**Files:**
- Create: `src/services/stockfish.ts`
- Create: `src/services/__tests__/stockfish.test.ts`

**Step 1: Write the failing test**

```typescript
// src/services/__tests__/stockfish.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StockfishService } from '../stockfish'

describe('StockfishService', () => {
  it('formats evaluation as human-readable text', () => {
    const service = new StockfishService()
    expect(service.formatEval(150)).toBe('+1.50 pawns (White is better)')
    expect(service.formatEval(-80)).toBe('-0.80 pawns (Black is better)')
    expect(service.formatEval(15)).toBe('+0.15 pawns (roughly equal)')
    expect(service.formatEval(0)).toBe('0.00 pawns (roughly equal)')
  })

  it('calculates eval delta description', () => {
    const service = new StockfishService()
    expect(service.describeEvalDelta(50, -100)).toBe(
      'Your move loses about 1.50 pawns of advantage.'
    )
    expect(service.describeEvalDelta(50, 55)).toBe(
      'Your move is roughly as good as the book move.'
    )
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/__tests__/stockfish.test.ts`
Expected: FAIL — module not found.

**Step 3: Write the Stockfish service**

```typescript
// src/services/stockfish.ts
const EQUAL_THRESHOLD = 30 // centipawns — within this range, moves are "roughly equal"

export class StockfishService {
  private worker: Worker | null = null
  private ready = false
  private messageQueue: Array<(line: string) => void> = []

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // stockfish npm package exposes a WASM worker
        this.worker = new Worker(
          new URL('../../node_modules/stockfish/src/stockfish-nnue-16-single.js', import.meta.url),
          { type: 'classic' }
        )
        this.worker.onmessage = (e: MessageEvent) => {
          const line = typeof e.data === 'string' ? e.data : ''
          if (line === 'uciok') {
            this.ready = true
            resolve()
          }
          for (const listener of this.messageQueue) {
            listener(line)
          }
        }
        this.worker.onerror = (e) => reject(e)
        this.worker.postMessage('uci')
      } catch (e) {
        reject(e)
      }
    })
  }

  async evaluate(fen: string, depth = 15): Promise<number> {
    if (!this.worker) throw new Error('Stockfish not initialized')

    return new Promise((resolve) => {
      const listener = (line: string) => {
        if (line.startsWith(`info depth ${depth} `) && line.includes(' score cp ')) {
          const match = line.match(/score cp (-?\d+)/)
          if (match) {
            this.messageQueue = this.messageQueue.filter((l) => l !== listener)
            this.worker!.postMessage('stop')
            resolve(parseInt(match[1], 10))
          }
        }
        // Handle mate scores
        if (line.startsWith(`info depth ${depth} `) && line.includes(' score mate ')) {
          const match = line.match(/score mate (-?\d+)/)
          if (match) {
            this.messageQueue = this.messageQueue.filter((l) => l !== listener)
            this.worker!.postMessage('stop')
            const mateIn = parseInt(match[1], 10)
            resolve(mateIn > 0 ? 10000 : -10000)
          }
        }
      }
      this.messageQueue.push(listener)
      this.worker!.postMessage(`position fen ${fen}`)
      this.worker!.postMessage(`go depth ${depth}`)
    })
  }

  formatEval(centipawns: number): string {
    const pawns = (centipawns / 100).toFixed(2)
    const sign = centipawns >= 0 ? '+' : ''
    let assessment: string
    if (Math.abs(centipawns) <= EQUAL_THRESHOLD) {
      assessment = 'roughly equal'
    } else if (centipawns > 0) {
      assessment = 'White is better'
    } else {
      assessment = 'Black is better'
    }
    return `${sign}${pawns} pawns (${assessment})`
  }

  describeEvalDelta(bookEvalCp: number, userEvalCp: number): string {
    const delta = Math.abs(bookEvalCp - userEvalCp)
    if (delta <= EQUAL_THRESHOLD) {
      return 'Your move is roughly as good as the book move.'
    }
    const lost = (delta / 100).toFixed(2)
    return `Your move loses about ${lost} pawns of advantage.`
  }

  destroy(): void {
    this.worker?.terminate()
    this.worker = null
    this.ready = false
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/services/__tests__/stockfish.test.ts`
Expected: Synchronous tests PASS. (The async `init`/`evaluate` methods require a browser environment with WASM — they are integration-tested manually or via Playwright later.)

**Step 5: Commit**

```bash
git add src/services/stockfish.ts src/services/__tests__/stockfish.test.ts
git commit -m "add Stockfish service with eval formatting and WASM worker integration"
```

---

### Task 4: AI provider abstraction

**Files:**
- Create: `src/services/ai/types.ts`
- Create: `src/services/ai/anthropic.ts`
- Create: `src/services/ai/ollama.ts`
- Create: `src/services/ai/index.ts`
- Create: `src/services/ai/__tests__/prompt.test.ts`

**Step 1: Write the failing test**

```typescript
// src/services/ai/__tests__/prompt.test.ts
import { describe, it, expect } from 'vitest'
import { buildEvaluationPrompt, SYSTEM_PROMPT } from '../types'

describe('AI prompt building', () => {
  it('system prompt instructs the AI to teach', () => {
    expect(SYSTEM_PROMPT).toContain('chess opening trainer')
    expect(SYSTEM_PROMPT).toContain('teach')
  })

  it('builds a structured evaluation prompt', () => {
    const prompt = buildEvaluationPrompt({
      openingName: 'Scotch Game',
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      moveNumber: 3,
      bookMove: 'd4',
      bookEval: '+0.30 pawns (roughly equal)',
      userMove: 'Bc4',
      userEval: '+0.25 pawns (roughly equal)',
      evalDelta: 'Your move is roughly as good as the book move.',
      userExplanation: 'I wanted to develop my bishop to target f7.',
    })

    expect(prompt).toContain('Scotch Game')
    expect(prompt).toContain('d4')
    expect(prompt).toContain('Bc4')
    expect(prompt).toContain('develop my bishop')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/ai/__tests__/prompt.test.ts`
Expected: FAIL — module not found.

**Step 3: Write the types and prompt builder**

```typescript
// src/services/ai/types.ts
export const SYSTEM_PROMPT = `You are a chess opening trainer. You receive a position (FEN), the book move, the user's move, the Stockfish evaluation of both moves (translated to plain language), and the user's explanation of their reasoning.

Your job is to teach, not just correct. Address the user's specific reasoning — explain what their thinking got right and where it went wrong. Explain why the book move is preferred in terms of opening principles (development, center control, king safety, piece activity).

Be concise — 2-3 paragraphs max. Be encouraging but honest.`

export interface EvaluationContext {
  openingName: string
  fen: string
  moveNumber: number
  bookMove: string
  bookEval: string
  userMove: string
  userEval: string
  evalDelta: string
  userExplanation: string
}

export function buildEvaluationPrompt(ctx: EvaluationContext): string {
  return `Opening: ${ctx.openingName}
Position (FEN): ${ctx.fen}
Move number: ${ctx.moveNumber}

Book move: ${ctx.bookMove} (eval: ${ctx.bookEval})
User's move: ${ctx.userMove} (eval: ${ctx.userEval})
Comparison: ${ctx.evalDelta}

User's explanation: "${ctx.userExplanation}"

Please evaluate the user's move and reasoning. Explain why the book move is the main line choice, and address the user's stated reasoning directly.`
}

export interface AiProvider {
  evaluate(userPrompt: string): Promise<string>
}
```

**Step 4: Write the Anthropic provider**

```typescript
// src/services/ai/anthropic.ts
import { type AiProvider, SYSTEM_PROMPT } from './types'

export class AnthropicProvider implements AiProvider {
  constructor(private apiKey: string) {}

  async evaluate(userPrompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Anthropic API error: ${response.status} ${err}`)
    }

    const data = await response.json()
    return data.content[0].text
  }
}
```

**Step 5: Write the Ollama provider**

```typescript
// src/services/ai/ollama.ts
import { type AiProvider, SYSTEM_PROMPT } from './types'

export class OllamaProvider implements AiProvider {
  constructor(
    private model: string = 'llama3.2',
    private baseUrl: string = 'http://localhost:11434',
  ) {}

  async evaluate(userPrompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Ollama API error: ${response.status} ${err}`)
    }

    const data = await response.json()
    return data.message.content
  }
}
```

**Step 6: Write the index barrel**

```typescript
// src/services/ai/index.ts
export { AnthropicProvider } from './anthropic'
export { OllamaProvider } from './ollama'
export { buildEvaluationPrompt, SYSTEM_PROMPT } from './types'
export type { AiProvider, EvaluationContext } from './types'
```

**Step 7: Run test to verify it passes**

Run: `npx vitest run src/services/ai/__tests__/prompt.test.ts`
Expected: All tests PASS.

**Step 8: Commit**

```bash
git add src/services/ai/
git commit -m "add AI provider abstraction with Anthropic and Ollama implementations"
```

---

### Task 5: Settings store (Pinia)

**Files:**
- Create: `src/stores/settings.ts`

**Step 1: Install Pinia**

Run:
```bash
npm install pinia
```

**Step 2: Write the settings store**

```typescript
// src/stores/settings.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type AiProviderType = 'anthropic' | 'ollama'

export const useSettingsStore = defineStore('settings', () => {
  const aiProvider = ref<AiProviderType>(
    (localStorage.getItem('aiProvider') as AiProviderType) || 'anthropic'
  )
  const anthropicApiKey = ref(localStorage.getItem('anthropicApiKey') || '')
  const ollamaModel = ref(localStorage.getItem('ollamaModel') || 'llama3.2')
  const ollamaBaseUrl = ref(
    localStorage.getItem('ollamaBaseUrl') || 'http://localhost:11434'
  )

  watch(aiProvider, (v) => localStorage.setItem('aiProvider', v))
  watch(anthropicApiKey, (v) => localStorage.setItem('anthropicApiKey', v))
  watch(ollamaModel, (v) => localStorage.setItem('ollamaModel', v))
  watch(ollamaBaseUrl, (v) => localStorage.setItem('ollamaBaseUrl', v))

  return { aiProvider, anthropicApiKey, ollamaModel, ollamaBaseUrl }
})
```

**Step 3: Register Pinia in main.ts**

In `src/main.ts`, add:

```typescript
import { createPinia } from 'pinia'
// ... existing app creation
app.use(createPinia())
```

**Step 4: Commit**

```bash
git add src/stores/settings.ts src/main.ts package.json
git commit -m "add Pinia settings store with localStorage persistence"
```

---

### Task 6: Training session store

**Files:**
- Create: `src/stores/training.ts`
- Test: `src/stores/__tests__/training.test.ts`

**Step 1: Write the failing test**

```typescript
// src/stores/__tests__/training.test.ts
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
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/__tests__/training.test.ts`
Expected: FAIL — module not found.

**Step 3: Write the training store**

```typescript
// src/stores/training.ts
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
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/stores/__tests__/training.test.ts`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/stores/training.ts src/stores/__tests__/training.test.ts
git commit -m "add training session store with phase tracking and progress"
```

---

### Task 7: App layout and chessboard component

**Files:**
- Modify: `src/App.vue`
- Create: `src/components/ChessTrainer.vue`
- Create: `src/components/OpeningSelector.vue`
- Create: `src/components/TrainingPanel.vue`

**Step 1: Write the OpeningSelector component**

```vue
<!-- src/components/OpeningSelector.vue -->
<script setup lang="ts">
import { openings } from '../data/openings'
import { useTrainingStore } from '../stores/training'

const training = useTrainingStore()
</script>

<template>
  <div class="opening-selector">
    <h2>Openings</h2>
    <div
      v-for="opening in openings"
      :key="opening.id"
      class="opening-card"
      :class="{ active: training.openingId === opening.id }"
      @click="training.startSession(opening.id)"
    >
      <h3>{{ opening.name }}</h3>
      <p>{{ opening.description }}</p>
      <span class="color-badge">Play as {{ opening.userColor }}</span>
    </div>

    <div v-if="training.openingId" class="progress-section">
      <h3>Progress</h3>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${training.progress * 100}%` }"
        />
      </div>
      <p>Move {{ training.currentMoveIndex }} / {{ training.currentOpening?.mainLine.length }}</p>
    </div>
  </div>
</template>
```

**Step 2: Write the TrainingPanel component**

```vue
<!-- src/components/TrainingPanel.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useTrainingStore } from '../stores/training'

const training = useTrainingStore()
const userExplanation = ref('')

interface Message {
  role: 'trainer' | 'user' | 'system'
  text: string
}

const messages = defineModel<Message[]>('messages', { default: () => [] })

const emit = defineEmits<{
  (e: 'submit-explanation', explanation: string): void
}>()

function submitExplanation() {
  if (!userExplanation.value.trim()) return
  emit('submit-explanation', userExplanation.value.trim())
  userExplanation.value = ''
}
</script>

<template>
  <div class="training-panel">
    <h2>Trainer</h2>

    <div class="messages">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="message"
        :class="msg.role"
      >
        <div class="message-content">{{ msg.text }}</div>
      </div>
    </div>

    <div v-if="training.phase === 'explaining'" class="input-area">
      <p class="prompt">Why did you make that move?</p>
      <textarea
        v-model="userExplanation"
        placeholder="Explain your reasoning..."
        @keydown.ctrl.enter="submitExplanation"
      />
      <button @click="submitExplanation" :disabled="!userExplanation.trim()">
        Submit
      </button>
    </div>

    <div v-if="training.phase === 'evaluating'" class="loading">
      Analyzing your move...
    </div>

    <div v-if="training.phase === 'complete'" class="complete">
      <h3>Opening complete!</h3>
      <p>You've finished the {{ training.currentOpening?.name }} main line.</p>
      <button @click="training.startSession(training.openingId!)">
        Try again
      </button>
    </div>
  </div>
</template>
```

**Step 3: Write the ChessTrainer component (orchestrator)**

```vue
<!-- src/components/ChessTrainer.vue -->
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
  } catch (e) {
    messages.value.push({
      role: 'system',
      text: 'Stockfish failed to load. Engine analysis will be unavailable.',
    })
  }
})

onUnmounted(() => {
  stockfish.value?.destroy()
})

// Watch for session start — reset board and play opening moves
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
  } catch (e) {
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
    // Wrong move — ask for explanation
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
  } catch (e: any) {
    messages.value.push({
      role: 'system',
      text: `AI error: ${e.message}. Check your settings.`,
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
```

**Step 4: Update App.vue**

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import ChessTrainer from './components/ChessTrainer.vue'
</script>

<template>
  <ChessTrainer />
</template>
```

**Step 5: Verify it compiles**

Run: `npm run dev`
Expected: Dev server starts without compilation errors.

**Step 6: Commit**

```bash
git add src/components/ src/App.vue
git commit -m "add chess trainer UI with board, opening selector, and training panel"
```

---

### Task 8: Settings panel component

**Files:**
- Create: `src/components/SettingsPanel.vue`
- Modify: `src/components/ChessTrainer.vue` (add settings toggle)

**Step 1: Write the SettingsPanel component**

```vue
<!-- src/components/SettingsPanel.vue -->
<script setup lang="ts">
import { useSettingsStore } from '../stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <div class="settings-panel">
    <h3>Settings</h3>

    <div class="field">
      <label>AI Provider</label>
      <select v-model="settings.aiProvider">
        <option value="anthropic">Anthropic (Claude)</option>
        <option value="ollama">Ollama (Local)</option>
      </select>
    </div>

    <div v-if="settings.aiProvider === 'anthropic'" class="field">
      <label>Anthropic API Key</label>
      <input
        v-model="settings.anthropicApiKey"
        type="password"
        placeholder="sk-ant-..."
      />
    </div>

    <div v-if="settings.aiProvider === 'ollama'">
      <div class="field">
        <label>Model</label>
        <input v-model="settings.ollamaModel" placeholder="llama3.2" />
      </div>
      <div class="field">
        <label>Base URL</label>
        <input
          v-model="settings.ollamaBaseUrl"
          placeholder="http://localhost:11434"
        />
      </div>
    </div>
  </div>
</template>
```

**Step 2: Add settings to the left sidebar in ChessTrainer.vue**

In the `<aside class="sidebar-left">` section, add below `<OpeningSelector />`:

```vue
<SettingsPanel />
```

And import it in the script:

```typescript
import SettingsPanel from './SettingsPanel.vue'
```

**Step 3: Verify it compiles**

Run: `npm run dev`
Expected: Dev server starts, settings panel visible in sidebar.

**Step 4: Commit**

```bash
git add src/components/SettingsPanel.vue src/components/ChessTrainer.vue
git commit -m "add settings panel for AI provider configuration"
```

---

### Task 9: CSS styling

**Files:**
- Create: `src/assets/main.css`
- Modify: `src/main.ts` (import CSS)

**Step 1: Write the stylesheet**

Create `src/assets/main.css` with the full layout styles:

- CSS custom properties for theming (dark chess-app feel)
- `.chess-trainer` grid layout: `grid-template-columns: 280px 1fr 360px`
- `.sidebar-left`, `.board-area`, `.sidebar-right` styling
- `.opening-card` with hover/active states
- `.progress-bar` with fill animation
- `.messages` scrolling container with message bubbles
- `.message.trainer`, `.message.user`, `.message.system` distinct colors
- `.input-area` textarea and submit button
- `.settings-panel` form fields
- Responsive: `@media (max-width: 1024px)` stacks to single column

**Step 2: Import in main.ts**

Add to `src/main.ts`:

```typescript
import './assets/main.css'
```

**Step 3: Visual check**

Run `npm run dev`, open in browser, verify layout.

**Step 4: Commit**

```bash
git add src/assets/main.css src/main.ts
git commit -m "add application styles with responsive layout"
```

---

### Task 10: Integration testing and polish

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All unit tests pass.

**Step 2: Manual integration test**

Open `npm run dev` in browser and walk through:
1. Select "Scotch Game"
2. Board appears, oriented as white
3. Make the correct first move (e4) — positive feedback
4. Opponent auto-plays e5
5. Make a wrong move — app asks "Why did you make that move?"
6. Submit explanation — AI responds with evaluation
7. Board resets to pre-mistake position
8. Make the correct move — continue

**Step 3: Fix any issues found during manual testing**

Address compilation errors, move handling bugs, or UI issues discovered.

**Step 4: Final commit**

```bash
git add -A
git commit -m "integration testing and polish"
```
