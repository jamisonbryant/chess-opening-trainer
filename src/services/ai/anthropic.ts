import { type AiProvider, SYSTEM_PROMPT } from './types'

export const ANTHROPIC_MODELS = [
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { id: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
  { id: 'claude-haiku-3-5-20241022', label: 'Claude 3.5 Haiku' },
] as const

export const DEFAULT_ANTHROPIC_MODEL = ANTHROPIC_MODELS[0].id

export class AnthropicProvider implements AiProvider {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string = DEFAULT_ANTHROPIC_MODEL) {
    this.apiKey = apiKey
    this.model = model
  }

  async evaluate(userPrompt: string, systemPrompt?: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt ?? SYSTEM_PROMPT,
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
