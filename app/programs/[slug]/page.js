import { supabase } from '../../../lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateStaticParams() {
  const { data } = await supabase
    .from('listings')
    .select('slug')
    .eq('status', 'approved')
    .not('slug', 'is', null)
  return (data || []).map(l => ({ slug: l.slug }))
}

export async function generateMetadata({ params }) {
  const { data: l } = await supabase
    .from('listings')
    .select('*')
    .eq('slug', params.slug)
    .single()
  if (!l) return {}
  const deadline = l.reg_close ? new Date(l.reg_close).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null
  const cost = l.cost_free ? 'Free' : `$${l.cost}`
  return {
    title: `${l.title} — ${l.org_name} | YourKidCal SLO`,
    description: `${l.title} by ${l.org_name} in ${l.location || 'SLO County'}. Ages ${l.ages || 'all'}. ${cost}. ${deadline ? `Registration closes ${deadline}.` : ''} Find kids programs and enrollment deadlines in San Luis Obispo County.`,
    openGraph: {
      title: `${l.title} | YourKidCal`,
      description: l.description || `${l.title} by ${l.org_name} in SLO County.`,
      url: `https://yourkidcal.com/programs/${l.slug}`,
      siteName: 'YourKidCal',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${l.title} | YourKidCal`,
      description: l.description || `${l.title} by ${l.org_name} in SLO County.`,
    },
    alternates: {
      canonical: `https://yourkidcal.com/programs/${l.slug}`,
    }
  }
}

export default async function ProgramPage({ params }) {
  const { data: l } = await supabase
    .from('listings')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!l) notFound()

  const regClose = l.reg_close ? new Date(l.reg_close).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }) : null
  const regOpen = l.reg_open ? new Date(l.reg_open).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) : null
  const programStart = l.program_start ? new Date(l.program_start).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) : null
  const programEnd = l.program_end ? new Date(l.program_end).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) : null
  const cost = l.cost_free ? 'Free' : `$${l.cost?.toLocaleString()}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: l.title,
    organizer: { '@type': 'Organization', name: l.org_name },
    location: { '@type': 'Place', name: l.location || 'San Luis Obispo County, CA' },
    description: l.description || '',
    url: l.registration_url || `https://yourkidcal.com/programs/${l.slug}`,
    ...(l.program_start && { startDate: l.program_start }),
    ...(l.program_end && { endDate: l.program_end }),
    ...(l.cost_free ? { isAccessibleForFree: true } : {
      offers: {
        '@type': 'Offer',
        price: l.cost,
        priceCurrency: 'USD',
        url: l.registration_url || '',
      }
    }),
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'student',
      description: `Ages ${l.ages || 'all ages'}`,
    }
  }

  const BADGE_COLORS = {
    camp: { bg:'#EAF3DE', color:'#3B6D11' },
    school: { bg:'#E6F1FB', color:'#185FA5' },
    sport: { bg:'#FAECE7', color:'#D85A30' },
    daycare: { bg:'#FAEEDA', color:'#BA7517' },
    rec: { bg:'#E1F5EE', color:'#0F6E56' },
    arts: { bg:'#EEEDFE', color:'#534AB7' },
  }
  const badge = BADGE_COLORS[l.category?.toLowerCase()] || { bg:'#f0ede6', color:'#888780' }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; background: #F7F3EC; }
        a { color: inherit; text-decoration: none; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{background:'#fff',borderBottom:'1.5px solid #e0ddd5',padding:'0 2rem',height:60,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:32,height:32,background:'#E8A020',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🌞</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:'#2C2C2A'}}>Your<span style={{color:'#E8A020'}}>KidCal</span></span>
        </Link>
        <Link href="/" style={{fontSize:13,color:'#888780',fontWeight:500}}>← All Programs</Link>
      </nav>

      <div style={{maxWidth:720,margin:'0 auto',padding:'2rem 1.5rem'}}>
        {/* BREADCRUMB */}
        <div style={{fontSize:12,color:'#888780',marginBottom:'1.5rem'}}>
          <Link href="/" style={{color:'#185FA5'}}>YourKidCal</Link>
          <span style={{margin:'0 6px'}}>›</span>
          <span style={{color:'#888780',textTransform:'capitalize'}}>{l.category}</span>
          <span style={{margin:'0 6px'}}>›</span>
          <span style={{color:'#2C2C2A'}}>{l.title}</span>
        </div>

        {/* HEADER */}
        <div style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:12,padding:'1.75rem',marginBottom:'1.5rem',borderLeft:`4px solid ${badge.color}`}}>
          <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
            <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:10,textTransform:'uppercase',letterSpacing:'.4px',background:badge.bg,color:badge.color}}>{l.category}</span>
            {l.cost_free && <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:10,textTransform:'uppercase',background:'#EAF3DE',color:'#3B6D11'}}>Free</span>}
            {l.is_rolling && <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:10,textTransform:'uppercase',background:'#E6F1FB',color:'#185FA5'}}>Rolling Enrollment</span>}
          </div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:'#2C2C2A',margin:'0 0 8px',lineHeight:1.2}}>{l.title}</h1>
          <div style={{fontSize:15,color:'#888780',marginBottom:'1.25rem'}}>{l.org_name}{l.location ? ` · ${l.location}` : ''}</div>
          {l.description && <p style={{fontSize:15,color:'#444',lineHeight:1.7,margin:'0 0 1.5rem'}}>{l.description}</p>}
          {l.registration_url && !l.is_rolling && (
            <a href={l.registration_url} target="_blank" rel="noopener noreferrer"
              style={{display:'inline-block',background:'#E8A020',color:'#fff',padding:'12px 28px',borderRadius:8,fontSize:15,fontWeight:600}}>
              Register Now →
            </a>
          )}
          {l.is_rolling && l.registration_url && (
            <a href={l.registration_url} target="_blank" rel="noopener noreferrer"
              style={{display:'inline-block',background:'#185FA5',color:'#fff',padding:'12px 28px',borderRadius:8,fontSize:15,fontWeight:600}}>
              Learn More & Enroll →
            </a>
          )}
        </div>

        {/* DETAILS */}
        <div style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:12,padding:'1.5rem',marginBottom:'1.5rem'}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:18,margin:'0 0 1rem',color:'#2C2C2A'}}>Program Details</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:'1rem'}}>
            {[
              ['📍 Location', l.location || 'SLO County'],
              ['👥 Ages', l.ages || 'All ages'],
              ['💰 Cost', cost],
              regOpen && ['📅 Registration Opens', regOpen],
              regClose && !l.is_rolling && ['⏰ Registration Closes', regClose],
              programStart && ['🚀 Program Starts', programStart],
              programEnd && ['🏁 Program Ends', programEnd],
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} style={{padding:'12px',background:'#F7F3EC',borderRadius:8}}>
                <div style={{fontSize:11,fontWeight:700,color:'#888780',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:4}}>{label}</div>
                <div style={{fontSize:14,fontWeight:600,color:'#2C2C2A'}}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ADD TO CALENDAR */}
        {!l.is_rolling && regClose && (
          <div style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:12,padding:'1.5rem',marginBottom:'1.5rem'}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:18,margin:'0 0 1rem',color:'#2C2C2A'}}>Add Deadline to Calendar</h2>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Deadline: '+l.title)}&dates=${l.reg_close?.replace(/-/g,'')}/${l.reg_close?.replace(/-/g,'')}&details=${encodeURIComponent('Register at: '+(l.registration_url||''))}`}
                target="_blank" rel="noopener noreferrer"
                style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'10px 16px',fontSize:13,fontWeight:500,display:'flex',alignItems:'center',gap:6}}>
                🗓 Google Calendar
              </a>
              <a href={`data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ASUMMARY:Deadline: ${encodeURIComponent(l.title)}%0ADTSTART;VALUE=DATE:${l.reg_close?.replace(/-/g,'')}%0ADTEND;VALUE=DATE:${l.reg_close?.replace(/-/g,'')}%0AEND:VEVENT%0AEND:VCALENDAR`}
                download="deadline.ics"
                style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'10px 16px',fontSize:13,fontWeight:500,display:'flex',alignItems:'center',gap:6}}>
                📱 Download .ics
              </a>
            </div>
          </div>
        )}

        {/* BACK */}
        <div style={{textAlign:'center',padding:'1rem 0'}}>
          <Link href="/" style={{color:'#185FA5',fontSize:14,fontWeight:500}}>← Back to all SLO County programs</Link>
        </div>
      </div>
    </>
  )
}
