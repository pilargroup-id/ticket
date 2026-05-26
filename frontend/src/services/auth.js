import api from './api.js'

const DEFAULT_USER_KEY = 'auth_user'

function isBrowser() {
  return typeof window !== 'undefined'
}

function parseUserValue(value) {
  if (!value) {
    return null
  }

  if (typeof value === 'object') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    try {
      return JSON.parse(decodeURIComponent(value))
    } catch {
      return null
    }
  }
}

export function getStoredUser(userKey = DEFAULT_USER_KEY) {
  if (!isBrowser()) {
    return null
  }

  return parseUserValue(window.localStorage.getItem(userKey))
}

export function setStoredUser(user, userKey = DEFAULT_USER_KEY) {
  if (!isBrowser()) {
    return user ?? null
  }

  if (!user) {
    window.localStorage.removeItem(userKey)
    return null
  }

  window.localStorage.setItem(userKey, JSON.stringify(user))
  return user
}

export function getStoredSession(userKey = DEFAULT_USER_KEY) {
  return {
    token: api.getToken(),
    user: getStoredUser(userKey),
  }
}

export function setStoredSession({ token, user } = {}, userKey = DEFAULT_USER_KEY) {
  if (token !== undefined) {
    api.setToken(token)
  }

  if (user !== undefined) {
    setStoredUser(user, userKey)
  }

  return getStoredSession(userKey)
}

export function clearStoredSession(userKey = DEFAULT_USER_KEY) {
  api.clearToken()
  setStoredUser(null, userKey)
}

export function startSsoLogin() {
  if (!isBrowser()) return

  const returnUrl = encodeURIComponent(window.location.origin)
  window.location.assign(
    `https://pilargroup.id/dashboard?return_url=${returnUrl}`
  )
}
export async function consumeSsoSuccessParams({
  search = isBrowser() ? window.location.search : '',
  clearQuery = true,
  userKey = DEFAULT_USER_KEY,
} = {}) {
  if (!search) return null

  const params = new URLSearchParams(search)
  const token = params.get('token')

  if (!token) return null

  // Simpan token dulu
  api.setToken(token)

  // Fetch user dari /profile pakai token PG
  try {
    const user = await getProfile()
    setStoredUser(user?.data ?? user, userKey)
  } catch {
    api.clearToken()
    return null
  }

  if (clearQuery && isBrowser()) {
    const nextUrl = new URL(window.location.href)
    nextUrl.search = ''
    window.history.replaceState(window.history.state, '', nextUrl.toString())
  }

  return getStoredSession(userKey)
}

export function getAuthErrorFromUrl(search = isBrowser() ? window.location.search : '') {
  if (!search) {
    return null
  }

  const params = new URLSearchParams(search)
  return params.get('error')
}

export async function loginWithDevCredentials({ username, password }) {
  const response = await api.post(
    '/dev/login',
    { username, password },
    { token: null },
  )

  const session = setStoredSession({
    token: response?.access_token ?? null,
    user: response?.user ?? null,
  })

  return {
    ...response,
    session,
  }
}

export async function loginWithLegacyCredentials({ username, password }) {
  const response = await api.post(
    '/login',
    { username, password },
    { token: null },
  )

  const session = setStoredSession({
    token: response?.access_token ?? null,
    user: response?.user ?? null,
  })

  return {
    ...response,
    session,
  }
}

export async function getProfile() {
  return api.get('/profile')
}

export async function getPgToken() {
  return api.get('/auth/pg-token')
}

export async function logout() {
  try {
    if (api.getToken()) {
      await api.post('/logout', null)
    }
  } finally {
    clearStoredSession()
  }
}

export default {
  clearStoredSession,
  consumeSsoSuccessParams,
  getAuthErrorFromUrl,
  getPgToken,
  getProfile,
  getStoredSession,
  getStoredUser,
  loginWithDevCredentials,
  loginWithLegacyCredentials,
  logout,
  setStoredSession,
  setStoredUser,
  startSsoLogin,
}
