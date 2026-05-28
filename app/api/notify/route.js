import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  const { type } = await req.json()

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'approved')

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*')

  if (!listings || !subs) return NextResponse.json({ error: 'No data' }, { status: 500 })

  const today = new Date(); today.setHours(0,0,0,0)

  function daysUntil(dateStr) {
    return Math.round((new Date(dateStr) - today) / 86400000)
  }

  function matchesSub(listing, sub) {
    const matchCat = !sub.categories?.length || sub.categories.map(c=>c.toLowerCase()).includes(listing.category?.toLowerCase())
    const matchLoc = !sub.locations?.length || sub.locations.some(l => (listing.location||'').toLowerCase().includes(l.toLowerCase()))
    const ages = listing.ages || ''
    const clean = ages.replace(/\s/g,'').replace('mo','').replace('wk','')
    const parts = clean.split(/[-–]/)
    const lMin = parseInt(parts[0]) || 0
    const lMax = parseInt(parts[1]) || lMin
    const matchAge = lMin <= (sub.age_max||18) && lMax >= (sub.age_min||0)
    return matchCat && matchLoc && matchAge
  }

  const results = []

  for (const sub of subs) {
    const matched = listings.filter(l => matchesSub(l, sub))
    const toSend = []

    if (type === 'deadline_7' && sub.notify_deadline_7) {
      const urgent = matched.filter(l => daysUntil(l.deadline) === 7)
      if (urgent.length) toSend.push(...urgent.map(l => ({ listing: l, reason: '7 days' })))
    }

    if (type === 'deadline_30' && sub.notify_deadline_30) {
      const upcoming = matched.filter(l => daysUntil(l.deadline) === 30)
      if (upcoming.length) toSend.push(...upcoming.map(l => ({ listing: l, reason: '30 days' })))
    }

    if (type === 'deadline_1') {
      const tomorrow = matched.filter(l => daysUntil(l.deadline) === 1)
      if (tomorrow.length) toSend.push(...tomorrow.map(l => ({ listing: l, reason: 'tomorrow' })))
    }

    if (toSend.length > 0) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'YourKidCal <hello@yourkidcal.com>',
          to: sub.email,
          subject: `⏰ ${toSend.length} deadline${toSend.length>1?'s':''} coming up — YourKidCal`,
          html: buildEmail(sub, toSend)
        })
      })
      results.push({ email: sub.email, sent: toSend.length, ok: res.ok })
    }
  }

  return NextResponse.json({ results })
}

function buildEmail(sub, items) {
  const name = sub.name ? sub.name.split(' ')[0] : 'there'
  const rows = items.map(({ listing: l, reason }) => {
    const cost = l.cost_free ? 'Free' : `$${l.cost}`
    const deadline = new Date(l.deadline).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
    return `
      <div style="background:#fff;border:1.5px solid #e0ddd5;border-radius:12px;padding:20px;margin-bottom:16px;border-left:4px solid #E8A020">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#E8A020;margin-bottom:6px">${l.category} · ${reason} left</div>
        <div style="font-size:18px;font-weight:700;color:#2C2C2A;margin-bottom:4px;font-family:Georgia,serif">${l.title}</div>
        <div style="font-size:13px;color:#888780;margin-bottom:12px">${l.org_name} · ${l.location||'SLO County'} · Ages ${l.ages||'All'} · ${cost}</div>
        <div style="font-size:13px;color:#2C2C2A;margin-bottom:16px">📅 Registration closes <strong>${deadline}</strong></div>
        ${l.registration_url ? `<a href="${l.registration_url}" style="background:#E8A020;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block">Register Now →</a>` : ''}
      </div>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#F7F3EC;font-family:'Helvetica Neue',Arial,sans-serif">
      <div style="max-width:600px;margin:0 auto;padding:24px 16px">
        <div style="text-align:center;margin-bottom:24px">
          <div style="display:inline-flex;align-items:center;gap:8px">
            <span style="font-size:28px">🌞</span>
            <span style="font-size:22px;font-weight:700;color:#2C2C2A;font-family:Georgia,serif">Your<span style="color:#E8A020">KidCal</span></span>
          </div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;border:1.5px solid #e0ddd5">
          <h1 style="font-size:22px;font-family:Georgia,serif;color:#2C2C2A;margin:0 0 8px">Hey ${name}! ⏰</h1>
          <p style="font-size:15px;color:#888780;margin:0;line-height:1.6">You have <strong style="color:#2C2C2A">${items.length} registration deadline${items.length>1?'s':''}</strong> coming up for programs in SLO County.</p>
        </div>
        ${rows}
        <div style="text-align:center;padding:24px 0;font-size:12px;color:#888780">
          <p style="margin:0 0 8px">View all programs at <a href="https://yourkidcal.com" style="color:#E8A020;font-weight:600">yourkidcal.com</a></p>
          <p style="margin:0">You're receiving this because you signed up for deadline reminders.<br>Reply to this email to unsubscribe.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
