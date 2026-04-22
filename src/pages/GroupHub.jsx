import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const CLUTCH_LEAGUE_NAME = 'Clutch League'
const INSTAGRAM_URL = 'https://www.instagram.com/clutchgame.app/'

function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaaaaa"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="#aaaaaa" stroke="none"/>
    </svg>
  )
}

export default function GroupHub({ profile, onSelectGroup }) {
  const { signOut } = useAuth()
  const [groups,       setGroups]       = useState([])
  const [clutchLeague, setClutchLeague] = useState(null)
  const [tab,          setTab]          = useState('join')
  const [gName,        setGName]        = useState('')
  const [code,         setCode]         = useState('')
  const [busy,         setBusy]         = useState(false)
  const [err,          setErr]          = useState('')
  const [copied,       setCopied]       = useState(null)

  useEffect(() => { if (profile) { loadGroups(); ensureClutchLeague() } }, [profile])

  async function ensureClutchLeague() {
    // Find or create the Clutch League
    let { data: league } = await supabase
      .from('groups').select('*').eq('name', CLUTCH_LEAGUE_NAME).single()

    if (!league) {
      const { data: newLeague } = await supabase
        .from('groups').insert({ name: CLUTCH_LEAGUE_NAME, created_by: profile.id }).select().single()
      league = newLeague
    }

    if (!league) return
    setClutchLeague(league)

    // Auto-join if not already member
    await supabase.from('group_members')
      .upsert({ group_id: league.id, user_id: profile.id }, { onConflict: 'group_id,user_id' })
  }

  async function loadGroups() {
    const { data } = await supabase
      .from('group_members').select('groups(*)').eq('user_id', profile.id)
    const all = data?.map(d => d.groups).filter(Boolean) || []
    // Exclude Clutch League from regular groups list
    setGroups(all.filter(g => g.name !== CLUTCH_LEAGUE_NAME))
  }

  async function createGroup(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      if (gName.trim() === CLUTCH_LEAGUE_NAME) throw new Error('This name is reserved.')
      const { data: g, error } = await supabase
        .from('groups').insert({ name: gName.trim(), created_by: profile.id }).select().single()
      if (error) throw error
      await supabase.from('group_members').insert({ group_id: g.id, user_id: profile.id })
      setGName(''); await loadGroups(); setTab('join')
    } catch (e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  async function joinGroup(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const { data: g, error } = await supabase
        .from('groups').select('*').eq('invite_code', code.trim().toUpperCase()).single()
      if (error || !g) throw new Error('Invalid code — check the code shared by your friend.')
      if (g.name === CLUTCH_LEAGUE_NAME) throw new Error('You are already in Clutch League!')
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
        <img src="/clutch_logo.png" alt="Clutch" style={{ height:112, marginBottom:8 }} />
        <p style={{ color:'var(--text3)', fontSize:13, marginTop:4 }}>
          Hey {profile?.display_name} 👋
        </p>
      </div>

      {/* Clutch League */}
      {clutchLeague && (
        <div style={{ marginBottom:24 }}>
          <p className="label" style={{ marginBottom:10 }}>🏆 Clutch League</p>
          <div className="card" style={{
            display:'flex', alignItems:'center', gap:12,
            borderColor:'rgba(145,112,255,0.35)',
            background:'rgba(145,112,255,0.06)',
          }}>
            <div style={{ flex:1 }}>
              <div className="condensed" style={{ fontWeight:800, fontSize:18, color:'var(--purple)' }}>
                Clutch League
              </div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>
                The main league — all players included
              </div>
            </div>
            <button className="btn btn-purple btn-sm" onClick={() => onSelectGroup(clutchLeague)}>
              Enter →
            </button>
          </div>
        </div>
      )}

      {/* My groups */}
      {groups.length > 0 && (
        <div style={{ marginBottom:24 }}>
          <p className="label" style={{ marginBottom:10 }}>My Groups</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {groups.map(g => (
              <div key={g.id} className="card" style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="condensed" style={{ fontWeight:700, fontSize:17,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.name}</div>
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
      <div style={{ display:'flex', background:'var(--bg2)', borderRadius:'var(--r)',
        border:'1px solid var(--border)', overflow:'hidden', marginBottom:16 }}>
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
              style={{ textTransform:'uppercase', letterSpacing:4, fontSize:20,
                textAlign:'center', fontFamily:'Barlow Condensed', fontWeight:700 }} />
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

      {/* Footer */}
      <div style={{ marginTop:40, display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
        {/* Instagram */}
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
          style={{ display:'flex', alignItems:'center', gap:8, color:'#aaaaaa',
            fontSize:12, textDecoration:'none', letterSpacing:1 }}
          onMouseEnter={e => e.currentTarget.style.color='#fff'}
          onMouseLeave={e => e.currentTarget.style.color='#aaaaaa'}>
          <InstagramIcon />
          @clutchgame.app
        </a>

        {/* Sign out */}
        <button onClick={signOut}
          style={{ background:'none', border:'none', color:'var(--text3)',
            fontSize:12, cursor:'pointer', letterSpacing:1 }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
