import { Repository, In } from "typeorm";
import { OutboundOrder, OutboundOrderStatus, InvoiceStatus } from "../entities/OutboundOrder";
import { Customer } from "../entities/Customer";
import { AppDataSource } from "../data-source";
import { generateOrderNo } from "../utils/dateUtils";
import { CustomerService } from "./CustomerService";
import { ReceivableService } from "./ReceivableService";

export class OutboundOrderService {
  private orderRepo: Repository<OutboundOrder>;
  private customerRepo: Repository<Customer>;
  private customerService: CustomerService;
  private receivableService: ReceivableService;

  constructor() {
    this.orderRepo = AppDataSource.getRepository(OutboundOrder);
    this.customerRepo = AppDataSource.getRepository(Customer);
    this.customerService = new CustomerService();
    this.receivableService = new ReceivableService();
  }

  async createDraftOrder(data: Partial<OutboundOrder>): Promise<OutboundOrder> {
    const count = await this.orderRepo.count();
    const orderNo = generateOrderNo("CK", count + 1);
    const totalAmount = Number(data.weight || 0) * Number(data.unitPrice || 0);

    const order = this.orderRepo.create({
      ...data,
      orderNo,
      totalAmount,
      status: "DRAFT",
      invoiceStatus: "NOT_INVOICED",
    });

    return await this.orderRepo.save(order);
  }

  async salesConfirmOrder(orderId: number, confirmedBy: string): Promise<OutboundOrder | null> {
    const order = await this.orderRepo.findOneBy({ id: orderId });
    if (!order) return null;
    if (order.status !== "DRAFT") {
      throw new Error("只有草稿状态的订单可以进行销售确认");
    }

    const creditCheck = await this.customerService.checkCreditAvailability(order.customerId, order.totalAmount);
    if (!creditCheck.available) {
      throw new Error(creditCheck.reason || "信用检查不通过");
    }

    order.status = "SALES_CONFIRMED";
    order.salesConfirmedBy = confirmedBy;
    order.salesConfirmedAt = new Date();

    return await this.orderRepo.save(order);
  }

  async warehouseOutbound(
    orderId: number,
    operator: string,
    actualWeight?: number,
    vehicleNo?: string,
    driverName?: string
  ): Promise<OutboundOrder | null> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ["customer"],
    });
    if (!order) return null;
    if (order.status !== "SALES_CONFIRMED") {
      throw new Error("只有销售确认后的订单可以进行仓库出库");
    }

    if (actualWeight !== undefined) {
      order.weight = actualWeight;
      order.totalAmount = Number(actualWeight) * Number(order.unitPrice);
    }

    order.status = "WAREHOUSE_OUTBOUND";
    order.warehouseOperator = operator;
    order.warehouseOutboundAt = new Date();
    if (vehicleNo) order.vehicleNo = vehicleNo;
    if (driverName) order.driverName = driverName;

    const savedOrder = await this.orderRepo.save(order);

    if (order.customer) {
      await this.receivableService.createReceivableFromOutbound(savedOrder, order.customer);
    }

    await this.updateOrderWarningFlags(orderId);

    return savedOrder;
  }

  async completeOrder(orderId: number): Promise<OutboundOrder | null> {
    const order = await this.orderRepo.findOneBy({ id: orderId });
    if (!order) return null;

    order.status = "COMPLETED";
    return await this.orderRepo.save(order);
  }

  async cancelOrder(orderId: number): Promise<OutboundOrder | null> {
    const order = await this.orderRepo.findOneBy({ id: orderId });
    if (!order) return null;
    if (order.status === "WAREHOUSE_OUTBOUND" || order.status === "COMPLETED") {
      throw new Error("已出库或已完成的订单不能取消");
    }

    order.status = "CANCELLED";
    return await this.orderRepo.save(order);
  }

  async getOrderById(id: number): Promise<OutboundOrder | null> {
    return await this.orderRepo.findOne({
      where: { id },
      relations: ["customer", "receivables"],
    });
  }

  async getOrdersByCustomer(customerId: number): Promise<OutboundOrder[]> {
    return await this.orderRepo.find({
      where: { customerId },
      relations: ["receivables"],
      order: { outboundDate: "DESC" },
    });
  }

  async getOrdersByStatus(status: OutboundOrderStatus): Promise<OutboundOrder[]> {
    return await this.orderRepo.find({
      where: { status },
      relations: ["customer"],
      order: { outboundDate: "DESC" },
    });
  }

  async updateOrder(id: number, data: Partial<OutboundOrder>): Promise<OutboundOrder | null> {
    const order = await this.orderRepo.findOneBy({ id });
    if (!order) return null;

    if (data.weight !== undefined || data.unitPrice !== undefined) {
      const weight = data.weight !== undefined ? data.weight : order.weight;
      const unitPrice = data.unitPrice !== undefined ? data.unitPrice : order.unitPrice;
      data.totalAmount = Number(weight) * Number(unitPrice);
    }

    Object.assign(order, data);
    return await this.orderRepo.save(order);
  }

  async updateInvoiceStatus(orderId: number, invoiceStatus: InvoiceStatus, invoicedAmount: number): Promise<OutboundOrder | null> {
    const order = await this.orderRepo.findOneBy({ id: orderId });
    if (!order) return null;

    order.invoiceStatus = invoiceStatus;
    order.invoicedAmount = Number(order.invoicedAmount) + Number(invoicedAmount);

    await this.updateOrderWarningFlags(orderId);

    return await this.orderRepo.save(order);
  }

  async updateOrderWarningFlags(orderId: number): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ["receivables", "customer"],
    });
    if (!order) return;

    const hasPartialPayment = order.receivables.some(
      (r) => r.status === "PARTIAL_PAID"
    );
    const hasOverdueReceivable = order.receivables.some(
      (r) => r.isOverdue && r.remainingAmount > 0
    );
    const notInvoiced = order.invoiceStatus === "NOT_INVOICED" && order.status === "WAREHOUSE_OUTBOUND";

    order.hasPartialPayment = hasPartialPayment;
    order.hasOverdueReceivable = hasOverdueReceivable;
    order.needsWarning = hasPartialPayment || hasOverdueReceivable || notInvoiced;

    await this.orderRepo.save(order);
  }

  async getOrdersWithWarnings(): Promise<OutboundOrder[]> {
    return await this.orderRepo.find({
      where: { needsWarning: true },
      relations: ["customer"],
      order: { outboundDate: "DESC" },
    });
  }

  async getOrdersNotInvoiced(): Promise<OutboundOrder[]> {
    return await this.orderRepo.find({
      where: {
        invoiceStatus: In(["NOT_INVOICED", "PARTIAL_INVOICED"]),
        status: In(["WAREHOUSE_OUTBOUND", "COMPLETED"]),
      },
      relations: ["customer"],
      order: { outboundDate: "ASC" },
    });
  }

  async getOrdersWithPartialPayment(): Promise<OutboundOrder[]> {
    return await this.orderRepo.find({
      where: { hasPartialPayment: true },
      relations: ["customer", "receivables"],
      order: { outboundDate: "DESC" },
    });
  }
}


