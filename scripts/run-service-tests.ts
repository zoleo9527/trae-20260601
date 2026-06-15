import { SupplementService } from '../src/services/supplementService'
import { ReturnService } from '../src/services/returnService'
import type { CreateSupplementParams, CreateReturnParams, TileItem } from '../src/types'

let passed = 0
let failed = 0
const errors: string[] = []

function log(level: 'INFO' | 'PASS' | 'FAIL' | 'SECTION', msg: string) {
  const colors: Record<string, string> = {
    INFO: '\x1b[36m',
    PASS: '\x1b[32m',
    FAIL: '\x1b[31m',
    SECTION: '\x1b[35m',
  }
  const reset = '\x1b[0m'
  const prefix = level === 'SECTION' ? '\n==== ' : level === 'PASS' ? '  ✓ ' : level === 'FAIL' ? '  ✗ ' : '  • '
  console.log(`${colors[level]}${prefix}${msg}${reset}`)
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    log('PASS', name)
    passed++
  } catch (e: any) {
    log('FAIL', `${name} —— ${e.message || String(e)}`)
    errors.push(`${name}: ${e.message || String(e)}`)
    failed++
  }
}

function assert(cond: any, msg: string) {
  if (!cond) throw new Error(msg)
}

function assertEq(actual: any, expected: any, msg: string) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

async function main() {
  console.log('\x1b[1m\x1b[34m瓷砖门店 - 补砖申请与退货复核 服务层测试\x1b[0m')
  console.log('=' .repeat(60))

  // ============================================================
  // 补砖申请 - 正常单
  // ============================================================
  log('SECTION', '补砖申请【正常单】流程测试')

  let normalId = 'BZ20260601001'

  await test('正常单 - 详情查询', async () => {
    const d = await SupplementService.detail(normalId)
    assert(d, '未找到正常单')
    assertEq(d!.id, normalId, '单号不符')
    assertEq(d!.status, 'completed', '状态应为 completed')
    assert(d!.tiles.length > 0, '瓷砖明细不能为空')
    assert(d!.history.length >= 5, `历史记录应≥5，实际${d!.history.length}`)
  })

  await test('正常单 - 回看历史', async () => {
    const h = await SupplementService.history(normalId)
    assert(h, '未返回历史')
    assert(h!.length >= 5, `历史记录应≥5，实际${h!.length}`)
    assertEq(h![0].action, 'complete', '最新动作应为 complete（按时间倒序）')
    assertEq(h![h!.length - 1].action, 'create', '最早动作应为 create')
    for (const r of h!) {
      assert(r.operatorId && r.operatorName, `操作人信息缺失: ${r.action}`)
      assert(r.timestamp, `时间戳缺失: ${r.action}`)
    }
  })

  await test('正常单 - 导出详情', async () => {
    const r = await SupplementService.exportDetail(normalId)
    assertEq(r.status, 'success', '导出状态失败')
    assert(r.fileName.includes(normalId), '文件名应包含单号')
    assert(r.recordCount === 1, '详情导出记录数应为1')
    assert(r.fileSize > 0, '文件大小应>0')
    assert(r.downloadUrl, 'downloadUrl 不能为空')
  })

  await test('正常单 - 导出清单（带筛选）', async () => {
    const r = await SupplementService.exportList({ keyword: '陈先生', dateFrom: '2026-06-01', dateTo: '2026-06-30' })
    assertEq(r.status, 'success', '导出状态失败')
    assert(r.recordCount >= 1, `应筛选出≥1条，实际${r.recordCount}`)
  })

  await test('正常单 - 列表查询（按单号）', async () => {
    const res = await SupplementService.list({ page: 1, pageSize: 10, keyword: normalId })
    assert(res.total >= 1, `按单号搜索应命中，实际 total=${res.total}`)
    assertEq(res.list[0].id, normalId, '首条记录应匹配')
  })

  // ============================================================
  // 补砖申请 - 问题单（驳回→补录→改期）
  // ============================================================
  log('SECTION', '补砖申请【问题单】流程测试')

  const problemId = 'BZ20260610007'

  await test('问题单 - 详情查询（含驳回/补录/改期痕迹）', async () => {
    const d = await SupplementService.detail(problemId)
    assert(d, '未找到问题单')
    assertEq(d!.status, 'rescheduled', '状态应为 rescheduled')
    assert(d!.expectedDeliveryDate === '2026-06-18', `期望送达日期应为改期后 2026-06-18，实际 ${d!.expectedDeliveryDate}`)
  })

  await test('问题单 - 历史回看（驳回→补录→改期完整链条）', async () => {
    const h = await SupplementService.history(problemId)
    assert(h, '未返回历史')
    const actions = h!.map(x => x.action)
    assert(actions.includes('reject'), '缺少 reject 记录')
    assert(actions.includes('supplement'), '缺少 supplement 记录')
    assert(actions.includes('reschedule'), '缺少 reschedule 记录')
    const rejectRec = h!.find(x => x.action === 'reject')!
    assert(rejectRec.remark && rejectRec.remark.length > 0, '驳回记录应有原因说明')
    assert(rejectRec.changes && rejectRec.changes.length > 0, '驳回记录应有变更字段')
    const rescheduleRec = h!.find(x => x.action === 'reschedule')!
    assert(rescheduleRec.changes, '改期记录应有变更内容')
    assertEq(rescheduleRec.changes![0].field, '期望送达日期', '变更字段名称不对')
    assertEq(rescheduleRec.changes![0].newValue, '2026-06-18', '改期后日期不对')
  })

  // 模拟：创建 → 提交 → 设计师驳回 → 导购补录 → 重新提交 → 设计师确认 → 改期
  await test('模拟完整问题单流转（新单创建+驳回+补录+改期）', async () => {
    const tiles: TileItem[] = [
      { sku: 'TL-TEST-01', name: '测试地砖', spec: '600x600mm', color: '米黄', unit: '片', quantity: 50, unitPrice: 88 },
    ]
    const params: CreateSupplementParams = {
      orderNo: 'XS-TEST-001',
      customerName: '测试客户',
      customerPhone: '138****0000',
      address: '测试地址',
      guideId: 'U001',
      source: 'measurement_sheet',
      sourceRefNo: 'LF-TEST-001',
      reason: '测试补砖',
      tiles,
      expectedDeliveryDate: '2026-07-01',
    }
    const created = await SupplementService.create(params)
    assertEq(created.status, 'pending', '创建后应为 pending')
    assert(created.id.startsWith('BZ'), '单号前缀应为 BZ')

    const submitted = await SupplementService.submit(created.id, 'U001')
    assertEq(submitted.status, 'designing', '提交后应为 designing')

    const rejected = await SupplementService.reject(created.id, 'U002', '数量存疑，请重新核对')
    assertEq(rejected.status, 'rejected', '驳回后应为 rejected')
    const rejectHis = rejected.history[rejected.history.length - 1]
    assertEq(rejectHis.action, 'reject', '历史动作应为 reject')
    assert(rejectHis.changes!.length === 1, '驳回应有变更记录')

    const supplemented = await SupplementService.supplement(created.id, 'U001', {
      remark: '已重新核对数量，改为 60 片',
      changes: [{ field: '数量', oldValue: '50', newValue: '60' }],
      tiles: [{ ...tiles[0], quantity: 60 }],
    })
    assertEq(supplemented.status, 'supplemented', '补录后应为 supplemented')
    assertEq(supplemented.tiles[0].quantity, 60, '补录后数量应为 60')
    assertEq(supplemented.totalAmount, 60 * 88, '金额计算错误')

    const reSubmit = await SupplementService.submit(created.id, 'U001')
    assertEq(reSubmit.status, 'designing', '补录后再提交应为 designing')

    const confirmed = await SupplementService.confirmDesign(created.id, 'U002', { remark: '已复核无误' })
    assertEq(confirmed.status, 'confirmed', '设计师确认应为 confirmed')

    const rescheduled = await SupplementService.reschedule(created.id, 'U001', '2026-07-05', '工地延期')
    assertEq(rescheduled.status, 'rescheduled', '改期后应为 rescheduled')
    assertEq(rescheduled.expectedDeliveryDate, '2026-07-05', '改期日期不对')

    // 最终历史条数校验
    const history = await SupplementService.history(created.id)
    assert(history!.length >= 7, `历史记录应≥7，实际${history!.length}`)
  })

  await test('问题单 - 仓库备货→发货→签收（接问题单改期后继续走完，完整闭合）', async () => {
    // 使用刚才创建的模拟单：找到状态为 rescheduled 的那一条
    const list = await SupplementService.list({ page: 1, pageSize: 20, status: 'rescheduled' })
    const target = list.list.find(x => x.orderNo === 'XS-TEST-001')
    assert(target, '未找到待继续的模拟单')

    // 仓库从 rescheduled 状态也能开始备货（修复后的权限）
    const warehoused = await SupplementService.startWarehouse(target!.id, 'U003')
    assertEq(warehoused.status, 'warehousing', 'rescheduled → warehousing 流转失败')

    const shipped = await SupplementService.ship(target!.id, 'U003', '物流 SF-TEST-001')
    assertEq(shipped.status, 'shipped', '发货后应为 shipped')
    assertEq(shipped.expressNo, '物流 SF-TEST-001', '物流单号未绑定')

    const completed = await SupplementService.complete(target!.id, 'U001', '客户已签收，确认无误')
    assertEq(completed.status, 'completed', '签收后应为 completed')
    assert(completed.actualDeliveryDate && completed.actualDeliveryDate.length > 0, '应有实际送达日期')

    // 最终历史条数校验
    const history = await SupplementService.history(target!.id)
    assert(history!.length >= 10, `历史记录应≥10，实际${history!.length}`)
    const actions = history!.map(x => x.action)
    assert(actions.includes('reschedule'), '缺少 reschedule 记录')
    assert(actions.includes('start_warehouse'), '缺少 start_warehouse 记录')
    assert(actions.includes('ship'), '缺少 ship 记录')
    assert(actions.includes('complete'), '缺少 complete 记录')
  })

  // ============================================================
  // 退货复核 - 正常单
  // ============================================================
  log('SECTION', '退货复核【正常单】流程测试')

  const returnNormalId = 'TH20260603002'

  await test('退货正常单 - 详情查询', async () => {
    const d = await ReturnService.detail(returnNormalId)
    assert(d, '未找到正常退货单')
    assertEq(d!.id, returnNormalId, '单号不符')
    assertEq(d!.status, 'refunded', '状态应为 refunded')
    assertEq(d!.supplementId, 'BZ20260601001', '应关联补砖单')
    assert(d!.inspectionResult && d!.inspectionResult.length > 0, '应有验货结果')
    assert(d!.history.length >= 4, `历史记录应≥4，实际${d!.history.length}`)
  })

  await test('退货正常单 - 回看历史', async () => {
    const h = await ReturnService.history(returnNormalId)
    assert(h, '未返回历史')
    assert(h!.length >= 4, `历史记录应≥4，实际${h!.length}`)
    const actions = h!.map(x => x.action)
    assert(actions.includes('create'), '缺少 create')
    assert(actions.includes('inspect'), '缺少 inspect')
    assert(actions.includes('pass'), '缺少 pass')
    assert(actions.includes('refund'), '缺少 refund')
    const refundRec = h!.find(x => x.action === 'refund')!
    assert(refundRec.changes && refundRec.changes.length > 0, '退款记录应有变更')
  })

  await test('退货正常单 - 导出详情', async () => {
    const r = await ReturnService.exportDetail(returnNormalId)
    assertEq(r.status, 'success', '导出状态失败')
    assert(r.fileName.includes(returnNormalId), '文件名应包含单号')
  })

  await test('退货正常单 - 导出清单', async () => {
    const r = await ReturnService.exportList({ status: 'refunded' })
    assertEq(r.status, 'success', '导出状态失败')
    assert(r.recordCount >= 1, `应≥1条退款成功记录，实际${r.recordCount}`)
  })

  await test('退货正常单 - 列表查询（按关联补砖单号）', async () => {
    const res = await ReturnService.list({ page: 1, pageSize: 10, keyword: 'BZ20260601001' })
    assert(res.total >= 1, `按补砖单号搜索应命中，实际 total=${res.total}`)
  })

  // ============================================================
  // 退货复核 - 问题单（驳回→补录→改期）
  // ============================================================
  log('SECTION', '退货复核【问题单】流程测试')

  const returnProblemId = 'TH20260612005'

  await test('退货问题单 - 详情查询（含驳回/补录/改期痕迹）', async () => {
    const d = await ReturnService.detail(returnProblemId)
    assert(d, '未找到退货问题单')
    assertEq(d!.status, 'rescheduled', '状态应为 rescheduled')
    assert(d!.rejectReason && d!.rejectReason.length > 0, '应有驳回原因')
    assertEq(d!.pickupDate, '2026-06-20', `取货日期应为改期后 2026-06-20，实际 ${d!.pickupDate}`)
  })

  await test('退货问题单 - 历史回看（完整链条）', async () => {
    const h = await ReturnService.history(returnProblemId)
    assert(h, '未返回历史')
    const actions = h!.map(x => x.action)
    assert(actions.includes('reject'), '缺少 reject 记录')
    assert(actions.includes('supplement'), '缺少 supplement 记录')
    assert(actions.includes('reschedule'), '缺少 reschedule 记录')
    const supplementRec = h!.find(x => x.action === 'supplement')!
    assert(supplementRec.attachments && supplementRec.attachments.length >= 1, '补录应有附件记录')
    assert(supplementRec.changes!.length >= 1, '补录应有变更字段')
    const rescheduleRec = h!.find(x => x.action === 'reschedule')!
    assertEq(rescheduleRec.changes![0].newValue, '2026-06-20', '改期日期不对')
  })

  // 模拟完整问题单流程
  await test('模拟完整退货问题单（创建→验货→驳回→补录→改期→通过→退款）', async () => {
    const params: CreateReturnParams = {
      orderNo: 'XS-TEST-002',
      supplementId: 'BZ-TEST-001',
      customerName: '测试客户2',
      customerPhone: '139****0002',
      address: '测试地址2',
      applicantId: 'U001',
      reason: '测试退货 - 色差不符',
      tiles: [{ sku: 'TL-RET-01', name: '退货测试砖', spec: '800x800mm', color: '白', unit: '片', quantity: 10, unitPrice: 150 }],
      pickupDate: '2026-07-10',
    }
    const created = await ReturnService.create(params)
    assertEq(created.status, 'pending', '创建后应为 pending')
    assert(created.id.startsWith('TH'), '单号前缀应为 TH')

    const inspected = await ReturnService.inspect(created.id, 'U003', { remark: '安排 7月10日 上门', warehouseId: 'U003' })
    assertEq(inspected.status, 'inspecting', '验货后应为 inspecting')
    assertEq(inspected.warehouseId, 'U003', '仓库员未绑定')

    const rejected = await ReturnService.reject(created.id, 'U003', '缺少验货照片凭证，请补录')
    assertEq(rejected.status, 'rejected', '驳回后应为 rejected')
    assert(rejected.rejectReason === '缺少验货照片凭证，请补录', '驳回原因不对')

    const supplemented = await ReturnService.supplement(created.id, 'U001', {
      remark: '已上传验货照片 3 张、对比图 2 张',
      inspectionResult: '已补充现场凭证，货物确实与样板存在色差',
      changes: [
        { field: '附件数量', oldValue: '0', newValue: '5' },
        { field: '验货结果', oldValue: '未验货', newValue: '已补录凭证' },
      ],
      attachments: [
        { name: '验货照片-1.jpg', url: '#' },
        { name: '对比图-1.jpg', url: '#' },
      ],
    })
    assertEq(supplemented.status, 'supplemented', '补录后应为 supplemented')
    assertEq(supplemented.inspectionResult, '已补充现场凭证，货物确实与样板存在色差', '验货结果未更新')

    const rescheduled = await ReturnService.reschedule(created.id, 'U001', '2026-07-15', '客户外出，改期到 7月15日')
    assertEq(rescheduled.status, 'rescheduled', '改期后应为 rescheduled')
    assertEq(rescheduled.pickupDate, '2026-07-15', '改期后日期不对')
    const reschHis = rescheduled.history[rescheduled.history.length - 1]
    assertEq(reschHis.changes![0].newValue, '2026-07-15', '历史变更日期不对')

    const passed = await ReturnService.pass(rescheduled.id, 'U003', {
      remark: '二次验货，凭证齐全',
      inspectionResult: '复核通过，包装完好，数量一致，准予退货',
    })
    assertEq(passed.status, 'confirmed', '复核通过后应为 confirmed')

    const refunded = await ReturnService.refund(passed.id, 'U001', {
      remark: '原路退款 ¥1,500.00，已到账',
      changes: [{ field: '退款金额', oldValue: '', newValue: '¥1,500.00' }],
    })
    assertEq(refunded.status, 'refunded', '退款后应为 refunded')

    // 历史记录条数校验
    const history = await ReturnService.history(created.id)
    assert(history!.length >= 7, `历史记录应≥7，实际${history!.length}`)
  })

  // ============================================================
  // 综合校验
  // ============================================================
  log('SECTION', '综合/边界校验')

  await test('不存在的单号 - 详情返回 null', async () => {
    const s = await SupplementService.detail('BZ-NOT-EXIST')
    assertEq(s, null, '应为 null')
    const r = await ReturnService.detail('TH-NOT-EXIST')
    assertEq(r, null, '应为 null')
  })

  await test('不存在的单号 - 历史返回 null', async () => {
    const s = await SupplementService.history('BZ-NOT-EXIST')
    assertEq(s, null, '应为 null')
    const r = await ReturnService.history('TH-NOT-EXIST')
    assertEq(r, null, '应为 null')
  })

  await test('补砖列表 - 分页工作正常', async () => {
    const p1 = await SupplementService.list({ page: 1, pageSize: 2 })
    const p2 = await SupplementService.list({ page: 2, pageSize: 2 })
    assert(p1.total >= 3, `数据应≥3，实际${p1.total}`)
    assert(p1.list.length <= 2, '第1页条数错误')
    assert(p2.list.length >= 1, '第2页应有数据')
    if (p1.list.length > 0 && p2.list.length > 0) {
      assert(p1.list[0].id !== p2.list[0].id, '分页去重失败')
    }
  })

  await test('退货列表 - 按状态筛选', async () => {
    const res = await ReturnService.list({ page: 1, pageSize: 10, status: 'rejected' })
    for (const item of res.list) {
      assertEq(item.status, 'rejected', '状态筛选结果不正确')
    }
  })

  await test('补砖 - 创建后总金额自动计算', async () => {
    const tiles: TileItem[] = [
      { sku: 'T1', name: 'A', spec: 's', color: 'c', unit: '片', quantity: 10, unitPrice: 100 },
      { sku: 'T2', name: 'B', spec: 's', color: 'c', unit: '片', quantity: 3, unitPrice: 50 },
    ]
    const params: CreateSupplementParams = {
      orderNo: 'XS-TEST-CALC',
      customerName: '金额测试',
      customerPhone: '13800000000',
      address: '地址',
      guideId: 'U001',
      source: 'other',
      reason: '测试金额',
      tiles,
      expectedDeliveryDate: '2026-08-01',
    }
    const created = await SupplementService.create(params)
    assertEq(created.totalAmount, 10 * 100 + 3 * 50, `金额应为 1150，实际 ${created.totalAmount}`)
  })

  // ============================================================
  // 结果汇总
  // ============================================================
  console.log()
  console.log('='.repeat(60))
  console.log(`\x1b[1m测试结果\x1b[0m: \x1b[32m通过 ${passed}\x1b[0m · \x1b[31m失败 ${failed}\x1b[0m · 总计 ${passed + failed}`)
  if (errors.length > 0) {
    console.log('\n\x1b[31m失败详情：\x1b[0m')
    errors.forEach(e => console.log(`  - ${e}`))
    process.exit(1)
  } else {
    console.log('\n\x1b[32m🎉 所有服务层测试通过！\x1b[0m')
    process.exit(0)
  }
}

main().catch(e => {
  console.error('\x1b[31m未捕获错误：\x1b[0m', e)
  process.exit(1)
})
