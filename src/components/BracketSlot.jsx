import { TEAM_BY_ABBR } from '../lib/constants'

export default function BracketSlot({ series, userPick, userGames, onClick, isEditable }) {
  const teamA  = series?.teamA
  const teamB  = series?.teamB
  const status = series?.status || 'upcoming'

  if (!teamA && !teamB) {
    return (
      <div style={S.slotEmpty}>
        <span style={{ fontSize:10, color:'var(--text3)' }}>Previous round incomplete</span>
      </div>
    )
  }

  function TeamRow({ team, wins, isWinner, isPicked }) {
    if (!team) return <div style={S.rowEmpty}>—</div>
    const correct = status === 'finished' && isPicked && isWinner
    const wrong   = status === 'finished' && isPicked && !isWinner
    return (
      <div style={{
        ...S.row,
        background: isPicked ? `${team.color}18` : 'transparent',
        borderLeft: isPicked ? `3px solid ${team.color}` : '3px solid transparent',
      }}>
        <span style={{ fontSize:15 }}>{team.emoji}</span>
        <span style={{ fontFamily:'Barlow Condensed', fontWeight:700, fontSize:13, textTransform:'uppercase', flex:1 }}>
          {team.abbr}
          <span style={{ fontWeight:400, color:'var(--text3)', fontSize:10, marginLeft:4 }}>({team.seed})</span>
        </span>
        {status !== 'upcoming' && (
          <span style={{ fontFamily:'Barlow Condensed', fontWeight:800, fontSize:13,
            color: isWinner ? 'var(--green)' : 'var(--text3)' }}>{wins}</span>
        )}
        {correct && <span style={{ fontSize:11, color:'var(--green)' }}>✓</span>}
        {wrong   && <span style={{ fontSize:11, color:'var(--red)'  }}>✗</span>}
      </div>
    )
  }

  const pickedA    = userPick === teamA?.abbr
  const pickedB    = userPick === teamB?.abbr
  const pickedTeam = pickedA ? teamA : pickedB ? teamB : null

  return (
    <div
      onClick={isEditable ? onClick : undefined}
      style={{
        ...S.slot,
        cursor: isEditable ? 'pointer' : 'default',
        borderColor: status === 'active' ? 'rgba(145,112,255,0.35)' : 'var(--border)',
      }}
    >
      {/* Status */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
        <span style={{
          fontSize:9, fontFamily:'Barlow Condensed', fontWeight:700, letterSpacing:1.5, textTransform:'uppercase',
          color: status==='active' ? '#ff6b6b' : status==='finished' ? 'var(--green)' : 'var(--text3)',
        }}>
          {status==='active' ? '🔴NOW' : status==='finished' ? '✅ Done' : '⏳ Upcoming'}
        </span>
        {isEditable && status !== 'finished' && (
          <span style={{ fontSize:9, color:'var(--purple)', fontFamily:'Barlow Condensed', fontWeight:700, letterSpacing:1 }}>
            EDIT
          </span>
        )}
      </div>

      <TeamRow team={teamA} wins={series.winsA} isWinner={series.winner===teamA?.abbr} isPicked={pickedA} />
      <div style={{ borderTop:'1px solid var(--border)', margin:'3px 0' }} />
      <TeamRow team={teamB} wins={series.winsB} isWinner={series.winner===teamB?.abbr} isPicked={pickedB} />

      {/* My pick */}
      {pickedTeam ? (
        <div style={{
          marginTop:6, paddingTop:5, borderTop:'1px solid var(--border)',
          fontSize:10, fontFamily:'inter', fontWeight:700,
          letterSpacing:0,
          color: status === 'finished'
            ? (series.winner === pickedTeam.abbr ? 'var(--green)' : 'var(--red)')
            : 'var(--text3)',
        }}>
          MY PICK: {pickedTeam.abbr}{userGames ? ` IN ${userGames}` : ''}
        </div>
      ) : isEditable ? (
        <div style={{ marginTop:6, fontSize:10, color:'var(--text)', textAlign:'center' }}>
          👆 Pick a winner
        </div>
      ) : null}
    </div>
  )
}

const S = {
  slot: {
    background:'var(--bg2)', border:'1px solid var(--border)',
    borderRadius:8, padding:'8px 10px',
    minWidth:160, width:'100%', transition:'border-color 0.2s',
  },
  slotEmpty: {
    background:'var(--bg2)', border:'1px solid var(--border)',
    borderRadius:8, padding:'20px 10px', minWidth:160,
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  row:      { display:'flex', alignItems:'center', gap:5, padding:'4px 5px', borderRadius:4, transition:'background 0.15s' },
  rowEmpty: { padding:'4px 5px', color:'var(--text3)', fontSize:12 },
}
