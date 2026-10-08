<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { ArrowLeft, Eye, EyeOff, IdCard, LockKeyhole, LogIn, Mail, Phone, ShieldCheck, UserPlus, UserRound } from '@lucide/vue'
import { loginCustomer, registerCustomer } from '../stores/authStore'
import { tenantState } from '../stores/tenantStore'
import { formatCpfCnpj, formatPhone, onlyDigits } from '../utils/documentFormatters'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref('')
const success = ref('')
const mode = ref('login')
const showPassword = ref(false)

const form = reactive({
  identificador: '',
  senha: '',
})

const registerForm = reactive({
  nome: '',
  email: '',
  telefone: '',
  cpf_cnpj: '',
  senha: '',
  confirmar_senha: '',
})

const tenantName = computed(() => tenantState.client.site_titulo || tenantState.client.name || '')
const tenantSubtitle = computed(() => tenantState.client.site_subtitulo || 'Acesse sua conta para acompanhar reservas e finalizar compras.')
const heroImage = computed(() => tenantState.client.capa || tenantState.client.banner_site || '')
const logoInitial = computed(() => tenantName.value.charAt(0).toUpperCase())
const redirectTarget = computed(() => route.query.redirect || '/')
const isLoginMode = computed(() => mode.value === 'login')

function setMode(nextMode) {
  mode.value = nextMode
  error.value = ''
  success.value = ''
}

async function submitLogin() {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await loginCustomer({
      clientUid: tenantState.clientUid,
      identificador: form.identificador,
      senha: form.senha,
    })
    await router.push(redirectTarget.value)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function submitRegister() {
  loading.value = true
  error.value = ''
  success.value = ''
  const telefone = onlyDigits(registerForm.telefone)
  const cpfCnpj = onlyDigits(registerForm.cpf_cnpj)

  if (registerForm.senha !== registerForm.confirmar_senha) {
    error.value = 'As senhas informadas nao conferem.'
    loading.value = false
    return
  }

  if (!cpfCnpj && !telefone) {
    error.value = 'Informe CPF/CNPJ ou telefone para criar o cadastro.'
    loading.value = false
    return
  }

  try {
    const response = await registerCustomer({
      clientUid: tenantState.clientUid,
      nome: registerForm.nome,
      email: registerForm.email,
      telefone,
      cpfCnpj,
      senha: registerForm.senha,
    })

    if (!response.access) {
      await loginCustomer({
        clientUid: tenantState.clientUid,
        identificador: cpfCnpj || telefone || registerForm.email,
        senha: registerForm.senha,
      })
    }

    await router.push(redirectTarget.value)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-[calc(100svh-4rem)] bg-[var(--brand-bg)] px-4 py-8 sm:px-6 lg:py-12">
    <section class="mx-auto grid min-h-[680px] max-w-6xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1fr_0.92fr]">
      <div class="relative hidden bg-[var(--brand-secondary)] text-white lg:block">
        <img
          v-if="heroImage"
          class="absolute inset-0 h-full w-full object-cover"
          :src="heroImage"
          :alt="tenantName"
        />
        <div class="absolute inset-0 bg-gradient-to-br from-sky-950/90 via-sky-950/72 to-slate-950/40"></div>

        <div class="relative flex h-full flex-col justify-between p-10">
          <RouterLink class="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-black text-white backdrop-blur transition hover:bg-white/20" to="/">
            <ArrowLeft class="size-4" />
            Voltar
          </RouterLink>

          <div>
            <img v-if="tenantState.client.logo" class="mb-8 max-h-16 max-w-56 object-contain" :src="tenantState.client.logo" :alt="tenantName" />
            <div v-else-if="tenantName" class="mb-8 flex items-center gap-3">
              <span class="grid size-12 place-items-center rounded bg-[var(--brand-primary)] text-lg font-black">{{ logoInitial }}</span>
              <span class="text-2xl font-black">{{ tenantName }}</span>
            </div>

            <h1 class="max-w-xl text-4xl font-black leading-tight">Sua viagem comeca com acesso seguro.</h1>
            <p class="mt-4 max-w-md text-base font-semibold leading-7 text-sky-50/90">{{ tenantSubtitle }}</p>
          </div>

          <div class="grid max-w-md grid-cols-2 gap-3">
            <div class="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
              <ShieldCheck class="size-5 text-sky-200" />
              <p class="mt-3 text-sm font-black">Conta protegida</p>
            </div>
            <div class="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
              <LogIn class="size-5 text-sky-200" />
              <p class="mt-3 text-sm font-black">Reserva em poucos passos</p>
            </div>
          </div>
        </div>
      </div>

      <form class="flex flex-col justify-center p-6 sm:p-10 lg:p-12" @submit.prevent="isLoginMode ? submitLogin() : submitRegister()">
        <RouterLink class="mb-8 inline-flex w-fit items-center gap-2 text-sm font-black text-slate-500 transition hover:text-sky-900 lg:hidden" to="/">
          <ArrowLeft class="size-4" />
          Voltar
        </RouterLink>

        <div class="mb-8 flex items-center gap-3 lg:hidden">
          <img v-if="tenantState.client.logo" class="max-h-12 max-w-44 object-contain" :src="tenantState.client.logo" :alt="tenantName" />
          <template v-else-if="tenantName">
            <span class="grid size-11 place-items-center rounded bg-[var(--brand-primary)] text-sm font-black text-white">{{ logoInitial }}</span>
            <span class="text-xl font-black text-sky-950">{{ tenantName }}</span>
          </template>
        </div>

        <div>
          <p class="text-sm font-black uppercase tracking-[0.18em] text-[var(--brand-primary)]">Area do cliente</p>
          <h2 class="mt-3 text-3xl font-black leading-tight text-sky-950">{{ isLoginMode ? 'Entre na sua conta' : 'Crie sua conta' }}</h2>
          <p class="mt-2 text-sm font-semibold leading-6 text-slate-500">
            {{ isLoginMode ? 'Use email, telefone ou CPF/CNPJ cadastrado.' : 'Cadastre seus dados para acompanhar reservas e finalizar compras.' }}
          </p>
        </div>

        <div class="mt-8 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            class="flex h-11 items-center justify-center gap-2 rounded-md text-sm font-black transition"
            :class="isLoginMode ? 'bg-white text-[var(--brand-primary)] shadow-sm' : 'text-slate-500 hover:text-sky-950'"
            type="button"
            @click="setMode('login')"
          >
            <LogIn class="size-4" />
            Entrar
          </button>
          <button
            class="flex h-11 items-center justify-center gap-2 rounded-md text-sm font-black transition"
            :class="!isLoginMode ? 'bg-white text-[var(--brand-primary)] shadow-sm' : 'text-slate-500 hover:text-sky-950'"
            type="button"
            @click="setMode('register')"
          >
            <UserPlus class="size-4" />
            Cadastrar-se
          </button>
        </div>

        <div v-if="isLoginMode" class="mt-6 grid gap-5">
          <label class="grid gap-2 text-sm font-bold text-slate-600">
            Email, telefone ou CPF/CNPJ
            <span class="flex h-13 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 ring-[var(--brand-primary)]/20 focus-within:border-[var(--brand-primary)] focus-within:ring-4">
              <UserRound class="size-5 shrink-0 text-slate-400" />
              <input
                v-model.trim="form.identificador"
                required
                autocomplete="username"
                class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="email@exemplo.com"
              />
            </span>
          </label>

          <label class="grid gap-2 text-sm font-bold text-slate-600">
            Senha
            <span class="flex h-13 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 ring-[var(--brand-primary)]/20 focus-within:border-[var(--brand-primary)] focus-within:ring-4">
              <LockKeyhole class="size-5 shrink-0 text-slate-400" />
              <input
                v-model="form.senha"
                required
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Sua senha"
              />
              <button
                class="grid size-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-sky-950"
                type="button"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="size-5" />
                <Eye v-else class="size-5" />
              </button>
            </span>
          </label>
        </div>

        <div v-else class="mt-6 grid gap-5">
          <label class="grid gap-2 text-sm font-bold text-slate-600">
            Nome completo
            <span class="flex h-13 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 ring-[var(--brand-primary)]/20 focus-within:border-[var(--brand-primary)] focus-within:ring-4">
              <UserRound class="size-5 shrink-0 text-slate-400" />
              <input
                v-model.trim="registerForm.nome"
                required
                autocomplete="name"
                class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Seu nome"
              />
            </span>
          </label>

          <label class="grid gap-2 text-sm font-bold text-slate-600">
            Email
            <span class="flex h-13 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 ring-[var(--brand-primary)]/20 focus-within:border-[var(--brand-primary)] focus-within:ring-4">
              <Mail class="size-5 shrink-0 text-slate-400" />
              <input
                v-model.trim="registerForm.email"
                type="email"
                autocomplete="email"
                class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="email@exemplo.com"
              />
            </span>
          </label>

          <div class="grid gap-5">
            <label class="grid gap-2 text-sm font-bold text-slate-600">
              Telefone
              <span class="flex h-13 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 ring-[var(--brand-primary)]/20 focus-within:border-[var(--brand-primary)] focus-within:ring-4">
                <Phone class="size-5 shrink-0 text-slate-400" />
                <input
                  v-model.trim="registerForm.telefone"
                  autocomplete="tel"
                  inputmode="tel"
                  class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="(92) 99999-9999"
                  @input="registerForm.telefone = formatPhone(registerForm.telefone)"
                />
              </span>
            </label>

            <label class="grid gap-2 text-sm font-bold text-slate-600">
              CPF/CNPJ
              <span class="flex h-13 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 ring-[var(--brand-primary)]/20 focus-within:border-[var(--brand-primary)] focus-within:ring-4">
                <IdCard class="size-5 shrink-0 text-slate-400" />
                <input
                  v-model.trim="registerForm.cpf_cnpj"
                  autocomplete="off"
                  inputmode="numeric"
                  class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="000.000.000-00"
                  @input="registerForm.cpf_cnpj = formatCpfCnpj(registerForm.cpf_cnpj)"
                />
              </span>
            </label>
          </div>

          <label class="grid gap-2 text-sm font-bold text-slate-600">
            Senha
            <span class="flex h-13 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 ring-[var(--brand-primary)]/20 focus-within:border-[var(--brand-primary)] focus-within:ring-4">
              <LockKeyhole class="size-5 shrink-0 text-slate-400" />
              <input
                v-model="registerForm.senha"
                required
                minlength="6"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Minimo 6 caracteres"
              />
              <button
                class="grid size-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-sky-950"
                type="button"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="size-5" />
                <Eye v-else class="size-5" />
              </button>
            </span>
          </label>

          <label class="grid gap-2 text-sm font-bold text-slate-600">
            Confirmar senha
            <span class="flex h-13 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 ring-[var(--brand-primary)]/20 focus-within:border-[var(--brand-primary)] focus-within:ring-4">
              <LockKeyhole class="size-5 shrink-0 text-slate-400" />
              <input
                v-model="registerForm.confirmar_senha"
                required
                minlength="6"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Repita a senha"
              />
            </span>
          </label>
        </div>

        <div v-if="isLoginMode" class="mt-4 flex justify-end">
          <RouterLink class="text-sm font-black text-[var(--brand-primary)] transition hover:opacity-75" to="/esqueci-senha">
            Esqueci minha senha
          </RouterLink>
        </div>

        <p v-if="error" class="mt-5 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">{{ error }}</p>
        <p v-if="success" class="mt-5 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{{ success }}</p>

        <button class="mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] text-sm font-black uppercase text-white shadow-lg shadow-sky-900/10 transition hover:brightness-95 disabled:bg-slate-300 disabled:shadow-none" :disabled="loading">
          <LogIn v-if="isLoginMode" class="size-4" />
          <UserPlus v-else class="size-4" />
          {{ loading ? (isLoginMode ? 'Entrando...' : 'Cadastrando...') : (isLoginMode ? 'Entrar' : 'Criar cadastro') }}
        </button>

        <div class="mt-6 rounded-lg bg-slate-50 p-4 text-sm font-bold text-slate-500">
          <template v-if="isLoginMode">
            Ainda nao tem cadastro?
            <button class="ml-1 text-[var(--brand-primary)] hover:opacity-75" type="button" @click="setMode('register')">Cadastrar-se agora</button>
          </template>
          <template v-else>
            Ja tem cadastro?
            <button class="ml-1 text-[var(--brand-primary)] hover:opacity-75" type="button" @click="setMode('login')">Entrar na minha conta</button>
          </template>
        </div>
      </form>
    </section>
  </main>
</template>
