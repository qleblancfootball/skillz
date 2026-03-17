import { useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'http://localhost:5173',
          },
        })

        if (error) throw error

        if (!data.session) {
          setMessage('Account created. Check your email to confirm, then sign in.')
        } else {
          setMessage('Account created and signed in.')
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout
      title="Skill Tracker"
      subtitle="Sign in with your Supabase account."
    >
      <div
        style={{
          marginTop: '32px',
          borderRadius: '22px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(145deg, rgba(13, 20, 36, 0.98), rgba(9, 14, 25, 0.95))',
          padding: '18px',
          boxShadow: '0 18px 60px rgba(0,0,0,0.28)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setError('')
              setMessage('')
            }}
            style={{
              border: 'none',
              borderRadius: '14px',
              padding: '12px',
              background: mode === 'signin' ? 'linear-gradient(135deg, #22d3ee 0%, #38bdf8 100%)' : 'rgba(255,255,255,0.08)',
              color: mode === 'signin' ? '#07101d' : 'white',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError('')
              setMessage('')
            }}
            style={{
              border: 'none',
              borderRadius: '14px',
              padding: '12px',
              background: mode === 'signup' ? 'linear-gradient(135deg, #22d3ee 0%, #38bdf8 100%)' : 'rgba(255,255,255,0.08)',
              color: mode === 'signup' ? '#07101d' : 'white',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label className="field-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="app-input"
              placeholder="you@email.com"
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="field-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="app-input"
              placeholder="Your password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type="submit"
            className="primary-button full-width"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Working...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {message ? (
          <p style={{ marginTop: '12px', color: '#67e8f9', lineHeight: 1.45 }}>{message}</p>
        ) : null}

        {error ? (
          <p style={{ marginTop: '12px', color: '#fca5a5', lineHeight: 1.45 }}>{error}</p>
        ) : null}
      </div>
    </Layout>
  )
}