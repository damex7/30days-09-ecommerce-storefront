import { ORDER_PREFIX } from '../config.js'

/*
  Order numbers look like OJA-261006-K7Q2: prefix, date (YYMMDD), then 4
  random characters. The alphabet leaves out 0/O and 1/I/L, because people
  read this number aloud on the phone and type it as a bank-transfer
  reference, where "O or zero?" causes real mix-ups.
*/
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function createOrderNumber(date = new Date()) {
  const yymmdd = [date.getFullYear() % 100, date.getMonth() + 1, date.getDate()].map((n) => String(n).padStart(2, '0')).join('')
  const random = crypto.getRandomValues(new Uint32Array(4))
  const suffix = Array.from(random, (n) => ALPHABET[n % ALPHABET.length]).join('')
  return `${ORDER_PREFIX}-${yymmdd}-${suffix}`
}

export const ORDER_NUMBER = new RegExp(`^${ORDER_PREFIX}-\d{6}-[${ALPHABET}]{4}$`)
