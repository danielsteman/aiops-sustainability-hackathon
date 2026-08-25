export const REGIONS = ['NL', 'EU', 'GLO'] as const
export type Region = (typeof REGIONS)[number] | null

/**
 * Stage names are whatever the dataset calls them. Real datasets name stages
 * after the process ("Brewing and fermentation", "Can manufacturing"), and
 * different products in one dataset carry different stages, so nothing may key
 * off a fixed set. Order comes from the product's own `stages` array.
 */
export type StageName = string

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
