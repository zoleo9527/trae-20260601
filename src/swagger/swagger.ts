import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '蛋鸡养殖场-蛋品分级与装箱发货系统',
      version: '1.0.0',
      description: '蛋品分级与装箱发货全流程管理系统API文档',
      contact: {
        name: '技术支持',
        email: 'support@eggfarm.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发环境'
      }
    ],
    components: {
      schemas: {
        EggGradeRecord: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '记录ID' },
            batchNumber: { type: 'string', description: '批次号' },
            grade: { type: 'string', enum: ['A', 'B', 'C'], description: '蛋品等级' },
            quantity: { type: 'number', description: '数量' },
            weight: { type: 'number', description: '重量(kg)' },
            breederId: { type: 'string', description: '饲养员ID' },
            breederName: { type: 'string', description: '饲养员姓名' },
            sorterId: { type: 'string', nullable: true, description: '分拣员ID' },
            sorterName: { type: 'string', nullable: true, description: '分拣员姓名' },
            status: { type: 'string', enum: ['pending', 'verified', 'packed'], description: '状态' },
            createdAt: { type: 'string', format: 'date-time', description: '创建时间' },
            updatedAt: { type: 'string', format: 'date-time', description: '更新时间' }
          },
          required: ['batchNumber', 'grade', 'quantity', 'weight', 'breederId']
        },
        PackingRecord: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '记录ID' },
            eggGradeRecordId: { type: 'string', description: '蛋品分级记录ID' },
            batchNumber: { type: 'string', description: '批次号' },
            boxCount: { type: 'number', description: '箱数' },
            eggsPerBox: { type: 'number', description: '每箱数量' },
            totalEggs: { type: 'number', description: '总数量' },
            destination: { type: 'string', description: '目的地' },
            transporter: { type: 'string', nullable: true, description: '运输商' },
            managerId: { type: 'string', description: '场长ID' },
            managerName: { type: 'string', description: '场长姓名' },
            sortedById: { type: 'string', description: '分拣员ID' },
            sortedByName: { type: 'string', description: '分拣员姓名' },
            status: { type: 'string', enum: ['confirmed', 'shipped'], description: '状态' },
            createdAt: { type: 'string', format: 'date-time', description: '创建时间' },
            updatedAt: { type: 'string', format: 'date-time', description: '更新时间' }
          },
          required: ['eggGradeRecordId', 'boxCount', 'eggsPerBox', 'destination', 'managerId']
        },
        ActionLog: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '日志ID' },
            targetType: { type: 'string', enum: ['grade', 'packing'], description: '目标类型' },
            targetId: { type: 'string', description: '目标ID' },
            action: { type: 'string', description: '操作类型' },
            operatorId: { type: 'string', description: '操作人ID' },
            operatorName: { type: 'string', description: '操作人姓名' },
            operatorRole: { type: 'string', enum: ['breeder', 'sorter', 'manager'], description: '操作人角色' },
            timestamp: { type: 'string', format: 'date-time', description: '操作时间' },
            details: { type: 'string', description: '操作详情' }
          }
        },
        PageResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            total: { type: 'number', description: '总记录数' },
            page: { type: 'number', description: '当前页码' },
            pageSize: { type: 'number', description: '每页数量' }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: true },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: false },
            message: { type: 'string' }
          }
        }
      }
    }
  },
  apis: [
    './src/routes/*.ts'
  ]
}

const swaggerSpec = swaggerJsdoc(options)

export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: '蛋品分级与装箱发货系统 API',
    customfavIcon: '/favicon.ico'
  }))
}

export default swaggerSpec