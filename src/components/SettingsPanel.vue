<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { ANTHROPIC_MODELS, fetchOllamaModels, type OllamaModel } from '../services/ai'

const settings = useSettingsStore()
const isExpanded = ref(false)
const dropdownRef = ref<HTMLElement>()

const ollamaModels = ref<OllamaModel[]>([])
const ollamaModelsLoading = ref(false)
const ollamaModelsError = ref('')

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function handleClickOutside(e: MouseEvent) {
  if (isExpanded.value && dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isExpanded.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

async function loadOllamaModels() {
  ollamaModelsLoading.value = true
  ollamaModelsError.value = ''
  try {
    ollamaModels.value = await fetchOllamaModels(settings.ollamaBaseUrl)
    if (ollamaModels.value.length && !ollamaModels.value.some(m => m.name === settings.ollamaModel)) {
      settings.ollamaModel = ollamaModels.value[0]!.name
    }
  } catch {
    ollamaModelsError.value = 'Could not connect to Ollama'
    ollamaModels.value = []
  } finally {
    ollamaModelsLoading.value = false
  }
}

watch(() => settings.aiProvider, (provider) => {
  if (provider === 'ollama') loadOllamaModels()
})

watch(() => settings.ollamaBaseUrl, () => {
  if (settings.aiProvider === 'ollama') loadOllamaModels()
})

watch(isExpanded, (expanded) => {
  if (expanded && settings.aiProvider === 'ollama') loadOllamaModels()
})
</script>

<template>
  <div class="settings-dropdown" :class="{ open: isExpanded }" ref="dropdownRef">
    <button class="settings-toggle" @click="toggleExpanded" title="Settings">
      <span class="gear-icon">⚙</span>
    </button>

    <div v-if="isExpanded" class="settings-menu">
      <div class="field">
        <label>Theme</label>
        <div class="theme-toggle">
          <button
            class="theme-btn"
            :class="{ active: settings.theme === 'dark' }"
            @click="settings.theme = 'dark'"
          >Dark</button>
          <button
            class="theme-btn"
            :class="{ active: settings.theme === 'light' }"
            @click="settings.theme = 'light'"
          >Light</button>
        </div>
      </div>

      <div class="field">
        <label>AI Provider</label>
        <select v-model="settings.aiProvider">
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="ollama">Ollama (Local)</option>
        </select>
      </div>

      <div v-if="settings.aiProvider === 'anthropic'" class="field">
        <label>API Key</label>
        <input
          v-model="settings.anthropicApiKey"
          type="password"
          placeholder="sk-ant-..."
        />
      </div>

      <div v-if="settings.aiProvider === 'anthropic'" class="field">
        <label>Model</label>
        <select v-model="settings.anthropicModel">
          <option v-for="m in ANTHROPIC_MODELS" :key="m.id" :value="m.id">
            {{ m.label }}
          </option>
        </select>
      </div>

      <div v-if="settings.aiProvider === 'ollama'">
        <div class="field">
          <label>Base URL</label>
          <input
            v-model="settings.ollamaBaseUrl"
            placeholder="http://localhost:11434"
          />
        </div>
        <div class="field">
          <label>Model</label>
          <select v-if="ollamaModels.length" v-model="settings.ollamaModel">
            <option v-for="m in ollamaModels" :key="m.name" :value="m.name">
              {{ m.name }}
            </option>
          </select>
          <span v-else-if="ollamaModelsLoading" class="field-hint">Loading models...</span>
          <span v-else-if="ollamaModelsError" class="field-hint field-error">
            {{ ollamaModelsError }}
            <button class="retry-btn" @click="loadOllamaModels">Retry</button>
          </span>
          <span v-else class="field-hint">No models found</span>
        </div>
      </div>
    </div>
  </div>
</template>
