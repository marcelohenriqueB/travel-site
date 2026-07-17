<script setup>
defineProps({
  places: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-14 sm:px-6">
    <h2 class="text-2xl font-black uppercase text-sky-950">Locais em destaque</h2>

    <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <article
        v-for="place in places"
        :key="place.name"
        class="group relative h-64 overflow-hidden rounded-lg bg-slate-200 shadow-sm"
      >
        <img class="size-full object-cover transition duration-500 group-hover:scale-105" :src="place.image" :alt="place.name" />
        <div class="absolute inset-0 bg-gradient-to-t from-sky-950/75 via-sky-950/5 to-transparent"></div>
        <h3 class="absolute inset-x-0 bottom-5 text-center text-2xl font-black text-white">{{ place.name }}</h3>
      </article>
    </div>
  </section>
</template>
