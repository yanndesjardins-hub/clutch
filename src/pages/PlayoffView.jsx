import { useState, useEffect, useCallback } from 'react'
import { BRACKET, TEAMS, TEAM_BY_ABBR, PLAYOFF_DEADLINE } from '../lib/constants'
import { buildSeriesMap } from '../lib/nbaApi'
import { supabase } from '../lib/supabase'
import BracketSlot from '../components/BracketSlot'
import PredictionModal from '../components/PredictionModal'
import Countdown from '../components/Countdown'

const PAST_DEADLINE = new Date() > PLAYOFF_DEADLINE

export default function PlayoffView({ group, profile }) {
  const [seriesMap,   setSeriesMap]   = useState({})
  const [predictions, setPredictions] = useState({})
  const [modal,       setModal]       = useState(null)
  const [conf,        setConf]        = useState('east')
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const load = useCallback(async () => {
    try {
      const { seriesMap: sm } = await buildSeriesMap()
      setSeriesMap(sm)
      const { data } = await supabase.from('predictions').select('*')
        .eq('user_id', profile.id)
      const pMap = {}
      data?.forEach(p => {
        if (!pMap[p.series_key]) pMap[p.series_key] = {}
        pMap[p.series_key][p.type] = p
      })
      setPredictions(pMap)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [group.id, profile.id])

  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setInterval(load, 5*60*1000); return () => clearInterval(t) }, [load])

  async function savePrediction({ seriesKey, type, predicted_winner, predicted_games }) {
    const { error } = await supabase.from('predictions').upsert({
      user_id: profile.id, 
      series_key: seriesKey, type, predicted_winner, predicted_games,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,group_id,series_key,type' })
    if (error) throw error
    await load()
    setModal(null)
  }

  function isEditable(series) {
    if (!series) return false
    if (series.status === 'finished') return false
    if (series.status === 'upcoming') return !PAST_DEADLINE
    return true
  }

  function getUserPick(key) {
    const p = predictions[key]
    return p?.series?.predicted_winner || p?.initial?.predicted_winner || null
  }

  function getUserGames(key) {
    const p = predictions[key]
    return p?.series?.predicted_games || p?.initial?.predicted_games || null
  }

  function getCurrentPick(key, series) {
    const p = predictions[key]
    const type = series.status === 'active' ? 'series' : 'initial'
    return p?.[type] || null
  }

  function resolveTeam(key) {
    if (seriesMap[key]?.winner) return TEAM_BY_ABBR[seriesMap[key].winner]
    const pick = getUserPick(key)
    return pick ? TEAM_BY_ABBR[pick] : null
  }

  function getSlots(c) {
    const b = BRACKET[c]
    const r1 = b.r1.map(slot => ({
      ...slot,
      series: seriesMap[slot.key] || {
        teamA: TEAMS[c][slot.homeIdx], teamB: TEAMS[c][slot.awayIdx],
        status:'upcoming', winsA:0, winsB:0,
      },
    }))
    const r2 = b.r2.map(slot => {
      const real = seriesMap[slot.key]
      if (real?.teamA && real?.teamB) return { ...slot, series: real }
      return { ...slot, series: { teamA: resolveTeam(slot.fromKeys[0]), teamB: resolveTeam(slot.fromKeys[1]), status:'upcoming', winsA:0, winsB:0 } }
    })
    const r3 = b.r3.map(slot => {
      const real = seriesMap[slot.key]
      if (real?.teamA && real?.teamB) return { ...slot, series: real }
      return { ...slot, series: { teamA: resolveTeam(slot.fromKeys[0]), teamB: resolveTeam(slot.fromKeys[1]), status:'upcoming', winsA:0, winsB:0 } }
    })
    return { r1, r2, r3 }
  }

  function getFinalsSeries() {
    const real = seriesMap['finals_0']
    if (real?.teamA && real?.teamB) return real
    return { teamA: resolveTeam('east_r3_0'), teamB: resolveTeam('west_r3_0'), status:'upcoming', winsA:0, winsB:0 }
  }

  if (loading) return <div className="page text-center" style={{ paddingTop:60 }}>🏀 Loading bracket…</div>
  if (error)   return <div className="page text-center" style={{ paddingTop:60, color:'var(--red)' }}>❌ {error}</div>

  const slots      = getSlots(conf)
  const finalsSeries = getFinalsSeries()

  return (
    <div className="page fade-up">
      <Countdown />

      {/* Conf tabs */}
      <div style={{ display:'flex', background:'var(--bg2)', borderRadius:'var(--r)', border:'1px solid var(--border)', overflow:'hidden', marginBottom:16 }}>
        {[['east','East'],['west','West']].map(([k,label]) => (
          <button key={k} onClick={() => setConf(k)} style={{
            flex:1, padding:'11px 8px', background: conf===k ? 'var(--purple-bg)' : 'transparent',
            border:'none', borderBottom: conf===k ? '2px solid var(--purple)' : '2px solid transparent',
            color: conf===k ? 'var(--purple)' : 'var(--text3)',
            fontFamily:'Barlow Condensed', fontSize:12, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', cursor:'pointer',
          }}>{label}</button>
        ))}
      </div>

      {/* Bracket horizontal scroll */}
      <div style={{ overflowX:'auto', paddingBottom:12 }} className="bracket-scroll">
        <div style={{ display:'flex', gap:12, minWidth:'max-content', alignItems:'flex-start' }}>

          <RoundCol title="Round 1" slots={slots.r1}
            getUserPick={getUserPick} getUserGames={getUserGames}
            getCurrentPick={getCurrentPick} isEditable={isEditable} setModal={setModal} />

          <Connector count={2} />

          <RoundCol title="Semifinals" slots={slots.r2} topOffset={48}
            getUserPick={getUserPick} getUserGames={getUserGames}
            getCurrentPick={getCurrentPick} isEditable={isEditable} setModal={setModal} />

          <Connector count={1} />

          <RoundCol title="Conf. Finals" slots={slots.r3} topOffset={144}
            getUserPick={getUserPick} getUserGames={getUserGames}
            getCurrentPick={getCurrentPick} isEditable={isEditable} setModal={setModal} />

          <Connector count={1} />

          {/* Finals — inline right of Conf Finals */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, width:168, paddingTop:144 }}>
            <div className="condensed" style={{
              fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase',
              color:'var(--text3)', textAlign:'center', paddingBottom:6,
              borderBottom:'1px solid var(--border)', marginBottom:2,
            }}>
              NBA Finals
            </div>
            <BracketSlot
              series={finalsSeries}
              userPick={getUserPick('finals_0')}
              userGames={getUserGames('finals_0')}
              isEditable={isEditable(finalsSeries)}
              onClick={() => isEditable(finalsSeries) && setModal({ seriesKey:'finals_0', series:finalsSeries })}
            />
          </div>
        </div>
      </div>

      {modal && (
        <PredictionModal
          series={modal.series}
          currentPick={getCurrentPick(modal.seriesKey, modal.series)}
          onSave={pick => savePrediction({
            seriesKey: modal.seriesKey,
            type: modal.series.status === 'active' ? 'series' : 'initial',
            ...pick,
          })}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function RoundCol({ title, slots, getUserPick, getUserGames, getCurrentPick, isEditable, setModal, topOffset=0 }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, width:168 }}>
      <div className="condensed" style={{
        fontSize:10, fontWeight:800, letterSpacing:3, textTransform:'uppercase',
        color:'var(--text3)', textAlign:'center', paddingBottom:6,
        borderBottom:'1px solid var(--border)', marginBottom:2,
      }}>
        {title}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8, paddingTop: topOffset }}>
        {slots.map(({ key, series }) => (
          <BracketSlot key={key}
            series={series || { teamA:null, teamB:null, status:'upcoming' }}
            userPick={getUserPick(key)}
            userGames={getUserGames(key)}
            isEditable={isEditable(series || {})}
            onClick={() => series && isEditable(series) && setModal({ seriesKey:key, series })}
          />
        ))}
      </div>
    </div>
  )
}

function Connector({ count }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'space-around', alignSelf:'stretch', paddingTop:28 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ flex:1, display:'flex', alignItems:'center' }}>
          <div style={{ width:16, height:2, background:'var(--border)' }} />
        </div>
      ))}
    </div>
  )
}
