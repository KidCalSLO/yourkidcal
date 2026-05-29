'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [listings, setListings] = useState([])
  const [reviews, setReviews] = useState([])
  const [tab, setTab] = useState('pending')
  const [reviewTab, setReviewTab] = useState('pending')
  const [adminTab, setAdminTab] = useState('listings')
  const [loading, setLoading] = useState(false)

  async function login() {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuthed(true)
      fetchListings()
      fetchReviews()
    } else {
      alert('Wrong password')
    }
  }

  async function fetchListings() {
    setLoading(true)
    const res = await fetch('/api/admin/listings')
    const data = await res.json()
    setListings(data.listings || [])
    setLoading(false)
  }

  async function fetchReviews() {
    const res = await fetch('/api/admin/reviews')
    const data = await res.json()
    setReviews(data.reviews || [])
  }

  async function updateListing(id, status) {
    await fetch('/api/admin/listings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    fetchListings()
  }

  async function deleteListing(id) {
    if (!confirm('Delete this listing?')) return
    await fetch('/api/admin/listings', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchListings()
  }

  async function updateReview(id, status) {
    await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    fetchReviews()
  }

  async function deleteReview(id) {
    if (!confirm('Delete this review?')) return
    await fetch('/api/admin/reviews', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchReviews()
  }

  const byStatus = (s) => listings.filter(l => l.status === s)
  const reviewsByStatus = (s) => reviews.filter(r => r.status === s)

  const s = {
    page: { fontFamily: "'DM Sans', sans-serif", background: '#F7F3EC', minHeight: '100vh', padding: '2rem' },
    card: { background: '#fff', border: '1.5px solid #e0ddd5', borderRadius: 12, padding: '1.25rem', marginBottom: 12 },
    tabBtn: (active) => ({
      border: 'none', borderBottom: active ? '2.5px solid #E8A020' : '2.5px solid transparent',
      background: 'none', padding: '10px 16px', fontSize: 14, fontWeight: active ? 600 : 400,
      color: active ? '#2C2C2A' : '#888780', cursor: 'pointer', marginBottom: '-1px',
      fontFamily: "'DM Sans', sans-serif",
    }),
    adminTabBtn: (active) => ({
      border: 'none', borderBottom: active ? '2.5px solid #185FA5' : '2.5px solid transparent',
      background: 'none', padding: '10px 18px', fontSize: 15, fontWeight: active ? 600 : 400,
      color: active ? '#2C2C2A' : '#888780', cursor: 'pointer', marginBottom: '-1px',
      fontFamily: "'DM Sans', sans-serif",
    }),
    btn: (color) => ({
      background: color, color: '#fff', border: 'none', padding: '6px 12px',
      borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif", marginRight: 6,
    }),
  }

  const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

  if (!authed) return (
    <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...s.card, width: 320, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🌞</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", marginBottom: 16 }}>YourKidCal Admin</h2>
        <input
          type="password" placeholder="Password"
          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e0ddd5', borderRadius: 8, fontSize: 15, marginBottom: 12, fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
        />
        <button onClick={login} style={{ ...s.btn('#E8A020'), width: '100%', padding: '11px', fontSize: 15 }}>Sign In</button>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, margin: 0 }}>
            🌞 YourKidCal Admin
          </h1>
          <div style={{ fontSize: 13, color: '#888780' }}>
            {listings.length} listings · {reviews.length} reviews
          </div>
        </div>

        <div style={{ background: '#fff', border: '1.5px solid #e0ddd5', borderRadius: '12px 12px 0 0', display: 'flex', marginBottom: 0 }}>
          <button style={s.adminTabBtn(adminTab === 'listings')} onClick={() => setAdminTab('listings')}>
            Listings{listings.filter(l => l.status === 'pending').length > 0 && (
              <span style={{ background: '#E8A020', color: '#fff', borderRadius: 10, fontSize: 11, padding: '1px 6px', marginLeft: 6 }}>
                {listings.filter(l => l.status === 'pending').length}
              </span>
            )}
          </button>
          <button style={s.adminTabBtn(adminTab === 'reviews')} onClick={() => setAdminTab('reviews')}>
            Reviews{reviews.filter(r => r.status === 'pending').length > 0 && (
              <span style={{ background: '#185FA5', color: '#fff', borderRadius: 10, fontSize: 11, padding: '1px 6px', marginLeft: 6 }}>
                {reviews.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {adminTab === 'listings' && (
          <div style={{ background: '#fff', border: '1.5px solid #e0ddd5', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '1rem' }}>
            <div style={{ display: 'flex', borderBottom: '1.5px solid #e0ddd5', marginBottom: '1rem' }}>
              {['pendin
