<script setup>
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { LogIn, UserPlus } from '@lucide/vue'
import { loginCustomer, registerCustomer } from '../stores/authStore'
import { tenantState } from '../stores/tenantStore'
import { formatCpfCnpj, formatPhone, onlyDigits } from '../utils/documentFormatters'

const emit = defineEmits(['authenticated'])

const mode = ref('login')
const loading = ref(false)
const error = ref('')
const message = ref('')

const loginForm = reactive({
  identificador: '',
  senha: '',
})

const registerForm = reactive({
  nome: '',
  email: '',
  telefone: '',
  cpf_cnpj: '',
  senha: '',
})

async function submitLogin() {
  loading.value = true
  error.value = ''
  message.value = ''

  try {
    await loginCustomer({
      clientUid: tenantState.clientUid,
      identificador: loginForm.identificador,
      senha: loginForm.senha,
    })
    emit('authenticated')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function submitRegister() {
  const telefone = onlyDigits(registerForm.telefone)
  const cpfCnpj = onlyDigits(registerForm.cpf_cnpj)

  if (!telefone && !cpfCnpj) {
    error.value = 'Informe CPF/CNPJ ou telefone para cadastrar.'
    return
  }

  if (registerForm.senha.length < 6) {
    error.value = 'A senha deve ter no minimo 6 caracteres.'
    return
  }

  loading.value = true
  error.value = ''
  message.value = ''

  try {
    const response = await registerCustomer({
      clientUid: tenantState.clientUid,
      nome: registerForm.nome.trim(),
      email: registerForm.email.trim(),
      telefone,
      cpf_cnpj: cpfCnpj,
      senha: registerForm.senha,
    })

    if (response.access) {
      emit('authenticated')
      return
    }

    message.value = response.mensagem || 'Cadastro enviado. Agora entre com seus dados para continuar.'
    mode.value = 'login'
    loginForm.identificador = telefone || cpfCnpj
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-5 shadow">
    <div>
      <p class="text-sm font-black uppercase text-[var(--brand-primary)]">Checkout</p>
      <h2 class="text-2xl font-black text-sky-950">Entre ou cadastre-se</h2>
      <p class="mt-1 text-sm font-semibold text-slate-500">Para finalizar a reserva, acesse sua conta de cliente.</p>
    </div>

    <div class="mt-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
      <button
        class="flex h-11 items-center justify-center gap-2 rounded text-sm font-black"
        :class="mode === 'login' ? 'bg-white text-sky-950 shadow-sm' : 'text-slate-500'"
        @click="mode = 'login'"
      >
        <LogIn class="size-4" />
        Entrar
      </button>
      <button
        class="flex h-11 items-center justify-center gap-2 rounded text-sm font-black"
        :class="mode === 'register' ? 'bg-white text-sky-950 shadow-sm' : 'text-slate-500'"
        @click="mode = 'register'"
      >
        <UserPlus class="size-4" />
        Cadastrar
      </button>
    </div>

    <form v-if="mode === 'login'" class="mt-5 grid gap-4" @submit.prevent="submitLogin">
      <label class="grid gap-1 text-sm font-bold text-slate-600">
        Telefone ou CPF/CNPJ
        <input v-model="loginForm.identificador" required class="h-12 rounded border border-slate-300 px-3 outline-sky-500" placeholder="92999999999" />
      </label>
      <label class="grid gap-1 text-sm font-bold text-slate-600">
        Senha
        <input v-model="loginForm.senha" required type="password" class="h-12 rounded border border-slate-300 px-3 outline-sky-500" placeholder="Sua senha" />
      </label>

      <button class="h-12 rounded bg-[var(--brand-primary)] text-sm font-black uppercase text-white disabled:bg-slate-300" :disabled="loading">
        {{ loading ? 'Entrando...' : 'Entrar e continuar' }}
      </button>
    </form>

    <form v-else class="mt-5 grid gap-4" @submit.prevent="submitRegister">
      <input v-model="registerForm.nome" required class="h-12 rounded border border-slate-300 px-3 outline-sky-500" placeholder="Nome completo" />
      <input v-model="registerForm.email" type="email" class="h-12 rounded border border-slate-300 px-3 outline-sky-500" placeholder="E-mail" />
      <input
        v-model="registerForm.telefone"
        class="h-12 rounded border border-slate-300 px-3 outline-sky-500"
        inputmode="tel"
        placeholder="(92) 99999-9999"
        @input="registerForm.telefone = formatPhone(registerForm.telefone)"
      />
      <input
        v-model="registerForm.cpf_cnpj"
        class="h-12 rounded border border-slate-300 px-3 outline-sky-500"
        inputmode="numeric"
        placeholder="000.000.000-00"
        @input="registerForm.cpf_cnpj = formatCpfCnpj(registerForm.cpf_cnpj)"
      />
      <input v-model="registerForm.senha" required minlength="6" type="password" class="h-12 rounded border border-slate-300 px-3 outline-sky-500" placeholder="Senha" />
      <p class="text-xs font-bold text-slate-500">Informe CPF/CNPJ ou telefone. Senha minima de 6 caracteres.</p>

      <button class="h-12 rounded bg-[var(--brand-primary)] text-sm font-black uppercase text-white disabled:bg-slate-300" :disabled="loading">
        {{ loading ? 'Cadastrando...' : 'Cadastrar e continuar' }}
      </button>
    </form>

    <p v-if="message" class="mt-4 rounded bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{{ message }}</p>
    <p v-if="error" class="mt-4 rounded bg-red-50 p-3 text-sm font-bold text-red-700">{{ error }}</p>

    <RouterLink class="mt-4 inline-flex text-sm font-bold text-sky-600" to="/esqueci-senha">
      Esqueci minha senha
    </RouterLink>
  </section>
</template>
