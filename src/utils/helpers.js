import crypto from 'crypto';
import { PICKUP_CODE_LENGTH } from './constants.js';

export function generatePickupCode() {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < PICKUP_CODE_LENGTH; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return code;
}

export function generateOrderNo() {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex').substring(0, 6);
  return `ORD${timestamp}${random}`.toUpperCase();
}

export function handleResponse(res, data, message = 'success', code = 200) {
  return res.status(code).json({
    code,
    message,
    data,
    timestamp: Date.now(),
  });
}

export function handleError(res, error, code = 500) {
  console.error('[Error]', error.message, error.stack);
  return res.status(code).json({
    code,
    message: error.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    timestamp: Date.now(),
  });
}
