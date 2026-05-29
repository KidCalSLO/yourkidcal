import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  const { listing_id, org_contact_name, org_contact_title, email } = await req.json()

  console.log('CLAIM REQUEST:', { listing_id, org_contact_name, email })

  if (!listing_id || !email || !org_contact_name) {
    console.log('CLAIM ERROR: Missing fields')
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: listing, error: selectError } = await supabase
    .from('listings')
    .select('title, org_name, verified')
    .eq('id', listing_id)
    .single()

  console.log('LISTING FOUND:', listing, 'SELECT ERROR:', selectError)

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.verified) return NextResponse.json({ error: 'Already verified' }, { status: 400 })

  const token = randomUUID()
  console.log('TOKEN GENERATED:', token)

  const { error: updateError } = await supabase
    .from('listings')
    .update({
      claim_token: token,
      verified_email: email,
      verified_org_name: org_contact_name,
    })
    .eq('id', listing_id)

  console.log('UPDATE ERROR:', updateError)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  console.log('TOKEN SAVED SUCCESSFULLY')

  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/verify/${token}`
  console.log('VERIFY URL:', verifyUrl)

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'YourKidCal <hello@yourkidcal.com>',
      to: email,
      subject: `Verify your listing on YourKidCal — ${listing.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#F7F3EC;font-family:'Helvetica Neue',Arial,sans-serif">
          <div style="max-width:560px;margin:0 auto;padding:32px 16px">
            <div style="text-align:center;margin-bottom:24px">
              <span style="font-size:28px">🌞</span>
              <span style="font-size:22px;font-weight:700;color:#2C2C2A;font-family:Georgia,serif;margin-left:8px">Your<span style="color:#E8A020">KidCal</span></span>
            </div>
            <div style="background:#fff;border-radius:12px;padding:32px;border:1.5px solid #e0ddd5">
              <h1 style="font-size:22px;font-family:Georgia,serif;color:#2C2C2A;margin:0 0 12px">Hi ${org_contact_name}!</h1>
              <p style="font-size:15px;color:#888780;line-height:1.6;margin:0 0 8px">Thanks for claiming your listing on YourKidCal.</p>
              <p style="font-size:15px;color:#888780;line-height:1.6;margin:0 0 24px">Click the button below to verify that you represent <strong style="color:#2C2C2A">${listing.org_name}</strong> and confirm your listing: <strong style="color:#2C2C2A">${listing.title}</strong></p>
              <div style="text-align:center;margin-bottom:24px">
                <a href="${verifyUrl}" style="background:#E8A020;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;display:inline-block">
                  ✓ Verify My Listing
                </a>
              </div>
              <p style="font-size:13px;color:#888780;text-align:center;margin:0">This link expires in 7 days. If you didn't request this, you can ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
  })

  console.log('EMAIL RESPONSE STATUS:', emailRes.status)

  return NextResponse.json({ success: true })
}
