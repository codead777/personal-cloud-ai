import React, { useCallback, useEffect, useState } from 'react'
import Auth from './components/Auth'
import Files from './components/Files'
import { session, setUnauthHandler } from './api'

export default function App() {
  const [user, setUser] = useState(() => session.get()?.user || null)
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200)
  }, [])

  const logout = useCallback(() => { session.clear(); setUser(null) }, [])
  useEffect(() => setUnauthHandler(() => { setUser(null); toast('Session expired. Log in again.', 'error') }), [toast])

  const onAuth = s => { session.set(s); setUser(s.user) }

  return (
    <>
      {user ? <Files user={user} toast={toast} onLogout={logout} /> : <Auth onAuth={onAuth} />}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}
      </div>
    </>
  )
}
