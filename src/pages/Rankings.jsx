import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { buildSeriesMap } from '../lib/nbaApi'
import { calcTotalPts } from '../lib/scoring'

export default function Rankings({ group, profile }) {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { seriesMap } = await buildSeriesMap()
      const { data: members } = await supabase
        .from('group_members').select('user_id, profiles(display_name)').eq('group_id', group.id)
      const { data: allPreds } = await supabase
        .from('predictions').select('*').eq('group_id', group.id)

      const ranked = (members || []).map(m => {
        const uid   = m.user_id
        const name  = m.profiles?.display_name || 'Unknown'
        const preds = allPreds?.filter(p => p.user_id === uid) || []
        const { total } = calcTotalPts(preds, seriesMap)
        const correct = preds.filter(p => {
          const s = seriesMap[p.series_key]
          return s?.winner && p.predicted_winner === s.winner
        }).length
        return { uid, name, total, correct, isMe: uid === profile.id }
      })

      ranked.sort((a, b) => b.total - a.total)
      setRows(ranked)
    } finally { setLoading(false) }
  }, [group.id, profile.id])

  useEffect(() => { load() }, [load])

  const medals = ['🥇', '🥈', '🥉']

  if (loading) return <div className="page text-center" style={{ paddingTop:60 }}>📊 Calculating scores…</div>

  return (
    <div className="page fade-up">
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <h2 className="condensed" style={{ fontSize:28, fontWeight:900, letterSpacing:3, textTransform:'uppercase' }}>🏆 Rankings</h2>
        <p style={{ color:'var(--text3)', fontSize:12, marginTop:4 }}>{group.name}</p>
      </div>

      {rows.length === 0 ? (
        <div className="card text-center" style={{ padding:32, color:'var(--text3)' }}>No participants yet.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {rows.map((row, i) => (
            <div key={row.uid} className="card" style={{
              display:'flex', alignItems:'center', gap:12,
              background: row.isMe ? 'rgba(245,184,65,0.06)' : 'var(--bg2)',
              borderColor: row.isMe ? 'rgba(245,184,65,0.3)' : 'var(--border)',
              padding:'14px 16px',
            }}>
              <div style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'inter', fontWeight:900, fontSize: i<3 ? 22 : 16,
                color: i<3 ? 'var(--purple)' : 'var(--text3)', flexShrink:0 }}>
                {i<3 ? medals[i] : `#${i+1}`}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'inter', fontWeight:700, fontSize:17,
                  color: row.isMe ? 'var(--purple)' : 'var(--text)',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {row.name} {row.isMe && <span style={{ fontSize:11, color:'var(--text3)', fontWeight:400 }}>(me)</span>}
                </div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{row.correct} correct series</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div className="condensed" style={{ fontSize:28, fontWeight:900, color: i===0 || row.isMe ? 'var(--purple)' : 'var(--text)' }}>
                  {row.total}
                </div>
                <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:1, fontFamily:'inter' }}>PTS</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop:24 }}>
        <InviteShare group={group} />
      </div>
    </div>
  )
}

function InviteShare({ group }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    const link = `${window.location.origin}/join/${group.invite_code}`
    await navigator.clipboard.writeText(`🏀 Join my Hoops Cup group "${group.name}"!\n${link}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="card" style={{ textAlign:'center' }}>
      <p style={{ fontSize:13, color:'var(--text2)', marginBottom:12 }}>Invite more people to this group</p>
      <button className="btn btn-ghost btn-full" onClick={copy}>
        {copied ? '✅ Link copied!' : '📲 Copy invite link'}
      </button>
      <p style={{ fontSize:11, color:'var(--text3)', marginTop:8, letterSpacing:1 }}>
        Code: <strong style={{ color:'var(--purple)' }}>{group.invite_code}</strong>
      </p>
    </div>
  )
}
