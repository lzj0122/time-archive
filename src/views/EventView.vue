<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import DualAgentChat from '../components/DualAgentChat.vue'
import KnowledgeGraph from '../components/KnowledgeGraph.vue'
import mediaManifest from '../data/media.json'
import { useEventStore } from '../stores/event'
import { useSettingsStore } from '../stores/settings'

const route = useRoute()
const eventStore = useEventStore()
const settingsStore = useSettingsStore()
const graphRef = ref(null)
const failedMedia = ref([])

const eventData = computed(() => eventStore.currentEvent)

const mediaEntries = computed(() => {
  const event = eventData.value
  if (!event) return []

  const ids = [
    event.media.hero,
    ...event.media.gallery,
    event.media.video,
    event.audio.ambient,
  ].filter(Boolean)

  return ids.map((id) => mediaManifest[event.id]?.find((item) => item.id === id) || {
    id,
    status: 'missing',
    reason: '媒体清单中不存在该引用。',
  })
})

const heroMedia = computed(() => mediaEntries.value.find((item) => item.id === eventData.value?.media.hero))
const galleryMedia = computed(() => eventData.value?.media.gallery
  .map((id) => mediaEntries.value.find((item) => item.id === id))
  .filter(Boolean))
const auxiliaryMedia = computed(() => [eventData.value?.media.video, eventData.value?.audio.ambient]
  .filter(Boolean)
  .map((id) => mediaEntries.value.find((item) => item.id === id))
  .filter(Boolean))

watch(
  () => route.params.id,
  (id) => {
    failedMedia.value = []
    eventStore.setCurrentEvent(id)
  },
  { immediate: true },
)

function mediaAvailable(item) {
  return item?.status === 'ready' && item.localPath && !failedMedia.value.includes(item.id)
}

function markMediaFailed(id) {
  if (!failedMedia.value.includes(id)) failedMedia.value.push(id)
}

function scrollToSource(id) {
  const target = document.getElementById(`source-${id}`)
  target?.scrollIntoView({
    behavior: settingsStore.reducedMotion ? 'auto' : 'smooth',
    block: 'center',
  })
  target?.focus({ preventScroll: true })
}

function handleCitations(ids) {
  graphRef.value?.highlightNodes(ids)
}
</script>

<template>
  <section v-if="eventData" class="page event-page" aria-labelledby="event-title">
    <header class="event-heading">
      <div class="event-heading__copy">
        <p class="eyebrow">EVENT ARCHIVE / {{ eventData.year }}</p>
        <div class="event-title-row">
          <h1 id="event-title">{{ eventData.title }}</h1>
          <span class="event-subtitle">{{ eventData.subtitle }}</span>
        </div>
        <p class="page-lead">{{ eventData.summary }}</p>
      </div>
      <div class="event-heading__aside">
        <RouterLink class="button button-quiet" to="/">返回时间山脊</RouterLink>
        <span>{{ eventData.location.name }}</span>
      </div>
    </header>

    <div class="archive-grid">
      <article class="archive-panel character-panel">
        <span class="panel-index">01</span>
        <h2>现场坐标</h2>
        <p>{{ eventData.location.name }}</p>
        <small class="coordinate">{{ eventData.location.lng.toFixed(4) }}° E / {{ eventData.location.lat.toFixed(4) }}° N</small>
      </article>

      <article class="archive-panel facts-panel">
        <span class="panel-index">02</span>
        <h2>史料事实</h2>
        <ol class="fact-list">
          <li v-for="(fact, index) in eventData.facts" :key="`${fact.sourceId}-${index}`">
            <span class="fact-number">{{ String(index + 1).padStart(2, '0') }}</span>
            <p>{{ fact.text }}</p>
            <button class="fact-source" type="button" @click="scrollToSource(fact.sourceId)">
              {{ fact.sourceId }}
            </button>
          </li>
        </ol>
      </article>

      <article class="archive-panel letter-panel">
        <span class="panel-index">03</span>
        <h2>第一人称信</h2>
        <div class="letter-meta">
          <strong>{{ eventData.letter.author }}</strong>
          <span>{{ eventData.letter.role }}</span>
          <time>{{ eventData.letter.date }}</time>
        </div>
        <blockquote class="letter-body">{{ eventData.letter.body }}</blockquote>
        <p class="letter-disclaimer">{{ eventData.letter.disclaimer }}</p>
      </article>

      <article class="archive-panel media-panel">
        <span class="panel-index">04</span>
        <h2>影像与声音</h2>
        <figure v-if="mediaAvailable(heroMedia)" class="media-figure media-figure--hero">
          <img
            :src="heroMedia.localPath"
            :alt="heroMedia.caption || heroMedia.title"
            decoding="async"
            @error="markMediaFailed(heroMedia.id)"
          >
          <figcaption>{{ heroMedia.caption || heroMedia.title }}</figcaption>
          <small>{{ heroMedia.credit }} · {{ heroMedia.license }}</small>
        </figure>
        <div v-else class="media-placeholder media-placeholder--hero" role="status">
          <strong>主视觉待补</strong>
          <span>{{ heroMedia?.reason || '尚未核实可使用的公版素材。' }}</span>
        </div>

        <div class="media-gallery">
          <template v-for="item in galleryMedia" :key="item.id">
            <figure v-if="mediaAvailable(item)" class="media-figure">
              <img
                :src="item.localPath"
                :alt="item.caption || item.title"
                loading="lazy"
                decoding="async"
                @error="markMediaFailed(item.id)"
              >
              <figcaption>{{ item.caption || item.title }}</figcaption>
              <small>{{ item.credit }} · {{ item.license }}</small>
            </figure>
            <div v-else class="media-placeholder" role="status">
              <strong>{{ item.title || '史料图待补' }}</strong>
              <span>{{ item.reason || '尚未核实可使用的公版素材。' }}</span>
            </div>
          </template>
        </div>

        <ul class="media-auxiliary">
          <li v-for="item in auxiliaryMedia" :key="item.id">
            <span>{{ item.title || item.id }}</span>
            <strong :class="{ 'is-ready': item.status === 'ready' }">{{ item.status === 'ready' ? '已就绪' : '待补' }}</strong>
          </li>
        </ul>
      </article>

      <article class="archive-panel data-panel">
        <span class="panel-index">05</span>
        <h2>档案数据</h2>
        <dl class="data-list">
          <div v-for="item in eventData.data" :key="`${item.label}-${item.year}`" class="data-item">
            <dt>{{ item.label }}</dt>
            <dd>
              <strong>{{ item.value }}{{ item.unit }}</strong>
              <span>{{ item.year }}</span>
              <button class="fact-source" type="button" @click="scrollToSource(item.sourceId)">
                {{ item.sourceId }}
              </button>
            </dd>
          </div>
        </dl>
      </article>

      <article class="archive-panel graph-panel">
        <span class="panel-index">06</span>
        <div class="panel-heading">
          <div>
            <h2>知识图谱</h2>
            <p>把事件放回人物、地点与思想的连接中。</p>
          </div>
          <span class="panel-tag">{{ eventData.graph.nodes.length }} NODES</span>
        </div>
        <KnowledgeGraph ref="graphRef" :graph="eventData.graph" :title="`${eventData.title}知识图谱`" />
      </article>

      <article class="archive-panel chat-panel">
        <span class="panel-index">07</span>
        <div class="panel-heading">
          <div>
            <h2>双声档案员</h2>
            <p>先听现场，再核对史料。两种声音，不互相代替。</p>
          </div>
          <span class="panel-tag panel-tag--accent">DEMO</span>
        </div>
        <DualAgentChat :event="eventData" @cite="handleCitations" />
      </article>

      <article class="archive-panel source-panel">
        <span class="panel-index">08</span>
        <h2>史料来源</h2>
        <ul class="source-list">
          <li
            v-for="source in eventData.sources"
            :id="`source-${source.id}`"
            :key="source.id"
            tabindex="-1"
          >
            <span>{{ source.id }}</span>
            <div>
              <strong>{{ source.title }}</strong>
              <small>{{ source.author }} · {{ source.publisher }} · {{ source.year }}</small>
              <a v-if="source.url" :href="source.url" target="_blank" rel="noreferrer">查看来源</a>
            </div>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>
