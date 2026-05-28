import { NextResponse } from 'next/server'

export async function POST(req) {
  const { email, name, categories, locations } = await req.json()

  const firstName = name ? name.split(' ')[0] : 'there'
  const catList = categories?.length ? categories.join(', ') : 'All programs'
  const locList = locations?.length ? locations.join(', ') : 'All of SLO County'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'YourKidCal <hello@yourkidcal.com>',
      to: email,
      subject: `🌞 You're on the list — YourKidCal SLO`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#F7F3EC;font-family:'Helvetica Neue',Arial,sans-serif">
          <div style="max-width:600px;margin:0 auto;padding:24px 16px">
            <div style="text-align:center;margin-bottom:24px">
              <span style="font-size:28px">🌞</span>
              <span style="font-size:22px;font-weight:700;color:#2C2C2A;font-family:Georgia,serif;margin-left:8px">Your<span style="color:#E8A020">KidCal</span></span>
            </div>
            <div style="background:#fff;border-radius:12px;padding:32px;border:1.5px solid #e0ddd5;text-align:center;margin-bottom:16px">
              <div style="font-size:48px;margin-bottom:16px">🔔</div>
              <h1 style="font-size:24px;font-family:Georgia,serif;color:#2C2C2A;margin:0 0 12px">You're all set, ${firstName}!</h1>
              <p style="font-size:15px;color:#888780;line-height:1.7;margin:0 0 24px">We'll send you deadline reminders for kids programs across SLO County — so you never miss a registration window again.</p>
              <div style="background:#F7F3EC;border-radius:8px;padding:16px;text-align:left;margin-bottom:24px">
                <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#888780;margin-bottom:8px">Your preferences</div>
                <div style="font-size:14px;color:#2C2C2A;margin-bottom:4px">📋 <strong>Categories:</strong> ${catList}</div>
                <div style="font-size:14px;color:#2C2C2A">📍 <strong>Areas:</strong> ${locList}</div>
              </div>
              <a href="https://yourkidcal.com" style="background:#E8A020;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block">Browse Programs →</a>
            </div>
            <div style="text-align:center;padding:16px 0;font-size:12px;color:#888780">
              <p style="margin:0">Reply to this email to unsubscribe or update your preferences.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })
  })

  if (!res.ok) return NextResponse.json({ error: 'Email failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
