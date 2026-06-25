// Phase 3 Deferred Slice 4: deterministic local custom character export/import.
// Pure module: no DOM, no timers, no side effects.

import type { CustomCharacterRecord } from './customCharacterManager'
import { deserializeCustomCharacters } from './customCharacterManager'

/**
 * The current version of the custom character export package format.
 * Increment when the shape of the package changes.
 */
export const CUSTOM_CHARACTER_EXPORT_VERSION = 1

interface ExportPackage {
  version: number
  characters: CustomCharacterRecord[]
}

/**
 * Serializes custom character records into a deterministic versioned JSON string.
 *
 * The output is deterministic for the same input array so that equality
 * comparisons (e.g. in tests) work reliably.
 */
export function exportCustomCharactersPackage(
  characters: CustomCharacterRecord[],
): string {
  const pkg: ExportPackage = {
    version: CUSTOM_CHARACTER_EXPORT_VERSION,
    characters,
  }
  return JSON.stringify(pkg)
}

/**
 * Imports custom character records from a versioned JSON package string.
 *
 * Returns an empty array when the input is not valid JSON, has an unsupported
 * version number, or contains no valid custom character records (reusing the
 * existing validation from customCharacterManager.deserializeCustomCharacters).
 */
export function importCustomCharactersPackage(raw: string): CustomCharacterRecord[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return []
  }

  const pkg = parsed as Record<string, unknown>

  if (pkg.version !== CUSTOM_CHARACTER_EXPORT_VERSION) {
    return []
  }

  if (!Array.isArray(pkg.characters)) {
    return []
  }

  // Reuse existing validation to filter out invalid records.
  return deserializeCustomCharacters(JSON.stringify(pkg.characters))
}

/**
 * Merges imported custom character records into an existing list,
 * deduplicating by stable id. Existing records always take precedence.
 */
export function mergeImportedCustomCharacters(
  existing: CustomCharacterRecord[],
  imported: CustomCharacterRecord[],
): CustomCharacterRecord[] {
  const existingIds = new Set(existing.map(c => c.id))
  const deduplicated = imported.filter(c => !existingIds.has(c.id))
  return [...existing, ...deduplicated]
}
