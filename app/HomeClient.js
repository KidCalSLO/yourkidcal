'use client'
import { useState, useEffect } from 'react'

const CATEGORIES = ['All','Camp','School','Sport','Daycare','Rec','Arts']
const LOCATIONS = ['All Areas','San Luis Obispo','Arroyo Grande','Paso Robles','Atascadero','Morro Bay','Nipomo','Pismo Beach','Cambria','Countywide']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['S','M','T','W','T','F','S']

const BADGE = {
  camp:    {bg:'#EAF3DE',color:'#3B6D11'},
  school:  {bg:'#E6F1FB',color:'#185FA5'},
  sport:   {bg:'#FAECE7',color:'#D85A30'},
  daycare: {bg:'#FAEEDA',color:'#BA7517'},
  rec:     {bg:'#E1F5EE',color:'#0F6E56'},
  arts:    {bg:'#EEEDFE',color:'#534AB7'},
}
const CAT_COLORS = {
  camp:'#3B6D11',school:'#185FA5',sport:'#D85A30',
  daycare:'#BA7517',rec:'#0F6E56',arts:'#534AB7'
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
  return new Date(str).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
}
function formatDateShort(str) {
  if (!str) return null
  return new Date(str).toLocaleDateString('en-US',{month:'short',day:'numeric'})
}
function parseAgeRange(agesStr) {
  if (!agesStr) return {min:0,max:18}
  const clean = agesStr.replace(/\s/g,'').replace('mo','').replace('wk','')
  const parts = clean.split(/[-–]/)
  const min = parseInt(parts[0]) || 0
  const max = parseInt(parts[1]) || min
  return {min, max}
}

export default function HomeClient({listings}) {
  const [tab, setTab] = useState('browse')
  const [filter, setFilter] = useState('All')
  const [location, setLocation] = useState('All Areas')
  const [gender, setGender] = useState('all')
  const [ageMin, setAgeMin] = useState(0)
  const [ageMax, setAgeMax] = useState(18)
  const [search, setSearch] = useState('')
  const [saved, setSaved] = useState([])
  const [calModal, setCalModal] = useState(null)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [hidePast, setHidePast] = useState(true)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifySubmitted, setNotifySubmitted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [notifyForm, setNotifyForm] = useState({
    email:'', name:'',
    categories:[], locations:[],
    age_min:0, age_max:18,
    notify_new:true, notify_deadline_7:true, notify_deadline_30:false
  })
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [form, setForm] = useState({
    title:'',org_name:'',category:'Camp',ages:'',location:'',
    description:'',cost:'',cost_free:false,deadline:'',
    start_date:'',end_date:'',registration_url:'',email:''
  })

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const sorted = [...listings].sort((a,b) => {
    const dA = daysUntil(a.deadline)
    const dB = daysUntil(b.deadline)
    if (dA >= 0 && dB >= 0) return dA - dB
    if (dA < 0 && dB < 0) return dB - dA
    return dA >= 0 ? -1 : 1
  })

  const filtered = sorted.filter(l => {
    const matchCat = filter === 'All' || l.category.toLowerCase() === filter.toLowerCase()
    const matchLoc = location === 'All Areas' || (l.location||'').toLowerCase().includes(location.toLowerCase())
    const matchGender = gender === 'all' || (l.gender||'both') === 'both' || (l.gender||'both') === gender
    const {min, max} = parseAgeRange(l.ages)
    const matchAge = min <= ageMax && max >= ageMin
    const q = search.toLowerCase()
    const matchQ = !q || l.title.toLowerCase().includes(q) || l.org_name.toLowerCase().includes(q) || (l.location||'').toLowerCase().includes(q)
    return matchCat && matchLoc && matchGender && matchAge && matchQ
  })

  function toggleSave(l) {
    setSaved(s => s.find(x => x.id===l.id) ? s.filter(x => x.id!==l.id) : [...s,l])
  }
  function isSaved(id) {return !!saved.find(x => x.id===id)}

  function downloadIcs(ls) {
    const events = ls.map(l => {
      const d = l.deadline.replace(/-/g,'')
      return `BEGIN:VEVENT\nSUMMARY:Deadline: ${l.title}\nDTSTART;VALUE=DATE:${d}\nDTEND;VALUE=DATE:${d}\nDESCRIPTION:Register at ${l.registration_url||''} — ${l.org_name}\nLOCATION:${l.location||'SLO County'}\nEND:VEVENT`
    }).join('\n')
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//YourKidCal//SLO//EN\n${events}\nEND:VCALENDAR`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([ics],{type:'text/calendar'}))
    a.download = 'yourkidcal-deadlines.ics'
    a.click()
  }

  function addToGoogle(l) {
    const d = l.deadline.replace(/-/g,'')
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Deadline: '+l.title)}&dates=${d}/${d}&details=${encodeURIComponent('Register at: '+(l.registration_url||''))}`,'_blank')
  }

  async function handleSubmit() {
    const res = await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    if (res.ok) setSubmitted(true)
  }

  async function handleNotifySubmit() {
    const res = await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(notifyForm)})
    if (res.ok) setNotifySubmitted(true)
  }

  function toggleNotifyCat(cat) {
    setNotifyForm(f => ({...f, categories: f.categories.includes(cat) ? f.categories.filter(c=>c!==cat) : [...f.categories,cat]}))
  }
  function toggleNotifyLoc(loc) {
    setNotifyForm(f => ({...f, locations: f.locations.includes(loc) ? f.locations.filter(c=>c!==loc) : [...f.locations,loc]}))
  }

  function getCalDays() {
    return {
      firstDay: new Date(calYear,calMonth,1).getDay(),
      daysInMonth: new Date(calYear,calMonth+1,0).getDate()
    }
  }
  function getListingsForDay(day) {
    return listings.filter(l => {
      const d = new Date(l.deadline)
      return d.getFullYear()===calYear && d.getMonth()===calMonth && d.getDate()===day
    })
  }
  function isToday(day) {
    return day===today.getDate() && calMonth===today.getMonth() && calYear===today.getFullYear()
  }
  function prevMonth() {
    if (calMonth===0){setCalMonth(11);setCalYear(y=>y-1)} else setCalMonth(m=>m-1)
  }
  function nextMonth() {
    if (calMonth===11){setCalMonth(0);setCalYear(y=>y+1)} else setCalMonth(m=>m+1)
  }

  const freeCount = listings.filter(l=>l.cost_free).length
  const urgentCount = listings.filter(l=>daysUntil(l.deadline)<=14&&daysUntil(l.deadline)>=0).length
  const {firstDay,daysInMonth} = getCalDays()

  const p = isMobile ? '1rem' : '2rem'
  const s = {
    nav:{background:'#fff',borderBottom:'1.5px solid #e0ddd5',padding:`0 ${p}`,display:'flex',alignItems:'center',justifyContent:'space-between',height:isMobile?56:64,position:'sticky',top:0,zIndex:100},
    logo:{fontFamily:"'Playfair Display',serif",fontSize:isMobile?18:22,color:'#2C2C2A',letterSpacing:'-0.5px'},
    logoSpan:{color:'#E8A020'},
    navBtn:(color)=>({background:color||'#E8A020',color:'#fff',border:'none',padding:isMobile?'7px 10px':'9px 18px',borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?12:14,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}),
    hero:{background:'#fff',borderBottom:'1.5px solid #e0ddd5',padding:isMobile?'1.5rem 1rem':'3rem 2rem 2.5rem'},
    h2:{fontFamily:"'Playfair Display',serif",fontSize:isMobile?26:38,lineHeight:1.2,color:'#2C2C2A',marginBottom:'.75rem'},
    searchBar:{display:'flex',gap:8,marginBottom:'1.25rem'},
    searchInput:{flex:1,border:'1.5px solid #e0ddd5',borderRadius:8,padding:'10px 12px',fontFamily:"'DM Sans',sans-serif",fontSize:15,background:'#F7F3EC',outline:'none',minWidth:0},
    searchBtn:{background:'#2C2C2A',color:'#fff',border:'none',padding:'10px 14px',borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap'},
    stats:{display:'flex',gap:isMobile?'1rem':'2rem',marginTop:'1rem'},
    statNum:{fontFamily:"'Playfair Display',serif",fontSize:isMobile?22:28,fontWeight:700,color:'#2C2C2A'},
    statLabel:{fontSize:11,color:'#888780',marginTop:2},
    tabBar:{background:'#fff',borderBottom:'1.5px solid #e0ddd5',padding:`0 ${p}`,display:'flex'},
    tabBtn:(active)=>({border:'none',borderBottom:active?'2.5px solid #E8A020':'2.5px solid transparent',background:'none',padding:isMobile?'12px 16px':'14px 20px',fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?13:14,fontWeight:active?600:400,color:active?'#2C2C2A':'#888780',cursor:'pointer',marginBottom:'-1px'}),
    filters:{background:'#fff',borderBottom:'1.5px solid #e0ddd5',padding:'.6rem 1rem',display:'flex',gap:6,overflowX:'auto',alignItems:'center',WebkitOverflowScrolling:'touch',flexWrap:'nowrap',msOverflowStyle:'none',scrollbarWidth:'none'},
    filterLabel:{fontSize:10,fontWeight:700,color:'#888780',textTransform:'uppercase',letterSpacing:'.5px',whiteSpace:'nowrap',flexShrink:0},
    chip:(active,color)=>({border:active?'none':'1.5px solid #e0ddd5',background:active?(color||'#2C2C2A'):'#fff',color:active?'#fff':'#2C2C2A',borderRadius:20,padding:'5px 12px',fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}),
    divider:{width:'1px',height:24,background:'#e0ddd5',margin:'0 2px',flexShrink:0},
    main:{maxWidth:900,margin:'0 auto',padding:p},
    card:{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:12,padding:isMobile?'1rem':'1.25rem',marginBottom:10},
    cardTitle:{fontFamily:"'Playfair Display',serif",fontSize:isMobile?15:17,fontWeight:700,margin:'6px 0 2px',color:'#2C2C2A'},
    cardOrg:{fontSize:12,color:'#888780',marginBottom:8},
    meta:{display:'flex',flexWrap:'wrap',gap:8,marginBottom:8},
    metaItem:(urgent)=>({display:'flex',alignItems:'center',gap:3,fontSize:12,color:urgent?'#D85A30':'#888780'}),
    cardDesc:{fontSize:13,color:'#888780',lineHeight:1.5,marginBottom:10},
    cardFooter:{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:10,borderTop:'1px solid #e0ddd5'},
    cost:{fontFamily:"'Playfair Display',serif",fontSize:isMobile?16:18,fontWeight:700,color:'#2C2C2A'},
    regBtn:{background:'#E8A020',color:'#fff',border:'none',padding:'7px 14px',borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:'pointer',textDecoration:'none',display:'inline-block'},
    overlay:{position:'fixed',inset:0,background:'rgba(44,44,42,.5)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'},
    modal:{background:'#fff',borderRadius:isMobile?'16px 16px 0 0':'12px',padding:'1.5rem',width:'100%',maxWidth:isMobile?'100%':'420px',border:'1.5px solid #e0ddd5',maxHeight:'90vh',overflowY:'auto'},
    calOption:{border:'1.5px solid #e0ddd5',borderRadius:8,padding:'12px 14px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:14,fontWeight:500,background:'#fff',width:'100%',marginBottom:8,boxSizing:'border-box'},
    submitModal:{background:'#fff',borderRadius:isMobile?'16px 16px 0 0':'12px',padding:'1.5rem',width:'100%',maxWidth:isMobile?'100%':'520px',border:'1.5px solid #e0ddd5',maxHeight:'92vh',overflowY:'auto'},
    input:{width:'100%',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'10px 12px',fontFamily:"'DM Sans',sans-serif",fontSize:16,color:'#2C2C2A',background:'#F7F3EC',outline:'none',boxSizing:'border-box'},
    submitBtn:{background:'#E8A020',color:'#fff',border:'none',padding:'13px 24px',borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:600,cursor:'pointer',width:'100%',marginTop:4},
    cancelBtn:{background:'none',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'11px 16px',fontFamily:"'DM Sans',sans-serif",fontSize:15,cursor:'pointer',color:'#888780',width:'100%',marginTop:8},
  }

  return (
    <>
      <style>{`
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; max-width: 100%; overflow-x: hidden; }
  body { font-family: 'DM Sans', sans-serif; background: #F7F3EC; }
  input[type=range] { accent-color: #E8A020; }
  .filter-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none; white-space: nowrap; }
  .filter-scroll::-webkit-scrollbar { display: none; }
  .filter-scroll > * { display: inline-flex; flex-shrink: 0; }
  a { color: inherit; text-decoration: none; }
  button { -webkit-tap-highlight-color: transparent; }
`}</style>

      {/* NAV */}
      <nav style={s.nav}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:isMobile?30:36,height:isMobile?30:36,background:'#E8A020',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:isMobile?16:18,flexShrink:0}}>🌞</div>
          <span style={s.logo}>Your<span style={s.logoSpan}>KidCal</span></span>
        </div>
        <div style={{display:'flex',gap:6}}>
          <button style={s.navBtn('#185FA5')} onClick={()=>setNotifyOpen(true)}>{isMobile?'🔔':'🔔 Notify Me'}</button>
          <button style={s.navBtn()} onClick={()=>setSubmitOpen(true)}>{isMobile?'+ List':'+ Submit'}</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={s.hero}>
        <div style={{maxWidth:900,margin:'0 auto'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'#EAF3DE',color:'#3B6D11',fontSize:11,fontWeight:600,padding:'4px 10px',borderRadius:20,marginBottom:'.75rem',letterSpacing:'.5px',textTransform:'uppercase'}}>
            📍 San Luis Obispo County
          </div>
          <h2 style={s.h2}>Every deadline for your kids, <span style={{color:'#E8A020'}}>in one place.</span></h2>
          <p style={{color:'#888780',fontSize:isMobile?14:16,lineHeight:1.7,marginBottom:'1.25rem'}}>
            Camps, schools, sports, daycares, and rec programs across SLO County — all in one spot.
          </p>
          <div style={s.searchBar}>
            <input style={s.searchInput} placeholder="Search programs..." value={search} onChange={e=>setSearch(e.target.value)}/>
            <button style={s.searchBtn}>Search</button>
          </div>
          <div style={s.stats}>
            <div><div style={s.statNum}>{listings.length}</div><div style={s.statLabel}>Programs</div></div>
            <div><div style={s.statNum}>{urgentCount}</div><div style={s.statLabel}>Urgent</div></div>
            <div><div style={s.statNum}>{freeCount}</div><div style={s.statLabel}>Free</div></div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={s.tabBar}>
        {[['browse','📋 Browse'],['calendar','📅 Calendar']].map(([id,label])=>(
          <button key={id} style={s.tabBtn(tab===id)} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ══ BROWSE TAB ══ */}
      {tab==='browse'&&(
        <>
          {/* FILTER ROWS */}
<div style={{background:'#fff',borderBottom:'1.5px solid #e0ddd5'}}>
  <div className="filter-scroll" style={{padding:'.5rem 1rem',borderBottom:'1px solid #f0ede6'}}>
    <span style={{...s.filterLabel, display:'inline-flex', alignItems:'center', marginRight:6}}>Type</span>
    {CATEGORIES.map(cat=>(
      <button key={cat} style={{...s.chip(filter===cat), marginRight:6}} onClick={()=>setFilter(cat)}>{cat}</button>
    ))}
  </div>
  <div className="filter-scroll" style={{padding:'.35rem 1rem',borderBottom:'1px solid #f0ede6'}}>
    <span style={{...s.filterLabel, display:'inline-flex', alignItems:'center', marginRight:6}}>Gender</span>
    {[['all','All'],['male','Boys'],['female','Girls']].map(([val,label])=>(
      <button key={val} style={{...s.chip(gender===val,'#D85A30'), marginRight:6}} onClick={()=>setGender(val)}>{label}</button>
    ))}
  </div>
  <div className="filter-scroll" style={{padding:'.35rem 1rem .5rem'}}>
    <span style={{...s.filterLabel, display:'inline-flex', alignItems:'center', marginRight:6}}>Area</span>
    {LOCATIONS.map(loc=>(
      <button key={loc} style={{...s.chip(location===loc,'#185FA5'), marginRight:6}} onClick={()=>setLocation(loc)}>{loc}</button>
    ))}
  </div>
</div>

          {/* AGE SLIDER */}
          <div style={{background:'#fff',borderBottom:'1.5px solid #e0ddd5',padding:'.6rem 1rem',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <span style={s.filterLabel}>Ages</span>
            <div style={{display:'flex',alignItems:'center',gap:8,flex:1,minWidth:200}}>
              <span style={{fontSize:13,fontWeight:600,color:'#2C2C2A',minWidth:20}}>{ageMin}</span>
              <input type="range" min={0} max={18} value={ageMin} onChange={e=>setAgeMin(Math.min(Number(e.target.value),ageMax))} style={{flex:1}}/>
              <span style={{fontSize:12,color:'#888780'}}>–</span>
              <input type="range" min={0} max={18} value={ageMax} onChange={e=>setAgeMax(Math.max(Number(e.target.value),ageMin))} style={{flex:1}}/>
              <span style={{fontSize:13,fontWeight:600,color:'#2C2C2A',minWidth:28}}>{ageMax===18?'18+':ageMax}</span>
            </div>
            {(ageMin>0||ageMax<18)&&(
              <button onClick={()=>{setAgeMin(0);setAgeMax(18)}} style={{background:'none',border:'1.5px solid #e0ddd5',borderRadius:20,padding:'3px 10px',fontSize:11,cursor:'pointer',color:'#888780'}}>Reset</button>
            )}
          </div>

          <div style={s.main}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?17:20,margin:0}}>Programs</h3>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontSize:12,color:'#888780'}}>{filtered.length} shown</span>
                {(filter!=='All'||location!=='All Areas'||gender!=='all'||ageMin>0||ageMax<18||search)&&(
                  <button onClick={()=>{setFilter('All');setLocation('All Areas');setGender('all');setAgeMin(0);setAgeMax(18);setSearch('')}} style={{background:'none',border:'1.5px solid #e0ddd5',borderRadius:20,padding:'3px 10px',fontSize:11,cursor:'pointer',color:'#888780'}}>Clear</button>
                )}
              </div>
            </div>

            {filtered.length===0&&(
              <div style={{textAlign:'center',padding:'3rem 1rem',color:'#888780'}}>
                <div style={{fontSize:32,marginBottom:8}}>🔍</div>
                <div style={{marginBottom:12}}>No programs found.</div>
                <button onClick={()=>{setFilter('All');setLocation('All Areas');setGender('all');setAgeMin(0);setAgeMax(18);setSearch('')}} style={{background:'#E8A020',color:'#fff',border:'none',borderRadius:8,padding:'8px 16px',fontSize:13,fontWeight:600,cursor:'pointer'}}>Clear filters</button>
              </div>
            )}

            {filtered.map(l=>{
              const days=daysUntil(l.deadline)
              const urgent=days<=9&&days>=0
              const past=days<0
              return (
                <div key={l.id} style={{...s.card,opacity:past?0.65:1,borderLeft:`3px solid ${past?'#e0ddd5':urgent?'#D85A30':CAT_COLORS[l.category?.toLowerCase()]||'#e0ddd5'}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                    <div style={{display:'flex',gap:5,flexWrap:'wrap',flex:1}}>
                      <span style={{fontSize:10,fontWeight:700,padding:'3px 7px',borderRadius:10,textTransform:'uppercase',letterSpacing:'.3px',background:BADGE[l.category?.toLowerCase()]?.bg||'#eee',color:BADGE[l.category?.toLowerCase()]?.color||'#666'}}>{l.category}</span>
                      {l.gender&&l.gender!=='both'&&<span style={{fontSize:10,fontWeight:700,padding:'3px 7px',borderRadius:10,textTransform:'uppercase',background:'#FAECE7',color:'#D85A30'}}>{l.gender==='male'?'Boys':'Girls'}</span>}
                      {past&&<span style={{fontSize:10,fontWeight:700,padding:'3px 7px',borderRadius:10,textTransform:'uppercase',background:'#f0ede6',color:'#888780'}}>Closed</span>}
                      {urgent&&!past&&<span style={{fontSize:10,fontWeight:700,padding:'3px 7px',borderRadius:10,textTransform:'uppercase',background:'#FAECE7',color:'#D85A30'}}>Urgent</span>}
                    </div>
                    <div style={{display:'flex',gap:5,flexShrink:0}}>
                      <button style={{background:isSaved(l.id)?'#EAF3DE':'none',border:isSaved(l.id)?'1.5px solid #3B6D11':'1.5px solid #e0ddd5',color:isSaved(l.id)?'#3B6D11':'#888780',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:15}} onClick={()=>toggleSave(l)}>🔖</button>
                      <button style={{background:'none',border:'1.5px solid #e0ddd5',color:'#888780',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:15}} onClick={()=>setCalModal(l)}>📅</button>
                    </div>
                  </div>
                  <div style={s.cardTitle}>{l.title}</div>
                  <div style={s.cardOrg}>{l.org_name}{l.location?` · ${l.location}`:''}</div>
                  <div style={s.meta}>
                    <span style={s.metaItem(urgent&&!past)}>🕐 {past?'Closed':'Closes'} <strong style={{marginLeft:2}}>{formatDateShort(l.deadline)}</strong></span>
                    {l.start_date&&<span style={s.metaItem(false)}>📆 <strong style={{marginLeft:2}}>{formatDateShort(l.start_date)}</strong></span>}
                    {l.ages&&<span style={s.metaItem(false)}>👥 <strong style={{marginLeft:2}}>{l.ages}</strong></span>}
                    {l.location&&!isMobile&&<span style={s.metaItem(false)}>📍 <strong style={{marginLeft:2}}>{l.location}</strong></span>}
                  </div>
                  {l.description&&<p style={s.cardDesc}>{l.description}</p>}
                  {!past&&(
                    <>
                      <div style={{height:3,background:'#e0ddd5',borderRadius:2,marginBottom:5,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${Math.min(100,Math.max(5,(1-days/60)*100))}%`,background:urgencyColor(days),borderRadius:2}}></div>
                      </div>
                      <div style={{fontSize:11,color:urgencyColor(days),fontWeight:600,marginBottom:8}}>{days} day{days!==1?'s':''} left</div>
                    </>
                  )}
                  <div style={s.cardFooter}>
                    <div style={s.cost}>{l.cost_free?'Free':`$${l.cost?.toLocaleString()}`}<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:400,color:'#888780'}}>{!l.cost_free&&l.end_date?' /season':!l.cost_free?' /mo':''}</span></div>
                    {l.registration_url&&<a href={l.registration_url} target="_blank" rel="noopener noreferrer" style={s.regBtn}>↗ Register</a>}
                  </div>
                </div>
              )
            })}

            {saved.length>0&&(
              <div style={{...s.card,marginTop:'1.5rem',borderColor:'#3B6D11'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:15,margin:0}}>Saved ({saved.length})</h3>
                  <button style={{background:'#3B6D11',color:'#fff',border:'none',padding:'6px 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}} onClick={()=>downloadIcs(saved)}>⬇ Download</button>
                </div>
                {saved.map(l=>(
                  <div key={l.id} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #e0ddd5',fontSize:13}}>
                    <div>
                      <div style={{fontWeight:500,color:'#2C2C2A',fontSize:13}}>{l.title}</div>
                      <div style={{color:'#888780',fontSize:11,marginTop:1}}>Deadline: {formatDate(l.deadline)}</div>
                    </div>
                    <button onClick={()=>toggleSave(l)} style={{background:'none',border:'none',cursor:'pointer',color:'#888780',fontSize:20,padding:'0 4px'}}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ CALENDAR TAB ══ */}
      {tab==='calendar'&&(
        <div style={s.main}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem',flexWrap:'wrap',gap:8}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?20:24,margin:0}}>{MONTHS[calMonth]} {calYear}</h3>
            <div style={{display:'flex',gap:6}}>
              <button style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'7px 12px',cursor:'pointer',fontSize:13}} onClick={prevMonth}>←</button>
              <button style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'7px 12px',cursor:'pointer',fontSize:13}} onClick={nextMonth}>→</button>
              <button style={{background:'#2C2C2A',color:'#fff',border:'none',borderRadius:8,padding:'7px 12px',cursor:'pointer',fontSize:12,fontWeight:600}} onClick={()=>downloadIcs(listings)}>⬇ All</button>
            </div>
          </div>

          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:'1rem'}}>
            {Object.entries(CAT_COLORS).map(([cat,color])=>(
              <div key={cat} style={{display:'flex',alignItems:'center',gap:4,fontSize:11}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:color}}></div>
                <span style={{color:'#888780',textTransform:'capitalize'}}>{cat}</span>
              </div>
            ))}
          </div>

          <div style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1.5px solid #e0ddd5'}}>
              {DAYS.map((d,i)=><div key={i} style={{textAlign:'center',padding:'8px 0',fontSize:11,fontWeight:700,color:'#888780'}}>{d}</div>)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
              {Array.from({length:firstDay}).map((_,i)=>(
                <div key={'e'+i} style={{minHeight:isMobile?50:80,borderRight:'1px solid #f0ede6',borderBottom:'1px solid #f0ede6',background:'#faf9f6'}}></div>
              ))}
              {Array.from({length:daysInMonth}).map((_,i)=>{
                const day=i+1
                const dayListings=getListingsForDay(day)
                const isT=isToday(day)
                return (
                  <div key={day} style={{minHeight:isMobile?50:80,borderRight:'1px solid #f0ede6',borderBottom:'1px solid #f0ede6',padding:isMobile?3:5,background:isT?'#fffbf2':'#fff'}}>
                    <div style={{width:22,height:22,borderRadius:'50%',background:isT?'#E8A020':'transparent',color:isT?'#fff':'#2C2C2A',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:isT?700:400,marginBottom:2}}>{day}</div>
                    {dayListings.map(l=>(
                      <div key={l.id} onClick={()=>setCalModal(l)} style={{background:CAT_COLORS[l.category?.toLowerCase()]||'#888',color:'#fff',borderRadius:3,padding:'1px 3px',fontSize:isMobile?9:10,fontWeight:500,marginBottom:1,cursor:'pointer',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',lineHeight:1.5}}>{isMobile?'●':l.title}</div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{marginTop:'1.5rem'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?17:20,margin:0}}>All Deadlines</h3>
              <button style={{background:hidePast?'#2C2C2A':'#fff',color:hidePast?'#fff':'#2C2C2A',border:'1.5px solid #e0ddd5',borderRadius:20,padding:'5px 12px',fontSize:12,fontWeight:500,cursor:'pointer'}} onClick={()=>setHidePast(h=>!h)}>
                {hidePast?'Show Past':'Hide Past'}
              </button>
            </div>
            {listings.filter(l=>hidePast?daysUntil(l.deadline)>=0:true).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)).map(l=>{
              const days=daysUntil(l.deadline)
              return (
                <div key={l.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:10,marginBottom:8,opacity:days<0?0.5:1,gap:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:CAT_COLORS[l.category?.toLowerCase()]||'#888',flexShrink:0}}></div>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#2C2C2A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.title}</div>
                      <div style={{fontSize:11,color:'#888780'}}>{l.org_name}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:12,fontWeight:600,color:days<0?'#888780':urgencyColor(days)}}>{formatDateShort(l.deadline)}</div>
                      <div style={{fontSize:10,color:days<0?'#888780':urgencyColor(days)}}>{days<0?'Closed':`${days}d left`}</div>
                    </div>
                    <button style={{background:'#E8A020',color:'#fff',border:'none',borderRadius:8,padding:'5px 10px',fontSize:12,fontWeight:600,cursor:'pointer'}} onClick={()=>setCalModal(l)}>+</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CAL MODAL */}
      {calModal&&(
        <div style={s.overlay} onClick={()=>setCalModal(null)}>
          <div style={s.modal} onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,background:'#e0ddd5',borderRadius:2,margin:'0 auto 1rem',display:isMobile?'block':'none'}}></div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:6}}>Add to Calendar</h3>
            <p style={{fontSize:14,color:'#888780',marginBottom:'1.25rem',lineHeight:1.6}}>"{calModal.title}"<br/>Deadline: {formatDate(calModal.deadline)}</p>
            <button style={s.calOption} onClick={()=>{addToGoogle(calModal);setCalModal(null)}}>🗓 Google Calendar</button>
            <button style={s.calOption} onClick={()=>{downloadIcs([calModal]);setCalModal(null)}}>📱 Download to Phone (.ics)</button>
            <button style={s.calOption} onClick={()=>{toggleSave(calModal);setCalModal(null)}}>🔖 Save to my list</button>
            <button style={s.cancelBtn} onClick={()=>setCalModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* NOTIFY MODAL */}
      {notifyOpen&&(
        <div style={s.overlay} onClick={()=>setNotifyOpen(false)}>
          <div style={s.submitModal} onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,background:'#e0ddd5',borderRadius:2,margin:'0 auto 1rem',display:isMobile?'block':'none'}}></div>
            {notifySubmitted?(
              <div style={{textAlign:'center',padding:'2rem 0'}}>
                <div style={{fontSize:48,marginBottom:12}}>🔔</div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:8}}>You're signed up!</h3>
                <p style={{color:'#888780',fontSize:14,lineHeight:1.6}}>We'll notify you when programs matching your preferences are posted or deadlines approach.</p>
                <button style={{...s.submitBtn,marginTop:'1.5rem'}} onClick={()=>{setNotifyOpen(false);setNotifySubmitted(false)}}>Done</button>
              </div>
            ):(
              <>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:6}}>🔔 Get Notified</h3>
                <p style={{fontSize:14,color:'#888780',marginBottom:'1.25rem',lineHeight:1.6}}>We'll email you when new programs are added or deadlines are coming up.</p>
                {[['Your Name','name','text','e.g. Sarah'],['Email Address *','email','email','your@email.com']].map(([label,key,type,ph])=>(
                  <div key={key} style={{marginBottom:'1rem'}}>
                    <label style={{display:'block',fontSize:13,fontWeight:600,color:'#2C2C2A',marginBottom:5,textTransform:'uppercase',letterSpacing:'.4px'}}>{label}</label>
                    <input style={s.input} type={type} placeholder={ph} value={notifyForm[key]} onChange={e=>setNotifyForm(f=>({...f,[key]:e.target.value}))}/>
                  </div>
                ))}
                <div style={{marginBottom:'1rem'}}>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#2C2C2A',marginBottom:8,textTransform:'uppercase',letterSpacing:'.4px'}}>Categories</label>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {['Camp','School','Sport','Daycare','Rec','Arts'].map(cat=>(
                      <button key={cat} onClick={()=>toggleNotifyCat(cat)} style={{border:notifyForm.categories.includes(cat)?'none':'1.5px solid #e0ddd5',background:notifyForm.categories.includes(cat)?'#2C2C2A':'#fff',color:notifyForm.categories.includes(cat)?'#fff':'#2C2C2A',borderRadius:20,padding:'5px 12px',fontSize:13,cursor:'pointer'}}>{cat}</button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:'1rem'}}>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#2C2C2A',marginBottom:8,textTransform:'uppercase',letterSpacing:'.4px'}}>My Area</label>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {LOCATIONS.filter(l=>l!=='All Areas').map(loc=>(
                      <button key={loc} onClick={()=>toggleNotifyLoc(loc)} style={{border:notifyForm.locations.includes(loc)?'none':'1.5px solid #e0ddd5',background:notifyForm.locations.includes(loc)?'#185FA5':'#fff',color:notifyForm.locations.includes(loc)?'#fff':'#2C2C2A',borderRadius:20,padding:'5px 12px',fontSize:13,cursor:'pointer'}}>{loc}</button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:'1rem'}}>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#2C2C2A',marginBottom:8,textTransform:'uppercase',letterSpacing:'.4px'}}>Kids Ages ({notifyForm.age_min}–{notifyForm.age_max===18?'18+':notifyForm.age_max})</label>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:13,fontWeight:600,minWidth:20}}>{notifyForm.age_min}</span>
                    <input type="range" min={0} max={18} value={notifyForm.age_min} onChange={e=>setNotifyForm(f=>({...f,age_min:Math.min(Number(e.target.value),f.age_max)}))} style={{flex:1}}/>
                    <span style={{fontSize:12,color:'#888780'}}>–</span>
                    <input type="range" min={0} max={18} value={notifyForm.age_max} onChange={e=>setNotifyForm(f=>({...f,age_max:Math.max(Number(e.target.value),f.age_min)}))} style={{flex:1}}/>
                    <span style={{fontSize:13,fontWeight:600,minWidth:28}}>{notifyForm.age_max===18?'18+':notifyForm.age_max}</span>
                  </div>
                </div>
                <div style={{marginBottom:'1.25rem',background:'#F7F3EC',borderRadius:8,padding:'12px'}}>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#2C2C2A',marginBottom:8,textTransform:'uppercase',letterSpacing:'.4px'}}>Notify me when</label>
                  {[['notify_new','New matching program added'],['notify_deadline_7','Deadline is 7 days away'],['notify_deadline_30','Deadline is 30 days away']].map(([key,label])=>(
                    <label key={key} style={{display:'flex',alignItems:'center',gap:8,fontSize:14,color:'#2C2C2A',marginBottom:6,cursor:'pointer'}}>
                      <input type="checkbox" checked={notifyForm[key]} onChange={e=>setNotifyForm(f=>({...f,[key]:e.target.checked}))}/>
                      {label}
                    </label>
                  ))}
                </div>
                <button style={{...s.submitBtn,opacity:notifyForm.email?1:0.5}} onClick={notifyForm.email?handleNotifySubmit:undefined}>🔔 Sign Me Up</button>
                <button style={s.cancelBtn} onClick={()=>setNotifyOpen(false)}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* SUBMIT MODAL */}
      {submitOpen&&(
        <div style={s.overlay} onClick={()=>setSubmitOpen(false)}>
          <div style={s.submitModal} onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,background:'#e0ddd5',borderRadius:2,margin:'0 auto 1rem',display:isMobile?'block':'none'}}></div>
            {submitted?(
              <div style={{textAlign:'center',padding:'2rem 0'}}>
                <div style={{fontSize:48,marginBottom:12}}>✅</div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:8}}>Submitted!</h3>
                <p style={{color:'#888780',fontSize:14,lineHeight:1.6}}>We'll review and publish within 2 business days.</p>
                <button style={{...s.submitBtn,marginTop:'1.5rem'}} onClick={()=>{setSubmitOpen(false);setSubmitted(false)}}>Close</button>
              </div>
            ):(
              <>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:6}}>Submit a Listing</h3>
                <p style={{fontSize:14,color:'#888780',marginBottom:'1.25rem',lineHeight:1.6}}>We'll verify and publish within 2 business days.</p>
                {[['Program name','title','text','e.g. SLO Summer Arts Camp'],['Organization name','org_name','text','e.g. SLO Arts Center'],['Location','location','text','e.g. San Luis Obispo'],['Age range','ages','text','e.g. 6–12'],['Registration deadline','deadline','date',''],['Program start date','start_date','date',''],['Cost (leave blank if free)','cost','text','e.g. 350'],['Registration link','registration_url','url','https://'],['Contact email','email','email','your@email.com']].map(([label,key,type,ph])=>(
                  <div key={key} style={{marginBottom:'1rem'}}>
                    <label style={{display:'block',fontSize:13,fontWeight:600,color:'#2C2C2A',marginBottom:5,textTransform:'uppercase',letterSpacing:'.4px'}}>{label}</label>
                    <input style={s.input} type={type} placeholder={ph} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/>
                  </div>
                ))}
                <div style={{marginBottom:'1rem'}}>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#2C2C2A',marginBottom:5,textTransform:'uppercase',letterSpacing:'.4px'}}>Category</label>
                  <select style={s.input} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {['Camp','School','Sport','Daycare','Rec','Arts'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:'1rem',display:'flex',alignItems:'center',gap:8}}>
                  <input type="checkbox" id="free" checked={form.cost_free} onChange={e=>setForm(f=>({...f,cost_free:e.target.checked}))}/>
                  <label htmlFor="free" style={{fontSize:15,color:'#2C2C2A'}}>This program is free</label>
                </div>
                <div style={{marginBottom:'1rem'}}>
                  <label style={{display:'block',fontSize:13,fontWeight:600,color:'#2C2C2A',marginBottom:5,textTransform:'uppercase',letterSpacing:'.4px'}}>Description</label>
                  <textarea style={{...s.input,minHeight:80,resize:'vertical'}} placeholder="Brief description..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
                </div>
                <button style={s.submitBtn} onClick={handleSubmit}>Submit for Review</button>
                <button style={s.cancelBtn} onClick={()=>setSubmitOpen(false)}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
