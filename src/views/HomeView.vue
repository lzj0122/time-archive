<script setup>
import { computed, inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import ArchiveSeal from '../components/ArchiveSeal.vue'
import ThreeRidge from '../components/ThreeRidge.vue'
import { useArchiveMotion } from '../composables/useArchiveMotion'
import { useHomeScroll } from '../composables/useHomeScroll'
import { useTimelineSpring } from '../composables/useTimelineSpring'

const router = useRouter()
const navigateWithInk = inject('navigateWithInk', null)
const pageRef = ref(null)
const homeRef = ref(null)
const sealRef = ref(null)
const ridgeScene = ref(null)

const { isIntroPlaying, skipIntro } = useArchiveMotion(homeRef)
useHomeScroll(pageRef, {
  onProgress: (progress) => ridgeScene.value?.setScrollProgress(progress),
})

const ridgeNodes = [
  { year: '1919', x: 80, y: 540 },
  { year: '1921', x: 230, y: 505 },
  { year: '1949', x: 380, y: 515 },
  { year: '1964', x: 530, y: 455 },
  { year: '1978', x: 680, y: 475 },
  { year: '2020', x: 830, y: 430 },
]

const indexItems = [
  { id: '1919', year: '1919', title: '五四', note: '觉醒 · 青年走上街头', function: '觉醒' },
  { id: '1921', year: '1921', title: '建党', note: '开天辟地 · 新的起点', function: '开天辟地' },
  { id: '1949', year: '1949', title: '开国', note: '站立 · 新的中国', function: '站立' },
  { id: '1964', year: '1964', title: '原子弹', note: '争气 · 自力更生', function: '争气' },
  { id: '1978', year: '1978', title: '改革开放', note: '追赶 · 走向世界', function: '追赶' },
  { id: '2020', year: '2020', title: '北斗', note: '自强 · 仰望星空', function: '自强' },
]

const dossiers = indexItems.slice(0, 3)

const dust = Array.from({ length: 18 }, (_, index) => ({
  left: `${(index * 37 + 11) % 100}%`,
  top: `${(index * 53 + 7) % 100}%`,
  size: index % 4 === 0 ? '2px' : '1px',
  delay: `${-(index % 7) * 0.8}s`,
  opacity: 0.14 + (index % 4) * 0.08,
}))

function openEvent(id) {
  const to = `/event/${id}`
  if (navigateWithInk) navigateWithInk(to)
  else router.push(to)
}

function openRoute(path) {
  if (navigateWithInk) navigateWithInk(path)
  else router.push(path)
}

function handleTimelineSelect(index) {
  sealRef.value?.play()
  ridgeScene.value?.ignite(index)
}

const { activeIndex } = useTimelineSpring(homeRef, {
  isIntroPlaying,
  onSelect: handleTimelineSelect,
  onOpen: (index) => openEvent(ridgeNodes[index].year),
  onProgress: (progress) => ridgeScene.value?.setTimelineProgress(progress),
  years: ridgeNodes.map((node) => node.year),
})

const activeEventId = computed(() => ridgeNodes[activeIndex.value]?.year || '1919')
</script>

<template>
  <div ref="pageRef" class="home-route">
    <section ref="homeRef" class="archive-home" aria-labelledby="home-title">
      <div class="background-layer" aria-hidden="true">
        <div class="horizon-glow"></div>
        <div class="vignette"></div>
        <div class="paper-grain"></div>
        <div class="dust-field">
          <span
            v-for="(particle, index) in dust"
            :key="index"
            class="dust-particle"
            :style="{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
              animationDelay: particle.delay,
            }"
          ></span>
        </div>
      </div>

      <div class="archive-meta archive-meta--left" aria-hidden="true">
        <span>N 39°54′</span>
        <span>E 116°24′</span>
      </div>
      <div class="archive-meta archive-meta--right" aria-hidden="true">
        <span>VOL. 01</span>
        <span>1919 — 2020</span>
      </div>

      <div class="hero-copy">
        <p class="eyebrow"><span class="eyebrow-line"></span>夜航档案馆 · 第一卷</p>
        <h1 id="home-title" class="hero-title">
          <span class="line"><span>知来路，</span></span>
          <span class="line"><span><em>明去处。</em></span></span>
        </h1>
        <p class="hero-sub">六段历史，六封未寄出的信。<br />沿时间山脊，走进现场。</p>
        <div class="hero-actions">
          <button class="button button-primary" type="button" @click="openEvent(activeEventId)">
            <span>开启 {{ activeEventId }} 档案</span>
            <span class="button-arrow" aria-hidden="true">↗</span>
          </button>
          <button class="button button-quiet" type="button" @click="openRoute('/summit')">
            <span>前往山顶</span>
            <span class="button-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div class="scene-layer" aria-hidden="true">
        <ThreeRidge ref="ridgeScene" />
        <svg class="ridge-scene" viewBox="0 0 900 620" fill="none">
          <defs>
            <linearGradient id="mountainBack" x1="450" y1="180" x2="450" y2="620" gradientUnits="userSpaceOnUse">
              <stop stop-color="#315873" />
              <stop offset="1" stop-color="#17364f" />
            </linearGradient>
            <linearGradient id="mountainMid" x1="450" y1="300" x2="450" y2="620" gradientUnits="userSpaceOnUse">
              <stop stop-color="#234963" />
              <stop offset="1" stop-color="#102a40" />
            </linearGradient>
            <linearGradient id="mountainFront" x1="450" y1="430" x2="450" y2="620" gradientUnits="userSpaceOnUse">
              <stop stop-color="#142f46" />
              <stop offset="1" stop-color="#091b2b" />
            </linearGradient>
            <linearGradient id="ridgeGold" x1="80" y1="540" x2="830" y2="430" gradientUnits="userSpaceOnUse">
              <stop stop-color="#b88743" />
              <stop offset="0.5" stop-color="#f0d28d" />
              <stop offset="1" stop-color="#b88743" />
            </linearGradient>
            <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx="716" cy="126" r="54" fill="#d8b56a" opacity=".08" />
          <circle cx="716" cy="126" r="38" fill="#e8d7ae" opacity=".12" />
          <g fill="#e8d7ae">
            <circle cx="148" cy="154" r="1" opacity=".5" />
            <circle cx="286" cy="98" r="1.2" opacity=".35" />
            <circle cx="412" cy="172" r="1" opacity=".45" />
            <circle cx="548" cy="112" r="1" opacity=".3" />
            <circle cx="812" cy="208" r="1.2" opacity=".4" />
            <circle cx="642" cy="224" r="1" opacity=".25" />
          </g>

          <path d="M0 468L116 346L208 408L356 188L470 358L590 248L720 388L900 300V620H0V468Z" fill="url(#mountainBack)" />
          <path d="M0 520L148 420L280 500L430 300L560 470L700 380L900 500V620H0V520Z" fill="url(#mountainMid)" />
          <path d="M0 570L180 500L350 560L520 420L680 540L900 470V620H0V570Z" fill="url(#mountainFront)" />

          <path d="M116 346L208 408L356 188L470 358L590 248L720 388" stroke="#8ba0ad" stroke-opacity=".14" />
          <path d="M148 420L280 500L430 300L560 470L700 380" stroke="#8ba0ad" stroke-opacity=".12" />
          <path d="M180 500L350 560L520 420L680 540" stroke="#8ba0ad" stroke-opacity=".1" />

          <path
            class="ridge-line-base"
            d="M80 540C150 528 190 505 230 505S310 522 380 515S480 470 530 455S620 482 680 475S780 445 830 430"
            stroke="url(#ridgeGold)"
            stroke-width="1.2"
            stroke-linecap="round"
            opacity=".22"
          />
          <path
            class="ridge-line"
            d="M80 540C150 528 190 505 230 505S310 522 380 515S480 470 530 455S620 482 680 475S780 445 830 430"
            stroke="url(#ridgeGold)"
            stroke-width="1.8"
            stroke-linecap="round"
            filter="url(#goldGlow)"
          />

          <g
            v-for="(node, index) in ridgeNodes"
            :key="node.year"
            class="ridge-node"
            :class="{ 'is-active': index === activeIndex }"
            :transform="`translate(${node.x} ${node.y})`"
            @click="openEvent(node.year)"
          >
            <g class="node-visual">
              <circle class="node-glow" r="12" fill="#d8b56a" fill-opacity=".16" stroke="#d8b56a" stroke-opacity=".32" />
              <circle class="node-core" r="3.5" :fill="index === activeIndex ? '#e15b45' : '#d8b56a'" />
              <text x="0" y="29" text-anchor="middle" :fill="index === activeIndex ? '#f0d28d' : '#b7c4cb'" font-size="11" letter-spacing="1.5">{{ node.year }}</text>
            </g>
          </g>
        </svg>

        <div class="scene-caption">
          <span>时间山脊</span>
          <small>THE RIDGE OF TIME</small>
        </div>
      </div>

      <div class="dossier-layer">
        <article
          v-for="(dossier, index) in dossiers"
          :key="dossier.year"
          class="dossier"
          :class="[
            index === 0 ? 'dossier--back' : '',
            index === 1 ? 'dossier--middle' : '',
            index === 2 ? 'dossier--main' : '',
          ]"
        >
          <div class="dossier-card">
            <div class="dossier-face">
              <header class="dossier-header">
                <span>ARCHIVE 0{{ index + 1 }}</span>
                <span>{{ dossier.year }}</span>
              </header>
              <div class="dossier-body">
                <div>
                  <h2>{{ dossier.title }}</h2>
                  <p>{{ dossier.note }}</p>
                </div>
                <span class="dossier-seal" aria-hidden="true">{{ dossier.function }}</span>
              </div>
              <footer class="dossier-footer">
                <span>待阅</span>
                <span>0{{ index + 1 }} / 06</span>
              </footer>
            </div>
          </div>
        </article>
      </div>

      <div
        class="timeline-strip"
        role="slider"
        tabindex="0"
        aria-label="历史时间轴，拖动或使用左右方向键选择年份"
        aria-valuemin="1919"
        aria-valuemax="2020"
        :aria-valuenow="Number(activeEventId)"
        :aria-valuetext="`${activeEventId} 年`"
      >
        <div class="timeline-rule" aria-hidden="true">
          <span class="timeline-progress"></span>
          <span class="timeline-cursor"></span>
        </div>
        <div class="timeline-items" aria-hidden="true">
          <span v-for="(node, index) in ridgeNodes" :key="node.year" :class="{ 'is-active': index === activeIndex }">
            <i></i>{{ node.year }}
          </span>
        </div>
      </div>

      <ArchiveSeal ref="sealRef" />

      <button v-if="isIntroPlaying" class="motion-skip" type="button" @click="skipIntro">
        跳过入场
      </button>
    </section>

    <section class="archive-index" aria-labelledby="index-title">
      <div class="archive-index__inner">
        <header class="index-heading">
          <div>
            <p class="eyebrow"><span class="eyebrow-line"></span>卷宗索引 · 1919—2020</p>
            <h2 id="index-title">六座现场，<br />沿山脊展开。</h2>
          </div>
          <p>选择一份档案，从背景走进现场。<br />每一段历史，都留下可以继续追问的线索。</p>
        </header>

        <div class="index-progress" aria-hidden="true"><span></span></div>

        <div class="index-list">
          <button
            v-for="(item, index) in indexItems"
            :key="item.id"
            class="index-row"
            type="button"
            @click="openEvent(item.id)"
          >
            <span class="index-number">0{{ index + 1 }}</span>
            <span class="index-year">{{ item.year }}</span>
            <span class="index-title">{{ item.title }}</span>
            <span class="index-note">{{ item.note }}</span>
            <span class="index-arrow" aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
