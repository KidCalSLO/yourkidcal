import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { isAuthorized } from '../../../../lib/adminAuth'

export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data, error } = await supabaseAdmin
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ listings: data })
}

export async function PATCH(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, status, featured } = await req.json()
  const { data: listing } = await supabaseAdmin
    .from('listings')
    .select('title, org_name, slug')
    .eq('id', id)
    .single()

  const updates = {}
  if (status !== undefined) updates.status = status
  if (featured !== undefined) updates.featured = featured

  if (!listing?.slug && listing?.title && listing?.org_name) {
    updates.slug = (listing.title + '-' + listing.org_name)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100)
  }

  const { error } = await supabaseAdmin
    .from('listings')
    .update(updates)
    .eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await req.json()
  const { error } = await supabaseAdmin
    .from('listings')
    .delete()
    .eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
