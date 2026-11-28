<script setup>
import { inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import ThreeSummit from '../components/ThreeSummit.vue'

const router = useRouter()
const navigateWithInk = inject('navigateWithInk', null)
const summitScene = ref(null)
const years = ['1919', '1921', '1949', '1964', '1978', '2020']

function go(path) {
  if (navigateWithInk) navigateWithInk(path)
  else router.push(path)
}
</script>

<template>
  <section class="page summit-page" aria-labelledby="summit-title">
    <div class="summit-copy">
      <p class="eyebrow">SUMMIT / SCENE STUDY</p>
      <h1 id="summit-title">山顶之外，<br /><em>还有更高的山。</em></h1>
      <p class="page-lead">镜头越过六盏灯，第二座山从雾里升起。六段历史依次点亮，回望来路，也继续向更高的山前行。</p>
      <div class="summit-lights" aria-label="六盏山脊灯">
        <span v-for="year in years" :key="year"><i></i>{{ year }}</span>
      </div>
      <div class="hero-actions">
        <button class="button button-primary" type="button" @click="summitScene?.replay()">重播登顶镜头</button>
        <button class="button button-quiet" type="button" @click="go('/')">返回时间山脊</button>
      </div>
    </div>

    <div class="summit-visual">
      <ThreeSummit ref="summitScene" />
      <div class="summit-moon" aria-hidden="true"></div>
      <div class="summit-peak peak-back" aria-hidden="true"></div>
      <div class="summit-peak peak-front" aria-hidden="true"></div>
      <div class="summit-caption">
        <span>SUMMIT SEQUENCE · 2.4S</span>
        <strong>知来路，明去处。</strong>
        <small>dolly zoom / 第二座山 / 六灯依次点亮</small>
      </div>
    </div>
  </section>
</template>
