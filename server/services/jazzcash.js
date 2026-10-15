const crypto = require('crypto');
const { GATEWAYS, CURRENCY } = require('../config/gateways');

const pad = (n) => String(n).padStart(2, '0');

// JazzCash expects timestamps as yyyyMMddHHmmss in Pakistan Standard Time.
const stamp = (date) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
  `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

/**
 * JazzCash secure hash.
 *
 * Documented algorithm: take every pp_* / ppmpf_* field that has a non-empty
 * value, sort by field name, join the VALUES with '&', prefix the integrity
 * salt, then HMAC-SHA256 that string using the salt as the key (upper-case hex).
 */
const computeSecureHash = (fields, integritySalt) => {
  const ordered = Object.keys(fields)
    .filter((k) => k !== 'pp_SecureHash')
    .filter((k) => fields[k] !== undefined && fields[k] !== null && String(fields[k]).trim() !== '')
    .sort()
    .map((k) => String(fields[k]));

  const payload = [integritySalt, ...ordered].join('&');
  return crypto.createHmac('sha256', integritySalt).update(payload).digest('hex').toUpperCase();
};

/**
 * Builds a signed Mobile Wallet (MWALLET) transaction request.
 * `amountMinor` is in paisa — JazzCash rejects decimal amounts.
 */
const buildWalletRequest = ({ reference, amountMinor, mobile, cnic, description }) => {
  const { merchantId, password, integritySalt } = GATEWAYS.jazzcash.config;
  const now = new Date();
  const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

  const fields = {
    pp_Language: 'EN',
    pp_MerchantID: merchantId,
    pp_Password: password,
    pp_TxnRefNo: reference,
    pp_Amount: String(amountMinor),
    pp_TxnCurrency: CURRENCY,
    pp_TxnDateTime: stamp(now),
    pp_TxnExpiryDateTime: stamp(expiry),
    pp_BillReference: reference,
    pp_Description: description || 'Gen-Z Threads order',
    pp_MobileNumber: mobile,
    pp_CNIC: cnic
  };

  fields.pp_SecureHash = computeSecureHash(fields, integritySalt);
  return fields;
};

/**
 * Charges a JazzCash mobile wallet.
 *
 * Fails closed: anything other than an explicit success code is treated as a
 * failed payment, so a wrong field name can never mark an order paid.
 */
const chargeWallet = async ({ reference, amountMinor, mobile, cnic, description }) => {
  const { baseUrl } = GATEWAYS.jazzcash.config;
  const body = buildWalletRequest({ reference, amountMinor, mobile, cnic, description });

  let data;
  try {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    data = await res.json();
  } catch (error) {
    return { ok: false, message: 'Could not reach JazzCash.', detail: error.message };
  }

  // '000' is JazzCash's success response code.
  if (data?.pp_ResponseCode === '000') {
    return { ok: true, reference: data.pp_TxnRefNo || reference, raw: data };
  }

  return {
    ok: false,
    message: data?.pp_ResponseMessage || 'JazzCash declined the transaction.',
    code: data?.pp_ResponseCode,
    raw: data
  };
};

/** Verifies the secure hash on a callback/IPN before trusting its contents. */
const verifyCallback = (fields) => {
  const { integritySalt } = GATEWAYS.jazzcash.config;
  const received = fields?.pp_SecureHash;
  if (!received) return { ok: false, message: 'Missing secure hash.' };

  const expected = computeSecureHash(fields, integritySalt);
  if (expected !== String(received).toUpperCase()) {
    return { ok: false, message: 'Secure hash mismatch — callback not trusted.' };
  }
  if (fields.pp_ResponseCode !== '000') {
    return { ok: false, message: fields.pp_ResponseMessage || 'Payment not successful.' };
  }
  return { ok: true, reference: fields.pp_TxnRefNo };
};

module.exports = { buildWalletRequest, chargeWallet, computeSecureHash, verifyCallback };
