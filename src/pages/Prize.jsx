export default function Prize() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <img 
        src="https://gofvndsrcfnidnwiwqer.supabase.co/storage/v1/object/public/Assets/clutch-annonce-places-gratuites-V2.jpg"
        alt="Win free tickets — Clutch"
        style={{
          maxWidth: '100%',
          width: 600,
          height: 'auto',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(145, 112, 255, 0.15)',
        }}
      />
      
      <a 
        href="/"
        style={{
          marginTop: 24,
          color: '#9170ff',
          fontFamily: 'Inter',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: 'uppercase',
          textDecoration: 'none',
        }}
      >
        ← Back
      </a>
    </div>
  )
}