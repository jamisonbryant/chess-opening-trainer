import { type AiProvider, SYSTEM_PROMPT } from './types'

export interface OllamaModel {
  name: string
  size: number
}

export async function fetchOllamaModels(baseUrl: string = 'http://localhost:11434'): Promise<OllamaModel[]> {
  const response = await fetch(`${baseUrl}/api/tags`)
  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`)
  }
  const data = await response.json()
  return (data.models ?? []).map((m: { name: string; size: number }) => ({
    name: m.name,
    size: m.size,
  }))
}

export class OllamaProvider implements AiProvider {
  private model: string
  private baseUrl: string

  constructor(model: string = 'llama3.2', baseUrl: string = 'http://localhost:11434') {
    this.model = model
    this.baseUrl = baseUrl
  }

  async evaluate(userPrompt: string, systemPrompt?: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt ?? SYSTEM_PROMPT },
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
