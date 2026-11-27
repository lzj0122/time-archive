<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  event: { type: Object, required: true },
})

const emit = defineEmits(['cite'])
const messages = ref([])
const isStreaming = ref(false)
const activeRole = ref(null)
const status = ref('')
const runId = ref(0)
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

const hasMessages = computed(() => messages.value.length > 0)

function delay(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

async function streamReply(role, reply, currentRun) {
  activeRole.value = role
  const message = { role, content: '', done: false }
  messages.value.push(message)
  await nextTick()
  status.value = role === 'witness' ? '亲历者正在回应' : '考据官正在核对来源'

  if (prefersReducedMotion.matches) {
    message.content = reply
    message.done = true
    return
  }

  const tokens = Array.from(reply)
  for (const token of tokens) {
    if (currentRun !== runId.value) return
    message.content += token
    await delay(22)
  }
  message.done = true
}

async function startConversation() {
  if (isStreaming.value) return
  const currentRun = ++runId.value
  messages.value = []
  isStreaming.value = true
  status.value = '正在展开双声对话'

  try {
    await streamReply('witness', props.event.agents.witness.demo.reply, currentRun)
    if (currentRun !== runId.value) return
    await delay(300)
    if (currentRun !== runId.value) return
    await streamReply('historian', props.event.agents.historian.demo.reply, currentRun)
    if (currentRun !== runId.value) return
    activeRole.value = null
    status.value = '双声对话完成，考据官引用已同步到图谱'
    emit('cite', props.event.agents.historian.demo.citationNodeIds)
  } finally {
    if (currentRun === runId.value) isStreaming.value = false
  }
}

watch(() => props.event.id, () => {
  runId.value += 1
  messages.value = []
  activeRole.value = null
  isStreaming.value = false
  status.value = ''
})

onBeforeUnmount(() => {
  runId.value += 1
})
</script>

<template>
  <div class="dual-chat">
    <div class="chat-messages" aria-label="双声档案员对话">
      <div v-if="!hasMessages" class="chat-empty">
        <span class="chat-quote" aria-hidden="true">“</span>
        <p>先听一位亲历者讲述，<br />再听考据官把线索放回历史坐标。</p>
      </div>

      <article
        v-for="message in messages"
        :key="`${message.role}-${messages.indexOf(message)}`"
        class="chat-bubble"
        :class="[`chat-bubble--${message.role}`, { 'is-streaming': !message.done }]"
      >
        <header>
          <strong>{{ message.role === 'witness' ? '亲历者' : '考据官' }}</strong>
          <span>{{ message.role === 'witness' ? '现场的声音' : '史料的坐标' }}</span>
        </header>
        <p>{{ message.content }}<span v-if="!message.done" class="typing-caret" aria-hidden="true"></span></p>
        <footer v-if="message.role === 'witness'">文学化演绎 · 非真实人物</footer>
        <footer v-else-if="message.done">依据本档案所列史料整理 · 演示模式</footer>
      </article>
    </div>

    <div class="chat-actions">
      <button class="button button-primary" type="button" :disabled="isStreaming" @click="startConversation">
        {{ isStreaming ? '档案员回应中…' : hasMessages ? '再次倾听' : '请两位档案员回应' }}
      </button>
      <span class="chat-status" role="status" aria-live="polite">{{ status }}</span>
    </div>
    <p class="chat-disclaimer">当前为本地演示对话，不连接真实 AI 服务；回答不代表真实亲历者。</p>
  </div>
</template>
