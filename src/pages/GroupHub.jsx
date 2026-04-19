import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function GroupHub({ profile, onSelectGroup }) {
  const { signOut } = useAuth()
  const [groups,  setGroups]  = useState([])
  const [tab,     setTab]     = useState('join')
  const [gName,   setGName]   = useState('')
  const [code,    setCode]    = useState('')
  const [busy,    setBusy]    = useState(false)
  const [err,     setErr]     = useState('')
  const [copied,  setCopied]  = useState(null)

  useEffect(() => { if (profile) loadGroups() }, [profile])

  async function loadGroups() {
    const { data } = await supabase
      .from('group_members').select('groups(*)').eq('user_id', profile.id)
    setGroups(data?.map(d => d.groups).filter(Boolean) || [])
  }

  async function createGroup(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const { data: g, error } = await supabase
        .from('groups').insert({ name: gName.trim(), created_by: profile.id }).select().single()
      if (error) throw error
      await supabase.from('group_members').insert({ group_id: g.id, user_id: profile.id })
      setGName(''); await loadGroups(); setTab('mine')
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  async function joinGroup(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const { data: g, error } = await supabase
        .from('groups').select('*').eq('invite_code', code.trim().toUpperCase()).single()
      if (error || !g) throw new Error('Invalid code — check the code shared by your friend.')
      await supabase.from('group_members')
        .upsert({ group_id: g.id, user_id: profile.id }, { onConflict: 'group_id,user_id' })
      setCode(''); await loadGroups()
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  async function copyInvite(group) {
    const link = `${window.location.origin}/join/${group.invite_code}`
    await navigator.clipboard.writeText(`🏀 Join my Clutch group "${group.name}"!\n${link}`)
    setCopied(group.id); setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="page fade-up" style={{ paddingTop:40 }}>
      {/* Logo */}
      <div className="text-center" style={{ marginBottom:32 }}>
        <img src="/clutch_logo.png" alt="Clutch" style={{ height:80, marginBottom:8 }} />
        <p style={{ color:'var(--text3)', fontSize:12, marginTop:4 }}>
          Hey {profile?.display_name} 👋
        </p>
      </div>

      {/* My groups */}
      {groups.length > 0 && (
        <div style={{ marginBottom:28 }}>
          <p className="label" style={{ marginBottom:10 }}>My Groups</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {groups.map(g => (
              <div key={g.id} className="card" style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="condensed" style={{ fontWeight:700, fontSize:17, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {g.name}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2, letterSpacing:1 }}>
                    Code: <span style={{ color:'var(--purple)', fontWeight:700 }}>{g.invite_code}</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => copyInvite(g)}>
                  {copied===g.id ? '✅' : '📲'}
                </button>
                <button className="btn btn-purple btn-sm" onClick={() => onSelectGroup(g)}>
                  Enter →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', background:'var(--bg2)', borderRadius:'var(--r)', border:'1px solid var(--border)', overflow:'hidden', marginBottom:16 }}>
        {[['join','🔗 Join'],['create','✨ Create']].map(([k,label]) => (
          <button key={k} onClick={() => { setTab(k); setErr('') }}
            style={{ flex:1, padding:12, background: tab===k ? 'var(--purple-bg)' : 'transparent',
              border:'none', borderBottom: tab===k ? '2px solid var(--purple)' : '2px solid transparent',
              color: tab===k ? 'var(--purple)' : 'var(--text3)',
              fontFamily:'Barlow Condensed', fontSize:13, fontWeight:700,
              letterSpacing:2, textTransform:'uppercase', cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      <div className="card fade-up">
        {tab === 'join' ? (
          <form onSubmit={joinGroup} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <p style={{ fontSize:13, color:'var(--text2)' }}>Enter the invite code or open the invite link directly.</p>
            <input className="input" placeholder="e.g. AB12CD34"
              value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              style={{ textTransform:'uppercase', letterSpacing:4, fontSize:20, textAlign:'center', fontFamily:'Barlow Condensed', fontWeight:700 }} />
            {err && <p style={{ color:'var(--red)', fontSize:13 }}>❌ {err}</p>}
            <button className="btn btn-purple btn-full" type="submit" disabled={busy || !code.trim()}>
              {busy ? '…' : 'Join group'}
            </button>
          </form>
        ) : (
          <form onSubmit={createGroup} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <p style={{ fontSize:13, color:'var(--text2)' }}>Create a group and share the invite link with your friends.</p>
            <input className="input" placeholder="Group name (e.g. French Touch 🏀)"
              value={gName} onChange={e => setGName(e.target.value)} />
            {err && <p style={{ color:'var(--red)', fontSize:13 }}>❌ {err}</p>}
            <button className="btn btn-purple btn-full" type="submit" disabled={busy || !gName.trim()}>
              {busy ? '…' : 'Create group'}
            </button>
          </form>
        )}
      </div>

      <div className="text-center" style={{ marginTop:32 }}>
        <button onClick={signOut} style={{ background:'none', border:'none', color:'var(--text3)', fontSize:12, cursor:'pointer', letterSpacing:1 }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
