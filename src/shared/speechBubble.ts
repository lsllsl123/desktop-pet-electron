export interface SpeechBubble {
  text: string
  visibleUntil: number
}

export function createSpeechBubble(text: string, now: number, durationMs = 1600): SpeechBubble {
  return {
    text,
    visibleUntil: now + durationMs,
  }
}

export function isSpeechBubbleVisible(bubble: SpeechBubble | null, now: number): boolean {
  return bubble !== null && now < bubble.visibleUntil
}

export function dismissExpiredSpeechBubble(bubble: SpeechBubble | null, now: number): SpeechBubble | null {
  return isSpeechBubbleVisible(bubble, now) ? bubble : null
}
