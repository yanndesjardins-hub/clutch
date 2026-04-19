import { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

export default function PredictionModal({ series, currentPick, onSave, onClose }) {
  const { teamA, teamB, status } = series
  const [winner, setWinner] = useState(currentPick?.predicted_winner || null)
  const [games,  setGames]  = useState(currentPick?.predicted_games  || null)
  const [busy,   setBusy]   = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleSave() {
    if (!winner || !games) return
    setBusy(true)
    await onSave({ predicted_winner: winner, predicted_games: games })
    setBusy(false)
  }

  return ReactDOM.createPortal(
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:'fixed', top:0, left:0, right:0, bottom:0,
        background:'rgba(0,0,0,0.88)', backdropFilter:'blur(6px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        zIndex:9999, padding:'20px',
      }}
    >
      <div className="fade-up" style={{
        background:'var(--bg2)', borderRadius:16, border:'1px solid var(--border)',
        padding:20, width:'100%', maxWidth:440,
        maxHeight:'80vh', overflowY:'auto',
      }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 className="condensed" style={{ fontSize:20, fontWeight:800, letterSpacing:2 }}>🏀 YOUR PICK</h3>
          <button onClick={onClose}
            style={{ background:'none', border:'none', color:'var(--text3)', fontSize:24, cursor:'pointer', lineHeight:1, padding:0 }}>
            ✕
          </button>
        </div>

        {/* Series Winner */}
        <p className="label">Series Winner</p>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
          {[teamA, teamB].filter(Boolean).map(team => (
            <button key={team.abbr} onClick={() => setWinner(team.abbr)} style={{
              display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
              background: winner===team.abbr ? `${team.color}22` : 'var(--bg3)',
              border: `2px solid ${winner===team.abbr ? team.color : 'var(--border)'}`,
              borderRadius:'var(--r)', cursor:'pointer', transition:'all 0.15s', textAlign:'left',
            }}>
              <span style={{ fontSize:24 }}>{team.emoji}</span>
              <div style={{ flex:1 }}>
                <div className="condensed" style={{ fontWeight:800, fontSize:16, textTransform:'uppercase',
                  color: winner===team.abbr ? '#fff' : 'var(--text2)' }}>{team.name}</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Seed #{team.seed}</div>
              </div>
              {winner===team.abbr && <span style={{ color:team.color, fontSize:20 }}>✓</span>}
            </button>
          ))}
        </div>

        {/* Number of games */}
        <p className="label">Number of Games</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
          {[4,5,6,7].map(n => (
            <button key={n} onClick={() => setGames(n)} style={{
              padding:'14px 0',
              background: games===n ? 'var(--purple)' : 'var(--bg3)',
              border: games===n ? 'none' : '1px solid var(--border)',
              borderRadius:'var(--r)', color: games===n ? '#fff' : 'var(--text2)',
              fontFamily:'Barlow Condensed', fontWeight:800, fontSize:18,
              cursor:'pointer', transition:'all 0.15s',
            }}>
              {n}
              <div style={{ fontSize:9, fontWeight:600, letterSpacing:1, opacity:0.7 }}>games</div>
            </button>
          ))}
        </div>

        <button className="btn btn-purple btn-full" onClick={handleSave} disabled={busy || !winner || !games}>
          {busy ? '…' : 'Confirm my pick ✓'}
        </button>
      </div>
    </div>,
    document.body
  )
}
