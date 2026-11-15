import React, { useState } from 'react'
import { api } from '../api'
import { Brand, Icon } from './Icon'

const POINTS = [
  ['search', 'Search with everyday language', 'Try a phrase like “tax paperwork” to find relevant files.'],
  ['file', 'Search inside documents', 'Find information in text files and PDFs.'],
  ['storage', 'Use your own storage', 'Keep your files on your self-hosted server.']
]

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [tries, setTries] = useState(0)

  async function submit(e) {
    e.preventDefault()
    setErr(''); setBusy(true)
    try { onAuth(await api[mode](email, pw)) }
    catch (x) { setErr(x.message); setTries(n => n + 1) }
    finally { setBusy(false) }
  }

  return (
    <main className="auth">
      <section className="auth-intro">
        <Brand />
        <div className="auth-story">
          <h1>Find files by what they’re about.</h1>
          <ul>{POINTS.map(([icon, title, description]) => (
            <li key={icon}>
              <span className="feature-icon"><Icon name={icon} /></span>
              <div><strong>{title}</strong><p>{description}</p></div>
            </li>
          ))}</ul>
        </div>
      </section>
      <section className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-heading">
            <h2>{mode === 'login' ? 'Log in to your cloud' : 'Create your account'}</h2>
          </div>
          <div className="tabs" role="group" aria-label="Account access">
            {['login', 'signup'].map(m => (
              <button type="button" key={m} aria-pressed={mode === m} disabled={busy}
                className={mode === m ? 'on' : ''} onClick={() => { setMode(m); setErr('') }}>
                {m === 'login' ? 'Log in' : 'Create account'}
              </button>
            ))}
          </div>
          <label>Email
            <input type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label>Password
            <input type="password" required minLength={mode === 'signup' ? 8 : 1}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={pw} onChange={e => setPw(e.target.value)} />
            {mode === 'signup' && <small>At least 8 characters.</small>}
          </label>
          {err && <div className="form-error" key={tries} role="alert">{err}</div>}
          <button className="primary" disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {busy ? 'Please wait' : mode === 'login' ? 'Log in' : 'Create account'}
            {!busy && <Icon name="arrow" size={18} />}
          </button>
        </form>
      </section>
    </main>
  )
}
