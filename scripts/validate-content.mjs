import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Ajv from 'ajv'

const root = fileURLToPath(new URL('../', import.meta.url))
const eventDir = path.join(root, 'src/data/events')
const expectedIds = ['1919', '1921', '1949', '1964', '1978', '2020']

async function readJson(relativePath) {
  const source = await readFile(path.join(root, relativePath), 'utf8')
  return JSON.parse(source)
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

const schema = await readJson('src/data/content-schema.json')
const ajv = new Ajv({ allErrors: true, strict: false })
const validate = ajv.compile(schema)
const errors = []

for (const id of expectedIds) {
  const event = await readJson(`src/data/events/${id}.json`)
  const prefix = `${id}.json`

  if (!validate(event)) {
    for (const error of validate.errors || []) {
      errors.push(`${prefix} ${error.instancePath || '/'} ${error.message}`)
    }
    continue
  }

  if (event.id !== id || String(event.year) !== id) {
    errors.push(`${prefix} id/year must match the filename`)
  }

  const sourceIds = event.sources.map((source) => source.id)
  if (new Set(sourceIds).size !== sourceIds.length) {
    errors.push(`${prefix} contains duplicate source ids`)
  }

  for (const fact of event.facts) {
    if (!sourceIds.includes(fact.sourceId)) {
      errors.push(`${prefix} fact references unknown source ${fact.sourceId}`)
    }
  }

  for (const item of event.data) {
    if (!sourceIds.includes(item.sourceId)) {
      errors.push(`${prefix} data references unknown source ${item.sourceId}`)
    }
  }

  const nodeIds = event.graph.nodes.map((node) => node.id)
  if (new Set(nodeIds).size !== nodeIds.length) {
    errors.push(`${prefix} contains duplicate graph node ids`)
  }

  for (const link of event.graph.links) {
    if (!nodeIds.includes(link.source) || !nodeIds.includes(link.target)) {
      errors.push(`${prefix} graph link ${link.source} -> ${link.target} references an unknown node`)
    }
  }

  if (!nonEmpty(event.letter.disclaimer) || !event.letter.disclaimer.includes('文学化演绎')) {
    errors.push(`${prefix} letter must include a 文学化演绎 disclaimer`)
  }

  if (!event.agents.witness.disclaimer.includes('虚构')) {
    errors.push(`${prefix} witness disclaimer must state that the person is fictional`)
  }

  if (event.agents.historian.citationRequired !== true) {
    errors.push(`${prefix} historian must require citations`)
  }
}

const sources = await readJson('src/data/sources.json')
const media = await readJson('src/data/media.json')

for (const id of expectedIds) {
  const event = await readJson(`src/data/events/${id}.json`)
  if (!Array.isArray(sources[id])) {
    errors.push(`sources.json is missing event ${id}`)
    continue
  }

  const manifestIds = sources[id].map((source) => source.id)
  for (const source of event.sources) {
    if (!manifestIds.includes(source.id)) {
      errors.push(`sources.json is missing ${id}/${source.id}`)
    }
  }

  if (!Array.isArray(media[id])) {
    errors.push(`media.json is missing event ${id}`)
    continue
  }

  const mediaById = new Map(media[id].map((item) => [item.id, item]))
  const references = [
    event.media.hero,
    ...event.media.gallery,
    event.media.video,
    event.audio.ambient,
  ]

  if (event.character.portrait) references.push(event.character.portrait)
  if (event.character.modelPath) references.push(event.character.modelPath)

  for (const mediaId of references) {
    const item = mediaById.get(mediaId)
    if (!item) {
      errors.push(`media.json is missing ${id}/${mediaId}`)
      continue
    }

    if (item.status === 'ready') {
      for (const field of ['license', 'source', 'credit']) {
        if (!nonEmpty(item[field])) errors.push(`media ${mediaId} is ready but lacks ${field}`)
      }
      if (!nonEmpty(item.localPath)) errors.push(`media ${mediaId} is ready but lacks localPath`)
    } else if (item.status === 'missing') {
      if (!nonEmpty(item.reason)) errors.push(`media ${mediaId} is missing but lacks reason`)
    } else {
      errors.push(`media ${mediaId} has invalid status ${item.status}`)
    }
  }
}

if (errors.length) {
  console.error(`Content validation failed with ${errors.length} error(s):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log('Content validation passed: 6 events, sources, graph references and media manifests are valid.')
}
