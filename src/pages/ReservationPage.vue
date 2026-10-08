<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { BadgeCheck, Bed, CheckCircle2, CreditCard, LockKeyhole, Mail, MapPin, Phone, Plus, QrCode, ShieldCheck, Ship, Trash2, UserRound, UsersRound, Utensils, Waves } from '@lucide/vue'
import CheckoutAuthPanel from '../components/CheckoutAuthPanel.vue'
import { buildReservationPayload, calculatePublicReservationValue, createCustomerReservation, listPublicAdicionais, listPublicRoutes, listPublicSuites } from '../services/customerApi'
import { authState } from '../stores/authStore'
import { cachePublicTickets, getCachedPublicRoute, mapPublicRouteToTicket, publicRouteState } from '../stores/publicRouteStore'
import { tenantState } from '../stores/tenantStore'
import { formatDateBr, normalizeApiCollection } from '../utils/formatters'

const route = useRoute()
const currentStep = ref(authState.access ? 2 : 1)
const loadingOptions = ref(false)
const submitting = ref(false)
const error = ref('')
const stepError = ref('')
const result = ref(null)
const simulatedPrice = ref(null)
const simulationLoading = ref(false)
const simulationError = ref('')
const termsAccepted = ref(false)
const routeLoading = ref(true)
const selectedTicket = ref(null)
let simulationTimer = null
const suites = ref([])
const adicionaisOptions = ref([])

const ticket = computed(() => selectedTicket.value || getCachedPublicRoute(route.params.id, route.query.data))
const isLoggedIn = computed(() => Boolean(authState.access))
const stepItems = computed(() => [
  {
    id: 1,
    title: 'Identificacao',
    icon: isLoggedIn.value ? CheckCircle2 : LockKeyhole,
    done: isLoggedIn.value,
    locked: false,
  },
  {
    id: 2,
    title: 'Passageiro e adicionais',
    icon: currentStep.value > 2 ? CheckCircle2 : Ship,
    done: currentStep.value > 2,
    locked: !isLoggedIn.value,
  },
  {
    id: 3,
    title: 'Pagamento',
    icon: currentStep.value === 3 ? CreditCard : LockKeyhole,
    done: Boolean(result.value),
    locked: !isLoggedIn.value || currentStep.value < 3,
  },
])

const passengers = reactive([createPassenger()])

const holder = reactive({
  name: authState.customer?.nome || '',
  email: authState.customer?.email || '',
  cpf_cnpj: authState.customer?.cpf_cnpj || '',
  postal_code: '',
  address_number: '',
  address_complement: '',
  phone: authState.customer?.telefone || '',
  mobile_phone: authState.customer?.telefone || '',
})

const card = reactive({
  holder_name: '',
  number: '',
  expiry_month: '',
  expiry_year: '',
  ccv: '',
})

const cardPreviewNumber = computed(() => {
  const digits = onlyDigits(card.number)
  if (!digits) {
    return '0000 0000 0000 0000'
  }

  return (digits + '0000000000000000').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
})
const cardBrandLabel = computed(() => {
  const digits = onlyDigits(card.number)
  if (digits.startsWith('4')) {
    return 'Visa'
  }
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) {
    return 'Mastercard'
  }
  if (/^3[47]/.test(digits)) {
    return 'Amex'
  }
  if (/^6/.test(digits)) {
    return 'Elo'
  }

  return 'Cartao'
})
const cardExpiryPreview = computed(() => {
  const month = card.expiry_month || 'MM'
  const year = card.expiry_year ? card.expiry_year.slice(-2) : 'AA'
  return `${month}/${year}`
})

const reservation = reactive({
  suiteId: '',
  paymentMethod: 'PIX',
  adicionais: {},
})

const selectedAdicionais = computed(() =>
  Object.entries(reservation.adicionais)
    .filter(([, quantity]) => Number(quantity) > 0)
    .map(([adicionalId, quantity]) => ({
      adicional_id: Number(adicionalId),
      quantidade: Number(quantity),
    })),
)
const simulatedTotal = computed(() => getSimulatedValue('valor_total'))
const simulatedTotalLabel = computed(() => formatCurrencyValue(simulatedTotal.value))
const selectedSuite = computed(() => suites.value.find((suite) => String(suite.id) === String(reservation.suiteId)) || null)
const suiteIncludedLimit = computed(() => Number(selectedSuite.value?.passageiros_inclusos || 0))
const suiteMarkedPassengers = computed(() => passengers.filter((item) => item.suite).length)
const defaultCheckoutNoticeText = `Documentacao obrigatoria: Todos os passageiros devem apresentar documento oficial com foto durante o embarque.
Menores de 16 anos: Criancas ou adolescentes nao podem viajar sozinhos ou acompanhados sem autorizacao autenticada em cartorio.
Transporte de pets: A passagem nao inclui automaticamente o transporte de pets. O embarque esta sujeito a disponibilidade e limite por viagem.`
const checkoutNoticeText = computed(() => tenantState.client.site_avisos_previos?.trim() || defaultCheckoutNoticeText)
const noticeItems = computed(() => splitTextBlocks(checkoutNoticeText.value).map(parseNoticeItem))

onMounted(async () => {
  await loadSelectedRoute()

  if (!ticket.value) {
    return
  }

  fillPaymentHolderFields()
  await loadReservationOptions()
})

watch(
  () => authState.access,
  async () => {
    fillPaymentHolderFields()
    if (authState.access && currentStep.value === 1) {
      currentStep.value = 2
    }
    await loadReservationOptions()
  },
)

watch(currentStep, () => {
  stepError.value = ''
  error.value = ''
})

watch(
  [passengers, selectedAdicionais, () => reservation.suiteId, ticket],
  () => {
    scheduleSimulation()
  },
  { deep: true },
)

watch(
  () => reservation.suiteId,
  () => {
    normalizeSuitePassengers()
  },
)

function fillPaymentHolderFields() {
  holder.name = authState.customer?.nome || holder.name
  holder.email = authState.customer?.email || holder.email
  holder.cpf_cnpj = formatCpfCnpj(authState.customer?.cpf_cnpj || holder.cpf_cnpj)
  holder.postal_code = formatCep(authState.customer?.postal_code || holder.postal_code)
  holder.address_number = formatAddressNumber(authState.customer?.address_number || holder.address_number)
  holder.address_complement = authState.customer?.address_complement || holder.address_complement
  holder.phone = formatPhone(authState.customer?.telefone || holder.phone)
  holder.mobile_phone = formatPhone(authState.customer?.telefone || holder.mobile_phone)
}

async function loadReservationOptions() {
  if (!ticket.value || !tenantState.clientUid) {
    return
  }

  loadingOptions.value = true

  try {
    const [suitesResponse, adicionaisResponse] = await Promise.all([
      listPublicSuites({
        client_uid: tenantState.clientUid,
        data: ticket.value.departure,
        rota_id: ticket.value.id,
      }),
      listPublicAdicionais({
        client_uid: tenantState.clientUid,
        rota_id: ticket.value.id,
      }),
    ])

    suites.value = normalizeApiCollection(suitesResponse, ['suites_disponiveis', 'suites', 'data'])
    adicionaisOptions.value = normalizeApiCollection(adicionaisResponse, ['adicionais', 'data'])
  } catch (err) {
    error.value = err.message
  } finally {
    loadingOptions.value = false
  }
}

async function loadSelectedRoute() {
  const cachedRoute = getCachedPublicRoute(route.params.id, route.query.data)

  if (cachedRoute) {
    selectedTicket.value = cachedRoute
  }

  if (!tenantState.clientUid) {
    routeLoading.value = false
    return
  }

  routeLoading.value = !cachedRoute

  try {
    const response = await listPublicRoutes({
      client_uid: tenantState.clientUid,
      rota_id: route.params.id,
      ...(route.query.data ? { data: route.query.data } : {}),
    })
    const routes = normalizeApiCollection(response, 'rotas')
    const apiRoute = routes.find((item) => String(item.id) === String(route.params.id))

    if (apiRoute) {
      const mappedRoute = mapPublicRouteToTicket(apiRoute, route.query.data)
      selectedTicket.value = mappedRoute
      cachePublicTickets([...publicRouteState.routes, mappedRoute])
    }
  } catch (err) {
    error.value = err.message
  } finally {
    routeLoading.value = false
  }
}

function clearCardFields() {
  card.holder_name = ''
  card.number = ''
  card.expiry_month = ''
  card.expiry_year = ''
  card.ccv = ''
}

function getSimulationPayload() {
  if (!tenantState.clientUid || !ticket.value || !passengers.length) {
    return null
  }

  const hasRequiredPassengerData = passengers.every((item) => item.nome.trim() && item.documento.trim() && item.data_nascimento)

  if (!hasRequiredPassengerData) {
    return null
  }

  return {
    client_uid: tenantState.clientUid,
    rota_id: ticket.value.id,
    suite_id: reservation.suiteId || null,
    data_reserva: ticket.value.departure,
    passageiros: passengers.map((item) => ({
      nome: item.nome,
      documento: onlyDigits(item.documento),
      data_nascimento: item.data_nascimento,
      pcd: Boolean(item.pcd),
      suite: Boolean(reservation.suiteId && item.suite),
    })),
    adicionais: selectedAdicionais.value,
  }
}

function scheduleSimulation() {
  window.clearTimeout(simulationTimer)
  simulationError.value = ''

  const payload = getSimulationPayload()
  if (!payload) {
    simulatedPrice.value = null
    simulationLoading.value = false
    return
  }

  simulationLoading.value = true
  simulationTimer = window.setTimeout(() => {
    simulateReservationValue(payload)
  }, 450)
}

async function simulateReservationValue(payload) {
  try {
    const response = await calculatePublicReservationValue(payload)
    simulatedPrice.value = response?.data || response
  } catch (err) {
    simulatedPrice.value = null
    simulationError.value = err.message
  } finally {
    simulationLoading.value = false
  }
}

function getSimulatedValue(key) {
  return simulatedPrice.value?.[key] ?? simulatedPrice.value?.data?.[key] ?? null
}

function formatCurrencyValue(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const numberValue = Number(String(value).replace(',', '.'))
  if (Number.isNaN(numberValue)) {
    return String(value)
  }

  return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function splitTextBlocks(value) {
  return String(value || '')
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseNoticeItem(value) {
  const index = value.indexOf(':')

  if (index <= 0) {
    return { title: '', body: value }
  }

  return {
    title: value.slice(0, index + 1),
    body: value.slice(index + 1).trim(),
  }
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function formatCpfCnpj(value) {
  const digits = onlyDigits(value).slice(0, 14)

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
      .slice(0, 14)
  }

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18)
}

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11)

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 14)
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15)
}

function formatCep(value) {
  return onlyDigits(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2')
}

function formatCardNumber(value) {
  return onlyDigits(value).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiryMonth(value) {
  const digits = onlyDigits(value).slice(0, 2)
  if (!digits) {
    return ''
  }

  const month = Math.min(Number(digits), 12)
  return month ? String(month).padStart(digits.length === 1 ? 1 : 2, '0') : digits
}

function formatExpiryYear(value) {
  return onlyDigits(value).slice(0, 4)
}

function formatCvv(value) {
  return onlyDigits(value).slice(0, 4)
}

function formatAddressNumber(value) {
  return onlyDigits(value).slice(0, 8)
}

function formatPassengerDocument(index) {
  passengers[index].documento = formatCpfCnpj(passengers[index].documento)
}

function formatPassengerPhone(index) {
  passengers[index].telefone = formatPhone(passengers[index].telefone)
}

function createPassenger(defaults = {}) {
  return {
    nome: defaults.nome || '',
    documento: defaults.documento || '',
    data_nascimento: defaults.data_nascimento || '',
    telefone: defaults.telefone || '',
    email: defaults.email || '',
    pcd: Boolean(defaults.pcd),
    suite: Boolean(defaults.suite),
  }
}

function applyLoggedCustomerToPassenger(index) {
  if (!authState.customer || !passengers[index]) {
    return
  }

  passengers[index].nome = authState.customer.nome || passengers[index].nome
  passengers[index].documento = formatCpfCnpj(authState.customer.cpf_cnpj || passengers[index].documento)
  passengers[index].telefone = formatPhone(authState.customer.telefone || passengers[index].telefone)
  passengers[index].email = authState.customer.email || passengers[index].email
}

function addPassenger() {
  passengers.push(createPassenger())
}

function setPassengerCount(value) {
  const count = Math.min(Math.max(Number(value) || 1, 1), 10)

  while (passengers.length < count) {
    addPassenger()
  }

  while (passengers.length > count) {
    passengers.pop()
  }

  normalizeSuitePassengers()
}

function removePassenger(index) {
  if (passengers.length === 1) {
    return
  }

  passengers.splice(index, 1)
  normalizeSuitePassengers()
}

function normalizeSuitePassengers() {
  if (!reservation.suiteId) {
    passengers.forEach((item) => {
      item.suite = false
    })
    return
  }

  let marked = 0
  passengers.forEach((item) => {
    if (!item.suite) {
      return
    }

    marked += 1
    if (suiteIncludedLimit.value && marked > suiteIncludedLimit.value) {
      item.suite = false
    }
  })
}

function canMarkPassengerAsSuite(item) {
  return Boolean(reservation.suiteId) && (item.suite || suiteMarkedPassengers.value < suiteIncludedLimit.value)
}

function isAdicionalSelected(itemId) {
  return Number(reservation.adicionais[itemId] || 0) > 0
}

function toggleAdicional(item) {
  if (isAdicionalSelected(item.id)) {
    reservation.adicionais[item.id] = 0
    return
  }

  reservation.adicionais[item.id] = 1
}

function incrementAdicional(item) {
  const current = Number(reservation.adicionais[item.id] || 0)
  const limit = Number(item.limite_por_reserva || 9)
  reservation.adicionais[item.id] = Math.min(current + 1, limit)
}

function decrementAdicional(item) {
  const current = Number(reservation.adicionais[item.id] || 0)
  reservation.adicionais[item.id] = Math.max(current - 1, 0)
}

function canContinuePassengerStep() {
  const invalidIndex = passengers.findIndex((item) => !item.nome.trim() || !item.documento.trim() || !item.data_nascimento)

  if (invalidIndex >= 0) {
    stepError.value = `Preencha nome, CPF/CNPJ e data de nascimento do passageiro ${invalidIndex + 1}.`
    return false
  }

  if (reservation.suiteId && suiteMarkedPassengers.value > suiteIncludedLimit.value) {
    stepError.value = `A suite selecionada permite ${suiteIncludedLimit.value} passageiro(s) incluso(s).`
    return false
  }

  stepError.value = ''
  return true
}

function canContinueToPayment() {
  if (!canContinuePassengerStep()) {
    return false
  }

  if (!termsAccepted.value) {
    stepError.value = 'E necessario aceitar os termos de uso e a politica de privacidade para continuar.'
    return false
  }

  stepError.value = ''
  return true
}

function goToStep(step) {
  if (step === 1) {
    currentStep.value = 1
    return
  }

  if (!isLoggedIn.value) {
    currentStep.value = 1
    stepError.value = 'Entre ou cadastre-se para continuar.'
    return
  }

  if (step === 3 && !canContinueToPayment()) {
    currentStep.value = 2
    return
  }

  currentStep.value = step
}

async function submitReservation() {
  if (!authState.access) {
    error.value = 'Entre ou cadastre-se para finalizar a reserva.'
    currentStep.value = 1
    return
  }

  if (!canContinuePassengerStep()) {
    currentStep.value = 2
    return
  }

  if (!termsAccepted.value) {
    error.value = 'E necessario aceitar os termos e a politica de privacidade para continuar.'
    return
  }

  submitting.value = true
  error.value = ''
  result.value = null

  try {
    const payload = buildReservationPayload({
      ticket: ticket.value,
      passengers: passengers.map((item) => ({
        ...item,
        documento: onlyDigits(item.documento),
        telefone: onlyDigits(item.telefone),
      })),
      suiteId: reservation.suiteId || null,
      adicionais: selectedAdicionais.value,
      paymentMethod: reservation.paymentMethod,
      card: {
        ...card,
        number: onlyDigits(card.number),
        expiry_month: onlyDigits(card.expiry_month),
        expiry_year: onlyDigits(card.expiry_year),
        ccv: onlyDigits(card.ccv),
      },
      holder: {
        ...holder,
        cpf_cnpj: onlyDigits(holder.cpf_cnpj),
        postal_code: onlyDigits(holder.postal_code),
        address_number: onlyDigits(holder.address_number),
        phone: onlyDigits(holder.phone),
        mobile_phone: onlyDigits(holder.mobile_phone),
      },
    })

    const response = await createCustomerReservation(payload, authState.access)
    result.value = response.data || response
    clearCardFields()
  } catch (err) {
    error.value = err.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="bg-slate-50 px-4 py-10 sm:px-6">
    <section v-if="routeLoading" class="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.78fr_1.22fr]">
      <aside class="h-max rounded-lg bg-white p-5 shadow">
        <div class="h-56 w-full animate-pulse rounded bg-slate-200"></div>
        <div class="mt-5 h-4 w-28 animate-pulse rounded bg-slate-200"></div>
        <div class="mt-3 h-8 w-3/4 animate-pulse rounded bg-slate-200"></div>
        <div class="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-200"></div>
      </aside>
      <div class="rounded-lg bg-white p-5 shadow">
        <div class="h-8 w-48 animate-pulse rounded bg-slate-200"></div>
        <div class="mt-5 grid gap-3">
          <div v-for="item in 4" :key="item" class="h-14 animate-pulse rounded bg-slate-200"></div>
        </div>
      </div>
    </section>

    <section v-else-if="!ticket" class="mx-auto max-w-3xl rounded-lg bg-white p-8 text-center shadow">
      <h1 class="text-2xl font-black text-sky-950">Rota nao encontrada</h1>
      <p v-if="error" class="mt-3 rounded bg-amber-50 p-3 text-sm font-bold text-amber-800">{{ error }}</p>
      <RouterLink class="mt-4 inline-flex font-bold text-sky-600" to="/">Voltar para passagens</RouterLink>
    </section>

    <section v-else class="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.78fr_1.22fr]">
      <aside class="h-max rounded-lg bg-white p-5 shadow lg:sticky lg:top-24">
        <img class="h-56 w-full rounded object-cover" :src="ticket.image" :alt="ticket.boat" />
        <p class="mt-5 text-sm font-bold uppercase text-sky-500">{{ ticket.type }}</p>
        <h1 class="mt-1 text-2xl font-black text-sky-950">{{ ticket.origin }} para {{ ticket.destination }}</h1>
        <p class="mt-2 text-sm font-semibold text-slate-500">{{ ticket.boat }}</p>

        <div class="mt-5 grid grid-cols-2 gap-3 text-sm font-bold text-slate-600">
          <span>Partida<br /><strong class="text-sky-950">{{ formatDateBr(ticket.departure) }}</strong></span>
          <span>Chegada<br /><strong class="text-sky-950">{{ formatDateBr(ticket.arrival) }}</strong></span>
          <span v-if="ticket.departureTime">Horario partida<br /><strong class="text-sky-950">{{ ticket.departureTime }}</strong></span>
          <span v-if="ticket.arrivalTime">Horario chegada<br /><strong class="text-sky-950">{{ ticket.arrivalTime }}</strong></span>
        </div>

        <div class="mt-5 flex gap-2 text-sky-950">
          <span class="grid size-9 place-items-center rounded-full bg-sky-50"><Bed class="size-4" /></span>
          <span class="grid size-9 place-items-center rounded-full bg-sky-50"><Utensils class="size-4" /></span>
          <span class="grid size-9 place-items-center rounded-full bg-sky-50"><Waves class="size-4" /></span>
        </div>

        <div class="mt-5 rounded border border-slate-200 bg-slate-50 p-4">
          <p class="text-xs font-bold uppercase text-slate-400">Valor final</p>
          <p v-if="simulationLoading" class="mt-1 text-sm font-black text-slate-600">Calculando...</p>
          <p v-else-if="simulatedTotalLabel" class="mt-1 text-2xl font-black text-sky-950">{{ simulatedTotalLabel }}</p>
          <p v-else class="mt-1 text-sm font-semibold text-slate-600">Preencha os passageiros para simular.</p>
          <p class="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-sky-950">
            <UsersRound class="size-4 text-[var(--brand-primary)]" />
            {{ passengers.length }} passageiro{{ passengers.length === 1 ? '' : 's' }}
          </p>
        </div>

        <div class="mt-5 space-y-3 rounded-lg border border-slate-200 p-4">
          <button
            v-for="step in stepItems"
            :key="step.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-black transition"
            :class="[
              currentStep === step.id ? 'bg-sky-50 text-sky-950' : step.done ? 'text-emerald-700' : 'text-slate-500',
              step.locked ? 'cursor-not-allowed opacity-60' : 'hover:bg-slate-50',
            ]"
            :disabled="step.locked"
            @click="goToStep(step.id)"
          >
            <span
              class="grid size-8 shrink-0 place-items-center rounded-full"
              :class="currentStep === step.id ? 'bg-[var(--brand-primary)] text-white' : step.done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
            >
              <component :is="step.icon" class="size-4" />
            </span>
            <span>{{ step.id }}. {{ step.title }}</span>
          </button>
        </div>
      </aside>

      <div class="space-y-5">
        <div class="rounded-lg bg-white p-5 shadow">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-sm font-black uppercase text-[var(--brand-primary)]">Checkout</p>
              <h2 class="text-2xl font-black text-sky-950">Finalizar reserva</h2>
              <p class="text-sm font-semibold text-slate-500">Etapa {{ currentStep }} de 3</p>
            </div>
            <RouterLink class="text-sm font-bold text-sky-600" to="/">Trocar passagem</RouterLink>
          </div>

          <div class="mt-5 grid gap-2 sm:grid-cols-3">
            <button
              v-for="step in stepItems"
              :key="`top-${step.id}`"
              type="button"
              class="flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-xs font-black uppercase transition"
              :class="currentStep === step.id ? 'border-[var(--brand-primary)] bg-sky-50 text-sky-950' : step.done ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'"
              :disabled="step.locked"
              @click="goToStep(step.id)"
            >
              <span class="grid size-7 shrink-0 place-items-center rounded-full bg-white">
                <component :is="step.icon" class="size-4" />
              </span>
              {{ step.title }}
            </button>
          </div>
        </div>

        <CheckoutAuthPanel v-if="currentStep === 1 && !isLoggedIn" @authenticated="goToStep(2)" />

        <section v-else-if="currentStep === 1" class="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div class="flex items-start gap-3">
            <CheckCircle2 class="mt-1 size-5 text-emerald-700" />
            <div>
              <h3 class="text-xl font-black text-emerald-900">Identificacao confirmada</h3>
              <p class="mt-1 text-sm font-bold text-emerald-700">Voce ja esta logado. Continue para informar os dados do passageiro.</p>
            </div>
          </div>
          <button class="mt-5 h-12 rounded bg-[var(--brand-primary)] px-6 text-sm font-black uppercase text-white" type="button" @click="goToStep(2)">
            Continuar
          </button>
        </section>

        <form v-if="currentStep === 2" class="rounded-lg bg-white p-5 shadow" @submit.prevent="goToStep(3)">
          <fieldset class="grid gap-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <legend class="text-lg font-black text-sky-950">Passageiros</legend>
              <div class="flex flex-wrap items-center gap-2">
                <label class="flex h-10 items-center gap-2 rounded border border-slate-300 px-3 text-sm font-black text-slate-600">
                  Quantidade
                  <select class="bg-transparent text-sky-950 outline-none" :value="passengers.length" @change="setPassengerCount($event.target.value)">
                    <option v-for="quantity in 10" :key="quantity" :value="quantity">{{ quantity }}</option>
                  </select>
                </label>
                <button
                  class="inline-flex h-10 items-center gap-2 rounded bg-sky-50 px-4 text-sm font-black text-sky-700"
                  type="button"
                  @click="addPassenger"
                >
                  <Plus class="size-4" />
                  Adicionar
                </button>
              </div>
            </div>

            <div
              v-for="(item, index) in passengers"
              :key="index"
              class="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div class="mb-3 flex items-center justify-between gap-3">
                <p class="inline-flex items-center gap-2 text-sm font-black uppercase text-sky-950">
                  <UsersRound class="size-4 text-[var(--brand-primary)]" />
                  Passageiro {{ index + 1 }}
                </p>
                <div class="flex items-center gap-2">
                  <button
                    v-if="authState.customer"
                    class="inline-flex h-9 items-center justify-center rounded border border-sky-100 px-3 text-xs font-black text-sky-700 transition hover:bg-sky-50"
                    type="button"
                    @click="applyLoggedCustomerToPassenger(index)"
                  >
                    Usar meus dados
                  </button>
                  <button
                    v-if="passengers.length > 1"
                    class="inline-flex size-9 items-center justify-center rounded border border-red-100 text-red-600 transition hover:bg-red-50"
                    type="button"
                    title="Remover passageiro"
                    @click="removePassenger(index)"
                  >
                    <Trash2 class="size-4" />
                  </button>
                </div>
              </div>

              <p v-if="authState.customer" class="mb-3 rounded bg-sky-50 p-3 text-sm font-bold text-sky-800">
                Este passageiro e o usuario logado? Clique em "Usar meus dados" para preencher.
              </p>

              <label class="grid gap-1 text-sm font-bold text-slate-600">
                Nome completo
                <input v-model="item.nome" required class="h-11 w-full rounded border border-slate-300 px-3 font-semibold text-slate-800 outline-sky-500" placeholder="Digite o nome completo" />
              </label>
              <div class="mt-3 grid gap-3 sm:grid-cols-2">
                <label class="grid gap-1 text-sm font-bold text-slate-600">
                  CPF/CNPJ
                  <input v-model="item.documento" required class="h-11 rounded border border-slate-300 px-3 font-semibold text-slate-800 outline-sky-500" inputmode="numeric" placeholder="000.000.000-00" @input="formatPassengerDocument(index)" />
                </label>
                <label class="grid gap-1 text-sm font-bold text-slate-600">
                  Data de nascimento
                  <input v-model="item.data_nascimento" required type="date" class="h-11 rounded border border-slate-300 px-3 font-semibold text-slate-800 outline-sky-500" />
                </label>
                <label class="grid gap-1 text-sm font-bold text-slate-600">
                  E-mail
                  <input v-model="item.email" type="email" class="h-11 rounded border border-slate-300 px-3 font-semibold text-slate-800 outline-sky-500" placeholder="Digite o e-mail" />
                </label>
                <label class="grid gap-1 text-sm font-bold text-slate-600">
                  Telefone
                  <input v-model="item.telefone" class="h-11 rounded border border-slate-300 px-3 font-semibold text-slate-800 outline-sky-500" inputmode="tel" placeholder="(92) 99999-9999" @input="formatPassengerPhone(index)" />
                </label>
              </div>
              <label class="mt-3 flex items-center gap-2 text-sm font-bold text-slate-600">
                <input v-model="item.pcd" type="checkbox" class="size-4 accent-sky-500" />
                Passageiro PCD
              </label>
              <label
                v-if="reservation.suiteId"
                class="mt-3 flex items-start gap-3 rounded-lg border p-3 text-sm font-bold"
                :class="item.suite ? 'border-sky-200 bg-sky-50 text-sky-900' : 'border-slate-200 bg-slate-50 text-slate-600'"
              >
                <input
                  v-model="item.suite"
                  type="checkbox"
                  class="mt-0.5 size-4 accent-sky-500"
                  :disabled="!canMarkPassengerAsSuite(item)"
                />
                <span>
                  Passageiro incluso na suite
                  <span class="block text-xs font-semibold text-slate-500">
                    {{ suiteMarkedPassengers }} de {{ suiteIncludedLimit }} incluso{{ suiteIncludedLimit === 1 ? '' : 's' }} selecionado{{ suiteMarkedPassengers === 1 ? '' : 's' }}.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          <fieldset class="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <legend class="text-lg font-black text-sky-950">Suite e adicionais</legend>
                <p class="mt-1 text-sm font-semibold text-slate-500">Escolha opcionais para a reserva.</p>
              </div>
              <p v-if="loadingOptions" class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">Carregando...</p>
            </div>

            <div class="mt-4">
              <p class="text-sm font-bold text-slate-600">Suite</p>
              <div class="mt-2 grid gap-3 sm:grid-cols-2">
                <label
                  class="cursor-pointer rounded-lg border bg-white p-4 transition"
                  :class="!reservation.suiteId ? 'border-[var(--brand-primary)] ring-2 ring-sky-100' : 'border-slate-200 hover:border-sky-200'"
                >
                  <input v-model="reservation.suiteId" class="sr-only" type="radio" value="" />
                  <span class="flex items-start justify-between gap-3">
                    <span>
                      <span class="block text-base font-black text-sky-950">Sem suite</span>
                      <span class="mt-1 block text-xs font-semibold text-slate-500">Reserva somente com passagem.</span>
                    </span>
                    <span
                      class="grid size-5 shrink-0 place-items-center rounded-full border"
                      :class="!reservation.suiteId ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]' : 'border-slate-300'"
                    >
                      <span v-if="!reservation.suiteId" class="size-2 rounded-full bg-white"></span>
                    </span>
                  </span>
                </label>

                <label
                  v-for="suite in suites"
                  :key="suite.id"
                  class="cursor-pointer rounded-lg border bg-white p-4 transition"
                  :class="String(reservation.suiteId) === String(suite.id) ? 'border-[var(--brand-primary)] ring-2 ring-sky-100' : 'border-slate-200 hover:border-sky-200'"
                >
                  <input v-model="reservation.suiteId" class="sr-only" type="radio" :value="suite.id" />
                  <span class="flex items-start justify-between gap-3">
                    <span>
                      <span class="block text-base font-black text-sky-950">{{ suite.nome }}</span>
                      <span class="mt-1 block text-xs font-semibold text-slate-500">
                        Capacidade {{ suite.capacidade_maxima || '-' }}
                        <template v-if="suite.passageiros_inclusos"> · {{ suite.passageiros_inclusos }} incluso{{ suite.passageiros_inclusos === 1 ? '' : 's' }}</template>
                      </span>
                      <span v-if="suite.valor" class="mt-3 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                        {{ formatCurrencyValue(suite.valor) }}
                      </span>
                    </span>
                    <span
                      class="grid size-5 shrink-0 place-items-center rounded-full border"
                      :class="String(reservation.suiteId) === String(suite.id) ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]' : 'border-slate-300'"
                    >
                      <span v-if="String(reservation.suiteId) === String(suite.id)" class="size-2 rounded-full bg-white"></span>
                    </span>
                  </span>
                </label>
              </div>
              <div v-if="selectedSuite" class="mt-3 rounded-lg border border-sky-100 bg-white p-3 text-sm font-bold text-sky-950">
                A suite selecionada inclui
                <strong>{{ suiteIncludedLimit }}</strong>
                passageiro{{ suiteIncludedLimit === 1 ? '' : 's' }}.
                Marque nos passageiros quem ficara incluso na suite.
              </div>
            </div>

            <div class="mt-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <p class="text-sm font-black uppercase text-sky-950">Adicionais</p>
                <span v-if="loadingOptions" class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                  Carregando...
                </span>
                <span v-else-if="adicionaisOptions.length" class="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                  {{ adicionaisOptions.length }} adicional{{ adicionaisOptions.length === 1 ? '' : 'is' }}
                </span>
              </div>

              <div v-if="!adicionaisOptions.length && !loadingOptions" class="rounded border border-dashed border-slate-300 bg-white p-4 text-sm font-bold text-slate-500">
                Nenhum adicional disponivel para esta rota.
              </div>

              <div v-else class="grid gap-3 sm:grid-cols-2">
                <div
                  v-for="item in adicionaisOptions"
                  :key="item.id"
                  class="rounded-lg border bg-white p-4 text-sm font-bold text-slate-600 shadow-sm transition"
                  :class="isAdicionalSelected(item.id) ? 'border-[var(--brand-primary)] ring-2 ring-sky-100' : 'border-slate-200'"
                >
                  <button class="flex w-full items-start justify-between gap-3 text-left" type="button" @click="toggleAdicional(item)">
                    <span>
                      <span class="block text-base font-black text-sky-950">{{ item.nome }}</span>
                      <span v-if="item.descricao" class="mt-1 block text-xs font-semibold text-slate-400">{{ item.descricao }}</span>
                    </span>
                    <span
                      class="grid size-5 shrink-0 place-items-center rounded border"
                      :class="isAdicionalSelected(item.id) ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]' : 'border-slate-300'"
                    >
                      <span v-if="isAdicionalSelected(item.id)" class="size-2 rounded bg-white"></span>
                    </span>
                  </button>

                  <span class="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-500">
                    <span v-if="item.valor" class="rounded-full bg-sky-50 px-2 py-1 text-sky-700">
                      {{ formatCurrencyValue(item.valor) }}
                    </span>
                    <span class="rounded-full bg-slate-100 px-2 py-1">
                      Limite {{ item.limite_por_reserva || 9 }}
                    </span>
                  </span>

                  <div v-if="isAdicionalSelected(item.id)" class="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-2">
                    <span class="text-sm font-black text-sky-950">Quantidade</span>
                    <div class="flex items-center gap-2">
                      <button
                        class="grid size-9 place-items-center rounded border border-slate-300 bg-white text-lg font-black text-sky-950"
                        type="button"
                        @click="decrementAdicional(item)"
                      >
                        -
                      </button>
                      <span class="grid h-9 min-w-10 place-items-center rounded bg-white px-3 text-sm font-black text-sky-950">
                        {{ reservation.adicionais[item.id] || 0 }}
                      </span>
                      <button
                        class="grid size-9 place-items-center rounded border border-slate-300 bg-white text-lg font-black text-sky-950 disabled:opacity-40"
                        type="button"
                        :disabled="Number(reservation.adicionais[item.id] || 0) >= Number(item.limite_por_reserva || 9)"
                        @click="incrementAdicional(item)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

          <section class="mt-6 rounded-lg border border-sky-100 bg-sky-50 p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase text-sky-700">Previa da reserva</p>
                <p v-if="simulationLoading" class="mt-1 text-lg font-black text-slate-600">Calculando...</p>
                <p v-else-if="simulatedTotalLabel" class="mt-1 text-2xl font-black text-sky-950">{{ simulatedTotalLabel }}</p>
                <p v-else class="mt-1 text-sm font-semibold text-slate-500">
                  Preencha nome, CPF/CNPJ e data de nascimento para simular.
                </p>
              </div>
              <span class="rounded-full bg-white px-3 py-1 text-xs font-black text-sky-950 shadow-sm">
                {{ passengers.length }} passageiro{{ passengers.length === 1 ? '' : 's' }}
              </span>
            </div>
            <p v-if="simulationError" class="mt-3 rounded bg-amber-50 p-3 text-sm font-bold text-amber-800">
              {{ simulationError }}
            </p>
          </section>

          <section class="mt-5 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div class="border-b border-slate-200 pb-3">
              <h3 class="text-sm font-black text-sky-950">Avisos da reserva</h3>
            </div>

            <div class="mt-4 space-y-4 text-xs font-semibold leading-relaxed text-amber-800">
              <p v-for="(item, index) in noticeItems" :key="index">
                <strong v-if="item.title">{{ item.title }}</strong>
                {{ item.body }}
              </p>
            </div>
          </section>

          <section class="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <div class="flex items-start gap-3">
              <label class="mt-0.5 inline-flex cursor-pointer items-center">
                <input v-model="termsAccepted" class="sr-only" type="checkbox" />
                <span
                  class="relative inline-flex h-7 w-12 rounded-full transition"
                  :class="termsAccepted ? 'bg-[var(--brand-primary)]' : 'bg-slate-300'"
                >
                  <span
                    class="absolute top-1 grid size-5 place-items-center rounded-full bg-white shadow transition"
                    :class="termsAccepted ? 'left-6' : 'left-1'"
                  ></span>
                </span>
              </label>

              <div class="min-w-0 flex-1 text-sm font-semibold text-slate-600">
                <p>
                  Li e aceito os
                  <RouterLink class="font-black text-[var(--brand-primary)] underline" :to="{ name: 'terms' }" target="_blank" rel="noreferrer">
                    termos de uso
                  </RouterLink>
                  e
                  <RouterLink class="font-black text-[var(--brand-primary)] underline" :to="{ name: 'privacy' }" target="_blank" rel="noreferrer">
                    politica de privacidade
                  </RouterLink>
                  .
                </p>
              </div>
            </div>
          </section>

          <p v-if="stepError" class="mt-5 rounded bg-amber-50 p-3 text-sm font-bold text-amber-800">{{ stepError }}</p>

          <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button class="h-11 rounded border border-slate-300 px-5 text-sm font-black text-slate-600" type="button" @click="goToStep(1)">
              Voltar
            </button>
            <button class="h-11 rounded bg-[var(--brand-primary)] px-6 text-sm font-black uppercase text-white disabled:bg-slate-300" type="submit" :disabled="!termsAccepted">
              Continuar para pagamento
            </button>
          </div>
        </form>

        <form v-if="currentStep === 3" class="rounded-lg bg-white p-5 shadow" @submit.prevent="submitReservation">
          <fieldset>
            <legend class="mb-3 text-lg font-black text-sky-950">Pagamento</legend>
            <div class="grid gap-2 sm:grid-cols-2">
              <label class="flex cursor-pointer items-center justify-center gap-2 rounded border p-3 text-sm font-black" :class="reservation.paymentMethod === 'PIX' ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-500'">
                <input v-model="reservation.paymentMethod" class="sr-only" type="radio" value="PIX" />
                <QrCode class="size-4" />
                PIX
              </label>
              <label class="flex cursor-pointer items-center justify-center gap-2 rounded border p-3 text-sm font-black" :class="reservation.paymentMethod === 'CREDIT_CARD' ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-500'">
                <input v-model="reservation.paymentMethod" class="sr-only" type="radio" value="CREDIT_CARD" />
                <CreditCard class="size-4" />
                Cartao
              </label>
            </div>
          </fieldset>

          <section v-if="reservation.paymentMethod === 'CREDIT_CARD'" class="mt-5 rounded-lg border border-slate-200 bg-white p-5">
            <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-sm font-black uppercase text-slate-500">Cartao de credito</p>
                <p class="mt-1 text-sm font-semibold text-slate-500">Informe os dados para gerar a cobranca com seguranca.</p>
              </div>
              <span class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                <LockKeyhole class="size-4" />
                Dados nao salvos no frontend
              </span>
            </div>

            <div class="mb-6 rounded-lg bg-[var(--brand-secondary)] p-4 text-white">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <span class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black uppercase">
                  <CreditCard class="size-4" />
                  {{ cardBrandLabel }}
                </span>
                <ShieldCheck class="size-5 text-sky-100" />
              </div>
              <p class="mt-5 text-lg font-black tracking-[0.16em] sm:text-xl">{{ cardPreviewNumber }}</p>
              <div class="mt-5 grid gap-3 text-xs font-black uppercase text-white/70 sm:grid-cols-[1fr_auto]">
                <span>
                  Nome impresso
                  <strong class="mt-1 block truncate text-sm text-white">{{ card.holder_name || 'NOME DO TITULAR' }}</strong>
                </span>
                <span class="sm:text-right">
                  Validade
                  <strong class="mt-1 block text-sm text-white">{{ cardExpiryPreview }}</strong>
                </span>
              </div>
            </div>

            <div class="grid gap-6">
              <div>
                <p class="text-sm font-black uppercase text-slate-500">Dados do cartao</p>
                <div class="mt-3 grid gap-4 md:grid-cols-2">
                  <label class="grid gap-1 text-sm font-bold text-slate-600">
                    Nome impresso no cartao
                    <span class="flex h-12 items-center gap-3 rounded border border-slate-300 bg-white px-3 focus-within:border-[var(--brand-primary)] focus-within:ring-4 focus-within:ring-sky-100">
                      <UserRound class="size-4 text-slate-400" />
                      <input v-model="card.holder_name" required class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 outline-none" autocomplete="cc-name" placeholder="JOAO SILVA" />
                    </span>
                  </label>

                  <label class="grid gap-1 text-sm font-bold text-slate-600">
                    Numero do cartao
                    <span class="flex h-12 items-center gap-3 rounded border border-slate-300 bg-white px-3 focus-within:border-[var(--brand-primary)] focus-within:ring-4 focus-within:ring-sky-100">
                      <CreditCard class="size-4 text-slate-400" />
                      <input v-model="card.number" required class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 outline-none" autocomplete="cc-number" inputmode="numeric" placeholder="0000 0000 0000 0000" @input="card.number = formatCardNumber(card.number)" />
                    </span>
                  </label>

                  <div class="grid gap-3 sm:grid-cols-3 md:col-span-2">
                    <label class="grid gap-1 text-sm font-bold text-slate-600">
                      Mes
                      <input v-model="card.expiry_month" required class="h-12 rounded border border-slate-300 bg-white px-3 outline-sky-500" autocomplete="cc-exp-month" inputmode="numeric" placeholder="MM" @input="card.expiry_month = formatExpiryMonth(card.expiry_month)" />
                    </label>
                    <label class="grid gap-1 text-sm font-bold text-slate-600">
                      Ano
                      <input v-model="card.expiry_year" required class="h-12 rounded border border-slate-300 bg-white px-3 outline-sky-500" autocomplete="cc-exp-year" inputmode="numeric" placeholder="AAAA" @input="card.expiry_year = formatExpiryYear(card.expiry_year)" />
                    </label>
                    <label class="grid gap-1 text-sm font-bold text-slate-600">
                      CVV
                      <input v-model="card.ccv" required class="h-12 rounded border border-slate-300 bg-white px-3 outline-sky-500" autocomplete="cc-csc" inputmode="numeric" placeholder="123" @input="card.ccv = formatCvv(card.ccv)" />
                    </label>
                  </div>
                </div>
              </div>

              <div class="border-t border-slate-200 pt-5">
                <p class="text-sm font-black uppercase text-slate-500">Titular da cobranca</p>
                <div class="mt-3 grid gap-4 md:grid-cols-2">
                  <label class="grid gap-1 text-sm font-bold text-slate-600 md:col-span-2">
                    Nome completo
                    <input v-model="holder.name" required class="h-12 rounded border border-slate-300 bg-white px-3 outline-sky-500" placeholder="Nome do titular" />
                  </label>

                  <label class="grid gap-1 text-sm font-bold text-slate-600">
                    E-mail
                    <span class="flex h-12 items-center gap-3 rounded border border-slate-300 bg-white px-3 focus-within:border-[var(--brand-primary)] focus-within:ring-4 focus-within:ring-sky-100">
                      <Mail class="size-4 text-slate-400" />
                      <input v-model="holder.email" required type="email" class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 outline-none" placeholder="email@exemplo.com" />
                    </span>
                  </label>

                  <label class="grid gap-1 text-sm font-bold text-slate-600">
                    CPF/CNPJ
                    <span class="flex h-12 items-center gap-3 rounded border border-slate-300 bg-white px-3 focus-within:border-[var(--brand-primary)] focus-within:ring-4 focus-within:ring-sky-100">
                      <BadgeCheck class="size-4 text-slate-400" />
                      <input v-model="holder.cpf_cnpj" required class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 outline-none" inputmode="numeric" placeholder="000.000.000-00" @input="holder.cpf_cnpj = formatCpfCnpj(holder.cpf_cnpj)" />
                    </span>
                  </label>

                  <label class="grid gap-1 text-sm font-bold text-slate-600">
                    CEP
                    <span class="flex h-12 items-center gap-3 rounded border border-slate-300 bg-white px-3 focus-within:border-[var(--brand-primary)] focus-within:ring-4 focus-within:ring-sky-100">
                      <MapPin class="size-4 text-slate-400" />
                      <input v-model="holder.postal_code" required class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 outline-none" inputmode="numeric" placeholder="00000-000" @input="holder.postal_code = formatCep(holder.postal_code)" />
                    </span>
                  </label>

                  <label class="grid gap-1 text-sm font-bold text-slate-600">
                    Numero
                    <input v-model="holder.address_number" required class="h-12 rounded border border-slate-300 bg-white px-3 outline-sky-500" inputmode="numeric" placeholder="100" @input="holder.address_number = formatAddressNumber(holder.address_number)" />
                  </label>

                  <label class="grid gap-1 text-sm font-bold text-slate-600">
                    Complemento
                    <input v-model="holder.address_complement" class="h-12 rounded border border-slate-300 bg-white px-3 outline-sky-500" placeholder="Apto, bloco, referencia" />
                  </label>

                  <label class="grid gap-1 text-sm font-bold text-slate-600">
                    Telefone
                    <span class="flex h-12 items-center gap-3 rounded border border-slate-300 bg-white px-3 focus-within:border-[var(--brand-primary)] focus-within:ring-4 focus-within:ring-sky-100">
                      <Phone class="size-4 text-slate-400" />
                      <input v-model="holder.phone" required class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 outline-none" inputmode="tel" placeholder="(92) 99999-9999" @input="holder.phone = formatPhone(holder.phone)" />
                    </span>
                  </label>

                  <label class="grid gap-1 text-sm font-bold text-slate-600">
                    Celular
                    <span class="flex h-12 items-center gap-3 rounded border border-slate-300 bg-white px-3 focus-within:border-[var(--brand-primary)] focus-within:ring-4 focus-within:ring-sky-100">
                      <Phone class="size-4 text-slate-400" />
                      <input v-model="holder.mobile_phone" required class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 outline-none" inputmode="tel" placeholder="(92) 99999-9999" @input="holder.mobile_phone = formatPhone(holder.mobile_phone)" />
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section class="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p class="text-sm font-black text-sky-950">Resumo</p>
            <div class="mt-3 grid gap-2 text-sm font-bold text-slate-600 sm:grid-cols-2">
              <span>Passageiros<br /><strong class="text-sky-950">{{ passengers.length }}</strong></span>
              <span>Pagamento<br /><strong class="text-sky-950">{{ reservation.paymentMethod === 'PIX' ? 'PIX' : 'Cartao' }}</strong></span>
              <span>
                Valor<br />
                <strong class="text-sky-950">
                  {{ simulationLoading ? 'Calculando...' : simulatedTotalLabel || 'Calculado ao criar reserva' }}
                </strong>
              </span>
            </div>
            <div class="mt-4 grid gap-2">
              <div
                v-for="(item, index) in passengers"
                :key="`summary-${index}`"
                class="rounded border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600"
              >
                Passageiro {{ index + 1 }}:
                <strong class="text-sky-950">{{ item.nome }}</strong>
                <span class="text-slate-400"> - {{ item.documento }}</span>
              </div>
            </div>
          </section>

          <section v-if="result" class="mt-6 rounded border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            <p>Reserva criada com sucesso.</p>
            <p v-if="result.valor_total" class="mt-1">Valor total: R$ {{ result.valor_total }}</p>
            <a v-if="result.link_cobranca" class="mt-2 inline-flex text-sky-700 underline" :href="result.link_cobranca" target="_blank" rel="noreferrer">Abrir cobranca</a>
            <a v-if="result.link_reserva" class="mt-2 inline-flex text-sky-700 underline" :href="result.link_reserva" target="_blank" rel="noreferrer">Abrir reserva</a>
            <RouterLink class="mt-2 inline-flex text-sky-700 underline" :to="{ name: 'customer-reservations' }">Ver minhas reservas</RouterLink>
            <p v-if="result.code_pix" class="mt-3 break-all rounded bg-white p-3 text-xs text-slate-700">{{ result.code_pix }}</p>
            <img v-if="result.qr_code_pix" class="mt-3 size-44 rounded bg-white object-contain p-2" :src="`data:image/png;base64,${result.qr_code_pix}`" alt="QR Code PIX" />
          </section>

          <p v-if="error" class="mt-5 rounded bg-red-50 p-3 text-sm font-bold text-red-700">{{ error }}</p>

          <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button class="h-11 rounded border border-slate-300 px-5 text-sm font-black text-slate-600" type="button" @click="goToStep(2)">
              Voltar
            </button>
            <button class="flex h-12 items-center justify-center gap-2 rounded bg-[var(--brand-primary)] px-6 text-sm font-black uppercase text-white disabled:bg-slate-300" :disabled="submitting || !termsAccepted">
              <Ship class="size-4" />
              {{ submitting ? 'Criando reserva...' : 'Criar reserva' }}
            </button>
          </div>
        </form>
      </div>
    </section>
  </main>
</template>
