import React from 'react'

type Props = {
  level: number
}

export const LevelMeter: React.FC<Props> = ({ level }) => {
  const clamped = Math.max(0, Math.min(1, level))
  const percentage = Math.round(clamped * 100)
  const color = clamped < 0.6 ? '#22c55e' : clamped < 0.85 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ width: '100%', height: 12, background: '#111827', borderRadius: 6, overflow: 'hidden', border: '1px solid #374151' }}>
      <div style={{ width: `${percentage}%`, height: '100%', background: color, transition: 'width 80ms linear' }} />
    </div>
  )
}