<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { formatDateBr, getTodayDateInputValue } from '../utils/formatters'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  availableDates: {
    type: Array,
    default: () => [],
  },
  datePrices: {
    type: Object,
    default: () => ({}),
  },
  label: {
    type: String,
    default: 'Data de ida',
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const open = ref(false)
const visibleMonth = ref(getMonthDate(props.modelValue || props.availableDates[0] || getTodayDateInputValue()))

const availableSet = computed(() => new Set(props.availableDates))
const selectedLabel = computed(() => props.modelValue ? formatDateBr(props.modelValue) : 'Selecionar data')
const visibleMonths = computed(() => [
  visibleMonth.value,
  new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() + 1, 1),
])

watch(
  () => [props.modelValue, props.availableDates[0]],
  () => {
    visibleMonth.value = getMonthDate(props.modelValue || props.availableDates[0] || getTodayDateInputValue())
  },
)

function getMonthDate(dateValue) {
  const [year, month] = String(dateValue || '').split('-').map(Number)

  if (!year || !month) {
    return new Date()
  }

  return new Date(year, month - 1, 1)
}

function toDateValue(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function monthLabel(monthDate) {
  return monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function calendarDaysForMonth(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []

  for (let index = 0; index < startOffset; index += 1) {
    days.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = toDateValue(year, month, day)
    days.push({
      day,
      date,
      available: availableSet.value.has(date),
      selected: props.modelValue === date,
      price: formatPrice(props.datePrices[date]),
    })
  }

  return days
}

function formatPrice(value) {
  const numberValue = Number(value || 0)

  if (!numberValue || Number.isNaN(numberValue)) {
    return ''
  }

  return Math.round(numberValue).toLocaleString('pt-BR')
}

function changeMonth(offset) {
  visibleMonth.value = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() + offset, 1)
}

function selectDate(day) {
  if (!day?.available) {
    return
  }

  emit('update:modelValue', day.date)
  emit('change', day.date)
  open.value = false
}
</script>

<template>
  <div class="relative min-w-0 flex-1">
    <button
      type="button"
      class="grid h-full w-full min-w-0 content-center bg-transparent text-left outline-none"
      @click="open = !open"
    >
      <span class="truncate text-xs font-semibold text-slate-500">{{ label }}</span>
      <span class="truncate text-sm font-semibold text-slate-900">{{ selectedLabel }}</span>
    </button>

    <div
      v-if="open"
      class="absolute left-1/2 top-[calc(100%+0.75rem)] z-40 w-[min(46rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-slate-100 bg-white p-5 shadow-2xl shadow-slate-900/15 sm:p-7 lg:left-0 lg:translate-x-0"
    >
      <button
        type="button"
        class="absolute left-5 top-6 grid size-8 place-items-center rounded-full text-slate-300 transition hover:bg-slate-50 hover:text-slate-700"
        @click="changeMonth(-1)"
      >
        <ChevronLeft class="size-4" />
      </button>
      <button
        type="button"
        class="absolute right-5 top-6 grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        @click="changeMonth(1)"
      >
        <ChevronRight class="size-4" />
      </button>

      <div class="grid gap-7 md:grid-cols-2">
        <section v-for="monthDate in visibleMonths" :key="monthDate.toISOString()" class="min-w-0">
          <h3 class="mb-6 text-center text-sm font-semibold capitalize text-slate-800">{{ monthLabel(monthDate) }}</h3>

          <div class="grid grid-cols-7 gap-y-4 text-center text-sm font-semibold text-slate-500">
            <span>D</span>
            <span>S</span>
            <span>T</span>
            <span>Q</span>
            <span>Q</span>
            <span>S</span>
            <span>S</span>
          </div>

          <div class="mt-5 grid grid-cols-7 gap-y-3">
            <span
              v-for="(day, index) in calendarDaysForMonth(monthDate)"
              :key="day?.date || `${monthDate.toISOString()}-${index}`"
              class="grid min-h-10 place-items-center"
            >
              <button
                v-if="day"
                type="button"
                class="flex size-11 flex-col items-center justify-center rounded-lg text-sm font-semibold transition"
                :class="[
                  day.selected ? 'bg-[var(--brand-primary)] text-white shadow-sm' : '',
                  !day.selected && day.available ? 'text-slate-950 hover:bg-[var(--brand-primary)]/10' : '',
                  !day.available ? 'cursor-not-allowed text-slate-300' : '',
                ]"
                :disabled="!day.available"
                @click="selectDate(day)"
              >
                <span class="leading-none">{{ day.day }}</span>
                <span
                  v-if="day.available && day.price"
                  class="mt-1 text-[10px] leading-none"
                  :class="day.selected ? 'text-white/90' : 'text-slate-500'"
                >
                  {{ day.price }}
                </span>
                <span v-else-if="day.available" class="mt-1 size-1 rounded-full bg-[var(--brand-primary)]"></span>
              </button>
            </span>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
