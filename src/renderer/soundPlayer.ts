// Phase 3 Deferred Slice 3: minimal WebAudio adapter for synthesized tones.
// Runs only in the renderer process where the WebAudio API is available.

import type { ToneCommand } from '../shared/soundPacks'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (audioCtx) return audioCtx
  try {
    audioCtx = new AudioContext()
    return audioCtx
  } catch {
    return null
  }
}

/**
 * Play a synthesized tone from a resolved ToneCommand.
 * Silently no-ops if the command is disabled or WebAudio is unavailable.
 */
export function playTone(command: ToneCommand): void {
  if (!command.enabled) return

  const ctx = getAudioContext()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.value = command.frequencyHz
  gainNode.gain.value = command.gain

  osc.connect(gainNode)
  gainNode.connect(ctx.destination)

  const now = ctx.currentTime
  const durationSec = command.durationMs / 1000
  osc.start(now)
  gainNode.gain.setValueAtTime(Math.max(command.gain, 0.001), now + durationSec)
  osc.stop(now + durationSec + 0.01)

  osc.onended = () => {
    osc.disconnect()
    gainNode.disconnect()
  }
}
