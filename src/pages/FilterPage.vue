<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CalendarDays, MapPin, Search, Ship, UsersRound } from '@lucide/vue'
import TicketGrid from '../components/TicketGrid.vue'
import { tickets } from '../data'
import { listPublicBoats, listPublicRoutes } from '../services/customerApi'
import { cachePublicRoutes } from '../stores/publicRouteStore'
import { tenantState } from '../stores/tenantStore'
import { formatDateBr, getTodayDateInputValue, normalizeApiCollection } from '../utils/formatters'

const route = useRoute()
const router = useRouter()

const tripSearch = reactive({
  origin: route.query.origem || '',
  destination: route.query.destino || '',
  departureDate: route.query.data || getTodayDateInputValue(),
  passengers: Number(route.query.passageiros || 1),
  tripType: 'round_trip',
  embarcacaoId: route.query.embarcacao_id || '',
})

const routeResults = ref(null)
const boats = ref([])
const apiSummary = ref(null)
const loadingBoats = ref(false)
const loadingRoutes = ref(false)
const routesError = ref('')
const usingFallback = ref(false)
const selectedPriceRanges = ref([])

const priceRanges = [
  { label: 'R$ 0 - R$ 100', min: 0, max: 100 },
  { label: 'R$ 100 - R$ 200', min: 100, max: 200 },
  { label: 'R$ 200 - R$ 300', min: 200, max: 300 },
  { label: 'R$ 300 - R$ 400', min: 300, max: 400 },
  { label: 'R$ 400 - R$ 500', min: 400, max: 500 },
]

const visibleTickets = computed(() => {
  const source = routeResults.value ?? tickets

  return source.filter((ticket) => {
    const originMatches = !tripSearch.origin || ticket.origin === tripSearch.origin
    const destinationMatches = !tripSearch.destination || ticket.destination === tripSearch.destination
    const priceMatches = !selectedPriceRanges.value.length || selectedPriceRanges.value.some((rangeLabel) => {
      const range = priceRanges.find((item) => item.label === rangeLabel)
      return range && Number(ticket.value || 0) >= range.min && Number(ticket.value || 0) <= range.max
    })

    return originMatches && destinationMatches && priceMatches
  })
})

const originOptions = computed(() => getUniqueOptions(routeResults.value || tickets, 'origin'))
const destinationOptions = computed(() => getUniqueOptions(routeResults.value || tickets, 'destination'))
const selectedBoat = computed(() => boats.value.find((boat) => String(boat.id) === String(tripSearch.embarcacaoId)))

onMounted(async () => {
  await loadBoats()
  await fetchRoutes()
})

function getUniqueOptions(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))]
}

async function loadBoats() {
  if (!tenantState.clientUid) {
    return
  }

  loadingBoats.value = true

  try {
    const response = await listPublicBoats({ client_uid: tenantState.clientUid })
    boats.value = normalizeApiCollection(response, 'embarcacoes')
  } catch {
    boats.value = []
  } finally {
    loadingBoats.value = false
  }
}

async function submitSearch() {
  await router.replace({
    name: 'filter',
    query: {
      data: tripSearch.departureDate,
      passageiros: tripSearch.passengers,
      ...(tripSearch.origin ? { origem: tripSearch.origin } : {}),
      ...(tripSearch.destination ? { destino: tripSearch.destination } : {}),
      ...(tripSearch.embarcacaoId ? { embarcacao_id: tripSearch.embarcacaoId } : {}),
    },
  })
  await fetchRoutes()
}

async function selectBoat(boatId) {
  tripSearch.embarcacaoId = boatId
  await submitSearch()
}

async function fetchRoutes() {
  if (!tenantState.clientUid) {
    routeResults.value = null
    return
  }

  loadingRoutes.value = true
  routesError.value = ''
  usingFallback.value = false

  try {
    const params = {
      client_uid: tenantState.clientUid,
      data: tripSearch.departureDate,
    }

    if (tripSearch.embarcacaoId) {
      params.embarcacao_id = tripSearch.embarcacaoId
    }

    const response = await listPublicRoutes(params)
    const routes = normalizeApiCollection(response, 'rotas')
    const responseBoat = response?.embarcacao || selectedBoat.value || null

    apiSummary.value = {
      date: response?.data || tripSearch.departureDate,
      weekday: response?.dia_semana || '',
      total: response?.total ?? routes.length,
      boat: responseBoat,
    }
    routeResults.value = cachePublicRoutes(routes, tripSearch.departureDate, responseBoat)
  } catch (error) {
    routesError.value = error.message
    usingFallback.value = true
    routeResults.value = null
    apiSummary.value = {
      date: tripSearch.departureDate,
      weekday: '',
      total: tickets.length,
      boat: selectedBoat.value || null,
    }
  } finally {
    loadingRoutes.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-slate-50">
    <section class="bg-[var(--brand-secondary)] pb-32 pt-8 text-white">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-4 sm:px-6">
        <div>
          <RouterLink
            class="inline-flex h-11 items-center gap-2 rounded-full border border-white/80 px-5 text-sm font-black text-white transition hover:bg-white/10"
            to="/"
          >
            <ArrowLeft class="size-4" />
            Voltar para pagina inicial
          </RouterLink>
          <h1 class="mt-8 text-3xl font-black tracking-normal sm:text-4xl">Encontre sua passagem</h1>
          <p class="mt-2 max-w-xl text-sm font-semibold text-white/75">
            Escolha data, origem, destino ou embarcacao para ver somente as rotas disponiveis.
          </p>
        </div>

        <div class="hidden rounded-lg border border-white/15 bg-white/10 px-5 py-4 text-right shadow-lg shadow-sky-950/20 backdrop-blur md:block">
          <p class="text-xs font-black uppercase text-white/60">Consulta publica</p>
          <p class="mt-1 text-lg font-black">{{ apiSummary?.weekday || 'Rotas do dia' }}</p>
        </div>
      </div>
    </section>

    <section class="-mt-24">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="inline-flex overflow-hidden rounded-t-lg bg-white text-sm font-bold shadow-xl">
          <button class="flex h-16 items-center gap-2 bg-white px-6 text-[var(--brand-primary)]">
            <MapPin class="size-4" />
            Origem e destino
          </button>
          <button class="flex h-16 items-center gap-2 border-l border-slate-200 px-6 text-slate-400">
            <Ship class="size-4" />
            Embarcações
          </button>
        </div>

        <form class="rounded-b-lg rounded-tr-lg border border-[var(--brand-primary)] bg-white p-5 shadow-xl sm:p-6" @submit.prevent="submitSearch">
          <div class="mb-4 flex w-max overflow-hidden rounded-lg border border-slate-300 bg-slate-100 text-sm font-bold">
            <button
              type="button"
              class="h-10 px-7"
              :class="tripSearch.tripType === 'round_trip' ? 'bg-[var(--brand-primary)] text-white' : 'text-slate-500'"
              @click="tripSearch.tripType = 'round_trip'"
            >
              Ida e volta
            </button>
            <button
              type="button"
              class="h-10 px-7"
              :class="tripSearch.tripType === 'one_way' ? 'bg-[var(--brand-primary)] text-white' : 'text-slate-500'"
              @click="tripSearch.tripType = 'one_way'"
            >
              Somente ida
            </button>
          </div>

          <div class="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_0.85fr_auto]">
            <label class="flex h-14 items-center gap-2 rounded-lg border border-slate-400 px-4 text-slate-500">
              <MapPin class="size-5 text-[var(--brand-primary)]" />
              <select v-model="tripSearch.origin" class="w-full bg-transparent font-semibold outline-none">
                <option value="">Origem</option>
                <option v-for="origin in originOptions" :key="origin" :value="origin">{{ origin }}</option>
              </select>
            </label>

            <label class="flex h-14 items-center gap-2 rounded-lg border border-slate-400 px-4 text-slate-700">
              <MapPin class="size-5 text-[var(--brand-primary)]" />
              <select v-model="tripSearch.destination" class="w-full bg-transparent font-semibold outline-none">
                <option value="">Destino</option>
                <option v-for="destination in destinationOptions" :key="destination" :value="destination">
                  {{ destination }}
                </option>
              </select>
            </label>

            <label class="flex h-14 items-center gap-2 rounded-lg border border-slate-400 px-4 text-slate-500">
              <CalendarDays class="size-5 text-[var(--brand-primary)]" />
              <input v-model="tripSearch.departureDate" required class="w-full bg-transparent font-semibold outline-none" type="date" />
            </label>

            <label class="flex h-14 items-center gap-2 rounded-lg border border-slate-400 px-4 text-slate-700">
              <UsersRound class="size-5 text-[var(--brand-primary)]" />
              <select v-model.number="tripSearch.passengers" class="w-full bg-transparent font-semibold outline-none">
                <option :value="1">1 Passageiro</option>
                <option :value="2">2 Passageiros</option>
                <option :value="3">3 Passageiros</option>
              </select>
            </label>

            <button
              class="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-7 text-sm font-black text-white transition hover:brightness-95 disabled:bg-slate-300"
              :disabled="loadingRoutes"
            >
              <Search class="size-5" />
              {{ loadingRoutes ? 'Buscando...' : 'Buscar' }}
            </button>
          </div>
        </form>
      </div>
    </section>

    <section class="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside class="lg:sticky lg:top-24 lg:self-start">
        <div class="mb-5 flex items-center gap-6">
          <h2 class="text-xl font-black text-slate-900">Filtre por:</h2>
          <span class="h-5 w-px bg-slate-900"></span>
        </div>

        <div class="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-lg shadow-slate-200/70">
          <div class="bg-[var(--brand-secondary)] px-4 py-3 text-center text-base font-black text-white">
            Embarcações
          </div>
          <div class="grid gap-3 p-4 text-base font-semibold text-slate-800">
            <label class="flex items-center gap-2">
              <input :checked="!tripSearch.embarcacaoId" type="checkbox" @change="selectBoat('')" />
              Todas
            </label>
            <label v-for="boat in boats" :key="boat.id" class="flex items-center gap-2">
              <input
                :checked="String(tripSearch.embarcacaoId) === String(boat.id)"
                type="checkbox"
                @change="selectBoat(boat.id)"
              />
              {{ boat.nome }}
            </label>
            <p v-if="loadingBoats" class="text-sm font-bold text-slate-400">Carregando...</p>
          </div>
        </div>

        <div class="mt-6 overflow-hidden rounded-lg border border-slate-100 bg-white shadow-lg shadow-slate-200/70">
          <div class="bg-[var(--brand-secondary)] px-4 py-3 text-center text-base font-black text-white">
            Preço
          </div>
          <div class="grid gap-3 p-4 text-base font-semibold text-slate-800">
            <label v-for="range in priceRanges" :key="range.label" class="flex items-center gap-2">
              <input v-model="selectedPriceRanges" :value="range.label" type="checkbox" />
              {{ range.label }}
            </label>
          </div>
        </div>
      </aside>

      <div class="min-w-0">
        <div class="mb-10 grid gap-4 sm:grid-cols-3">
          <div class="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <p class="text-xs font-black uppercase text-slate-400">Data</p>
            <p class="mt-1 text-lg font-black text-sky-950">{{ formatDateBr(apiSummary?.date || tripSearch.departureDate) }}</p>
          </div>
          <div class="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <p class="text-xs font-black uppercase text-slate-400">Rotas</p>
            <p class="mt-1 text-lg font-black text-sky-950">{{ visibleTickets.length }}</p>
          </div>
          <div class="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <p class="text-xs font-black uppercase text-slate-400">Embarcação</p>
            <p class="mt-1 truncate text-lg font-black text-sky-950">{{ selectedBoat?.nome || 'Todas' }}</p>
          </div>
        </div>

        <p v-if="routesError" class="mb-4 rounded bg-amber-50 p-4 text-sm font-bold text-amber-800">
          Nao foi possivel carregar a API agora. Mostrando dados de exemplo para desenvolvimento.
        </p>

        <TicketGrid
          title="Rotas disponiveis"
          :subtitle="usingFallback ? 'Dados de exemplo' : ''"
          :tickets="visibleTickets"
          :total-count="visibleTickets.length"
          :loading="loadingRoutes"
          embedded
        />
      </div>
    </section>
  </main>
</template>
