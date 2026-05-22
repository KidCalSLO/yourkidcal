export const metadata = {
  title: 'YourKidCal — SLO County Kids Programs & Deadlines',
  description: 'Every registration deadline for camps, schools, sports, daycares and rec programs in San Luis Obispo County, in one place.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </head>
      <body style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", background: '#F7F3EC' }}>
        {children}
      </body>
    </html>
  )
}
