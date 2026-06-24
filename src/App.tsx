import { useEffect, useState, useCallback } from 'react'
import { transition, stateLabel } from './shared/animationStateMachine'
import type { PetState } from './shared/animationStateMachine'
import { settingsStore } from './shared/settingsStore'
import { createSpeechBubble, dismissExpiredSpeechBubble } from './shared/speechBubble'
import type { SpeechBubble } from './shared/speechBubble'
import { createExplosion, tickParticles } from './renderer/explosionEngine'
import type { Particle } from './renderer/explosionEngine'

const PET_CHARS = ['Pixel Cat', 'Pixel Dog', 'Pixel Frog', 'Pixel Panda', 'Pixel Bot']
const PET_COLORS = ['#ff8fab', '#74c0fc', '#69db7c', '#ffd43b', '#b197fc']

declare global {
  interface Window {
    petAPI: {
      setPosition: (x: number, y: number) => Promise<void>
      showContextMenu: (currentIndex: number) => Promise<void>
      onSwitchCharacter: (callback: (index: number) => void) => void
      onExplode: (callback: () => void) => void
    }
  }
}

export default function App() {
  const [state, setState] = useState<PetState>('idle')
  const [charIndex, setCharIndex] = useState(() => settingsStore.get('charIndex'))
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [speechBubble, setSpeechBubble] = useState<SpeechBubble | null>(() => (
    createSpeechBubble('Hi!', Date.now(), 1800)
  ))

  useEffect(() => {
    settingsStore.set('charIndex', charIndex)
  }, [charIndex])

  useEffect(() => {
    window.petAPI.onSwitchCharacter((i) => {
      setCharIndex(i)
      setState(prev => transition(prev, 'idle'))
      setSpeechBubble(createSpeechBubble(PET_CHARS[i], Date.now()))
    })

    window.petAPI.onExplode(() => {
      setState('exploding')
      setSpeechBubble(createSpeechBubble('Boom!', Date.now()))
      setParticles(createExplosion({ centerX: 100, centerY: 100 }))
      window.setTimeout(() => {
        setState('idle')
        setParticles([])
      }, 1500)
    })
  }, [])

  useEffect(() => {
    if (!speechBubble) return
    const delay = Math.max(speechBubble.visibleUntil - Date.now(), 0)
    const id = window.setTimeout(() => {
      setSpeechBubble(current => dismissExpiredSpeechBubble(current, Date.now()))
    }, delay)
    return () => window.clearTimeout(id)
  }, [speechBubble])

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

  const go = useCallback((next: PetState) => {
    setState(prev => transition(prev, next))
  }, [])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button === 2) return
    setDragStart({ x: event.clientX, y: event.clientY })
    go('clicked')
  }, [go])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragStart) return
    const dx = event.clientX - dragStart.x
    const dy = event.clientY - dragStart.y
    setOffset(current => ({ x: current.x + dx, y: current.y + dy }))
    setDragStart({ x: event.clientX, y: event.clientY })
    go('dragging')
  }, [dragStart, go])

  const handleMouseUp = useCallback(() => {
    if (state === 'dragging') {
      go('dragRecover')
      setSpeechBubble(createSpeechBubble('Placed!', Date.now()))
      const x = window.screenX + offset.x
      const y = window.screenY + offset.y
      window.petAPI.setPosition(x, y)
      settingsStore.set('windowX', x)
      settingsStore.set('windowY', y)
    } else {
      go('idle')
    }
    setDragStart(null)
  }, [state, offset, go])

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    window.petAPI.showContextMenu(charIndex)
  }, [charIndex])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: dragStart ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitAppRegion: 'no-drag',
        fontSize: state === 'exploding' ? 60 : 48,
        transition: 'font-size 0.2s',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      aria-label={`Desktop pet ${PET_CHARS[charIndex]} ${stateLabel(state)}`}
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
          aria-label={PET_CHARS[charIndex]}
          title={PET_CHARS[charIndex]}
          style={{
            position: 'relative',
            width: 64,
            height: 64,
            display: 'grid',
            placeItems: 'center',
            background: PET_COLORS[charIndex],
            color: '#111',
            imageRendering: 'pixelated',
            boxShadow: 'inset 0 0 0 8px rgba(255,255,255,0.35), 0 8px 18px rgba(0,0,0,0.18)',
            fontFamily: 'monospace',
            fontWeight: 800,
            fontSize: 22,
          }}
        >
          {charIndex + 1}
        </span>
      )}
      {state === 'exploding' && particles.length === 0 && (
        <span>BOOM</span>
      )}
    </div>
  )
}
