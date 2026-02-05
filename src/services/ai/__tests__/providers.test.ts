import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnthropicProvider, ANTHROPIC_MODELS, DEFAULT_ANTHROPIC_MODEL } from '../anthropic'
import { OllamaProvider, fetchOllamaModels } from '../ollama'

describe('AnthropicProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('exports model list and default model', () => {
    expect(ANTHROPIC_MODELS.length).toBeGreaterThan(0)
    expect(DEFAULT_ANTHROPIC_MODEL).toBe(ANTHROPIC_MODELS[0].id)
  })

  it('sends correct request to Anthropic API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: 'Great move analysis.' }],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const provider = new AnthropicProvider('sk-test-key', 'claude-sonnet-4-20250514')
    const result = await provider.evaluate('Why is e4 good?', 'You are a chess coach.')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]!
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    expect(options.method).toBe('POST')
    expect(options.headers['x-api-key']).toBe('sk-test-key')
    expect(options.headers['anthropic-version']).toBe('2023-06-01')
    expect(options.headers['anthropic-dangerous-direct-browser-access']).toBe('true')

    const body = JSON.parse(options.body)
    expect(body.model).toBe('claude-sonnet-4-20250514')
    expect(body.max_tokens).toBe(1024)
    expect(body.system).toBe('You are a chess coach.')
    expect(body.messages[0].content).toBe('Why is e4 good?')

    expect(result).toBe('Great move analysis.')
  })

  it('uses default system prompt when none provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: [{ text: 'Response.' }],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const provider = new AnthropicProvider('sk-key')
    await provider.evaluate('test prompt')

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body)
    expect(body.system).toContain('chess opening trainer')
  })

  it('throws on API error response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    })
    vi.stubGlobal('fetch', mockFetch)

    const provider = new AnthropicProvider('bad-key')
    await expect(provider.evaluate('test')).rejects.toThrow('Anthropic API error: 401 Unauthorized')
  })
})

describe('OllamaProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sends correct request to Ollama API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: { content: 'Ollama response.' },
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const provider = new OllamaProvider('llama3.2', 'http://localhost:11434')
    const result = await provider.evaluate('Analyze this position.', 'You are a coach.')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]!
    expect(url).toBe('http://localhost:11434/api/chat')
    expect(options.method).toBe('POST')

    const body = JSON.parse(options.body)
    expect(body.model).toBe('llama3.2')
    expect(body.stream).toBe(false)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[0].content).toBe('You are a coach.')
    expect(body.messages[1].role).toBe('user')
    expect(body.messages[1].content).toBe('Analyze this position.')

    expect(result).toBe('Ollama response.')
  })

  it('uses default system prompt when none provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: { content: 'Response.' },
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const provider = new OllamaProvider()
    await provider.evaluate('test')

    const body = JSON.parse(mockFetch.mock.calls[0]![1].body)
    expect(body.messages[0].content).toContain('chess opening trainer')
  })

  it('throws on API error response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    })
    vi.stubGlobal('fetch', mockFetch)

    const provider = new OllamaProvider()
    await expect(provider.evaluate('test')).rejects.toThrow('Ollama API error: 500 Internal Server Error')
  })
})

describe('fetchOllamaModels', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches and parses model list', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        models: [
          { name: 'llama3.2', size: 4000000000 },
          { name: 'mistral', size: 7000000000 },
        ],
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const models = await fetchOllamaModels('http://localhost:11434')

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/tags')
    expect(models).toHaveLength(2)
    expect(models[0]).toEqual({ name: 'llama3.2', size: 4000000000 })
    expect(models[1]).toEqual({ name: 'mistral', size: 7000000000 })
  })

  it('returns empty array when models field is missing', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
    vi.stubGlobal('fetch', mockFetch)

    const models = await fetchOllamaModels()
    expect(models).toEqual([])
  })

  it('throws on API error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    })
    vi.stubGlobal('fetch', mockFetch)

    await expect(fetchOllamaModels()).rejects.toThrow('Ollama API error: 404')
  })
})
