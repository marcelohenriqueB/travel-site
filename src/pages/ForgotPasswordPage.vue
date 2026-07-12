<script setup>
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { forgotCustomerPassword } from '../services/customerApi'
import { tenantState } from '../stores/tenantStore'

const form = reactive({ identificador: '' })
const loading = ref(false)
const message = ref('')
const error = ref('')

async function submitForgotPassword() {
  loading.value = true
  message.value = ''
  error.value = ''

  try {
    const response = await forgotCustomerPassword({
      clientUid: tenantState.clientUid,
      identificador: form.identificador,
    })
    message.value = response.mensagem || 'Se os dados estiverem corretos, enviaremos as instrucoes.'
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-[calc(100svh-4rem)] bg-slate-50 px-4 py-16">
    <form class="mx-auto max-w-xl rounded-lg bg-white p-6 shadow-xl sm:p-8" @submit.prevent="submitForgotPassword">
      <h1 class="text-2xl font-black text-sky-950">Recuperar senha</h1>
      <p class="mt-2 text-sm font-semibold text-slate-500">Informe email, telefone ou CPF/CNPJ para receber as instrucoes.</p>

      <label class="mt-6 grid gap-1 text-sm font-bold text-slate-600">
        Email, telefone ou CPF/CNPJ
        <input v-model="form.identificador" required class="h-12 rounded border border-slate-300 px-3 outline-sky-500" />
      </label>

      <p v-if="message" class="mt-4 rounded bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{{ message }}</p>
      <p v-if="error" class="mt-4 rounded bg-red-50 p-3 text-sm font-bold text-red-700">{{ error }}</p>

      <button class="mt-6 h-12 w-full rounded bg-[var(--brand-primary)] text-sm font-black uppercase text-white disabled:bg-slate-300" :disabled="loading">
        {{ loading ? 'Enviando...' : 'Enviar instrucoes' }}
      </button>

      <RouterLink class="mt-4 inline-flex text-sm font-bold text-sky-600" to="/login">Voltar para o login</RouterLink>
    </form>
  </main>
</template>
