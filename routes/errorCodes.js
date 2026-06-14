const express = require('express')
const router = express.Router()
const ERROR_CODES = require('../config/errorCodes')
const { success } = require('../utils/response')

router.get('/', (req, res) => {
  res.json(success(ERROR_CODES, '获取错误码列表成功'))
})

module.exports = router