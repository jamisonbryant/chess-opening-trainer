<script setup lang="ts">
import { ref, computed } from 'vue'
import { openings, type Opening } from '../data/openings'
import { useTrainingStore, type UserColor } from '../stores/training'

const training = useTrainingStore()
const searchQuery = ref('')
const showDropdown = ref(false)
const selectedOpening = ref<Opening | null>(null)
const selectedColor = ref<UserColor | null>(null)
const isCollapsed = ref(false)

const filteredOpenings = computed(() => {
  if (!searchQuery.value.trim()) return openings
  const query = searchQuery.value.toLowerCase()
  return openings.filter(
    (o) =>
      o.name.toLowerCase().includes(query) ||
      o.description.toLowerCase().includes(query)
  )
})

const isTrainingActive = computed(() => training.phase !== 'idle')

function selectOpening(opening: Opening) {
  selectedOpening.value = opening
  searchQuery.value = opening.name
  showDropdown.value = false
  selectedColor.value = null
}

function selectColor(color: UserColor) {
  selectedColor.value = color
}

function startTraining() {
  if (!selectedOpening.value || !selectedColor.value) return
  training.startSession(selectedOpening.value.id, selectedColor.value)
  isCollapsed.value = true
}

function handleFocus() {
  showDropdown.value = true
}

function handleBlur() {
  setTimeout(() => {
    showDropdown.value = false
  }, 150)
}

function toggleCollapsed() {
  isCollapsed.value = !isCollapsed.value
}

function resetSelection() {
  training.reset()
  selectedOpening.value = null
  selectedColor.value = null
  searchQuery.value = ''
  isCollapsed.value = false
}
</script>

<template>
  <div class="opening-selector" :class="{ collapsed: isCollapsed && isTrainingActive }">
    <button v-if="isTrainingActive" class="selector-header" @click="toggleCollapsed">
      <h2>{{ selectedOpening?.name }}</h2>
      <span class="toggle-icon">{{ isCollapsed ? '▶' : '▼' }}</span>
    </button>
    <h2 v-else>Select Opening</h2>

    <div v-if="!isCollapsed || !isTrainingActive" class="selector-content">
      <div class="typeahead">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search openings..."
          :disabled="isTrainingActive"
          @focus="handleFocus"
          @blur="handleBlur"
        />

        <div v-if="showDropdown && filteredOpenings.length > 0 && !isTrainingActive" class="dropdown">
          <div
            v-for="opening in filteredOpenings"
            :key="opening.id"
            class="dropdown-item"
            :class="{ active: selectedOpening?.id === opening.id }"
            @mousedown="selectOpening(opening)"
          >
            <div class="item-name">{{ opening.name }}</div>
            <div class="item-description">{{ opening.description }}</div>
          </div>
        </div>
      </div>

      <!-- Color selector -->
      <div v-if="selectedOpening && !isTrainingActive" class="color-selector">
        <label>Play as</label>
        <div class="color-buttons">
          <button
            class="color-btn white"
            :class="{ active: selectedColor === 'white' }"
            @click="selectColor('white')"
          >
            <span class="icon">♔</span> White
          </button>
          <button
            class="color-btn black"
            :class="{ active: selectedColor === 'black' }"
            @click="selectColor('black')"
          >
            <span class="icon">♚</span> Black
          </button>
        </div>
      </div>

      <!-- Start button -->
      <button
        v-if="selectedOpening && selectedColor && !isTrainingActive"
        class="start-btn"
        @click="startTraining"
      >
        Start Training
      </button>

      <!-- Progress section when training -->
      <div v-if="isTrainingActive" class="progress-section">
        <h3>Progress</h3>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${training.progress * 100}%` }"
          />
        </div>
        <p>Move {{ training.currentMoveIndex }} / {{ training.currentOpening?.mainLine.length }}</p>
        <button class="reset-btn" @click="resetSelection">Change Opening</button>
      </div>
    </div>
  </div>
</template>
