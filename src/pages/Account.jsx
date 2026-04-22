import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const RADIO = ({ name, value, checked, onChange, label }) => (
  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:15,
    color: checked ? '#fff' : 'var(--text2)' }}>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange}
      style={{ accentColor:'var(--purple)', width:18, height:18 }} />
    {label}
  </label>
)

export default function Account({ profile, group, onLeave }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  // Profile fields
  const [displayName,   setDisplayName]   = useState('')
  const [postcode,      setPostcode]      = useState('')
  const [playsBasket,   setPlaysBasket]   = useState('')
  const [followsNBA,    setFollowsNBA]    = useState('')
  const [followsEuro,   setFollowsEuro]   = useState('')
  const [favTeam,       setFavTeam]       = useState('')

  // Password change
  const [newPwd,        setNewPwd]        = useState('')
  const [confirmPwd,    setConfirmPwd]    = useState('')
  const [showPwd,       setShowPwd]       = useState(false)

  const [groups,        setGroups]        = useState([])
  const [busy,          setBusy]          = useState(false)
  const [err,           setErr]           = useState('')
  const [success,       setSuccess]       = useState('')
  const [delConfirm,    setDelConfirm]    = useState(false)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name || '')
    setPostcode(profile.postcode || '')
    setPlaysBasket(profile.plays_basketball === true ? 'yes' : profile.plays_basketball === false ? 'no' : '')
    setFollowsNBA(profile.follows_nba === true ? 'yes' : profile.follows_nba === false ? 'no' : '')
    setFollowsEuro(profile.follows_euro === true ? 'yes' : profile.follows_euro === false ? 'no' : '')
    setFavTeam(profile.fav_team || '')
    loadGroups()
  }, [profile])

  async function loadGroups() {
    if (!profile) return
    const { data } = await supabase.from('group_members')
      .select('groups(id, name, invite_code)').eq('user_id', profile.id)
    setGroups(data?.map(d => d.groups).filter(Boolean) || [])
  }

  async function handleSave(e) {
    e.preventDefault()
    setErr(''); setSuccess(''); setBusy(true)
    try {
      // Update profile
      const { error: pErr } = await supabase.from('profiles').update({
        display_name: displayName.trim(),
        postcode: postcode.trim(),
        plays_basketball: playsBasket === 'yes',
        follows_nba: followsNBA === 'yes',
        follows_euro: followsEuro === 'yes',
        fav_team: favTeam.trim() || null,
      }).eq('id', profile.id)
      if (pErr) throw pErr

      // Update password if provided
      if (newPwd) {
        if (newPwd !== confirmPwd) throw new Error("Passwords don't match")
        if (newPwd.length < 6) throw new Error('Password must be at least 6 characters')
        const { error: pwErr } = await supabase.auth.updateUser({ password: newPwd })
        if (pwErr) throw pwErr
        setNewPwd(''); setConfirmPwd('')
      }

      setSuccess('✅ Account updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  async function handleDeleteAccount() {
    setBusy(true)
    try {
      // Delete predictions and memberships first
      await supabase.from('predictions').delete().eq('user_id', profile.id)
      await supabase.from('group_members').delete().eq('user_id', profile.id)
      await supabase.from('profiles').delete().eq('id', profile.id)
      await supabase.auth.signOut()
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  const email = supabase.auth.getUser ? (async () => {})() : ''

  return (
    <div className="page fade-up">
      <h2 className="condensed" style={{ fontSize:24, fontWeight:900, letterSpacing:2,
        textTransform:'uppercase', marginBottom:20 }}>
        My Account
      </h2>

      <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* Personal info */}
        <div className="card">
          <h3 className="condensed" style={{ fontSize:14, fontWeight:800, letterSpacing:2,
            color:'var(--purple)', textTransform:'uppercase', marginBottom:14 }}>
            Personal Info
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label className="label">Name</label>
              <input className="input" value={displayName}
                onChange={e => setDisplayName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="label">Postcode</label>
              <input className="input" value={postcode}
                onChange={e => setPostcode(e.target.value)} placeholder="e.g. 75011" maxLength={10} />
            </div>
            <div>
              <label className="label">Favorite team</label>
              <input className="input" value={favTeam}
                onChange={e => setFavTeam(e.target.value)} placeholder="e.g. Miami Heat" />
            </div>
          </div>
        </div>

        {/* Basketball profile */}
        <div className="card">
          <h3 className="condensed" style={{ fontSize:14, fontWeight:800, letterSpacing:2,
            color:'var(--purple)', textTransform:'uppercase', marginBottom:14 }}>
            Basketball Profile
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label className="label">Do/did you play basketball?</label>
              <div style={{ display:'flex', gap:16, marginTop:4 }}>
                <RADIO name="plays" value="yes" checked={playsBasket==='yes'} onChange={() => setPlaysBasket('yes')} label="Yes" />
                <RADIO name="plays" value="no"  checked={playsBasket==='no'}  onChange={() => setPlaysBasket('no')}  label="No" />
              </div>
            </div>
            <div>
              <label className="label">Do you follow the NBA?</label>
              <div style={{ display:'flex', gap:16, marginTop:4 }}>
                <RADIO name="nba" value="yes" checked={followsNBA==='yes'} onChange={() => setFollowsNBA('yes')} label="Yes" />
                <RADIO name="nba" value="no"  checked={followsNBA==='no'}  onChange={() => setFollowsNBA('no')}  label="No" />
              </div>
            </div>
            <div>
              <label className="label">Do you follow European basketball?</label>
              <div style={{ display:'flex', gap:16, marginTop:4 }}>
                <RADIO name="euro" value="yes" checked={followsEuro==='yes'} onChange={() => setFollowsEuro('yes')} label="Yes" />
                <RADIO name="euro" value="no"  checked={followsEuro==='no'}  onChange={() => setFollowsEuro('no')}  label="No" />
              </div>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="card">
          <h3 className="condensed" style={{ fontSize:14, fontWeight:800, letterSpacing:2,
            color:'var(--purple)', textTransform:'uppercase', marginBottom:14 }}>
            Change Password
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label className="label">New password</label>
              <div style={{ position:'relative' }}>
                <input className="input" type={showPwd ? 'text' : 'password'}
                  placeholder="Leave blank to keep current"
                  value={newPwd} onChange={e => setNewPwd(e.target.value)} minLength={6} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16 }}>
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {newPwd && (
              <div>
                <label className="label">Confirm new password</label>
                <input className="input" type="password" placeholder="••••••••"
                  value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              </div>
            )}
          </div>
        </div>

        {/* My groups */}
        <div className="card">
          <h3 className="condensed" style={{ fontSize:14, fontWeight:800, letterSpacing:2,
            color:'var(--purple)', textTransform:'uppercase', marginBottom:14 }}>
            My Groups
          </h3>
          {groups.length === 0 ? (
            <p style={{ color:'var(--text3)', fontSize:13 }}>No groups yet.</p>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {groups.map(g => (
                <div key={g.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:14, fontWeight:600 }}>{g.name}</span>
                  <span style={{ fontSize:11, color:'var(--purple)', fontFamily:'Barlow Condensed',
                    fontWeight:700, letterSpacing:1 }}>{g.invite_code}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Terms link */}
        <p style={{ textAlign:'center', fontSize:12, color:'var(--text3)' }}>
          By using Clutch you agree to our{' '}
          <a href="/group/terms" style={{ color:'var(--purple)' }}>Terms & Conditions</a>
        </p>

        {err     && <p style={{ color:'var(--red)',   fontSize:13 }}>❌ {err}</p>}
        {success && <p style={{ color:'var(--green)', fontSize:13 }}>{success}</p>}

        <button className="btn btn-purple btn-full" type="submit" disabled={busy}>
          {busy ? '…' : 'Save changes'}
        </button>

        {/* Sign out */}
        <button type="button" className="btn btn-ghost btn-full" onClick={signOut}>
          Sign out
        </button>

        {/* Delete account */}
        <div style={{ marginTop:8 }}>
          {!delConfirm ? (
            <button type="button" onClick={() => setDelConfirm(true)}
              style={{ background:'none', border:'none', color:'var(--text3)', fontSize:12,
                cursor:'pointer', textDecoration:'underline', width:'100%' }}>
              Delete my account
            </button>
          ) : (
            <div className="card" style={{ borderColor:'var(--red)', background:'rgba(229,57,53,0.06)' }}>
              <p style={{ fontSize:13, color:'var(--red)', marginBottom:12 }}>
                ⚠️ This will permanently delete your account and all your picks. Are you sure?
              </p>
              <div style={{ display:'flex', gap:8 }}>
                <button type="button" className="btn btn-ghost btn-full"
                  onClick={() => setDelConfirm(false)}>Cancel</button>
                <button type="button" disabled={busy}
                  onClick={handleDeleteAccount}
                  style={{ flex:1, padding:'12px', background:'var(--red)', border:'none',
                    borderRadius:'var(--r)', color:'#fff', fontFamily:'Barlow Condensed',
                    fontSize:14, fontWeight:700, letterSpacing:1.5, cursor:'pointer' }}>
                  {busy ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
