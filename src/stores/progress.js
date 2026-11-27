import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'time-archive:progress:v1'

function readStoredProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      readEvents: Array.isArray(value.readEvents) ? value.readEvents : [],
      askedEvents: Array.isArray(value.askedEvents) ? value.askedEvents : [],
      completedEvents: Array.isArray(value.completedEvents) ? value.completedEvents : [],
    }
  } catch {
    return { readEvents: [], askedEvents: [], completedEvents: [] }
  }
}

export const useProgressStore = defineStore('progress', () => {
  const stored = readStoredProgress()
  const readEvents = ref(stored.readEvents)
  const askedEvents = ref(stored.askedEvents)
  const completedEvents = ref(stored.completedEvents)
  const summitUnlocked = computed(() => completedEvents.value.length === 6)

  watch([readEvents, askedEvents, completedEvents], () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        readEvents: readEvents.value,
        askedEvents: askedEvents.value,
        completedEvents: completedEvents.value,
      }))
    } catch {
      return
    }
  }, { deep: true })

  return { readEvents, askedEvents, completedEvents, summitUnlocked }
})
