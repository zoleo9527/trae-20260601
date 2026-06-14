export const testRequests = {
  healthCheck: {
    method: 'GET',
    url: 'http://localhost:3000/health',
    description: '健康检查',
    headers: {},
  },

  getHome: {
    method: 'GET',
    url: 'http://localhost:3000/',
    description: '获取API信息',
    headers: {},
  },

  getCurrentUser: {
    method: 'GET',
    url: 'http://localhost:3000/api/users/me',
    description: '获取当前用户信息',
    headers: { 'x-user-id': 'WIN001' },
  },

  getAllUsers: {
    method: 'GET',
    url: 'http://localhost:3000/api/users',
    description: '获取所有用户',
    headers: { 'x-user-id': 'WIN001' },
  },

  getUserById: {
    method: 'GET',
    url: 'http://localhost:3000/api/users/{userId}',
    description: '获取指定用户信息',
    headers: { 'x-user-id': 'WIN001' },
  },

  getAllApplications: {
    method: 'GET',
    url: 'http://localhost:3000/api/applications',
    description: '获取所有申请',
    headers: { 'x-user-id': 'WIN001' },
  },

  getStuckApplications: {
    method: 'GET',
    url: 'http://localhost:3000/api/applications?stuck=true',
    description: '获取卡住的申请',
    headers: { 'x-user-id': 'WIN001' },
  },

  getApplicationsByStatus: {
    method: 'GET',
    url: 'http://localhost:3000/api/applications?status=PENDING_PAYMENT',
    description: '按状态获取申请',
    headers: { 'x-user-id': 'WIN001' },
  },

  getApplicationByNo: {
    method: 'GET',
    url: 'http://localhost:3000/api/applications/no/{applicationNo}',
    description: '按申请号查询',
    headers: { 'x-user-id': 'WIN001' },
  },

  createApplication: {
    method: 'POST',
    url: 'http://localhost:3000/api/applications',
    description: '创建新申请 (窗口人员)',
    headers: {
      'x-user-id': 'WIN001',
      'Content-Type': 'application/json',
    },
    body: {
      applicantName: '测试用户',
      applicantIdNo: '110101199001019999',
      notaryType: '声明公证',
      appointmentNo: 'APPT202401999',
    },
  },

  submitMaterials: {
    method: 'POST',
    url: 'http://localhost:3000/api/applications/{applicationId}/materials',
    description: '提交材料 (窗口人员)',
    headers: {
      'x-user-id': 'WIN001',
      'Content-Type': 'application/json',
    },
    body: {
      materials: [
        { name: '身份证原件', isOriginal: true },
        { name: '声明书原件', isOriginal: true },
      ],
    },
  },

  reviewAndSetFee: {
    method: 'POST',
    url: 'http://localhost:3000/api/applications/{applicationId}/review',
    description: '审核材料并设置费用 (公证员)',
    headers: {
      'x-user-id': 'NOT001',
      'Content-Type': 'application/json',
    },
    body: {
      feeItems: [
        { name: '声明公证费', amount: 100, quantity: 1 },
        { name: '公证书副本', amount: 20, quantity: 2 },
      ],
    },
  },

  issueSupplementNotice: {
    method: 'POST',
    url: 'http://localhost:3000/api/applications/{applicationId}/supplement-notice',
    description: '发出补正通知 (仅公证员)',
    headers: {
      'x-user-id': 'NOT001',
      'Content-Type': 'application/json',
    },
    body: {
      reason: '缺少婚姻状况证明',
      requiredMaterials: ['结婚证原件', '户口本原件'],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },

  getPaymentPendingRegistration: {
    method: 'GET',
    url: 'http://localhost:3000/api/payments/pending-registration',
    description: '获取待缴费登记的申请',
    headers: { 'x-user-id': 'WIN001' },
  },

  getPaymentPendingConfirmation: {
    method: 'GET',
    url: 'http://localhost:3000/api/payments/pending-confirmation',
    description: '获取待缴费确认的申请',
    headers: { 'x-user-id': 'NOT001' },
  },

  getStuckPayments: {
    method: 'GET',
    url: 'http://localhost:3000/api/payments/stuck',
    description: '获取缴费环节卡住的申请',
    headers: { 'x-user-id': 'NOT001' },
  },

  registerPayment: {
    method: 'POST',
    url: 'http://localhost:3000/api/payments/register',
    description: '提交缴费登记 (窗口人员)',
    headers: {
      'x-user-id': 'WIN001',
      'Content-Type': 'application/json',
    },
    body: {
      applicationId: '{applicationId}',
      amount: 140,
      feeItems: [
        { name: '声明公证费', amount: 100, quantity: 1 },
        { name: '公证书副本', amount: 20, quantity: 2 },
      ],
      paymentMethod: '微信支付',
      transactionNo: 'WXTEST' + Date.now(),
      remark: '现场现金缴费',
    },
  },

  confirmPayment: {
    method: 'POST',
    url: 'http://localhost:3000/api/payments/confirm',
    description: '确认缴费 (公证员)',
    headers: {
      'x-user-id': 'NOT001',
      'Content-Type': 'application/json',
    },
    body: {
      applicationId: '{applicationId}',
      remark: '缴费凭证核对无误',
    },
  },

  getPaymentRecord: {
    method: 'GET',
    url: 'http://localhost:3000/api/payments/{applicationId}',
    description: '获取缴费记录',
    headers: { 'x-user-id': 'NOT001' },
  },

  getCertificatePendingArrangement: {
    method: 'GET',
    url: 'http://localhost:3000/api/certificates/pending-arrangement',
    description: '获取待出证安排的申请',
    headers: { 'x-user-id': 'ARC001' },
  },

  getCertificatePendingIssuance: {
    method: 'GET',
    url: 'http://localhost:3000/api/certificates/pending-issuance',
    description: '获取待发证的申请',
    headers: { 'x-user-id': 'ARC001' },
  },

  getStuckCertificates: {
    method: 'GET',
    url: 'http://localhost:3000/api/certificates/stuck',
    description: '获取出证环节卡住的申请',
    headers: { 'x-user-id': 'ARC001' },
  },

  getCompletedCertificates: {
    method: 'GET',
    url: 'http://localhost:3000/api/certificates/completed',
    description: '获取已完成发证的申请',
    headers: { 'x-user-id': 'ARC001' },
  },

  arrangeCertificate: {
    method: 'POST',
    url: 'http://localhost:3000/api/certificates/arrange',
    description: '安排出证 (档案员)',
    headers: {
      'x-user-id': 'ARC001',
      'Content-Type': 'application/json',
    },
    body: {
      applicationId: '{applicationId}',
      certificateNo: 'GZ-TEST-' + Date.now(),
      scheduledPickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      remark: '公证书已制作完成',
    },
  },

  issueCertificate: {
    method: 'POST',
    url: 'http://localhost:3000/api/certificates/issue',
    description: '发证 (档案员)',
    headers: {
      'x-user-id': 'ARC001',
      'Content-Type': 'application/json',
    },
    body: {
      applicationId: '{applicationId}',
      pickupBy: '测试用户',
      pickupIdNo: '110101199001019999',
      remark: '本人领取，已核对身份',
    },
  },

  getCertificateRecord: {
    method: 'GET',
    url: 'http://localhost:3000/api/certificates/{applicationId}',
    description: '获取出证记录',
    headers: { 'x-user-id': 'ARC001' },
  },

  getCertificateHistory: {
    method: 'GET',
    url: 'http://localhost:3000/api/certificates/{applicationId}/history',
    description: '获取出证流程历史',
    headers: { 'x-user-id': 'ARC001' },
  },

  getCertificateReview: {
    method: 'GET',
    url: 'http://localhost:3000/api/certificates/{applicationId}/review',
    description: '流程回看与责任追溯',
    headers: { 'x-user-id': 'ARC001' },
  },

  getApplicationLogs: {
    method: 'GET',
    url: 'http://localhost:3000/api/applications/{applicationId}/logs',
    description: '获取申请操作日志',
    headers: { 'x-user-id': 'WIN001' },
  },

  getApplicationDetail: {
    method: 'GET',
    url: 'http://localhost:3000/api/applications/{applicationId}',
    description: '获取申请详情',
    headers: { 'x-user-id': 'WIN001' },
  },

  permissionTest_WindowStaffCannotConfirmPayment: {
    method: 'POST',
    url: 'http://localhost:3000/api/payments/confirm',
    description: '权限测试: 窗口人员不能确认缴费',
    headers: {
      'x-user-id': 'WIN001',
      'Content-Type': 'application/json',
    },
    body: {
      applicationId: '{applicationId}',
    },
  },

  permissionTest_WindowStaffCannotIssueSupplementNotice: {
    method: 'POST',
    url: 'http://localhost:3000/api/applications/{applicationId}/supplement-notice',
    description: '权限测试: 窗口人员不能发出补正通知',
    headers: {
      'x-user-id': 'WIN001',
      'Content-Type': 'application/json',
    },
    body: {
      reason: '测试补正',
      requiredMaterials: ['测试材料'],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },

  permissionTest_NotaryCannotArrangeCertificate: {
    method: 'POST',
    url: 'http://localhost:3000/api/certificates/arrange',
    description: '权限测试: 公证员不能安排出证',
    headers: {
      'x-user-id': 'NOT001',
      'Content-Type': 'application/json',
    },
    body: {
      applicationId: '{applicationId}',
      scheduledPickupDate: new Date().toISOString(),
    },
  },

  getHandoverTodo: {
    method: 'GET',
    url: 'http://localhost:3000/api/handover/todo',
    description: '交接待办总览 - 按角色分组返回待处理列表',
    headers: { 'x-user-id': 'WIN001' },
  },

  getHandoverTodoByRole: {
    method: 'GET',
    url: 'http://localhost:3000/api/handover/todo?role=WINDOW_STAFF',
    description: '按角色查询待办 (WINDOW_STAFF / NOTARY / ARCHIVIST)',
    headers: { 'x-user-id': 'NOT001' },
  },
};

export const curlExamples: Record<string, string> = {
  healthCheck: 'curl http://localhost:3000/health',
  getAllUsers: 'curl -H "x-user-id: WIN001" http://localhost:3000/api/users',
  getCurrentUser: 'curl -H "x-user-id: WIN001" http://localhost:3000/api/users/me',
  getAllApplications: 'curl -H "x-user-id: WIN001" http://localhost:3000/api/applications',
  getStuckApplications: 'curl -H "x-user-id: WIN001" "http://localhost:3000/api/applications?stuck=true"',
  getApplicationByNo: 'curl -H "x-user-id: WIN001" http://localhost:3000/api/applications/no/{applicationNo}',
  getPendingRegistration: 'curl -H "x-user-id: WIN001" http://localhost:3000/api/payments/pending-registration',
  getPendingConfirmation: 'curl -H "x-user-id: NOT001" http://localhost:3000/api/payments/pending-confirmation',
  getStuckPayments: 'curl -H "x-user-id: NOT001" http://localhost:3000/api/payments/stuck',
  getPendingArrangement: 'curl -H "x-user-id: ARC001" http://localhost:3000/api/certificates/pending-arrangement',
  getStuckCertificates: 'curl -H "x-user-id: ARC001" http://localhost:3000/api/certificates/stuck',
  getCompleted: 'curl -H "x-user-id: ARC001" http://localhost:3000/api/certificates/completed',
  getLogs: 'curl -H "x-user-id: WIN001" http://localhost:3000/api/applications/{id}/logs',
  getReview: 'curl -H "x-user-id: ARC001" http://localhost:3000/api/certificates/{id}/review',
  getHandoverTodo: 'curl -H "x-user-id: WIN001" http://localhost:3000/api/handover/todo',
  getHandoverTodoByRole: 'curl -H "x-user-id: NOT001" "http://localhost:3000/api/handover/todo?role=NOTARY"',
};

export default testRequests;
