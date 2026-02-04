<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { openings } from '../data/openings'
import { useTrainingStore } from '../stores/training'

const training = useTrainingStore()
const searchQuery = ref('')
const showDropdown = ref(false)

const filteredOpenings = computed(() => {
  if (!searchQuery.value.trim()) return openings
  const query = searchQuery.value.toLowerCase()
  return openings.filter(
    (o) =>
      o.name.toLowerCase().includes(query) ||
      o.description.toLowerCase().includes(query)
  )
})

function selectOpening(id: string) {
  const opening = openings.find((o) => o.id === id)
  if (opening) {
    searchQuery.value = opening.name
    showDropdown.value = false
    training.startSession(id)
  }
}

function handleFocus() {
  showDropdown.value = true
}

function handleBlur() {
  // Delay to allow click on dropdown item
  setTimeout(() => {
    showDropdown.value = false
  }, 150)
}

// Auto-select Scotch on mount
onMounted(() => {
  const scotch = openings.find((o) => o.id === 'scotch')
  if (scotch) {
    searchQuery.value = scotch.name
    training.startSession('scotch')
  }
})
</script>

<template>
  <div class="opening-selector">
    <h2>Opening</h2>

    <div class="typeahead">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search openings..."
        @focus="handleFocus"
        @blur="handleBlur"
      />

      <div v-if="showDropdown && filteredOpenings.length > 0" class="dropdown">
        <div
          v-for="opening in filteredOpenings"
          :key="opening.id"
          class="dropdown-item"
          :class="{ active: training.openingId === opening.id }"
          @mousedown="selectOpening(opening.id)"
        >
          <div class="item-name">{{ opening.name }}</div>
          <div class="item-description">{{ opening.description }}</div>
          <span class="color-badge">Play as {{ opening.userColor }}</span>
        </div>
      </div>
    </div>

    <div v-if="training.openingId" class="progress-section">
      <h3>Progress</h3>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${training.progress * 100}%` }"
        />
      </div>
      <p>Move {{ training.currentMoveIndex }} / {{ training.currentOpening?.mainLine.length }}</p>
    </div>
  </div>
</template>
