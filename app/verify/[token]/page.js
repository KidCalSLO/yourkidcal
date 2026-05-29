import Link from 'next/link'

export default async function VerifyPage({ params }) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/verify?token=${params.token}`,
    { cache: 'no-store' }
  )
  const data = await res.json()

  const success = data.success || data.already
  const title = data.title || 'your listing'
  const orgName = data.org_name || ''

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; background: #F7F3EC; }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet" />

      <nav style={{background:'#fff',borderBottom:'1.5px solid #e0ddd5',padding:'0 2rem',height:60,display:'flex',alignItems:'center'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <div style={{width:32,height:32,background:'#E8A020',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🌞</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:'#2C2C2A'}}>Your<span style={{color:'#E8A020'}}>KidCal</span></span>
        </Link>
      </nav>

      <div style={{maxWidth:520,margin:'4rem auto',padding:'0 1.5rem',textAlign:'center'}}>
        <div style={{background:'#fff',border:'1.5px solid #e0ddd5',borderRadius:16,padding:'2.5rem 2rem'}}>
          {success ? (
            <>
              <div style={{fontSize:56,marginBottom:16}}>✅</div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:'#2C2C2A',margin:'0 0 12px'}}>
                {data.already ? 'Already verified!' : 'Listing verified!'}
              </h1>
              <p style={{fontSize:15,color:'#888780',lineHeight:1.6,margin:'0 0 8px'}}>
                <strong style={{color:'#2C2C2A'}}>{title}</strong> by {orgName} now shows a verified badge on YourKidCal.
              </p>
              <p style={{fontSize:14,color:'#888780',lineHeight:1.6,margin:'0 0 24px'}}>
                Parents across SLO County will see that your listing is confirmed by your organization.
              </p>
              <Link href="/" style={{background:'#E8A020',color:'#fff',padding:'12px 28px',borderRadius:8,textDecoration:'none',fontSize:15,fontWeight:600,display:'inline-block'}}>
                View on YourKidCal →
              </Link>
            </>
          ) : (
            <>
              <div style={{fontSize:56,marginBottom:16}}>❌</div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:'#2C2C2A',margin:'0 0 12px'}}>
                Invalid or expired link
              </h1>
              <p style={{fontSize:15,color:'#888780',lineHeight:1.6,margin:'0 0 24px'}}>
                This verification link is invalid or has already been used. Visit your program page on YourKidCal and click Claim this listing again.
              </p>
              <Link href="/" style={{background:'#E8A020',color:'#fff',padding:'12px 28px',borderRadius:8,textDecoration:'none',fontSize:15,fontWeight:600,display:'inline-block'}}>
                Back to YourKidCal →
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}
