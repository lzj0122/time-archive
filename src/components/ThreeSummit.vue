<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const host = ref(null)
let scene

onMounted(async () => {
  if (!host.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  try {
    const { createArchiveScene } = await import('../three/archiveScene')
    if (!host.value) return
    scene = createArchiveScene(host.value, { mode: 'summit' })
    host.value.classList.add('is-ready')
  } catch {
    host.value?.classList.remove('is-ready')
  }
})

onBeforeUnmount(() => scene?.dispose())

defineExpose({ replay: () => scene?.replay() })
</script>

<template>
  <div ref="host" class="three-host three-host--summit" aria-hidden="true"></div>
</template>
