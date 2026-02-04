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
