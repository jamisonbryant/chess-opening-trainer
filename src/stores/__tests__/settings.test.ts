// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../settings'

describe('settings store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('initializes with defaults when localStorage is empty', () => {
    const store = useSettingsStore()
    expect(store.theme).toBe('dark')
    expect(store.aiProvider).toBe('anthropic')
    expect(store.anthropicApiKey).toBe('')
    expect(store.anthropicModel).toBe('claude-sonnet-4-20250514')
    expect(store.ollamaModel).toBe('llama3.2')
    expect(store.ollamaBaseUrl).toBe('http://localhost:11434')
  })

  it('reads initial values from localStorage', () => {
    localStorage.setItem('theme', 'light')
    localStorage.setItem('aiProvider', 'ollama')
    localStorage.setItem('anthropicApiKey', 'sk-test-123')
    localStorage.setItem('anthropicModel', 'claude-opus-4-20250514')
    localStorage.setItem('ollamaModel', 'mistral')
    localStorage.setItem('ollamaBaseUrl', 'http://example.com:11434')

    setActivePinia(createPinia())
    const store = useSettingsStore()
    expect(store.theme).toBe('light')
    expect(store.aiProvider).toBe('ollama')
    expect(store.anthropicApiKey).toBe('sk-test-123')
    expect(store.anthropicModel).toBe('claude-opus-4-20250514')
    expect(store.ollamaModel).toBe('mistral')
    expect(store.ollamaBaseUrl).toBe('http://example.com:11434')
  })

  it('persists theme changes to localStorage', async () => {
    const store = useSettingsStore()
    store.theme = 'light'
    await new Promise((r) => setTimeout(r, 0))
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('persists aiProvider changes to localStorage', async () => {
    const store = useSettingsStore()
    store.aiProvider = 'ollama'
    await new Promise((r) => setTimeout(r, 0))
    expect(localStorage.getItem('aiProvider')).toBe('ollama')
  })

  it('persists anthropicApiKey changes to localStorage', async () => {
    const store = useSettingsStore()
    store.anthropicApiKey = 'sk-new-key'
    await new Promise((r) => setTimeout(r, 0))
    expect(localStorage.getItem('anthropicApiKey')).toBe('sk-new-key')
  })

  it('persists anthropicModel changes to localStorage', async () => {
    const store = useSettingsStore()
    store.anthropicModel = 'claude-opus-4-20250514'
    await new Promise((r) => setTimeout(r, 0))
    expect(localStorage.getItem('anthropicModel')).toBe('claude-opus-4-20250514')
  })

  it('persists ollamaModel changes to localStorage', async () => {
    const store = useSettingsStore()
    store.ollamaModel = 'codellama'
    await new Promise((r) => setTimeout(r, 0))
    expect(localStorage.getItem('ollamaModel')).toBe('codellama')
  })

  it('persists ollamaBaseUrl changes to localStorage', async () => {
    const store = useSettingsStore()
    store.ollamaBaseUrl = 'http://remote:11434'
    await new Promise((r) => setTimeout(r, 0))
    expect(localStorage.getItem('ollamaBaseUrl')).toBe('http://remote:11434')
  })
})
