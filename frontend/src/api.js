const KEY = 'pcai_session'

export const session = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null } },
  set(v) { localStorage.setItem(KEY, JSON.stringify(v)) },
  clear() { localStorage.removeItem(KEY) }
}

let onUnauth = () => {}
export const setUnauthHandler = f => { onUnauth = f }

async function req(path, opts = {}) {
  const s = session.get()
  const headers = { ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(s ? { Authorization: 'Bearer ' + s.token } : {}) }
  let r
  try { r = await fetch('/api' + path, { ...opts, headers }) }
  catch { throw new Error('Cannot reach the server. Check that it is running.') }
  const data = await r.json().catch(() => ({}))
  if (r.status === 401 && s) { session.clear(); onUnauth() }
  if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`)
  return data
}

const post = (path, body) => req(path, { method: 'POST', body: JSON.stringify(body) })

export const api = {
  signup: (email, password) => post('/auth/signup', { email, password }),
  login: (email, password) => post('/auth/login', { email, password }),
  list: () => req('/files'),
  search: q => req('/search?q=' + encodeURIComponent(q)),
  download: id => req(`/files/${id}/download`),
  remove: id => req(`/files/${id}`, { method: 'DELETE' }),
  // XHR rather than fetch so we get real upload progress.
  upload(file, onProgress) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest()
      x.open('POST', '/api/files')
      x.setRequestHeader('Authorization', 'Bearer ' + session.get().token)
      x.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total)
      x.onload = () => {
        let d = {}
        try { d = JSON.parse(x.responseText) } catch {}
        if (x.status === 401) { session.clear(); onUnauth() }
        x.status < 300 ? resolve(d) : reject(new Error(d.error || `Upload failed (${x.status})`))
      }
      x.onerror = () => reject(new Error('Network error during upload'))
      const fd = new FormData()
      fd.append('file', file)
      x.send(fd)
    })
  }
}
