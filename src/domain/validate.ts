import { formatPath, datasetSchema } from './schema'
import type { Dataset } from './types'

export type IssueKind = 'malformed' | 'unknown-material' | 'unit-mismatch'

export interface FlowRef {
  productIndex: number
  stageIndex: number
  flowIndex: number
}

export interface Issue {
  kind: IssueKind
  path: string
  line?: number
  message: string
  flowRef?: FlowRef
  suggestedMaterialId?: string
}

export interface DatasetCounts {
  factors: number
  regionalVariantGroups: number
  products: number
  stages: number
  flows: number
}

export interface ValidationResult {
  ok: boolean
  issues: Issue[]
  counts: DatasetCounts
}

const ZERO_COUNTS: DatasetCounts = {
  factors: 0,
  regionalVariantGroups: 0,
  products: 0,
  stages: 0,
  flows: 0,
}

interface JsonToken {
  type: string
  value?: unknown
  line: number
}

function tokenize(json: string): JsonToken[] {
  const tokens: JsonToken[] = []
  let i = 0
  let line = 1
  const n = json.length

  while (i < n) {
    const c = json[i]!
    if (c === '\n') {
      line++
      i++
      continue
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      i++
      continue
    }
    if (
      c === '{' ||
      c === '}' ||
      c === '[' ||
      c === ']' ||
      c === ':' ||
      c === ','
    ) {
      tokens.push({ type: c, line })
      i++
      continue
    }
    if (c === '"') {
      const start = i
      i++
      let escaped = false
      while (i < n) {
        const ch = json[i]
        if (ch === '\n') line++
        if (escaped) escaped = false
        else if (ch === '\\') escaped = true
        else if (ch === '"') break
        i++
      }
      const raw = json.slice(start, i + 1)
      i++
      tokens.push({
        type: 'value',
        value: JSON.parse(raw),
        line,
      })
      continue
    }
    if (/^-?[0-9]/.test(c)) {
      const m = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(
        json.slice(i),
      )
      if (m) {
        tokens.push({ type: 'value', value: Number(m[0]), line })
        i += m[0].length
        continue
      }
    }
    if (json.startsWith('true', i)) {
      tokens.push({ type: 'value', value: true, line })
      i += 4
      continue
    }
    if (json.startsWith('false', i)) {
      tokens.push({ type: 'value', value: false, line })
      i += 5
      continue
    }
    if (json.startsWith('null', i)) {
      tokens.push({ type: 'value', value: null, line })
      i += 4
      continue
    }
    throw new Error(`Unexpected character at line ${line}`)
  }

  return tokens
}

interface ParsedJson {
  data: unknown
  lines: Map<string, number>
}

function parseTokens(tokens: JsonToken[], lines: Map<string, number>): unknown {
  let pos = 0

  const peek = (): JsonToken => {
    const token = tokens[pos]
    if (!token) throw new Error('Unexpected end of JSON')
    return token
  }
  const advance = (): JsonToken => {
    const token = tokens[pos]
    if (!token) throw new Error('Unexpected end of JSON')
    pos++
    return token
  }

  const parseObject = (path: (string | number)[]): Record<string, unknown> => {
    advance()
    const obj: Record<string, unknown> = {}
    if (peek().type === '}') {
      advance()
      return obj
    }
    for (;;) {
      const keyToken = advance()
      const key = String(keyToken.value)
      advance()
      const childPath = [...path, key]
      lines.set(formatPath(childPath), keyToken.line)
      obj[key] = parseValue(childPath)
      const sep = advance()
      if (sep.type === '}') break
    }
    return obj
  }

  const parseArray = (path: (string | number)[]): unknown[] => {
    advance()
    const arr: unknown[] = []
    if (peek().type === ']') {
      advance()
      return arr
    }
    let index = 0
    for (;;) {
      const childPath = [...path, index]
      lines.set(formatPath(childPath), peek().line)
      arr.push(parseValue(childPath))
      const sep = advance()
      if (sep.type === ']') break
      index++
    }
    return arr
  }

  const parseValue = (path: (string | number)[]): unknown => {
    const token = peek()
    if (token.type === 'value') {
      lines.set(formatPath(path), token.line)
      advance()
      return token.value
    }
    if (token.type === '{') return parseObject(path)
    if (token.type === '[') return parseArray(path)
    throw new Error(`Unexpected token at line ${token.line}`)
  }

  return parseValue([])
}

function parseJsonWithLines(json: string): ParsedJson {
  const tokens = tokenize(json)
  const lines = new Map<string, number>()
  return { data: parseTokens(tokens, lines), lines }
}

function computeCounts(data: unknown): DatasetCounts {
  const record = (data ?? {}) as Record<string, unknown>
  const factors = Array.isArray(record.emission_factor_database)
    ? record.emission_factor_database
    : []
  const products = Array.isArray(record.products) ? record.products : []

  const regionsByName = new Map<string, Set<unknown>>()
  for (const factor of factors) {
    const f = factor as Record<string, unknown>
    if (typeof f?.name !== 'string') continue
    const set = regionsByName.get(f.name) ?? new Set<unknown>()
    set.add(f.region ?? null)
    regionsByName.set(f.name, set)
  }
  let regionalVariantGroups = 0
  for (const regions of regionsByName.values()) {
    const nonNull = [...regions].filter((r) => r !== null)
    if (nonNull.length > 1) regionalVariantGroups++
  }

  let stages = 0
  let flows = 0
  for (const product of products) {
    const p = product as Record<string, unknown>
    if (!Array.isArray(p.stages)) continue
    stages += p.stages.length
    for (const stage of p.stages) {
      const s = stage as Record<string, unknown>
      if (Array.isArray(s.flows)) flows += s.flows.length
    }
  }

  return {
    factors: factors.length,
    regionalVariantGroups,
    products: products.length,
    stages,
    flows,
  }
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1
  const cols = b.length + 1
  const dp = Array.from({ length: rows }, () => new Array<number>(cols).fill(0))
  for (let i = 0; i < rows; i++) dp[i]![0] = i
  for (let j = 0; j < cols; j++) dp[0]![j] = j
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      )
    }
  }
  return dp[rows - 1]![cols - 1]!
}

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function similarityScore(a: string, b: string): number {
  const x = normalize(a)
  const y = normalize(b)
  if (!x || !y) return 0
  const distance = levenshtein(x, y)
  const max = Math.max(x.length, y.length)
  return 1 - distance / max
}

const SUGGESTION_THRESHOLD = 0.8

function suggestMaterialId(
  unknownId: string,
  factors: Dataset['emission_factor_database'],
): string | undefined {
  let bestId: string | undefined
  let bestScore = 0
  for (const factor of factors) {
    const idScore = similarityScore(unknownId, factor.id)
    const nameScore = similarityScore(unknownId, factor.name)
    const score = Math.max(idScore, nameScore)
    if (score > bestScore) {
      bestScore = score
      bestId = factor.id
    }
  }
  return bestScore >= SUGGESTION_THRESHOLD ? bestId : undefined
}

export function validate(json: string): ValidationResult {
  let data: unknown
  let lines: Map<string, number>

  try {
    const parsed = parseJsonWithLines(json)
    data = parsed.data
    lines = parsed.lines
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON'
    return {
      ok: false,
      issues: [{ kind: 'malformed', path: '', message }],
      counts: ZERO_COUNTS,
    }
  }

  const counts = computeCounts(data)
  const result = datasetSchema.safeParse(data)
  if (!result.success) {
    const issues: Issue[] = result.error.issues.map((issue) => {
      const path = formatPath(issue.path)
      return {
        kind: 'malformed',
        path,
        line: lines.get(path),
        message: issue.message,
      }
    })
    return { ok: false, issues, counts }
  }

  const dataset = result.data as Dataset
  const factorsById = new Map(
    dataset.emission_factor_database.map((factor) => [factor.id, factor]),
  )
  const issues: Issue[] = []

  dataset.products.forEach((product, productIndex) => {
    product.stages.forEach((stage, stageIndex) => {
      stage.flows.forEach((flow, flowIndex) => {
        const flowRef: FlowRef = { productIndex, stageIndex, flowIndex }
        const flowPath = `products[${productIndex}].stages[${stageIndex}].flows[${flowIndex}]`
        const factor = factorsById.get(flow.material_id)

        if (!factor) {
          issues.push({
            kind: 'unknown-material',
            path: `${flowPath}.material_id`,
            line: lines.get(flowPath),
            message: `Unknown material id "${flow.material_id}"`,
            flowRef,
            suggestedMaterialId: suggestMaterialId(
              flow.material_id,
              dataset.emission_factor_database,
            ),
          })
        } else if (factor.unit !== flow.unit) {
          issues.push({
            kind: 'unit-mismatch',
            path: `${flowPath}.unit`,
            line: lines.get(flowPath),
            message: `Flow unit "${flow.unit}" does not match factor unit "${factor.unit}"`,
            flowRef,
          })
        }
      })
    })
  })

  return { ok: issues.length === 0, issues, counts }
}
