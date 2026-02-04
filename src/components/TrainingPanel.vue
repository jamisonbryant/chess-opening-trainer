<script setup lang="ts">
import { ref } from 'vue'
import { useTrainingStore } from '../stores/training'

const training = useTrainingStore()
const userExplanation = ref('')

interface Message {
  role: 'trainer' | 'user' | 'system'
  text: string
}

const messages = defineModel<Message[]>('messages', { default: () => [] })

const emit = defineEmits<{
  (e: 'submit-explanation', explanation: string): void
}>()

function submitExplanation() {
  if (!userExplanation.value.trim()) return
  emit('submit-explanation', userExplanation.value.trim())
  userExplanation.value = ''
}
</script>

<template>
  <div class="training-panel">
    <h2>Trainer</h2>

    <div class="messages">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="message"
        :class="msg.role"
      >
        <div class="message-content">{{ msg.text }}</div>
      </div>
    </div>

    <div v-if="training.phase === 'explaining'" class="input-area">
      <p class="prompt">Why did you make that move?</p>
      <textarea
        v-model="userExplanation"
        placeholder="Explain your reasoning..."
        @keydown.ctrl.enter="submitExplanation"
      />
      <button @click="submitExplanation" :disabled="!userExplanation.trim()">
        Submit
      </button>
    </div>

    <div v-if="training.phase === 'evaluating'" class="loading">
      Analyzing your move...
    </div>

    <div v-if="training.phase === 'complete'" class="complete">
      <h3>Opening complete!</h3>
      <p>You've finished the {{ training.currentOpening?.name }} main line.</p>
      <button @click="training.startSession(training.openingId!)">
        Try again
      </button>
    </div>
  </div>
</template>
