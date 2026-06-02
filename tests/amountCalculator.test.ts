import { describe, it, expect } from 'vitest';
import {
  AMOUNT_RULES,
  calculateCommission,
  calculateWeightAdjustment,
  calculateBadProductCompensation,
  calculateOutOfStockRefund,
  calculateNetSettlement,
  generateOrderCommissionLine,
  generateWeightAdjustmentLine,
  generateRefundLine,
  generateCompensationLine,
  generateCommissionAdjustmentLine,
  generateSummaryLine,
  formatAmount,
  parseAmount,
} from '../src/utils/amountCalculator.js';

describe('金额计算规则 - 佣金计算', () => {
  it('规则：佣金 = 佣金基数 × 佣金比例 ÷ 10000', () => {
    // 佣金比例单位：万分之几，1000 = 10%
    const commission = calculateCommission(10000, 1000);
    expect(commission).toBe(1000); // 10000 × 10% = 1000
  });

  it('不同佣金比例测试', () => {
    expect(calculateCommission(10000, 500)).toBe(500); // 5%
    expect(calculateCommission(10000, 800)).toBe(800); // 8%
    expect(calculateCommission(10000, 1500)).toBe(1500); // 15%
  });

  it('边界情况：基数为0', () => {
    expect(calculateCommission(0, 1000)).toBe(0);
  });

  it('边界情况：比例为0', () => {
    expect(calculateCommission(10000, 0)).toBe(0);
  });

  it('向下取整测试', () => {
    // 12345 × 10% = 1234.5 → 向下取整为 1234
    expect(calculateCommission(12345, 1000)).toBe(1234);
  });

  it('团长默认佣金10%计算正确', () => {
    // 订单实际金额 28752 分（287.52元）
    // 佣金 = 28752 × 10% = 2875.2 → 2875分
    expect(calculateCommission(28752, 1000)).toBe(2875);
  });
});

describe('金额计算规则 - 称重补差', () => {
  it('规则：|实际-预估|/预估 > 千分之三 才补差', () => {
    // 预估 1000 分
    // 差异 < 3分（千分之三）不补差
    const result1 = calculateWeightAdjustment(1000, 998); // 差-2分，千分之2
    expect(result1.shouldAdjust).toBe(false);
    expect(result1.diffRate).toBe(2);

    // 差异 ≥ 3分 补差
    const result2 = calculateWeightAdjustment(1000, 997); // 差-3分，千分之3
    expect(result2.shouldAdjust).toBe(false); // 等于不补差

    const result3 = calculateWeightAdjustment(1000, 996); // 差-4分，千分之4
    expect(result3.shouldAdjust).toBe(true);
    expect(result3.diff).toBe(-4);
  });

  it('称重少退（实际<预估）返回负数', () => {
    // 苹果：预估5斤=2995分，实际4.8斤=2875分
    // 差 -120 分，差率 120/2995 ≈ 40.07‰
    const result = calculateWeightAdjustment(2995, 2875);
    expect(result.diff).toBe(-120);
    expect(result.shouldAdjust).toBe(true);
    expect(result.diffRate).toBeGreaterThan(3);
  });

  it('称重多补（实际>预估）返回正数', () => {
    // 香蕉：预估3斤=1197分，实际3.05斤=1217分
    // 差 +20 分，差率 20/1197 ≈ 16.71‰
    const result = calculateWeightAdjustment(1197, 1217);
    expect(result.diff).toBe(20);
    expect(result.shouldAdjust).toBe(true);
  });

  it('误差范围内不补差', () => {
    // 预估1000分，实际998分，差2分，千分之2
    const result = calculateWeightAdjustment(1000, 998);
    expect(result.shouldAdjust).toBe(false);
  });

  it('种子数据场景：苹果5斤→4.8斤', () => {
    const estimated = 5 * 599; // 2995
    const actual = Math.round(4.8 * 599); // 2875
    const result = calculateWeightAdjustment(estimated, actual);
    expect(result.diff).toBe(-120);
    expect(result.shouldAdjust).toBe(true);
  });
});

describe('金额计算规则 - 坏果赔付', () => {
  it('规则：坏果率 > 5% 才赔付，赔付金额 = 坏果金额 × 120%', () => {
    // 订单100元（10000分），共10斤，坏3斤 = 坏果率30%
    const result = calculateBadProductCompensation(10000, 10, 3);
    expect(result.badRate).toBe(30);
    expect(result.shouldCompensate).toBe(true);
    // 坏果金额 = 10000 × 3/10 = 3000
    // 赔付 = 3000 × 120% = 3600
    expect(result.compensation).toBe(3600);
  });

  it('坏果率 ≤ 5% 不赔付', () => {
    // 坏果率5%
    const result = calculateBadProductCompensation(10000, 100, 5);
    expect(result.badRate).toBe(5);
    expect(result.shouldCompensate).toBe(false);
    expect(result.compensation).toBe(0);
  });

  it('坏果率 < 5% 不赔付', () => {
    const result = calculateBadProductCompensation(10000, 100, 4);
    expect(result.badRate).toBe(4);
    expect(result.shouldCompensate).toBe(false);
    expect(result.compensation).toBe(0);
  });

  it('种子数据场景：10斤苹果坏4斤', () => {
    const orderAmount = 10 * 599; // 5990分
    const result = calculateBadProductCompensation(orderAmount, 10, 4);
    expect(result.badRate).toBe(40); // 40%
    expect(result.shouldCompensate).toBe(true);
    // 坏果金额 = 5990 × 4/10 = 2396
    // 赔付 = 2396 × 120% = 2875.2 → 2875
    expect(result.compensation).toBe(2875);
  });

  it('边界：坏果数量为0', () => {
    const result = calculateBadProductCompensation(10000, 10, 0);
    expect(result.shouldCompensate).toBe(false);
    expect(result.compensation).toBe(0);
  });

  it('向下取整测试', () => {
    // 12345分，10个坏3个
    // 坏果金额 = 12345 × 3/10 = 3703.5 → 3703
    // 赔付 = 3703 × 120% = 4443.6 → 4443
    const result = calculateBadProductCompensation(12345, 10, 3);
    expect(result.compensation).toBe(4443);
  });
});

describe('金额计算规则 - 缺货退款', () => {
  it('规则：缺货商品全额退款', () => {
    // 单价8900分，1份
    const refund = calculateOutOfStockRefund(8900, 1);
    expect(refund).toBe(8900);
  });

  it('多件商品缺货', () => {
    // 单价3500分，2盒
    expect(calculateOutOfStockRefund(3500, 2)).toBe(7000);
  });

  it('边界：数量为0', () => {
    expect(calculateOutOfStockRefund(8900, 0)).toBe(0);
  });

  it('种子数据场景：车厘子缺货', () => {
    expect(calculateOutOfStockRefund(8900, 1)).toBe(8900);
  });
});

describe('金额计算规则 - 结算净额', () => {
  it('公式：净额 = 佣金 + 称重补差 - 退款 - 赔付 + 佣金调整', () => {
    const net = calculateNetSettlement({
      commissionAmount: 2875, // 佣金
      weightAdjustment: -100, // 称重少退，从佣金扣
      refundAmount: 8900, // 缺货退款
      compensationAmount: 2875, // 坏果赔付
      commissionAdjust: 5000, // 佣金调整（补回）
    });
    // 2875 - 100 - 8900 - 2875 + 5000 = -4000
    expect(net).toBe(-4000);
  });

  it('正数结算（正常情况）', () => {
    const net = calculateNetSettlement({
      commissionAmount: 10000,
      weightAdjustment: 0,
      refundAmount: 1000,
      compensationAmount: 500,
      commissionAdjust: 0,
    });
    expect(net).toBe(8500); // 10000 - 1000 - 500
  });

  it('全零情况', () => {
    const net = calculateNetSettlement({
      commissionAmount: 0,
      weightAdjustment: 0,
      refundAmount: 0,
      compensationAmount: 0,
      commissionAdjust: 0,
    });
    expect(net).toBe(0);
  });
});

describe('明细行生成 - 佣金明细', () => {
  it('生成订单佣金明细行', () => {
    const line = generateOrderCommissionLine({
      orderNo: 'ORD202606010001',
      orderAmount: 4192,
      commissionBase: 4092,
      commissionRate: 1000,
      commissionAmount: 409,
    });
    expect(line.lineType).toBe('commission');
    expect(line.description).toContain('ORD202606010001');
    expect(line.amount).toBe(409);
    expect(line.calculationFormula).toBe('佣金基数 × 佣金比例');
    expect(line.calculationDetail).toContain('4092分');
    expect(line.calculationDetail).toContain('10%');
    expect(line.calculationDetail).toContain('409分');
  });
});

describe('明细行生成 - 称重补差明细', () => {
  it('生成称重少退明细行', () => {
    const line = generateWeightAdjustmentLine({
      orderNo: 'ORD202606010001',
      estimatedAmount: 2995,
      actualAmount: 2875,
      diff: -120,
      diffRate: 40.07,
    });
    expect(line.lineType).toBe('weight');
    expect(line.description).toContain('称重少退');
    expect(line.amount).toBe(-120);
    expect(line.calculationDetail).toContain('40.07‰');
  });

  it('生成称重多补明细行', () => {
    const line = generateWeightAdjustmentLine({
      orderNo: 'ORD202606010001',
      estimatedAmount: 1197,
      actualAmount: 1217,
      diff: 20,
      diffRate: 16.71,
    });
    expect(line.description).toContain('称重多补');
    expect(line.amount).toBe(20);
  });
});

describe('明细行生成 - 退款明细', () => {
  it('生成缺货退款明细行', () => {
    const line = generateRefundLine({
      orderNo: 'ORD202606010002',
      afterSaleNo: 'AS202606010001',
      reason: '车厘子库存不足',
      amount: 8900,
    });
    expect(line.lineType).toBe('refund');
    expect(line.amount).toBe(-8900); // 退款是负数
    expect(line.calculationDetail).toContain('AS202606010001');
    expect(line.calculationDetail).toContain('8900分');
  });
});

describe('明细行生成 - 赔付明细', () => {
  it('生成坏果赔付明细行', () => {
    const line = generateCompensationLine({
      orderNo: 'ORD202606010003',
      afterSaleNo: 'AS202606010002',
      badRate: 40,
      orderAmount: 5990,
      compensation: 2875,
    });
    expect(line.lineType).toBe('compensation');
    expect(line.amount).toBe(-2875);
    expect(line.calculationDetail).toContain('40%');
    expect(line.calculationDetail).toContain('2875分');
  });
});

describe('明细行生成 - 佣金调整明细', () => {
  it('生成佣金增加明细行', () => {
    const line = generateCommissionAdjustmentLine({
      adjustmentNo: 'ADJ202606010002',
      reason: '5月28日佣金计算有误',
      amount: 5000,
      operator: '财务-李姐',
    });
    expect(line.lineType).toBe('adjustment');
    expect(line.description).toContain('佣金增加');
    expect(line.amount).toBe(5000);
    expect(line.calculationDetail).toContain('ADJ202606010002');
    expect(line.calculationDetail).toContain('财务-李姐');
  });

  it('生成佣金扣减明细行', () => {
    const line = generateCommissionAdjustmentLine({
      adjustmentNo: 'ADJ202606010003',
      reason: '上月多发佣金',
      amount: -2000,
      operator: '财务-李姐',
    });
    expect(line.description).toContain('佣金扣减');
    expect(line.amount).toBe(-2000);
  });
});

describe('明细行生成 - 汇总明细', () => {
  it('生成结算汇总行', () => {
    const line = generateSummaryLine({
      orderCount: 3,
      orderTotal: 23082,
      commissionTotal: 2308,
      weightAdjustment: -100,
      refundTotal: 8900,
      compensationTotal: 2875,
      commissionAdjust: 5000,
      netSettlement: -4567,
    });
    expect(line.lineType).toBe('summary');
    expect(line.amount).toBe(-4567);
    expect(line.calculationDetail).toContain('3笔订单');
    expect(line.calculationDetail).toContain('23082分');
  });
});

describe('金额格式化', () => {
  it('分转元格式化', () => {
    expect(formatAmount(100)).toBe('1.00');
    expect(formatAmount(1234)).toBe('12.34');
    expect(formatAmount(5)).toBe('0.05');
    expect(formatAmount(-120)).toBe('-1.20');
  });

  it('元转分解析', () => {
    expect(parseAmount('1.00')).toBe(100);
    expect(parseAmount('12.34')).toBe(1234);
    expect(parseAmount('0.05')).toBe(5);
    expect(parseAmount(12.34)).toBe(1234);
  });
});

describe('常量规则验证', () => {
  it('佣金比例基数为万分之', () => {
    expect(AMOUNT_RULES.COMMISSION_RATE_BASE).toBe(10000);
  });

  it('称重误差允许范围千分之三', () => {
    expect(AMOUNT_RULES.WEIGHT_TOLERANCE_RATE).toBe(3);
    expect(AMOUNT_RULES.WEIGHT_TOLERANCE_BASE).toBe(1000);
  });

  it('坏果赔付门槛5%', () => {
    expect(AMOUNT_RULES.BAD_PRODUCT_MIN_RATE).toBe(500); // 万分之五百 = 5%
    expect(AMOUNT_RULES.BAD_PRODUCT_BASE).toBe(10000);
  });

  it('坏果赔付比例120%', () => {
    expect(AMOUNT_RULES.BAD_PRODUCT_COMPENSATION_MULTIPLE).toBe(120);
    expect(AMOUNT_RULES.BAD_PRODUCT_COMPENSATION_BASE).toBe(100);
  });
});

describe('种子数据场景综合测试', () => {
  it('完整结算单计算 - 种子数据场景', () => {
    // 模拟种子数据的完整结算计算

    // 订单1：苹果5斤(2995) + 香蕉3斤(1197) = 4192
    // 履约后：苹果4.8斤(2875) + 香蕉3.05斤(1217) = 4092
    // 苹果少120分（需补差），香蕉多20分（需补差）
    const order1Commission = calculateCommission(4092, 1000); // 4092 × 10% = 409

    // 订单2：车厘子(8900) + 鸡蛋2盒(7000) = 15900
    // 履约后：车厘子缺货(0) + 鸡蛋(7000) = 7000
    // 售后：车厘子缺货退款8900
    const order2Commission = calculateCommission(7000, 1000); // 700

    // 订单3：苹果10斤 = 5990
    // 履约后：5990
    // 售后：坏果4斤，赔付2875
    const order3Commission = calculateCommission(5990, 1000); // 599

    // 汇总
    const totalCommission = order1Commission + order2Commission + order3Commission;
    const weightAdjustment = -120 + 20; // 苹果少退120，香蕉多补20
    const refundAmount = 8900; // 车厘子缺货
    const compensationAmount = 2875; // 坏果赔付
    const commissionAdjust = 5000; // 团长质疑补回

    const net = calculateNetSettlement({
      commissionAmount: totalCommission,
      weightAdjustment,
      refundAmount,
      compensationAmount,
      commissionAdjust,
    });

    // 期望：1708 - 100 - 8900 - 2875 + 5000 = -5167
    expect(totalCommission).toBe(409 + 700 + 599);
    expect(weightAdjustment).toBe(-100);
    expect(net).toBe(1708 - 100 - 8900 - 2875 + 5000);
    expect(net).toBe(-5167);
  });

  it('坏果赔付规则验证（种子数据）', () => {
    // 种子数据：订单3苹果10斤59.90元，坏4斤
    const result = calculateBadProductCompensation(5990, 10, 4);
    expect(result.badRate).toBe(40);
    expect(result.shouldCompensate).toBe(true);
    // 坏果金额 = 5990 × 4/10 = 2396
    // 赔付 = 2396 × 120% = 2875.2 → 2875
    expect(result.compensation).toBe(2875);
  });

  it('称重补差规则验证（种子数据）', () => {
    // 苹果：预估2995，实际2875，差-120
    const appleResult = calculateWeightAdjustment(2995, 2875);
    expect(appleResult.diff).toBe(-120);
    expect(appleResult.shouldAdjust).toBe(true);
    expect(appleResult.diffRate).toBeCloseTo(40.07, 1);

    // 香蕉：预估1197，实际1217，差+20
    const bananaResult = calculateWeightAdjustment(1197, 1217);
    expect(bananaResult.diff).toBe(20);
    expect(bananaResult.shouldAdjust).toBe(true);
  });
});
