# Chess Opening Trainer — Design Document

## Purpose

A client-side chess opening trainer that helps users learn canonical opening lines through interactive play, with AI-powered feedback that addresses the user's reasoning — not just move correctness.

## Tech Stack

- **Frontend**: Vue 3 + Vite
- **Chess board**: `vue3-chessboard` (Chessground wrapper)
- **Chess logic**: `chess.js` for move validation and game state
- **Engine**: Stockfish WASM (`stockfish.js`) for position evaluation
- **Opening data**: Hardcoded main lines (sourced from Lichess opening explorer), live fetching deferred to future work
- **AI layer**: Abstracted provider interface supporting Anthropic (Claude) and Ollama
- **Backend**: None — fully client-side SPA. API keys in localStorage. Ollama accessed via its local HTTP API.

## Openings (Initial Set)

| Opening | Main Line Starts | User Color |
|---------|-----------------|------------|
| Scotch Game | 1.e4 e5 2.Nf3 Nc6 3.d4 | White |
| Italian Game | 1.e4 e5 2.Nf3 Nc6 3.Bc4 | White |
| Sicilian Defense: Open | 1.e4 c5 2.Nf3 d6 3.d4 | Black |

## Training Flow

1. User selects an opening from the available set.
2. Board starts at the initial position.
3. If it is the opponent's turn, the app auto-plays the book move with a label (e.g. "Book move: 2...Nc6").
4. If it is the user's turn, the board waits for input.
5. User makes a move on the board.
6. The app evaluates the move:
   - **Correct (book move)**: Positive reinforcement, brief explanation of why it's the main line move, advance to next position.
   - **Incorrect**: The app asks "Why did you make that move?" via a text input.
7. User explains their reasoning.
8. The AI responds with a structured evaluation:
   - What the engine thinks of the move (Stockfish eval delta, translated to plain language).
   - What the book move was and why it's preferred.
   - A response to the user's specific reasoning — correcting misconceptions or affirming partial understanding.
9. Board resets to the position before the wrong move. User tries again.
10. Repeat until the user completes the full main line of the opening.

## UI Layout

Single-page layout with three regions:

- **Left sidebar**: Opening selector (dropdown or cards), progress indicator showing position in main line, settings (AI provider toggle, API key/model inputs).
- **Center**: Chessboard filling the majority of the viewport. Current move number and opening name displayed above the board.
- **Right sidebar**: Chat-style training panel with scrolling feed showing trainer prompts, user reasoning input (text box at bottom), AI evaluations, and move history.
- **Mobile**: Stacked vertically — board on top, chat panel below, opening selector in hamburger menu.

## AI Prompt Design

### System Prompt

"You are a chess opening trainer. You receive a position (FEN), the book move, the user's move, the Stockfish evaluation of both moves, and the user's explanation of their reasoning. Your job is to teach, not just correct. Address the user's specific reasoning. Be concise — 2-3 paragraphs max."

### User Message (constructed by the app)

Includes: FEN, opening name, move number, book move + eval, user's move + eval, user's explanation.

### Design Principle

The AI never sees raw engine output. The app translates Stockfish centipawn scores into plain language ("Your move loses 1.5 pawns of advantage") before passing to the model. Stockfish does the analysis, the AI does the pedagogy.

### Provider Abstraction

A simple interface with an `evaluate(prompt)` method and two implementations:
- **Anthropic**: Uses Claude API via HTTP
- **Ollama**: Uses local Ollama HTTP API (default: `localhost:11434`)

Reactive setting switches between them.

## Data Model

No database. In-memory state with localStorage for settings.

```
Opening {
  id: string           // "scotch", "italian", "sicilian-open"
  name: string         // "Scotch Game"
  mainLine: string[]   // ["e4", "e5", "Nf3", "Nc6", "d4", ...]
  userColor: "white" | "black"
}

TrainingSession {
  openingId: string
  currentMoveIndex: number
  history: TrainingExchange[]
}

TrainingExchange {
  moveNumber: number
  expectedMove: string
  userMove: string
  userExplanation: string
  wasCorrect: boolean
  aiResponse: string
}

Settings {
  aiProvider: "anthropic" | "ollama"
  anthropicApiKey: string
  ollamaModel: string
  ollamaBaseUrl: string   // defaults to localhost:11434
}
```

## Future Work

- Live fetching from Lichess opening explorer API for arbitrary openings
- Spaced repetition (track which positions the user gets wrong and revisit them)
- Support for sub-variations / sidelines beyond the single main line
- Opening repertoire builder (combine multiple openings into a study plan)
