import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  const body = await req.json()
  const { error } = await supabase.from('listings').insert([{
    title:            body.title,
    org_name:         body.org_name,
    category:         body.category,
    ages:             body.ages,
    location:         body.location,
    description:      body.description,
    cost:             body.cost_free ? 0 : parseInt(body.cost) || 0,
    cost_free:        body.cost_free || false,
    deadline:         body.deadline,
    start_date:       body.start_date || null,
    registration_url: body.registration_url || null,
    status:           'pending',
    source:           'org_submission',
  }])
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
