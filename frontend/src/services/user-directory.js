import api from './api.js'
import { getStoredUser } from './auth.js'

function getUserDisplayName(user = {}) {
  return String(user?.name || user?.username || user?.email || '').trim()
}

function normalizeUser(user = {}) {
  const id = user?.id ?? user?.user_id ?? user?.userId ?? ''
  const name = getUserDisplayName(user) || (id ? `User ${id}` : '')

  if (!id || !name) {
    return null
  }

  return {
    ...user,
    id,
    name,
  }
}

function extractUserList(payload) {
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : []

  return rawList.map(normalizeUser).filter(Boolean)
}

export async function fetchSelectableUsers() {
  const fallbackUser = normalizeUser(getStoredUser())
  const attempts = ['/directory/users', '/user']
  let lastError = null

  for (const endpoint of attempts) {
    try {
      const response = await api.get(endpoint)
      const users = extractUserList(response)

      if (users.length > 0) {
        return users
      }
    } catch (error) {
      lastError = error
    }
  }

  if (fallbackUser) {
    return [fallbackUser]
  }

  if (lastError) {
    throw lastError
  }

  return []
}
