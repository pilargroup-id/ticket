const DEFAULT_API_BASE_URL = 'http://localhost:8001/api'
const DEFAULT_TOKEN_KEY = 'access_token'

function forceHttpsIfPageIsHttps(urlStr) {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return urlStr.replace(/^http:\/\//i, 'https://')
  }
  return urlStr
}

function normalizeBaseUrl(baseUrl) {
  const normalized = String(baseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
  return forceHttpsIfPageIsHttps(normalized)
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(String(value))
}

function appendQueryParams(url, params = {}) {
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          url.searchParams.append(key, String(item))
        }
      })

      return
    }

    url.searchParams.append(key, String(value))
  })
}

function buildRequestUrl(endpoint, baseUrl, params) {
  const path = String(endpoint || '').trim()
  const url = isAbsoluteUrl(path)
    ? new URL(path)
    : new URL(path.replace(/^\/+/, ''), `${normalizeBaseUrl(baseUrl)}/`)

  appendQueryParams(url, params)

  return forceHttpsIfPageIsHttps(url.toString())
}

function isBodySerializableAsJson(body) {
  return (
    body !== null &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams)
  )
}

function serializeBody(body, headers) {
  if (body === undefined || body === null) {
    return undefined
  }

  if (isBodySerializableAsJson(body)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    return JSON.stringify(body)
  }

  return body
}

async function parseResponseBody(response) {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

export class ApiError extends Error {
  constructor(message, { status, data, url } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.url = url
  }
}

export function createApiClient({
  baseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL,
  tokenKey = DEFAULT_TOKEN_KEY,
} = {}) {
  function getToken() {
    if (typeof window === 'undefined') {
      return null
    }

    return window.localStorage.getItem(tokenKey)
  }

  function setToken(token) {
    if (typeof window === 'undefined') {
      return token
    }

    if (!token) {
      window.localStorage.removeItem(tokenKey)
      return null
    }

    window.localStorage.setItem(tokenKey, token)
    return token
  }

  function clearToken() {
    setToken(null)
  }

  async function request(
    endpoint,
    {
      method = 'GET',
      params,
      body,
      data,
      headers: customHeaders = {},
      token = getToken(),
      ...fetchOptions
    } = {},
  ) {
    const headers = new Headers({
      Accept: 'application/json',
      ...customHeaders,
    })
    const payload = body ?? data
    const url = buildRequestUrl(endpoint, baseUrl, params)

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    const response = await fetch(url, {
      method,
      headers,
      body: serializeBody(payload, headers),
      ...fetchOptions,
    })
    const responseBody = await parseResponseBody(response)

    if (!response.ok) {
      throw new ApiError(
        responseBody?.message || `Request gagal dengan status ${response.status}`,
        {
          status: response.status,
          data: responseBody,
          url,
        },
      )
    }

    return responseBody
  }

  return {
    baseUrl: normalizeBaseUrl(baseUrl),
    tokenKey,
    getToken,
    setToken,
    clearToken,
    buildUrl(endpoint, params) {
      return buildRequestUrl(endpoint, baseUrl, params)
    },
    request,
    get(endpoint, options = {}) {
      return request(endpoint, { ...options, method: 'GET' })
    },
    post(endpoint, body, options = {}) {
      return request(endpoint, { ...options, method: 'POST', body })
    },
    put(endpoint, body, options = {}) {
      return request(endpoint, { ...options, method: 'PUT', body })
    },
    patch(endpoint, body, options = {}) {
      return request(endpoint, { ...options, method: 'PATCH', body })
    },
    delete(endpoint, options = {}) {
      return request(endpoint, { ...options, method: 'DELETE' })
    },
  }
}

const api = createApiClient()

export default api
