'use client'
import { useState, useEffect } from 'react'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('pending')

  async function login() {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    if (res.ok) { setAuthed(true); loadListings() }
    else setError('Incorrect password')
  }

  async function loadListings() {
    setLoading(true)
    const res = await fetch('/api/admin/listings')
    const data = await res.json()
    setListings(data.listings || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await fetch('/api/admin/listings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    })
    loadListings()
  }

  async function deleteListing(id) {
    if (!confirm('Delete this listing permanently?')) return
    await fetch('/api/admin/listings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    loadListings()
  }

  const filtered = listings.filter(l => l.status === tab)

  const s = {
    page: { minHeight:'100vh', background:'#F7F3EC', fontFamily:"'DM Sans',sans-serif" },
    nav: { background:'#2C2C2A', padding:'0 2rem', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' },
    navTitle: { color:'#E8A020', fontFamily:"'Playfair Display',serif", fontSize:20 },
    loginWrap: { maxWidth:400, margin:'8rem auto', background:'#fff', borderRadius:12, padding:'2rem', border:'1.5px solid #e0ddd5' },
    h2: { fontFamily:"'Playfair Display',serif", fontSize:24, marginBottom:8, color:'#2C2C2A' },
    input: { width:'100%', border:'1.5px solid #e0ddd5', borderRadius:8, padding:'10px 12px', fontFamily:"'DM Sans',sans-serif", fontSize:15, outline:'none', boxSizing:'border-box', marginBottom:12 },
    btn: (color) => ({ background: color||'#E8A020', color:'#fff', border:'none', padding:'10px 20px', borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, cursor:'pointer' }),
    main: { maxWidth:900, margin:'0 auto', padding:'2rem' },
    tabs: { display:'flex', gap:8, marginBottom:'1.5rem' },
    tab: (active) => ({ border: active?'none':'1.5px solid #e0ddd5', background: active?'#2C2C2A':'#fff', color: active?'#fff':'#2C2C2A', borderRadius:20, padding:'7px 18px', fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, cursor:'pointer' }),
    card: { background:'#fff', border:'1.5px solid #e0ddd5', borderRadius:12, padding:'1.25rem', marginBottom:12 },
    badge: { background:'#FAEEDA', color:'#BA7517', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:10, textTransform:'uppercase', marginLeft:8 },
    cardTitle: { fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'#2C2C2A', marginBottom:4 },
    meta: { fontSize:13, color:'#888780', marginBottom:8, lineHeight:1.8 },
    actions: { display:'flex', gap:8, flexWrap:'wrap', marginTop:12, paddingTop:12, borderTop:'1px solid #e0ddd5' },
    approveBtn: { background:'#3B6D11', color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' },
    rejectBtn: { background:'#888780', color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' },
    deleteBtn: { background:'#D85A30', color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' },
    pendingBtn: { background:'#BA7517', color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' },
  }

  if (!authed) return (
    <div style={s.page}>
      <nav style={s.nav}><span style={s.navTitle}>YourKidCal Admin</span></nav>
      <div style={
