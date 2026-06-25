// Phase 2 Deferred Slice 3: deterministic local image-to-pixel-art processing.
// Pure module: no DOM, no timers, no side effects.

export interface PixelatorInput {
  width: number
  height: number
  data: Uint8ClampedArray
}

export interface PixelatorOptions {
  pixelSize: number
  palette?: number[][]
}

/**
 * Convert an RGBA image buffer into blocky pixel-art output.
 * Each block of size `pixelSize` by `pixelSize` is filled with the average color
 * of its source pixels. If grouping yields an image smaller than the input,
 * partial edge blocks are averaged over the pixels that exist.
 *
 * When `palette` is provided, each averaged block color is quantized to the
 * nearest palette color using Euclidean distance in RGBA space.
 */
export function pixelateImage(
  input: PixelatorInput,
  options: PixelatorOptions,
): PixelatorInput {
  const { width, height, data } = input
  const { pixelSize, palette } = options

  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error('width and height must be positive integers')
  }
  if (data.length !== width * height * 4) {
    throw new Error('data length must equal width * height * 4')
  }
  if (!Number.isInteger(pixelSize) || pixelSize < 1) {
    throw new Error('pixelSize must be a positive integer')
  }
  if (palette !== undefined) {
    for (const color of palette) {
      if (!Array.isArray(color) || color.length !== 4) {
        throw new Error('palette colors must be RGBA tuples')
      }
      if (!color.every(channel => Number.isFinite(channel) && channel >= 0 && channel <= 255)) {
        throw new Error('palette channels must be finite values from 0 to 255')
      }
    }
  }

  const out = new Uint8ClampedArray(data.length)

  for (let blockRow = 0; blockRow < height; blockRow += pixelSize) {
    const blockEndRow = Math.min(blockRow + pixelSize, height)

    for (let blockCol = 0; blockCol < width; blockCol += pixelSize) {
      const blockEndCol = Math.min(blockCol + pixelSize, width)

      let sumR = 0
      let sumG = 0
      let sumB = 0
      let sumA = 0
      let count = 0

      for (let y = blockRow; y < blockEndRow; y++) {
        for (let x = blockCol; x < blockEndCol; x++) {
          const idx = (y * width + x) * 4
          sumR += data[idx]
          sumG += data[idx + 1]
          sumB += data[idx + 2]
          sumA += data[idx + 3]
          count++
        }
      }

      let avgR = Math.round(sumR / count)
      let avgG = Math.round(sumG / count)
      let avgB = Math.round(sumB / count)
      let avgA = Math.round(sumA / count)

      if (palette !== undefined && palette.length > 0) {
        const nearest = findNearestPaletteColor(avgR, avgG, avgB, avgA, palette)
        avgR = nearest[0]
        avgG = nearest[1]
        avgB = nearest[2]
        avgA = nearest[3]
      }

      // Fill every pixel in the block with the averaged color.
      for (let y = blockRow; y < blockEndRow; y++) {
        for (let x = blockCol; x < blockEndCol; x++) {
          const idx = (y * width + x) * 4
          out[idx] = avgR
          out[idx + 1] = avgG
          out[idx + 2] = avgB
          out[idx + 3] = avgA
        }
      }
    }
  }

  return { width, height, data: out }
}

/**
 * Find the palette color nearest to (r,g,b,a) by Euclidean distance in RGBA space.
 * Alpha is included in the distance calculation and weighted equally.
 */
function findNearestPaletteColor(
  r: number,
  g: number,
  b: number,
  a: number,
  palette: number[][],
): number[] {
  let bestIdx = 0
  let bestDist = Infinity

  for (let i = 0; i < palette.length; i++) {
    const [pr, pg, pb, pa] = palette[i]
    const dr = r - pr
    const dg = g - pg
    const db = b - pb
    const da = a - pa
    const dist = dr * dr + dg * dg + db * db + da * da
    if (dist < bestDist) {
      bestDist = dist
      bestIdx = i
    }
  }

  return palette[bestIdx]
}
