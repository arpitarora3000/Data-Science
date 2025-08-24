import React, { useRef, useState } from 'react'

export type Track = {
  id: string
  title: string
  artist?: string
  url: string
  format?: string
}

type Props = {
  audioRef: React.RefObject<HTMLAudioElement | null>
  tracks: Track[]
  onSelect?: (track: Track | null) => void
}

export const TrackLibrary: React.FC<Props> = ({ audioRef, tracks, onSelect }) => {
  const [current, setCurrent] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [customUrl, setCustomUrl] = useState('')

  const setAudioSrc = (src: string) => {
    const el = audioRef.current
    if (!el) return
    if (el.src !== src) {
      el.src = src
      el.load()
    }
  }

  const handleSelect = (id: string) => {
    setCurrent(id)
    const t = tracks.find(t => t.id === id) || null
    if (t) setAudioSrc(t.url)
    onSelect?.(t)
  }

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file)
    setAudioSrc(url)
    setCurrent('uploaded')
    onSelect?.({ id: 'uploaded', title: file.name, url })
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <label style={{ fontSize: 12, color: '#9CA3AF' }}>Backing Track</label>
      <select value={current} onChange={(e) => handleSelect(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6 }}>
        <option value="">None</option>
        {tracks.map(t => (
          <option key={t.id} value={t.id}>{t.title}{t.artist ? ` — ${t.artist}` : ''}</option>
        ))}
      </select>

      <button onClick={() => fileInputRef.current?.click()} style={{ padding: '6px 10px', borderRadius: 6 }}>Upload</button>
      <input ref={fileInputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={(e) => {
        const f = e.target.files?.[0]
        if (f) handleFile(f)
      }} />

      <input
        placeholder="Paste audio URL"
        value={customUrl}
        onChange={(e) => setCustomUrl(e.target.value)}
        style={{ minWidth: 220, padding: '6px 8px', borderRadius: 6 }}
      />
      <button onClick={() => { if (customUrl) { setAudioSrc(customUrl); setCurrent('url'); onSelect?.({ id: 'url', title: customUrl, url: customUrl }) } }} style={{ padding: '6px 10px', borderRadius: 6 }}>Load URL</button>
    </div>
  )
}