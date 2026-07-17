export function formatDateBr(date) {
  if (!date) {
    return ''
  }

  const [year, month, day] = date.split('-')
  if (!year || !month || !day) {
    return date
  }

  return `${day}/${month}/${year}`
}

export function normalizeApiCollection(response, key) {
  const keys = Array.isArray(key) ? key : [key]

  if (Array.isArray(response)) {
    return response
  }

  if (Array.isArray(response?.data)) {
    return response.data
  }

  for (const currentKey of keys) {
    if (currentKey && Array.isArray(response?.[currentKey])) {
      return response[currentKey]
    }
  }

  return []
}

export function getTodayDateInputValue() {
  const today = new Date()
  const offset = today.getTimezoneOffset()
  const localDate = new Date(today.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 10)
}
