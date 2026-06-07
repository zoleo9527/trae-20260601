export interface Member {
  id: string;
  name: string;
  phone: string;
  memberLevel: string;
  balance: number;
  totalRecharge: number;
  totalConsume: number;
  registerDate: string;
  lastConsumeDate: string;
}

export interface ConsumptionItem {
  id: string;
  memberId: string;
  wristbandNo: string;
  itemName: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  consumeTime: string;
  operator: string;
  floor: string;
  payMethod: '储值' | '现金' | '微信' | '支付宝';
}

export interface RefundApplication {
  id: string;
  memberId: string;
  consumeId: string;
  wristbandNo: string;
  itemName: string;
  applyAmount: number;
  applyReason: string;
  applyTime: string;
  applicant: string;
  status: '待处理' | '处理中' | '已批准' | '已拒绝' | '已退回' | '部分退款' | '补偿券替代';
  disputeSupplement?: string;
  disputeOperator?: string;
  disputeTime?: string;
  reviewComment?: string;
  reviewOperator?: string;
  reviewTime?: string;
  finalRefundAmount?: number;
  couponAmount?: number;
}

export interface ProcessingHistory {
  id: string;
  refundId: string;
  operator: string;
  role: string;
  action: string;
  comment: string;
  operateTime: string;
}
