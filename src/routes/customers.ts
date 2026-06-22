import { Router, Request, Response } from "express";
import { CustomerService } from "../services/CustomerService";

const router = Router();
const customerService = new CustomerService();

router.get("/", async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const customers = await customerService.getAllCustomers(includeInactive);
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/overdue", async (req: Request, res: Response) => {
  try {
    const customers = await customerService.getCustomersWithOverdue();
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/warnings", async (req: Request, res: Response) => {
  try {
    const customers = await customerService.getCustomersWithCreditWarning();
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const customer = await customerService.getCustomerById(Number(req.params.id));
    if (!customer) {
      return res.status(404).json({ success: false, error: "客户不存在" });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const customer = await customerService.updateCustomer(Number(req.params.id), req.body);
    if (!customer) {
      return res.status(404).json({ success: false, error: "客户不存在" });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.put("/:id/update-credit", async (req: Request, res: Response) => {
  try {
    const customer = await customerService.updateCustomerCreditStatus(Number(req.params.id));
    if (!customer) {
      return res.status(404).json({ success: false, error: "客户不存在" });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.get("/:id/check-credit", async (req: Request, res: Response) => {
  try {
    const customerId = Number(req.params.id);
    const amount = Number(req.query.amount);
    if (isNaN(amount)) {
      return res.status(400).json({ success: false, error: "请提供有效的订单金额" });
    }
    const result = await customerService.checkCreditAvailability(customerId, amount);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const success = await customerService.deactivateCustomer(Number(req.params.id));
    if (!success) {
      return res.status(404).json({ success: false, error: "客户不存在" });
    }
    res.json({ success: true, message: "客户已停用" });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
