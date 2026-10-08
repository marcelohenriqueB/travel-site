import { getTodayDateInputValue } from './formatters'

const popularityKeys = [
  'total_buscas',
  'buscas',
  'procuras',
  'total_procuras',
  'search_count',
  'popularidade',
  'total_reservas',
  'reservas_count',
  'reservas',
  'passageiros_reservados',
  'reserved',
]

export function getRouteDate(route) {
  return route?.departure || route?.data_reserva || route?.data || route?.raw?.data_reserva || route?.raw?.data || ''
}

export function getRoutePopularityScore(route) {
  for (const key of popularityKeys) {
    const value = route?.[key] ?? route?.raw?.[key]
    const numberValue = Number(value)

    if (!Number.isNaN(numberValue) && numberValue > 0) {
      return numberValue
    }
  }

  return 0
}

export function sortRoutesByDemand(routes = []) {
  return [...routes].sort((first, second) => {
    const popularityDiff = getRoutePopularityScore(second) - getRoutePopularityScore(first)

    if (popularityDiff) {
      return popularityDiff
    }

    return getRouteDate(first).localeCompare(getRouteDate(second))
  })
}

export function getRouteBoatId(route) {
  return route?.embarcacaoId || route?.embarcacao_id || route?.raw?.embarcacao_id || route?.raw?.embarcacao?.id || ''
}

export function matchesRouteFilters(route, filters = {}) {
  const boatId = getRouteBoatId(route)

  return (
    (!filters.origin || route.origin === filters.origin) &&
    (!filters.destination || route.destination === filters.destination) &&
    (!filters.embarcacaoId || String(boatId) === String(filters.embarcacaoId))
  )
}

export function getAvailableDates(routes = [], filters = {}) {
  const today = getTodayDateInputValue()
  const dates = [...new Set(routes.filter((route) => matchesRouteFilters(route, filters)).map(getRouteDate).filter(Boolean))].sort()
  const upcomingDates = dates.filter((date) => date >= today)

  return upcomingDates.length ? upcomingDates : dates
}

export function getAvailableDatePrices(routes = [], filters = {}) {
  return routes.filter((route) => matchesRouteFilters(route, filters)).reduce((prices, route) => {
    const date = getRouteDate(route)
    const value = Number(route.value ?? route.raw?.valor ?? 0)

    if (!date || !value || Number.isNaN(value)) {
      return prices
    }

    const current = prices[date]
    prices[date] = current ? Math.min(current, value) : value
    return prices
  }, {})
}

export function formatDateChip(date) {
  if (!date) {
    return { weekday: '', dayMonth: '' }
  }

  const [year, month, day] = date.split('-').map(Number)
  const parsedDate = new Date(year, month - 1, day)

  if (Number.isNaN(parsedDate.getTime())) {
    return { weekday: '', dayMonth: date }
  }

  return {
    weekday: parsedDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
    dayMonth: parsedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''),
  }
}
