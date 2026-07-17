<script setup>
import { computed } from 'vue'
import { AtSign, Globe, Mail, MessageCircle, Send } from '@lucide/vue'
import { tenantState } from '../stores/tenantStore'

const tenantName = computed(() => tenantState.client.name || '')
const logoInitial = computed(() => tenantName.value.charAt(0).toUpperCase())
const helpLink = computed(() => tenantState.client.site_link_ajuda || '')
</script>

<template>
  <footer class="mt-10 border-t-4 border-[var(--brand-primary)] bg-[var(--brand-secondary)] text-white">
    <div class="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
      <div>
        <div class="flex items-center gap-3">
          <img
            v-if="tenantState.client.logo"
            class="max-h-12 max-w-44 object-contain"
            :src="tenantState.client.logo"
            :alt="tenantName"
          />
          <span v-else-if="tenantName" class="grid size-10 place-items-center rounded bg-[var(--brand-primary)] font-black">
            {{ logoInitial }}
          </span>
          <span v-if="tenantName" class="text-2xl font-bold tracking-wide">{{ tenantName }}</span>
        </div>

        <p v-if="tenantState.client.informativo" class="mt-4 max-w-xs text-sm font-semibold text-white/75">
          {{ tenantState.client.informativo }}
        </p>

        <div class="mt-6 flex gap-3 text-white/80">
          <Globe class="size-5" />
          <AtSign class="size-5" />
          <Send class="size-5" />
          <MessageCircle class="size-5" />
          <Mail class="size-5" />
        </div>
      </div>

      <div>
        <h3 class="text-lg font-black">Institucional</h3>
        <ul class="mt-3 space-y-2 text-sm text-white/75">
          <li>Sobre nos</li>
          <li>Termos de uso</li>
          <li>Politica de privacidade</li>
          <li v-if="tenantName">Conheca {{ tenantName }}</li>
        </ul>
      </div>

      <div>
        <h3 class="text-lg font-black">Ajuda</h3>
        <ul class="mt-3 space-y-2 text-sm text-white/75">
          <li>
            <a v-if="helpLink" :href="helpLink" target="_blank" rel="noreferrer" class="hover:text-white">Duvidas frequentes</a>
            <span v-else>Duvidas frequentes</span>
          </li>
          <li>
            <a v-if="helpLink" :href="helpLink" target="_blank" rel="noreferrer" class="hover:text-white">Fale conosco</a>
            <span v-else>Fale conosco</span>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="text-lg font-black">Formas de pagamento</h3>
        <div class="mt-4 inline-flex rounded bg-white px-4 py-3 text-sm font-black text-[var(--brand-secondary)]">
          VISA&nbsp;&nbsp; Mastercard&nbsp;&nbsp; PIX
        </div>
      </div>
    </div>

    <div class="bg-black/15 py-4 text-center text-sm text-white/75">
      2026<span v-if="tenantName"> {{ tenantName }}</span> - Solucoes em mobilidade
    </div>
  </footer>
</template>
