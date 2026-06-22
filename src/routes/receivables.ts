import { Router, Request, Response } from "express";
import { ReceivableService } from "../services/ReceivableService";
import { ReceivableStatus } from "../entities/Receivable";

const router = Router();
const receivableService = new ReceivableService();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { customerId, outboundOrderId, status } = req.query;
    let receivables;

    if (customerId) {
      receivables = await receivableService.getReceivablesByCustomer(Number(customerId));
    } else if (outboundOrderId) {
      receivables = await receivableService.getReceivablesByOutboundOrder(Number(outboundOrderId));
    } else if (status) {
      receivables = await receivableService.getReceivablesByStatus(status as ReceivableStatus);
    } else {
      const repo = (receivableService as any).receivableRepo;
      receivables = await repo.find({
        relations: ["customer", "outboundOrder"],
        order: { dueDate: "ASC" },
      });
    }

    res.json({ success: true, data: receivables });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/overdue", async (req: Request, res: Response) => {
  try {
    const receivables = await receivableService.getOverdueReceivables();
    res.json({ success: true, data: receivables });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/aging-report", async (req: Request, res: Response) => {
  try {
    const report = await receivableService.getAgingReport();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const receivable = await receivableService.getReceivableById(Number(req.params.id));
    if (!receivable) {
      return res.status(404).json({ success: false, error: "应收明细不存在" });
    }
    res.json({ success: true, data: receivable });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put("/update-aging", async (req: Request, res: Response) => {
  try {
    await receivableService.updateReceivableAging();
    res.json({ success: true, message: "账龄更新完成" });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.put("/:id/bad-debt", async (req: Request, res: Response) => {
  try {
    const { remark } = req.body;
    const receivable = await receivableService.markAsBadDebt(Number(req.params.id), remark);
    if (!receivable) {
      return res.status(404).json({ success: false, error: "应收明细不存在" });
    }
    res.json({ success: true, data: receivable });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.put("/:id/reconcile", async (req: Request, res: Response) => {
  try {
    const { amount, reconciledBy } = req.body;
    if (!amount || !reconciledBy) {
      return res.status(400).json({ success: false, error: "请提供对账金额和对账人" });
    }
    const receivable = await receivableService.reconcileReceivable(
      Number(req.params.id),
      amount,
      reconciledBy
    );
    if (!receivable) {
      return res.status(404).json({ success: false, error: "应收明细不存在" });
    }
    res.json({ success: true, data: receivable });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

export default router;
