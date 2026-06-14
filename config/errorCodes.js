const ERROR_CODES = {
  SUCCESS: { code: 0, message: '操作成功' },
  INVALID_PARAMS: { code: 1001, message: '参数无效' },
  RECORD_NOT_FOUND: { code: 1002, message: '记录不存在' },
  LINE_NOT_FOUND: { code: 1003, message: '检测线不存在' },
  VEHICLE_NOT_FOUND: { code: 1004, message: '车辆不存在' },
  LINE_BUSY: { code: 1005, message: '检测线繁忙' },
  LINE_MAINTENANCE: { code: 1006, message: '检测线维护中' },
  RECORD_STATUS_ERROR: { code: 1007, message: '记录状态错误' },
  DUPLICATE_LICENSE: { code: 1008, message: '车牌号重复' },
  DUPLICATE_LINE: { code: 1009, message: '检测线名称重复' },
  INTERNAL_ERROR: { code: 5000, message: '系统内部错误' }
}

module.exports = ERROR_CODES