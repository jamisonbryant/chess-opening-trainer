import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { UserColor } from './training'

export interface MyOpening {
  openingId: string
  userColor: UserColor
  timesCompleted: number
  lastCompletedAt: string
}

const STORAGE_KEY = 'myOpenings'

function loadFromStorage(): MyOpening[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export const useMyOpeningsStore = defineStore('myOpenings', () => {
  const openings = ref<MyOpening[]>(loadFromStorage())

  const sortedOpenings = computed(() =>
    [...openings.value].sort(
      (a, b) => new Date(b.lastCompletedAt).getTime() - new Date(a.lastCompletedAt).getTime()
    )
  )

  watch(openings, (v) => localStorage.setItem(STORAGE_KEY, JSON.stringify(v)), { deep: true })

  function find(openingId: string, userColor: UserColor): MyOpening | undefined {
    return openings.value.find(
      (o) => o.openingId === openingId && o.userColor === userColor
    )
  }

  function has(openingId: string, userColor: UserColor): boolean {
    return find(openingId, userColor) !== undefined
  }

  function addOrIncrement(openingId: string, userColor: UserColor) {
    const existing = find(openingId, userColor)
    if (existing) {
      existing.timesCompleted++
      existing.lastCompletedAt = new Date().toISOString()
    } else {
      openings.value.push({
        openingId,
        userColor,
        timesCompleted: 1,
        lastCompletedAt: new Date().toISOString(),
      })
    }
  }

  function remove(openingId: string, userColor: UserColor) {
    const index = openings.value.findIndex(
      (o) => o.openingId === openingId && o.userColor === userColor
    )
    if (index !== -1) {
      openings.value.splice(index, 1)
    }
  }

  return { openings, sortedOpenings, find, has, addOrIncrement, remove }
})
