import { Repository, In } from "typeorm";
import { Customer, PaymentTermType, CustomerCreditStatus } from "../entities/Customer";
import { AppDataSource } from "../data-source";
import { Receivable } from "../entities/Receivable";

export class CustomerService {
  private customerRepo: Repository<Customer>;
  private receivableRepo: Repository<Receivable>;

  constructor() {
    this.customerRepo = AppDataSource.getRepository(Customer);
    this.receivableRepo = AppDataSource.getRepository(Receivable);
  }

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const paymentTermDays = this.getPaymentTermDays(data.paymentTermType || "CASH");
    const customer = this.customerRepo.create({
      ...data,
      paymentTermDays,
    });
    return await this.customerRepo.save(customer);
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    return await this.customerRepo.findOne({
      where: { id },
      relations: ["outboundOrders", "receivables"],
    });
  }

  async getAllCustomers(includeInactive: boolean = false): Promise<Customer[]> {
    const where: any = { isActive: true };
    if (includeInactive) delete where.isActive;
    return await this.customerRepo.find({
      where,
      order: { createdAt: "DESC" },
    });
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer | null> {
    const customer = await this.customerRepo.findOneBy({ id });
    if (!customer) return null;

    if (data.paymentTermType) {
      data.paymentTermDays = this.getPaymentTermDays(data.paymentTermType);
    }

    Object.assign(customer, data);
    return await this.customerRepo.save(customer);
  }

  async updateCustomerCreditStatus(customerId: number): Promise<Customer | null> {
    const customer = await this.customerRepo.findOneBy({ id: customerId });
    if (!customer) return null;

    const overdueReceivables = await this.receivableRepo.find({
      where: { customerId, isOverdue: true, status: In(["PENDING", "PARTIAL_PAID", "OVERDUE"]) },
    });

    const overdueAmount = overdueReceivables.reduce((sum, r) => sum + Number(r.remainingAmount), 0);
    const maxOverdueDays = overdueReceivables.length > 0
      ? Math.max(...overdueReceivables.map(r => r.overdueDays))
      : 0;

    customer.overdueAmount = overdueAmount;
    customer.hasOverdue = overdueAmount > 0;
    customer.overdueDays = maxOverdueDays;

    if (overdueAmount > 0) {
      if (maxOverdueDays > 90 || overdueAmount > customer.creditLimit * 0.5) {
        customer.creditStatus = "FROZEN";
      } else if (maxOverdueDays > 30) {
        customer.creditStatus = "OVERDUE";
      } else {
        customer.creditStatus = "WARNING";
      }
    } else {
      customer.creditStatus = "NORMAL";
    }

    return await this.customerRepo.save(customer);
  }

  async updateCustomerTotals(customerId: number): Promise<Customer | null> {
    const customer = await this.customerRepo.findOneBy({ id: customerId });
    if (!customer) return null;

    const receivables = await this.receivableRepo.find({
      where: { customerId },
    });

    customer.totalReceivableAmount = receivables.reduce((sum, r) => sum + Number(r.totalAmount), 0);
    customer.totalReceivedAmount = receivables.reduce((sum, r) => sum + Number(r.receivedAmount), 0);

    return await this.customerRepo.save(customer);
  }

  async getCustomersWithOverdue(): Promise<Customer[]> {
    return await this.customerRepo.find({
      where: { hasOverdue: true },
      order: { overdueDays: "DESC" },
    });
  }

  async getCustomersWithCreditWarning(): Promise<Customer[]> {
    return await this.customerRepo
      .createQueryBuilder("customer")
      .where("customer.creditStatus IN (:...statuses)", { statuses: ["WARNING", "OVERDUE", "FROZEN"] })
      .andWhere("customer.isActive = :active", { active: true })
      .orderBy("customer.creditStatus", "DESC")
      .addOrderBy("customer.overdueAmount", "DESC")
      .getMany();
  }

  async deactivateCustomer(id: number): Promise<boolean> {
    const result = await this.customerRepo.update(id, { isActive: false });
    return result.affected !== undefined && result.affected > 0;
  }

  private getPaymentTermDays(type: PaymentTermType): number {
    const mapping: Record<PaymentTermType, number> = {
      CASH: 0,
      MONTHLY_15: 15,
      MONTHLY_30: 30,
      MONTHLY_45: 45,
      MONTHLY_60: 60,
    };
    return mapping[type] || 0;
  }

  async checkCreditAvailability(customerId: number, newOrderAmount: number): Promise<{ available: boolean; reason?: string }> {
    const customer = await this.customerRepo.findOneBy({ id: customerId });
    if (!customer) return { available: false, reason: "客户不存在" };
    if (!customer.isActive) return { available: false, reason: "客户已停用" };
    if (customer.creditStatus === "FROZEN") return { available: false, reason: "客户信用已冻结" };

    if (customer.paymentTermType === "CASH") {
      return { available: true, reason: "现结客户，无需信用检查" };
    }

    const totalOutstanding = customer.totalReceivableAmount - customer.totalReceivedAmount;
    const availableCredit = customer.creditLimit - totalOutstanding;

    if (newOrderAmount > availableCredit) {
      return {
        available: false,
        reason: `超出信用额度，可用额度：${availableCredit.toFixed(2)}，订单金额：${newOrderAmount.toFixed(2)}`,
      };
    }

    if (customer.hasOverdue) {
      return {
        available: false,
        reason: `客户存在逾期账款，逾期金额：${customer.overdueAmount.toFixed(2)}，逾期天数：${customer.overdueDays}天`,
      };
    }

    return { available: true };
  }
}


