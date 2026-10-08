<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { buildCustomerIdentifierPayload, resetCustomerPassword } from '../services/customerApi'
import { tenantState } from '../stores/tenantStore'

const route = useRoute()
const form = reactive({
  token: String(route.query.token || ''),
  identificador: '',
  codigo: '',
  nova_senha: '',
})
const loading = ref(false)
const message = ref('')
const error = ref('')

async function submitResetPassword() {
  loading.value = true
  message.value = ''
  error.value = ''

  try {
    const payload = form.token
      ? { token: form.token, nova_senha: form.nova_senha }
      : {
          client_uid: tenantState.clientUid,
          ...buildCustomerIdentifierPayload(form.identificador),
          codigo: form.codigo,
          nova_senha: form.nova_senha,
        }

    const response = await resetCustomerPassword(payload)
    message.value = response.mensagem || 'Senha redefinida com sucesso.'
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-[calc(100svh-4rem)] bg-slate-50 px-4 py-16">
    <form class="mx-auto max-w-xl rounded-lg bg-white p-6 shadow-xl sm:p-8" @submit.prevent="submitResetPassword">
      <h1 class="text-2xl font-black text-sky-950">Redefinir senha</h1>
      <p class="mt-2 text-sm font-semibold text-slate-500">Informe o codigo recebido e crie uma nova senha.</p>

      <div class="mt-6 grid gap-4">
        <input v-if="form.token" v-model="form.token" required class="h-12 rounded border border-slate-300 px-3 outline-sky-500" placeholder="Token" />
        <input v-else v-model="form.identificador" required class="h-12 rounded border border-slate-300 px-3 outline-sky-500" placeholder="Email, telefone ou CPF/CNPJ" />
        <input
          v-if="!form.token"
          v-model="form.codigo"
          required
          class="h-12 rounded border border-slate-300 px-3 text-center text-lg font-black tracking-[0.35em] outline-sky-500"
          inputmode="numeric"
          maxlength="6"
          placeholder="Codigo"
        />
        <input v-model="form.nova_senha" required type="password" minlength="6" class="h-12 rounded border border-slate-300 px-3 outline-sky-500" placeholder="Nova senha" />
      </div>

      <p v-if="message" class="mt-4 rounded bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{{ message }}</p>
      <p v-if="error" class="mt-4 rounded bg-red-50 p-3 text-sm font-bold text-red-700">{{ error }}</p>

      <button class="mt-6 h-12 w-full rounded bg-[var(--brand-primary)] text-sm font-black uppercase text-white disabled:bg-slate-300" :disabled="loading">
        {{ loading ? 'Salvando...' : 'Redefinir senha' }}
      </button>

      <RouterLink class="mt-4 inline-flex text-sm font-bold text-sky-600" to="/login">Voltar para o login</RouterLink>
    </form>
  </main>
</template>
