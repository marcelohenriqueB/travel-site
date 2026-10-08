import { reactive } from 'vue'
import heroImage from '../assets/hero-amazonia.jpg'

const STORAGE_KEY = 'public_routes_cache'

export const publicRouteState = reactive({
  routes: readRoutes(),
})

function readRoutes() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function writeRoutes(routes) {
  publicRouteState.routes = routes
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(routes))
}

export function mapPublicRouteToTicket(route, fallbackDate, boat = null) {
  const origin = route.saindo_de || route.origem || 'Origem'
  const destination = route.indo_para || route.destino || 'Destino'
  const value = Number(route.valor || 0)
  const routeBoat = route.embarcacao || boat

  return {
    id: route.id,
    cacheKey: `${route.id}-${route.data_reserva || route.data || fallbackDate || ''}`,
    boat: routeBoat?.nome || route.embarcacao_nome || route.nome || `${origin} x ${destination}`,
    type: route.descricao || 'Rota publica',
    origin,
    destination,
    departure: route.data_reserva || route.data || fallbackDate,
    arrival: route.data_reserva || route.data || fallbackDate,
    departureTime: route.horario_partida,
    arrivalTime: route.horario_chegada,
    price: value ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Valor no backend',
    value,
    embarcacaoId: route.embarcacao_id || routeBoat?.id || '',
    total_buscas: route.total_buscas,
    buscas: route.buscas,
    procuras: route.procuras,
    total_procuras: route.total_procuras,
    search_count: route.search_count,
    popularidade: route.popularidade,
    total_reservas: route.total_reservas,
    reservas_count: route.reservas_count,
    reservas: route.reservas,
    seats: route.vagas_disponiveis,
    capacity: route.capacidade_diaria,
    reserved: route.passageiros_reservados,
    image: route.foto_url || routeBoat?.foto_url || route.embarcacao_foto_url || heroImage,
    raw: route,
  }
}

export function cachePublicTickets(routes) {
  const dedupedRoutes = [...routes]
    .reverse()
    .filter((route, index, source) => {
      const routeKey = `${route.id}-${route.departure || ''}`
      return source.findIndex((item) => `${item.id}-${item.departure || ''}` === routeKey) === index
    })
    .reverse()

  writeRoutes(dedupedRoutes)
  return dedupedRoutes
}

export function cachePublicRoutes(routes, fallbackDate, boat = null) {
  const mappedRoutes = routes.map((route) => mapPublicRouteToTicket(route, fallbackDate, boat))
  return cachePublicTickets(mappedRoutes)
}

export function getCachedPublicRoute(id, departure = '') {
  return publicRouteState.routes.find((route) => (
    String(route.id) === String(id) &&
    (!departure || route.departure === departure)
  ))
}
