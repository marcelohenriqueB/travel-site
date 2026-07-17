<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CircleHelp, LogOut, ReceiptText, ShipWheel, Ticket, UserCircle } from '@lucide/vue'
import { authState, logoutCustomer } from '../stores/authStore'
import { tenantState } from '../stores/tenantStore'

const tenantName = computed(() => tenantState.client.name || '')
const logoInitial = computed(() => tenantName.value.charAt(0).toUpperCase())
const helpLink = computed(() => tenantState.client.site_link_ajuda || '')
</script>

<template>
  <header class="sticky top-0 z-50 bg-[var(--brand-secondary)]/95 text-white shadow-sm backdrop-blur">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
      <RouterLink to="/" class="flex items-center gap-3" :aria-label="tenantName || 'Pagina inicial'">
        <img v-if="tenantState.client.logo" class="max-h-10 max-w-36 object-contain" :src="tenantState.client.logo" :alt="tenantName" />
        <span v-else-if="tenantName" class="grid size-9 place-items-center rounded bg-[var(--brand-primary)] font-black">{{ logoInitial }}</span>
        <span v-if="tenantName" class="hidden text-lg font-bold tracking-wide sm:inline">{{ tenantName }}</span>
      </RouterLink>

      <nav class="hidden items-center gap-8 text-sm font-semibold md:flex" aria-label="Principal">
        <RouterLink class="flex items-center gap-2 transition hover:text-sky-200" :to="{ name: 'filter' }">
          <Ticket class="size-4" />
          Passagens
        </RouterLink>
        <RouterLink class="flex items-center gap-2 transition hover:text-sky-200" :to="{ name: 'filter' }">
          <ShipWheel class="size-4" />
          Embarcacoes
        </RouterLink>
        <a
          v-if="helpLink"
          class="flex items-center gap-2 transition hover:text-sky-200"
          :href="helpLink"
          target="_blank"
          rel="noreferrer"
        >
          <CircleHelp class="size-4" />
          Ajuda
        </a>
        <RouterLink v-else class="flex items-center gap-2 transition hover:text-sky-200" to="/esqueci-senha">
          <CircleHelp class="size-4" />
          Ajuda
        </RouterLink>
        <RouterLink v-if="authState.access" class="flex items-center gap-2 transition hover:text-sky-200" :to="{ name: 'customer-reservations' }">
          <ReceiptText class="size-4" />
          Minhas reservas
        </RouterLink>
      </nav>

      <RouterLink v-if="!authState.access" to="/login" class="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 text-sm font-bold text-white shadow-lg shadow-sky-950/20 transition">
        <UserCircle class="size-4" />
        <span class="hidden sm:inline">Entre ou cadastre-se</span>
      </RouterLink>
      <div v-else class="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-3 text-sm font-bold text-white">
        <RouterLink class="inline-flex items-center gap-2 transition hover:text-sky-200" :to="{ name: 'customer-profile' }">
          <UserCircle class="size-4" />
          <span class="hidden sm:inline">Meu perfil</span>
        </RouterLink>
        <span class="h-4 w-px bg-white/25"></span>
        <button class="inline-flex items-center gap-2 transition hover:text-sky-200" type="button" @click="logoutCustomer">
          <LogOut class="size-4" />
          <span class="hidden sm:inline">Sair</span>
        </button>
      </div>
    </div>
  </header>
</template>
