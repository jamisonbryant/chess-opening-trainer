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
