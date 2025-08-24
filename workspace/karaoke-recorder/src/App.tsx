import { useEffect, useRef, useState } from 'react'
import './App.css'
import { useAudioEngine } from './hooks/useAudioEngine'
import { DeviceSelector } from './components/DeviceSelector'
import { TrackLibrary } from './components/TrackLibrary'
import { RecorderControls } from './components/RecorderControls'
import { curatedTracks } from './library/tracks'

function App() {
  const engine = useAudioEngine()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [selectedTitle, setSelectedTitle] = useState<string>('None')

  useEffect(() => {
    if (!audioRef.current) return
    engine.attachTrackElement(audioRef.current)
  }, [engine])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0 }}>Karaoke Recorder</h1>
      <p style={{ marginTop: 0, color: '#6B7280' }}>Select a backing track or upload your own, choose your mic, and record your performance.</p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <TrackLibrary audioRef={audioRef} tracks={curatedTracks} onSelect={(t) => setSelectedTitle(t?.title || 'None')} />
        <DeviceSelector engine={engine} />
      </div>

      <audio ref={audioRef} controls style={{ width: '100%' }} crossOrigin="anonymous" />
      <RecorderControls engine={engine} audioRef={audioRef} />

      <div style={{ fontSize: 12, color: '#9CA3AF' }}>Current track: {selectedTitle}</div>
    </div>
  )
}

export default App
