import { Router, Request, Response } from "express";
import { CustomerService } from "../services/CustomerService";
import { OutboundOrderService } from "../services/OutboundOrderService";
import { ReceivableService } from "../services/ReceivableService";
import { PaymentService } from "../services/PaymentService";

const router = Router();
const customerService = new CustomerService();
const orderService = new OutboundOrderService();
const receivableService = new ReceivableService();
const paymentService = new PaymentService();

router.get("/dashboard", async (req: Request, res: Response) => {
  try {
    const [
      overdueCustomers,
      warningCustomers,
      overdueReceivables,
      warningOrders,
      notInvoicedOrders,
      partialPaymentOrders,
      unreconciledPayments,
      paymentSummary,
      reconciliationSummary,
    ] = await Promise.all([
      customerService.getCustomersWithOverdue(),
      customerService.getCustomersWithCreditWarning(),
      receivableService.getOverdueReceivables(),
      orderService.getOrdersWithWarnings(),
      orderService.getOrdersNotInvoiced(),
      orderService.getOrdersWithPartialPayment(),
      paymentService.getUnreconciledPayments(),
      paymentService.getPaymentSummary(),
      receivableService.getReconciliationSummaryByCustomer(),
    ]);

    const totalOverdueAmount = overdueReceivables.reduce(
      (sum, r) => sum + Number(r.remainingAmount),
      0
    );

    const agingReport = await receivableService.getAgingReport();

    const unreconciledReceivableCount = reconciliationSummary.reduce(
      (sum: number, c: any) => sum + c.receivable.unreconciled.count,
      0
    );
    const partiallyReconciledReceivableCount = reconciliationSummary.reduce(
      (sum: number, c: any) => sum + c.receivable.partial.count,
      0
    );
    const reconciledReceivableCount = reconciliationSummary.reduce(
      (sum: number, c: any) => sum + c.receivable.reconciled.count,
      0
    );
    const pendingReconcileReceivableAmount = reconciliationSummary.reduce(
      (sum: number, c: any) => sum + c.receivable.pendingReconcileAmount,
      0
    );

    const unreconciledPaymentCount = reconciliationSummary.reduce(
      (sum: number, c: any) => sum + c.payment.unreconciled.count,
      0
    );
    const reconciledPaymentCount = reconciliationSummary.reduce(
      (sum: number, c: any) => sum + c.payment.reconciled.count,
      0
    );
    const unreconciledPaymentAmount = reconciliationSummary.reduce(
      (sum: number, c: any) => sum + c.payment.unreconciled.amount,
      0
    );

    const pendingReconciliationCount =
      unreconciledReceivableCount + partiallyReconciledReceivableCount + unreconciledPaymentCount;
    const pendingReconciliationAmount =
      pendingReconcileReceivableAmount + unreconciledPaymentAmount;

    const customersNeedReconciliation = reconciliationSummary.filter(
      (c: any) =>
        c.receivable.unreconciled.count > 0 ||
        c.receivable.partial.count > 0 ||
        c.payment.unreconciled.count > 0
    ).length;

    res.json({
      success: true,
      data: {
        statistics: {
          overdueCustomerCount: overdueCustomers.length,
          warningCustomerCount: warningCustomers.length,
          overdueReceivableCount: overdueReceivables.length,
          totalOverdueAmount,
          warningOrderCount: warningOrders.length,
          notInvoicedOrderCount: notInvoicedOrders.length,
          partialPaymentOrderCount: partialPaymentOrders.length,
          unreconciledReceivableCount,
          partiallyReconciledReceivableCount,
          reconciledReceivableCount,
          pendingReconcileReceivableAmount,
          unreconciledPaymentCount,
          reconciledPaymentCount,
          unreconciledPaymentAmount,
          pendingReconciliationCount,
          pendingReconciliationAmount,
          customersNeedReconciliation,
        },
        overdueCustomers,
        warningCustomers,
        overdueReceivables,
        warningOrders,
        notInvoicedOrders,
        partialPaymentOrders,
        unreconciledPayments,
        agingReport,
        paymentSummary,
        reconciliationSummary,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/overdue/customers", async (req: Request, res: Response) => {
  try {
    const customers = await customerService.getCustomersWithOverdue();
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/overdue/receivables", async (req: Request, res: Response) => {
  try {
    const receivables = await receivableService.getOverdueReceivables();
    res.json({ success: true, data: receivables });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/partial-payments", async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getOrdersWithPartialPayment();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/not-invoiced", async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getOrdersNotInvoiced();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/unreconciled", async (req: Request, res: Response) => {
  try {
    const payments = await paymentService.getUnreconciledPayments();
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/credit-warnings", async (req: Request, res: Response) => {
  try {
    const customers = await customerService.getCustomersWithCreditWarning();
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
