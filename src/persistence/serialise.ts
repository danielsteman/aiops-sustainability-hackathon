import type { Dataset } from '@/src/domain/types'

/**
 * Serialises a dataset to JSON using a 2-space indent and a trailing newline.
 * `JSON.stringify` preserves the insertion order of object keys, so the output
 * mirrors the shape produced by `openDataset`.
 */
export function serialise(dataset: Dataset): string {
  return `${JSON.stringify(dataset, null, 2)}\n`
}

/** Parses a serialised JSON string back into a dataset. */
export function parse(text: string): Dataset {
  return JSON.parse(text) as Dataset
}

/**
 * Derives a slugified file name from the dataset description, used as the
 * `suggestedName` for `showSaveFilePicker`.
 */
export function slugify(description: string): string {
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${slug || 'dataset'}.json`
}
