'use client'
import { useState } from 'react'

const CATEGORIES = ['All','Camp','School','Sport','Daycare','Rec','Arts']
const LOCATIONS = ['All Areas','San Luis Obispo','Arroyo Grande','Paso Robles','Atascadero','Morro Bay','Nipomo','Pismo Beach','Cambria','Countywide']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const BADGE = {
  camp:    { bg:'#EAF3DE', color:'#3B6D11' },
  school:  { bg:'#E6F1FB', color:'#185FA5' },
  sport:   { bg:'#FAECE7', color:'#D85A30' },
  daycare: { bg:'#FAEEDA', color:'#BA7517' },
  rec:     { bg:'#E1F5EE', color:'#0F6E56' },
  arts:    { bg:'#EEEDFE', color:'#534AB7' },
}

const CAT_COLORS = {
  camp:'#3B6D11', school:'#185FA5', sport:'#D85A30',
  daycare:'#BA7517', rec:'#0F6E56', arts:'#534AB7'
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  return Math.round((new Date(dateStr) - today) / 86400000)
}
function urgencyColor(days) {
  if (days <= 7) return '#D85A30'
  if (days <= 14) return '#BA7517'
  if (days <= 30) return '#3B6D11'
  return '#888780'
}
function formatDate(str) {
  if (!str) return null
  return new Date(str).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}
function formatDateShort(str) {
  if (!str) return null
  return new Date(str).toLocaleDateString('en-US', { month:'short', day:'numeric' })
}

export default function HomeClient({ listings }) {
  const [tab, setTab] = useState('browse')
  const [filter, setFilter] = useState('All')
  const [location, setLocation] = useState('All Areas')
  const [search, setSearch] = useState('')
  const [saved, setSaved] = useState([])
  const [calModal, setCalModal] = useState(null)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false) const [hidePast, setHidePast] = useState(true)
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [form, setForm] = useState({
    title:'', org_name:'', category:'Camp', ages:'', location:'',
    description:'', cost:'', cost_free:false, deadline:'',
    start_date:'', end_date:'', registration_url:'', email:''
  })
const sorted = [...listings].sort((a, b) => {
  const dA = daysUntil(a.deadline)
  const dB = daysUntil(b.deadline)
  if (dA >= 0 && dB >= 0) return dA - dB
  if (dA < 0 && dB < 0) return dB - dA
  return dA >= 0 ? -1 : 1
})
  const filtered = sorted.filter(l => {
    const matchCat = filter === 'All' || l.category.toLowerCase() === filter.toLowerCase()
    const matchLoc = location === 'All Areas' || (l.location||'').toLowerCase().includes(location.toLowerCase()) || (location === 'Countywide' && (l.location||'').toLowerCase().includes('countywide'))
    const q = search.toLowerCase()
    const matchQ = !q || l.title.toLowerCase().includes(q) || l.org_name.toLowerCase().includes(q) || (l.location||'').toLowerCase().includes(q)
    return matchCat && matchLoc && matchQ
  })

  function toggleSave(l) {
    setSaved(s => s.find(x => x.id === l.id) ? s.filter(x => x.id !== l.id) : [...s, l])
  }
  function isSaved(id) { return !!saved.find(x => x.id === id) }

  function downloadIcs(listings_to_export) {
    const events = listings_to_export.map(l => {
      const d = l.deadline.replace(/-/g,'')
      return `BEGIN:VEVENT\nSUMMARY:Deadline: ${l.title}\nDTSTART;VALUE=DATE:${d}\nDTEND;VALUE=DATE:${d}\nDESCRIPTION:Register at ${l.registration_url||''} — ${l.org_name}\nLOCATION:${l.location||'SLO County'}\nEND:VEVENT`
    }).join('\n')
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//YourKidCal//SLO//EN\n${events}\nEND:VCALENDAR`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([ics], { type:'text/calendar' }))
    a.download = 'yourkidcal-deadlines.ics'
    a.click()
  }

  function addToGoogle(l) {
    const d = l.deadline.replace(/-/g,'')
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Deadline: '+l.title)}&dates=${d}/${d}&details=${encodeURIComponent('Register at: '+(l.registration_url||''))}`,'_blank')
  }

  async function handleSubmit() {
    const res = await fetch('/api/submit', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(form)
    })
    if (res.ok) setSubmitted(true)
  }

  // Calendar helpers
  function getCalDays() {
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const daysInMonth = new Date(calYear, calMonth+1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  function getListingsForDay(day) {
    return listings.filter(l => {
      const d = new Date(l.deadline)
      return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === day
    })
  }

  function isToday(day) {
    return day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1) }
    else setCalMonth(m => m-1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1) }
    else setCalMonth(m => m+1)
  }

  const freeCount = listings.filter(l => l.cost_free).length
  const urgentCount = listings.filter(l => daysUntil(l.deadline) <= 14).length

  const s = {
    nav: {background:'#fff',borderBottom:'1.5px solid #e0ddd5',padding:'0 2rem',display:'flex',alignItems:'center',justifyContent:'space-between',height:64,position:'sticky',top:0,zIndex:100},
    logo: {fontFamily:"'Playfair Display',serif",fontSize:22,color:'#2C2C2A',letterSpacing:'-0.5px'},
    logoSpan: {color:'#E8A020'},
    navCta: {background:'#E8A020',color:'#fff',border:'none',padding:'9px 18px',borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,cursor:'pointer'},
    hero: {background:'#fff',borderBottom:'1.5px solid #e0ddd5',padding:'3rem 2rem 2.5rem'},
    h2: {fontFamily:"'Playfair Display',serif",fontSize:38,lineHeight:1.15,color:'#2C2C2A',marginBottom:'.75rem',maxWidth:600},
    searchBar: {display:'flex',gap:10,maxWidth:600,marginBottom:'1.5rem'},
    searchInput: {flex:1,border:'1.5px solid #e0ddd5',borderRadius:8,padding:'11px 16px',fontFamily:"'DM Sans',sans-serif",fontSize:15,background:'#F7F3EC',outline:'none'},
    searchBtn: {background:'#2C2C2A',color:'#fff',border:'none',padding:'11px 20px',borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,cursor:'pointer'},
    stats: {display:'flex',gap:'2rem',marginTop:'1rem'},
    statNum: {fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:'#2C2C2A'},
    statLabel: {fontSize:12,color:'#888780',marginTop:2},
    tabBar: {background:'#fff',borderBottom:'1.5px solid #e0ddd5',padding:'0 2rem',display:'flex',gap:0},
    tabBtn: (active) => ({border:'none',borderBottom:active?'2.5px solid #E8A020':'2.5px solid transparent',background:'none',padding:'14px 20px',fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:active?600:400,color:active?'#2C2C2A':'#888780',cursor:'pointer',transition:'all .15s',marginBottom:'-1px'}),
    filters: {background:'#fff',borderBottom:'1.5px solid #e0ddd5',padding:'.6rem 2rem',display:'flex',gap:8,overflowX:'auto',flexWrap:'wrap'},
    filterLabel: {fontSize:11,fontWeight:700,color:'#888780',textTransform:'uppercase',letterSpacing:'.5px',alignSelf:'center',marginRight:4,whiteSpace:'nowrap'},
    chip: (active,color) => ({border:active?'none':'1.5px solid #e0ddd5',background:active?(color||'#2C2C2A'):'#fff',color:active?'#fff':'#2C2C2A',borderRadius:20,padding:'5px 14px',fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s'}),
    divider: {width:'1px',height:28,background:'#e0ddd5',alignSelf:'center',margin:'0 4px'},
    main: {maxWidth:900,margin:'0 auto',padding:'2rem'},
    card: {background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:12,padding:'1.25rem',marginBottom:12,transition:'border .15s'},
    cardTitle: {fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,margin:'8px 0 2px',color:'#2C2C2A'},
    cardOrg: {fontSize:13,color:'#888780',marginBottom:10},
    meta: {display:'flex',flexWrap:'wrap',gap:10,marginBottom:10},
    metaItem: (urgent) => ({display:'flex',alignItems:'center',gap:4,fontSize:13,color:urgent?'#D85A30':'#888780'}),
    cardDesc: {fontSize:13,color:'#888780',lineHeight:1.5,marginBottom:12},
    cardFooter: {display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:12,borderTop:'1px solid #e0ddd5'},
    cost: {fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:'#2C2C2A'},
    regBtn: {background:'#E8A020',color:'#fff',border:'none',padding:'8px 16px',borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:5,textDecoration:'none'},
    overlay: {position:'fixed',inset:0,background:'rgba(44,44,42,.45)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'},
    modal: {background:'#fff',borderRadius:12,padding:'1.75rem',maxWidth:400,width:'90%',border:'1.5px solid #e0ddd5'},
    calOption: {border:'1.5px solid #e0ddd5',borderRadius:8,padding:'10px 14px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:14,fontWeight:500,background:'#fff',width:'100%',marginBottom:8,transition:'border .15s'},
    submitModal: {background:'#fff',borderRadius:12,padding:'1.75rem',maxWidth:480,width:'90%',border:'1.5px solid #e0ddd5',maxHeight:'90vh',overflowY:'auto'},
    input: {width:'100%',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'9px 12px',fontFamily:"'DM Sans',sans-serif",fontSize:14,color:'#2C2C2A',background:'#F7F3EC',outline:'none',boxSizing:'border-box'},
    submitBtn: {background:'#E8A020',color:'#fff',border:'none',padding:'11px 24px',borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,cursor:'pointer',width:'100%',marginTop:4},
    cancelBtn: {background:'none',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'8px 16px',fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:'pointer',color:'#888780',width:'100%',marginTop:8},
  }

  const { firstDay, daysInMonth } = getCalDays()

  return (
    <>
      {/* NAV */}
      <nav style={s.nav}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,background:'#E8A020',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🌞</div>
          <span style={s.logo}>Your<span style={s.logoSpan}>KidCal</span></span>
        </div>
        <button style={s.navCta} onClick={() => setSubmitOpen(true)}>+ Submit a Listing</button>
      </nav>

      {/* HERO */}
      <div style={s.hero}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'#EAF3DE',color:'#3B6D11',fontSize:12,fontWeight:600,padding:'5px 12px',borderRadius:20,marginBottom:'1rem',letterSpacing:'.5px',textTransform:'uppercase'}}>
            📍 San Luis Obispo County
          </div>
          <h2 style={s.h2}>Every deadline for your kids, <span style={{color:'#E8A020'}}>in one place.</span></h2>
          <p style={{color:'#888780',fontSize:16,maxWidth:520,lineHeight:1.7,marginBottom:'1.5rem'}}>
            Camps, schools, sports, daycares, and rec programs across SLO County — registration deadlines, costs, and links, all in one spot.
          </p>
          <div style={s.searchBar}>
            <input style={s.searchInput} placeholder="Search programs, camps, schools..." value={search} onChange={e => setSearch(e.target.value)} />
            <button style={s.searchBtn}>Search</button>
          </div>
          <div style={s.stats}>
            <div><div style={s.statNum}>{listings.length}</div><div style={s.statLabel}>Programs listed</div></div>
            <div><div style={s.statNum}>{urgentCount}</div><div style={s.statLabel}>Urgent deadlines</div></div>
            <div><div style={s.statNum}>{freeCount}</div><div style={s.statLabel}>Free programs</div></div>
          </div>
        </div>
      </div>

      {/* MAIN TABS */}
      <div style={s.tabBar}>
        {[['browse','📋 Browse'],['calendar','📅 Calendar']].map(([id,label]) => (
          <button key={id} style={s.tabBtn(tab===id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ══ BROWSE TAB ══ */}
      {tab === 'browse' && (
        <>
          {/* CATEGORY FILTERS */}
          <div style={s.filters}>
            <span style={s.filterLabel}>Category</span>
            {CATEGORIES.map(cat => (
              <button key={cat} style={s.chip(filter===cat)} onClick={() => setFilter(cat)}>{cat}</button>
            ))}
            <div style={s.divider}/>
            <span style={s.filterLabel}>Location</span>
            {LOCATIONS.map(loc => (
              <button key={loc} style={s.chip(location===loc,'#185FA5')} onClick={() => setLocation(loc)}>{loc}</button>
            ))}
          </div>

          <div style={s.main}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20}}>Programs & Activities</h3>
              <span style={{fontSize:13,color:'#888780'}}>Showing {filtered.length} program{filtered.length!==1?'s':''}</span>
            </div>

            {filtered.length === 0 && (
              <div style={{textAlign:'center',padding:'3rem',color:'#888780'}}>
                <div style={{fontSize:32,marginBottom:8}}>🔍</div>
                <div>No programs found. Try a different search or filter.</div>
              </div>
            )}

            {filtered.map(l => {
              const days = daysUntil(l.deadline)
              const urgent = days <= 9
              return (
                <div key={l.id} style={s.card}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <span style={{...{fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:10,textTransform:'uppercase',letterSpacing:'.4px'}, background:BADGE[l.category?.toLowerCase()]?.bg||'#eee', color:BADGE[l.category?.toLowerCase()]?.color||'#666'}}>{l.category}</span>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      {urgent && <span style={{background:'#FAECE7',color:'#D85A30',fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:10,textTransform:'uppercase'}}>Urgent</span>}
                      <button style={{background:isSaved(l.id)?'#EAF3DE':'none',border:isSaved(l.id)?'1.5px solid #3B6D11':'1.5px solid #e0ddd5',color:isSaved(l.id)?'#3B6D11':'#888780',borderRadius:8,width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:14}} onClick={() => toggleSave(l)} title="Save">🔖</button>
                      <button style={{background:'none',border:'1.5px solid #e0ddd5',color:'#888780',borderRadius:8,width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:14}} onClick={() => setCalModal(l)} title="Add to calendar">📅</button>
                    </div>
                  </div>
                  <div style={s.cardTitle}>{l.title}</div>
                  <div style={s.cardOrg}>{l.org_name}{l.location ? ` · ${l.location}` : ''}</div>
                  <div style={s.meta}>
                    <span style={s.metaItem(urgent)}>🕐 Closes <strong style={{marginLeft:3}}>{formatDateShort(l.deadline)}</strong></span>
                    {l.start_date && <span style={s.metaItem(false)}>📆 Starts <strong style={{marginLeft:3}}>{formatDateShort(l.start_date)}</strong></span>}
                    {l.ages && <span style={s.metaItem(false)}>👥 Ages <strong style={{marginLeft:3}}>{l.ages}</strong></span>}
                    {l.location && <span style={s.metaItem(false)}>📍 <strong style={{marginLeft:3}}>{l.location}</strong></span>}
                  </div>
                  {l.description && <p style={s.cardDesc}>{l.description}</p>}
                  <div style={{height:3,background:'#e0ddd5',borderRadius:2,marginBottom:6,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${Math.min(100,Math.max(5,(1-days/60)*100))}%`,background:urgencyColor(days),borderRadius:2}}></div>
                  </div>
                  <div style={{fontSize:11,color:urgencyColor(days),fontWeight:600,marginBottom:10}}>{days<=0?'Deadline passed':`${days} day${days!==1?'s':''} left to register`}</div>
                  <div style={s.cardFooter}>
                    <div style={s.cost}>{l.cost_free?'Free':`$${l.cost?.toLocaleString()}`}<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:400,color:'#888780'}}>{!l.cost_free&&l.end_date?' /season':!l.cost_free?' /mo':''}</span></div>
                    {l.registration_url && <a href={l.registration_url} target="_blank" rel="noopener noreferrer" style={s.regBtn}>↗ Register</a>}
                  </div>
                </div>
              )
            })}

            {saved.length > 0 && (
              <div style={{...s.card,marginTop:'2rem',borderColor:'#3B6D11'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:16}}>Saved Programs ({saved.length})</h3>
                  <button style={{background:'#3B6D11',color:'#fff',border:'none',padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}} onClick={() => downloadIcs(saved)}>⬇ Download All to Calendar</button>
                </div>
                {saved.map(l => (
                  <div key={l.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #e0ddd5',fontSize:13}}>
                    <div>
                      <div style={{fontWeight:500,color:'#2C2C2A'}}>{l.title}</div>
                      <div style={{color:'#888780',fontSize:11,marginTop:2}}>Deadline: {formatDate(l.deadline)}</div>
                    </div>
                    <button onClick={() => toggleSave(l)} style={{background:'none',border:'none',cursor:'pointer',color:'#888780',fontSize:18}}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ CALENDAR TAB ══ */}
      {tab === 'calendar' && (
        <div style={s.main}>
          {/* Calendar header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:24}}>{MONTHS[calMonth]} {calYear}</h3>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:14}} onClick={prevMonth}>← Prev</button>
              <button style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:14}} onClick={nextMonth}>Next →</button>
              <button style={{background:'#2C2C2A',color:'#fff',border:'none',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:13,fontWeight:600}} onClick={() => downloadIcs(listings)}>⬇ Download All Deadlines</button>
            </div>
          </div>

          {/* Legend */}
          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:'1rem'}}>
            {Object.entries(CAT_COLORS).map(([cat,color]) => (
              <div key={cat} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:color}}></div>
                <span style={{color:'#888780',textTransform:'capitalize'}}>{cat}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:12,overflow:'hidden'}}>
            {/* Day headers */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1.5px solid #e0ddd5'}}>
              {DAYS.map(d => (
                <div key={d} style={{textAlign:'center',padding:'10px 0',fontSize:12,fontWeight:700,color:'#888780',textTransform:'uppercase',letterSpacing:'.5px'}}>{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
              {Array.from({length: firstDay}).map((_,i) => (
                <div key={'e'+i} style={{minHeight:90,borderRight:'1px solid #f0ede6',borderBottom:'1px solid #f0ede6',background:'#faf9f6'}}></div>
              ))}
              {Array.from({length: daysInMonth}).map((_,i) => {
                const day = i+1
                const dayListings = getListingsForDay(day)
                const isT = isToday(day)
                return (
                  <div key={day} style={{minHeight:90,borderRight:'1px solid #f0ede6',borderBottom:'1px solid #f0ede6',padding:'6px',background:isT?'#fffbf2':'#fff'}}>
                    <div style={{width:24,height:24,borderRadius:'50%',background:isT?'#E8A020':'transparent',color:isT?'#fff':'#2C2C2A',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:isT?700:400,marginBottom:4}}>{day}</div>
                    {dayListings.map(l => (
                      <div key={l.id}
                        onClick={() => setCalModal(l)}
                        style={{background:CAT_COLORS[l.category?.toLowerCase()]||'#888',color:'#fff',borderRadius:4,padding:'2px 5px',fontSize:11,fontWeight:500,marginBottom:2,cursor:'pointer',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',lineHeight:1.4}}>
                        {l.title}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upcoming deadlines list */}
          <div style={{marginTop:'2rem'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>   <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20}}>All Deadlines</h3>   <button     style={{background:hidePast?'#2C2C2A':'#fff',color:hidePast?'#fff':'#2C2C2A',border:'1.5px solid #e0ddd5',borderRadius:20,padding:'6px 14px',fontSize:13,fontWeight:500,cursor:'pointer'}}     onClick={() => setHidePast(h => !h)}>     {hidePast ? '👁 Show Past' : '🙈 Hide Past'}   </button> </div>
            {listings
              .filter(l => hidePast ? daysUntil(l.deadline) >= 0 : true)
              .sort((a,b) => new Date(a.deadline)-new Date(b.deadline))
              .map(l => {
                const days = daysUntil(l.deadline)
                return (
                  <div key={l.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:10,marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:10,height:10,borderRadius:'50%',background:CAT_COLORS[l.category?.toLowerCase()]||'#888',flexShrink:0}}></div>
                      <div>
                        <div style={{fontSize:14,fontWeight:600,color:'#2C2C2A'}}>{l.title}</div>
                        <div style={{fontSize:12,color:'#888780'}}>{l.org_name} · {l.location}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:13,fontWeight:600,color:urgencyColor(days)}}>{formatDateShort(l.deadline)}</div>
                        <div style={{fontSize:11,color:urgencyColor(days)}}>{days} days left</div>
                      </div>
                      <button style={{background:'#E8A020',color:'#fff',border:'none',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:600,cursor:'pointer'}} onClick={() => setCalModal(l)}>+ Add</button>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ADD TO CAL MODAL */}
      {calModal && (
        <div style={s.overlay} onClick={() => setCalModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:6}}>Add to Calendar</h3>
            <p style={{fontSize:14,color:'#888780',marginBottom:'1.25rem',lineHeight:1.6}}>"{calModal.title}"<br/>Deadline: {formatDate(calModal.deadline)}</p>
            <button style={s.calOption} onClick={() => { addToGoogle(calModal); setCalModal(null) }}>🗓 Google Calendar</button>
            <button style={s.calOption} onClick={() => { downloadIcs([calModal]); setCalModal(null) }}>📱 Download to Phone (.ics)</button>
            <button style={s.calOption} onClick={() => { toggleSave(calModal); setCalModal(null) }}>🔖 Save to my list</button>
            <button style={s.cancelBtn} onClick={() => setCalModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* SUBMIT MODAL */}
      {submitOpen && (
        <div style={s.overlay} onClick={() => setSubmitOpen(false)}>
          <div style={s.submitModal} onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div style={{textAlign:'center',padding:'2rem 0'}}>
                <div style={{fontSize:48,marginBottom:12}}>✅</div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:8}}>Submitted!</h3>
                <p style={{color:'#888780',fontSize:14,lineHeight:1.6}}>We'll review your listing and publish it within 2 business days.</p>
                <button style={{...s.submitBtn,marginTop:'1.5rem'}} onClick={() => { setSubmitOpen(false); setSubmitted(false) }}>Close</button>
              </div>
            ) : (
              <>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:6}}>Submit a Listing</h3>
                <p style={{fontSize:14,color:'#888780',marginBottom:'1.25rem',lineHeight:1.6}}>Submit your program for review. We'll verify and publish within 2 business days.</p>
                {[['Program name','title','text','e.g. SLO Summer Arts Camp'],['Organization name','org_name','text','e.g. SLO Arts Center'],['Location','location','text','e.g. San Luis Obispo'],['Age range','ages','text','e.g. 6–12'],['Registration deadline','deadline','date',''],['Program start date','start_date','date',''],['Cost (leave blank if free)','cost','text','e.g. 350'],['Registration link','registration_url','url','https://'],['Contact email','email','email','your@email.com']].map(([label,key,type,ph]) => (
                  <div key={key} style={{marginBottom:'1rem'}}>
                    <label style={{display:'block',fontSize:13,fontWeight:600,color:'#2C2C2A',marginBottom:5,textTransform:'uppercase',letterSpacing:'.4px'}}>{label}</label>
                    <input style={s.input} type={type} placeholder={ph} value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))} />
                  </div>
                ))}
                <div style={{marginBottom:'1rem'}}>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#2C2C2A',marginBottom:5,textTransform:'uppercase',letterSpacing:'.4px'}}>Category</label>
                  <select style={s.input} value={form.category} onChange={e => setForm(f => ({...f,category:e.target.value}))}>
                    {['Camp','School','Sport','Daycare','Rec','Arts'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:'1rem',display:'flex',alignItems:'center',gap:8}}>
                  <input type="checkbox" id="free" checked={form.cost_free} onChange={e => setForm(f => ({...f,cost_free:e.target.checked}))} />
                  <label htmlFor="free" style={{fontSize:14,color:'#2C2C2A'}}>This program is free</label>
                </div>
                <div style={{marginBottom:'1rem'}}>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#2C2C2A',marginBottom:5,textTransform:'uppercase',letterSpacing:'.4px'}}>Description</label>
                  <textarea style={{...s.input,minHeight:80,resize:'vertical'}} placeholder="Brief description..." value={form.description} onChange={e => setForm(f => ({...f,description:e.target.value}))} />
                </div>
                <button style={s.submitBtn} onClick={handleSubmit}>Submit for Review</button>
                <button style={s.cancelBtn} onClick={() => setSubmitOpen(false)}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
