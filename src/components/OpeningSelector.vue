<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-vue-next'
import { useTrainingStore } from '../stores/training'

const training = useTrainingStore()
const isCollapsed = ref(false)
const isMobile = ref(false)

function updateMobile(e: MediaQueryListEvent | MediaQueryList) {
  isMobile.value = e.matches
}

let mql: MediaQueryList | null = null

onMounted(() => {
  mql = window.matchMedia('(max-width: 1024px)')
  isMobile.value = mql.matches
  mql.addEventListener('change', updateMobile)
  // Default collapsed on mobile since this only mounts during training
  isCollapsed.value = isMobile.value
})

onUnmounted(() => {
  mql?.removeEventListener('change', updateMobile)
})

function toggleCollapsed() {
  isCollapsed.value = !isCollapsed.value
}

function resetSelection() {
  training.reset()
  isCollapsed.value = false
}
</script>

<template>
  <div class="opening-selector" :class="{ collapsed: isCollapsed }">
    <button class="selector-header" :class="{ 'selector-header--compact': isCollapsed && isMobile }" @click="toggleCollapsed">
      <template v-if="isCollapsed && isMobile">
        <span class="compact-info">
          <span class="compact-name">{{ training.currentOpening?.name }}</span>
          <span class="compact-progress">{{ training.currentMoveIndex }}/{{ training.currentOpening?.mainLine.length }}</span>
        </span>
      </template>
      <h2 v-else>Opening</h2>
      <component :is="isCollapsed ? ChevronRight : ChevronDown" :size="14" :stroke-width="2.5" class="toggle-icon" />
    </button>

    <div v-if="!isCollapsed" class="selector-content">
      <div class="progress-section">
        <h3>Progress</h3>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${training.progress * 100}%` }"
          />
        </div>
        <p>Move {{ training.currentMoveIndex }} / {{ training.currentOpening?.mainLine.length }}</p>
        <button class="reset-btn" @click="resetSelection"><RotateCcw :size="16" /> Start Over</button>
      </div>
    </div>
  </div>
</template>
