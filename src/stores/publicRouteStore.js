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
    seats: route.vagas_disponiveis,
    capacity: route.capacidade_diaria,
    reserved: route.passageiros_reservados,
    image: routeBoat?.foto_url || route.embarcacao_foto_url || route.foto_url || heroImage,
    raw: route,
  }
}

export function cachePublicRoutes(routes, fallbackDate, boat = null) {
  const mappedRoutes = routes.map((route) => mapPublicRouteToTicket(route, fallbackDate, boat))
  writeRoutes(mappedRoutes)
  return mappedRoutes
}

export function getCachedPublicRoute(id) {
  return publicRouteState.routes.find((route) => String(route.id) === String(id))
}
