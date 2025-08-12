const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken() { return localStorage.getItem('pc_token'); }

export async function signup(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function uploadFiles(files) {
  const token = getToken();
  const fd = new FormData();
  for (const f of files) fd.append('files', f);
  const res = await fetch(`${API_BASE}/api/files/upload`, {
    method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function listFiles() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/files`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}

export async function deleteFile(id) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/files/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}
