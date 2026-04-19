import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { supabase } from './lib/supabase'
import Login       from './pages/Login'
import GroupHub    from './pages/GroupHub'
import PlayoffView from './pages/PlayoffView'
import SeriesView  from './pages/SeriesView'
import Rankings    from './pages/Rankings'
import Rules       from './pages/Rules'
import Navbar      from './components/Navbar'

// Initial loading spinner
function Loader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:40 }}>
      🏀
    </div>
  )
}

// Layout avec Navbar pour les pages "in-group"
function GroupLayout({ group, onLeave }) {
  return (
    <>
      <Outlet context={{ group }} />
      <Navbar group={group} onLeave={onLeave} />
    </>
  )
}

// Route that auto-joins a group via invite code in the URL
function JoinRoute({ profile }) {
  const { code } = useParams()
  const navigate  = useNavigate()

  useEffect(() => {
    if (!profile || !code) return
    ;(async () => {
      const { data: group } = await supabase
        .from('groups').select('*').eq('invite_code', code.toUpperCase()).single()
      if (group) {
        await supabase.from('group_members')
          .upsert({ group_id: group.id, user_id: profile.id }, { onConflict: 'group_id,user_id' })
      }
      navigate('/', { replace: true })
    })()
  }, [profile, code])

  return <Loader />
}

export default function App() {
  const { session, profile } = useAuth()
  const [activeGroup, setActiveGroup] = useState(null)

  // Mémorise le group actif pour éviter de le perdre au refresh
  useEffect(() => {
    const saved = sessionStorage.getItem('hc_group')
    if (saved) setActiveGroup(JSON.parse(saved))
  }, [])

  function selectGroup(g) {
    setActiveGroup(g)
    sessionStorage.setItem('hc_group', JSON.stringify(g))
  }

  function leaveGroup() {
    setActiveGroup(null)
    sessionStorage.removeItem('hc_group')
  }

  // Load initial session
  if (session === undefined) return <Loader />

  // Non connecté → Login (stocke le code d'invite si présent dans l'URL)
  if (!session) {
    const code = window.location.pathname.match(/\/join\/(.+)/)?.[1]
    if (code) sessionStorage.setItem('hc_pending_invite', code)
    return <Login />
  }

  return (
    <Routes>
      {/* Route d'invitation directe */}
      <Route path="/join/:code" element={<JoinRoute profile={profile} />} />

      {/* Group hub */}
      <Route path="/" element={
        activeGroup
          ? <Navigate to="/group/bracket" replace />
          : <GroupHub profile={profile} onSelectGroup={selectGroup} />
      } />

      {/* Pages in-group */}
      <Route path="/group" element={
        activeGroup
          ? <GroupLayout group={activeGroup} onLeave={leaveGroup} />
          : <Navigate to="/" replace />
      }>
        <Route path="bracket"  element={<PlayoffView group={activeGroup} profile={profile} />} />
        <Route path="series"   element={<SeriesView  group={activeGroup} profile={profile} />} />
        <Route path="rankings" element={<Rankings    group={activeGroup} profile={profile} />} />
        <Route path="rules"    element={<Rules />} />
        <Route index           element={<Navigate to="bracket" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
