import { Router, Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";
import { PaymentMethod } from "../entities/Payment";

const router = Router();
const paymentService = new PaymentService();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { customerId, receivableId, startDate, endDate } = req.query;
    let payments;

    if (customerId) {
      payments = await paymentService.getPaymentsByCustomer(Number(customerId));
    } else if (receivableId) {
      payments = await paymentService.getPaymentsByReceivable(Number(receivableId));
    } else if (startDate && endDate) {
      payments = await paymentService.getPaymentsByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
    } else {
      const repo = (paymentService as any).paymentRepo;
      payments = await repo.find({
        relations: ["customer", "receivable"],
        order: { paymentDate: "DESC" },
      });
    }

    res.json({ success: true, data: payments });
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

router.get("/summary", async (req: Request, res: Response) => {
  try {
    const { customerId } = req.query;
    const summary = await paymentService.getPaymentSummary(
      customerId ? Number(customerId) : undefined
    );
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const payment = await paymentService.getPaymentById(Number(req.params.id));
    if (!payment) {
      return res.status(404).json({ success: false, error: "收款记录不存在" });
    }
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const payment = await paymentService.createPayment({
      customerId: req.body.customerId,
      receivableId: req.body.receivableId,
      amount: req.body.amount,
      paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : undefined,
      paymentMethod: req.body.paymentMethod as PaymentMethod,
      bankName: req.body.bankName,
      bankAccountNo: req.body.bankAccountNo,
      chequeNo: req.body.chequeNo,
      remark: req.body.remark,
    });
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post("/batch", async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "请提供有效的收款明细列表" });
    }
    const payments = await paymentService.createMultiplePayments(items);
    res.json({ success: true, data: payments, count: payments.length });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.put("/:id/reconcile", async (req: Request, res: Response) => {
  try {
    const { reconciledBy } = req.body;
    if (!reconciledBy) {
      return res.status(400).json({ success: false, error: "请提供对账人" });
    }
    const payment = await paymentService.reconcilePayment(Number(req.params.id), reconciledBy);
    if (!payment) {
      return res.status(404).json({ success: false, error: "收款记录不存在" });
    }
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.put("/reconcile-batch", async (req: Request, res: Response) => {
  try {
    const { paymentIds, reconciledBy } = req.body;
    if (!Array.isArray(paymentIds) || !reconciledBy) {
      return res.status(400).json({ success: false, error: "请提供收款记录ID列表和对账人" });
    }
    const payments = await paymentService.reconcilePaymentsBatch(paymentIds, reconciledBy);
    res.json({ success: true, data: payments, count: payments.length });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const payment = await paymentService.cancelPayment(Number(req.params.id));
    if (!payment) {
      return res.status(404).json({ success: false, error: "收款记录不存在" });
    }
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

export default router;
