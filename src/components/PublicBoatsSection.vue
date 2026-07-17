<script setup>
import { Ship, Waypoints } from '@lucide/vue'
import { RouterLink } from 'vue-router'

defineProps({
  boats: {
    type: Array,
    default: () => [],
  },
  selectedBoatId: {
    type: [String, Number],
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  linkMode: {
    type: Boolean,
    default: false,
  },
  baseQuery: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['select'])
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-black uppercase text-[var(--brand-primary)]">Endpoint publico</p>
        <h2 class="text-2xl font-black uppercase text-sky-950">Embarcacoes disponiveis</h2>
      </div>

      <RouterLink
        v-if="linkMode"
        :to="{ name: 'filter', query: baseQuery }"
        class="rounded-full border px-4 py-2 text-sm font-bold"
        :class="!selectedBoatId ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' : 'border-slate-300 bg-white text-slate-600'"
      >
        Todas
      </RouterLink>
      <button
        v-else
        class="rounded-full border px-4 py-2 text-sm font-bold"
        :class="!selectedBoatId ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' : 'border-slate-300 bg-white text-slate-600'"
        @click="emit('select', '')"
      >
        Todas
      </button>
    </div>

    <div v-if="loading" class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="item in 4" :key="item" class="h-48 animate-pulse rounded-lg bg-slate-200"></div>
    </div>

    <div v-else-if="!boats.length" class="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <Ship class="mx-auto size-9 text-slate-400" />
      <h3 class="mt-3 text-lg font-black text-sky-950">Nenhuma embarcacao publicada</h3>
      <p class="mt-1 text-sm font-semibold text-slate-500">Quando o endpoint retornar embarcacoes, elas aparecem aqui.</p>
    </div>

    <div v-else class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <RouterLink
        v-if="linkMode"
        v-for="boat in boats"
        :key="boat.id"
        class="overflow-hidden rounded-lg border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        :class="String(selectedBoatId) === String(boat.id) ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20' : 'border-slate-200'"
        :to="{ name: 'filter', query: { ...baseQuery, embarcacao_id: boat.id } }"
      >
        <img v-if="boat.foto_url || boat.foto" class="h-36 w-full object-cover" :src="boat.foto_url || boat.foto" :alt="boat.nome" />
        <div v-else class="grid h-36 place-items-center bg-sky-50 text-[var(--brand-primary)]">
          <Ship class="size-12" />
        </div>
        <div class="p-4">
          <h3 class="text-lg font-black text-sky-950">{{ boat.nome }}</h3>
          <p class="mt-1 flex items-center gap-2 text-sm font-bold text-slate-500">
            <Waypoints class="size-4 text-[var(--brand-primary)]" />
            {{ boat.rotas_nomes?.length || boat.rotas_ids?.length || 0 }} rotas vinculadas
          </p>
        </div>
      </RouterLink>

      <button
        v-else
        v-for="boat in boats"
        :key="boat.id"
        class="overflow-hidden rounded-lg border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        :class="String(selectedBoatId) === String(boat.id) ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20' : 'border-slate-200'"
        @click="emit('select', boat.id)"
      >
        <img v-if="boat.foto_url || boat.foto" class="h-36 w-full object-cover" :src="boat.foto_url || boat.foto" :alt="boat.nome" />
        <div v-else class="grid h-36 place-items-center bg-sky-50 text-[var(--brand-primary)]">
          <Ship class="size-12" />
        </div>
        <div class="p-4">
          <h3 class="text-lg font-black text-sky-950">{{ boat.nome }}</h3>
          <p class="mt-1 flex items-center gap-2 text-sm font-bold text-slate-500">
            <Waypoints class="size-4 text-[var(--brand-primary)]" />
            {{ boat.rotas_nomes?.length || boat.rotas_ids?.length || 0 }} rotas vinculadas
          </p>
        </div>
      </button>
    </div>
  </section>
</template>
