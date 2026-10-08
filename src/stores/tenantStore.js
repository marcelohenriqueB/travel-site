import { reactive } from 'vue'
import { getClientUidByDomain } from '../services/customerApi'

const fallbackTenant = {
  uid: '',
  name: '',
  logo: '',
  banner_site: '',
  capa: '',
  site_titulo: '',
  site_subtitulo: '',
  site_descricao: '',
  site_link_ajuda: '',
  site_link_instagram: '',
  site_link_facebook: '',
  site_link_whatsapp: '',
  site_link_tiktok: '',
  site_link_youtube: '',
  site_avisos_previos: '',
  site_termos_uso: '',
  site_politica_privacidade: '',
  cor_primaria: '#0ea5e9',
  cor_secundaria: '#082f49',
  cor_fundo: '#f7fbff',
  cor_texto: '#12324a',
  informativo: '',
}

export const tenantState = reactive({
  loading: false,
  initialized: false,
  error: '',
  notFound: false,
  clientUid: '',
  client: { ...fallbackTenant },
})

function applyTenantTheme(client) {
  const root = document.documentElement
  root.style.setProperty('--brand-primary', client.cor_primaria || fallbackTenant.cor_primaria)
  root.style.setProperty('--brand-secondary', client.cor_secundaria || fallbackTenant.cor_secundaria)
  root.style.setProperty('--brand-bg', client.cor_fundo || fallbackTenant.cor_fundo)
  root.style.setProperty('--brand-text', client.cor_texto || fallbackTenant.cor_texto)
}

function applyDocumentTitle(client) {
  const title = client.site_titulo || client.name || ''
  document.title = title || 'Pagina nao encontrada'
}

export async function loadTenant() {
  if (tenantState.loading || tenantState.clientUid || tenantState.notFound) {
    return tenantState
  }

  tenantState.loading = true
  tenantState.error = ''
  tenantState.notFound = false

  try {
    const response = await getClientUidByDomain()
    const client = response?.client || {}
    tenantState.clientUid = response?.client_uid || client.uid || ''

    if (!tenantState.clientUid) {
      throw new Error('Dominio nao encontrado.')
    }

    tenantState.client = {
      ...fallbackTenant,
      ...client,
      uid: client.uid || response?.client_uid || '',
    }
  } catch (error) {
    tenantState.error = error.message
    tenantState.notFound = true
    tenantState.clientUid = ''
    tenantState.client = { ...fallbackTenant }
  } finally {
    applyTenantTheme(tenantState.client)
    applyDocumentTitle(tenantState.client)
    tenantState.loading = false
    tenantState.initialized = true
  }

  return tenantState
}
