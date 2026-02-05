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

export const REFLECTION_SYSTEM_PROMPT = `You are a chess opening trainer wrapping up a practice session. The student just finished playing through an opening's main line. Respond to their thoughts and answer any questions they have about the opening. Be conversational, encouraging, and insightful. Keep your response to 2-3 paragraphs.`

export interface ReflectionContext {
  openingName: string
  totalMoves: number
  mistakes: number
  userMessage: string
}

export function buildReflectionPrompt(ctx: ReflectionContext): string {
  return `Opening practiced: ${ctx.openingName}
Session summary: ${ctx.totalMoves} moves in the main line, ${ctx.mistakes} mistake(s) corrected.

Student's response to "What did you think of this opening? Do you have any questions?":
"${ctx.userMessage}"

Respond to their thoughts and questions about this opening.`
}

export interface AiProvider {
  evaluate(userPrompt: string, systemPrompt?: string): Promise<string>
}
