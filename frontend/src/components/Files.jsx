import React, { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { Brand, Icon } from './Icon'

const fmtSize = b => {
  if (b == null) return ''
  const u = ['B', 'KB', 'MB', 'GB']; let i = 0
  while (b >= 1024 && i < 3) { b /= 1024; i++ }
  return `${b.toFixed(i ? 1 : 0)} ${u[i]}`
}
const fmtDate = d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const iconFor = (name, mime) => {
  const kind = mime?.split('/')[0]
  if (['image', 'video', 'audio'].includes(kind)) return kind
  return /\.(zip|rar|7z|tar|gz)$/i.test(name) ? 'archive' : 'file'
}

const STATUS = {
  pending: ['Reading file', 'Search will find this once reading finishes'],
  done: ['Searchable', 'Included in smart search'],
  failed: ['Not indexed', 'The AI service could not read this file. It is still stored safely.']
}

function Skeletons() {
  return Array.from({ length: 4 }, (_, i) => (
    <li key={i} className="file skeleton" aria-hidden="true">
      <div className="sk sk-icon" /><div className="grow"><div className="sk sk-line" /><div className="sk sk-line short" /></div>
    </li>
  ))
}

export default function Files({ user, toast, onLogout }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [uploads, setUploads] = useState([])
  const [drag, setDrag] = useState(false)
  const [leaving, setLeaving] = useState({})
  const input = useRef()

  const load = useCallback(async () => {
    try { setFiles(await api.list()); setLoadError('') }
    catch (e) { setLoadError(e.message) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  // Poll while any file is still being read by the AI service.
  const pending = files.some(f => f.ai_status === 'pending')
  useEffect(() => {
    if (!pending) return
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [pending, load])

  // Debounced smart search.
  useEffect(() => {
    setSearchError('')
    setResults(null)
    if (!q.trim()) { setResults(null); setSearching(false); return }
    setSearching(true)
    let stale = false
    const t = setTimeout(async () => {
      try { const r = await api.search(q.trim()); if (!stale) setResults(r) }
      catch (e) { if (!stale) setSearchError(e.message) }
      finally { if (!stale) setSearching(false) }
    }, 400)
    return () => { stale = true; clearTimeout(t) }
  }, [q])

  async function addFiles(list) {
    for (const file of Array.from(list)) {
      const id = Date.now() + Math.random()
      setUploads(u => [...u, { id, name: file.name, p: 0 }])
      try {
        await api.upload(file, p => setUploads(u => u.map(x => x.id === id ? { ...x, p } : x)))
        toast(`Uploaded ${file.name}`, 'success')
      } catch (e) { toast(`${file.name}: ${e.message}`, 'error') }
      setUploads(u => u.filter(x => x.id !== id))
      await load()
    }
  }

  async function download(f) {
    try {
      const { url } = await api.download(f.id)
      const a = document.createElement('a'); a.href = url; a.download = f.filename; a.click()
    } catch (e) { toast(e.message, 'error') }
  }

  async function remove(f) {
    if (!window.confirm(`Delete "${f.filename}"? This cannot be undone.`)) return
    setLeaving(l => ({ ...l, [f.id]: true }))
    try {
      await api.remove(f.id)
      setTimeout(() => {
        setFiles(x => x.filter(y => y.id !== f.id))
        setResults(r => r && r.filter(y => y.id !== f.id))
      }, 260)
      toast(`Deleted ${f.filename}`, 'success')
    } catch (e) {
      setLeaving(l => ({ ...l, [f.id]: false }))
      toast(e.message, 'error')
    }
  }

  const query = q.trim()
  const list = query ? results ?? [] : files
  const total = files.reduce((s, f) => s + Number(f.size || 0), 0)
  const indexed = files.filter(f => f.ai_status === 'done').length
  const stats = [
    ['folder', 'Total files', files.length],
    ['storage', 'Storage used', fmtSize(total)],
    ['sparkle', 'Searchable files', indexed]
  ]
  const busy = query ? searching : loading
  const error = query ? searchError : loadError

  return (
    <>
      <header className="masthead">
        <div className="masthead-inner">
          <Brand />
          <div className="who">
            <span className="avatar" aria-hidden="true">{user.email.slice(0, 1).toUpperCase()}</span>
            <span className="account-email" title={user.email}>{user.email}</span>
            <button className="ghost logout" onClick={onLogout} aria-label="Log out" title="Log out"><Icon name="logout" size={17} /><span>Log out</span></button>
          </div>
        </div>
      </header>

      <main className="app">
        <div className="top">
          <div><h1>My files</h1><p>Upload files and find them with natural-language search.</p></div>
          <button className="primary" onClick={() => input.current.click()}><Icon name="upload" size={18} /> Upload files</button>
        </div>

        <dl className="stats" aria-label="Library summary">
          {stats.map(([icon, label, value]) => (
            <div className="stat" key={label}>
              <span className={`stat-icon ${icon}`}><Icon name={icon} /></span>
              <div><dt>{label}</dt><dd>{loading || loadError ? '—' : value}</dd></div>
            </div>
          ))}
        </dl>

        <div className={`drop ${drag ? 'over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={e => { if (!(e.relatedTarget instanceof Node) || !e.currentTarget.contains(e.relatedTarget)) setDrag(false) }}
          onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}>
          <input ref={input} type="file" multiple hidden onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
          <span className="drop-icon"><Icon name="upload" size={23} /></span>
          <strong>{drag ? 'Drop to upload' : 'Drag and drop files here'}</strong>
          <span className="drop-hint">or <button className="text-button" onClick={() => input.current.click()}>browse files</button></span>
          {uploads.length > 0 && (
            <ul className="uploads" aria-label="Active uploads">
              {uploads.map(u => (
                <li key={u.id}>
                  <span className="name">{u.name}</span>
                  <progress max="1" value={u.p} aria-label={`Uploading ${u.name}`} />
                  <span className="pct">{u.p >= 1 ? 'Saving' : `${Math.round(u.p * 100)}%`}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <section className="library" aria-labelledby="library-heading">
          <div className="library-header">
            <h2 id="library-heading">{query ? 'Search results' : 'All files'}</h2>
            {query && results && <span className="result-count" role="status">{results.length} {results.length === 1 ? 'match' : 'matches'}</span>}
          </div>
          <div className="search">
            <Icon name="search" size={19} />
            <input type="search" placeholder="Search by meaning, e.g. tax documents" value={q}
              onChange={e => setQ(e.target.value)} aria-label="Search files by meaning" />
            {searching && <span className="spinner" role="status" aria-label="Searching" />}
            {q && <button className="icon-button" onClick={() => setQ('')} aria-label="Clear search" title="Clear search"><Icon name="close" size={16} /></button>}
          </div>

          {error && <div className="form-error library-error" role="alert">
            <span>{error}</span>
            {!query && <button className="ghost" onClick={() => { setLoading(true); load() }}>Try again</button>}
          </div>}

          <ul className="files" aria-busy={busy}>
            {busy ? <Skeletons /> : list.map(f => {
              const icon = iconFor(f.filename, f.mime)
              return (
                <li key={f.id} className={`file ${f.ai_status === 'pending' ? 'scanning' : ''} ${leaving[f.id] ? 'leaving' : ''}`}>
                  <span className={`file-icon ${icon}`}><Icon name={icon} /></span>
                  <div className="grow">
                    <div className="fname" title={f.filename}>{f.filename}</div>
                    <div className="meta">
                      {fmtSize(f.size)} · {fmtDate(f.created_at)}
                      {f.score != null && <span className="score">{Math.round(f.score * 100)}% match</span>}
                    </div>
                    <div className="tags">
                      <span className={`badge ${f.ai_status}`} title={STATUS[f.ai_status]?.[1]}>{STATUS[f.ai_status]?.[0] || f.ai_status}</span>
                      {(f.tags || []).map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                  </div>
                  <div className="actions">
                    <button className="icon-button" onClick={() => download(f)} aria-label={`Download ${f.filename}`} title="Download"><Icon name="download" size={18} /></button>
                    <button className="icon-button danger" onClick={() => remove(f)} aria-label={`Delete ${f.filename}`} title="Delete"><Icon name="trash" size={18} /></button>
                  </div>
                </li>
              )
            })}
            {!busy && !error && list.length === 0 && (
              <li className="empty">
                <span className="empty-icon"><Icon name={query ? 'search' : 'folder'} size={24} /></span>
                <strong>{query ? 'No matching files' : 'No files yet'}</strong>
                <span>{query ? 'Try a different phrase. Only searchable files appear here.' : 'Upload your first file to start building your library.'}</span>
              </li>
            )}
          </ul>
        </section>
      </main>
    </>
  )
}
