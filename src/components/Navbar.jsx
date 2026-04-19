import { useNavigate, useLocation } from 'react-router-dom'

// SVG icons — color-aware
function TrophyIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  )
}

function CalendarIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  )
}

function BarChartIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" x2="18" y1="20" y2="10"/>
      <line x1="12" x2="12" y1="20" y2="4"/>
      <line x1="6"  x2="6"  y1="20" y2="14"/>
    </svg>
  )
}

function BookIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )
}

const TABS = [
  { path: '/group/bracket',  Icon: TrophyIcon,   label: 'Bracket'  },
  { path: '/group/series',   Icon: CalendarIcon, label: 'Series'   },
  { path: '/group/rankings', Icon: BarChartIcon, label: 'Rankings' },
  { path: '/group/rules',    Icon: BookIcon,     label: 'Rules'    },
]

const PURPLE = '#9170ff'
const GRAY   = '#aaaaaa'

export default function Navbar({ group, onLeave }) {
  const navigate     = useNavigate()
  const { pathname } = useLocation()

  return (
    <>
      {/* Top bar */}
      <div style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background:'rgba(10,10,10,0.97)',
        borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 16px', height:48,
      }}>
        <img
          src="/clutch_logo.png"
          alt="Clutch"
          onClick={onLeave}
          style={{ height:44, cursor:'pointer', transition:'opacity 0.2s' }}
          onMouseEnter={e => e.target.style.opacity = '0.75'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        />
        <span style={{
          fontSize:12, color:'var(--text3)',
          fontFamily:'Barlow Condensed', letterSpacing:1,
          maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {group?.name}
        </span>
      </div>

      {/* Bottom nav */}
      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:100,
        background:'rgba(10,10,10,0.97)',
        borderTop:'1px solid var(--border)',
        display:'flex', height:'var(--nav-h)',
      }}>
        {TABS.map(({ path, Icon, label }) => {
          const active = pathname === path
          const color  = active ? PURPLE : GRAY
          return (
            <button key={path} onClick={() => navigate(path)} style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', gap:3, background:'none', border:'none',
              borderTop: active ? `2px solid ${PURPLE}` : '2px solid transparent',
              cursor:'pointer', transition:'all 0.15s', padding:'6px 0',
            }}>
              <Icon color={color} />
              <span style={{
                fontFamily:'Barlow Condensed', fontSize:10, fontWeight:700,
                letterSpacing:1, textTransform:'uppercase', color,
              }}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Top spacer */}
      <div style={{ height:48 }} />
    </>
  )
}
