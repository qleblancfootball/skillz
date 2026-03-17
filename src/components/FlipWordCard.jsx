import { useState } from 'react'

export default function FlipWordCard({ front, back }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <button
      type="button"
      onClick={() => setFlipped((prev) => !prev)}
      style={{
        width: '100%',
        minHeight: '120px',
        border: 'none',
        borderRadius: '18px',
        background: 'transparent',
        cursor: 'pointer',
        padding: 0,
        perspective: '1000px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '120px',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: '18px',
            padding: '16px',
            background: 'linear-gradient(145deg, rgba(21, 29, 48, 0.95), rgba(12, 18, 31, 0.92))',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 18px 60px rgba(0,0,0,0.28)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#94a3b8',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Spanish
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 900,
              textAlign: 'center',
              lineHeight: 1.15,
            }}
          >
            {front}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: '18px',
            padding: '16px',
            background: 'linear-gradient(145deg, rgba(8, 49, 38, 0.96), rgba(7, 33, 26, 0.96))',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 18px 60px rgba(0,0,0,0.28)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#86efac',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            English
          </div>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 900,
              textAlign: 'center',
              lineHeight: 1.15,
            }}
          >
            {back}
          </div>
        </div>
      </div>
    </button>
  )
}