<script setup>
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { useRoute } from 'vue-router'
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
import { tenantState } from './stores/tenantStore'

const route = useRoute()
const showLayout = computed(() => !route.meta.hideLayout)
const isResolvingTenant = computed(() => !tenantState.initialized)
</script>

<template>
  <main v-if="isResolvingTenant" class="grid min-h-screen place-items-center bg-slate-950 text-white">
    <div class="grid gap-4 text-center">
      <span class="mx-auto size-10 animate-spin rounded-full border-4 border-white/20 border-t-sky-300"></span>
      <span class="text-sm font-black uppercase tracking-normal text-white/70">Carregando</span>
    </div>
  </main>

  <template v-else>
    <SiteHeader v-if="showLayout" />
    <RouterView />
    <SiteFooter v-if="showLayout" />
  </template>
</template>
