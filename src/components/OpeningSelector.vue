<script setup lang="ts">
import { openings } from '../data/openings'
import { useTrainingStore } from '../stores/training'

const training = useTrainingStore()
</script>

<template>
  <div class="opening-selector">
    <h2>Openings</h2>
    <div
      v-for="opening in openings"
      :key="opening.id"
      class="opening-card"
      :class="{ active: training.openingId === opening.id }"
      @click="training.startSession(opening.id)"
    >
      <h3>{{ opening.name }}</h3>
      <p>{{ opening.description }}</p>
      <span class="color-badge">Play as {{ opening.userColor }}</span>
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
