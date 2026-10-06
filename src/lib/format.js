const list = new Intl.ListFormat('en-NG', { style: 'long', type: 'conjunction' })

/** ['Lagos', 'Ogun', 'FCT (Abuja)'] → "Lagos, Ogun and FCT (Abuja)" */
export const formatList = (items) => list.format(items)

const dateTime = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
const dateOnly = new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' })

export const formatDateTime = (iso) => (iso ? dateTime.format(new Date(iso)) : '')
export const formatDate = (iso) => (iso ? dateOnly.format(new Date(iso)) : '')

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
