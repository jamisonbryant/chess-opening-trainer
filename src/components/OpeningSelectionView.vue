<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, CircleHelp } from 'lucide-vue-next'
import logoUrl from '../assets/logo.svg'
import { openings, getOpening, type Opening } from '../data/openings'
import { useTrainingStore, type UserColor } from '../stores/training'
import { useMyOpeningsStore } from '../stores/my-openings'

const training = useTrainingStore()
const myOpenings = useMyOpeningsStore()

const searchQuery = ref('')
const showDropdown = ref(false)
const selectedOpening = ref<Opening | null>(null)
const selectedColor = ref<UserColor | null>(null)
const showWelcome = ref(localStorage.getItem('hideWelcome') !== 'true')

const MAX_RESULTS = 50

const filteredOpenings = computed(() => {
  if (!searchQuery.value.trim()) return []
  const query = searchQuery.value.toLowerCase()
  return openings.filter((o) => o.name.toLowerCase().includes(query))
})

const displayedOpenings = computed(() => filteredOpenings.value.slice(0, MAX_RESULTS))
const hasMoreResults = computed(() => filteredOpenings.value.length > MAX_RESULTS)

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

function dismissWelcome() {
  showWelcome.value = false
  localStorage.setItem('hideWelcome', 'true')
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
  <div class="selection-view">
    <div class="selection-hero">
      <img :src="logoUrl" alt="" class="selection-logo" />
      <h1 class="selection-title">Chess Opening Trainer</h1>
      <p class="selection-tagline">Master opening theory through interactive play and AI-powered coaching.</p>
    </div>

    <div class="selection-card">
      <div v-if="showWelcome" class="selection-welcome">
        <button class="dismiss-btn" @click="dismissWelcome" title="Dismiss"><X :size="16" /></button>
        <h3><CircleHelp :size="15" class="welcome-icon" /> How to Train</h3>
        <ol>
          <li>Search for an opening below</li>
          <li>Choose White or Black</li>
          <li>Click <strong>Start Training</strong></li>
          <li>Play moves on the board</li>
          <li>Explain deviations to the AI coach</li>
        </ol>
      </div>

      <div class="selection-main">
        <h2>Select Opening</h2>

        <div class="typeahead">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search openings..."
            @focus="handleFocus"
            @blur="handleBlur"
          />

          <div v-if="showDropdown" class="dropdown">
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
                {{ filteredOpenings.length - MAX_RESULTS }} more results...
              </div>
            </template>
            <div v-else class="dropdown-hint">
              No openings found
            </div>
          </div>
        </div>

        <div v-if="selectedOpening" class="color-selector">
          <label>Play as</label>
          <div class="color-buttons">
            <button
              class="color-btn white"
              :class="{ active: selectedColor === 'white' }"
              @click="selectColor('white')"
            >
              <span class="icon">&#9812;</span> White
            </button>
            <button
              class="color-btn black"
              :class="{ active: selectedColor === 'black' }"
              @click="selectColor('black')"
            >
              <span class="icon">&#9818;</span> Black
            </button>
          </div>
        </div>

        <button
          v-if="selectedOpening && selectedColor"
          class="start-btn"
          @click="startTraining"
        >
          Start Training
        </button>
      </div>

      <div class="selection-my-openings">
        <h2>My Openings</h2>
        <div v-if="myOpenings.sortedOpenings.length === 0" class="my-openings-empty">
          Complete an opening to save it here.
        </div>
        <div v-else class="my-openings-list">
          <div
            v-for="entry in myOpenings.sortedOpenings"
            :key="`${entry.openingId}-${entry.userColor}`"
            class="opening-card my-opening-card"
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
  </div>
</template>
