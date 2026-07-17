<script setup>
import { reactive, watch } from 'vue'
import { CalendarDays, Filter, MapPin, Search, Ship, UsersRound } from '@lucide/vue'
import heroImage from '../assets/hero-amazonia.jpg'
import { getTodayDateInputValue } from '../utils/formatters'

const props = defineProps({
  boats: {
    type: Array,
    default: () => [],
  },
  originOptions: {
    type: Array,
    default: () => [],
  },
  destinationOptions: {
    type: Array,
    default: () => [],
  },
  loadingRoutes: {
    type: Boolean,
    default: false,
  },
  selectedBoatId: {
    type: [String, Number],
    default: '',
  },
  initialDate: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['search', 'filter'])

const form = reactive({
  origin: '',
  destination: '',
  departureDate: getTodayDateInputValue(),
  passengers: 1,
  tripType: 'one_way',
  embarcacaoId: '',
})

if (props.initialDate) {
  form.departureDate = props.initialDate
}

if (props.selectedBoatId) {
  form.embarcacaoId = props.selectedBoatId
}

watch(
  () => [form.origin, form.destination],
  () => emit('filter', { origin: form.origin, destination: form.destination }),
)

watch(
  () => props.selectedBoatId,
  (boatId) => {
    form.embarcacaoId = boatId || ''
  },
)

function submitSearch() {
  emit('search', { ...form })
}
</script>

<template>
  <section class="relative overflow-hidden border-b-4 border-[var(--brand-primary)]">
    <div class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url(${heroImage})` }"></div>
    <div class="absolute inset-0 bg-gradient-to-b from-sky-950/20 via-sky-950/25 to-sky-950/80"></div>

    <div class="relative z-10 mx-auto flex min-h-[620px] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
      <div class="max-w-3xl text-white drop-shadow">
        <p class="text-sm font-black uppercase tracking-wide text-sky-100">Rotas publicas por cliente</p>
        <h1 class="mt-2 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
          Encontre viagens disponiveis pela data e embarcacao
        </h1>
        <p class="mt-3 max-w-2xl text-lg font-bold text-white/90 sm:text-2xl">
          A disponibilidade vem direto dos endpoints publicos do seu backend.
        </p>
      </div>

      <div class="mt-8 w-full max-w-5xl">
        <div class="inline-flex overflow-hidden rounded-t-lg bg-white text-sm font-bold shadow-xl">
          <button class="flex h-12 items-center gap-2 bg-white px-5 text-[var(--brand-primary)]">
            <CalendarDays class="size-4" />
            Buscar rotas
          </button>
          <button class="flex h-12 items-center gap-2 border-l border-slate-100 px-5 text-slate-400">
            <Ship class="size-4" />
            Embarcacoes
          </button>
        </div>

        <form class="rounded-b-lg rounded-tr-lg bg-white p-4 shadow-2xl sm:p-5" @submit.prevent="submitSearch">
          <div class="grid gap-3 lg:grid-cols-[1fr_1.4fr_1fr_auto]">
            <label class="flex h-12 items-center gap-2 rounded border border-slate-300 px-3 text-slate-600">
              <CalendarDays class="size-4 text-[var(--brand-primary)]" />
              <input v-model="form.departureDate" required class="w-full bg-transparent text-sm font-semibold outline-none" type="date" />
            </label>

            <label class="flex h-12 items-center gap-2 rounded border border-slate-300 px-3 text-slate-600">
              <Ship class="size-4 text-[var(--brand-primary)]" />
              <select v-model="form.embarcacaoId" class="w-full bg-transparent text-sm font-semibold outline-none">
                <option value="">Todas as embarcacoes</option>
                <option v-for="boat in boats" :key="boat.id" :value="boat.id">
                  {{ boat.nome }}
                </option>
              </select>
            </label>

            <label class="flex h-12 items-center gap-2 rounded border border-slate-300 px-3 text-slate-600">
              <UsersRound class="size-4 text-[var(--brand-primary)]" />
              <select v-model.number="form.passengers" class="w-full bg-transparent text-sm font-semibold outline-none">
                <option :value="1">1 Passageiro</option>
                <option :value="2">2 Passageiros</option>
                <option :value="3">3 Passageiros</option>
              </select>
            </label>

            <button type="submit" class="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 text-sm font-black text-white shadow-lg shadow-sky-200 transition disabled:bg-slate-300" :disabled="loadingRoutes">
              <Search class="size-4" />
              {{ loadingRoutes ? 'Buscando...' : 'Buscar' }}
            </button>
          </div>

          <div class="mt-3 grid gap-3 md:grid-cols-2">
            <label class="flex h-12 items-center gap-2 rounded border border-slate-300 px-3 text-slate-600">
              <MapPin class="size-4 text-[var(--brand-primary)]" />
              <select v-model="form.origin" class="w-full bg-transparent text-sm font-semibold outline-none">
                <option value="">Todas as origens</option>
                <option v-for="origin in originOptions" :key="origin" :value="origin">{{ origin }}</option>
              </select>
            </label>

            <label class="flex h-12 items-center gap-2 rounded border border-slate-300 px-3 text-slate-600">
              <Filter class="size-4 text-[var(--brand-primary)]" />
              <select v-model="form.destination" class="w-full bg-transparent text-sm font-semibold outline-none">
                <option value="">Todos os destinos</option>
                <option v-for="destination in destinationOptions" :key="destination" :value="destination">
                  {{ destination }}
                </option>
              </select>
            </label>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
