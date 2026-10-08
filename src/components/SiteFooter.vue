<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { AtSign, Globe, MessageCircle, Music2, Send } from '@lucide/vue'
import { tenantState } from '../stores/tenantStore'

const tenantName = computed(() => tenantState.client.name || '')
const logoInitial = computed(() => tenantName.value.charAt(0).toUpperCase())
const helpLink = computed(() => tenantState.client.site_link_ajuda || '')
const socialLinks = computed(() => [
  { label: 'Instagram', url: tenantState.client.site_link_instagram, icon: AtSign },
  { label: 'Facebook', url: tenantState.client.site_link_facebook, icon: Globe },
  { label: 'WhatsApp', url: tenantState.client.site_link_whatsapp, icon: MessageCircle },
  { label: 'TikTok', url: tenantState.client.site_link_tiktok, icon: Music2 },
  { label: 'YouTube', url: tenantState.client.site_link_youtube, icon: Send },
].filter((item) => item.url))
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

        <div v-if="socialLinks.length" class="mt-6 flex gap-3 text-white/80">
          <a
            v-for="item in socialLinks"
            :key="item.label"
            :href="item.url"
            :aria-label="item.label"
            :title="item.label"
            target="_blank"
            rel="noreferrer"
            class="grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 hover:text-white"
          >
            <component :is="item.icon" class="size-5" />
          </a>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-black">Institucional</h3>
        <ul class="mt-3 space-y-2 text-sm text-white/75">
          <li>Sobre nos</li>
          <li><RouterLink class="hover:text-white" :to="{ name: 'terms' }">Termos de uso</RouterLink></li>
          <li><RouterLink class="hover:text-white" :to="{ name: 'privacy' }">Politica de privacidade</RouterLink></li>
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
