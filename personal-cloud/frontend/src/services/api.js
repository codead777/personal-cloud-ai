// Always point to Render backend
export const API_BASE = "https://personal-cloud-ai-1seg.onrender.com";

function getToken() {
  return localStorage.getItem("token"); // use "token" everywhere for consistency
}

export async function signup(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem("token", data.token); // save token right after signup
  }
  return data;
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (data.token) {
    localStorage.setItem("token", data.token); // save token right after login
  }
  return data;
}

export async function uploadFiles(files) {
  const token = getToken();
  const fd = new FormData();
  for (const f of files) fd.append("files", f);

  const res = await fetch(`${API_BASE}/api/files/upload`, {
    method: "POST",
    body: fd,
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function listFiles() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/files`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function deleteFile(id) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/files/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
