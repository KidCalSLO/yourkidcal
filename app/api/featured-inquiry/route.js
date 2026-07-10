import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  const { listing_id, org_name, contact_name, email, message } = await req.json()

  if (!org_name || !contact_name || !email) {
    return NextResponse.json({ error: 'org_name, contact_name, and email are required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('featured_inquiries')
    .insert({
      listing_id: listing_id || null,
      org_name,
      contact_name,
      email,
      message: message || null,
    })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
