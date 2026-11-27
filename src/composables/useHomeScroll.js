import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useHomeScroll(rootRef, { onProgress } = {}) {
  let context
  let scrollFrame = null
  let homeSection = null

  function updateProgress() {
    scrollFrame = null
    if (!homeSection) return
    const rect = homeSection.getBoundingClientRect()
    onProgress?.(gsap.utils.clamp(0, 1, -rect.top / rect.height))
  }

  function queueProgressUpdate() {
    if (scrollFrame !== null) return
    scrollFrame = requestAnimationFrame(updateProgress)
  }

  onMounted(async () => {
    await nextTick()
    const root = rootRef.value
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    homeSection = root.querySelector('.archive-home')
    updateProgress()
    window.addEventListener('scroll', queueProgressUpdate, { passive: true })
    window.addEventListener('resize', queueProgressUpdate)

    context = gsap.context(() => {
      const isMobile = window.matchMedia('(max-width: 640px)').matches

      gsap.to('.scene-layer', {
        yPercent: isMobile ? 0 : -10,
        ease: 'none',
        scrollTrigger: {
          trigger: '.archive-home',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => onProgress?.(self.progress),
        },
      })

      gsap.fromTo('.archive-index__inner',
        { clipPath: 'inset(10% 6% 10% 6% round 2px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0px)',
          ease: 'none',
          scrollTrigger: {
            trigger: '.archive-index',
            start: 'top bottom',
            end: 'top 22%',
            scrub: true,
          },
        },
      )

      gsap.fromTo('.index-progress span',
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: '.archive-index',
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true,
          },
        },
      )
    }, root)
  })

  onBeforeUnmount(() => {
    context?.revert()
    if (scrollFrame !== null) cancelAnimationFrame(scrollFrame)
    window.removeEventListener('scroll', queueProgressUpdate)
    window.removeEventListener('resize', queueProgressUpdate)
  })
}
