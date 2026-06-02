// 金额计算规则 - 所有金额单位为分
// 计算规则直接写在代码中，通过测试覆盖

export const AMOUNT_RULES = {
  // 佣金比例基数：万分之几
  COMMISSION_RATE_BASE: 10000,
  // 称重误差允许范围：千分之三以内不补差
  WEIGHT_TOLERANCE_RATE: 3, // 千分之三
  WEIGHT_TOLERANCE_BASE: 1000,
  // 坏果赔付：坏果比例超过5%才赔付
  BAD_PRODUCT_MIN_RATE: 500, // 万分之五百 = 5%
  BAD_PRODUCT_BASE: 10000,
  // 坏果赔付比例：坏果金额的120%（退一赔一）
  BAD_PRODUCT_COMPENSATION_MULTIPLE: 120,
  BAD_PRODUCT_COMPENSATION_BASE: 100,
} as const;

// 计算佣金
// 公式：佣金 = 佣金计算基数 × 佣金比例 ÷ 10000
export function calculateCommission(
  baseAmount: number,
  commissionRate: number,
): number {
  if (baseAmount <= 0) return 0;
  if (commissionRate <= 0) return 0;
  return Math.floor((baseAmount * commissionRate) / AMOUNT_RULES.COMMISSION_RATE_BASE);
}

// 计算称重补差
// 规则：|实际重量 - 预估重量| / 预估重量 > 千分之三 才补差
// 返回：正数=少退（补给顾客/团长），负数=多补（向顾客/团长收）
export function calculateWeightAdjustment(
  estimatedSubtotal: number,
  actualSubtotal: number,
): {
  diff: number;
  shouldAdjust: boolean;
  diffRate: number; // 千分比
} {
  const diff = actualSubtotal - estimatedSubtotal;

  if (estimatedSubtotal === 0) {
    return { diff, shouldAdjust: diff !== 0, diffRate: 0 };
  }

  const diffRate = Math.abs((diff / estimatedSubtotal) * AMOUNT_RULES.WEIGHT_TOLERANCE_BASE);
  const shouldAdjust = diffRate > AMOUNT_RULES.WEIGHT_TOLERANCE_RATE;

  return {
    diff,
    shouldAdjust,
    diffRate: Math.round(diffRate * 100) / 100,
  };
}

// 计算坏果赔付
// 规则：坏果比例超过5%，赔付坏果金额的120%
// 公式：赔付金额 = 坏果数量 ÷ 总数量 × 订单金额 × 120%
export function calculateBadProductCompensation(
  orderAmount: number,
  totalQuantity: number,
  badQuantity: number,
): {
  compensation: number;
  badRate: number; // 百分比
  shouldCompensate: boolean;
} {
  if (totalQuantity <= 0 || badQuantity <= 0) {
    return { compensation: 0, badRate: 0, shouldCompensate: false };
  }

  const badRate = (badQuantity / totalQuantity) * 100;
  const badRateInBase = (badQuantity / totalQuantity) * AMOUNT_RULES.BAD_PRODUCT_BASE;
  const shouldCompensate = badRateInBase > AMOUNT_RULES.BAD_PRODUCT_MIN_RATE;

  let compensation = 0;
  if (shouldCompensate) {
    const badProductAmount = Math.floor((orderAmount * badQuantity) / totalQuantity);
    compensation = Math.floor(
      (badProductAmount * AMOUNT_RULES.BAD_PRODUCT_COMPENSATION_MULTIPLE) /
        AMOUNT_RULES.BAD_PRODUCT_COMPENSATION_BASE,
    );
  }

  return {
    compensation,
    badRate: Math.round(badRate * 100) / 100,
    shouldCompensate,
  };
}

// 计算缺货退款
// 规则：缺货商品全额退款，并从佣金基数中扣除
export function calculateOutOfStockRefund(
  unitPrice: number,
  quantity: number,
): number {
  if (unitPrice <= 0 || quantity <= 0) return 0;
  return unitPrice * quantity;
}

// 计算结算单净额
// 公式：净额 = 佣金 + 称重补差 - 退款 - 赔付 + 佣金调整
export function calculateNetSettlement(params: {
  commissionAmount: number;
  weightAdjustment: number;
  refundAmount: number;
  compensationAmount: number;
  commissionAdjust: number;
}): number {
  return (
    params.commissionAmount +
    params.weightAdjustment -
    params.refundAmount -
    params.compensationAmount +
    params.commissionAdjust
  );
}

// 生成结算明细行
// 每一项都包含：类型、描述、金额、关联单号、计算依据
export interface SettlementDetailLine {
  lineType: 'order' | 'commission' | 'weight' | 'refund' | 'compensation' | 'adjustment' | 'summary';
  description: string;
  amount: number;
  relatedOrderNo?: string;
  relatedBatchNo?: string;
  calculationFormula: string;
  calculationDetail: string;
}

// 生成订单佣金明细行
export function generateOrderCommissionLine(params: {
  orderNo: string;
  orderAmount: number;
  commissionBase: number;
  commissionRate: number;
  commissionAmount: number;
}): SettlementDetailLine {
  const ratePercent = (params.commissionRate / AMOUNT_RULES.COMMISSION_RATE_BASE) * 100;
  return {
    lineType: 'commission',
    description: `订单 ${params.orderNo} 佣金`,
    amount: params.commissionAmount,
    relatedOrderNo: params.orderNo,
    calculationFormula: '佣金基数 × 佣金比例',
    calculationDetail: `${params.commissionBase}分 × ${ratePercent}% = ${params.commissionAmount}分`,
  };
}

// 生成称重补差明细行
export function generateWeightAdjustmentLine(params: {
  orderNo: string;
  estimatedAmount: number;
  actualAmount: number;
  diff: number;
  diffRate: number;
}): SettlementDetailLine {
  const direction = params.diff < 0 ? '少退' : '多补';
  return {
    lineType: 'weight',
    description: `订单 ${params.orderNo} 称重${direction}`,
    amount: params.diff,
    relatedOrderNo: params.orderNo,
    calculationFormula: '实际金额 - 预估金额',
    calculationDetail: `${params.actualAmount}分 - ${params.estimatedAmount}分 = ${params.diff}分 (差异率${params.diffRate}‰)`,
  };
}

// 生成退款明细行
export function generateRefundLine(params: {
  orderNo: string;
  afterSaleNo: string;
  reason: string;
  amount: number;
}): SettlementDetailLine {
  return {
    lineType: 'refund',
    description: `订单 ${params.orderNo} ${params.reason}`,
    amount: -params.amount,
    relatedOrderNo: params.orderNo,
    calculationFormula: '退款金额',
    calculationDetail: `售后单 ${params.afterSaleNo}：${params.reason}，退款 ${params.amount}分`,
  };
}

// 生成赔付明细行
export function generateCompensationLine(params: {
  orderNo: string;
  afterSaleNo: string;
  badRate: number;
  orderAmount: number;
  compensation: number;
}): SettlementDetailLine {
  return {
    lineType: 'compensation',
    description: `订单 ${params.orderNo} 坏果赔付`,
    amount: -params.compensation,
    relatedOrderNo: params.orderNo,
    calculationFormula: '坏果金额 × 120%',
    calculationDetail: `售后单 ${params.afterSaleNo}：坏果率${params.badRate}%，订单金额${params.orderAmount}分，赔付${params.compensation}分`,
  };
}

// 生成佣金调整明细行
export function generateCommissionAdjustmentLine(params: {
  adjustmentNo: string;
  reason: string;
  amount: number;
  operator: string;
}): SettlementDetailLine {
  const direction = params.amount > 0 ? '增加' : '扣减';
  return {
    lineType: 'adjustment',
    description: `佣金${direction}：${params.reason}`,
    amount: params.amount,
    calculationFormula: '人工调整',
    calculationDetail: `补差单 ${params.adjustmentNo}，操作人：${params.operator}，${direction}${Math.abs(params.amount)}分`,
  };
}

// 生成汇总明细行
export function generateSummaryLine(params: {
  orderCount: number;
  orderTotal: number;
  commissionTotal: number;
  weightAdjustment: number;
  refundTotal: number;
  compensationTotal: number;
  commissionAdjust: number;
  netSettlement: number;
}): SettlementDetailLine {
  return {
    lineType: 'summary',
    description: '结算汇总',
    amount: params.netSettlement,
    calculationFormula: '佣金 + 称重补差 - 退款 - 赔付 + 调整',
    calculationDetail:
      `${params.orderCount}笔订单，总额${params.orderTotal}分，` +
      `佣金${params.commissionTotal}分 + 称重补差${params.weightAdjustment}分 ` +
      `- 退款${params.refundTotal}分 - 赔付${params.compensationTotal}分 ` +
      `+ 调整${params.commissionAdjust}分 = ${params.netSettlement}分`,
  };
}

// 金额格式化：分转元，保留2位小数
export function formatAmount(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const absAmount = Math.abs(amount);
  const yuan = Math.floor(absAmount / 100);
  const fen = absAmount % 100;
  return `${sign}${yuan}.${fen.toString().padStart(2, '0')}`;
}

// 金额解析：元转分
export function parseAmount(yuan: string | number): number {
  const num = typeof yuan === 'string' ? parseFloat(yuan) : yuan;
  return Math.round(num * 100);
}
