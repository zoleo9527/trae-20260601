const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '资产拍卖公司-公告发布与竞买报名系统',
      version: '1.0.0',
      description: '提供公告发布流程、竞买报名管理、权限校验等功能的RESTful API'
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: '开发服务器'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['PROJECT_MANAGER', 'REVIEWER', 'FINANCE', 'BIDDER'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        AuctionItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            basePrice: { type: 'number' },
            reservePrice: { type: 'number' },
            itemType: { type: 'string' },
            location: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Announcement: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            itemId: { type: 'string' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['DRAFT', 'PENDING_REVIEW', 'REVIEWED', 'APPROVED', 'PUBLISHED', 'REJECTED', 'EXPIRED'] },
            creatorId: { type: 'string' },
            publishedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        BidRegistration: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            announcementId: { type: 'string' },
            bidderId: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'DEPOSIT_PAID', 'CONFIRMED', 'REJECTED', 'WITHDRAWN'] },
            bidAmount: { type: 'number' },
            registrationTime: { type: 'string', format: 'date-time' },
            confirmedAt: { type: 'string', format: 'date-time' },
            confirmedBy: { type: 'string' },
            rejectedAt: { type: 'string', format: 'date-time' },
            rejectedBy: { type: 'string' },
            rejectionReason: { type: 'string' }
          }
        },
        DepositRecord: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            registrationId: { type: 'string' },
            amount: { type: 'number' },
            status: { type: 'string', enum: ['UNPAID', 'PAID', 'REFUNDED', 'FORFEITED'] },
            paymentTime: { type: 'string', format: 'date-time' },
            paidBy: { type: 'string' },
            refundTime: { type: 'string', format: 'date-time' },
            refundedBy: { type: 'string' },
            refundReason: { type: 'string' },
            paymentMethod: { type: 'string' },
            transactionNumber: { type: 'string' },
            paymentProcessor: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' }
              }
            },
            refundProcessor: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        },
        StatusHistory: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            action: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' }
              }
            },
            status: { type: 'string' },
            comment: { type: 'string' },
            processor: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' }
              }
            },
            reason: { type: 'string' }
          }
        }
      }
    },
    paths: {
      '/auth/register': {
        post: {
          summary: '用户注册',
          description: '公开接口，仅能注册BIDDER（竞买人）角色。PROJECT_MANAGER、REVIEWER、FINANCE角色需由已登录管理员通过POST /auth/users接口创建。',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' }
                  },
                  required: ['username', 'password', 'name', 'email']
                }
              }
            }
          },
          responses: {
            '201': { description: '注册成功' },
            '400': { description: '用户名或邮箱已存在' }
          }
        }
      },
      '/auth/users': {
        post: {
          summary: '创建用户',
          description: '管理员创建新用户。仅允许已登录的管理员角色(PROJECT_MANAGER/REVIEWER/FINANCE)创建PROJECT_MANAGER、REVIEWER、FINANCE账号，普通用户(BIDDER)无法创建管理员账号。',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    role: { type: 'string', enum: ['BIDDER', 'PROJECT_MANAGER', 'REVIEWER', 'FINANCE'] }
                  },
                  required: ['username', 'password', 'name', 'email', 'role']
                }
              }
            }
          },
          responses: {
            '201': { description: '创建成功' },
            '400': { description: '用户名或邮箱已存在或角色无效' },
            '403': { description: '无权限创建管理员账号' }
          }
        },
        get: {
          summary: '获取所有用户列表',
          description: '需要管理员权限',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: '获取成功' },
            '403': { description: '无权限' }
          }
        }
      },
      '/auth/login': {
        post: {
          summary: '用户登录',
          description: '用户登录获取JWT令牌',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    password: { type: 'string' }
                  },
                  required: ['username', 'password']
                }
              }
            }
          },
          responses: {
            '200': { description: '登录成功，返回令牌' },
            '401': { description: '用户名或密码错误' }
          }
        }
      },
      '/auth/profile': {
        get: {
          summary: '获取当前用户信息',
          description: '需要登录',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: '获取成功' },
            '401': { description: '未授权' }
          }
        }
      },
      '/announcements': {
        post: {
          summary: '创建公告',
          description: '项目经理创建拍卖公告',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    itemId: { type: 'string' },
                    startTime: { type: 'string', format: 'date-time' },
                    endTime: { type: 'string', format: 'date-time' }
                  },
                  required: ['title', 'content', 'itemId', 'startTime', 'endTime']
                }
              }
            }
          },
          responses: {
            '201': { description: '创建成功' },
            '403': { description: '无权限' }
          }
        },
        get: {
          summary: '获取公告列表',
          description: '获取所有公告，支持分页和状态筛选',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', type: 'string' },
            { name: 'page', in: 'query', type: 'integer' },
            { name: 'limit', in: 'query', type: 'integer' }
          ],
          responses: {
            '200': { description: '获取成功' },
            '401': { description: '未授权' }
          }
        }
      },
      '/announcements/{id}': {
        get: {
          summary: '获取公告详情',
          description: '获取单个公告详情',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          responses: {
            '200': { description: '获取成功' },
            '404': { description: '公告不存在' }
          }
        },
        put: {
          summary: '更新公告',
          description: '项目经理更新公告',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    startTime: { type: 'string', format: 'date-time' },
                    endTime: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: '更新成功' },
            '403': { description: '无权限' }
          }
        },
        delete: {
          summary: '删除公告',
          description: '项目经理删除公告',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          responses: {
            '200': { description: '删除成功' },
            '403': { description: '无权限' }
          }
        }
      },
      '/announcements/{id}/submit': {
        put: {
          summary: '提交审核',
          description: '项目经理提交公告审核',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          responses: {
            '200': { description: '提交成功' },
            '403': { description: '无权限' }
          }
        }
      },
      '/announcements/{id}/review': {
        put: {
          summary: '审核公告',
          description: '审核员审核公告',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['REVIEWED', 'APPROVED', 'REJECTED'] },
                    comment: { type: 'string' }
                  },
                  required: ['status']
                }
              }
            }
          },
          responses: {
            '200': { description: '审核完成' },
            '403': { description: '无权限' }
          }
        }
      },
      '/announcements/{id}/publish': {
        put: {
          summary: '发布公告',
          description: '项目经理发布已批准的公告',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          responses: {
            '200': { description: '发布成功' },
            '403': { description: '无权限' }
          }
        }
      },
      '/announcements/{id}/history': {
        get: {
          summary: '获取公告状态历史',
          description: '获取公告的完整处理历史',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          responses: {
            '200': { description: '获取成功' },
            '404': { description: '公告不存在' }
          }
        }
      },
      '/registrations': {
        post: {
          summary: '创建报名',
          description: '竞买人报名参加拍卖',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    announcementId: { type: 'string' },
                    bidAmount: { type: 'number' }
                  },
                  required: ['announcementId', 'bidAmount']
                }
              }
            }
          },
          responses: {
            '201': { description: '报名成功' },
            '403': { description: '无权限' }
          }
        },
        get: {
          summary: '获取所有报名',
          description: '管理员获取所有报名记录',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'announcementId', in: 'query', type: 'string' },
            { name: 'status', in: 'query', type: 'string' },
            { name: 'page', in: 'query', type: 'integer' },
            { name: 'limit', in: 'query', type: 'integer' }
          ],
          responses: {
            '200': { description: '获取成功' },
            '403': { description: '无权限' }
          }
        }
      },
      '/registrations/my-registrations': {
        get: {
          summary: '获取我的报名',
          description: '竞买人获取自己的报名记录',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', type: 'string' },
            { name: 'page', in: 'query', type: 'integer' },
            { name: 'limit', in: 'query', type: 'integer' }
          ],
          responses: {
            '200': { description: '获取成功' },
            '403': { description: '无权限' }
          }
        }
      },
      '/registrations/{registrationId}/pay-deposit': {
        put: {
          summary: '支付保证金',
          description: '竞买人或管理员支付保证金',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'registrationId', in: 'path', required: true, type: 'string' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    paymentMethod: { type: 'string' },
                    transactionNumber: { type: 'string' }
                  },
                  required: ['paymentMethod', 'transactionNumber']
                }
              }
            }
          },
          responses: {
            '200': { description: '支付成功' },
            '403': { description: '无权限' }
          }
        }
      },
      '/registrations/{registrationId}/confirm': {
        put: {
          summary: '确认报名',
          description: '管理员确认报名资格',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'registrationId', in: 'path', required: true, type: 'string' }],
          responses: {
            '200': { description: '确认成功' },
            '403': { description: '无权限' }
          }
        }
      },
      '/registrations/{registrationId}/reject': {
        put: {
          summary: '拒绝报名',
          description: '管理员拒绝报名',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'registrationId', in: 'path', required: true, type: 'string' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    reason: { type: 'string' }
                  },
                  required: ['reason']
                }
              }
            }
          },
          responses: {
            '200': { description: '拒绝成功' },
            '403': { description: '无权限' }
          }
        }
      },
      '/registrations/{registrationId}/withdraw': {
        put: {
          summary: '撤回报名',
          description: '竞买人撤回自己的报名',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'registrationId', in: 'path', required: true, type: 'string' }],
          responses: {
            '200': { description: '撤回成功' },
            '403': { description: '无权限' }
          }
        }
      },
      '/registrations/{id}': {
        get: {
          summary: '获取报名详情',
          description: '获取单个报名记录详情，包含保证金退款处理人信息',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          responses: {
            '200': { description: '获取成功' },
            '404': { description: '报名不存在' }
          }
        }
      },
      '/registrations/{id}/history': {
        get: {
          summary: '获取报名状态历史',
          description: '获取报名的完整处理历史，包含处理人、时间、原因及退款处理人信息',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          responses: {
            '200': { description: '获取成功，包含处理人和退款处理人信息' },
            '404': { description: '报名不存在' }
          }
        }
      },
      '/registrations/{registrationId}/confirm-transaction': {
        put: {
          summary: '确认成交',
          description: '财务确认成交并生成合同',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'registrationId', in: 'path', required: true, type: 'string' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    contractNumber: { type: 'string' }
                  },
                  required: ['contractNumber']
                }
              }
            }
          },
          responses: {
            '200': { description: '成交确认成功' },
            '403': { description: '无权限' }
          }
        }
      },
      '/items': {
        post: {
          summary: '创建标的',
          description: '项目经理创建拍卖标的',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: 'string',
                    basePrice: { type: 'number' },
                    reservePrice: { type: 'number' },
                    itemType: { type: 'string' },
                    location: { type: 'string' }
                  },
                  required: ['name', 'description', 'basePrice', 'itemType', 'location']
                }
              }
            }
          },
          responses: {
            '201': { description: '创建成功' },
            '403': { description: '无权限' }
          }
        },
        get: {
          summary: '获取标的列表',
          description: '获取所有标的，支持分页和类型筛选',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'itemType', in: 'query', type: 'string' },
            { name: 'status', in: 'query', type: 'string' },
            { name: 'page', in: 'query', type: 'integer' },
            { name: 'limit', in: 'query', type: 'integer' }
          ],
          responses: {
            '200': { description: '获取成功' },
            '401': { description: '未授权' }
          }
        }
      },
      '/items/{id}': {
        get: {
          summary: '获取标的详情',
          description: '获取单个标的详情',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          responses: {
            '200': { description: '获取成功' },
            '404': { description: '标的不存在' }
          }
        },
        put: {
          summary: '更新标的',
          description: '项目经理更新标的信息',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: 'string',
                    basePrice: { type: 'number' },
                    reservePrice: { type: 'number' },
                    itemType: { type: 'string' },
                    location: { type: 'string' },
                    status: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: '更新成功' },
            '403': { description: '无权限' }
          }
        },
        delete: {
          summary: '删除标的',
          description: '项目经理删除标的',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          responses: {
            '200': { description: '删除成功' },
            '403': { description: '无权限' }
          }
        }
      },
      '/attachments': {
        post: {
          summary: '上传附件',
          description: '上传公告或标的的附件',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    announcementId: { type: 'string' },
                    itemId: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '201': { description: '上传成功' },
            '401': { description: '未授权' }
          }
        },
        get: {
          summary: '获取附件列表',
          description: '获取公告或标的的附件列表',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'announcementId', in: 'query', type: 'string' },
            { name: 'itemId', in: 'query', type: 'string' }
          ],
          responses: {
            '200': { description: '获取成功' },
            '401': { description: '未授权' }
          }
        }
      },
      '/attachments/{id}': {
        get: {
          summary: '获取附件详情',
          description: '获取单个附件详情',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          responses: {
            '200': { description: '获取成功' },
            '404': { description: '附件不存在' }
          }
        },
        delete: {
          summary: '删除附件',
          description: '管理员删除附件',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          responses: {
            '200': { description: '删除成功' },
            '403': { description: '无权限' }
          }
        }
      },
      '/attachments/{id}/download': {
        get: {
          summary: '下载附件',
          description: '下载附件文件',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, type: 'string' }],
          responses: {
            '200': { description: '下载成功' },
            '404': { description: '附件不存在' }
          }
        }
      },
      '/health': {
        get: {
          summary: '健康检查',
          description: '检查服务是否正常运行',
          responses: {
            '200': { description: '服务正常' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;