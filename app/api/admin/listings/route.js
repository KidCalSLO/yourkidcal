import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ listings: data })
}

export async function PATCH(req) {
  const { id, status } = await req.json()
  const { data: listing } = await supabase
    .from('listings')
    .select('title, org_name, slug')
    .eq('id', id)
    .single()

  const updates = { status }

  if (!listing?.slug && listing?.title && listing?.org_name) {
    updates.slug = (listing.title + '-' + listing.org_name)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100)
  }

  const { error } = await supabase
    .from('listings')
    .update(updates)
    .eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req) {
  const { id } = await req.json()
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
