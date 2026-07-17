<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, ReceiptText, Search } from '@lucide/vue'
import { listCustomerReservations } from '../services/customerApi'
import { authState } from '../stores/authStore'
import { formatDateBr } from '../utils/formatters'

const router = useRouter()
const reservations = ref([])
const loading = ref(false)
const error = ref('')
const pagination = ref(null)
const total = ref(0)
const filters = reactive({
  status: '',
  page: 1,
  perPage: 10,
})

const statusOptions = [
  { label: 'Todas', value: '' },
  { label: 'Reservada', value: 'RESERVADA' },
  { label: 'Aguardando embarque', value: 'AGUARDANDO_EMBARQUE' },
  { label: 'Cancelada', value: 'CANCELADA' },
]

const pageLabel = computed(() => {
  if (!pagination.value) {
    return `Pagina ${filters.page}`
  }

  return `Pagina ${pagination.value.current_page} de ${pagination.value.num_pages}`
})

onMounted(async () => {
  if (!authState.access) {
    await router.replace({ name: 'login', query: { redirect: '/minhas-reservas' } })
    return
  }

  await fetchReservations()
})

watch(
  () => filters.status,
  async () => {
    filters.page = 1
    await fetchReservations()
  },
)

async function fetchReservations() {
  if (!authState.access) {
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await listCustomerReservations(
      {
        page: filters.page,
        per_page: filters.perPage,
        ...(filters.status ? { status: filters.status } : {}),
      },
      authState.access,
    )

    reservations.value = response?.reservas || []
    pagination.value = response?.pagination || null
    total.value = response?.total || reservations.value.length
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function goToPage(page) {
  filters.page = page
  await fetchReservations()
}

function formatMoney(value) {
  const numberValue = Number(String(value || '0').replace(',', '.'))
  return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
    <section class="mx-auto max-w-6xl">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm font-black uppercase text-[var(--brand-primary)]">Cliente</p>
          <h1 class="text-3xl font-black text-sky-950">Minhas reservas</h1>
          <p class="mt-1 text-sm font-semibold text-slate-500">Acompanhe suas reservas, pagamentos e links de embarque.</p>
        </div>

        <label class="flex h-11 items-center gap-2 rounded border border-slate-300 bg-white px-3 text-sm font-black text-slate-600">
          <Search class="size-4 text-[var(--brand-primary)]" />
          <select v-model="filters.status" class="bg-transparent outline-none">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
      </div>

      <div class="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <p class="text-sm font-black text-sky-950">{{ total }} reserva{{ total === 1 ? '' : 's' }}</p>
          <p class="text-sm font-bold text-slate-500">{{ pageLabel }}</p>
        </div>

        <div v-if="loading" class="grid gap-3 p-4">
          <div v-for="item in 4" :key="item" class="h-28 animate-pulse rounded bg-slate-100"></div>
        </div>

        <div v-else-if="error" class="p-4">
          <p class="rounded bg-red-50 p-3 text-sm font-bold text-red-700">{{ error }}</p>
        </div>

        <div v-else-if="!reservations.length" class="p-8 text-center">
          <ReceiptText class="mx-auto size-10 text-slate-300" />
          <h2 class="mt-3 text-xl font-black text-sky-950">Nenhuma reserva encontrada</h2>
          <p class="mt-1 text-sm font-semibold text-slate-500">Quando voce reservar uma viagem, ela aparece aqui.</p>
        </div>

        <div v-else class="divide-y divide-slate-200">
          <article v-for="reservation in reservations" :key="reservation.id" class="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
            <div class="flex gap-4">
              <img
                v-if="reservation.embarcacao?.foto_url"
                class="hidden size-20 rounded object-cover sm:block"
                :src="reservation.embarcacao.foto_url"
                :alt="reservation.embarcacao.nome"
              />
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="text-lg font-black text-sky-950">
                    {{ reservation.rota?.saindo_de || 'Origem' }} para {{ reservation.rota?.indo_para || 'Destino' }}
                  </h2>
                  <span class="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                    {{ reservation.status_reserva }}
                  </span>
                  <span v-if="reservation.pago" class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    Pago
                  </span>
                </div>
                <p class="mt-1 text-sm font-bold text-slate-500">{{ reservation.embarcacao?.nome || reservation.rota?.nome }}</p>
                <div class="mt-3 flex flex-wrap gap-4 text-sm font-bold text-slate-600">
                  <span class="inline-flex items-center gap-2">
                    <CalendarDays class="size-4 text-[var(--brand-primary)]" />
                    {{ formatDateBr(reservation.data_reserva) }}
                  </span>
                  <span>{{ reservation.passageiros?.length || 0 }} passageiro{{ reservation.passageiros?.length === 1 ? '' : 's' }}</span>
                  <span>{{ reservation.forma_pagamento }}</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col items-start gap-3 md:items-end">
              <p class="text-2xl font-black text-sky-950">{{ formatMoney(reservation.valor_total) }}</p>
              <RouterLink
                class="inline-flex h-10 items-center gap-2 rounded bg-[var(--brand-primary)] px-4 text-sm font-black text-white"
                :to="{ name: 'reservation-detail', params: { id: reservation.id } }"
              >
                <ExternalLink class="size-4" />
                Ver detalhes
              </RouterLink>
            </div>
          </article>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
          <button
            class="inline-flex h-10 items-center gap-2 rounded border border-slate-300 px-4 text-sm font-black text-slate-600 disabled:opacity-40"
            :disabled="!pagination?.has_previous"
            @click="goToPage(pagination.previous_page)"
          >
            <ChevronLeft class="size-4" />
            Anterior
          </button>
          <button
            class="inline-flex h-10 items-center gap-2 rounded border border-slate-300 px-4 text-sm font-black text-slate-600 disabled:opacity-40"
            :disabled="!pagination?.has_next"
            @click="goToPage(pagination.next_page)"
          >
            Proxima
            <ChevronRight class="size-4" />
          </button>
        </div>
      </div>
    </section>
  </main>
</template>
