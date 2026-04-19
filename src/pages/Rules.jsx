import { PLAYOFF_DEADLINE } from '../lib/constants'

const deadline = PLAYOFF_DEADLINE.toLocaleDateString('en-US', {
  day:'numeric', month:'long', hour:'2-digit', minute:'2-digit',
})

export default function Rules() {
  return (
    <div className="page fade-up">
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <h2 className="condensed" style={{ fontSize:28, fontWeight:900, letterSpacing:3, textTransform:'uppercase' }}>
          📋 Rules
        </h2>
        <p style={{ color:'var(--text3)', fontSize:12, marginTop:4 }}>Clutch — NBA Playoffs 2026</p>
      </div>

      <Section emoji="🗓️" title="Initial Picks" subtitle={`Before ${deadline}`}>
        <p>Before the playoffs tip off, fill in <strong>the entire bracket</strong>: the series winner and number of games, from Round 1 to the NBA Finals.</p>
        <ScoreRow label="Correct series winner"       pts="5 pts" />
        <ScoreRow label="Correct number of games"     pts="+10 pts" sub="5 + 10 = 15 pts max per series" />
        <ScoreRow label="Conference Finalist"         pts="10 pts" sub="per finalist" />
        <ScoreRow label="NBA Finalist (losing team)"  pts="20 pts" />
        <ScoreRow label="NBA Champion 🏆"             pts="50 pts" />
      </Section>

      <Section emoji="🔄" title="Series Picks" subtitle="Before Game 1 of each series (Round 2+)">
        <p>When a series is about to start (from Round 2), you can <strong>update your pick</strong> for that matchup. Points stack with your initial picks.</p>
        <ScoreRow label="Correct series winner"   pts="3 pts" />
        <ScoreRow label="Correct number of games" pts="+6 pts" sub="3 + 6 = 9 pts max per series" />
        <p style={{ color:'var(--text3)', fontSize:12, marginTop:8 }}>
          💡 This lets you correct a wrong initial pick — but earns fewer points.
        </p>
      </Section>

      <Section emoji="📊" title="Points Stack">
        <p>Initial picks and series picks <strong>stack together</strong>. Pick the right winner upfront (5 pts) and confirm it at series start (3 pts) = <strong>8 pts</strong> for that winner.</p>
      </Section>

      <Section emoji="⏰" title="Key Deadlines">
        <ScoreRow label="Initial picks deadline" pts={deadline} />
        <ScoreRow label="Series picks"           pts="Before Game 1 (Round 2+)" />
        <p style={{ color:'var(--text3)', fontSize:12, marginTop:8 }}>
          Once a deadline passes, those picks are locked.
        </p>
      </Section>

      <div className="card" style={{ background:'var(--purple-bg)', borderColor:'rgba(145,112,255,0.25)', textAlign:'center' }}>
        <div style={{ fontSize:11, color:'var(--purple)', fontFamily:'Barlow Condensed', letterSpacing:2, marginBottom:6 }}>
          THEORETICAL MAXIMUM SCORE
        </div>
        <div className="condensed" style={{ fontSize:48, fontWeight:900, color:'var(--purple)' }}>
          {(15 * 15) + (9 * 15) + (10 * 2) + 20 + 50}
        </div>
        <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>points (nearly impossible 😅)</div>
      </div>
    </div>
  )
}

function Section({ emoji, title, subtitle, children }) {
  return (
    <div className="card" style={{ marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
        <span style={{ fontSize:20 }}>{emoji}</span>
        <div>
          <div className="condensed" style={{ fontWeight:800, fontSize:17, letterSpacing:1 }}>{title}</div>
          {subtitle && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:13, color:'var(--text2)', lineHeight:1.5 }}>
        {children}
      </div>
    </div>
  )
}

function ScoreRow({ label, pts, sub }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ color:'var(--text2)', fontSize:13 }}>{label}</span>
      <div style={{ textAlign:'right' }}>
        <span className="condensed" style={{ fontWeight:800, fontSize:15, color:'var(--purple)' }}>{pts}</span>
        {sub && <div style={{ fontSize:10, color:'var(--text3)' }}>{sub}</div>}
      </div>
    </div>
  )
}
