import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [pwd,     setPwd]     = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [busy,    setBusy]    = useState(false)
  const [err,     setErr]     = useState('')
  const [done,    setDone]    = useState(false)

  // Supabase injects the session from the magic link automatically
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event) => {
      // PASSWORD_RECOVERY event fires when user clicks reset link
    })
  }, [])

  async function handleReset(e) {
    e.preventDefault()
    setErr('')
    if (pwd !== confirm) { setErr("Passwords don't match"); return }
    if (pwd.length < 6)  { setErr('Password must be at least 6 characters'); return }
    setBusy(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd })
      if (error) throw error
      setDone(true)
      // Redirect to home after 2s
      setTimeout(() => window.location.href = '/', 2000)
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        <div className="text-center" style={{ marginBottom:32 }}>
          <img src="/clutch_logo.png" alt="Clutch" style={{ height:80, marginBottom:12 }} />
        </div>

        <div className="card fade-up">
          <h2 className="condensed" style={{ fontSize:20, fontWeight:800, letterSpacing:2, marginBottom:20 }}>
            🔐 New Password
          </h2>

          {done ? (
            <div style={{ textAlign:'center', color:'var(--green)', fontSize:14 }}>
              ✅ Password updated! Redirecting…
            </div>
          ) : (
            <form onSubmit={handleReset} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label className="label">New password</label>
                <div style={{ position:'relative' }}>
                  <input className="input" type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••" value={pwd}
                    onChange={e => setPwd(e.target.value)} required minLength={6} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                      background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16 }}>
                    {showPwd ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input className="input" type="password" placeholder="••••••••"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
              {err && <p style={{ color:'var(--red)', fontSize:13 }}>❌ {err}</p>}
              <button className="btn btn-purple btn-full" type="submit" disabled={busy || !pwd || !confirm}>
                {busy ? '…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
