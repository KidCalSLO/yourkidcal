import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  const body = await req.json()
  const { error } = await supabase.from('subscriptions').insert([{
    email: body.email,
    name: body.name || null,
    categories: body.categories || [],
    locations: body.locations || [],
    age_min: body.age_min || 0,
    age_max: body.age_max || 18,
    notify_new: body.notify_new ?? true,
    notify_deadline_7: body.notify_deadline_7 ?? true,
    notify_deadline_30: body.notify_deadline_30 ?? false,
    confirmed: false,
  }])
  if (error) return NextResponse.json({ error }, { status: 500 })

await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourkidcal.com'}/api/notify/welcome`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: body.email,
    name: body.name,
    categories: body.categories,
    locations: body.locations,
  })
})

return NextResponse.json({ success: true })
}
