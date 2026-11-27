import { ref } from 'vue'
import { defineStore } from 'pinia'

const eventModules = import.meta.glob('../data/events/*.json', { eager: true, import: 'default' })

export const useEventStore = defineStore('event', () => {
  const events = ref(Object.values(eventModules).sort((a, b) => a.year - b.year))
  const currentEvent = ref(null)

  function loadEvents() {
    return events.value
  }

  function setCurrentEvent(id) {
    currentEvent.value = events.value.find((event) => event.id === String(id)) || null
    return currentEvent.value
  }

  return { events, currentEvent, loadEvents, setCurrentEvent }
})
