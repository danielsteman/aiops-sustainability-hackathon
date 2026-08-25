import { z } from 'zod'

export const regionSchema = z.enum(['NL', 'EU', 'GLO']).nullable()

export const stageNameSchema = z.enum([
  'Raw material extraction',
  'Processing',
  'Manufacturing',
  'Transport',
])

const positiveFinite = (): z.ZodType<number> => z.number().finite().positive()
const nonNegativeFinite = (): z.ZodType<number> =>
  z.number().finite().nonnegative()

export const emissionFactorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
  region: regionSchema,
  gwp: nonNegativeFinite(),
  eutrophication: nonNegativeFinite(),
  water: nonNegativeFinite(),
})

export const flowSchema = z.object({
  material_id: z.string().min(1),
  description: z.string(),
  quantity: nonNegativeFinite(),
  unit: z.string().min(1),
})

export const stageSchema = z.object({
  name: stageNameSchema,
  flows: z.array(flowSchema),
})

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  functional_unit: z.string().min(1),
  functional_unit_scaling_factor: positiveFinite(),
  notes: z.string(),
  stages: z.array(stageSchema),
})

export const datasetSchema = z.object({
  schema_version: z.string().min(1),
  description: z.string(),
  emission_factor_database: z.array(emissionFactorSchema),
  products: z.array(productSchema),
})

export function formatPath(
  path: readonly (string | number | symbol)[] | undefined,
): string {
  if (!path) return ''
  let result = ''
  for (const segment of path) {
    if (typeof segment === 'number') {
      result += `[${segment}]`
    } else if (result === '') {
      result += String(segment)
    } else {
      result += `.${String(segment)}`
    }
  }
  return result
}

function issueMessage(issue: {
  code: string
  expected?: string
  message?: string
}): string {
  if (issue.code === 'invalid_type') {
    return `expected ${issue.expected}`
  }
  return issue.message ?? 'invalid value'
}

export function parseDataset(value: unknown) {
  return datasetSchema.safeParse(value, {
    error: (issue: {
      path?: (string | number | symbol)[]
      code: string
      expected?: string
      message?: string
    }) => ({
      message: `${formatPath(issue.path)}: ${issueMessage(issue)}`,
    }),
  })
}
