import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'YourKidCal — SLO County Kids Programs & Deadlines'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', justifyContent: 'center', padding: '80px',
        background: '#F7F3EC',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 40 }}>
          <div style={{ width: 78, height: 78, borderRadius: '50%', background: '#E8A020', display: 'flex' }} />
          <div style={{ fontSize: 54, fontWeight: 700, color: '#2C2C2A', display: 'flex' }}>
            Your<span style={{ color: '#E8A020' }}>KidCal</span>
          </div>
        </div>
        <div style={{ fontSize: 46, fontWeight: 700, color: '#2C2C2A', lineHeight: 1.25, display: 'flex', maxWidth: 980 }}>
          Kids programs in SLO County — never miss a deadline.
        </div>
        <div style={{ fontSize: 27, color: '#888780', marginTop: 30, display: 'flex' }}>
          Camps · Schools · Sports · Daycares · Rec · Arts
        </div>
      </div>
    ),
    { ...size }
  )
}
