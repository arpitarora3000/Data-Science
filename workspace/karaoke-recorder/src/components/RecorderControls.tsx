import React, { useEffect, useRef, useState } from 'react'
import { AudioEngine, type RecordingOptions, type RecordingResult } from '../audio/AudioEngine'
import { LevelMeter } from './LevelMeter'

type Props = {
  engine: AudioEngine
  audioRef: React.RefObject<HTMLAudioElement | null>
}

export const RecorderControls: React.FC<Props> = ({ engine, audioRef }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [micGain, setMicGain] = useState(1)
  const [trackGain, setTrackGain] = useState(1)
  const [masterGain, setMasterGain] = useState(1)
  const [bitrate, setBitrate] = useState(160)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState<string>('recording.webm')

  const [level, setLevel] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      setLevel(engine.getMixLevel())
    }
    tick()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [engine])

  useEffect(() => {
    engine.setMicGain(micGain)
  }, [micGain])
  useEffect(() => {
    engine.setTrackGain(trackGain)
  }, [trackGain])
  useEffect(() => {
    engine.setMasterGain(masterGain)
  }, [masterGain])

  const togglePlay = async () => {
    const el = audioRef.current
    if (!el) return
    await engine.ensureContext()
    if (el.paused) {
      await el.play().catch(() => {})
      setIsPlaying(true)
    } else {
      el.pause()
      setIsPlaying(false)
    }
  }

  const startRecording = async () => {
    await engine.startRecording({ audioBitsPerSecond: bitrate * 1000 } as RecordingOptions)
  }

  const stopRecording = async () => {
    const result: RecordingResult = await engine.stopRecording()
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    setDownloadUrl(result.url)
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={togglePlay} style={{ padding: '8px 12px', borderRadius: 6 }}>{isPlaying ? 'Pause' : 'Play'}</button>
        {!engine.isRecording() ? (
          <button onClick={startRecording} style={{ padding: '8px 12px', borderRadius: 6, background: '#10B981', color: 'white' }}>Record</button>
        ) : (
          <button onClick={stopRecording} style={{ padding: '8px 12px', borderRadius: 6, background: '#EF4444', color: 'white' }}>Stop</button>
        )}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: '#9CA3AF' }}>Bitrate: {bitrate} kbps</label>
          <input type="range" min={64} max={320} step={32} value={bitrate} onChange={(e) => setBitrate(Number(e.target.value))} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', alignItems: 'center', gap: 8 }}>
          <label>Mic</label>
          <input type="range" min={0} max={2} step={0.01} value={micGain} onChange={(e) => setMicGain(Number(e.target.value))} />
          <span>{micGain.toFixed(2)}x</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', alignItems: 'center', gap: 8 }}>
          <label>Track</label>
          <input type="range" min={0} max={2} step={0.01} value={trackGain} onChange={(e) => setTrackGain(Number(e.target.value))} />
          <span>{trackGain.toFixed(2)}x</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', alignItems: 'center', gap: 8 }}>
          <label>Master</label>
          <input type="range" min={0} max={2} step={0.01} value={masterGain} onChange={(e) => setMasterGain(Number(e.target.value))} />
          <span>{masterGain.toFixed(2)}x</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px', alignItems: 'center', gap: 8 }}>
          <label>Level</label>
          <LevelMeter level={level} />
          <span>{Math.round(level * 100)}%</span>
        </div>
      </div>

      {downloadUrl && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href={downloadUrl} download={downloadName} style={{ padding: '8px 12px', borderRadius: 6, background: '#3B82F6', color: 'white', textDecoration: 'none' }}>Download</a>
          <input value={downloadName} onChange={(e) => setDownloadName(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6 }} />
        </div>
      )}
    </div>
  )
}