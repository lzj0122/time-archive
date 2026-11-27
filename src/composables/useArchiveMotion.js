import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'

export function useArchiveMotion(rootRef) {
  const isIntroPlaying = ref(false)
  let context
  let intro
  let removePointerListeners = () => {}
  const hoverCleanups = []

  function finishIntro() {
    isIntroPlaying.value = false
    if (!intro) return
    intro.progress(1)
  }

  function addNodeHover(root) {
    root.querySelectorAll('.ridge-node').forEach((node) => {
      const visual = node.querySelector('.node-visual')
      if (!visual) return

      const enter = () => {
        if (isIntroPlaying.value) return
        gsap.to(visual, { scale: 1.15, duration: 0.2, ease: 'power2.out', overwrite: 'auto' })
      }
      const leave = () => {
        if (isIntroPlaying.value) return
        gsap.to(visual, { scale: 1, duration: 0.2, ease: 'power2.out', overwrite: 'auto' })
      }

      node.addEventListener('pointerenter', enter)
      node.addEventListener('pointerleave', leave)
      hoverCleanups.push(() => {
        node.removeEventListener('pointerenter', enter)
        node.removeEventListener('pointerleave', leave)
      })
    })
  }

  function addPointerParallax(root) {
    if (!window.matchMedia('(pointer: fine)').matches) return

    const layers = [
      { element: root.querySelector('.background-layer'), x: 7, y: 4 },
      { element: root.querySelector('.scene-layer'), x: 14, y: 8 },
      { element: root.querySelector('.dossier-layer'), x: 22, y: 12 },
    ].filter((layer) => layer.element)

    const movers = layers.map((layer) => ({
      ...layer,
      xTo: gsap.quickTo(layer.element, 'x', { duration: 1.1, ease: 'power3.out' }),
      yTo: gsap.quickTo(layer.element, 'y', { duration: 1.1, ease: 'power3.out' }),
    }))

    const move = (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2
      const y = (event.clientY / window.innerHeight - 0.5) * 2
      movers.forEach((layer) => {
        layer.xTo(x * layer.x)
        layer.yTo(y * layer.y)
      })
    }
    const reset = () => movers.forEach((layer) => {
      layer.xTo(0)
      layer.yTo(0)
    })

    root.addEventListener('pointermove', move)
    root.addEventListener('pointerleave', reset)
    removePointerListeners = () => {
      root.removeEventListener('pointermove', move)
      root.removeEventListener('pointerleave', reset)
    }
  }

  onMounted(async () => {
    await nextTick()
    const root = rootRef.value
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    isIntroPlaying.value = true

    context = gsap.context(() => {
      const select = gsap.utils.selector(root)
      const ridgeLines = select('.ridge-line')
      const nodeVisuals = select('.node-visual')

      ridgeLines.forEach((line) => {
        const length = line.getTotalLength()
        gsap.set(line, { strokeDasharray: length, strokeDashoffset: length })
      })
      gsap.set(select('.vignette'), { opacity: 0 })
      gsap.set(nodeVisuals, { scale: 0, opacity: 0, transformOrigin: '50% 50%' })
      gsap.set(select('.hero-title .line > span'), { yPercent: 120, opacity: 0 })
      gsap.set(select('.hero-sub, .hero-actions'), { y: 18, opacity: 0 })
      gsap.set(select('.dossier'), { y: 36, opacity: 0 })

      intro = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: () => {
          isIntroPlaying.value = false
          gsap.set(nodeVisuals, { clearProps: 'transform,opacity' })
        },
      })

      intro
        .to(select('.vignette'), { opacity: 1, duration: 0.8 }, 0)
        .to(ridgeLines, { strokeDashoffset: 0, duration: 1.2, stagger: 0.06, ease: 'power2.inOut' }, 0.3)
        .to(nodeVisuals, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(1.7)' }, 0.8)
        .to(select('.hero-title .line > span'), { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.1 }, 1)
        .to(select('.hero-sub, .hero-actions'), { y: 0, opacity: 1, duration: 0.6, stagger: 0.08 }, 1.4)
        .to(select('.dossier'), { y: 0, opacity: 1, duration: 0.8, stagger: 0.06 }, 1.45)

      gsap.to(select('.dust-field'), {
        yPercent: -2,
        duration: 12,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
      gsap.to(select('.dossier-card'), {
        y: -8,
        rotateZ: 0.4,
        duration: 4,
        stagger: 0.35,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
      gsap.fromTo(select('.node-glow'),
        { scale: 1, opacity: 0.24 },
        {
          scale: 1.18,
          opacity: 0.55,
          duration: 2.4,
          stagger: 0.18,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          transformOrigin: '50% 50%',
        },
      )
    }, root)

    addNodeHover(root)
    addPointerParallax(root)
  })

  onBeforeUnmount(() => {
    removePointerListeners()
    hoverCleanups.forEach((cleanup) => cleanup())
    context?.revert()
  })

  return { isIntroPlaying, skipIntro: finishIntro }
}
