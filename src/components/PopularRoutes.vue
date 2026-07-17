<script setup>
defineProps({
  routes: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black uppercase text-sky-950">Trajetos mais viajados</h2>
        <div class="mt-4 flex gap-2">
          <button class="rounded-full bg-sky-500 px-4 py-2 text-sm font-bold text-white">Saindo de Manaus</button>
          <button class="rounded-full border border-sky-500 px-4 py-2 text-sm font-bold text-sky-600">Indo para Manaus</button>
        </div>
      </div>
    </div>

    <div class="mt-6 grid gap-5 lg:grid-cols-2">
      <article
        v-for="route in routes"
        :key="`${route.from}-${route.to}`"
        class="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
      >
        <img class="h-32 w-full rounded-md object-cover sm:size-20" :src="route.image" :alt="`${route.from} para ${route.to}`" />
        <div class="min-w-0 flex-1 self-stretch sm:self-auto">
          <p class="text-sm font-semibold text-slate-400">Mais populares</p>
          <h3 class="truncate text-lg font-black text-sky-950">{{ route.from }} para {{ route.to }}</h3>
        </div>
        <button class="w-full shrink-0 rounded-full bg-sky-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-600 sm:w-auto">
          Ver passagens
        </button>
      </article>
    </div>
  </section>
</template>
