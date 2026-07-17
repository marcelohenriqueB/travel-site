<script setup>
import { computed } from 'vue'
import { Bed, CalendarDays, Clock, Ship, Ticket, Users, Utensils, Waves } from '@lucide/vue'
import { RouterLink } from 'vue-router'
import { formatDateBr } from '../utils/formatters'

const props = defineProps({
  title: {
    type: String,
    default: 'Rotas disponiveis',
  },
  subtitle: {
    type: String,
    default: '',
  },
  tickets: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  totalCount: {
    type: Number,
    default: null,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
})

const resultCount = computed(() => props.totalCount ?? props.tickets.length)
</script>

<template>
  <section :class="embedded ? 'py-0' : 'mx-auto max-w-6xl px-4 py-12 sm:px-6'">
    <div class="flex flex-wrap items-end justify-between gap-5">
      <div>
        <h2 class="text-2xl font-black uppercase tracking-normal text-sky-950">{{ title }}</h2>
        <p v-if="subtitle" class="mt-1 text-sm font-semibold text-slate-500">{{ subtitle }}</p>
      </div>
      <div class="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-black text-sky-950">
        <Ticket class="size-4 text-[var(--brand-primary)]" />
        {{ resultCount }} resultado{{ resultCount === 1 ? '' : 's' }}
      </div>
    </div>

    <div v-if="loading" class="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <div v-for="item in 4" :key="item" class="h-[430px] animate-pulse rounded-lg bg-slate-200"></div>
    </div>

    <div v-else-if="!tickets.length" class="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 class="text-xl font-black text-sky-950">Nenhuma rota encontrada</h3>
      <p class="mt-2 text-sm font-semibold text-slate-500">Tente outra data, embarcacao, origem ou destino.</p>
    </div>

    <div v-else class="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="ticket in tickets"
        :key="ticket.id"
        class="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
      >
        <img class="h-40 w-full object-cover transition duration-300 group-hover:scale-105" :src="ticket.image" :alt="ticket.boat" />
        <div class="p-4">
          <p class="text-xs font-bold uppercase text-slate-400">{{ ticket.type }}</p>
          <h3 class="mt-1 min-h-12 text-lg font-black leading-tight text-sky-950">
            {{ ticket.origin }} x {{ ticket.destination }}
          </h3>
          <p class="truncate text-sm font-bold text-slate-500">{{ ticket.boat }}</p>

          <div class="mt-4 grid gap-2 rounded-lg bg-slate-50 p-3 text-xs font-bold text-slate-500">
            <div class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-2">
                <CalendarDays class="size-4 shrink-0 text-[var(--brand-primary)]" />
                Data
              </span>
              <strong class="whitespace-nowrap text-sky-950">{{ formatDateBr(ticket.departure) }}</strong>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="flex items-center gap-2">
                <Clock class="size-4 shrink-0 text-[var(--brand-primary)]" />
                Partida
              </span>
              <strong class="whitespace-nowrap text-sky-950">{{ ticket.departureTime || '--:--' }}</strong>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-bold text-slate-400">Valor</p>
              <p class="truncate text-2xl font-black text-sky-950">{{ ticket.price }}</p>
            </div>
            <div class="shrink-0 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              <Users class="mr-1 inline size-3" />
              {{ ticket.seats == null ? 'A confirmar' : `${ticket.seats} vagas` }}
            </div>
          </div>

          <div class="mt-4 flex gap-2 text-sky-950">
            <span class="grid size-8 place-items-center rounded-full bg-sky-50"><Bed class="size-4" /></span>
            <span class="grid size-8 place-items-center rounded-full bg-sky-50"><Utensils class="size-4" /></span>
            <span class="grid size-8 place-items-center rounded-full bg-sky-50"><Waves class="size-4" /></span>
          </div>

          <RouterLink
            :data-testid="`reserve-ticket-${ticket.id}`"
            class="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded bg-[var(--brand-primary)] text-sm font-black text-white transition hover:brightness-95"
            :to="`/reserva/${ticket.id}`"
          >
            <Ship class="size-4" />
            Reservar
          </RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>
