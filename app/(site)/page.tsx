'use client'

import { StoreProvider, useStore } from '@/src/store/store'
import { useUndoRedoShortcuts } from '@/src/store/use-undo-redo'
import {
  supportsFileSystemAccess,
  BrowserSupportNotice,
} from '@/src/persistence/browser-support'
import { usePersistence } from '@/src/persistence/use-persistence'
import { PersistenceIndicator } from '@/src/persistence/persistence-indicator'
import { Button } from '@/src/components/ui/button'
import { Tag } from '@/src/components/ui/tag'
import { stageShares, type StageShareResult } from '@/src/store/selectors'
import { productImpact } from '@/src/domain/impact'
import {
  compare,
  summarise,
  CATEGORY_ORDER,
  type CategoryComparison,
} from '@/src/domain/compare'
import {
  IMPACT_UNITS,
  formatImpact,
  formatScalingFactor,
  type ImpactCategory,
} from '@/src/domain/format'
import type { Dataset } from '@/src/domain/types'
import { colors } from '@/src/tokens'
import sampleData from '@/docs/sample-data.json'

export const dynamic = 'force-static'

const CATEGORY_LABEL: Record<ImpactCategory, string> = {
  gwp: 'Global Warming Potential',
  eutrophication: 'Freshwater Eutrophication',
  water: 'Water Consumption',
}

const STAGE_KEY: Record<string, keyof typeof colors> = {
  'Raw material extraction': 'stage-extraction',
  Processing: 'stage-processing',
  Manufacturing: 'stage-manufacturing',
  Transport: 'stage-transport',
}

/**
 * Full app shell. If the browser lacks the File System Access API the app is
 * gated behind a full-page notice and no store is initialised.
 */
export default function Home() {
  if (!supportsFileSystemAccess()) {
    return <BrowserSupportNotice />
  }

  return (
    <StoreProvider>
      <PersistenceApp />
    </StoreProvider>
  )
}

function PersistenceApp() {
  const { state, dispatch, canUndo, canRedo } = useStore()
  useUndoRedoShortcuts(dispatch)

  const { phase, saveStatus, open, saveAsFile, retrySave, reconnectHandle } =
    usePersistence(state, dispatch)

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-zinc-200 bg-white">
        <nav className="flex h-full flex-col justify-between p-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => void open()} className="flex-1">
                Open file
              </Button>
              <Button variant="secondary" onClick={() => void saveAsFile()}>
                Save as…
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={!canUndo}
                onClick={() => dispatch({ type: '__undo' })}
              >
                Undo
              </Button>
              <Button
                variant="secondary"
                disabled={!canRedo}
                onClick={() => dispatch({ type: '__redo' })}
              >
                Redo
              </Button>
            </div>
          </div>

          {phase === 'reconnect' ? (
            <ReconnectAffordance onReconnect={reconnectHandle} />
          ) : (
            <PersistenceIndicator status={saveStatus} onRetry={retrySave} />
          )}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Overview />
      </main>
    </div>
  )
}

function Overview() {
  const dataset = sampleData as Dataset
  const factorsById = Object.fromEntries(
    dataset.emission_factor_database.map((f) => [f.id, f]),
  )
  const comparison =
    compare(
      dataset.products[0]!,
      dataset.products[1]!,
      factorsById,
    )
  const summary = summarise(comparison)

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold">LCA Comparison Tool</h1>
        <p className="mt-2 max-w-2xl leading-7 text-zinc-600">
          {dataset.description}
        </p>
      </header>

      <ProductCards dataset={dataset} />

      <ComparisonPanel
        comparison={comparison}
        summary={summary}
        products={dataset.products}
      />
    </div>
  )
}

function ProductCards({ dataset }: { dataset: Dataset }) {
  const factorsById = Object.fromEntries(
    dataset.emission_factor_database.map((f) => [f.id, f]),
  )
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Products</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {dataset.products.map((product) => {
          const impact = productImpact(product, factorsById)
          return (
            <div
              key={product.id}
              className="rounded-lg border border-zinc-200 bg-white p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <Tag variant="scaling">
                  {formatScalingFactor(product.functional_unit_scaling_factor)}
                </Tag>
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {product.functional_unit}
              </p>
              <div className="mt-4 space-y-3">
                {CATEGORY_ORDER.map((category) => (
                  <ImpactBar
                    key={category}
                    category={category}
                    value={impact.normalised[category]}
                    stageShares={stageShares(
                      impact.byStage,
                      category,
                    )}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ImpactBar({
  category,
  value,
  stageShares,
}: {
  category: ImpactCategory
  value: number
  stageShares: StageShareResult[]
}) {
  const formatted = formatImpact(value, category, 'grid')
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">{CATEGORY_LABEL[category]}</span>
        <span className="text-zinc-600">
          {formatted.value} {IMPACT_UNITS[category]}
        </span>
      </div>
      <div className="mt-1 flex h-3 w-full overflow-hidden rounded-full bg-zinc-100">
        {stageShares.map((share) => (
          <div
            key={share.stage}
            className="h-full"
            style={{
              width: `${share.width}%`,
              backgroundColor:
                colors[STAGE_KEY[share.stage] ?? 'stage-transport'],
            }}
            title={`${share.stage}: ${share.share}%`}
          />
        ))}
      </div>
    </div>
  )
}

function ComparisonPanel({
  comparison,
  summary,
  products,
}: {
  comparison: CategoryComparison[]
  summary: ReturnType<typeof summarise>
  products: Dataset['products']
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Comparison</h2>
        <Tag variant="better">{summary.sentence}</Tag>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
        {products.map((product) => (
          <div key={product.id}>
            <p className="font-semibold">{product.name}</p>
            <p className="text-zinc-500">{product.functional_unit}</p>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {comparison.map((c) => (
          <ComparisonRow key={c.category} c={c} />
        ))}
      </div>
    </div>
  )
}

function ComparisonRow({ c }: { c: CategoryComparison }) {
  const formattedA = formatImpact(c.a, c.category, 'normalised')
  const formattedB = formatImpact(c.b, c.category, 'normalised')
  const winnerLabel =
    c.winner === 'a'
      ? `Product A wins by ${c.deltaPercent}%`
      : c.winner === 'b'
        ? `Product B wins by ${c.deltaPercent}%`
        : 'Tie'
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{CATEGORY_LABEL[c.category]}</span>
        <span className="text-zinc-500">{winnerLabel}</span>
      </div>
      <div className="mt-1 flex items-center gap-4 text-sm text-zinc-600">
        <span className="w-1/2">
          {formattedA.value} {c.unit}
        </span>
        <span className="w-1/2">
          {formattedB.value} {c.unit}
        </span>
      </div>
      <div className="mt-1 flex gap-2">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full"
            style={{
              width: `${c.aBarPercent}%`,
              backgroundColor:
                c.winner === 'a' ? colors.primary : colors['stage-processing'],
            }}
          />
        </div>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full"
            style={{
              width: `${c.bBarPercent}%`,
              backgroundColor:
                c.winner === 'b'
                  ? colors.primary
                  : colors['stage-manufacturing'],
            }}
          />
        </div>
      </div>
    </div>
  )
}

function ReconnectAffordance({
  onReconnect,
}: {
  onReconnect: () => Promise<void>
}) {
  return (
    <div className="text-sm">
      <DatabaseIcon />
      <a
        href="#"
        onClick={(event) => {
          event.preventDefault()
          void onReconnect()
        }}
      >
        Reconnect file
      </a>
    </div>
  )
}

function DatabaseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  )
}