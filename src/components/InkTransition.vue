<script setup>
import { onBeforeUnmount, ref } from 'vue'
import gsap from 'gsap'

const root = ref(null)
let context
let activeTimeline

function play(navigate) {
  if (!root.value) {
    navigate()
    return Promise.resolve()
  }

  context?.revert()
  context = gsap.context(() => {
    const overlay = root.value
    gsap.set(overlay, {
      autoAlpha: 1,
      pointerEvents: 'auto',
      clipPath: 'circle(0% at 50% 50%)',
    })

    activeTimeline = gsap.timeline({
      onComplete: () => {
        gsap.set(overlay, { autoAlpha: 0, pointerEvents: 'none' })
      },
    })

    activeTimeline
      .to(overlay, {
        clipPath: 'circle(150% at 50% 50%)',
        duration: 0.35,
        ease: 'power2.inOut',
      })
      .add(() => navigate())
      .to(overlay, {
        clipPath: 'circle(0% at 50% 50%)',
        duration: 0.35,
        ease: 'power2.inOut',
      })
  }, root.value)

  return new Promise((resolve) => {
    activeTimeline.eventCallback('onComplete', () => {
      gsap.set(root.value, { autoAlpha: 0, pointerEvents: 'none' })
      resolve()
    })
  })
}

onBeforeUnmount(() => {
  activeTimeline?.kill()
  context?.revert()
})

defineExpose({ play })
</script>

<template>
  <div ref="root" class="ink-transition" aria-hidden="true">
    <div class="ink-transition__wash"></div>
    <svg class="ink-transition__filter" width="0" height="0" focusable="false">
      <filter id="ink-transition-noise">
        <feTurbulence type="fractalNoise" baseFrequency=".012 .08" numOctaves="3" seed="8" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="34" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
    <div class="ink-transition__grain"></div>
  </div>
</template>
