<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const host = ref(null)
let scene

onMounted(async () => {
  if (!host.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  try {
    const { createArchiveScene } = await import('../three/archiveScene')
    if (!host.value) return
    scene = createArchiveScene(host.value, { mode: 'home' })
    host.value.classList.add('is-ready')
  } catch {
    host.value?.classList.remove('is-ready')
  }
})

onBeforeUnmount(() => scene?.dispose())

defineExpose({
  setScrollProgress: (value) => scene?.setScrollProgress(value),
  setTimelineProgress: (value) => scene?.setTimelineProgress(value),
  ignite: (index) => scene?.ignite(index),
})
</script>

<template>
  <div ref="host" class="three-host three-host--home" aria-hidden="true"></div>
</template>
