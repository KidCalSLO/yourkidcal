'use client'
import { useState } from 'react'

export default function ClaimForm({ listingId }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', title: '', email: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleClaim() {
    if (!form.name || !form.email) return
    setLoading(true)
    const res = await fetch('/api/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        org_contact_name: form.name,
        org_contact_title: form.title,
        email: form.email,
      }),
    })
    setLoading(false)
    if (res.ok) setSubmitted(true)
  }

  if (submitted) return (
    <div style={{background:'#EAF3DE',borderRadius:8,padding:'12px 16px',fontSize:14,color:'#27500A',fontWeight:500}}>
      ✓ Check your inbox! We sent a verification link to {form.email}
    </div>
  )

  if (!open) return (
    <button onClick={()=>setOpen(true)}
      style={{background:'#2C2C2A',color:'#fff',border:'none',padding:'10px 20px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif"}}>
      ✓ Claim this listing
    </button>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {[['Your name *','name','text','e.g. Jane Smith'],['Your title','title','text','e.g. Program Director'],['Work email *','email','email','your@organization.com']].map(([label,key,type,ph])=>(
        <div key={key}>
          <label style={{display:'block',fontSize:11,fontWeight:700,color:'#888780',textTransform:'uppercase',letterSpacing:'.4px',marginBottom:4}}>{label}</label>
          <input type={type} placeholder={ph} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
            style={{width:'100%',border:'1.5px solid #e0ddd5',borderRadius:8,padding:'9px 12px',fontSize:15,fontFamily:"'DM Sans',sans-serif",background:'#F7F3EC',color:'#2C2C2A',outline:'none',boxSizing:'border-box'}}/>
        </div>
      ))}
      <div style={{display:'flex',gap:8,marginTop:4}}>
        <button onClick={handleClaim} disabled={loading||!form.name||!form.email}
          style={{background:'#E8A020',color:'#fff',border:'none',padding:'10px 20px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",opacity:(form.name&&form.email)?1:0.5}}>
          {loading?'Sending...':'Send verification email'}
        </button>
        <button onClick={()=>setOpen(false)}
          style={{background:'none',border:'1.5px solid #e0ddd5',padding:'10px 16px',borderRadius:8,fontSize:13,cursor:'pointer',color:'#888780',fontFamily:"'DM Sans',sans-serif"}}>
          Cancel
        </button>
      </div>
    </div>
  )
}
