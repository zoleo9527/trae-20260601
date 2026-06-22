import { Repository, In } from "typeorm";
import { Payment, PaymentMethod, PaymentStatus } from "../entities/Payment";
import { Receivable } from "../entities/Receivable";
import { AppDataSource } from "../data-source";
import { generateOrderNo } from "../utils/dateUtils";
import { ReceivableService } from "./ReceivableService";
import { OutboundOrderService } from "./OutboundOrderService";
import { CustomerService } from "./CustomerService";

export class PaymentService {
  private paymentRepo: Repository<Payment>;
  private receivableRepo: Repository<Receivable>;
  private customerService: CustomerService;
  private receivableService: ReceivableService;
  private outboundOrderService: OutboundOrderService;

  constructor() {
    this.paymentRepo = AppDataSource.getRepository(Payment);
    this.receivableRepo = AppDataSource.getRepository(Receivable);
    this.customerService = new CustomerService();
    this.receivableService = new ReceivableService();
    this.outboundOrderService = new OutboundOrderService();
  }

  async createPayment(data: {
    customerId: number;
    receivableId: number;
    amount: number;
    paymentDate?: Date;
    paymentMethod?: PaymentMethod;
    bankName?: string;
    bankAccountNo?: string;
    chequeNo?: string;
    remark?: string;
  }): Promise<Payment> {
    const receivable = await this.receivableRepo.findOneBy({ id: data.receivableId });
    if (!receivable) {
      throw new Error("应收明细不存在");
    }
    if (receivable.customerId !== data.customerId) {
      throw new Error(`客户ID不匹配：应收明细属于客户ID=${receivable.customerId}，传入的customerId=${data.customerId}，不能跨客户挂账收款`);
    }
    if (receivable.remainingAmount < data.amount) {
      throw new Error(`付款金额(${data.amount})不能超过应收余额(${receivable.remainingAmount})`);
    }

    const count = await this.paymentRepo.count();
    const paymentNo = generateOrderNo("SK", count + 1);

    const payment = this.paymentRepo.create({
      paymentNo,
      customerId: data.customerId,
      receivableId: data.receivableId,
      amount: data.amount,
      paymentDate: data.paymentDate || new Date(),
      paymentMethod: data.paymentMethod || "BANK_TRANSFER",
      bankName: data.bankName,
      bankAccountNo: data.bankAccountNo,
      chequeNo: data.chequeNo,
      remark: data.remark,
      status: "CONFIRMED",
    });

    const savedPayment = await this.paymentRepo.save(payment);

    await this.receivableService.updateReceivableAfterPayment(data.receivableId, data.amount);
    await this.outboundOrderService.updateOrderWarningFlags(receivable.outboundOrderId);

    return savedPayment;
  }

  async getPaymentById(id: number): Promise<Payment | null> {
    return await this.paymentRepo.findOne({
      where: { id },
      relations: ["customer", "receivable"],
    });
  }

  async getPaymentsByCustomer(customerId: number): Promise<Payment[]> {
    return await this.paymentRepo.find({
      where: { customerId },
      relations: ["receivable"],
      order: { paymentDate: "DESC" },
    });
  }

  async getPaymentsByReceivable(receivableId: number): Promise<Payment[]> {
    return await this.paymentRepo.find({
      where: { receivableId },
      order: { paymentDate: "DESC" },
    });
  }

  async getPaymentsByDateRange(startDate: Date, endDate: Date): Promise<Payment[]> {
    return await this.paymentRepo
      .createQueryBuilder("payment")
      .where("payment.paymentDate >= :startDate", { startDate })
      .andWhere("payment.paymentDate <= :endDate", { endDate })
      .andWhere("payment.status != :status", { status: "CANCELLED" })
      .orderBy("payment.paymentDate", "DESC")
      .getMany();
  }

  async getUnreconciledPayments(): Promise<Payment[]> {
    return await this.paymentRepo.find({
      where: { isReconciled: false, status: In(["CONFIRMED"]) },
      relations: ["customer", "receivable"],
      order: { paymentDate: "ASC" },
    });
  }

  async getPaymentsByFilters(options: {
    customerId?: number;
    isReconciled?: boolean;
    status?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Payment[]> {
    const where: any = {};
    if (options.customerId !== undefined) where.customerId = options.customerId;
    if (options.isReconciled !== undefined) where.isReconciled = options.isReconciled;
    if (options.status) where.status = options.status;

    let query = this.paymentRepo.createQueryBuilder("payment").where(where);
    if (options.startDate) {
      query = query.andWhere("payment.paymentDate >= :startDate", { startDate: options.startDate });
    }
    if (options.endDate) {
      query = query.andWhere("payment.paymentDate <= :endDate", { endDate: options.endDate });
    }
    return await query
      .leftJoinAndSelect("payment.customer", "customer")
      .leftJoinAndSelect("payment.receivable", "receivable")
      .orderBy("payment.paymentDate", "DESC")
      .getMany();
  }

  async reconcilePayment(paymentId: number, reconciledBy: string): Promise<Payment | null> {
    const payment = await this.paymentRepo.findOneBy({ id: paymentId });
    if (!payment) return null;
    if (payment.isReconciled) {
      throw new Error("该付款已对账");
    }

    payment.isReconciled = true;
    payment.reconciledAt = new Date();
    payment.reconciledBy = reconciledBy;
    payment.status = "RECONCILED";

    const saved = await this.paymentRepo.save(payment);

    await this.receivableService.reconcileReceivable(
      payment.receivableId,
      payment.amount,
      reconciledBy
    );

    return saved;
  }

  async reconcilePaymentsBatch(paymentIds: number[], reconciledBy: string): Promise<Payment[]> {
    const results: Payment[] = [];
    for (const id of paymentIds) {
      const result = await this.reconcilePayment(id, reconciledBy);
      if (result) results.push(result);
    }
    return results;
  }

  async cancelPayment(id: number): Promise<Payment | null> {
    const payment = await this.paymentRepo.findOneBy({ id });
    if (!payment) return null;
    if (payment.status === "RECONCILED") {
      throw new Error("已对账的付款不能取消");
    }

    payment.status = "CANCELLED";

    const saved = await this.paymentRepo.save(payment);

    const receivable = await this.receivableRepo.findOneBy({ id: payment.receivableId });
    if (receivable) {
      const newReceivedAmount = Number(receivable.receivedAmount) - Number(payment.amount);
      receivable.receivedAmount = Math.max(0, newReceivedAmount);
      receivable.remainingAmount = Number(receivable.totalAmount) - receivable.receivedAmount;

      if (receivable.remainingAmount >= receivable.totalAmount) {
        receivable.status = receivable.isOverdue ? "OVERDUE" : "PENDING";
      } else if (receivable.receivedAmount > 0) {
        receivable.status = "PARTIAL_PAID";
      }

      if (payment.isReconciled) {
        const newReconciledAmount = Number(receivable.reconciledAmount) - Number(payment.amount);
        receivable.reconciledAmount = Math.max(0, newReconciledAmount);
        if (receivable.reconciledAmount <= 0) {
          receivable.reconciliationStatus = "UNRECONCILED";
        } else if (receivable.reconciledAmount >= receivable.totalAmount) {
          receivable.reconciliationStatus = "FULLY_RECONCILED";
        } else {
          receivable.reconciliationStatus = "PARTIAL_RECONCILED";
        }
      }

      await this.receivableRepo.save(receivable);

      await this.customerService.updateCustomerTotals(receivable.customerId);
      await this.customerService.updateCustomerCreditStatus(receivable.customerId);
      await this.outboundOrderService.updateOrderWarningFlags(receivable.outboundOrderId);
    }

    return saved;
  }

  async getPaymentSummary(customerId?: number): Promise<any> {
    let query = this.paymentRepo
      .createQueryBuilder("payment")
      .where("payment.status != :status", { status: "CANCELLED" });

    if (customerId) {
      query = query.andWhere("payment.customerId = :customerId", { customerId });
    }

    const payments = await query.getMany();

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const reconciledAmount = payments
      .filter((p) => p.isReconciled)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const unreconciledAmount = totalAmount - reconciledAmount;

    const byMethod: Record<string, number> = {};
    for (const p of payments) {
      byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + Number(p.amount);
    }

    return {
      totalPayments: payments.length,
      totalAmount,
      reconciledAmount,
      unreconciledAmount,
      byMethod,
    };
  }

  async createMultiplePayments(items: Array<{
    customerId: number;
    receivableId: number;
    amount: number;
    paymentDate?: Date;
    paymentMethod?: PaymentMethod;
  }>): Promise<Payment[]> {
    const results: Payment[] = [];
    for (const item of items) {
      const payment = await this.createPayment(item);
      results.push(payment);
    }
    return results;
  }
}


