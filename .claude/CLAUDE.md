# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chess Opening Trainer -- a Vue 3 + TypeScript web app that teaches chess opening theory through interactive practice. Users play through opening lines on a board; incorrect moves trigger an AI coaching flow where the user explains their reasoning and receives feedback informed by Stockfish engine analysis.

## Commands

```bash
npm run dev          # Vite dev server with HMR
npm run build        # Type-check (vue-tsc) then Vite production build
npm run preview      # Serve production build locally (port 4173)
npm test             # Run vitest once
npm run test:watch   # Run vitest in watch mode
npx vitest run src/data/__tests__/openings.test.ts   # Run a single test file
```

## Architecture

### Component Hierarchy

`App.vue` renders `ChessTrainer.vue`, which owns the training session lifecycle and composes three areas: `OpeningSelector` (left sidebar), the chessboard (center), and `TrainingPanel` (right sidebar chat). `SettingsPanel` lives in the top nav.

### Training Loop (ChessTrainer.vue)

The session progresses through phases managed by `useTrainingStore`: idle -> playing -> explaining -> evaluating -> back to playing (or complete). On a wrong move:

1. Stockfish evaluates both the book move and user's move (depth 15)
2. User types an explanation of their reasoning
3. AI provider receives: opening context, FEN, both evaluations, user's explanation
4. AI response renders as markdown in the chat panel
5. Board undoes the wrong move, play resumes

Opponent moves auto-play when it's not the user's turn.

### State Management (Pinia)

- **useTrainingStore** (`src/stores/training.ts`) -- session phase, current opening, move index, move history (TrainingExchange[])
- **useSettingsStore** (`src/stores/settings.ts`) -- AI provider selection and credentials, synced to localStorage

### AI Provider Abstraction (src/services/ai/)

`AiProvider` interface with two implementations: `AnthropicProvider` (Claude API, direct browser CORS) and `OllamaProvider` (local LLM). The system prompt and evaluation context types live in `types.ts`.

### Stockfish Integration (src/services/stockfish.ts)

Runs Stockfish 17 via WASM Web Worker. The `StockfishService` class manages the worker lifecycle, sends UCI commands, and parses evaluation output. The WASM binary (7MB) lives in `public/`.

### Opening Data (src/data/openings.ts)

Hardcoded array of `Opening` objects. Each has an `id`, `name`, `description`, `mainLine` (SAN move strings), and `userColor`. Currently three openings: Scotch Game, Italian Game, Sicilian Najdorf.

## Tech Stack

- **Vue 3** (Composition API, `<script setup>`)
- **TypeScript** (strict mode, all lint flags enabled)
- **Vite 7** (dev/build)
- **Pinia** (state, localStorage persistence)
- **vue3-chessboard** + **chess.js** (board UI and move validation)
- **stockfish** (WASM engine in Web Worker)
- **marked** (markdown rendering for AI responses)
- **vitest** (unit tests)

## Key Conventions

- All Vue components use `<script setup lang="ts">` with Composition API
- CSS is in `src/assets/main.css` (single file, dark theme, no CSS framework)
- No backend -- all state is client-side (localStorage for persistence)
- Anthropic API calls go direct from browser with `anthropic-dangerous-direct-browser-access` header
- The app is deployed via `restart.sh` to a Tailscale host
