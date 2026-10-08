<script setup>
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { buildCustomerIdentifierPayload, forgotCustomerPassword, resetCustomerPassword, verifyCustomerPasswordCode } from '../services/customerApi'
import { tenantState } from '../stores/tenantStore'

const form = reactive({
  identificador: '',
  codigo: '',
  nova_senha: '',
  confirmar_senha: '',
})
const loading = ref(false)
const step = ref('request')
const message = ref('')
const error = ref('')

const stepCopy = {
  request: {
    title: 'Recuperar senha',
    description: 'Informe o email, telefone ou CPF/CNPJ cadastrado para receber o codigo.',
    button: 'Enviar codigo',
  },
  code: {
    title: 'Confirmar codigo',
    description: 'Digite o codigo de 6 digitos enviado por email e/ou WhatsApp.',
    button: 'Confirmar codigo',
  },
  password: {
    title: 'Criar nova senha',
    description: 'Agora crie uma nova senha para acessar sua conta.',
    button: 'Salvar nova senha',
  },
  done: {
    title: 'Senha alterada',
    description: 'Sua senha foi redefinida com sucesso.',
    button: '',
  },
}

async function submitForgotPassword() {
  loading.value = true
  message.value = ''
  error.value = ''

  try {
    const response = await forgotCustomerPassword({
      clientUid: tenantState.clientUid,
      identificador: form.identificador,
    })
    if (response.email_enviado || response.whatsapp_enviado) {
      step.value = 'code'
      if (response.email_enviado && response.whatsapp_enviado) {
        message.value = 'Enviamos um codigo de 6 digitos para o seu email e WhatsApp cadastrados.'
      } else if (response.whatsapp_enviado) {
        message.value = 'Enviamos um codigo de 6 digitos para o seu WhatsApp cadastrado.'
      } else {
        message.value = 'Enviamos um codigo de 6 digitos para o email cadastrado.'
      }
    } else {
      error.value = 'Nao foi possivel enviar o codigo. Verifique se o cadastro possui email ou telefone, ou tente outro identificador.'
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function submitCode() {
  loading.value = true
  message.value = ''
  error.value = ''

  try {
    await verifyCustomerPasswordCode({
      clientUid: tenantState.clientUid,
      identificador: form.identificador,
      codigo: form.codigo,
    })
    step.value = 'password'
    message.value = 'Codigo confirmado. Crie sua nova senha.'
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function submitResetPassword() {
  if (form.nova_senha !== form.confirmar_senha) {
    error.value = 'As senhas informadas nao conferem.'
    return
  }

  loading.value = true
  message.value = ''
  error.value = ''

  try {
    const response = await resetCustomerPassword({
      client_uid: tenantState.clientUid,
      ...buildCustomerIdentifierPayload(form.identificador),
      codigo: form.codigo,
      nova_senha: form.nova_senha,
    })
    message.value = response.mensagem || 'Senha redefinida com sucesso.'
    form.codigo = ''
    form.nova_senha = ''
    form.confirmar_senha = ''
    step.value = 'done'
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function requestAnotherCode() {
  step.value = 'request'
  form.codigo = ''
  form.nova_senha = ''
  form.confirmar_senha = ''
  message.value = ''
  error.value = ''
}

function handleSubmit() {
  if (step.value === 'request') {
    return submitForgotPassword()
  }
  if (step.value === 'code') {
    return submitCode()
  }
  if (step.value === 'password') {
    return submitResetPassword()
  }

  return null
}
</script>

<template>
  <main class="min-h-[calc(100svh-4rem)] bg-slate-50 px-4 py-16">
    <form
      class="mx-auto max-w-xl rounded-lg bg-white p-6 shadow-xl sm:p-8"
      @submit.prevent="handleSubmit"
    >
      <h1 class="text-2xl font-black text-sky-950">{{ stepCopy[step].title }}</h1>
      <p class="mt-2 text-sm font-semibold text-slate-500">{{ stepCopy[step].description }}</p>

      <label v-if="step === 'request'" class="mt-6 grid gap-1 text-sm font-bold text-slate-600">
        Email, telefone ou CPF/CNPJ
        <input v-model="form.identificador" required type="text" class="h-12 rounded border border-slate-300 px-3 outline-sky-500" placeholder="seu@email.com ou (99) 99999-9999" />
      </label>

      <div v-if="step === 'code'" class="mt-6 grid gap-4">
        <label class="grid gap-1 text-sm font-bold text-slate-600">
          Codigo recebido
          <input
            v-model="form.codigo"
            required
            class="h-12 rounded border border-slate-300 px-3 text-center text-lg font-black tracking-[0.35em] outline-sky-500"
            inputmode="numeric"
            maxlength="6"
            placeholder="000000"
          />
        </label>
      </div>

      <div v-if="step === 'password'" class="mt-6 grid gap-4">
        <label class="grid gap-1 text-sm font-bold text-slate-600">
          Nova senha
          <input v-model="form.nova_senha" required type="password" minlength="6" class="h-12 rounded border border-slate-300 px-3 outline-sky-500" />
        </label>

        <label class="grid gap-1 text-sm font-bold text-slate-600">
          Confirmar nova senha
          <input v-model="form.confirmar_senha" required type="password" minlength="6" class="h-12 rounded border border-slate-300 px-3 outline-sky-500" />
        </label>
      </div>

      <p v-if="message" class="mt-4 rounded bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{{ message }}</p>
      <p v-if="error" class="mt-4 rounded bg-red-50 p-3 text-sm font-bold text-red-700">{{ error }}</p>

      <button v-if="step !== 'done'" class="mt-6 h-12 w-full rounded bg-[var(--brand-primary)] text-sm font-black uppercase text-white disabled:bg-slate-300" :disabled="loading">
        {{ loading ? 'Aguarde...' : stepCopy[step].button }}
      </button>

      <button v-if="step !== 'request' && step !== 'done'" class="mt-4 mr-4 inline-flex text-sm font-bold text-sky-600" type="button" @click="requestAnotherCode">
        Enviar outro codigo
      </button>
      <RouterLink class="mt-4 inline-flex text-sm font-bold text-sky-600" to="/login">Voltar para o login</RouterLink>
    </form>
  </main>
</template>
