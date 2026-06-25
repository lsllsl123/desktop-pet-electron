import assert from 'node:assert/strict'
import test from 'node:test'
import {
  pixelateImage,
  type PixelatorInput,
} from './imagePixelator'

function rgba(values: number[]): Uint8ClampedArray {
  return new Uint8ClampedArray(values)
}

test('averages each block and fills the block with the averaged color', () => {
  const input: PixelatorInput = {
    width: 2,
    height: 2,
    data: rgba([
      10, 20, 30, 255,
      30, 40, 50, 255,
      50, 60, 70, 255,
      70, 80, 90, 255,
    ]),
  }

  const output = pixelateImage(input, { pixelSize: 2 })

  assert.equal(output.width, 2)
  assert.equal(output.height, 2)
  assert.deepEqual(Array.from(output.data), [
    40, 50, 60, 255,
    40, 50, 60, 255,
    40, 50, 60, 255,
    40, 50, 60, 255,
  ])
})

test('handles non-divisible dimensions by averaging partial edge blocks', () => {
  const input: PixelatorInput = {
    width: 3,
    height: 1,
    data: rgba([
      0, 0, 0, 255,
      100, 100, 100, 255,
      200, 200, 200, 255,
    ]),
  }

  const output = pixelateImage(input, { pixelSize: 2 })

  assert.deepEqual(Array.from(output.data), [
    50, 50, 50, 255,
    50, 50, 50, 255,
    200, 200, 200, 255,
  ])
})

test('quantizes averaged block colors to the nearest palette color', () => {
  const input: PixelatorInput = {
    width: 2,
    height: 1,
    data: rgba([
      200, 20, 20, 255,
      220, 30, 30, 255,
    ]),
  }

  const output = pixelateImage(input, {
    pixelSize: 2,
    palette: [
      [0, 0, 255, 255],
      [255, 0, 0, 255],
    ],
  })

  assert.deepEqual(Array.from(output.data), [
    255, 0, 0, 255,
    255, 0, 0, 255,
  ])
})

test('does not mutate the input data', () => {
  const data = rgba([
    1, 2, 3, 255,
    5, 6, 7, 255,
  ])
  const before = Array.from(data)

  pixelateImage({ width: 2, height: 1, data }, { pixelSize: 2 })

  assert.deepEqual(Array.from(data), before)
})

test('rejects invalid input dimensions, buffer length, pixel size, and palette', () => {
  assert.throws(
    () => pixelateImage({ width: 0, height: 1, data: rgba([]) }, { pixelSize: 1 }),
    /width and height must be positive integers/,
  )
  assert.throws(
    () => pixelateImage({ width: 1, height: 1, data: rgba([0, 0, 0]) }, { pixelSize: 1 }),
    /data length must equal width \* height \* 4/,
  )
  assert.throws(
    () => pixelateImage({ width: 1, height: 1, data: rgba([0, 0, 0, 255]) }, { pixelSize: 0 }),
    /pixelSize must be a positive integer/,
  )
  assert.throws(
    () => pixelateImage(
      { width: 1, height: 1, data: rgba([0, 0, 0, 255]) },
      { pixelSize: 1, palette: [[0, 0, 0]] },
    ),
    /palette colors must be RGBA tuples/,
  )
  assert.throws(
    () => pixelateImage(
      { width: 1, height: 1, data: rgba([0, 0, 0, 255]) },
      { pixelSize: 1, palette: [[0, 0, 0, 300]] },
    ),
    /palette channels must be finite values from 0 to 255/,
  )
})
