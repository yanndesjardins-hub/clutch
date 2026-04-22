import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useParams, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { supabase } from './lib/supabase'
import Login          from './pages/Login'
import GroupHub       from './pages/GroupHub'
import PlayoffView    from './pages/PlayoffView'
import SeriesView     from './pages/SeriesView'
import Rankings       from './pages/Rankings'
import Rules          from './pages/Rules'
import Account        from './pages/Account'
import Terms          from './pages/Terms'
import ResetPassword  from './pages/ResetPassword'
import Navbar         from './components/Navbar'

function Loader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:40 }}>
      🏀
    </div>
  )
}

function GroupLayout({ group, onLeave, profile }) {
  return (
    <>
      <Outlet context={{ group, profile }} />
      <Navbar group={group} onLeave={onLeave} />
    </>
  )
}

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

  if (session === undefined) return <Loader />

  // Public routes (no auth needed)
  if (!session) {
    const code = window.location.pathname.match(/\/join\/(.+)/)?.[1]
    if (code) sessionStorage.setItem('hc_pending_invite', code)

    // Reset password page is accessible without full session
    if (window.location.pathname === '/reset-password') return <ResetPassword />
    if (window.location.pathname === '/terms') return <Terms />

    return <Login />
  }

  return (
    <Routes>
      <Route path="/join/:code"      element={<JoinRoute profile={profile} />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      <Route path="/terms"           element={<Terms />} />

      <Route path="/" element={
        activeGroup
          ? <Navigate to="/group/bracket" replace />
          : <GroupHub profile={profile} onSelectGroup={selectGroup} />
      } />

      <Route path="/group" element={
        activeGroup
          ? <GroupLayout group={activeGroup} onLeave={leaveGroup} profile={profile} />
          : <Navigate to="/" replace />
      }>
        <Route path="bracket"  element={<PlayoffView group={activeGroup} profile={profile} />} />
        <Route path="series"   element={<SeriesView  group={activeGroup} profile={profile} />} />
        <Route path="rankings" element={<Rankings    group={activeGroup} profile={profile} />} />
        <Route path="rules"    element={<Rules />} />
        <Route path="terms"    element={<Terms />} />
        <Route path="account"  element={<Account profile={profile} group={activeGroup} onLeave={leaveGroup} />} />
        <Route index           element={<Navigate to="bracket" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
