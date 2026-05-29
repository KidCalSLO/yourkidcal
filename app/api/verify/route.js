import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) return NextResponse.json({ error: 'No token' }, { status: 400 })

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, org_name, verified, claimed_at')
    .eq('claim_token', token)
    .single()

  if (!listing) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (listing.verified) return NextResponse.json({ already: true, title: listing.title, org_name: listing.org_name })

  const { error } = await supabase
    .from('listings')
    .update({
      verified: true,
      claimed_at: new Date().toISOString(),
    })
    .eq('claim_token', token)

  if (error) return NextResponse.json({ error }, { status: 500 })

  return NextResponse.json({ success: true, title: listing.title, org_name: listing.org_name })
}
