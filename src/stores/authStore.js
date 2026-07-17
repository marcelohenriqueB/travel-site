import { reactive } from 'vue'
import { customerLogin, customerRegister } from '../services/customerApi'

const STORAGE_KEY = 'customer_auth'

function readStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

const storedAuth = readStoredAuth()

export const authState = reactive({
  access: storedAuth.access || '',
  refresh: storedAuth.refresh || '',
  customer: storedAuth.customer || null,
  client: storedAuth.client || null,
})

export function isAuthenticated() {
  return Boolean(authState.access)
}

export async function loginCustomer(payload) {
  const response = await customerLogin(payload)
  persistAuthResponse(response)

  return response
}

export async function registerCustomer(payload) {
  const response = await customerRegister(payload)

  if (response.access) {
    persistAuthResponse(response)
  }

  return response
}

function persistAuthResponse(response) {
  authState.access = response.access || ''
  authState.refresh = response.refresh || ''
  authState.customer = response.customer || null
  authState.client = response.client || null

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      access: authState.access,
      refresh: authState.refresh,
      customer: authState.customer,
      client: authState.client,
    }),
  )
}

export function logoutCustomer() {
  authState.access = ''
  authState.refresh = ''
  authState.customer = null
  authState.client = null
  localStorage.removeItem(STORAGE_KEY)
}

export function updateStoredCustomer(customer) {
  authState.customer = {
    ...(authState.customer || {}),
    ...(customer || {}),
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      access: authState.access,
      refresh: authState.refresh,
      customer: authState.customer,
      client: authState.client,
    }),
  )
}
