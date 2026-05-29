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
  const [expanded, setExpanded] = useState({})
  const [calModal, setCalModal] = useState(null)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [hidePast, setHidePast] = useState(true)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifySubmitted, setNotifySubmitted] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewsLoaded, setReviewsLoaded] = useState(false)
  const [reviewModal, setReviewModal] = useState(null)
  const [reviewForm, setReviewForm] = useState({reviewer_name:'',rating:5,body:''})
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewSearch, setReviewSearch] = useState('')
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

  useEffect(() => {
    const anyOpen = notifyOpen || submitOpen || !!calModal || !!reviewModal
    if (anyOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflowY = 'scroll'
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflowY = ''
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }
  }, [notifyOpen, submitOpen, calModal, reviewModal])

  const sorted = [...listings].sort((a,b) => {
    const dA = a.is_rolling ? 999 : daysUntil(a.reg_close || a.deadline)
    const dB = b.is_rolling ? 999 : daysUntil(b.reg_close || b.deadline)
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

  const activeFilterCount = [
    filter !== 'All',
    location !== 'All Areas',
    gender !== 'all',
    ageMin > 0 || ageMax < 18,
    !!search
  ].filter(Boolean).length

  function clearFilters() {
    setFilter('All'); setLocation('All Areas'); setGender('all')
    setAgeMin(0); setAgeMax(18); setSearch('')
  }

  function toggleSave(l) {
    setSaved(s => s.find(x => x.id===l.id) ? s.filter(x => x.id!==l.id) : [...s,l])
  }
  function isSaved(id) { return !!saved.find(x => x.id===id) }
  function toggleExpand(id) { setExpanded(e => ({...e, [id]: !e[id]})) }

  function downloadIcs(ls) {
    const events = ls.map(l => {
      const d = (l.reg_close || l.deadline).replace(/-/g,'')
      return `BEGIN:VEVENT\nSUMMARY:Deadline: ${l.title}\nDTSTART;VALUE=DATE:${d}\nDTEND;VALUE=DATE:${d}\nDESCRIPTION:Register at ${l.registration_url||''} — ${l.org_name}\nLOCATION:${l.location||'SLO County'}\nEND:VEVENT`
    }).join('\n')
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//YourKidCal//SLO//EN\n${events}\nEND:VCALENDAR`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([ics],{type:'text/calendar'}))
    a.download = 'yourkidcal-deadlines.ics'
    a.click()
  }

  function addToGoogle(l) {
    const d = (l.reg_close || l.deadline).replace(/-/g,'')
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Deadline: '+l.title)}&dates=${d}/${d}&details=${encodeURIComponent('Register at: '+(l.registration_url||''))}`,'_blank')
  }

  async function handleSubmit() {
    const res = await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    if (res.ok) setSubmitted(true)
  }

  async function fetchReviews() {
    if (reviewsLoaded) return
    const res = await fetch('/api/reviews')
    const data = await res.json()
    setReviews(data.reviews || [])
    setReviewsLoaded(true)
  }

  async function handleReviewSubmit() {
    if (!reviewForm.reviewer_name || !reviewForm.body || !reviewModal || reviewModal === 'new') return
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: reviewModal.id,
        listing_title: reviewModal.title,
        org_name: reviewModal.org_name,
        reviewer_name: reviewForm.reviewer_name,
        rating: reviewForm.rating,
        review_body: reviewForm.body,
      })
    })
    if (res.ok) setReviewSubmitted(true)
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
      const d = new Date(l.reg_close || l.deadline)
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
  const urgentCount = listings.filter(l=>!l.is_rolling&&daysUntil(l.reg_close||l.deadline)<=14&&daysUntil(l.reg_close||l.deadline)>=0).length
  const {firstDay,daysInMonth} = getCalDays()
  const p = isMobile ? '1rem' : '2rem'

  const s = {
    nav:{background:'#fff',borderBottom:'1.5px solid #e0ddd5',padding:`0 ${p}`,display:'flex',alignItems:'center',justifyContent:'space-between',height:isMobile?52:64,position:'sticky',top:0,zIndex:100},
    logo:{fontFamily:"'Playfair Display',serif",fontSize:isMobile?17:21,color:'#2C2C2A',letterSpacing:'-0.5px'},
    logoSpan:{color:'#E8A020'},
    navBtn:(color)=>({background:color||'#E8A020',color:'#fff',border:'none',padding:isMobile?'6px 10px':'9px 18px',borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?12:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}),
    hero:{background:'#fff',borderBottom:'1.5px solid #e0ddd5',padding:isMobile?'1rem 1rem':'1.75rem 2rem'},
    tabBar:{background:'#fff',borderBottom:'1.5px solid #e0ddd5',padding:`0 ${p}`,display:'flex'},
    tabBtn:(active)=>({border:'none',borderBottom:active?'2.5px solid #E8A020':'2.5px solid transparent',background:'none',padding:isMobile?'10px 14px':'13px 20px',fontFamily:"'DM Sans',sans-serif",fontSize:isMobile?13:14,fontWeight:active?600:400,color:active?'#2C2C2A':'#888780',cursor:'pointer',marginBottom:'-1px'}),
    filterLabel:{fontSize:10,fontWeight:700,color:'#888780',textTransform:'uppercase',letterSpacing:'.5px',whiteSpace:'nowrap',flexShrink:0},
    chip:(active,color)=>({border:active?'none':'1.5px solid #e0ddd5',background:active?(color||'#2C2C2A'):'#fff',color:active?'#fff':'#2C2C2A',borderRadius:20,padding:'5px 12px',fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}),
    main:{maxWidth:1280,margin:'0 auto',padding:p},
    card:{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:12,padding:'1rem 1.25rem',marginBottom:8},
    regBtn:{background:'#E8A020',color:'#fff',border:'none',padding:'8px 18px',borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:'pointer',textDecoration:'none',display:'inline-block'},
    overlay:{position:'fixed',inset:0,background:'rgba(44,44,42,.5)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'},
    modal:{background:'#fff',borderRadius:isMobile?'16px 16px 0 0':'12px',padding:'1.5rem',width:'100%',maxWidth:isMobile?'100%':'420px',border:'1.5px solid #e0ddd5',maxHeight:'90vh',overflowY:'auto'},
    calOption:{border:'1.5px solid #e0ddd5',borderRadius:8,padding:'12px 14px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',fontSize:14,fontWeight:500,background:'#fff',width:'100%',marginBottom:8,boxSizing:'border-box'},
    submitModal:{background:'#fff',borderRadius:isMobile?'16px 16px 0 0':'12px',padding:'1.5rem',width:'100%',maxWidth:isMobile?'100%':'520px',border:'1.5px solid #e0ddd5',maxHeight:'92vh',overflowY:'auto'},
    input:{width:'100%',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'10px 12px',fontFamily:"'DM Sans',sans-serif",fontSize:16,color:'#2C2C2A',background:'#F7F3EC',outline:'none',boxSizing:'border-box'},
    submitBtn:{background:'#E8A020',color:'#fff',border:'none',padding:'13px 24px',borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:16,fontWeight:600,cursor:'pointer',width:'100%',marginTop:4},
    cancelBtn:{background:'none',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'11px 16px',fontFamily:"'DM Sans',sans-serif",fontSize:15,cursor:'pointer',color:'#888780',width:'100%',marginTop:8},
  }

  // Sidebar filter button style
  const sideBtn = (active, activeColor) => ({
    display:'block',width:'100%',textAlign:'left',
    padding:'8px 12px',borderRadius:8,border:'none',
    background: active ? (activeColor||'#2C2C2A') : 'none',
    color: active ? '#fff' : '#2C2C2A',
    fontSize:13,fontWeight:active?600:400,
    cursor:'pointer',marginBottom:2,
    fontFamily:"'DM Sans',sans-serif",
    transition:'background .1s',
  })

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; max-width: 100%; overflow-x: hidden; }
        body { font-family: 'DM Sans', sans-serif; background: #F7F3EC; }
        .filter-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none; white-space: nowrap; }
        .filter-scroll::-webkit-scrollbar { display: none; }
        .filter-scroll > * { display: inline-flex; flex-shrink: 0; }
        a { color: inherit; text-decoration: none; }
        button { -webkit-tap-highlight-color: transparent; }
        .listing-card { transition: border-color .15s, box-shadow .15s; }
        .listing-card:hover { border-color: #c8c4bc !important; box-shadow: 0 2px 16px rgba(44,44,42,.07); }
        .register-btn:hover { opacity: .88; }
        .side-btn:hover { background: #f5f2ec !important; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={s.nav}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:isMobile?28:34,height:isMobile?28:34,background:'#E8A020',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:isMobile?14:17,flexShrink:0}}>🌞</div>
          <span style={s.logo}>Your<span style={s.logoSpan}>KidCal</span></span>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button style={s.navBtn('#185FA5')} onClick={()=>setNotifyOpen(true)}>{isMobile?'🔔':'🔔 Get Alerts'}</button>
          <button style={s.navBtn()} onClick={()=>setSubmitOpen(true)}>{isMobile?'+':'+ List a Program'}</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={s.hero}>
        <div style={{maxWidth:1280,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',gap:24,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:isMobile?20:28,fontFamily:"'Playfair Display',serif",fontWeight:700,color:'#2C2C2A',lineHeight:1.2}}>
              Every kids program deadline in <span style={{color:'#E8A020'}}>SLO County.</span>
            </div>
            <div style={{fontSize:13,color:'#888780',marginTop:6,display:'flex',gap:16,flexWrap:'wrap'}}>
              <span>{listings.length} programs</span>
              <span style={{color:'#D85A30',fontWeight:600}}>⏰ {urgentCount} urgent</span>
              <span style={{color:'#3B6D11',fontWeight:600}}>✓ {freeCount} free</span>
            </div>
          </div>
          <div style={{flexShrink:0,display:'flex',gap:8,alignItems:'center',width:isMobile?'100%':'auto'}}>
            <div style={{position:'relative',flex:1}}>
              <input
                style={{border:'1.5px solid #e0ddd5',borderRadius:10,padding:'10px 14px 10px 36px',fontFamily:"'DM Sans',sans-serif",fontSize:14,background:'#F7F3EC',outline:'none',width:isMobile?'100%':260}}
                placeholder="Search programs, orgs, areas..."
                value={search}
                onChange={e=>setSearch(e.target.value)}
              />
              <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14,color:'#888780'}}>🔍</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={s.tabBar}>
        {[['browse','Browse'],['quick','Quick List'],['calendar','Calendar'],['reviews','Reviews']].map(([id,label])=>(
          <button key={id} style={s.tabBtn(tab===id)} onClick={()=>{setTab(id);if(id==='reviews')fetchReviews()}}>{label}</button>
        ))}
      </div>

      {/* ══ BROWSE TAB ══ */}
      {tab==='browse'&&(
        <div style={{maxWidth:1280,margin:'0 auto',padding:isMobile?0:'0 2rem',display:'flex',alignItems:'flex-start'}}>

          {/* ── DESKTOP SIDEBAR ── */}
          {!isMobile&&(
            <div style={{width:220,flexShrink:0,position:'sticky',top:64,maxHeight:'calc(100vh - 64px)',overflowY:'auto',padding:'1.5rem 1.25rem 1.5rem 0',borderRight:'1.5px solid #e0ddd5'}}>

              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
                <span style={{fontSize:14,fontWeight:600,color:'#2C2C2A'}}>Filters</span>
                {activeFilterCount>0&&(
                  <button onClick={clearFilters} style={{background:'#FAECE7',color:'#D85A30',border:'none',borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                    Clear {activeFilterCount}
                  </button>
                )}
              </div>

              {/* TYPE */}
              <div style={{marginBottom:'1.25rem'}}>
                <div style={{fontSize:10,fontWeight:700,color:'#888780',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:6,padding:'0 12px'}}>Type</div>
                {CATEGORIES.map(cat=>(
                  <button key={cat} className="side-btn" onClick={()=>setFilter(cat)}
                    style={sideBtn(filter===cat)}>
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{height:1,background:'#f0ede6',margin:'0 0 1.25rem'}}/>

              {/* GENDER */}
              <div style={{marginBottom:'1.25rem'}}>
                <div style={{fontSize:10,fontWeight:700,color:'#888780',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:6,padding:'0 12px'}}>Gender</div>
                {[['all','All'],['male','Boys'],['female','Girls']].map(([val,label])=>(
                  <button key={val} className="side-btn" onClick={()=>setGender(val)}
                    style={sideBtn(gender===val,'#D85A30')}>
                    {label}
                  </button>
                ))}
              </div>

              <div style={{height:1,background:'#f0ede6',margin:'0 0 1.25rem'}}/>

              {/* AREA */}
              <div style={{marginBottom:'1.25rem'}}>
                <div style={{fontSize:10,fontWeight:700,color:'#888780',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:6,padding:'0 12px'}}>Area</div>
                {LOCATIONS.map(loc=>(
                  <button key={loc} className="side-btn" onClick={()=>setLocation(loc)}
                    style={{...sideBtn(location===loc,'#185FA5'),overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {loc}
                  </button>
                ))}
              </div>

              <div style={{height:1,background:'#f0ede6',margin:'0 0 1.25rem'}}/>

              {/* AGES */}
              <div style={{marginBottom:'1.25rem',padding:'0 12px'}}>
                <div style={{fontSize:10,fontWeight:700,color:'#888780',textTransform:'uppercase',letterSpacing:'.6px',marginBottom:12}}>Ages</div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {[['Min',ageMin,()=>setAgeMin(m=>Math.max(0,m-1)),()=>setAgeMin(m=>Math.min(m+1,ageMax))],
                    ['Max',ageMax,()=>setAgeMax(m=>Math.max(m-1,ageMin)),()=>setAgeMax(m=>Math.min(m+1,18))]
                  ].map(([label,val,dec,inc])=>(
                    <div key={label} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <span style={{fontSize:12,color:'#888780'}}>{label}</span>
                      <div style={{display:'flex',alignItems:'center',border:'1.5px solid #e0ddd5',borderRadius:8,overflow:'hidden'}}>
                        <button onClick={dec} style={{background:'#F7F3EC',border:'none',width:30,height:30,fontSize:16,cursor:'pointer',color:'#2C2C2A'}}>−</button>
                        <span style={{minWidth:34,textAlign:'center',fontSize:13,fontWeight:600,color:'#2C2C2A'}}>{label==='Max'&&val===18?'18+':val}</span>
                        <button onClick={inc} style={{background:'#F7F3EC',border:'none',width:30,height:30,fontSize:16,cursor:'pointer',color:'#2C2C2A'}}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MOBILE FILTERS (chips) ── */}
          {isMobile&&(
            <div style={{background:'#fff',borderBottom:'1.5px solid #e0ddd5',width:'100%'}}>
              <div className="filter-scroll" style={{padding:'.4rem 1rem',borderBottom:'1px solid #f0ede6'}}>
                <span style={{...s.filterLabel,display:'inline-flex',alignItems:'center',marginRight:6}}>Type</span>
                {CATEGORIES.map(cat=>(
                  <button key={cat} style={{...s.chip(filter===cat),marginRight:6}} onClick={()=>setFilter(cat)}>{cat}</button>
                ))}
              </div>
              <div className="filter-scroll" style={{padding:'.3rem 1rem',borderBottom:'1px solid #f0ede6'}}>
                <span style={{...s.filterLabel,display:'inline-flex',alignItems:'center',marginRight:6}}>Gender</span>
                {[['all','All'],['male','Boys'],['female','Girls']].map(([val,label])=>(
                  <button key={val} style={{...s.chip(gender===val,'#D85A30'),marginRight:6}} onClick={()=>setGender(val)}>{label}</button>
                ))}
              </div>
              <div className="filter-scroll" style={{padding:'.3rem 1rem',borderBottom:'1px solid #f0ede6'}}>
                <span style={{...s.filterLabel,display:'inline-flex',alignItems:'center',marginRight:6}}>Area</span>
                {LOCATIONS.map(loc=>(
                  <button key={loc} style={{...s.chip(location===loc,'#185FA5'),marginRight:6}} onClick={()=>setLocation(loc)}>{loc}</button>
                ))}
              </div>
              <div style={{padding:'.3rem 1rem .4rem',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                <span style={s.filterLabel}>Ages</span>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  {[['Min',ageMin,()=>setAgeMin(m=>Math.max(0,m-1)),()=>setAgeMin(m=>Math.min(m+1,ageMax))],
                    ['Max',ageMax,()=>setAgeMax(m=>Math.max(m-1,ageMin)),()=>setAgeMax(m=>Math.min(m+1,18))]
                  ].map(([label,val,dec,inc])=>(
                    <div key={label} style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:11,color:'#888780'}}>{label}</span>
                      <div style={{display:'flex',alignItems:'center',border:'1.5px solid #e0ddd5',borderRadius:8,overflow:'hidden'}}>
                        <button onClick={dec} style={{background:'#F7F3EC',border:'none',width:28,height:28,fontSize:15,cursor:'pointer',color:'#2C2C2A'}}>−</button>
                        <span style={{minWidth:24,textAlign:'center',fontSize:13,fontWeight:600,color:'#2C2C2A',padding:'0 2px'}}>{label==='Max'&&val===18?'18+':val}</span>
                        <button onClick={inc} style={{background:'#F7F3EC',border:'none',width:28,height:28,fontSize:15,cursor:'pointer',color:'#2C2C2A'}}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
                {activeFilterCount>0&&(
                  <button onClick={clearFilters} style={{background:'#FAECE7',color:'#D85A30',border:'none',borderRadius:20,padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer',marginLeft:'auto'}}>
                    Clear {activeFilterCount} filter{activeFilterCount>1?'s':''}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── MAIN CARD AREA ── */}
          <div style={{flex:1,minWidth:0,padding:isMobile?'1rem':'1.5rem 0 1.5rem 1.75rem'}}>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <span style={{fontSize:13,color:'#888780',fontWeight:500}}>
                {filtered.length} program{filtered.length!==1?'s':''} {activeFilterCount>0?'matched':'found'}
              </span>
            </div>

            {filtered.length===0&&(
              <div style={{textAlign:'center',padding:'3rem 1rem',color:'#888780',background:'#fff',borderRadius:12,border:'1.5px solid #e0ddd5'}}>
                <div style={{fontSize:36,marginBottom:10}}>🔍</div>
                <div style={{fontWeight:600,color:'#2C2C2A',fontSize:16,marginBottom:6}}>No programs match your filters</div>
                <div style={{fontSize:13,marginBottom:20}}>Try adjusting a filter or searching something different.</div>
                <button onClick={clearFilters} style={{background:'#E8A020',color:'#fff',border:'none',borderRadius:8,padding:'9px 20px',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                  Clear all filters
                </button>
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(auto-fill,minmax(320px,1fr))',gap:14}}>
              {filtered.map(l=>{
                const days = l.is_rolling ? 999 : daysUntil(l.reg_close || l.deadline)
                const urgent = days<=9&&days>=0
                const past = !l.is_rolling && days<0
                const isExpanded = expanded[l.id]
                const accentColor = past ? '#e0ddd5' : urgent ? '#D85A30' : CAT_COLORS[l.category?.toLowerCase()] || '#e0ddd5'
                return (
                  <div key={l.id} className="listing-card" style={{
                    background:'#fff',
                    border:'1.5px solid #e0ddd5',
                    borderTop:`3px solid ${accentColor}`,
                    borderRadius:12,
                    padding:'1rem 1.125rem',
                    opacity:past?0.65:1,
                    display:'flex',
                    flexDirection:'column',
                    gap:8,
                  }}>
                    {/* BADGES + BOOKMARK */}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                      <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>
                        <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,textTransform:'uppercase',letterSpacing:'.3px',background:BADGE[l.category?.toLowerCase()]?.bg||'#eee',color:BADGE[l.category?.toLowerCase()]?.color||'#666'}}>{l.category}</span>
                        {l.gender&&l.gender!=='both'&&<span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,textTransform:'uppercase',background:'#FAECE7',color:'#D85A30'}}>{l.gender==='male'?'Boys':'Girls'}</span>}
                        {urgent&&!past&&<span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,textTransform:'uppercase',background:'#FAECE7',color:'#D85A30'}}>🔥 Urgent</span>}
                        {past&&<span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,textTransform:'uppercase',background:'#f0ede6',color:'#888780'}}>Closed</span>}
                        {l.verified&&<span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,textTransform:'uppercase',background:'#EAF3DE',color:'#27500A'}}>✓ Verified</span>}
                      </div>
                      <button style={{background:isSaved(l.id)?'#EAF3DE':'none',border:isSaved(l.id)?'1.5px solid #3B6D11':'1.5px solid #e0ddd5',color:isSaved(l.id)?'#3B6D11':'#888780',borderRadius:6,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:13,flexShrink:0}} onClick={()=>toggleSave(l)}>🔖</button>
                    </div>

                    {/* TITLE */}
                    <a href={`/programs/${l.slug}`} style={{textDecoration:'none'}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:'#2C2C2A',lineHeight:1.3,cursor:'pointer'}}>{l.title}</div>
                    </a>
                    <div style={{fontSize:11,color:'#888780',marginTop:-4}}>{l.org_name}{l.location?` · ${l.location}`:''}</div>

                    {/* META ROW */}
                    <div style={{display:'flex',flexWrap:'wrap',gap:'5px 12px',fontSize:11,color:'#888780'}}>
                      {!past&&(
                        <span style={{color:urgencyColor(days),fontWeight:600}}>
                          {l.is_rolling ? '↻ Rolling enrollment' : `⏰ ${formatDateShort(l.reg_close||l.deadline)} · ${days}d left`}
                        </span>
                      )}
                      {past&&<span>🔒 Closed</span>}
                      {l.program_start&&<span>▶ {formatDateShort(l.program_start)}{l.program_end?` – ${formatDateShort(l.program_end)}`:''}</span>}
                      {l.ages&&<span>👥 {l.ages}</span>}
                      {l.cost_free
                        ? <span style={{color:'#3B6D11',fontWeight:700,background:'#EAF3DE',padding:'1px 6px',borderRadius:8}}>Free</span>
                        : <span>💰 ${l.cost?.toLocaleString()}</span>
                      }
                    </div>

                    {/* EXPANDABLE DESCRIPTION */}
                    {l.description&&(
                      <div>
                        {isExpanded&&<p style={{fontSize:12,color:'#555',lineHeight:1.6,margin:'0 0 4px'}}>{l.description}</p>}
                        <button onClick={()=>toggleExpand(l.id)} style={{background:'none',border:'none',color:'#185FA5',fontSize:12,cursor:'pointer',padding:0,fontFamily:"'DM Sans',sans-serif"}}>
                          {isExpanded?'▲ Less':'▼ More info'}
                        </button>
                      </div>
                    )}

                    {/* FOOTER */}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:8,borderTop:'1px solid #f0ede6',marginTop:'auto'}}>
                      <button style={{background:'none',border:'1.5px solid #e0ddd5',color:'#888780',borderRadius:6,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:13}} onClick={()=>setCalModal(l)}>📅</button>
                      {l.registration_url&&!past
                        ? <a href={l.registration_url} target="_blank" rel="noopener noreferrer" className="register-btn" style={{background:'#E8A020',color:'#fff',border:'none',padding:'8px 18px',borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,cursor:'pointer',textDecoration:'none',display:'inline-block'}}>Register →</a>
                        : past
                          ? <span style={{fontSize:11,color:'#888780',fontStyle:'italic'}}>Registration closed</span>
                          : <span style={{fontSize:11,color:'#888780'}}>No link yet</span>
                      }
                    </div>
                  </div>
                )
              })}
            </div>

            {/* SAVED LIST */}
            {saved.length>0&&(
              <div style={{...s.card,marginTop:'1.5rem',borderColor:'#3B6D11',borderLeft:'3px solid #3B6D11'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:15,margin:0}}>Saved ({saved.length})</h3>
                  <button style={{background:'#3B6D11',color:'#fff',border:'none',padding:'5px 12px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}} onClick={()=>downloadIcs(saved)}>⬇ Download</button>
                </div>
                {saved.map(l=>(
                  <div key={l.id} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #e0ddd5',fontSize:12}}>
                    <div>
                      <div style={{fontWeight:500,color:'#2C2C2A'}}>{l.title}</div>
                      <div style={{color:'#888780',fontSize:11,marginTop:1}}>Deadline: {formatDate(l.reg_close||l.deadline)}</div>
                    </div>
                    <button onClick={()=>toggleSave(l)} style={{background:'none',border:'none',cursor:'pointer',color:'#888780',fontSize:18,padding:'0 4px'}}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ QUICK LIST TAB ══ */}
      {tab==='quick'&&(
        <div style={s.main}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.75rem'}}>
            <span style={{fontSize:13,color:'#888780',fontWeight:500}}>{filtered.length} program{filtered.length!==1?'s':''}</span>
            {activeFilterCount>0&&(
              <button onClick={clearFilters} style={{background:'#FAECE7',color:'#D85A30',border:'none',borderRadius:20,padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                Clear {activeFilterCount} filter{activeFilterCount>1?'s':''}
              </button>
            )}
          </div>

          {filtered.length===0&&(
            <div style={{textAlign:'center',padding:'2rem',color:'#888780',background:'#fff',borderRadius:12,border:'1.5px solid #e0ddd5'}}>
              <div style={{fontSize:28,marginBottom:6}}>🔍</div>
              <div style={{fontWeight:600,color:'#2C2C2A',marginBottom:4}}>No programs match</div>
              <button onClick={clearFilters} style={{background:'#E8A020',color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',fontSize:13,fontWeight:600,cursor:'pointer',marginTop:8}}>
                Clear filters
              </button>
            </div>
          )}

          <div style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:12,overflow:'hidden'}}>
            {filtered.map((l,i)=>{
              const days = l.is_rolling ? 999 : daysUntil(l.reg_close || l.deadline)
              const urgent = days<=9&&days>=0
              const past = !l.is_rolling && days<0
              return (
                <div key={l.id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 16px',borderBottom:i<filtered.length-1?'1px solid #f0ede6':'none',opacity:past?0.5:1}}>
                  <div style={{width:4,alignSelf:'stretch',background:past?'#e0ddd5':urgent?'#D85A30':CAT_COLORS[l.category?.toLowerCase()]||'#e0ddd5',borderRadius:2,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <a href={`/programs/${l.slug}`} style={{textDecoration:'none'}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#2C2C2A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'pointer'}}>{l.title}</div>
                    </a>
                    <div style={{display:'flex',gap:8,marginTop:2,alignItems:'center',flexWrap:'wrap'}}>
                      <span style={{fontSize:11,color:past?'#888780':urgencyColor(days),fontWeight:600}}>
                        {past?'Closed':l.is_rolling?'↻ Rolling':urgent?`🔥 ${days}d left`:formatDateShort(l.reg_close||l.deadline)}
                      </span>
                      {!past&&<span style={{fontSize:11,color:'#888780'}}>{l.location||'SLO County'}</span>}
                      {l.cost_free
                        ? <span style={{fontSize:10,fontWeight:700,color:'#3B6D11',background:'#EAF3DE',padding:'1px 6px',borderRadius:8}}>Free</span>
                        : <span style={{fontSize:11,color:'#888780'}}>${l.cost}</span>
                      }
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6,flexShrink:0,alignItems:'center'}}>
                    <span style={{fontSize:11,fontWeight:600,color:past?'#888780':urgencyColor(days),minWidth:isMobile?0:60,textAlign:'right',display:isMobile?'none':'block'}}>
                      {past?'Closed':formatDateShort(l.reg_close||l.deadline)}
                    </span>
                    {l.registration_url&&!past
                      ? <a href={l.registration_url} target="_blank" rel="noopener noreferrer" style={{background:'#E8A020',color:'#fff',padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:600,textDecoration:'none',whiteSpace:'nowrap'}}>Register →</a>
                      : past ? <span style={{fontSize:11,color:'#888780',fontStyle:'italic'}}>Closed</span>
                      : <span style={{fontSize:11,color:'#888780'}}>No link</span>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ REVIEWS TAB ══ */}
      {tab==='reviews'&&(
        <div style={s.main}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem',flexWrap:'wrap',gap:8}}>
            <div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?18:22,margin:'0 0 4px'}}>Parent Reviews</h2>
              <p style={{fontSize:13,color:'#888780',margin:0}}>Real experiences from SLO County families</p>
            </div>
            <button style={{...s.regBtn,padding:'9px 18px',fontSize:13}} onClick={()=>{setReviewModal('new');setReviewSubmitted(false);setReviewForm({reviewer_name:'',rating:5,body:''})}}>
              + Write a Review
            </button>
          </div>

          <div style={{position:'relative',marginBottom:'1rem'}}>
            <input style={{...s.input,paddingLeft:36,fontSize:14}} placeholder="Search reviews by program or org..." value={reviewSearch} onChange={e=>setReviewSearch(e.target.value)}/>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14,color:'#888780'}}>🔍</span>
          </div>

          {!reviewsLoaded&&<div style={{textAlign:'center',padding:'2rem',color:'#888780'}}>Loading reviews...</div>}
          {reviewsLoaded&&reviews.length===0&&(
            <div style={{textAlign:'center',padding:'3rem',background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:12}}>
              <div style={{fontSize:40,marginBottom:12}}>⭐</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,marginBottom:8}}>No reviews yet</div>
              <div style={{fontSize:13,color:'#888780',marginBottom:16}}>Be the first to review a program!</div>
              <button style={s.regBtn} onClick={()=>{setReviewModal('new');setReviewSubmitted(false);setReviewForm({reviewer_name:'',rating:5,body:''})}}>Write the first review</button>
            </div>
          )}
          {reviewsLoaded&&reviews.filter(r=>{
            const q=reviewSearch.toLowerCase()
            return !q||r.listing_title?.toLowerCase().includes(q)||r.org_name?.toLowerCase().includes(q)||r.body?.toLowerCase().includes(q)
          }).map(r=>(
            <div key={r.id} style={{...s.card,marginBottom:10}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:8}}>
                <div>
                  <div style={{color:'#E8A020',fontSize:18,letterSpacing:2,marginBottom:4}}>
                    {'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}
                  </div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:'#2C2C2A'}}>{r.listing_title}</div>
                  <div style={{fontSize:11,color:'#888780',marginTop:2}}>{r.org_name}</div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:'#2C2C2A'}}>{r.reviewer_name}</div>
                  <div style={{fontSize:11,color:'#888780'}}>{new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                </div>
              </div>
              <p style={{fontSize:13,color:'#444',lineHeight:1.6,margin:0}}>{r.body}</p>
            </div>
          ))}

          {reviewModal&&(
            <div style={s.overlay} onClick={()=>setReviewModal(null)}>
              <div style={s.submitModal} onClick={e=>e.stopPropagation()}>
                <div style={{width:40,height:4,background:'#e0ddd5',borderRadius:2,margin:'0 auto 1rem',display:isMobile?'block':'none'}}/>
                {reviewSubmitted?(
                  <div style={{textAlign:'center',padding:'2rem 0'}}>
                    <div style={{fontSize:48,marginBottom:12}}>⭐</div>
                    <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:8}}>Thanks for your review!</h3>
                    <p style={{color:'#888780',fontSize:14,lineHeight:1.6}}>We'll review it and publish within 2 business days.</p>
                    <button style={{...s.submitBtn,marginTop:'1.5rem'}} onClick={()=>setReviewModal(null)}>Done</button>
                  </div>
                ):(
                  <>
                    <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:4}}>⭐ Write a Review</h3>
                    <p style={{fontSize:13,color:'#888780',marginBottom:'1.25rem',lineHeight:1.5}}>Share your experience. Reviews are published after a quick check.</p>
                    <div style={{marginBottom:'.85rem'}}>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:'#2C2C2A',marginBottom:4,textTransform:'uppercase',letterSpacing:'.4px'}}>Program *</label>
                      <select style={s.input} onChange={e=>{const l=listings.find(x=>x.id===e.target.value);setReviewModal(l||'new')}} value={reviewModal==='new'?'':reviewModal.id}>
                        <option value="">Select a program...</option>
                        {[...listings].sort((a,b)=>a.title.localeCompare(b.title)).map(l=>(
                          <option key={l.id} value={l.id}>{l.title} — {l.org_name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{marginBottom:'.85rem'}}>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:'#2C2C2A',marginBottom:6,textTransform:'uppercase',letterSpacing:'.4px'}}>Rating *</label>
                      <div style={{display:'flex',gap:6}}>
                        {[1,2,3,4,5].map(n=>(
                          <button key={n} onClick={()=>setReviewForm(f=>({...f,rating:n}))} style={{fontSize:28,background:'none',border:'none',cursor:'pointer',color:n<=reviewForm.rating?'#E8A020':'#e0ddd5',padding:'0 2px'}}>★</button>
                        ))}
                        <span style={{fontSize:13,color:'#888780',alignSelf:'center',marginLeft:4}}>{['','Poor','Fair','Good','Great','Excellent'][reviewForm.rating]}</span>
                      </div>
                    </div>
                    <div style={{marginBottom:'.85rem'}}>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:'#2C2C2A',marginBottom:4,textTransform:'uppercase',letterSpacing:'.4px'}}>Your name *</label>
                      <input style={s.input} type="text" placeholder="e.g. Sarah M." value={reviewForm.reviewer_name} onChange={e=>setReviewForm(f=>({...f,reviewer_name:e.target.value}))}/>
                    </div>
                    <div style={{marginBottom:'1rem'}}>
                      <label style={{display:'block',fontSize:12,fontWeight:600,color:'#2C2C2A',marginBottom:4,textTransform:'uppercase',letterSpacing:'.4px'}}>Your review *</label>
                      <textarea style={{...s.input,minHeight:100,resize:'vertical'}} placeholder="What did your kid think? Would you recommend it?" value={reviewForm.body} onChange={e=>setReviewForm(f=>({...f,body:e.target.value}))}/>
                    </div>
                    <button style={{...s.submitBtn,opacity:(reviewModal!=='new'&&reviewForm.reviewer_name&&reviewForm.body)?1:0.5}} onClick={(reviewModal!=='new'&&reviewForm.reviewer_name&&reviewForm.body)?handleReviewSubmit:undefined}>Submit Review</button>
                    <button style={s.cancelBtn} onClick={()=>setReviewModal(null)}>Cancel</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ CALENDAR TAB ══ */}
      {tab==='calendar'&&(
        <div style={s.main}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem',flexWrap:'wrap',gap:8}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?18:22,margin:0}}>{MONTHS[calMonth]} {calYear}</h3>
            <div style={{display:'flex',gap:6}}>
              <button style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:13}} onClick={prevMonth}>←</button>
              <button style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:13}} onClick={nextMonth}>→</button>
              <button style={{background:'#2C2C2A',color:'#fff',border:'none',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:12,fontWeight:600}} onClick={()=>downloadIcs(listings)}>⬇ All</button>
            </div>
          </div>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:'1rem'}}>
            {Object.entries(CAT_COLORS).map(([cat,color])=>(
              <div key={cat} style={{display:'flex',alignItems:'center',gap:5,fontSize:11}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:color}}/>
                <span style={{color:'#888780',textTransform:'capitalize'}}>{cat}</span>
              </div>
            ))}
          </div>
          <div style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:12,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1.5px solid #e0ddd5'}}>
              {DAYS.map((d,i)=><div key={i} style={{textAlign:'center',padding:'10px 0',fontSize:11,fontWeight:700,color:'#888780'}}>{d}</div>)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
              {Array.from({length:firstDay}).map((_,i)=>(
                <div key={'e'+i} style={{minHeight:isMobile?48:80,borderRight:'1px solid #f0ede6',borderBottom:'1px solid #f0ede6',background:'#faf9f6'}}/>
              ))}
              {Array.from({length:daysInMonth}).map((_,i)=>{
                const day=i+1
                const dayListings=getListingsForDay(day)
                const isT=isToday(day)
                return (
                  <div key={day} style={{minHeight:isMobile?48:80,borderRight:'1px solid #f0ede6',borderBottom:'1px solid #f0ede6',padding:isMobile?3:6,background:isT?'#fffbf2':'#fff'}}>
                    <div style={{width:22,height:22,borderRadius:'50%',background:isT?'#E8A020':'transparent',color:isT?'#fff':'#2C2C2A',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:isT?700:400,marginBottom:3}}>{day}</div>
                    {dayListings.map(l=>(
                      <div key={l.id} onClick={()=>setCalModal(l)} style={{background:CAT_COLORS[l.category?.toLowerCase()]||'#888',color:'#fff',borderRadius:3,padding:'1px 4px',fontSize:isMobile?9:10,fontWeight:500,marginBottom:2,cursor:'pointer',overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',lineHeight:1.6}}>{isMobile?'●':l.title}</div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{marginTop:'1.5rem'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:isMobile?16:18,margin:0}}>All Deadlines</h3>
              <button style={{background:hidePast?'#2C2C2A':'#fff',color:hidePast?'#fff':'#2C2C2A',border:'1.5px solid #e0ddd5',borderRadius:20,padding:'5px 14px',fontSize:12,fontWeight:500,cursor:'pointer'}} onClick={()=>setHidePast(h=>!h)}>
                {hidePast?'Show Past':'Hide Past'}
              </button>
            </div>
            {listings.filter(l=>hidePast?!l.is_rolling&&daysUntil(l.reg_close||l.deadline)>=0:true).sort((a,b)=>new Date(a.reg_close||a.deadline)-new Date(b.reg_close||b.deadline)).map(l=>{
              const days = l.is_rolling ? 999 : daysUntil(l.reg_close||l.deadline)
              return (
                <div key={l.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 16px',background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:10,marginBottom:8,opacity:days<0?0.5:1,gap:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:CAT_COLORS[l.category?.toLowerCase()]||'#888',flexShrink:0}}/>
                    <div style={{minWidth:0}}>
                      <a href={`/programs/${l.slug}`} style={{textDecoration:'none'}}>
                        <div style={{fontSize:13,fontWeight:600,color:'#2C2C2A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'pointer'}}>{l.title}</div>
                      </a>
                      <div style={{fontSize:11,color:'#888780'}}>{l.org_name}</div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:12,fontWeight:600,color:days<0?'#888780':urgencyColor(days)}}>{l.is_rolling?'Rolling':formatDateShort(l.reg_close||l.deadline)}</div>
                      <div style={{fontSize:10,color:days<0?'#888780':urgencyColor(days)}}>{days<0?'Closed':l.is_rolling?'Enroll anytime':`${days}d left`}</div>
                    </div>
                    <button style={{background:'#E8A020',color:'#fff',border:'none',borderRadius:8,padding:'5px 12px',fontSize:12,fontWeight:600,cursor:'pointer'}} onClick={()=>setCalModal(l)}>+</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── CAL MODAL ── */}
      {calModal&&(
        <div style={s.overlay} onClick={()=>setCalModal(null)}>
          <div style={s.modal} onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,background:'#e0ddd5',borderRadius:2,margin:'0 auto 1rem',display:isMobile?'block':'none'}}/>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,marginBottom:4}}>{calModal.title}</h3>
            <p style={{fontSize:13,color:'#888780',marginBottom:'1.25rem',lineHeight:1.5}}>{calModal.org_name} · Deadline {formatDate(calModal.reg_close||calModal.deadline)}</p>
            <button style={s.calOption} onClick={()=>{addToGoogle(calModal);setCalModal(null)}}>🗓 Google Calendar</button>
            <button style={s.calOption} onClick={()=>{downloadIcs([calModal]);setCalModal(null)}}>📱 Download (.ics)</button>
            <button style={s.calOption} onClick={()=>{toggleSave(calModal);setCalModal(null)}}>🔖 Save to my list</button>
            <button style={s.cancelBtn} onClick={()=>setCalModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── NOTIFY MODAL ── */}
      {notifyOpen&&(
        <div style={s.overlay} onClick={()=>setNotifyOpen(false)}>
          <div style={s.submitModal} onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,background:'#e0ddd5',borderRadius:2,margin:'0 auto 1rem',display:isMobile?'block':'none'}}/>
            {notifySubmitted?(
              <div style={{textAlign:'center',padding:'2rem 0'}}>
                <div style={{fontSize:48,marginBottom:12}}>🔔</div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:8}}>You're signed up!</h3>
                <p style={{color:'#888780',fontSize:14,lineHeight:1.6}}>Check your inbox for a confirmation. We'll send deadline reminders as they approach.</p>
                <button style={{...s.submitBtn,marginTop:'1.5rem'}} onClick={()=>{setNotifyOpen(false);setNotifySubmitted(false)}}>Done</button>
              </div>
            ):(
              <>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:4}}>🔔 Get Deadline Alerts</h3>
                <p style={{fontSize:13,color:'#888780',marginBottom:'1.25rem',lineHeight:1.6}}>We'll email you when deadlines are approaching for programs that match your family.</p>
                {[['Name','name','text','e.g. Sarah'],['Email *','email','email','your@email.com']].map(([label,key,type,ph])=>(
                  <div key={key} style={{marginBottom:'.85rem'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'#2C2C2A',marginBottom:4,textTransform:'uppercase',letterSpacing:'.4px'}}>{label}</label>
                    <input style={s.input} type={type} placeholder={ph} value={notifyForm[key]} onChange={e=>setNotifyForm(f=>({...f,[key]:e.target.value}))}/>
                  </div>
                ))}
                <div style={{marginBottom:'.85rem'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'#2C2C2A',marginBottom:6,textTransform:'uppercase',letterSpacing:'.4px'}}>Program types</label>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {['Camp','School','Sport','Daycare','Rec','Arts'].map(cat=>(
                      <button key={cat} onClick={()=>toggleNotifyCat(cat)} style={{border:notifyForm.categories.includes(cat)?'none':'1.5px solid #e0ddd5',background:notifyForm.categories.includes(cat)?'#2C2C2A':'#fff',color:notifyForm.categories.includes(cat)?'#fff':'#2C2C2A',borderRadius:20,padding:'5px 12px',fontSize:12,cursor:'pointer'}}>{cat}</button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:'.85rem'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'#2C2C2A',marginBottom:6,textTransform:'uppercase',letterSpacing:'.4px'}}>My area</label>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {LOCATIONS.filter(l=>l!=='All Areas').map(loc=>(
                      <button key={loc} onClick={()=>toggleNotifyLoc(loc)} style={{border:notifyForm.locations.includes(loc)?'none':'1.5px solid #e0ddd5',background:notifyForm.locations.includes(loc)?'#185FA5':'#fff',color:notifyForm.locations.includes(loc)?'#fff':'#2C2C2A',borderRadius:20,padding:'5px 12px',fontSize:12,cursor:'pointer'}}>{loc}</button>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:'.85rem'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'#2C2C2A',marginBottom:6,textTransform:'uppercase',letterSpacing:'.4px'}}>Kids ages</label>
                  <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                    {[['Min',notifyForm.age_min,()=>setNotifyForm(f=>({...f,age_min:Math.max(0,f.age_min-1)})),()=>setNotifyForm(f=>({...f,age_min:Math.min(f.age_min+1,f.age_max)}))],
                      ['Max',notifyForm.age_max,()=>setNotifyForm(f=>({...f,age_max:Math.max(f.age_max-1,f.age_min)})),()=>setNotifyForm(f=>({...f,age_max:Math.min(f.age_max+1,18)}))]
                    ].map(([label,val,dec,inc])=>(
                      <div key={label} style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:11,color:'#888780'}}>{label}</span>
                        <div style={{display:'flex',alignItems:'center',border:'1.5px solid #e0ddd5',borderRadius:8,overflow:'hidden'}}>
                          <button onClick={dec} style={{background:'#F7F3EC',border:'none',width:36,height:36,fontSize:18,cursor:'pointer',color:'#2C2C2A'}}>−</button>
                          <span style={{minWidth:36,textAlign:'center',fontSize:14,fontWeight:600,color:'#2C2C2A',padding:'0 4px'}}>{label==='Max'&&val===18?'18+':val}</span>
                          <button onClick={inc} style={{background:'#F7F3EC',border:'none',width:36,height:36,fontSize:18,cursor:'pointer',color:'#2C2C2A'}}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{marginBottom:'1rem',background:'#F7F3EC',borderRadius:8,padding:'12px'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'#2C2C2A',marginBottom:8,textTransform:'uppercase',letterSpacing:'.4px'}}>Alert me when</label>
                  {[['notify_new','A new matching program is added'],['notify_deadline_7','A deadline is 7 days away'],['notify_deadline_30','A deadline is 30 days away']].map(([key,label])=>(
                    <label key={key} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'#2C2C2A',marginBottom:6,cursor:'pointer'}}>
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

      {/* ── SUBMIT MODAL ── */}
      {submitOpen&&(
        <div style={s.overlay} onClick={()=>setSubmitOpen(false)}>
          <div style={s.submitModal} onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,background:'#e0ddd5',borderRadius:2,margin:'0 auto 1rem',display:isMobile?'block':'none'}}/>
            {submitted?(
              <div style={{textAlign:'center',padding:'2rem 0'}}>
                <div style={{fontSize:48,marginBottom:12}}>✅</div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:8}}>Submitted!</h3>
                <p style={{color:'#888780',fontSize:14,lineHeight:1.6}}>We'll review and publish within 2 business days.</p>
                <button style={{...s.submitBtn,marginTop:'1.5rem'}} onClick={()=>{setSubmitOpen(false);setSubmitted(false)}}>Close</button>
              </div>
            ):(
              <>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:4}}>List a Program</h3>
                <p style={{fontSize:13,color:'#888780',marginBottom:'1.25rem',lineHeight:1.6}}>Free to list. We'll review and publish within 2 business days.</p>
                {[['Program name','title','text','e.g. SLO Summer Arts Camp'],['Organization','org_name','text','e.g. SLO Arts Center'],['Location','location','text','e.g. San Luis Obispo'],['Age range','ages','text','e.g. 6–12'],['Registration deadline','deadline','date',''],['Program start date','start_date','date',''],['Cost (blank if free)','cost','text','e.g. 350'],['Registration link','registration_url','url','https://'],['Your email','email','email','your@email.com']].map(([label,key,type,ph])=>(
                  <div key={key} style={{marginBottom:'.85rem'}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:'#2C2C2A',marginBottom:4,textTransform:'uppercase',letterSpacing:'.4px'}}>{label}</label>
                    <input style={s.input} type={type} placeholder={ph} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}/>
                  </div>
                ))}
                <div style={{marginBottom:'.85rem'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'#2C2C2A',marginBottom:4,textTransform:'uppercase',letterSpacing:'.4px'}}>Category</label>
                  <select style={s.input} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {['Camp','School','Sport','Daycare','Rec','Arts'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:'.85rem',display:'flex',alignItems:'center',gap:8}}>
                  <input type="checkbox" id="free" checked={form.cost_free} onChange={e=>setForm(f=>({...f,cost_free:e.target.checked}))}/>
                  <label htmlFor="free" style={{fontSize:14,color:'#2C2C2A'}}>This program is free</label>
                </div>
                <div style={{marginBottom:'.85rem'}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:'#2C2C2A',marginBottom:4,textTransform:'uppercase',letterSpacing:'.4px'}}>Description</label>
                  <textarea style={{...s.input,minHeight:70,resize:'vertical'}} placeholder="Brief description..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
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
