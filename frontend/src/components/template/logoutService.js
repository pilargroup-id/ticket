import { logout } from '../../services/auth.js'

export async function submitLogout() {
  if (typeof window === 'undefined') {
    return
  }

  await logout()
  window.history.pushState({}, '', '/login')
  window.dispatchEvent(new PopStateEvent('popstate'))
}
