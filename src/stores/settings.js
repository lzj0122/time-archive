import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'time-archive:settings:v1'

function readStoredSettings() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      muted: Boolean(value.muted),
      reducedMotion: Boolean(value.reducedMotion),
      readingMode: Boolean(value.readingMode),
      mapOpen: Boolean(value.mapOpen),
    }
  } catch {
    return { muted: false, reducedMotion: false, readingMode: false, mapOpen: false }
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const stored = readStoredSettings()
  const muted = ref(stored.muted)
  const reducedMotion = ref(stored.reducedMotion)
  const readingMode = ref(stored.readingMode)
  const mapOpen = ref(stored.mapOpen)

  watch([muted, reducedMotion, readingMode, mapOpen], () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        muted: muted.value,
        reducedMotion: reducedMotion.value,
        readingMode: readingMode.value,
        mapOpen: mapOpen.value,
      }))
    } catch {
      return
    }
  })

  return { muted, reducedMotion, readingMode, mapOpen }
})
