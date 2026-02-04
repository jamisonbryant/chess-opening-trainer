<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'

const settings = useSettingsStore()
const isExpanded = ref(false)

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="settings-panel" :class="{ collapsed: !isExpanded }">
    <button class="settings-header" @click="toggleExpanded">
      <h3>Settings</h3>
      <span class="toggle-icon">{{ isExpanded ? '▼' : '▶' }}</span>
    </button>

    <div v-if="isExpanded" class="settings-content">
      <div class="field">
        <label>AI Provider</label>
        <select v-model="settings.aiProvider">
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="ollama">Ollama (Local)</option>
        </select>
      </div>

      <div v-if="settings.aiProvider === 'anthropic'" class="field">
        <label>Anthropic API Key</label>
        <input
          v-model="settings.anthropicApiKey"
          type="password"
          placeholder="sk-ant-..."
        />
      </div>

      <div v-if="settings.aiProvider === 'ollama'">
        <div class="field">
          <label>Model</label>
          <input v-model="settings.ollamaModel" placeholder="llama3.2" />
        </div>
        <div class="field">
          <label>Base URL</label>
          <input
            v-model="settings.ollamaBaseUrl"
            placeholder="http://localhost:11434"
          />
        </div>
      </div>
    </div>
  </div>
</template>
