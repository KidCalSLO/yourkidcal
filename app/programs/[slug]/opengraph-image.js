import { ImageResponse } from 'next/og'
import { supabase } from '../../../lib/supabase'

export const runtime = 'edge'
export const alt = 'YourKidCal program listing'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BADGE_COLORS = {
  camp:    { bg: '#EAF3DE', color: '#3B6D11' },
  school:  { bg: '#E6F1FB', color: '#185FA5' },
  sport:   { bg: '#FAECE7', color: '#D85A30' },
  daycare: { bg: '#FAEEDA', color: '#BA7517' },
  rec:     { bg: '#E1F5EE', color: '#0F6E56' },
  arts:    { bg: '#EEEDFE', color: '#534AB7' },
}

export default async function Image({ params }) {
  const { data: l } = await supabase
    .from('listings')
    .select('title, org_name, category, location, ages, cost, cost_free')
    .eq('slug', params.slug)
    .single()

  const badge = BADGE_COLORS[l?.category?.toLowerCase()] || { bg: '#f0ede6', color: '#888780' }
  const cost = l?.cost_free ? 'Free' : (l?.cost ? `$${l.cost}` : 'Cost varies')

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '72px', background: '#F7F3EC',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E8A020', display: 'flex' }} />
          <div style={{ fontSize: 32, fontWeight: 700, color: '#2C2C2A', display: 'flex' }}>
            Your<span style={{ color: '#E8A020' }}>KidCal</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {l?.category && (
            <div style={{
              display: 'flex', alignSelf: 'flex-start', fontSize: 22, fontWeight: 700,
              padding: '6px 20px', borderRadius: 20, background: badge.bg, color: badge.color,
              textTransform: 'uppercase', marginBottom: 28,
            }}>
              {l.category}
            </div>
          )}
          <div style={{ fontSize: 52, fontWeight: 700, color: '#2C2C2A', lineHeight: 1.2, display: 'flex', maxWidth: 1000 }}>
            {l?.title || 'Kids Program in SLO County'}
          </div>
          <div style={{ fontSize: 28, color: '#888780', marginTop: 18, display: 'flex' }}>
            {[l?.org_name, l?.location].filter(Boolean).join(' · ')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, fontSize: 26, color: '#2C2C2A' }}>
          {l?.ages && <div style={{ display: 'flex' }}>👥 Ages {l.ages}</div>}
          <div style={{ display: 'flex' }}>💰 {cost}</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
