import { describe, it } from 'node:test'
import assert from 'node:assert'
import { createSpeechBubble, dismissExpiredSpeechBubble, isSpeechBubbleVisible } from './speechBubble'

void describe('speechBubble', () => {
  void it('creates a visible bubble with deterministic expiry', () => {
    const bubble = createSpeechBubble('Hello', 1000, 500)

    assert.deepStrictEqual(bubble, {
      text: 'Hello',
      visibleUntil: 1500,
    })
    assert.strictEqual(isSpeechBubbleVisible(bubble, 1499), true)
  })

  void it('dismisses expired bubbles', () => {
    const bubble = createSpeechBubble('Done', 1000, 500)

    assert.strictEqual(dismissExpiredSpeechBubble(bubble, 1500), null)
  })

  void it('keeps unexpired bubbles', () => {
    const bubble = createSpeechBubble('Dragging', 1000, 500)

    assert.strictEqual(dismissExpiredSpeechBubble(bubble, 1200), bubble)
  })
})
