import express from 'express'
import { initDb } from './db'
import accessRecordRoutes from './routes/access-records'
import dashboardRoutes from './routes/dashboard'
import employeeRoutes from './routes/employees'
import enterpriseRoutes from './routes/enterprises'
import evaluationRoutes from './routes/evaluations'
import repairOrderRoutes from './routes/repair-orders'
import visitorRoutes from './routes/visitors'
import workOrderRoutes from './routes/work-orders'
import { seed } from './seed'

const app = express()
const PORT = 3000

app.use(express.json())

initDb()
seed()

app.use('/api/enterprises', enterpriseRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/visitors', visitorRoutes)
app.use('/api/access-records', accessRecordRoutes)
app.use('/api/repair-orders', repairOrderRoutes)
app.use('/api/work-orders', workOrderRoutes)
app.use('/api/evaluations', evaluationRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.get('/api', (_req, res) => {
  res.json({
    name: '园区物业管理系统 API',
    version: '1.0.0',
    auth: '所有接口需带 x-user-id 请求头（种子用户 id 1-6）',
    seed_users: {
      1: { name: '门岗-张师傅', role: 'gate' },
      2: { name: '客服-小陈', role: 'cs' },
      3: { name: '客服-小刘', role: 'cs' },
      4: { name: '工程师-老王', role: 'engineer' },
      5: { name: '工程师-小赵', role: 'engineer' },
      6: { name: '主管-周经理', role: 'supervisor' }
    },
    roles: {
      gate: {
        description: '门岗 - 访客核验、通行记录',
        key_endpoints: [
          { method: 'GET', path: '/api/visitors?status=pending', desc: '今日待签到访客列表' },
          { method: 'GET', path: '/api/visitors/:id', desc: '访客详情核验' },
          { method: 'PUT', path: '/api/visitors/:id/arrive', desc: '访客签到' },
          { method: 'GET', path: '/api/access-records', desc: '通行记录查询' },
          { method: 'POST', path: '/api/access-records', desc: '登记通行（正常/临时放行）' }
        ]
      },
      cs: {
        description: '客服 - 报修创建/跟进、访客预约、评价录入',
        key_endpoints: [
          { method: 'GET', path: '/api/enterprises', desc: '企业列表' },
          { method: 'POST', path: '/api/visitors', desc: '创建访客预约' },
          { method: 'PUT', path: '/api/visitors/:id/cancel', desc: '取消访客预约' },
          { method: 'GET', path: '/api/repair-orders', desc: '报修单列表（可筛状态/超时）' },
          { method: 'POST', path: '/api/repair-orders', desc: '创建报修单' },
          { method: 'PUT', path: '/api/repair-orders/:id', desc: '修改报修单' },
          { method: 'PUT', path: '/api/repair-orders/:id/close', desc: '关闭已完工报修单' },
          { method: 'POST', path: '/api/work-orders', desc: '派工给工程师' },
          { method: 'PUT', path: '/api/work-orders/:id/reassign', desc: '转派工单' },
          { method: 'POST', path: '/api/evaluations', desc: '录入回访评价' }
        ]
      },
      engineer: {
        description: '工程师 - 接单/开工/完工/转派',
        key_endpoints: [
          { method: 'GET', path: '/api/work-orders/mine', desc: '我的工单列表' },
          { method: 'GET', path: '/api/repair-orders/:id', desc: '查看报修单详情' },
          { method: 'PUT', path: '/api/work-orders/:id/accept', desc: '接单' },
          { method: 'PUT', path: '/api/work-orders/:id/start', desc: '开工' },
          { method: 'PUT', path: '/api/work-orders/:id/complete', desc: '完工' },
          { method: 'PUT', path: '/api/work-orders/:id/reassign', desc: '转派自己的工单' }
        ]
      },
      supervisor: {
        description: '主管 - 查看超时、差评、统计',
        key_endpoints: [
          { method: 'GET', path: '/api/dashboard/overdue-repairs', desc: '超时报修列表' },
          { method: 'GET', path: '/api/dashboard/bad-evaluations', desc: '差评列表（≤2分）' },
          { method: 'GET', path: '/api/dashboard/stats', desc: '全局统计概览' },
          { method: 'GET', path: '/api/repair-orders?overdue=1', desc: '报修单（筛超时）' }
        ]
      }
    },
    endpoints: [
      'GET    /api/enterprises',
      'POST   /api/enterprises',
      'GET    /api/employees?enterprise_id=',
      'POST   /api/employees',
      'GET    /api/visitors?status=&visit_date=',
      'POST   /api/visitors',
      'PUT    /api/visitors/:id/arrive',
      'PUT    /api/visitors/:id/cancel',
      'GET    /api/access-records?pass_type=&gate_no=',
      'POST   /api/access-records',
      'GET    /api/repair-orders?status=&overdue=',
      'POST   /api/repair-orders',
      'PUT    /api/repair-orders/:id',
      'PUT    /api/repair-orders/:id/close',
      'GET    /api/work-orders?repair_order_id=',
      'GET    /api/work-orders/mine',
      'POST   /api/work-orders',
      'PUT    /api/work-orders/:id/accept',
      'PUT    /api/work-orders/:id/start',
      'PUT    /api/work-orders/:id/complete',
      'PUT    /api/work-orders/:id/reassign',
      'GET    /api/evaluations?repair_order_id=&min_rating=',
      'POST   /api/evaluations',
      'GET    /api/dashboard/overdue-repairs',
      'GET    /api/dashboard/bad-evaluations',
      'GET    /api/dashboard/stats'
    ],
    workflows: {
      visitor_verification: {
        name: '访客核验主链路',
        description: '客服预约 → 门岗核验 → 签到放行 → 登记通行',
        steps: [
          {
            step: 1,
            role: 'cs',
            title: '创建访客预约',
            headers: { 'x-user-id': '2' },
            method: 'POST',
            path: '/api/visitors',
            body_example: {
              enterprise_id: 1,
              host_employee_id: 1,
              name: '访客姓名',
              phone: '18600000000',
              purpose: '商务洽谈',
              visit_date: '2026-06-03'
            },
            success_response: {
              id: 1,
              status: 'pending',
              enterprise_id: 1,
              host_employee_id: 1,
              name: '访客姓名',
              phone: '18600000000',
              purpose: '商务洽谈',
              visit_date: '2026-06-03'
            }
          },
          {
            step: 2,
            role: 'gate',
            title: '查看待签到访客',
            headers: { 'x-user-id': '1' },
            method: 'GET',
            path: '/api/visitors?status=pending&visit_date=2026-06-03',
            body_example: null,
            success_response: [
              {
                id: 1,
                name: '访客姓名',
                status: 'pending',
                enterprise_name: '星辰科技有限公司',
                host_name: '陈总监',
                visit_date: '2026-06-03'
              }
            ]
          },
          {
            step: 3,
            role: 'gate',
            title: '访客签到',
            headers: { 'x-user-id': '1' },
            method: 'PUT',
            path: '/api/visitors/:id/arrive',
            path_params: { id: '访客ID（从步骤2获取）' },
            body_example: null,
            success_response: {
              message: '签到成功',
              visitor_id: 1,
              status: 'arrived'
            }
          },
          {
            step: 4,
            role: 'gate',
            title: '登记通行记录（正常放行）',
            headers: { 'x-user-id': '1', 'Content-Type': 'application/json' },
            method: 'POST',
            path: '/api/access-records',
            body_example: {
              visitor_id: 1,
              gate_no: '东门1号',
              direction: 'in',
              note: '已核实预约'
            },
            success_response: {
              id: 1,
              visitor_id: 1,
              gate_no: '东门1号',
              pass_type: 'normal',
              direction: 'in',
              verified_by: 1,
              note: '已核实预约'
            }
          },
          {
            step: 5,
            role: 'gate',
            title: '登记通行记录（临时放行，无预约）',
            headers: { 'x-user-id': '1', 'Content-Type': 'application/json' },
            method: 'POST',
            path: '/api/access-records',
            body_example: {
              gate_no: '东门1号',
              direction: 'in',
              note: '未预约快递员临时放行'
            },
            success_response: {
              id: 2,
              visitor_id: null,
              gate_no: '东门1号',
              pass_type: 'temporary',
              direction: 'in',
              verified_by: 1,
              note: '未预约快递员临时放行'
            }
          }
        ]
      },
      repair_dispatch: {
        name: '报修派工主链路',
        description: '客服创建报修 → 派工给工程师 → 工程师接单/开工/完工 → 客服关闭',
        steps: [
          {
            step: 1,
            role: 'cs',
            title: '创建报修单',
            headers: { 'x-user-id': '2', 'Content-Type': 'application/json' },
            method: 'POST',
            path: '/api/repair-orders',
            body_example: {
              enterprise_id: 1,
              title: 'A栋3楼空调不制冷',
              description: '会议室空调开启后无冷气，已持续两天',
              location: 'A栋3楼会议室',
              urgency: 'high',
              deadline: '2026-06-05'
            },
            success_response: {
              id: 1,
              status: 'pending',
              enterprise_id: 1,
              reporter_id: 2,
              title: 'A栋3楼空调不制冷',
              urgency: 'high',
              deadline: '2026-06-05'
            }
          },
          {
            step: 2,
            role: 'cs',
            title: '派工给工程师',
            headers: { 'x-user-id': '2', 'Content-Type': 'application/json' },
            method: 'POST',
            path: '/api/work-orders',
            body_example: {
              repair_order_id: 1,
              engineer_id: 4,
              note: '请尽快处理，客户催得急'
            },
            success_response: {
              id: 1,
              repair_order_id: 1,
              engineer_id: 4,
              status: 'assigned',
              note: '请尽快处理，客户催得急'
            }
          },
          {
            step: 3,
            role: 'engineer',
            title: '查看我的工单',
            headers: { 'x-user-id': '4' },
            method: 'GET',
            path: '/api/work-orders/mine',
            body_example: null,
            success_response: [
              {
                id: 1,
                status: 'assigned',
                repair_title: 'A栋3楼空调不制冷',
                location: 'A栋3楼会议室',
                urgency: 'high',
                note: '请尽快处理，客户催得急'
              }
            ]
          },
          {
            step: 4,
            role: 'engineer',
            title: '接单',
            headers: { 'x-user-id': '4' },
            method: 'PUT',
            path: '/api/work-orders/:id/accept',
            path_params: { id: '工单ID（从步骤3获取）' },
            body_example: null,
            success_response: { message: '接单成功' }
          },
          {
            step: 5,
            role: 'engineer',
            title: '开工',
            headers: { 'x-user-id': '4' },
            method: 'PUT',
            path: '/api/work-orders/:id/start',
            path_params: { id: '工单ID（从步骤3获取）' },
            body_example: null,
            success_response: { message: '开工成功' }
          },
          {
            step: 6,
            role: 'engineer',
            title: '完工',
            headers: { 'x-user-id': '4', 'Content-Type': 'application/json' },
            method: 'PUT',
            path: '/api/work-orders/:id/complete',
            path_params: { id: '工单ID（从步骤3获取）' },
            body_example: {
              note: '已更换空调压缩机，制冷恢复正常'
            },
            success_response: { message: '完工成功' }
          },
          {
            step: 7,
            role: 'cs',
            title: '关闭报修单',
            headers: { 'x-user-id': '2' },
            method: 'PUT',
            path: '/api/repair-orders/:id/close',
            path_params: { id: '报修单ID（从步骤1获取）' },
            body_example: null,
            success_response: { message: '关闭成功' }
          }
        ]
      },
      work_order_reassign: {
        name: '工单转派主链路',
        description: '工程师转派自己的工单 / 客服转派任意工单 → 旧工单标reassigned → 新工单assigned → 报修单同步assigned',
        steps: [
          {
            step: 1,
            role: 'engineer',
            title: '工程师转派自己的工单（assigned/accepted/in_progress）',
            headers: { 'x-user-id': '4', 'Content-Type': 'application/json' },
            method: 'PUT',
            path: '/api/work-orders/:id/reassign',
            path_params: { id: '要转派的工单ID，必须是自己名下的' },
            body_example: {
              engineer_id: 5,
              note: '这个问题我处理不了，请小赵帮忙'
            },
            success_response: {
              message: '转派成功',
              old_work_order_id: 1,
              old_status: 'reassigned',
              new_work_order_id: 2,
              repair_order_id: 1,
              repair_status: 'assigned',
              updated_rows: {
                old_work_order: 1,
                new_work_order: 1,
                repair_order: 1
              }
            }
          },
          {
            step: 2,
            role: 'cs',
            title: '客服转派任意工单',
            headers: { 'x-user-id': '2', 'Content-Type': 'application/json' },
            method: 'PUT',
            path: '/api/work-orders/:id/reassign',
            path_params: { id: '要转派的工单ID' },
            body_example: {
              engineer_id: 5,
              note: '老王手头太紧，转给小赵'
            },
            success_response: {
              message: '转派成功',
              old_work_order_id: 2,
              old_status: 'reassigned',
              new_work_order_id: 3,
              repair_order_id: 1,
              repair_status: 'assigned'
            }
          }
        ]
      },
      evaluation: {
        name: '回访评价主链路',
        description: '报修完工 → 客服回访录入评价 → 主管查看差评 → 整改跟进',
        steps: [
          {
            step: 1,
            role: 'cs',
            title: '录入回访评价',
            headers: { 'x-user-id': '2', 'Content-Type': 'application/json' },
            method: 'POST',
            path: '/api/evaluations',
            body_example: {
              repair_order_id: 1,
              rater_id: 2,
              rating: 5,
              comment: '维修及时，态度好，问题彻底解决'
            },
            success_response: {
              id: 1,
              repair_order_id: 1,
              rater_id: 2,
              rating: 5,
              comment: '维修及时，态度好，问题彻底解决'
            }
          },
          {
            step: 2,
            role: 'cs',
            title: '录入差评示例（≤2分）',
            headers: { 'x-user-id': '2', 'Content-Type': 'application/json' },
            method: 'POST',
            path: '/api/evaluations',
            body_example: {
              repair_order_id: 4,
              rater_id: 3,
              rating: 1,
              comment: '修完第二天又坏了，需要重新处理'
            },
            success_response: {
              id: 2,
              repair_order_id: 4,
              rater_id: 3,
              rating: 1,
              comment: '修完第二天又坏了，需要重新处理'
            }
          },
          {
            step: 3,
            role: 'supervisor',
            title: '查看差评列表（≤2分）',
            headers: { 'x-user-id': '6' },
            method: 'GET',
            path: '/api/dashboard/bad-evaluations',
            body_example: null,
            success_response: [
              {
                id: 2,
                rating: 1,
                comment: '修完第二天又坏了，需要重新处理',
                repair_title: 'A栋8楼门禁卡失灵',
                rater_name: '客服-小刘',
                engineer_name: '工程师-老王'
              }
            ]
          },
          {
            step: 4,
            role: 'supervisor',
            title: '全局统计（含平均分/差评数/超时报修数）',
            headers: { 'x-user-id': '6' },
            method: 'GET',
            path: '/api/dashboard/stats',
            body_example: null,
            success_response: {
              total_repairs: 10,
              pending_repairs: 3,
              overdue_repairs: 2,
              completed_repairs: 5,
              avg_rating: 3.5,
              bad_evaluations: 2,
              pending_visitors: 3,
              temporary_passes: 5
            }
          }
        ]
      }
    }
  })
})

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message || '服务器错误' })
})

app.listen(PORT, () => {
  console.log(`物业管理系统 API 已启动: http://localhost:${PORT}/api`)
  console.log('种子用户:')
  console.log('  id=1 门岗-张师傅 (gate)')
  console.log('  id=2 客服-小陈 (cs)')
  console.log('  id=3 客服-小刘 (cs)')
  console.log('  id=4 工程师-老王 (engineer)')
  console.log('  id=5 工程师-小赵 (engineer)')
  console.log('  id=6 主管-周经理 (supervisor)')
})
