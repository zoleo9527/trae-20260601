const ERROR_CODES = require('../config/errorCodes')

const success = (data = null, message = '操作成功') => {
  return {
    code: ERROR_CODES.SUCCESS.code,
    message,
    data
  }
}

const error = (errorCode, customMessage = null) => {
  const err = ERROR_CODES[errorCode] || ERROR_CODES.INTERNAL_ERROR
  return {
    code: err.code,
    message: customMessage || err.message,
    data: null
  }
}

module.exports = {
  success,
  error
}