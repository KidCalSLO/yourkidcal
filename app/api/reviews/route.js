import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ reviews: data })
}

export async function POST(req) {
  const body = await req.json()
  const { listing_id, listing_title, org_name, reviewer_name, rating, review_body } = body
  if (!listing_id || !reviewer_name || !rating || !review_body) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const { error } = await supabase.from('reviews').insert([{
    listing_id,
    listing_title,
    org_name,
    reviewer_name,
    rating: parseInt(rating),
    body: review_body,
    status: 'pending',
  }])
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
