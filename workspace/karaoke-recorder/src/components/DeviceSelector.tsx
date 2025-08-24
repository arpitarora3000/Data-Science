import React, { useEffect, useState } from 'react'
import { AudioEngine, type InputDevice } from '../audio/AudioEngine'

type Props = {
  engine: AudioEngine
}

export const DeviceSelector: React.FC<Props> = ({ engine }) => {
  const [devices, setDevices] = useState<InputDevice[]>([])
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    let mounted = true
    engine.listInputDevices().then(list => {
      if (!mounted) return
      setDevices(list)
      if (list.length && !selected) {
        setSelected(list[0].deviceId)
        engine.setMicDevice(list[0].deviceId)
      }
    })

    const onChange = () => {
      engine.listInputDevices().then(list => mounted && setDevices(list))
    }
    navigator.mediaDevices.addEventListener('devicechange', onChange)

    return () => {
      mounted = false
      navigator.mediaDevices.removeEventListener('devicechange', onChange)
    }
  }, [])

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <label style={{ fontSize: 12, color: '#9CA3AF' }}>Microphone</label>
      <select
        value={selected}
        onChange={async (e) => {
          const id = e.target.value
          setSelected(id)
          await engine.setMicDevice(id)
        }}
        style={{ padding: '6px 8px', borderRadius: 6 }}
      >
        {devices.map(d => (
          <option key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone'}</option>
        ))}
      </select>
    </div>
  )
}