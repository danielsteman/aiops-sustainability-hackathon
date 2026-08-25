import type {
  Dataset,
  EmissionFactor,
  Flow,
  Product,
} from '@/src/domain/types'
import { parseDataset } from '@/src/domain/schema'

export interface StoreState {
  dataset: Dataset | null
  fileHandle: FileSystemFileHandle | null
  dirty: boolean
}

export type StoreAction =
  | { type: 'loadDataset'; payload: Dataset }
  | {
      type: 'setFlowQuantity'
      payload: { productId: string; stageIndex: number; flowIndex: number; value: number }
    }
  | {
      type: 'setFlowMaterial'
      payload: { productId: string; stageIndex: number; flowIndex: number; materialId: string }
    }
  | {
      type: 'addFlow'
      payload: { productId: string; stageIndex: number; flow: Flow }
    }
  | {
      type: 'removeFlow'
      payload: { productId: string; stageIndex: number; flowIndex: number }
    }
  | { type: 'renameProduct'; payload: { productId: string; name: string } }
  | { type: 'setScalingFactor'; payload: { productId: string; factor: number } }
  | { type: 'addFactor'; payload: EmissionFactor }
  | { type: 'updateFactor'; payload: { id: string; patch: Partial<EmissionFactor> } }
  | { type: 'deleteFactor'; payload: { id: string } }
  | { type: 'createProduct'; payload: Product }

/**
 * Wraps every mutation: if the resulting dataset would fail the LCA-003 schema,
 * the previous state is returned unchanged.
 */
function withValidDataset(
  state: StoreState,
  build: (dataset: Dataset) => Dataset,
): StoreState {
  if (!state.dataset) return state
  const next = build(state.dataset)
  const result = parseDataset(next)
  if (!result.success) return state
  return { ...state, dataset: next, dirty: true }
}

function findProductIndex(dataset: Dataset, productId: string): number {
  return dataset.products.findIndex((p) => p.id === productId)
}

export function datasetReducer(
  state: StoreState,
  action: StoreAction,
): StoreState {
  switch (action.type) {
    case 'loadDataset':
      return {
        ...state,
        dataset: action.payload,
        dirty: false,
      }

    case 'setFlowQuantity':
      return withValidDataset(state, (dataset) => {
        const pi = findProductIndex(dataset, action.payload.productId)
        if (pi === -1) return dataset
        return {
          ...dataset,
          products: dataset.products.map((product, i) => {
            if (i !== pi) return product
            return {
              ...product,
              stages: product.stages.map((stage, si) => {
                if (si !== action.payload.stageIndex) return stage
                return {
                  ...stage,
                  flows: stage.flows.map((flow, fi) =>
                    fi === action.payload.flowIndex
                      ? { ...flow, quantity: action.payload.value }
                      : flow,
                  ),
                }
              }),
            }
          }),
        }
      })

    case 'setFlowMaterial':
      return withValidDataset(state, (dataset) => {
        const pi = findProductIndex(dataset, action.payload.productId)
        if (pi === -1) return dataset
        return {
          ...dataset,
          products: dataset.products.map((product, i) => {
            if (i !== pi) return product
            return {
              ...product,
              stages: product.stages.map((stage, si) => {
                if (si !== action.payload.stageIndex) return stage
                return {
                  ...stage,
                  flows: stage.flows.map((flow, fi) =>
                    fi === action.payload.flowIndex
                      ? { ...flow, material_id: action.payload.materialId }
                      : flow,
                  ),
                }
              }),
            }
          }),
        }
      })

    case 'addFlow':
      return withValidDataset(state, (dataset) => {
        const pi = findProductIndex(dataset, action.payload.productId)
        if (pi === -1) return dataset
        return {
          ...dataset,
          products: dataset.products.map((product, i) => {
            if (i !== pi) return product
            return {
              ...product,
              stages: product.stages.map((stage, si) =>
                si === action.payload.stageIndex
                  ? { ...stage, flows: [...stage.flows, action.payload.flow] }
                  : stage,
              ),
            }
          }),
        }
      })

    case 'removeFlow':
      return withValidDataset(state, (dataset) => {
        const pi = findProductIndex(dataset, action.payload.productId)
        if (pi === -1) return dataset
        return {
          ...dataset,
          products: dataset.products.map((product, i) => {
            if (i !== pi) return product
            return {
              ...product,
              stages: product.stages.map((stage, si) => {
                if (si !== action.payload.stageIndex) return stage
                return {
                  ...stage,
                  flows: stage.flows.filter(
                    (_, fi) => fi !== action.payload.flowIndex,
                  ),
                }
              }),
            }
          }),
        }
      })

    case 'renameProduct':
      return withValidDataset(state, (dataset) => ({
        ...dataset,
        products: dataset.products.map((product) =>
          product.id === action.payload.productId
            ? { ...product, name: action.payload.name }
            : product,
        ),
      }))

    case 'setScalingFactor':
      return withValidDataset(state, (dataset) => ({
        ...dataset,
        products: dataset.products.map((product) =>
          product.id === action.payload.productId
            ? {
                ...product,
                functional_unit_scaling_factor: action.payload.factor,
              }
            : product,
        ),
      }))

    case 'addFactor':
      return withValidDataset(state, (dataset) => ({
        ...dataset,
        emission_factor_database: [
          ...dataset.emission_factor_database,
          action.payload,
        ],
      }))

    case 'updateFactor':
      return withValidDataset(state, (dataset) => ({
        ...dataset,
        emission_factor_database: dataset.emission_factor_database.map(
          (factor) =>
            factor.id === action.payload.id
              ? { ...factor, ...action.payload.patch }
              : factor,
        ),
      }))

    case 'deleteFactor':
      return withValidDataset(state, (dataset) => {
        const referenced = dataset.products.some((product) =>
          product.stages.some((stage) =>
            stage.flows.some(
              (flow) => flow.material_id === action.payload.id,
            ),
          ),
        )
        if (referenced) return dataset
        return {
          ...dataset,
          emission_factor_database: dataset.emission_factor_database.filter(
            (factor) => factor.id !== action.payload.id,
          ),
        }
      })

    case 'createProduct':
      return withValidDataset(state, (dataset) => ({
        ...dataset,
        products: [...dataset.products, action.payload],
      }))

    default:
      return state
  }
}