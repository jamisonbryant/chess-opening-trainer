/**
 * Demo orchestrator for recording GIFs / videos of the app.
 * Only loaded in dev mode (gated by import.meta.env.DEV in ChessTrainer.vue).
 *
 * Usage (from Chrome DevTools or MCP evaluate_script):
 *   window.__demo.runDemo()
 */

import type { Ref } from 'vue'
import type { BoardApi } from 'vue3-chessboard'

interface ChessLike {
  undo(): unknown
  fen(): string
}

const TYPING_DELAY = 45 // ms per character
const MOVE_PAUSE = 600 // pause between piece select and move execution
const STEP_PAUSE = 1200 // pause between major steps

const FAKE_AI_RESPONSE = `Great thinking -- you're right that Bb5 develops the bishop actively and creates pressure on the knight. That's exactly the idea behind the **Ruy Lopez** (or Spanish Game), which is a fantastic opening in its own right.

However, in the **Italian Game**, the book move here is **Bc4**. While both moves develop the bishop, Bc4 takes a fundamentally different strategic approach: it targets the f7 pawn, which is the weakest point in Black's position (only defended by the king). This creates immediate tactical pressure and opens up possibilities for quick attacks.

The key distinction: Bb5 puts *positional* pressure on the knight, while Bc4 creates *tactical* threats against f7. In the Italian Game, that direct central aggression is the guiding principle.`

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}


async function simulateTyping(selector: string, text: string) {
  const el = document.querySelector(selector) as HTMLTextAreaElement | HTMLInputElement
  if (!el) return
  el.focus()
  el.value = ''
  el.dispatchEvent(new Event('input', { bubbles: true }))

  for (const char of text) {
    el.value += char
    el.dispatchEvent(new Event('input', { bubbles: true }))
    await sleep(TYPING_DELAY)
  }
}

export function installDemoRunner(
  messagesRef: Ref<Array<{ role: string; text: string }>>,
  _handleMoveFn: (move: { san: string }) => void,
  trainingStore: any,
  chessRef: Ref<ChessLike>,
  boardAPIRef: Ref<BoardApi | undefined>,
) {
  const demo = (window as any).__demo
  if (!demo) return

  /**
   * Visually select a piece on its source square (shows legal move indicators),
   * pause, then execute the move programmatically via makeMove.
   */
  async function demoMove(from: string, san: string) {
    // Use chessground's native selectSquare for proper move-dest dots
    const cg = (boardAPIRef.value as any)?.board
    if (cg) cg.selectSquare(from)
    await sleep(MOVE_PAUSE)
    demo.makeMove(san)
  }

  demo.runDemo = async () => {
    console.log('[demo] Starting demo sequence...')

    // --- Step 1: Type "Italian" in search ---
    console.log('[demo] Typing search query...')
    await simulateTyping('.typeahead input', 'Italian')
    await sleep(STEP_PAUSE)

    // --- Step 2: Click "Italian Game" in dropdown ---
    console.log('[demo] Selecting Italian Game...')
    const items = document.querySelectorAll('.dropdown-item .item-name')
    for (const item of items) {
      if (item.textContent?.trim() === 'Italian Game') {
        ;(item.closest('.dropdown-item') as HTMLElement)?.dispatchEvent(
          new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
        )
        break
      }
    }
    await sleep(STEP_PAUSE)

    // --- Step 3: Click "White" button ---
    console.log('[demo] Selecting White...')
    const whiteBtn = Array.from(document.querySelectorAll('.color-btn')).find(
      (b) => b.textContent?.includes('White'),
    ) as HTMLElement | undefined
    whiteBtn?.click()
    await sleep(STEP_PAUSE / 2)

    // --- Step 4: Click "Start Training" ---
    console.log('[demo] Starting training...')
    const startBtn = document.querySelector('.start-btn') as HTMLElement
    startBtn?.click()
    await sleep(STEP_PAUSE)

    // --- Step 5: Play 1. e4 (select e2 pawn, then move) ---
    console.log('[demo] Playing 1. e4...')
    await demoMove('e2', 'e4')
    await sleep(STEP_PAUSE * 1.5) // opponent auto-plays 1...e5

    // --- Step 6: Play 2. Nf3 (select g1 knight, then move) ---
    console.log('[demo] Playing 2. Nf3...')
    await demoMove('g1', 'Nf3')
    await sleep(STEP_PAUSE * 1.5) // opponent auto-plays 2...Nc6

    // --- Step 7: Play WRONG move 3. Bb5 (select f1 bishop, then move) ---
    console.log('[demo] Playing wrong move 3. Bb5...')
    await demoMove('f1', 'Bb5')
    await sleep(STEP_PAUSE)

    // --- Step 8: Type explanation ---
    console.log('[demo] Typing explanation...')
    await simulateTyping(
      '.input-area textarea',
      'I wanted to pin the knight to the king and put pressure on the center.',
    )
    await sleep(STEP_PAUSE / 2)

    // --- Step 9: Fake the submit + AI response ---
    console.log('[demo] Submitting explanation (faked AI response)...')

    messagesRef.value.push({
      role: 'user',
      text: 'I wanted to put pressure on the knight and possibly pin it to the king. Bb5 develops the bishop actively and enters the Ruy Lopez instead.',
    })
    trainingStore.setPhase('evaluating')
    await sleep(2000) // simulate "thinking"

    messagesRef.value.push({ role: 'trainer', text: FAKE_AI_RESPONSE })

    trainingStore.addExchange({
      moveNumber: trainingStore.currentMoveIndex,
      expectedMove: 'Bc4',
      userMove: 'Bb5',
      userExplanation: 'I wanted to pin the knight to the king and put pressure on the center.',
      wasCorrect: false,
      aiResponse: FAKE_AI_RESPONSE,
    })

    // Undo the wrong move and resume
    chessRef.value.undo()
    boardAPIRef.value?.setPosition(chessRef.value.fen())
    ;(boardAPIRef.value as any)?.board?.selectSquare(null)
    trainingStore.setPhase('playing')

    await sleep(3000) // let viewer read the AI response

    console.log('[demo] Demo complete!')
  }
}
