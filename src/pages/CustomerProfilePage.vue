<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Home, Mail, MapPin, Phone, Save, UserRound } from '@lucide/vue'
import { getCustomerProfile, updateCustomerProfile } from '../services/customerApi'
import { authState, updateStoredCustomer } from '../stores/authStore'

const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const message = ref('')

const form = reactive({
  nome: '',
  email: '',
  telefone: '',
  postal_code: '',
  address: '',
  address_number: '',
  address_complement: '',
  neighborhood: '',
  city: '',
  state: '',
})

onMounted(async () => {
  if (!authState.access) {
    await router.replace({ name: 'login', query: { redirect: '/meu-perfil' } })
    return
  }

  await loadProfile()
})

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, ddd, first, second) => `(${ddd}) ${first}${second ? `-${second}` : ''}`).trim()
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, ddd, first, second) => `(${ddd}) ${first}${second ? `-${second}` : ''}`).trim()
}

function formatCep(value) {
  return onlyDigits(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2')
}

function fillForm(customer = {}) {
  form.nome = customer.nome || ''
  form.email = customer.email || ''
  form.telefone = formatPhone(customer.telefone || '')
  form.postal_code = formatCep(customer.postal_code || '')
  form.address = customer.address || ''
  form.address_number = customer.address_number || ''
  form.address_complement = customer.address_complement || ''
  form.neighborhood = customer.neighborhood || ''
  form.city = customer.city || ''
  form.state = String(customer.state || '').toUpperCase().slice(0, 2)
}

async function loadProfile() {
  loading.value = true
  error.value = ''

  try {
    const response = await getCustomerProfile(authState.access)
    const customer = response?.customer || authState.customer || {}
    fillForm(customer)
    updateStoredCustomer(customer)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function submitProfile() {
  saving.value = true
  error.value = ''
  message.value = ''

  try {
    const response = await updateCustomerProfile(
      {
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: onlyDigits(form.telefone),
        postal_code: onlyDigits(form.postal_code),
        address: form.address.trim(),
        address_number: onlyDigits(form.address_number),
        address_complement: form.address_complement.trim(),
        neighborhood: form.neighborhood.trim(),
        city: form.city.trim(),
        state: form.state.trim().toUpperCase().slice(0, 2),
      },
      authState.access,
    )
    updateStoredCustomer(response.customer)
    fillForm(response.customer)
    message.value = response.mensagem || 'Perfil atualizado com sucesso.'
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
    <section class="mx-auto max-w-5xl">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm font-black uppercase text-[var(--brand-primary)]">Cliente</p>
          <h1 class="text-3xl font-black text-sky-950">Meu perfil</h1>
          <p class="mt-1 text-sm font-semibold text-slate-500">Atualize telefone e endereco para agilizar suas proximas reservas.</p>
        </div>
      </div>

      <div v-if="loading" class="mt-6 grid gap-4">
        <div v-for="item in 4" :key="item" class="h-24 animate-pulse rounded-lg bg-white"></div>
      </div>

      <form v-else class="mt-6 grid gap-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6" @submit.prevent="submitProfile">
        <section>
          <div class="flex items-center gap-2">
            <UserRound class="size-5 text-[var(--brand-primary)]" />
            <h2 class="text-lg font-black text-sky-950">Dados pessoais</h2>
          </div>

          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <label class="grid gap-1 text-sm font-bold text-slate-600">
              Nome
              <input v-model="form.nome" required class="h-12 rounded border border-slate-300 px-3 outline-sky-500" />
            </label>
            <label class="grid gap-1 text-sm font-bold text-slate-600">
              E-mail
              <span class="flex h-12 items-center gap-3 rounded border border-slate-300 px-3 focus-within:border-[var(--brand-primary)] focus-within:ring-4 focus-within:ring-sky-100">
                <Mail class="size-4 text-slate-400" />
                <input v-model="form.email" type="email" class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 outline-none" />
              </span>
            </label>
            <label class="grid gap-1 text-sm font-bold text-slate-600">
              Telefone
              <span class="flex h-12 items-center gap-3 rounded border border-slate-300 px-3 focus-within:border-[var(--brand-primary)] focus-within:ring-4 focus-within:ring-sky-100">
                <Phone class="size-4 text-slate-400" />
                <input v-model="form.telefone" class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 outline-none" inputmode="tel" placeholder="(92) 99999-9999" @input="form.telefone = formatPhone(form.telefone)" />
              </span>
            </label>
          </div>
        </section>

        <section class="border-t border-slate-200 pt-6">
          <div class="flex items-center gap-2">
            <Home class="size-5 text-[var(--brand-primary)]" />
            <h2 class="text-lg font-black text-sky-950">Endereco</h2>
          </div>

          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <label class="grid gap-1 text-sm font-bold text-slate-600">
              CEP
              <span class="flex h-12 items-center gap-3 rounded border border-slate-300 px-3 focus-within:border-[var(--brand-primary)] focus-within:ring-4 focus-within:ring-sky-100">
                <MapPin class="size-4 text-slate-400" />
                <input v-model="form.postal_code" class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 outline-none" inputmode="numeric" placeholder="00000-000" @input="form.postal_code = formatCep(form.postal_code)" />
              </span>
            </label>
            <label class="grid gap-1 text-sm font-bold text-slate-600">
              Rua / Avenida
              <input v-model="form.address" class="h-12 rounded border border-slate-300 px-3 outline-sky-500" placeholder="Nome da rua" />
            </label>
            <label class="grid gap-1 text-sm font-bold text-slate-600">
              Numero
              <input v-model="form.address_number" class="h-12 rounded border border-slate-300 px-3 outline-sky-500" inputmode="numeric" placeholder="100" @input="form.address_number = onlyDigits(form.address_number)" />
            </label>
            <label class="grid gap-1 text-sm font-bold text-slate-600">
              Complemento
              <input v-model="form.address_complement" class="h-12 rounded border border-slate-300 px-3 outline-sky-500" placeholder="Apto, bloco, referencia" />
            </label>
            <label class="grid gap-1 text-sm font-bold text-slate-600">
              Bairro
              <input v-model="form.neighborhood" class="h-12 rounded border border-slate-300 px-3 outline-sky-500" />
            </label>
            <div class="grid gap-4 sm:grid-cols-[1fr_96px]">
              <label class="grid gap-1 text-sm font-bold text-slate-600">
                Cidade
                <input v-model="form.city" class="h-12 rounded border border-slate-300 px-3 outline-sky-500" />
              </label>
              <label class="grid gap-1 text-sm font-bold text-slate-600">
                UF
                <input v-model="form.state" class="h-12 rounded border border-slate-300 px-3 uppercase outline-sky-500" maxlength="2" placeholder="AM" @input="form.state = form.state.toUpperCase().slice(0, 2)" />
              </label>
            </div>
          </div>
        </section>

        <p v-if="message" class="rounded bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{{ message }}</p>
        <p v-if="error" class="rounded bg-red-50 p-3 text-sm font-bold text-red-700">{{ error }}</p>

        <div class="flex justify-end">
          <button class="inline-flex h-12 items-center gap-2 rounded bg-[var(--brand-primary)] px-6 text-sm font-black uppercase text-white disabled:bg-slate-300" :disabled="saving">
            <Save class="size-4" />
            {{ saving ? 'Salvando...' : 'Salvar perfil' }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
