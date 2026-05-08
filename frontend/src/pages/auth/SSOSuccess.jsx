// src/pages/Auth/SSOSuccess.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircularProgress, Box, Typography } from '@mui/material'

const SSOSuccess = () => {
  const navigate = useNavigate()

  useEffect(() => {
    console.log('[SSOSuccess] mounted, URL:', window.location.href)
    
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')
    const error  = params.get('error')

    console.log('[SSOSuccess] token:', token ? 'ada' : 'tidak ada', 'error:', error)

    if (error || !token) {
      navigate('/login?error=' + (error || 'sso_failed'))
      return
    }

    try {
      const userRaw = params.get('user')
      console.log('[SSOSuccess] userRaw:', userRaw ? 'ada' : 'tidak ada')
      
      const user = userRaw ? JSON.parse(decodeURIComponent(userRaw)) : null

      console.log('[SSOSuccess] user parsed:', user)

      if (!user) {
        navigate('/login?error=missing_user')
        return
      }

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      console.log('[SSOSuccess] fetching pg-token...')
      
      fetch(`${import.meta.env.VITE_API_URL}/auth/pg-token`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        }
      })
      .then(r => {
        console.log('[SSOSuccess] pg-token status:', r.status)
        return r.json()
      })
      .then(data => {
        console.log('[SSOSuccess] pg-token data:', data)
        if (data.pg_token) localStorage.setItem('pg_token', data.pg_token)
        if (data.pg_cv !== null && data.pg_cv !== undefined) {
          localStorage.setItem('pg_cv', String(data.pg_cv))
        }
      })
      .catch(e => console.log('[SSOSuccess] pg-token error:', e))
      .finally(() => {
        if (user.role === 'admin') {
          navigate('/ticket-monitoring', { replace: true })
        } else {
          navigate('/my-ticket', { replace: true })
        }
      })

    } catch (e) {
      console.error('[SSOSuccess] parse error:', e)
      navigate('/login?error=sso_failed')
    }
  }, [])

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" gap={2}>
      <CircularProgress />
      <Typography>Memproses login...</Typography>
    </Box>
  )
}
export default SSOSuccess