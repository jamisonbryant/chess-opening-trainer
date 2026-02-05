<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Undo2 } from 'lucide-vue-next'
import { marked } from 'marked'
import { useTrainingStore } from '../stores/training'

marked.setOptions({ breaks: true })

const training = useTrainingStore()
const userExplanation = ref('')

interface Message {
  role: 'trainer' | 'user' | 'system'
  text: string
}

const messages = defineModel<Message[]>('messages', { default: () => [] })
const messagesContainer = ref<HTMLElement>()

watch(() => messages.value.length, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
})

const userReflection = ref('')

const emit = defineEmits<{
  (e: 'submit-explanation', explanation: string): void
  (e: 'submit-reflection', message: string): void
  (e: 'take-back'): void
}>()

function submitExplanation() {
  if (!userExplanation.value.trim()) return
  emit('submit-explanation', userExplanation.value.trim())
  userExplanation.value = ''
}

function submitReflection() {
  if (!userReflection.value.trim()) return
  emit('submit-reflection', userReflection.value.trim())
  userReflection.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (training.phase === 'reflecting') {
      submitReflection()
    } else {
      submitExplanation()
    }
  }
}

function renderMarkdown(text: string): string {
  return marked.parse(text) as string
}
</script>

<template>
  <div class="training-panel">
    <h2>Trainer Chat</h2>

    <div class="messages" ref="messagesContainer">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="message"
        :class="msg.role"
      >
        <div class="message-content" v-html="renderMarkdown(msg.text)"></div>
      </div>
    </div>

    <div v-if="training.phase === 'explaining'" class="input-area">
      <p class="prompt">Why did you make that move?</p>
      <textarea
        v-model="userExplanation"
        placeholder="Explain your reasoning..."
        @keydown="handleKeydown"
      />
      <div class="input-actions">
        <button class="take-back-btn" @click="emit('take-back')">
          <Undo2 :size="16" /> Take Back
        </button>
        <button @click="submitExplanation" :disabled="!userExplanation.trim()">
          Submit
        </button>
      </div>
    </div>

    <div v-if="training.phase === 'reflecting'" class="input-area">
      <textarea
        v-model="userReflection"
        placeholder="Share your thoughts or ask a question..."
        @keydown="handleKeydown"
      />
      <div class="input-actions">
        <button @click="submitReflection" :disabled="!userReflection.trim()">
          Submit
        </button>
      </div>
    </div>

    <div v-if="training.phase === 'evaluating'" class="loading">
      Analyzing your move...
    </div>

    <div v-if="training.phase === 'reflecting-eval'" class="loading">
      Thinking...
    </div>

    <div v-if="training.phase === 'complete'" class="complete">
      <h3>Opening complete!</h3>
      <p>You've finished the {{ training.currentOpening?.name }} main line.</p>
      <button @click="training.startSession(training.openingId!, training.userColor)">
        Try again
      </button>
    </div>
  </div>
</template>
