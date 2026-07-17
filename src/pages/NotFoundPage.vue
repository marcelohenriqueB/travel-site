<script setup>
import { computed } from 'vue'
import { Compass } from '@lucide/vue'
import { tenantState } from '../stores/tenantStore'

const title = computed(() => (tenantState.notFound ? 'Dominio nao encontrado' : 'Pagina nao encontrada'))
const description = computed(() =>
  tenantState.notFound
    ? 'Nao encontramos uma empresa vinculada a este dominio.'
    : 'O endereco acessado nao existe ou nao esta mais disponivel.',
)
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-slate-950 px-4 py-12 text-white">
    <section class="w-full max-w-xl text-center">
      <div class="mx-auto grid size-16 place-items-center rounded-lg bg-white/10">
        <Compass class="size-8 text-sky-300" />
      </div>
      <p class="mt-8 text-sm font-black uppercase text-sky-300">404</p>
      <h1 class="mt-2 text-4xl font-black tracking-normal sm:text-5xl">{{ title }}</h1>
      <p class="mx-auto mt-4 max-w-md text-base font-semibold text-white/70">{{ description }}</p>
    </section>
  </main>
</template>
