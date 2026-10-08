<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, FileText, ShieldCheck } from '@lucide/vue'
import { tenantState } from '../stores/tenantStore'

const route = useRoute()

const isPrivacy = computed(() => route.name === 'privacy')
const tenantName = computed(() => tenantState.client.site_titulo || tenantState.client.name || '')
const title = computed(() => isPrivacy.value ? 'Politica de privacidade' : 'Termos de uso')
const icon = computed(() => isPrivacy.value ? ShieldCheck : FileText)
const defaultTerms = 'Ao finalizar a reserva, o cliente confirma que as informacoes fornecidas sao verdadeiras e aceita as regras de compra, embarque, remarcacao e cancelamento informadas pelo operador.'
const defaultPrivacy = 'Os dados informados serao usados para identificar passageiros, processar a reserva, gerar cobranca e prestar atendimento relacionado a viagem.'
const body = computed(() => (
  isPrivacy.value
    ? tenantState.client.site_politica_privacidade?.trim() || defaultPrivacy
    : tenantState.client.site_termos_uso?.trim() || defaultTerms
))
const paragraphs = computed(() => String(body.value || '').split(/\n+/).map((item) => item.trim()).filter(Boolean))
</script>

<template>
  <main class="bg-slate-50 px-4 py-10 sm:px-6">
    <section class="mx-auto max-w-4xl overflow-hidden rounded-lg bg-white shadow">
      <div class="bg-[var(--brand-secondary)] px-6 py-8 text-white sm:px-8">
        <RouterLink class="inline-flex items-center gap-2 text-sm font-black text-white/80 transition hover:text-white" to="/">
          <ArrowLeft class="size-4" />
          Voltar
        </RouterLink>
        <div class="mt-8 flex items-center gap-4">
          <span class="grid size-12 place-items-center rounded bg-[var(--brand-primary)]">
            <component :is="icon" class="size-6" />
          </span>
          <div>
            <p v-if="tenantName" class="text-sm font-black uppercase text-white/60">{{ tenantName }}</p>
            <h1 class="text-3xl font-black">{{ title }}</h1>
          </div>
        </div>
      </div>

      <article class="space-y-4 p-6 text-base font-semibold leading-relaxed text-slate-700 sm:p-8">
        <p v-for="(paragraph, index) in paragraphs" :key="index">{{ paragraph }}</p>
      </article>
    </section>
  </main>
</template>
