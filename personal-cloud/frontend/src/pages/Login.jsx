import { useState } from 'react'
import { login, signup } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState(null)
  const nav = useNavigate()

  async function submit(e){
    e.preventDefault(); setError(null);
    try {
      const res = isSignup ? await signup(email, password) : await login(email, password);
      if (res.token) {
        localStorage.setItem('pc_token', res.token);
        nav('/');
      } else {
        setError(res.error || 'Unexpected error');
      }
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <h2 className="text-2xl font-bold mb-4">{isSignup ? 'Create account' : 'Sign in'}</h2>
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-3">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input className="w-full p-3 border rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="w-full p-3 border rounded" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="w-full py-2 rounded bg-indigo-600 text-white font-medium">{isSignup ? 'Sign up' : 'Sign in'}</button>
        </form>
        <div className="mt-4 text-sm text-center">
          <button className="text-indigo-600 hover:underline" onClick={()=>setIsSignup(s=>!s)}>{isSignup ? 'Have an account? Sign in' : "Don't have an account? Sign up"}</button>
        </div>
      </div>
    </div>
  )
}
