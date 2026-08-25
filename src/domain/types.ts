export const REGIONS = ['NL', 'EU', 'GLO'] as const
export type Region = (typeof REGIONS)[number] | null

export const STAGE_NAMES = [
  'Raw material extraction',
  'Processing',
  'Manufacturing',
  'Transport',
] as const
export type StageName = (typeof STAGE_NAMES)[number]

export interface EmissionFactor {
  id: string
  name: string
  unit: string
  region: Region
  gwp: number
  eutrophication: number
  water: number
}

export interface Flow {
  material_id: string
  description: string
  quantity: number
  unit: string
}

export interface Stage {
  name: StageName
  flows: Flow[]
}

export interface Product {
  id: string
  name: string
  functional_unit: string
  functional_unit_scaling_factor: number
  notes: string
  stages: Stage[]
}

export interface Dataset {
  schema_version: string
  description: string
  emission_factor_database: EmissionFactor[]
  products: Product[]
}
