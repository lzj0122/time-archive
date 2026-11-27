<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

const props = defineProps({
  graph: { type: Object, required: true },
  title: { type: String, default: '事件关系图谱' },
})

const chartRef = ref(null)
const rootRef = ref(null)
const pulseRef = ref(null)
const selectedId = ref(null)
const highlightedIds = ref([])
const chart = shallowRef(null)
const pulse = ref(null)
let echartsModules = null
let resizeObserver = null
let pulseTimer = null

const positionedNodes = computed(() => {
  const nodes = props.graph?.nodes || []
  return nodes.map((node, index) => {
    const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2
    const radiusX = index % 2 === 0 ? 30 : 23
    const radiusY = index % 2 === 0 ? 33 : 25
    return {
      ...node,
      x: 50 + Math.cos(angle) * radiusX,
      y: 50 + Math.sin(angle) * radiusY,
      symbolSize: index === 0 ? 58 : 44,
      itemStyle: {
        color: index === 0 ? '#c23525' : '#2a4b6e',
        borderColor: index === 0 ? '#f0c987' : '#f8f6f0',
        borderWidth: index === 0 ? 3 : 2,
        shadowBlur: highlightedIds.value.includes(node.id) ? 18 : 0,
        shadowColor: '#d8b56a',
      },
      label: {
        show: true,
        color: '#18344f',
        fontSize: 11,
        position: 'bottom',
        distance: 8,
      },
    }
  })
})

const positionedLinks = computed(() => {
  return (props.graph?.links || []).map((link) => {
    const active = highlightedIds.value.includes(link.source) || highlightedIds.value.includes(link.target)
    return {
      ...link,
      lineStyle: {
        color: active ? '#b88b45' : 'rgba(42, 75, 110, .25)',
        width: active ? 2.4 : 1,
        curveness: 0.12,
        opacity: active ? 1 : 0.75,
      },
      label: {
        show: active,
        color: '#8b6a36',
        fontSize: 10,
        backgroundColor: '#f8f6f0',
        padding: [2, 4],
      },
    }
  })
})

const selectedNode = computed(() => {
  return positionedNodes.value.find((node) => node.id === selectedId.value) || null
})

async function loadChart() {
  if (echartsModules) return echartsModules
  const [core, graphChart, tooltip, svgRenderer] = await Promise.all([
    import('echarts/core'),
    import('echarts/lib/chart/graph/install.js'),
    import('echarts/lib/component/tooltip/install.js'),
    import('echarts/lib/renderer/installSVGRenderer.js'),
  ])
  core.use([graphChart.install, tooltip.install, svgRenderer.install])
  echartsModules = core
  return core
}

function renderGraph() {
  if (!chart.value || !chartRef.value) return
  chart.value.setOption({
    animationDuration: 320,
    animationEasing: 'cubicOut',
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: '#18344f',
      borderWidth: 0,
      textStyle: { color: '#fffdf8', fontSize: 12 },
      formatter: (params) => {
        if (params.dataType === 'edge') return `${params.data.source} → ${params.data.target}<br/>${params.data.label || ''}`
        return `<strong>${params.name}</strong><br/>${params.data.description || ''}`
      },
    },
    series: [{
      type: 'graph',
      layout: 'none',
      roam: true,
      draggable: false,
      cursor: 'pointer',
      edgeSymbol: ['none', 'none'],
      data: positionedNodes.value,
      links: positionedLinks.value,
      emphasis: {
        focus: 'adjacency',
        scale: 1.08,
        lineStyle: { width: 3, color: '#b88b45' },
        label: { color: '#c23525' },
      },
    }],
  }, { notMerge: true })
}

function focusNode(id) {
  selectedId.value = id
  const node = positionedNodes.value.find((item) => item.id === id)
  if (!node) return
  highlightedIds.value = [id]
  renderGraph()
  chart.value?.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: positionedNodes.value.findIndex((item) => item.id === id) })
  if (pulseRef.value) {
    pulse.value = { left: `${node.x}%`, top: `${node.y}%`, key: performance.now() }
    window.clearTimeout(pulseTimer)
    pulseTimer = window.setTimeout(() => { pulse.value = null }, 650)
  }
}

function highlightNodes(ids) {
  const validIds = (ids || []).filter((id) => props.graph.nodes.some((node) => node.id === id))
  if (!validIds.length) return
  highlightedIds.value = validIds
  renderGraph()
  chart.value?.dispatchAction({ type: 'downplay', seriesIndex: 0 })
  validIds.forEach((id) => {
    const dataIndex = positionedNodes.value.findIndex((node) => node.id === id)
    if (dataIndex >= 0) chart.value?.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex })
  })
  focusNode(validIds[0])
}

onMounted(async () => {
  const core = await loadChart()
  await nextTick()
  if (!chartRef.value) return
  chart.value = core.init(chartRef.value, null, { renderer: 'svg' })
  chart.value.on('click', (params) => {
    if (params.dataType === 'node') focusNode(params.data.id)
  })
  renderGraph()
  resizeObserver = new ResizeObserver(() => chart.value?.resize())
  resizeObserver.observe(chartRef.value)
})

watch(() => props.graph, () => {
  selectedId.value = null
  highlightedIds.value = []
  pulse.value = null
  renderGraph()
})

onBeforeUnmount(() => {
  window.clearTimeout(pulseTimer)
  resizeObserver?.disconnect()
  chart.value?.dispose()
})

defineExpose({ highlightNodes })
</script>

<template>
  <div ref="rootRef" class="knowledge-graph">
    <div class="graph-stage">
      <div ref="chartRef" class="graph-canvas" role="img" :aria-label="`${title}，${graph.nodes.length} 个节点`"></div>
      <span v-if="pulse" :key="pulse.key" class="graph-pulse" :style="{ left: pulse.left, top: pulse.top }" aria-hidden="true"></span>
    </div>
    <div class="graph-detail" aria-live="polite">
      <template v-if="selectedNode">
        <span>{{ selectedNode.category }}</span>
        <strong>{{ selectedNode.name }}</strong>
        <p>{{ selectedNode.description }}</p>
      </template>
      <template v-else>
        <span>阅读方式</span>
        <strong>选择节点，查看它与历史的连接</strong>
        <p>考据官回应后，相关史料节点会以金色脉冲提示。</p>
      </template>
    </div>
    <div class="graph-node-list" aria-label="图谱节点">
      <button
        v-for="node in graph.nodes"
        :key="node.id"
        type="button"
        :class="{ 'is-selected': selectedId === node.id }"
        :aria-pressed="selectedId === node.id"
        @click="focusNode(node.id)"
      >
        {{ node.name }}
      </button>
    </div>
    <ul class="sr-only">
      <li v-for="node in graph.nodes" :key="node.id">{{ node.name }}：{{ node.description }}</li>
    </ul>
  </div>
</template>
