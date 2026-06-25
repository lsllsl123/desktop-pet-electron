// Phase 2 Deferred Slice 4: deterministic local custom character management.
// Pure module: no DOM, no timers, no side effects.

export interface BuiltInCharacter {
  id: string
  name: string
  color: string
  glyph: string
}

export interface CustomCharacterInput {
  name: string
  color: string
  glyph: string
  pixelArt: {
    width: number
    height: number
    data: number[]
  }
}

export interface CustomCharacterRecord extends BuiltInCharacter {
  kind: 'custom'
  pixelArt: {
    width: number
    height: number
    data: number[]
  }
}

export interface CustomCharacterManager {
  addCustomCharacter: (input: CustomCharacterInput) => CustomCharacterRecord
  listCharacters: () => (BuiltInCharacter | CustomCharacterRecord)[]
  listCustomCharacters: () => CustomCharacterRecord[]
  selectCharacter: (id: string) => boolean
  getSelectedCharacter: () => (BuiltInCharacter | CustomCharacterRecord) | null
  removeCustomCharacter: (id: string) => boolean
}

type PixelArt = CustomCharacterInput['pixelArt']

function cloneBuiltIn(character: BuiltInCharacter): BuiltInCharacter {
  return { ...character }
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(value)
}

function isPrintableSingleGlyph(value: string): boolean {
  return value.length === 1 && value.charCodeAt(0) >= 32 && value.charCodeAt(0) <= 126
}

function validatePixelArt(pixelArt: PixelArt): void {
  if (
    !Number.isInteger(pixelArt.width) ||
    !Number.isInteger(pixelArt.height) ||
    pixelArt.width < 1 ||
    pixelArt.height < 1
  ) {
    throw new Error('pixelArt width and height must be positive integers')
  }
  const expectedDataLength = pixelArt.width * pixelArt.height * 4
  if (pixelArt.data.length !== expectedDataLength) {
    throw new Error('pixelArt data length must equal width * height * 4')
  }
  if (!pixelArt.data.every(channel => Number.isInteger(channel) && channel >= 0 && channel <= 255)) {
    throw new Error('pixelArt channels must be integer values from 0 to 255')
  }
}

function validateCustomCharacterInput(input: CustomCharacterInput): void {
  if (!input.name || input.name.trim().length === 0) {
    throw new Error('name is required')
  }
  if (!isHexColor(input.color)) {
    throw new Error('color must be a hex color')
  }
  if (!isPrintableSingleGlyph(input.glyph)) {
    throw new Error('glyph must be a single printable character')
  }
  validatePixelArt(input.pixelArt)
}

function cloneCustomRecord(
  record: CustomCharacterRecord,
): CustomCharacterRecord {
  return {
    ...record,
    pixelArt: {
      ...record.pixelArt,
      data: [...record.pixelArt.data],
    },
  }
}

export function createCustomCharacterManager(
  builtIns: BuiltInCharacter[],
  initialCustom: CustomCharacterRecord[],
  options?: { seed?: string },
): CustomCharacterManager {
  const seed = options?.seed ?? 'c'
  const builtInList: BuiltInCharacter[] = builtIns.map(cloneBuiltIn)
  const customList: CustomCharacterRecord[] = initialCustom.map(cloneCustomRecord)
  let counter = customList.reduce((highest, character) => {
    const match = character.id.match(new RegExp(`^${seed}-(\\d+)$`))
    return match ? Math.max(highest, Number(match[1])) : highest
  }, 0)
  let selectedId: string | null = null

  function nextId(): string {
    counter += 1
    return `${seed}-${counter}`
  }

  function findCharacter(
    id: string,
  ): BuiltInCharacter | CustomCharacterRecord | undefined {
    return (
      builtInList.find(c => c.id === id) ?? customList.find(c => c.id === id)
    )
  }

  return {
    addCustomCharacter(input: CustomCharacterInput): CustomCharacterRecord {
      validateCustomCharacterInput(input)

      const record: CustomCharacterRecord = {
        id: nextId(),
        kind: 'custom',
        name: input.name,
        color: input.color,
        glyph: input.glyph,
        pixelArt: {
          width: input.pixelArt.width,
          height: input.pixelArt.height,
          data: [...input.pixelArt.data],
        },
      }
      customList.push(record)
      return cloneCustomRecord(record)
    },

    listCharacters(): (BuiltInCharacter | CustomCharacterRecord)[] {
      return [
        ...builtInList.map(cloneBuiltIn),
        ...customList.map(cloneCustomRecord),
      ]
    },

    listCustomCharacters(): CustomCharacterRecord[] {
      return customList.map(cloneCustomRecord)
    },

    selectCharacter(id: string): boolean {
      const character = findCharacter(id)
      if (!character) return false
      selectedId = character.id
      return true
    },

    getSelectedCharacter(): (BuiltInCharacter | CustomCharacterRecord) | null {
      if (selectedId === null) return null
      const character = findCharacter(selectedId)
      if (!character) return null
      if ('kind' in character && character.kind === 'custom') {
        return cloneCustomRecord(character as CustomCharacterRecord)
      }
      return cloneBuiltIn(character)
    },

    removeCustomCharacter(id: string): boolean {
      const idx = customList.findIndex(c => c.id === id)
      if (idx === -1) return false
      customList.splice(idx, 1)
      // If the removed character was selected, fall back to first available.
      if (selectedId === id) {
        const all = [...builtInList, ...customList]
        selectedId = all.length > 0 ? all[0].id : null
      }
      return true
    },
  }
}

export function serializeCustomCharacters(
  characters: CustomCharacterRecord[],
): string {
  return JSON.stringify(characters)
}

export function deserializeCustomCharacters(raw: string): CustomCharacterRecord[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item: unknown): item is CustomCharacterRecord => {
      if (typeof item !== 'object' || item === null) return false
      const obj = item as Record<string, unknown>
      if (
        typeof obj.id === 'string' &&
        obj.kind === 'custom' &&
        typeof obj.name === 'string' &&
        obj.name.trim().length > 0 &&
        typeof obj.color === 'string' &&
        isHexColor(obj.color) &&
        typeof obj.glyph === 'string' &&
        isPrintableSingleGlyph(obj.glyph) &&
        typeof obj.pixelArt === 'object' &&
        obj.pixelArt !== null &&
        typeof (obj.pixelArt as Record<string, unknown>).width === 'number' &&
        typeof (obj.pixelArt as Record<string, unknown>).height === 'number' &&
        Array.isArray((obj.pixelArt as Record<string, unknown>).data)
      ) {
        try {
          validatePixelArt((obj as unknown as CustomCharacterRecord).pixelArt)
          return true
        } catch {
          return false
        }
      }
      return false
    })
  } catch {
    return []
  }
}
