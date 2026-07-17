<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRouter } from 'vue-router'
import { CalendarDays, MapPin, Search, Ship, UsersRound } from '@lucide/vue'
import PublicBoatsSection from '../components/PublicBoatsSection.vue'
import TicketGrid from '../components/TicketGrid.vue'
import heroImage from '../assets/hero-amazonia.jpg'
import { tickets } from '../data'
import { listPublicBoats, listPublicRoutes } from '../services/customerApi'
import { cachePublicRoutes } from '../stores/publicRouteStore'
import { tenantState } from '../stores/tenantStore'
import { getTodayDateInputValue, normalizeApiCollection } from '../utils/formatters'

const today = getTodayDateInputValue()
const router = useRouter()
const routeResults = ref(null)
const boats = ref([])
const loadingBoats = ref(false)
const loadingRoutes = ref(false)
const usingFallback = ref(false)
const searchForm = reactive({
  origin: '',
  destination: '',
  departureDate: today,
  passengers: 1,
  embarcacaoId: '',
})

const initialTickets = computed(() => (routeResults.value ?? tickets).slice(0, 5))
const originOptions = computed(() => getUniqueOptions(routeResults.value || tickets, 'origin'))
const destinationOptions = computed(() => getUniqueOptions(routeResults.value || tickets, 'destination'))
const homeHeroImage = computed(() => tenantState.client.banner_site || tenantState.client.capa || heroImage)
const siteTitle = computed(() => tenantState.client.site_titulo || tenantState.client.name || '')
const siteSubtitle = computed(() => tenantState.client.site_subtitulo || 'Viagens fluviais com reserva simples e segura')
const siteDescription = computed(() => tenantState.client.site_descricao || 'Consulte rotas por data, embarcacao, origem e destino em uma pagina de busca completa.')

onMounted(async () => {
  await loadBoats()
  await fetchInitialRoutes()
})

async function loadBoats() {
  if (!tenantState.clientUid) {
    return
  }

  loadingBoats.value = true

  try {
    const response = await listPublicBoats({
      client_uid: tenantState.clientUid,
    })
    boats.value = normalizeApiCollection(response, 'embarcacoes')
  } catch {
    boats.value = []
  } finally {
    loadingBoats.value = false
  }
}

async function fetchInitialRoutes() {
  if (!tenantState.clientUid) {
    return
  }

  loadingRoutes.value = true
  usingFallback.value = false

  try {
    const response = await listPublicRoutes({
      client_uid: tenantState.clientUid,
      data: today,
    })
    const routes = normalizeApiCollection(response, 'rotas')
    routeResults.value = cachePublicRoutes(routes, today)
  } catch {
    usingFallback.value = true
    routeResults.value = null
  } finally {
    loadingRoutes.value = false
  }
}

function getUniqueOptions(items, key) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))]
}

async function submitHomeSearch() {
  await router.push({
    name: 'filter',
    query: {
      data: searchForm.departureDate,
      passageiros: searchForm.passengers,
      ...(searchForm.origin ? { origem: searchForm.origin } : {}),
      ...(searchForm.destination ? { destino: searchForm.destination } : {}),
      ...(searchForm.embarcacaoId ? { embarcacao_id: searchForm.embarcacaoId } : {}),
    },
  })
}
</script>

<template>
  <main>
    <section class="relative overflow-hidden border-b-4 border-[var(--brand-primary)]">
      <div class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url(${homeHeroImage})` }"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-sky-950/20 via-sky-950/25 to-sky-950/80"></div>

      <div class="relative z-10 mx-auto flex min-h-[560px] max-w-6xl flex-col justify-center px-4 py-16 text-white sm:px-6">
        <p v-if="siteTitle" class="text-sm font-black uppercase tracking-wide text-sky-100">{{ siteTitle }}</p>
        <h1 class="mt-2 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">{{ siteSubtitle }}</h1>
        <p class="mt-3 max-w-2xl text-lg font-bold text-white/90 sm:text-2xl">{{ siteDescription }}</p>

        <div class="mt-8 flex flex-wrap gap-3">
          <RouterLink
            class="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 text-sm font-black text-white shadow-lg transition hover:brightness-95"
            :to="{ name: 'filter', query: { data: today } }"
          >
            <Search class="size-4" />
            Buscar passagens
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <form class="rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70" @submit.prevent="submitHomeSearch">
          <div class="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_0.8fr_auto]">
            <label class="flex h-12 items-center gap-2 rounded border border-slate-300 px-3 text-slate-600">
              <MapPin class="size-4 text-[var(--brand-primary)]" />
              <select v-model="searchForm.origin" class="w-full bg-transparent text-sm font-semibold outline-none">
                <option value="">Origem</option>
                <option v-for="origin in originOptions" :key="origin" :value="origin">{{ origin }}</option>
              </select>
            </label>

            <label class="flex h-12 items-center gap-2 rounded border border-slate-300 px-3 text-slate-600">
              <MapPin class="size-4 text-[var(--brand-primary)]" />
              <select v-model="searchForm.destination" class="w-full bg-transparent text-sm font-semibold outline-none">
                <option value="">Destino</option>
                <option v-for="destination in destinationOptions" :key="destination" :value="destination">
                  {{ destination }}
                </option>
              </select>
            </label>

            <label class="flex h-12 items-center gap-2 rounded border border-slate-300 px-3 text-slate-600">
              <CalendarDays class="size-4 text-[var(--brand-primary)]" />
              <input v-model="searchForm.departureDate" required class="w-full bg-transparent text-sm font-semibold outline-none" type="date" />
            </label>

            <label class="flex h-12 items-center gap-2 rounded border border-slate-300 px-3 text-slate-600">
              <UsersRound class="size-4 text-[var(--brand-primary)]" />
              <select v-model.number="searchForm.passengers" class="w-full bg-transparent text-sm font-semibold outline-none">
                <option :value="1">1 Passageiro</option>
                <option :value="2">2 Passageiros</option>
                <option :value="3">3 Passageiros</option>
                <option :value="4">4 Passageiros</option>
                <option :value="5">5 Passageiros</option>
              </select>
            </label>

            <button
              class="inline-flex h-12 items-center justify-center gap-2 rounded bg-[var(--brand-primary)] px-6 text-sm font-black uppercase text-white transition hover:brightness-95"
              type="submit"
            >
              <Search class="size-4" />
              Buscar
            </button>
          </div>

          <div class="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <label class="flex h-12 items-center gap-2 rounded border border-slate-300 px-3 text-slate-600">
              <Ship class="size-4 text-[var(--brand-primary)]" />
              <select v-model="searchForm.embarcacaoId" class="w-full bg-transparent text-sm font-semibold outline-none">
                <option value="">Todas as embarcacoes</option>
                <option v-for="boat in boats" :key="boat.id" :value="boat.id">{{ boat.nome }}</option>
              </select>
            </label>

            <RouterLink class="inline-flex h-12 items-center justify-center rounded border border-slate-300 px-5 text-sm font-black text-sky-950" :to="{ name: 'filter', query: { data: today } }">
              Busca avancada
            </RouterLink>
          </div>
        </form>
      </div>
    </section>

    <PublicBoatsSection
      :boats="boats"
      :loading="loadingBoats"
      link-mode
      :base-query="{ data: today }"
    />

    <TicketGrid
      title="Rotas de hoje"
      :subtitle="usingFallback ? 'Dados de exemplo' : ''"
      :tickets="initialTickets"
      :total-count="initialTickets.length"
      :loading="loadingRoutes"
    />

    <section class="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
      <RouterLink
        class="inline-flex h-12 items-center justify-center gap-2 rounded bg-[var(--brand-primary)] px-6 text-sm font-black uppercase text-white transition hover:brightness-95"
        :to="{ name: 'filter', query: { data: today } }"
      >
        <Ship class="size-4" />
        Ver todas as rotas e filtros
      </RouterLink>
    </section>
  </main>
</template>
