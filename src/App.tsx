import { useEffect, useState, useCallback, useRef } from 'react'
import type { CSSProperties } from 'react'
import { transition, stateLabel } from './shared/animationStateMachine'
import type { PetState } from './shared/animationStateMachine'
import { settingsStore } from './shared/settingsStore'
import { createSpeechBubble, dismissExpiredSpeechBubble } from './shared/speechBubble'
import type { SpeechBubble } from './shared/speechBubble'
import { createExplosion, tickParticles } from './renderer/explosionEngine'
import type { Particle } from './renderer/explosionEngine'
import { resolveExplosionConfig } from './renderer/explosionStyles'
import { createRandomEventScheduler } from './shared/randomEventScheduler'
import type { RandomEvent } from './shared/randomEventScheduler'
import { createMoodSystem } from './shared/moodSystem'
import { createBehaviorSettings } from './shared/behaviorSettings'
import { calculateDeferredPetBehavior, recoverDizziness } from './shared/deferredPetBehavior'
import { createReminderStore } from './shared/reminderStore'
import type { Reminder } from './shared/reminderStore'
import { BUILT_IN_PET_SKINS, getPetSkinByIndex, normalizePetSkinIndex } from './shared/petSkins'
import { resolveSoundCommand, getSoundPackById, type PetEvent } from './shared/soundPacks'
import { playTone } from './renderer/soundPlayer'
import { createCustomCharacterManager, type CustomCharacterRecord } from './shared/customCharacterManager'
import {
  exportCustomCharactersPackage,
  importCustomCharactersPackage,
  mergeImportedCustomCharacters,
} from './shared/customCharacterTransfer'

const PET_CHARS = BUILT_IN_PET_SKINS.map(skin => skin.label)

const RANDOM_EVENTS: RandomEvent[] = [
  { id: 'stretch', text: '*stretches*', moodEffect: 0 },
  { id: 'yawn', text: '*yawns*', moodEffect: -1 },
  { id: 'dance', text: '*dances*', moodEffect: 2 },
  { id: 'look', text: '*looks around*', moodEffect: 0 },
]

const eventScheduler = createRandomEventScheduler(Date.now())
const moodSystem = createMoodSystem()
const behaviorSettings = createBehaviorSettings()
const DEFERRED_BEHAVIOR_INTERVAL_MS = 1000
const SLEEP_AFTER_MS = 20_000
const CURSOR_PEEK_RADIUS_PX = 80
const EDGE_MARGIN_PX = 24
const EDGE_NUDGE_PX = 4
const reminderStore = createReminderStore([], { seed: 'rmd' })
const REMINDER_POLL_MS = 2000
const customCharacterManager = createCustomCharacterManager(
  BUILT_IN_PET_SKINS.map((skin, i) => ({ id: `builtin-${skin.id}`, name: skin.label, color: skin.primaryColor, glyph: String(i + 1) })),
  [],
  { seed: 'char' },
)

type ElectronCSSProperties = CSSProperties & {
  WebkitAppRegion?: 'drag' | 'no-drag'
}

declare global {
  interface Window {
    petAPI: {
      setPosition: (x: number, y: number) => Promise<void>
      showContextMenu: (currentIndex: number, currentPackId?: string) => Promise<void>
      onSwitchCharacter: (callback: (index: number) => void) => void
      onExplode: (callback: (styleId: string) => void) => void
      onSetSoundPack: (callback: (packId: string) => void) => void
    }
  }
}

export default function App() {
  const [state, setState] = useState<PetState>('idle')
  const [charIndex, setCharIndex] = useState(() => settingsStore.get('charIndex'))
  const [isDragging, setIsDragging] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const [deferredBehavior, setDeferredBehavior] = useState({
    sleeping: false,
    peekDirection: 'none' as 'left' | 'right' | 'none',
    edgeNudge: { x: 0, y: 0 },
    dizziness: 0,
  })
  const [speechBubble, setSpeechBubble] = useState<SpeechBubble | null>(() => (
    createSpeechBubble('Hi!', Date.now(), 1800)
  ))
  const [reminderText, setReminderText] = useState('')
  const [reminderDueSec, setReminderDueSec] = useState(30)
  const [showReminderInput, setShowReminderInput] = useState(false)
  const [pendingReminders, setPendingReminders] = useState<Reminder[]>(() => reminderStore.getPending())
  const [soundPackId, setSoundPackId] = useState(() => settingsStore.get('soundPackId'))
  const [customCharacters, setCustomCharacters] = useState<CustomCharacterRecord[]>(() => customCharacterManager.listCustomCharacters())
  const [showCharacterExport, setShowCharacterExport] = useState(false)
  const [exportText, setExportText] = useState('')
  const [importText, setImportText] = useState('')
  const [importResult, setImportResult] = useState('')
  const recentEventsRef = useRef<{ eventTime: number; eventId: string }[]>([])
  const stateRef = useRef(state)
  const cursorRef = useRef({ x: 100, y: 100 })
  const lastInteractionAtRef = useRef(Date.now())
  const dragGestureRef = useRef<{ startedAtMs: number; distancePx: number } | null>(null)
  const pendingDragRef = useRef<{ distancePx: number; durationMs: number } | null>(null)
  const dragWindowRef = useRef<{
    pointerId: number
    pointerStartX: number
    pointerStartY: number
    windowStartX: number
    windowStartY: number
    lastX: number
    lastY: number
    frameId: number
  } | null>(null)
  stateRef.current = state
  const soundPackRef = useRef(soundPackId)
  soundPackRef.current = soundPackId

  const playEventSound = useCallback((event: PetEvent) => {
    playTone(resolveSoundCommand(soundPackRef.current, event))
  }, [])

  useEffect(() => {
    settingsStore.set('charIndex', charIndex)
  }, [charIndex])

  useEffect(() => {
    settingsStore.set('soundPackId', soundPackId)
  }, [soundPackId])

  useEffect(() => {
    window.petAPI.onSwitchCharacter((i) => {
      const nextIndex = normalizePetSkinIndex(i)
      setCharIndex(nextIndex)
      setState(prev => transition(prev, 'idle'))
      setSpeechBubble(createSpeechBubble(getPetSkinByIndex(nextIndex).label, Date.now()))
      playEventSound('switch')
    })

    window.petAPI.onExplode((styleId: string) => {
      const config = resolveExplosionConfig(styleId, { centerX: 100, centerY: 100 })
      setState('exploding')
      setSpeechBubble(createSpeechBubble('Boom!', Date.now()))
      setParticles(createExplosion(config))
      playEventSound('explode')
      window.setTimeout(() => {
        setState('idle')
        setParticles([])
      }, 1500)
    })

    window.petAPI.onSetSoundPack((packId: string) => {
      const pack = getSoundPackById(packId)
      setSoundPackId(pack.id)
      setSpeechBubble(createSpeechBubble(`Sound: ${pack.label}`, Date.now(), 1200))
      playTone(resolveSoundCommand(pack.id, 'switch'))
    })
  }, [playEventSound])

  useEffect(() => {
    if (!speechBubble) return
    const delay = Math.max(speechBubble.visibleUntil - Date.now(), 0)
    const id = window.setTimeout(() => {
      setSpeechBubble(current => dismissExpiredSpeechBubble(current, Date.now()))
    }, delay)
    return () => window.clearTimeout(id)
  }, [speechBubble])

  // Phase 2: low-frequency random events and mood tick
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now()
      const currentState = stateRef.current
      const blocked = currentState === 'dragging' || currentState === 'exploding'

      const shouldFire = eventScheduler.shouldFire(
        now,
        {
          randomEventIntervalMs: behaviorSettings.getRandomEventIntervalMs(),
          lowResourceMode: behaviorSettings.getLowResourceMode(),
        },
        recentEventsRef.current,
        { randomEventBlocked: blocked },
      )

      if (shouldFire) {
        const evt = eventScheduler.pickEvent(RANDOM_EVENTS)
        setSpeechBubble(createSpeechBubble(evt.text, now, 1400))
        moodSystem.applyMoodEffect(evt.moodEffect)
        recentEventsRef.current = [
          ...recentEventsRef.current.slice(-10),
          { eventTime: now, eventId: evt.id },
        ]
      }

      // Silent mood drift
      moodSystem.tick(now, 1)
    }, behaviorSettings.getEffectiveInterval())

    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (particles.length === 0) return

    let frameId = 0
    const tick = () => {
      setParticles(prev => tickParticles(prev))
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [particles.length > 0])

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now()
      const behavior = calculateDeferredPetBehavior({
        nowMs: now,
        lastInteractionAtMs: lastInteractionAtRef.current,
        petState: stateRef.current,
        petCenter: {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        },
        cursor: cursorRef.current,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        drag: pendingDragRef.current,
        lowResourceMode: behaviorSettings.getLowResourceMode(),
        sleepAfterMs: SLEEP_AFTER_MS,
        cursorPeekRadius: CURSOR_PEEK_RADIUS_PX,
        edgeMarginPx: EDGE_MARGIN_PX,
        edgeNudgePx: EDGE_NUDGE_PX,
      })

      pendingDragRef.current = null
      setDeferredBehavior(previous => ({
        sleeping: behavior.sleeping,
        peekDirection: behavior.peekDirection,
        edgeNudge: behavior.edgeNudge,
        dizziness: Math.max(behavior.dizziness, recoverDizziness(previous.dizziness, 2)),
      }))

      if (behavior.speech && stateRef.current !== 'dragging' && stateRef.current !== 'exploding') {
        setSpeechBubble(createSpeechBubble(behavior.speech, now, 1200))
      }
    }, DEFERRED_BEHAVIOR_INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [])

  // Phase 2 Deferred 2: poll for due reminders
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now()
      const due = reminderStore.getDue(now)
      if (due.length > 0) {
        setSpeechBubble(createSpeechBubble(`Reminder: ${due[0].text}`, now, 5000))
        reminderStore.markComplete(due[0].id)
        playEventSound('reminder')
      }
      setPendingReminders(reminderStore.getPending())
    }, REMINDER_POLL_MS)

    return () => window.clearInterval(id)
  }, [])

  const go = useCallback((next: PetState) => {
    setState(prev => transition(prev, next))
  }, [])

  const scheduleWindowMove = useCallback(() => {
    const drag = dragWindowRef.current
    if (!drag || drag.frameId !== 0) return

    drag.frameId = window.requestAnimationFrame(() => {
      const current = dragWindowRef.current
      if (!current) return
      current.frameId = 0
      const x = current.windowStartX + current.lastX - current.pointerStartX
      const y = current.windowStartY + current.lastY - current.pointerStartY
      void window.petAPI.setPosition(x, y)
    })
  }, [])

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button === 2) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const now = Date.now()
    lastInteractionAtRef.current = Date.now()
    dragGestureRef.current = { startedAtMs: now, distancePx: 0 }
    dragWindowRef.current = {
      pointerId: event.pointerId,
      pointerStartX: event.screenX,
      pointerStartY: event.screenY,
      windowStartX: window.screenX,
      windowStartY: window.screenY,
      lastX: event.screenX,
      lastY: event.screenY,
      frameId: 0,
    }
    cursorRef.current = { x: event.clientX, y: event.clientY }
    setIsDragging(true)
    go('clicked')
    playEventSound('click')
  }, [go])

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    cursorRef.current = { x: event.clientX, y: event.clientY }
    const drag = dragWindowRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = event.screenX - drag.lastX
    const dy = event.screenY - drag.lastY
    drag.lastX = event.screenX
    drag.lastY = event.screenY
    lastInteractionAtRef.current = Date.now()
    if (dragGestureRef.current) {
      dragGestureRef.current.distancePx += Math.hypot(dx, dy)
    }
    if (stateRef.current !== 'dragging') go('dragging')
    scheduleWindowMove()
  }, [go, scheduleWindowMove])

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const now = Date.now()
    lastInteractionAtRef.current = now
    const drag = dragWindowRef.current
    if (drag && drag.frameId !== 0) {
      window.cancelAnimationFrame(drag.frameId)
    }
    const x = drag ? drag.windowStartX + drag.lastX - drag.pointerStartX : window.screenX
    const y = drag ? drag.windowStartY + drag.lastY - drag.pointerStartY : window.screenY
    if (drag) {
      void window.petAPI.setPosition(x, y)
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (stateRef.current === 'dragging') {
      if (dragGestureRef.current) {
        pendingDragRef.current = {
          distancePx: dragGestureRef.current.distancePx,
          durationMs: Math.max(now - dragGestureRef.current.startedAtMs, 1),
        }
      }
      go('dragRecover')
      setSpeechBubble(createSpeechBubble('Placed!', Date.now()))
      settingsStore.set('windowX', x)
      settingsStore.set('windowY', y)
    } else {
      go('idle')
    }
    dragGestureRef.current = null
    dragWindowRef.current = null
    setIsDragging(false)
  }, [go])

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    lastInteractionAtRef.current = Date.now()
    window.petAPI.showContextMenu(charIndex, soundPackId)
  }, [charIndex, soundPackId])

  const handleAddReminder = useCallback(() => {
    const trimmed = reminderText.trim()
    if (!trimmed) return
    try {
      reminderStore.addReminder(trimmed, Date.now() + reminderDueSec * 1000)
      setReminderText('')
      setPendingReminders(reminderStore.getPending())
    } catch {
      // Text is required; already trimmed above.
    }
  }, [reminderText, reminderDueSec])

  const handleToggleReminderInput = useCallback(() => {
    setShowReminderInput(prev => !prev)
  }, [])

  const handleExportCharacters = useCallback(() => {
    setExportText(exportCustomCharactersPackage(customCharacters))
    setShowCharacterExport(true)
    setImportResult('')
  }, [customCharacters])

  const handleCopyExport = useCallback(() => {
    navigator.clipboard.writeText(exportText).catch(() => {})
  }, [exportText])

  const handleImportCharacters = useCallback(() => {
    const imported = importCustomCharactersPackage(importText)
    if (imported.length === 0) {
      setImportResult('No valid characters found.')
      return
    }
    const merged = mergeImportedCustomCharacters(customCharacters, imported)
    const added = merged.slice(customCharacters.length)
    setCustomCharacters(merged)
    setExportText(exportCustomCharactersPackage(merged))
    setImportResult(added.length > 0 ? `Imported: ${added.map(c => c.name).join(', ')}` : 'No new characters imported.')
    setImportText('')
  }, [customCharacters, importText])

  const peekOffset = deferredBehavior.peekDirection === 'left'
    ? -4
    : deferredBehavior.peekDirection === 'right'
      ? 4
      : 0
  const petTransform = [
    `translate(${deferredBehavior.edgeNudge.x + peekOffset}px, ${deferredBehavior.edgeNudge.y}px)`,
    `rotate(${deferredBehavior.dizziness * 0.8}deg)`,
    `scaleY(${deferredBehavior.sleeping ? 0.82 : 1})`,
  ].join(' ')
  const selectedSkin = getPetSkinByIndex(charIndex)

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        WebkitAppRegion: 'no-drag',
        fontSize: state === 'exploding' ? 60 : 48,
        transition: 'font-size 0.2s',
        position: 'relative',
      } as ElectronCSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={handleContextMenu}
      aria-label={`Desktop pet ${selectedSkin.label} ${stateLabel(state)}`}
    >
      {speechBubble && (
        <div
          role="status"
          style={{
            position: 'absolute',
            top: 20,
            padding: '6px 10px',
            borderRadius: 4,
            background: '#ffffff',
            color: '#111',
            fontFamily: 'monospace',
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
          }}
        >
          {speechBubble.text}
        </div>
      )}
      {particles.length > 0 && state === 'exploding' ? (
        <svg width={200} height={200} style={{ position: 'absolute' }}>
          {particles.map((particle, i) => (
            <circle
              key={i}
              cx={particle.x}
              cy={particle.y}
              r={particle.size / 2}
              fill={particle.color}
            />
          ))}
        </svg>
      ) : (
        <span
          aria-label={selectedSkin.label}
          title={selectedSkin.label}
          style={{
            position: 'relative',
            width: 64,
            height: 64,
            display: 'grid',
            placeItems: 'center',
            background: selectedSkin.primaryColor,
            color: selectedSkin.textColor,
            imageRendering: 'pixelated',
            boxShadow: `inset 0 0 0 8px ${selectedSkin.accentColor}, 0 8px 18px rgba(0,0,0,0.18)`,
            fontFamily: 'monospace',
            fontWeight: 800,
            fontSize: 22,
            transform: petTransform,
            transition: 'transform 0.18s ease',
          }}
        >
          {charIndex + 1}
        </span>
      )}
      {state === 'exploding' && particles.length === 0 && (
        <span>BOOM</span>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          fontFamily: 'monospace',
          fontSize: 11,
        }}
      >
        <button
          onClick={handleToggleReminderInput}
          style={{
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '2px 8px',
            cursor: 'pointer',
            fontSize: 11,
          }}
          title="Toggle reminder input"
        >
          {showReminderInput ? 'Close' : 'Remind'}
        </button>
        {showReminderInput && (
          <div
            style={{
              background: 'rgba(30,30,30,0.85)',
              color: '#eee',
              borderRadius: 6,
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 180,
            }}
          >
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                value={reminderText}
                onChange={e => setReminderText(e.target.value)}
                placeholder="Remind me to..."
                onKeyDown={e => { if (e.key === 'Enter') handleAddReminder() }}
                style={{
                  flex: 1,
                  fontSize: 11,
                  padding: '2px 4px',
                  border: 'none',
                  borderRadius: 2,
                }}
              />
              <select
                value={reminderDueSec}
                onChange={e => setReminderDueSec(Number(e.target.value))}
                style={{ fontSize: 11, border: 'none', borderRadius: 2 }}
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
              <button
                onClick={handleAddReminder}
                style={{
                  background: '#4a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 2,
                  padding: '2px 6px',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                Add
              </button>
            </div>
            {pendingReminders.length > 0 && (
              <div style={{ maxHeight: 80, overflowY: 'auto', fontSize: 10, lineHeight: '1.4' }}>
                {pendingReminders.map(r => (
                  <div key={r.id} style={{ color: '#ccc' }}>
                    - {r.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleExportCharacters}
          style={{
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '2px 8px',
            cursor: 'pointer',
            fontSize: 11,
          }}
          title="Export custom characters"
        >
          Export
        </button>
        {showCharacterExport && (
          <div
            style={{
              background: 'rgba(30,30,30,0.85)',
              color: '#eee',
              borderRadius: 6,
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 200,
              maxWidth: 260,
              fontFamily: 'monospace',
              fontSize: 10,
            }}
          >
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                onClick={handleCopyExport}
                style={{
                  background: '#47a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 2,
                  padding: '2px 6px',
                  cursor: 'pointer',
                  fontSize: 10,
                }}
              >
                Copy
              </button>
              <button
                onClick={() => setShowCharacterExport(false)}
                style={{
                  background: '#555',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 2,
                  padding: '2px 6px',
                  cursor: 'pointer',
                  fontSize: 10,
                }}
              >
                Close
              </button>
            </div>
            <textarea
              readOnly
              value={exportText}
              rows={3}
              style={{ fontSize: 10, border: 'none', borderRadius: 2, resize: 'none', fontFamily: 'monospace' }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="Paste export data..."
                style={{ flex: 1, fontSize: 10, border: 'none', borderRadius: 2, padding: '2px 4px', fontFamily: 'monospace' }}
              />
              <button
                onClick={handleImportCharacters}
                style={{
                  background: '#a74',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 2,
                  padding: '2px 6px',
                  cursor: 'pointer',
                  fontSize: 10,
                }}
              >
                Import
              </button>
            </div>
            {importResult && (
              <div style={{ color: '#8c8', fontSize: 10 }}>{importResult}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
