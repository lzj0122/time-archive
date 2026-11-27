<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import DualAgentChat from '../components/DualAgentChat.vue'
import KnowledgeGraph from '../components/KnowledgeGraph.vue'
import { useEventStore } from '../stores/event'

const route = useRoute()
const eventStore = useEventStore()
const graphRef = ref(null)

const eventData = computed(() => eventStore.currentEvent)

watch(
  () => route.params.id,
  (id) => eventStore.setCurrentEvent(id),
  { immediate: true },
)

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
      </article>
      <article class="archive-panel letter-panel">
        <span class="panel-index">02</span>
        <h2>第一人称信</h2>
        <p>信件内容将在内容阶段接入。</p>
      </article>
      <article class="archive-panel media-panel">
        <span class="panel-index">03</span>
        <h2>影像与声音</h2>
        <p>史料影像将在内容阶段接入。</p>
      </article>
      <article class="archive-panel graph-panel">
        <span class="panel-index">04</span>
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
        <span class="panel-index">05</span>
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
        <span class="panel-index">06</span>
        <h2>史料来源</h2>
        <ul class="source-list">
          <li v-for="source in eventData.sources" :key="source.id">
            <span>{{ source.id }}</span>
            <div>
              <strong>{{ source.title }}</strong>
              <small>{{ source.author }} · {{ source.publisher }} · {{ source.year }}</small>
            </div>
          </li>
        </ul>
      </article>
    </div>
  </section>
</template>
