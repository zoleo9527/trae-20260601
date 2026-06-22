import { Router, Request, Response } from "express";
import { OutboundOrderService } from "../services/OutboundOrderService";
import { InvoiceStatus } from "../entities/OutboundOrder";

const router = Router();
const orderService = new OutboundOrderService();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, customerId } = req.query;
    let orders;

    if (status) {
      orders = await orderService.getOrdersByStatus(status as any);
    } else if (customerId) {
      orders = await orderService.getOrdersByCustomer(Number(customerId));
    } else {
      const orderRepo = (orderService as any).orderRepo;
      orders = await orderRepo.find({
        relations: ["customer"],
        order: { outboundDate: "DESC" },
      });
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/warnings", async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getOrdersWithWarnings();
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

router.get("/partial-payment", async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getOrdersWithPartialPayment();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const order = await orderService.getOrderById(Number(req.params.id));
    if (!order) {
      return res.status(404).json({ success: false, error: "出库单不存在" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const order = await orderService.createDraftOrder(req.body);
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.put("/:id/sales-confirm", async (req: Request, res: Response) => {
  try {
    const { confirmedBy } = req.body;
    if (!confirmedBy) {
      return res.status(400).json({ success: false, error: "请提供确认人" });
    }
    const order = await orderService.salesConfirmOrder(Number(req.params.id), confirmedBy);
    if (!order) {
      return res.status(404).json({ success: false, error: "出库单不存在" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.put("/:id/warehouse-outbound", async (req: Request, res: Response) => {
  try {
    const { operator, actualWeight, vehicleNo, driverName } = req.body;
    if (!operator) {
      return res.status(400).json({ success: false, error: "请提供仓库操作员" });
    }
    const order = await orderService.warehouseOutbound(
      Number(req.params.id),
      operator,
      actualWeight,
      vehicleNo,
      driverName
    );
    if (!order) {
      return res.status(404).json({ success: false, error: "出库单不存在" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.put("/:id/complete", async (req: Request, res: Response) => {
  try {
    const order = await orderService.completeOrder(Number(req.params.id));
    if (!order) {
      return res.status(404).json({ success: false, error: "出库单不存在" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.put("/:id/cancel", async (req: Request, res: Response) => {
  try {
    const order = await orderService.cancelOrder(Number(req.params.id));
    if (!order) {
      return res.status(404).json({ success: false, error: "出库单不存在" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const order = await orderService.updateOrder(Number(req.params.id), req.body);
    if (!order) {
      return res.status(404).json({ success: false, error: "出库单不存在" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.put("/:id/invoice", async (req: Request, res: Response) => {
  try {
    const { invoiceStatus, invoicedAmount } = req.body;
    if (!invoiceStatus || invoicedAmount === undefined) {
      return res.status(400).json({ success: false, error: "请提供开票状态和开票金额" });
    }
    const order = await orderService.updateInvoiceStatus(
      Number(req.params.id),
      invoiceStatus as InvoiceStatus,
      invoicedAmount
    );
    if (!order) {
      return res.status(404).json({ success: false, error: "出库单不存在" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

export default router;
