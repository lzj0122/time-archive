<script setup>
import { computed, provide, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import InkTransition from './components/InkTransition.vue'
import { useProgressStore } from './stores/progress'

const route = useRoute()
const router = useRouter()
const progress = useProgressStore()
const inkTransition = ref(null)
const isHome = computed(() => route.path === '/')
const years = ['1919', '1921', '1949', '1964', '1978', '2020']

async function navigateWithInk(to) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !inkTransition.value) {
    await router.push(to)
    return
  }
  await inkTransition.value.play(() => router.push(to))
}

provide('navigateWithInk', navigateWithInk)
</script>

<template>
  <div class="app-shell" :class="{ 'is-home': isHome }">
    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="时空档案首页">
        <span class="brand-seal" aria-hidden="true">时</span>
        <span class="brand-copy">
          <strong>时空档案</strong>
          <small>TIME ARCHIVE</small>
        </span>
      </RouterLink>

      <nav class="site-nav" aria-label="主导航">
        <RouterLink to="/"><span>01</span>时间山脊</RouterLink>
        <RouterLink to="/event/1919"><span>02</span>事件档案</RouterLink>
        <RouterLink to="/summit"><span>03</span>登顶</RouterLink>
      </nav>

      <div class="header-progress" aria-label="山脊点灯进度">
        <span class="progress-lights" aria-hidden="true">
          <i
            v-for="year in years"
            :key="year"
            :class="{ 'is-lit': progress.completedEvents.includes(year) }"
          ></i>
        </span>
        <span class="sr-only">已完成 {{ progress.completedEvents.length }} / 6</span>
      </div>
    </header>

    <main class="route-stage">
      <RouterView />
    </main>

    <footer v-if="!isHome" class="site-footer">
      <span>沿时间山脊，走进历史现场。</span>
      <span>第一卷 · 1919—2020</span>
    </footer>

    <InkTransition ref="inkTransition" />
  </div>
</template>
