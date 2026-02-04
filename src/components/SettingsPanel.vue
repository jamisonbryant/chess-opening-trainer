<script setup lang="ts">
import { useSettingsStore } from '../stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <div class="settings-panel">
    <h3>Settings</h3>

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
</template>
