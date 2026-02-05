import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type AiProviderType = 'anthropic' | 'ollama'
export type ThemeType = 'dark' | 'light'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<ThemeType>(
    (localStorage.getItem('theme') as ThemeType) || 'dark'
  )
  const aiProvider = ref<AiProviderType>(
    (localStorage.getItem('aiProvider') as AiProviderType) || 'anthropic'
  )
  const anthropicApiKey = ref(localStorage.getItem('anthropicApiKey') || '')
  const ollamaModel = ref(localStorage.getItem('ollamaModel') || 'llama3.2')
  const ollamaBaseUrl = ref(
    localStorage.getItem('ollamaBaseUrl') || 'http://localhost:11434'
  )

  watch(theme, (v) => localStorage.setItem('theme', v))
  watch(aiProvider, (v) => localStorage.setItem('aiProvider', v))
  watch(anthropicApiKey, (v) => localStorage.setItem('anthropicApiKey', v))
  watch(ollamaModel, (v) => localStorage.setItem('ollamaModel', v))
  watch(ollamaBaseUrl, (v) => localStorage.setItem('ollamaBaseUrl', v))

  return { theme, aiProvider, anthropicApiKey, ollamaModel, ollamaBaseUrl }
})
