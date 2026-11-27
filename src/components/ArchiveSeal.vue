<script setup>
import { onBeforeUnmount, ref } from 'vue'
import gsap from 'gsap'

const root = ref(null)
let context

function play() {
  if (!root.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  context?.revert()
  context = gsap.context(() => {
    const seal = root.value
    const dust = gsap.utils.toArray('.archive-seal__dust', seal)

    gsap.killTweensOf([seal, ...dust])
    gsap.set(seal, { autoAlpha: 1, scale: 1.6, rotate: -12, opacity: 0 })
    gsap.set(dust, { x: 0, y: 0, scale: 0.4, opacity: 0 })

    const timeline = gsap.timeline({
      onComplete: () => gsap.set(seal, { autoAlpha: 0 }),
    })

    timeline
      .to(seal, {
        scale: 1,
        rotate: 0,
        opacity: 1,
        duration: 0.45,
        ease: 'back.out(2)',
      })
      .to(dust, {
        x: (index) => Math.cos((index / dust.length) * Math.PI * 2) * (42 + (index % 3) * 12),
        y: (index) => Math.sin((index / dust.length) * Math.PI * 2) * (42 + (index % 3) * 12),
        scale: 1,
        opacity: 0.65,
        duration: 0.55,
        stagger: 0.012,
        ease: 'power2.out',
      }, 0.08)
      .to(dust, {
        opacity: 0,
        duration: 0.35,
        stagger: 0.01,
        ease: 'sine.out',
      }, 0.48)
      .to(seal, {
        opacity: 0,
        duration: 0.3,
        ease: 'sine.inOut',
      }, 1.05)
  }, root.value)
}

onBeforeUnmount(() => context?.revert())

defineExpose({ play })
</script>

<template>
  <div ref="root" class="archive-seal" aria-hidden="true">
    <span class="archive-seal__mark">阅</span>
    <span
      v-for="index in 10"
      :key="index"
      class="archive-seal__dust"
      :style="{ '--dust-index': index }"
    ></span>
  </div>
</template>
