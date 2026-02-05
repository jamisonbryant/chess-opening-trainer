<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Info, X } from 'lucide-vue-next'

const isOpen = ref(false)

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    close()
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <button class="about-toggle" @click="toggle" title="About">
    <Info :size="18" class="about-icon" />
  </button>

  <Teleport to="body">
    <div v-if="isOpen" class="about-backdrop" @click.self="close">
      <div class="about-modal">
        <button class="about-close" @click="close" title="Close"><X :size="16" /></button>
        <h2>Chess Opening Trainer</h2>
        <dl class="about-details">
          <dt>Version</dt>
          <dd>0.1.0</dd>
          <dt>Author</dt>
          <dd>Jamison Bryant</dd>
          <dt>License</dt>
          <dd>MIT</dd>
          <dt>Source</dt>
          <dd>
            <a
              href="https://github.com/jamisonbryant/chess-opening-trainer"
              target="_blank"
              rel="noopener noreferrer"
            >github.com/jamisonbryant/chess-opening-trainer</a>
          </dd>
        </dl>
        <p class="about-description">
          Practice chess openings and get AI-powered coaching when you go wrong.
        </p>
        <a
          class="kofi-link"
          href="https://ko-fi.com/jamisonbryant"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg class="kofi-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
          Buy me a coffee
        </a>
      </div>
    </div>
  </Teleport>
</template>
