import { Repository, In } from "typeorm";
import { Receivable, ReceivableStatus, ReconciliationStatus } from "../entities/Receivable";
import { OutboundOrder } from "../entities/OutboundOrder";
import { Customer } from "../entities/Customer";
import { AppDataSource } from "../data-source";
import { calculateDueDate, calculateAgeDays, calculateOverdueDays, getAgingBucket, generateOrderNo } from "../utils/dateUtils";
import { CustomerService } from "./CustomerService";

export class ReceivableService {
  private receivableRepo: Repository<Receivable>;
  private customerService: CustomerService;

  constructor() {
    this.receivableRepo = AppDataSource.getRepository(Receivable);
    this.customerService = new CustomerService();
  }

  async createReceivableFromOutbound(order: OutboundOrder, customer: Customer): Promise<Receivable> {
    const count = await this.receivableRepo.count();
    const receivableNo = generateOrderNo("YS", count + 1);
    const dueDate = calculateDueDate(order.outboundDate, customer.paymentTermDays);
    const ageDays = calculateAgeDays(order.outboundDate);
    const overdueDays = calculateOverdueDays(dueDate);
    const agingBucket = getAgingBucket(overdueDays);

    const receivable = this.receivableRepo.create({
      receivableNo,
      customerId: order.customerId,
      outboundOrderId: order.id,
      totalAmount: order.totalAmount,
      receivedAmount: 0,
      remainingAmount: order.totalAmount,
      dueDate,
      ageDays,
      overdueDays,
      agingBucket,
      isOverdue: overdueDays > 0,
      status: overdueDays > 0 ? "OVERDUE" : "PENDING",
      reconciliationStatus: "UNRECONCILED",
      reconciledAmount: 0,
    });

    const saved = await this.receivableRepo.save(receivable);
    await this.customerService.updateCustomerTotals(order.customerId);
    await this.customerService.updateCustomerCreditStatus(order.customerId);

    return saved;
  }

  async getReceivableById(id: number): Promise<Receivable | null> {
    return await this.receivableRepo.findOne({
      where: { id },
      relations: ["customer", "outboundOrder", "payments"],
    });
  }

  async getReceivablesByCustomer(customerId: number): Promise<Receivable[]> {
    return await this.receivableRepo.find({
      where: { customerId },
      relations: ["outboundOrder", "payments"],
      order: { dueDate: "ASC" },
    });
  }

  async getReceivablesByOutboundOrder(outboundOrderId: number): Promise<Receivable[]> {
    return await this.receivableRepo.find({
      where: { outboundOrderId },
      relations: ["customer", "payments"],
    });
  }

  async getOverdueReceivables(): Promise<Receivable[]> {
    return await this.receivableRepo.find({
      where: { isOverdue: true },
      relations: ["customer", "outboundOrder"],
      order: { overdueDays: "DESC" },
    });
  }

  async getReceivablesByStatus(status: ReceivableStatus): Promise<Receivable[]> {
    return await this.receivableRepo.find({
      where: { status },
      relations: ["customer", "outboundOrder"],
      order: { dueDate: "ASC" },
    });
  }

  async getReceivablesByFilters(options: {
    customerId?: number;
    reconciliationStatus?: ReconciliationStatus;
    status?: ReceivableStatus;
  }): Promise<Receivable[]> {
    const where: any = {};
    if (options.customerId !== undefined) where.customerId = options.customerId;
    if (options.reconciliationStatus) where.reconciliationStatus = options.reconciliationStatus;
    if (options.status) where.status = options.status;
    return await this.receivableRepo.find({
      where,
      relations: ["customer", "outboundOrder", "payments"],
      order: { dueDate: "ASC" },
    });
  }

  async updateReceivableAging(): Promise<void> {
    const receivables = await this.receivableRepo.find({
      where: { status: In(["PENDING", "PARTIAL_PAID", "OVERDUE"]) },
    });

    for (const receivable of receivables) {
      const ageDays = calculateAgeDays(receivable.createdAt);
      const overdueDays = calculateOverdueDays(receivable.dueDate);
      const agingBucket = getAgingBucket(overdueDays);

      receivable.ageDays = ageDays;
      receivable.overdueDays = overdueDays;
      receivable.agingBucket = agingBucket;
      receivable.isOverdue = overdueDays > 0;

      if (overdueDays > 0 && receivable.status !== "PARTIAL_PAID") {
        receivable.status = "OVERDUE";
      }

      await this.receivableRepo.save(receivable);
    }
  }

  async updateReceivableAfterPayment(receivableId: number, paymentAmount: number): Promise<Receivable | null> {
    const receivable = await this.receivableRepo.findOneBy({ id: receivableId });
    if (!receivable) return null;

    const newReceivedAmount = Number(receivable.receivedAmount) + Number(paymentAmount);
    const remainingAmount = Number(receivable.totalAmount) - newReceivedAmount;

    receivable.receivedAmount = newReceivedAmount;
    receivable.remainingAmount = remainingAmount;

    if (remainingAmount <= 0.01) {
      receivable.status = "FULLY_PAID";
      receivable.remainingAmount = 0;
    } else if (newReceivedAmount > 0) {
      receivable.status = "PARTIAL_PAID";
    }

    if (receivable.reconciledAmount >= receivable.totalAmount) {
      receivable.reconciliationStatus = "FULLY_RECONCILED";
    } else if (receivable.reconciledAmount > 0) {
      receivable.reconciliationStatus = "PARTIAL_RECONCILED";
    }

    const saved = await this.receivableRepo.save(receivable);

    await this.customerService.updateCustomerTotals(receivable.customerId);
    await this.customerService.updateCustomerCreditStatus(receivable.customerId);

    return saved;
  }

  async getAgingReport(): Promise<any[]> {
    const receivables = await this.receivableRepo.find({
      where: { status: In(["PENDING", "PARTIAL_PAID", "OVERDUE"]) },
      relations: ["customer"],
    });

    const customerGroups: Record<number, any> = {};

    for (const r of receivables) {
      if (!customerGroups[r.customerId]) {
        customerGroups[r.customerId] = {
          customerId: r.customerId,
          customerName: r.customer?.customerName,
          customerCode: r.customer?.customerCode,
          totalRemaining: 0,
          current: 0,
          "1-30天": 0,
          "31-60天": 0,
          "61-90天": 0,
          "91-180天": 0,
          "180天以上": 0,
        };
      }

      const group = customerGroups[r.customerId];
      group.totalRemaining += Number(r.remainingAmount);

      const bucket = r.overdueDays <= 0 ? "CURRENT" : r.agingBucket || "CURRENT";
      if (bucket === "CURRENT") {
        group.current += Number(r.remainingAmount);
      } else {
        group[bucket] = (group[bucket] || 0) + Number(r.remainingAmount);
      }
    }

    return Object.values(customerGroups);
  }

  async getReconciliationSummaryByCustomer(customerId?: number): Promise<any[]> {
    const where: any = {};
    if (customerId !== undefined) where.customerId = customerId;

    const receivables = await this.receivableRepo.find({
      where,
      relations: ["customer"],
    });

    const payments = await this.receivableRepo.manager.query(
      `SELECT
        p.customerId,
        SUM(CASE WHEN p.isReconciled = 0 THEN p.amount ELSE 0 END) as unreconciledPaymentAmount,
        SUM(CASE WHEN p.isReconciled = 1 THEN p.amount ELSE 0 END) as reconciledPaymentAmount,
        COUNT(CASE WHEN p.isReconciled = 0 THEN 1 END) as unreconciledPaymentCount,
        COUNT(CASE WHEN p.isReconciled = 1 THEN 1 END) as reconciledPaymentCount
       FROM payment p
       WHERE p.status != 'CANCELLED'
       ${customerId !== undefined ? `AND p.customerId = ${customerId}` : ""}
       GROUP BY p.customerId`
    );

    const paymentMap: Record<number, any> = {};
    for (const p of payments) {
      paymentMap[p.customerId] = p;
    }

    const customerGroups: Record<number, any> = {};

    for (const r of receivables) {
      if (!customerGroups[r.customerId]) {
        const pm = paymentMap[r.customerId] || {};
        customerGroups[r.customerId] = {
          customerId: r.customerId,
          customerName: r.customer?.customerName,
          customerCode: r.customer?.customerCode,
          contactPerson: r.customer?.contactPerson,
          contactPhone: r.customer?.contactPhone,
          receivable: {
            unreconciled: { count: 0, amount: 0 },
            partial: { count: 0, amount: 0 },
            fully: { count: 0, amount: 0 },
            total: { count: 0, amount: 0 },
          },
          payment: {
            unreconciled: {
              count: Number(pm.unreconciledPaymentCount || 0),
              amount: Number(pm.unreconciledPaymentAmount || 0),
            },
            reconciled: {
              count: Number(pm.reconciledPaymentCount || 0),
              amount: Number(pm.reconciledPaymentAmount || 0),
            },
            total: {
              count: Number((pm.unreconciledPaymentCount || 0) + (pm.reconciledPaymentCount || 0)),
              amount: Number((pm.unreconciledPaymentAmount || 0) + (pm.reconciledPaymentAmount || 0)),
            },
          },
        };
      }

      const group = customerGroups[r.customerId];
      group.receivable.total.count += 1;
      group.receivable.total.amount += Number(r.totalAmount);

      if (r.reconciliationStatus === "UNRECONCILED") {
        group.receivable.unreconciled.count += 1;
        group.receivable.unreconciled.amount += Number(r.totalAmount);
      } else if (r.reconciliationStatus === "PARTIAL_RECONCILED") {
        group.receivable.partial.count += 1;
        group.receivable.partial.amount += Number(r.reconciledAmount);
      } else if (r.reconciliationStatus === "FULLY_RECONCILED") {
        group.receivable.fully.count += 1;
        group.receivable.fully.amount += Number(r.totalAmount);
      }
    }

    for (const cid of Object.keys(paymentMap)) {
      if (!customerGroups[Number(cid)]) {
        const pm = paymentMap[Number(cid)];
        customerGroups[Number(cid)] = {
          customerId: Number(cid),
          customerName: null,
          customerCode: null,
          contactPerson: null,
          contactPhone: null,
          receivable: {
            unreconciled: { count: 0, amount: 0 },
            partial: { count: 0, amount: 0 },
            fully: { count: 0, amount: 0 },
            total: { count: 0, amount: 0 },
          },
          payment: {
            unreconciled: {
              count: Number(pm.unreconciledPaymentCount || 0),
              amount: Number(pm.unreconciledPaymentAmount || 0),
            },
            reconciled: {
              count: Number(pm.reconciledPaymentCount || 0),
              amount: Number(pm.reconciledPaymentAmount || 0),
            },
            total: {
              count: Number((pm.unreconciledPaymentCount || 0) + (pm.reconciledPaymentCount || 0)),
              amount: Number((pm.unreconciledPaymentAmount || 0) + (pm.reconciledPaymentAmount || 0)),
            },
          },
        };
      }
    }

    const result = Object.values(customerGroups).sort((a, b) => {
      const aPending = a.receivable.unreconciled.amount + a.receivable.partial.amount + a.payment.unreconciled.amount;
      const bPending = b.receivable.unreconciled.amount + b.receivable.partial.amount + b.payment.unreconciled.amount;
      return bPending - aPending;
    });

    return result;
  }

  async markAsBadDebt(id: number, remark?: string): Promise<Receivable | null> {
    const receivable = await this.receivableRepo.findOneBy({ id });
    if (!receivable) return null;

    receivable.status = "BAD_DEBT";
    if (remark) receivable.remark = remark;

    const saved = await this.receivableRepo.save(receivable);
    await this.customerService.updateCustomerCreditStatus(receivable.customerId);

    return saved;
  }

  async reconcileReceivable(id: number, amount: number, reconciledBy: string): Promise<Receivable | null> {
    const receivable = await this.receivableRepo.findOneBy({ id });
    if (!receivable) return null;

    receivable.reconciledAmount = Number(receivable.reconciledAmount) + Number(amount);

    if (receivable.reconciledAmount >= receivable.totalAmount) {
      receivable.reconciliationStatus = "FULLY_RECONCILED";
    } else if (receivable.reconciledAmount > 0) {
      receivable.reconciliationStatus = "PARTIAL_RECONCILED";
    }

    return await this.receivableRepo.save(receivable);
  }
}


