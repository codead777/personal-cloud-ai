import React, { useState } from 'react'

export default function Upload(){
  const [file, setFile] = useState(null)
  const [token, setToken] = useState('')
  const [files, setFiles] = useState([])

  async function signup(){
    const email = prompt('email?')
    const pass = prompt('password?')
    await fetch('/api/auth/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password: pass}) })
    alert('signed up — now login')
  }
  async function login(){
    const email = prompt('email?')
    const pass = prompt('password?')
    const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password: pass}) })
    const j = await r.json(); setToken(j.token)
  }
  async function doUpload(){
    if(!file) return alert('pick file')
    const fd = new FormData(); fd.append('file', file)
    const r = await fetch('/api/files', { method:'POST', body: fd, headers: { Authorization: 'Bearer '+token } })
    const j = await r.json();
    alert('uploaded: '+j.filename)
    listFiles()
  }
  async function listFiles(){
    const r = await fetch('/api/files', { headers: { Authorization: 'Bearer '+token } })
    const j = await r.json(); setFiles(j)
  }

  return (
    <div>
      <div style={{marginBottom:10}}>
        <button onClick={signup}>Sign up</button>
        <button onClick={login} style={{marginLeft:6}}>Login</button>
        <button onClick={listFiles} style={{marginLeft:6}}>List files</button>
      </div>
      <input type="file" onChange={e=>setFile(e.target.files[0])} />
      <button onClick={doUpload}>Upload</button>
      <h3>Files</h3>
      <ul>
        {files.map(f=> (<li key={f.id}>{f.filename} — tags: {f.tags ? f.tags.join(', ') : '—'}</li>))}
      </ul>
    </div>
  )
}
