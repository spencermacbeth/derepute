import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
        }}
      >
        {/* Outer purple ring */}
        <div
          style={{
            position: 'absolute',
            width: '28px',
            height: '28px',
            border: '2px solid #b026ff',
            borderRadius: '50%',
            opacity: 0.6,
          }}
        />
        {/* Middle green ring */}
        <div
          style={{
            position: 'absolute',
            width: '20px',
            height: '20px',
            border: '2px solid #00ff41',
            borderRadius: '50%',
            opacity: 0.7,
          }}
        />
        {/* Inner cyan ring */}
        <div
          style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            border: '2px solid #00d9ff',
            borderRadius: '50%',
            opacity: 0.8,
          }}
        />
        {/* Center dot */}
        <div
          style={{
            width: '4px',
            height: '4px',
            background: '#b026ff',
            borderRadius: '50%',
          }}
        />
      </div>
    ),
    size
  )
}
