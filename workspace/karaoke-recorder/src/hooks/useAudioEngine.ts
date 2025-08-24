import { useEffect, useRef, useState } from 'react'
import { AudioEngine } from '../audio/AudioEngine'

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null)

  if (!engineRef.current) {
    engineRef.current = new AudioEngine()
  }

  useEffect(() => {
    const engine = engineRef.current!
    engine.init()
    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  return engineRef.current!
}

export function useLevel(engine: AudioEngine | null, fps: number = 24) {
  const [level, setLevel] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!engine) return
    let mounted = true

    const intervalMs = 1000 / fps
    let lastTime = performance.now()

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      const now = performance.now()
      if (now - lastTime >= intervalMs) {
        lastTime = now
        const l = engine.getMixLevel()
        if (mounted) setLevel(l)
      }
    }

    tick()

    return () => {
      mounted = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [engine, fps])

  return level
}