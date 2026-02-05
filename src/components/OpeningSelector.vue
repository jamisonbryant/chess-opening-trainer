<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ChevronDown, ChevronRight, RotateCcw, X } from 'lucide-vue-next'
import { openings, getOpening, type Opening } from '../data/openings'
import { useTrainingStore, type UserColor } from '../stores/training'
import { useMyOpeningsStore } from '../stores/my-openings'

const training = useTrainingStore()
const myOpenings = useMyOpeningsStore()
const isTrainingActive = computed(() => training.phase !== 'idle')
const searchQuery = ref(training.currentOpening?.name ?? '')
const showDropdown = ref(false)
const selectedOpening = ref<Opening | null>(training.currentOpening ?? null)
const selectedColor = ref<UserColor | null>(isTrainingActive.value ? training.userColor : null)
const isCollapsed = ref(false)
const isMobile = ref(false)
const MAX_RESULTS = 50

function updateMobile(e: MediaQueryListEvent | MediaQueryList) {
  isMobile.value = e.matches
}

let mql: MediaQueryList | null = null

onMounted(() => {
  mql = window.matchMedia('(max-width: 1024px)')
  isMobile.value = mql.matches
  mql.addEventListener('change', updateMobile)
})

onUnmounted(() => {
  mql?.removeEventListener('change', updateMobile)
})

// Auto-collapse when training starts on mobile
watch(
  () => training.phase,
  (newPhase, oldPhase) => {
    if (newPhase === 'playing' && oldPhase === 'idle' && isMobile.value) {
      isCollapsed.value = true
    }
  }
)

const filteredOpenings = computed(() => {
  if (!searchQuery.value.trim()) return []
  const query = searchQuery.value.toLowerCase()
  return openings.filter((o) => o.name.toLowerCase().includes(query))
})

const displayedOpenings = computed(() => filteredOpenings.value.slice(0, MAX_RESULTS))
const hasMoreResults = computed(() => filteredOpenings.value.length > MAX_RESULTS)
const totalResults = computed(() => filteredOpenings.value.length)

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

function startFromMyOpening(openingId: string, userColor: UserColor) {
  const opening = getOpening(openingId)
  if (!opening) return
  selectedOpening.value = opening
  selectedColor.value = userColor
  searchQuery.value = opening.name
  training.startSession(opening.id, userColor)
}

function removeFromMyOpenings(openingId: string, userColor: UserColor) {
  myOpenings.remove(openingId, userColor)
}
</script>

<template>
  <div class="opening-selector" :class="{ collapsed: isCollapsed && isTrainingActive }">
    <button v-if="isTrainingActive" class="selector-header" :class="{ 'selector-header--compact': isCollapsed && isMobile }" @click="toggleCollapsed">
      <template v-if="isCollapsed && isMobile">
        <span class="compact-info">
          <span class="compact-name">{{ training.currentOpening?.name }}</span>
          <span class="compact-progress">{{ training.currentMoveIndex }}/{{ training.currentOpening?.mainLine.length }}</span>
        </span>
      </template>
      <h2 v-else>Opening</h2>
      <component :is="isCollapsed ? ChevronRight : ChevronDown" :size="14" :stroke-width="2.5" class="toggle-icon" />
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

        <div v-if="showDropdown && !isTrainingActive" class="dropdown">
          <div v-if="!searchQuery.trim()" class="dropdown-hint">
            Type to search openings...
          </div>
          <template v-else-if="displayedOpenings.length > 0">
            <div
              v-for="opening in displayedOpenings"
              :key="opening.id"
              class="dropdown-item"
              :class="{ active: selectedOpening?.id === opening.id }"
              @mousedown="selectOpening(opening)"
            >
              <div class="item-name">{{ opening.name }}</div>
            </div>
            <div v-if="hasMoreResults" class="dropdown-hint">
              {{ totalResults - MAX_RESULTS }} more results...
            </div>
          </template>
          <div v-else class="dropdown-hint">
            No openings found
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
        <button class="reset-btn" @click="resetSelection"><RotateCcw :size="16" /> Start Over</button>
      </div>
    </div>

    <div v-if="!(isMobile && isTrainingActive)" class="my-openings-section">
      <h2>My Openings</h2>
      <div v-if="myOpenings.sortedOpenings.length === 0" class="my-openings-empty">
        Complete an opening to save it here.
      </div>
      <div v-else class="my-openings-list">
        <div
          v-for="entry in myOpenings.sortedOpenings"
          :key="`${entry.openingId}-${entry.userColor}`"
          class="opening-card my-opening-card"
          :class="{ active: isTrainingActive && training.openingId === entry.openingId && training.userColor === entry.userColor }"
          @click="startFromMyOpening(entry.openingId, entry.userColor)"
        >
          <div class="my-opening-header">
            <h3>{{ getOpening(entry.openingId)?.name ?? entry.openingId }}</h3>
            <button
              class="my-opening-remove"
              title="Remove from My Openings"
              @click.stop="removeFromMyOpenings(entry.openingId, entry.userColor)"
            >
              <X :size="14" />
            </button>
          </div>
          <div class="my-opening-meta">
            <span class="color-badge">{{ entry.userColor }}</span>
            <span class="training-count">{{ entry.timesCompleted }}x completed</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
