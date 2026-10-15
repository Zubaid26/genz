const { isAvailable, isSandbox } = require('./gateways');

/**
 * Pakistani mobile numbers: 03XXXXXXXXX, also accepted as +923XXXXXXXXX
 * or 00923XXXXXXXXX. Normalised to the local 11-digit 03XXXXXXXXX form.
 */
const normalizeMobile = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (/^0?3\d{9}$/.test(digits)) return digits.padStart(11, '0');
  if (/^923\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^00923\d{9}$/.test(digits)) return `0${digits.slice(4)}`;
  return null;
};

/** JazzCash asks for the last 6 digits of the account holder's CNIC. */
const normalizeCnic = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 6 ? digits.slice(-6) : null;
};

/** Strips spaces/dashes from a card number and validates it's 13-19 digits (ISO/IEC 7812). */
const normalizeCard = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 13 && digits.length <= 19 ? digits : null;
};

/**
 * Registry of supported payment methods. Adding a gateway here makes it appear
 * in the checkout UI and pass server-side validation automatically.
 */
const METHODS = [
  {
    id: 'jazzcash',
    label: 'JazzCash',
    description: 'Pay from your JazzCash mobile wallet.',
    provider: 'jazzcash',
    requiresPayment: true,
    // Wallet charge needs the payer's mobile number and CNIC digits.
    fields: ['mobile', 'cnic'],
    isAvailable: () => isAvailable('jazzcash')
  },
  {
    id: 'easypaisa',
    label: 'Easypaisa',
    description: 'Pay from your Easypaisa mobile account.',
    provider: 'easypaisa',
    requiresPayment: true,
    fields: ['mobile'],
    isAvailable: () => isAvailable('easypaisa')
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    description: 'Pay securely with Visa, Mastercard, or UnionPay.',
    provider: 'card',
    requiresPayment: true,
    fields: ['cardNumber', 'expiry', 'cvv', 'cardName'],
    isAvailable: () => isAvailable('card')
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay the courier in cash when your order arrives.',
    provider: 'manual',
    requiresPayment: false,
    fields: [],
    isAvailable: () => true
  }
];

const availableMethods = () => METHODS.filter((m) => m.isAvailable());

const findMethod = (id) => availableMethods().find((m) => m.id === id) || null;

// Shape sent to the browser — never leaks the isAvailable predicate.
const publicMethods = () =>
  availableMethods().map(({ id, label, description, provider, requiresPayment, fields }) => ({
    id,
    label,
    description,
    provider,
    requiresPayment,
    fields,
    sandbox: requiresPayment && isSandbox(provider)
  }));

module.exports = { METHODS, availableMethods, findMethod, normalizeCard, normalizeCnic, normalizeMobile, publicMethods };
