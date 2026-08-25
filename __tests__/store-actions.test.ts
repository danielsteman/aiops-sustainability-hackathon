import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  datasetReducer,
  type StoreAction,
  type StoreState,
} from '@/src/store/actions'
import type { Dataset } from '@/src/domain/types'

function loadDataset(): Dataset {
  const raw = readFileSync(
    join(process.cwd(), 'docs', 'sample-data.json'),
    'utf8',
  )
  return JSON.parse(raw) as Dataset
}

function baseState(dataset: Dataset = loadDataset()): StoreState {
  return { dataset, fileHandle: null, dirty: false, importError: false }
}

function run(state: StoreState, action: StoreAction): StoreState {
  return datasetReducer(state, action)
}

describe('dataset store actions', () => {
  it('loadDataset stores the dataset and clears dirty', () => {
    const dataset = loadDataset()
    const result = run(baseState(), { type: 'loadDataset', payload: dataset })
    expect(result.dataset).toBe(dataset)
    expect(result.dirty).toBe(false)
  })

  it('setFlowQuantity does not mutate the previous state object', () => {
    const state = baseState()
    const original = state.dataset as Dataset
    const result = run(state, {
      type: 'setFlowQuantity',
      payload: {
        productId: 'product_a',
        stageIndex: 0,
        flowIndex: 0,
        value: 9,
      },
    })
    expect(result.dataset).not.toBe(original)
    expect(result).not.toBe(state)
  })

  it('setFlowQuantity on product A leaves product B object reference unchanged', () => {
    const state = baseState()
    const dataset = state.dataset as Dataset
    const productB = dataset.products[1]
    const result = run(state, {
      type: 'setFlowQuantity',
      payload: {
        productId: 'product_a',
        stageIndex: 0,
        flowIndex: 0,
        value: 9,
      },
    })
    expect(result.dataset?.products[1]).toBe(productB)
  })

  it('setFlowQuantity updates the target flow and keeps sibling flows intact', () => {
    const state = baseState()
    const before = (state.dataset as Dataset).products[0]!.stages[0]!.flows[0]!
    const result = run(state, {
      type: 'setFlowQuantity',
      payload: {
        productId: 'product_a',
        stageIndex: 0,
        flowIndex: 0,
        value: 9,
      },
    })
    const after = result.dataset!.products[0]!.stages[0]!.flows[0]!
    expect(after.quantity).toBe(9)
    expect(after).not.toBe(before)
    expect(after.material_id).toBe(before.material_id)
  })

  it('setFlowMaterial updates only the target flow', () => {
    const state = baseState()
    const result = run(state, {
      type: 'setFlowMaterial',
      payload: {
        productId: 'product_a',
        stageIndex: 0,
        flowIndex: 0,
        materialId: 'limestone',
      },
    })
    expect(result.dataset!.products[0]!.stages[0]!.flows[0]!.material_id).toBe(
      'limestone',
    )
  })

  it('addFlow appends a new flow to the stage', () => {
    const state = baseState()
    const dataset = state.dataset as Dataset
    const stage = dataset.products[0]!.stages[0]!
    const count = stage.flows.length
    const result = run(state, {
      type: 'addFlow',
      payload: {
        productId: 'product_a',
        stageIndex: 0,
        flow: {
          material_id: 'process_water',
          description: 'added flow',
          quantity: 1,
          unit: 'L',
        },
      },
    })
    const flows = result.dataset!.products[0]!.stages[0]!.flows
    expect(flows).toHaveLength(count + 1)
    expect(flows[count]!.description).toBe('added flow')
  })

  it('removeFlow removes the targeted flow', () => {
    const state = baseState()
    const dataset = state.dataset as Dataset
    const count = dataset.products[0]!.stages[0]!.flows.length
    const result = run(state, {
      type: 'removeFlow',
      payload: { productId: 'product_a', stageIndex: 0, flowIndex: 0 },
    })
    const flows = result.dataset!.products[0]!.stages[0]!.flows
    expect(flows).toHaveLength(count - 1)
    expect(flows[0]!.material_id).not.toBe(
      dataset.products[0]!.stages[0]!.flows[0]!.material_id,
    )
  })

  it('renameProduct renames the product', () => {
    const state = baseState()
    const result = run(state, {
      type: 'renameProduct',
      payload: { productId: 'product_a', name: 'Glass bottle' },
    })
    expect(result.dataset!.products[0]!.name).toBe('Glass bottle')
    expect(result.dataset!.products[1]!.name).toBe(
      (state.dataset as Dataset).products[1]!.name,
    )
  })

  it('setScalingFactor updates the scaling factor', () => {
    const state = baseState()
    const result = run(state, {
      type: 'setScalingFactor',
      payload: { productId: 'product_b', factor: 1.5 },
    })
    expect(result.dataset!.products[1]!.functional_unit_scaling_factor).toBe(
      1.5,
    )
  })

  it('setScalingFactor rejects non-positive factor (schema guard)', () => {
    const state = baseState()
    const original = state.dataset
    const result = run(state, {
      type: 'setScalingFactor',
      payload: { productId: 'product_a', factor: 0 },
    })
    expect(result.dataset).toBe(original)
  })

  it('addFactor adds a new emission factor', () => {
    const state = baseState()
    const dataset = state.dataset as Dataset
    const count = dataset.emission_factor_database.length
    const result = run(state, {
      type: 'addFactor',
      payload: {
        id: 'new_factor',
        name: 'New factor',
        unit: 'kg',
        region: null,
        gwp: 0.1,
        eutrophication: 0.001,
        water: 0.01,
      },
    })
    expect(result.dataset!.emission_factor_database).toHaveLength(count + 1)
    expect(result.dataset!.emission_factor_database[count]!.id).toBe(
      'new_factor',
    )
  })

  it('updateFactor patches only the matching factor', () => {
    const state = baseState()
    const result = run(state, {
      type: 'updateFactor',
      payload: { id: 'process_water', patch: { gwp: 0.99 } },
    })
    const factor = result.dataset!.emission_factor_database.find(
      (f) => f.id === 'process_water',
    )
    expect(factor?.gwp).toBe(0.99)
    expect(
      result.dataset!.emission_factor_database.find(
        (f) => f.id === 'silica_sand',
      )?.gwp,
    ).toBe(0.004)
  })

  it('deleteFactor removes an unreferenced factor', () => {
    const state = baseState()
    const dataset = state.dataset as Dataset
    const count = dataset.emission_factor_database.length
    const result = run(state, {
      type: 'deleteFactor',
      payload: { id: 'electricity_grid_GLO' },
    })
    expect(result.dataset!.emission_factor_database).toHaveLength(count - 1)
    expect(
      result.dataset!.emission_factor_database.some(
        (f) => f.id === 'electricity_grid_GLO',
      ),
    ).toBe(false)
  })

  it('deleteFactor rejects when factor is referenced by a flow', () => {
    const state = baseState()
    const original = state.dataset
    const result = run(state, {
      type: 'deleteFactor',
      payload: { id: 'electricity_grid_NL' },
    })
    expect(result.dataset).toBe(original)
  })

  it('createProduct appends a new product', () => {
    const state = baseState()
    const dataset = state.dataset as Dataset
    const count = dataset.products.length
    const result = run(state, {
      type: 'createProduct',
      payload: {
        id: 'product_c',
        name: 'New product',
        functional_unit: '1 litre',
        functional_unit_scaling_factor: 1,
        notes: '',
        stages: [],
      },
    })
    expect(result.dataset!.products).toHaveLength(count + 1)
    expect(result.dataset!.products[count]!.id).toBe('product_c')
  })

  it('marks state dirty after a mutating action', () => {
    const state = baseState()
    const result = run(state, {
      type: 'renameProduct',
      payload: { productId: 'product_a', name: 'Renamed' },
    })
    expect(result.dirty).toBe(true)
  })
})

describe('dataset store actions: persistence bookkeeping', () => {
  it('setFileHandle stores the handle without marking dirty', () => {
    const handle = {} as FileSystemFileHandle
    const state = baseState()
    const result = run(state, { type: 'setFileHandle', payload: handle })
    expect(result.fileHandle).toBe(handle)
    expect(result.dirty).toBe(false)
  })

  it('setImportError records an unresolved import validation error', () => {
    const state = baseState()
    const result = run(state, { type: 'setImportError', payload: true })
    expect(result.importError).toBe(true)
  })

  it('setDirty sets and clears the dirty flag without touching the dataset', () => {
    const dataset = loadDataset()
    const state = baseState(dataset)
    const result = run(state, { type: 'setDirty', payload: true })
    expect(result.dirty).toBe(true)
    expect(result.dataset).toBe(dataset)
    const cleared = run(result, { type: 'setDirty', payload: false })
    expect(cleared.dirty).toBe(false)
  })

  it('__markSaved clears the dirty flag', () => {
    const state = run(baseState(), {
      type: 'renameProduct',
      payload: { productId: 'product_a', name: 'Renamed' },
    })
    expect(state.dirty).toBe(true)
    const result = run(state, { type: '__markSaved' })
    expect(result.dirty).toBe(false)
  })

  it('loadDataset clears an unresolved import error', () => {
    const state = run(baseState(), { type: 'setImportError', payload: true })
    const dataset = loadDataset()
    const result = run(state, { type: 'loadDataset', payload: dataset })
    expect(result.importError).toBe(false)
  })
})
