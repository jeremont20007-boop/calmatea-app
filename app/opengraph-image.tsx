import { ImageResponse } from 'next/og'

export const alt = 'VehiLink – Conectamos conductores con propietarios de vehículos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Imagen que se muestra al compartir el sitio en redes sociales y WhatsApp.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #192685 0%, #4455E0 100%)',
          color: '#FFFFFF',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>VehiLink</div>
        <div style={{ fontSize: 48, fontWeight: 700, marginTop: 24, lineHeight: 1.2, maxWidth: 950 }}>
          Conectamos conductores con propietarios de vehículos
        </div>
        <div style={{ fontSize: 32, marginTop: 32, color: '#E1E8FF' }}>
          Uber · Cabify · remis · y más
        </div>
      </div>
    ),
    { ...size },
  )
}
