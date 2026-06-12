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
            rejectedAt: { type: 'string', format: 'date-time' },
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
            refundTime: { type: 'string', format: 'date-time' },
            paymentMethod: { type: 'string' },
            transactionNumber: { type: 'string' }
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
            comment: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;