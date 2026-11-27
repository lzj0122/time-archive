import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'

export function useTimelineSpring(rootRef, { isIntroPlaying, onSelect, onOpen, onProgress, years = Array.from({ length: 6 }, (_, index) => String(1919 + index)) }) {
  const activeIndex = ref(0)
  let track
  let ridgeLine
  let progressLine
  let cursor
  let ridgeLength = 0
  let target = 0
  let current = 0
  let dragging = false
  let pointerId = null
  let startX = 0
  let startY = 0
  let moved = false
  let frameId = null
  let lastActive = -1
  let hasInteracted = false

  const nodeCount = 6
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  function snapToNode(value) {
    return gsap.utils.snap(1 / (nodeCount - 1), value)
  }

  function setActive(index, emit = true) {
    const next = gsap.utils.clamp(0, nodeCount - 1, Math.round(index))
    activeIndex.value = next
    if (next === lastActive) return
    lastActive = next

    rootRef.value?.querySelectorAll('.ridge-node').forEach((node, nodeIndex) => {
      node.classList.toggle('is-active', nodeIndex === next)
    })
    rootRef.value?.querySelectorAll('.timeline-items span').forEach((item, itemIndex) => {
      item.classList.toggle('is-active', itemIndex === next)
    })
    track?.setAttribute('aria-valuenow', years[next])
    track?.setAttribute('aria-valuetext', `${years[next]} 年`)
    if (emit) onSelect?.(next)
  }

  function updateScene() {
    const progress = gsap.utils.clamp(0, 1, current)
    if (ridgeLine && ridgeLength && hasInteracted) {
      ridgeLine.style.strokeDashoffset = String(ridgeLength * (1 - progress))
    }
    if (progressLine) progressLine.style.transform = `scaleX(${progress})`
    if (cursor) cursor.style.left = `${progress * 100}%`
    if (hasInteracted) onProgress?.(progress)
    setActive(progress * (nodeCount - 1), false)
  }

  function loop() {
    if (isIntroPlaying.value) {
      frameId = requestAnimationFrame(loop)
      return
    }
    if (reducedMotion.matches) current = target
    else current += (target - current) * 0.12
    if (Math.abs(target - current) < 0.0001) current = target
    updateScene()
    frameId = requestAnimationFrame(loop)
  }

  function updateTarget(clientX) {
    if (!track) return
    const rect = track.getBoundingClientRect()
    target = gsap.utils.clamp(0, 1, (clientX - rect.left) / rect.width)
  }

  function onPointerDown(event) {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    dragging = true
    hasInteracted = true
    moved = false
    pointerId = event.pointerId
    startX = event.clientX
    startY = event.clientY
    track.setPointerCapture(pointerId)
    updateTarget(event.clientX)
  }

  function onPointerMove(event) {
    if (!dragging || event.pointerId !== pointerId) return
    if (Math.hypot(event.clientX - startX, event.clientY - startY) > 5) moved = true
    updateTarget(event.clientX)
  }

  function onPointerUp(event) {
    if (!dragging || event.pointerId !== pointerId) return
    dragging = false
    if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId)
    pointerId = null

    if (!moved) {
      const rect = track.getBoundingClientRect()
      const raw = gsap.utils.clamp(0, 1, (event.clientX - rect.left) / rect.width)
      const index = Math.round(raw * (nodeCount - 1))
      target = index / (nodeCount - 1)
      setActive(index)
      onOpen?.(index)
      return
    }

    target = snapToNode(target)
    const index = Math.round(target * (nodeCount - 1))
    setActive(index)
  }

  function onPointerCancel(event) {
    if (!dragging || event.pointerId !== pointerId) return
    dragging = false
    if (track.hasPointerCapture(pointerId)) track.releasePointerCapture(pointerId)
    pointerId = null
    target = snapToNode(current)
    setActive(Math.round(target * (nodeCount - 1)))
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const direction = event.key === 'ArrowRight' ? 1 : -1
      hasInteracted = true
      const index = gsap.utils.clamp(0, nodeCount - 1, activeIndex.value + direction)
      target = index / (nodeCount - 1)
      setActive(index)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen?.(activeIndex.value)
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      const index = event.key === 'Home' ? 0 : nodeCount - 1
      hasInteracted = true
      target = index / (nodeCount - 1)
      setActive(index)
    }
  }

  onMounted(async () => {
    await nextTick()
    const root = rootRef.value
    if (!root) return

    track = root.querySelector('.timeline-strip')
    ridgeLine = root.querySelector('.ridge-line')
    progressLine = root.querySelector('.timeline-progress')
    cursor = root.querySelector('.timeline-cursor')
    if (!track) return

    ridgeLength = ridgeLine?.getTotalLength?.() || 0
    if (ridgeLine && ridgeLength) {
      ridgeLine.style.strokeDasharray = String(ridgeLength)
      ridgeLine.style.strokeDashoffset = reducedMotion.matches ? '0' : String(ridgeLength)
    }

    track.addEventListener('pointerdown', onPointerDown)
    track.addEventListener('pointermove', onPointerMove)
    track.addEventListener('pointerup', onPointerUp)
    track.addEventListener('pointercancel', onPointerCancel)
    track.addEventListener('keydown', onKeyDown)
    setActive(0, false)
    frameId = requestAnimationFrame(loop)
  })

  onBeforeUnmount(() => {
    if (frameId) cancelAnimationFrame(frameId)
    track?.removeEventListener('pointerdown', onPointerDown)
    track?.removeEventListener('pointermove', onPointerMove)
    track?.removeEventListener('pointerup', onPointerUp)
    track?.removeEventListener('pointercancel', onPointerCancel)
    track?.removeEventListener('keydown', onKeyDown)
  })

  return { activeIndex }
}
