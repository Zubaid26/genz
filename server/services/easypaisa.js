const crypto = require('crypto');
const { GATEWAYS } = require('../config/gateways');

const pad = (n) => String(n).padStart(2, '0');

// Easypaisa expects expiry as yyyyMMdd HHmmss.
const stamp = (date) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())} ` +
  `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;

/**
 * Easypaisa request hash.
 *
 * Documented algorithm: build `key1=value1&key2=value2` from the request fields
 * sorted by name, then AES-128-ECB encrypt it with the merchant hash key and
 * base64 the result.
 */
const computeRequestHash = (fields, hashKey) => {
  const query = Object.keys(fields)
    .filter((k) => fields[k] !== undefined && fields[k] !== null && String(fields[k]).trim() !== '')
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('&');

  // The hash key is used directly as a 16-byte AES key.
  const key = Buffer.from(hashKey, 'utf8');
  const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
  cipher.setAutoPadding(true);
  return Buffer.concat([cipher.update(query, 'utf8'), cipher.final()]).toString('base64');
};

/** Builds a signed Mobile Account (MA) transaction request. */
const buildMaRequest = ({ reference, amount, mobile, email, description }) => {
  const { storeId, hashKey } = GATEWAYS.easypaisa.config;
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  const fields = {
    storeId,
    orderId: reference,
    // Easypaisa takes a decimal amount string, unlike JazzCash's paisa integer.
    transactionAmount: Number(amount).toFixed(2),
    transactionType: 'MA',
    mobileAccountNo: mobile,
    emailAddress: email || '',
    tokenExpiry: stamp(expiry),
    optional1: (description || 'Gen-Z Threads order').slice(0, 50)
  };

  if (hashKey) {
    fields.merchantHashedReq = computeRequestHash(fields, hashKey);
  }
  return fields;
};

/**
 * Charges an Easypaisa mobile account.
 *
 * Fails closed: only an explicit success code marks the payment good.
 */
const chargeMobileAccount = async ({ reference, amount, mobile, email, description }) => {
  const { baseUrl, storeId, hashKey } = GATEWAYS.easypaisa.config;
  const body = buildMaRequest({ reference, amount, mobile, email, description });

  let data;
  try {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Easypaisa authenticates REST callers with a base64 credentials header.
        Credentials: Buffer.from(`${storeId}:${hashKey}`).toString('base64')
      },
      body: JSON.stringify(body)
    });
    data = await res.json();
  } catch (error) {
    return { ok: false, message: 'Could not reach Easypaisa.', detail: error.message };
  }

  // '0000' is Easypaisa's success response code.
  if (data?.responseCode === '0000') {
    return { ok: true, reference: data.orderId || reference, raw: data };
  }

  return {
    ok: false,
    message: data?.responseDesc || 'Easypaisa declined the transaction.',
    code: data?.responseCode,
    raw: data
  };
};

/** Validates a postback before trusting it. */
const verifyCallback = (fields) => {
  if (fields?.responseCode !== '0000') {
    return { ok: false, message: fields?.responseDesc || 'Payment not successful.' };
  }
  return { ok: true, reference: fields.orderId };
};

module.exports = { buildMaRequest, chargeMobileAccount, computeRequestHash, verifyCallback };
