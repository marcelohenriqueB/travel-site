<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CalendarDays, Copy, ExternalLink, QrCode, Ship, UsersRound } from '@lucide/vue'
import { getCustomerReservation } from '../services/customerApi'
import { authState } from '../stores/authStore'
import { formatDateBr } from '../utils/formatters'

const route = useRoute()
const router = useRouter()
const reservation = ref(null)
const loading = ref(false)
const error = ref('')
const copied = ref(false)

onMounted(async () => {
  if (!authState.access) {
    await router.replace({ name: 'login', query: { redirect: route.fullPath } })
    return
  }

  await fetchReservation()
})

async function fetchReservation() {
  loading.value = true
  error.value = ''

  try {
    const response = await getCustomerReservation(route.params.id, authState.access)
    reservation.value = response?.data || response?.reserva || response
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function copyPixCode() {
  if (!reservation.value?.code_pix) {
    return
  }

  await navigator.clipboard.writeText(reservation.value.code_pix)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1800)
}

function formatMoney(value) {
  const numberValue = Number(String(value || '0').replace(',', '.'))
  return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
    <section class="mx-auto max-w-5xl">
      <RouterLink class="inline-flex items-center gap-2 text-sm font-black text-sky-700" :to="{ name: 'customer-reservations' }">
        <ArrowLeft class="size-4" />
        Voltar para minhas reservas
      </RouterLink>

      <div v-if="loading" class="mt-6 grid gap-4">
        <div class="h-36 animate-pulse rounded-lg bg-slate-200"></div>
        <div class="h-72 animate-pulse rounded-lg bg-slate-200"></div>
      </div>

      <p v-else-if="error" class="mt-6 rounded bg-red-50 p-4 text-sm font-bold text-red-700">{{ error }}</p>

      <div v-else-if="reservation" class="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section class="rounded-lg bg-white p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-sm font-black uppercase text-[var(--brand-primary)]">Reserva #{{ reservation.id }}</p>
              <h1 class="mt-1 text-3xl font-black text-sky-950">
                {{ reservation.rota?.saindo_de || 'Origem' }} para {{ reservation.rota?.indo_para || 'Destino' }}
              </h1>
              <p class="mt-2 text-sm font-bold text-slate-500">{{ reservation.embarcacao?.nome || reservation.rota?.nome }}</p>
            </div>
            <div class="text-right">
              <span class="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                {{ reservation.status_reserva }}
              </span>
              <p class="mt-2 text-3xl font-black text-sky-950">{{ formatMoney(reservation.valor_total) }}</p>
            </div>
          </div>

          <div class="mt-6 grid gap-3 sm:grid-cols-3">
            <div class="rounded-lg bg-slate-50 p-4">
              <CalendarDays class="size-5 text-[var(--brand-primary)]" />
              <p class="mt-2 text-xs font-black uppercase text-slate-400">Data</p>
              <p class="font-black text-sky-950">{{ formatDateBr(reservation.data_reserva) }}</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-4">
              <Ship class="size-5 text-[var(--brand-primary)]" />
              <p class="mt-2 text-xs font-black uppercase text-slate-400">Pagamento</p>
              <p class="font-black text-sky-950">{{ reservation.forma_pagamento }}</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-4">
              <UsersRound class="size-5 text-[var(--brand-primary)]" />
              <p class="mt-2 text-xs font-black uppercase text-slate-400">Passageiros</p>
              <p class="font-black text-sky-950">{{ reservation.passageiros?.length || 0 }}</p>
            </div>
          </div>

          <section class="mt-6">
            <h2 class="text-xl font-black text-sky-950">Passageiros</h2>
            <div class="mt-3 grid gap-3">
              <div v-for="passenger in reservation.passageiros" :key="passenger.id" class="rounded-lg border border-slate-200 p-4">
                <p class="font-black text-sky-950">{{ passenger.nome }}</p>
                <p class="mt-1 text-sm font-bold text-slate-500">
                  {{ passenger.documento }} · {{ formatDateBr(passenger.data_nascimento) }}
                </p>
                <p v-if="passenger.pcd || passenger.suite" class="mt-2 text-xs font-black uppercase text-sky-600">
                  {{ passenger.pcd ? 'PCD' : '' }} {{ passenger.suite ? 'Suite' : '' }}
                </p>
              </div>
            </div>
          </section>

          <section v-if="reservation.adicionais?.length" class="mt-6">
            <h2 class="text-xl font-black text-sky-950">Adicionais</h2>
            <div class="mt-3 grid gap-3">
              <div v-for="item in reservation.adicionais" :key="item.id" class="flex justify-between gap-4 rounded-lg border border-slate-200 p-4">
                <div>
                  <p class="font-black text-sky-950">{{ item.nome }}</p>
                  <p class="text-sm font-bold text-slate-500">Quantidade: {{ item.quantidade }} · Usado: {{ item.quantidade_usada }}</p>
                </div>
                <p class="font-black text-sky-950">{{ formatMoney(item.valor_total) }}</p>
              </div>
            </div>
          </section>
        </section>

        <aside class="h-max rounded-lg bg-white p-5 shadow-sm">
          <img
            v-if="reservation.embarcacao?.foto_url"
            class="h-44 w-full rounded object-cover"
            :src="reservation.embarcacao.foto_url"
            :alt="reservation.embarcacao.nome"
          />

          <div class="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-black uppercase text-slate-400">Status do pagamento</p>
            <p class="mt-1 text-lg font-black" :class="reservation.pago ? 'text-emerald-700' : 'text-amber-700'">
              {{ reservation.pago ? 'Pago' : 'Pendente' }}
            </p>
          </div>

          <div v-if="reservation.code_pix || reservation.qr_code_pix" class="mt-5 rounded-lg border border-slate-200 p-4">
            <div class="flex items-center gap-2 text-sm font-black text-sky-950">
              <QrCode class="size-4 text-[var(--brand-primary)]" />
              PIX
            </div>
            <img
              v-if="reservation.qr_code_pix"
              class="mx-auto mt-4 size-48 rounded bg-white object-contain p-2"
              :src="`data:image/png;base64,${reservation.qr_code_pix}`"
              alt="QR Code PIX"
            />
            <button
              v-if="reservation.code_pix"
              class="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded bg-[var(--brand-primary)] text-sm font-black text-white"
              type="button"
              @click="copyPixCode"
            >
              <Copy class="size-4" />
              {{ copied ? 'Copiado' : 'Copiar codigo PIX' }}
            </button>
          </div>

          <div class="mt-5 grid gap-3">
            <a
              v-if="reservation.link_cobranca"
              class="inline-flex h-11 items-center justify-center gap-2 rounded border border-slate-300 px-4 text-sm font-black text-sky-950"
              :href="reservation.link_cobranca"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink class="size-4" />
              Abrir cobranca
            </a>
            <a
              v-if="reservation.link_reserva"
              class="inline-flex h-11 items-center justify-center gap-2 rounded bg-[var(--brand-primary)] px-4 text-sm font-black text-white"
              :href="reservation.link_reserva"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink class="size-4" />
              Abrir reserva
            </a>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>
