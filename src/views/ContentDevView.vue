<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useEventStore } from '../stores/event'
import mediaManifest from '../data/media.json'
import sourcesManifest from '../data/sources.json'

const eventStore = useEventStore()

function mediaEntries(event) {
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
}

function completeness(event) {
  const entries = mediaEntries(event)
  const readyMedia = entries.filter((item) => item.status === 'ready').length
  const sections = {
    facts: event.facts.length >= 3 && event.facts.every((fact) => fact.sourceId),
    letter: Boolean(event.letter.body && event.letter.disclaimer?.includes('文学化演绎')),
    graph: event.graph.nodes.length >= 8 && event.graph.links.length > 0,
    media: readyMedia === entries.length,
    agents: Boolean(
      event.agents.witness.prompt
      && event.agents.witness.disclaimer?.includes('虚构')
      && event.agents.historian.prompt
      && event.agents.historian.citationRequired,
    ),
  }

  return {
    ...sections,
    mediaReady: readyMedia,
    mediaTotal: entries.length,
    missingMedia: entries.filter((item) => item.status !== 'ready'),
    completeCount: Object.values(sections).filter(Boolean).length,
  }
}

const rows = computed(() => eventStore.loadEvents().map((event) => ({
  event,
  check: completeness(event),
  sourceCount: sourcesManifest[event.id]?.length || 0,
})))
</script>

<template>
  <section class="page content-dev-page" aria-labelledby="content-dev-title">
    <header class="content-dev-heading">
      <div>
        <p class="eyebrow">CONTENT QA / DEVELOPMENT PREVIEW</p>
        <h1 id="content-dev-title">内容完整度预览</h1>
        <p class="page-lead">
          只检查六份事件 JSON、史料来源与媒体清单，不改变正式事件页。媒体未完成时保留明确缺失项，不以来源不明素材补位。
        </p>
      </div>
      <RouterLink class="button button-quiet" to="/">返回时间山脊</RouterLink>
    </header>

    <div class="content-dev-summary" aria-label="内容校验摘要">
      <span><strong>{{ rows.length }}</strong> 个事件</span>
      <span><strong>{{ rows.reduce((sum, row) => sum + row.check.completeCount, 0) }} / 30</strong> 个分区完整</span>
      <span><strong>{{ rows.reduce((sum, row) => sum + row.check.mediaReady, 0) }} / {{ rows.reduce((sum, row) => sum + row.check.mediaTotal, 0) }}</strong> 项媒体可用</span>
    </div>

    <div class="content-dev-list">
      <article v-for="row in rows" :key="row.event.id" class="content-dev-card">
        <header class="content-dev-card__heading">
          <div>
            <p class="content-dev-card__index">EVENT {{ row.event.year }}</p>
            <h2>{{ row.event.title }} <span>{{ row.event.subtitle }}</span></h2>
          </div>
          <div class="content-dev-card__score" :class="{ 'is-complete': row.check.completeCount === 5 }">
            {{ row.check.completeCount }}/5
          </div>
        </header>

        <p class="content-dev-card__summary">{{ row.event.summary }}</p>

        <dl class="content-dev-checks">
          <div :class="{ 'is-ready': row.check.facts }">
            <dt>史料事实</dt>
            <dd>{{ row.check.facts ? `${row.event.facts.length} 条已引用` : '待补齐' }}</dd>
          </div>
          <div :class="{ 'is-ready': row.check.letter }">
            <dt>第一人称信</dt>
            <dd>{{ row.check.letter ? '已标注演绎' : '待补齐' }}</dd>
          </div>
          <div :class="{ 'is-ready': row.check.graph }">
            <dt>知识图谱</dt>
            <dd>{{ row.event.graph.nodes.length }} 节点 / {{ row.event.graph.links.length }} 边</dd>
          </div>
          <div :class="{ 'is-ready': row.check.media }">
            <dt>媒体</dt>
            <dd>{{ row.check.mediaReady }}/{{ row.check.mediaTotal }} 可用</dd>
          </div>
          <div :class="{ 'is-ready': row.check.agents }">
            <dt>双声档案员</dt>
            <dd>{{ row.check.agents ? '角色与引用约束齐备' : '待补齐' }}</dd>
          </div>
        </dl>

        <div class="content-dev-card__footer">
          <span>{{ row.sourceCount }} 条来源 · {{ row.event.location.name }}</span>
          <RouterLink :to="`/event/${row.event.id}`">打开事件档案</RouterLink>
        </div>

        <details v-if="row.check.missingMedia.length" class="content-dev-missing">
          <summary>查看 {{ row.check.missingMedia.length }} 项媒体缺失</summary>
          <ul>
            <li v-for="item in row.check.missingMedia" :key="item.id">
              <strong>{{ item.title || item.id }}</strong>
              <span>{{ item.reason }}</span>
            </li>
          </ul>
        </details>
      </article>
    </div>
  </section>
</template>
