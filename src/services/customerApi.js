import { onlyDigits } from '../utils/documentFormatters'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const PUBLIC_ROUTES_ENDPOINT = '/api/customer/rotas-publicas/'
const PUBLIC_BOATS_ENDPOINT = '/api/customer/embarcacoes-publicas/'
const PUBLIC_SUITES_ENDPOINT = '/api/customer/suites-publicas/'
const PUBLIC_ADICIONAIS_ENDPOINT = '/api/customer/adicionais-publicos/'
const PUBLIC_CALCULATE_VALUE_ENDPOINT = '/api/customer/calcular-valor-publico/'

export function getApiUrl(path) {
  if (!API_BASE_URL) {
    return path
  }

  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

function getJsonHeaders(token) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(getApiUrl(path), {
    ...options,
    headers: {
      ...getJsonHeaders(options.token),
      ...(options.headers || {}),
    },
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const message = data?.mensagem || data?.message || data?.detail || 'Nao foi possivel concluir a requisicao.'
    throw new Error(message)
  }

  return data
}

export function assertSecureCardTransport(paymentMethod) {
  if (paymentMethod !== 'CREDIT_CARD') {
    return
  }

  const apiUrl = API_BASE_URL ? new URL(API_BASE_URL, window.location.origin) : new URL(window.location.origin)
  const pageIsSecure = window.location.protocol === 'https:'
  const apiIsSecure = apiUrl.protocol === 'https:'

  if (!pageIsSecure || !apiIsSecure) {
    throw new Error('Pagamento com cartao exige HTTPS no site e na API.')
  }
}

export async function getClientUidByDomain(domain = window.location.hostname) {
  const search = new URLSearchParams({ domain }).toString()
  return apiRequest(`/api/client/uid-por-dominio/?${search}`)
}

export async function customerLogin({ clientUid, identificador, senha }) {
  return apiRequest('/api/customer/login/', {
    method: 'POST',
    body: JSON.stringify({
      client_uid: clientUid,
      identificador,
      senha,
    }),
  })
}

export async function customerRegister({ clientUid, nome, email, telefone, cpfCnpj, cpf_cnpj, senha }) {
  const phoneDigits = onlyDigits(telefone)
  const cpfCnpjDigits = onlyDigits(cpf_cnpj || cpfCnpj)

  return apiRequest('/api/customer/register/', {
    method: 'POST',
    body: JSON.stringify({
      client_uid: clientUid,
      nome,
      email,
      telefone: phoneDigits,
      cpf_cnpj: cpfCnpjDigits,
      senha,
    }),
  })
}

export function buildCustomerIdentifierPayload(identificador) {
  const value = String(identificador || '').trim()
  const isEmail = value.includes('@')
  const digits = onlyDigits(value)

  return {
    identificador: value,
    ...(isEmail ? { email: value } : {}),
    ...(!isEmail && digits ? { cpf_cnpj: value, telefone: value } : {}),
  }
}

export async function forgotCustomerPassword({ clientUid, identificador }) {
  return apiRequest('/api/customer/password/forgot/', {
    method: 'POST',
    body: JSON.stringify({
      client_uid: clientUid,
      ...buildCustomerIdentifierPayload(identificador),
    }),
  })
}

export async function verifyCustomerPasswordCode({ clientUid, identificador, codigo }) {
  return apiRequest('/api/customer/password/verify-code/', {
    method: 'POST',
    body: JSON.stringify({
      client_uid: clientUid,
      ...buildCustomerIdentifierPayload(identificador),
      codigo,
    }),
  })
}

export async function resetCustomerPassword(payload) {
  return apiRequest('/api/customer/password/reset/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getCustomerProfile(token) {
  return apiRequest('/api/customer/perfil/', { token })
}

export async function updateCustomerProfile(payload, token) {
  return apiRequest('/api/customer/perfil/', {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  })
}

export async function listSuites(params = {}, token) {
  const search = new URLSearchParams(params).toString()
  return apiRequest(`/api/customer/suites/${search ? `?${search}` : ''}`, { token })
}

export async function listAdicionais(params = {}, token) {
  const search = new URLSearchParams(params).toString()
  return apiRequest(`/api/customer/adicionais/${search ? `?${search}` : ''}`, { token })
}

export async function listPublicRoutes(params = {}) {
  const search = new URLSearchParams(params).toString()
  return apiRequest(`${PUBLIC_ROUTES_ENDPOINT}${search ? `?${search}` : ''}`)
}

export async function listPublicBoats(params = {}) {
  const search = new URLSearchParams(params).toString()
  return apiRequest(`${PUBLIC_BOATS_ENDPOINT}${search ? `?${search}` : ''}`)
}

export async function listPublicSuites(params = {}) {
  const search = new URLSearchParams(params).toString()
  return apiRequest(`${PUBLIC_SUITES_ENDPOINT}${search ? `?${search}` : ''}`)
}

export async function listPublicAdicionais(params = {}) {
  const search = new URLSearchParams(params).toString()
  return apiRequest(`${PUBLIC_ADICIONAIS_ENDPOINT}${search ? `?${search}` : ''}`)
}

export async function calculatePublicReservationValue(payload) {
  return apiRequest(PUBLIC_CALCULATE_VALUE_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function createCustomerReservation(payload, token) {
  assertSecureCardTransport(payload.forma_pagamento)

  return apiRequest('/api/customer/criar-reserva/', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export async function listCustomerReservations(params = {}, token) {
  const search = new URLSearchParams(params).toString()
  return apiRequest(`/api/customer/reservas/${search ? `?${search}` : ''}`, { token })
}

export async function getCustomerReservation(reservationId, token) {
  return apiRequest(`/api/customer/reservas/${reservationId}/`, { token })
}

export function buildReservationPayload({ ticket, trip, passenger, passengers, suiteId, adicionais, paymentMethod, card, holder }) {
  const reservationPassengers = passengers?.length ? passengers : [passenger]

  const payload = {
    rota_id: ticket.id,
    data_reserva: ticket.departure,
    forma_pagamento: paymentMethod,
    suite_id: suiteId || null,
    passageiros: reservationPassengers.map((item) => ({
      nome: item.nome,
      documento: item.documento,
      data_nascimento: item.data_nascimento,
      pcd: Boolean(item.pcd),
      suite: Boolean(suiteId && item.suite),
    })),
    adicionais: adicionais || [],
  }

  if (paymentMethod === 'CREDIT_CARD') {
    payload.credit_card = {
      holder_name: card.holder_name,
      number: card.number.replace(/\s+/g, ''),
      expiry_month: card.expiry_month,
      expiry_year: card.expiry_year,
      ccv: card.ccv,
    }
    payload.credit_card_holder_info = holder
  }

  return payload
}
