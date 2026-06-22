import "reflect-metadata";
import express, { Request, Response } from "express";
import { AppDataSource } from "./data-source";
import customerRoutes from "./routes/customers";
import outboundOrderRoutes from "./routes/outboundOrders";
import receivableRoutes from "./routes/receivables";
import paymentRoutes from "./routes/payments";
import alertRoutes from "./routes/alerts";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      app: "再生资源销售端-出库收款与客户账期管理系统",
      version: "1.0.0",
    },
  });
});

app.use("/api/customers", customerRoutes);
app.use("/api/outbound-orders", outboundOrderRoutes);
app.use("/api/receivables", receivableRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/alerts", alertRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "API 端点不存在",
    path: req.path,
    method: req.method,
  });
});

AppDataSource.initialize()
  .then(() => {
    console.log("数据库连接成功");
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log("");
      console.log("=== API 端点列表 ===");
      console.log("健康检查: GET /api/health");
      console.log("");
      console.log("客户管理:");
      console.log("  GET    /api/customers");
      console.log("  GET    /api/customers/:id");
      console.log("  POST   /api/customers");
      console.log("  PUT    /api/customers/:id");
      console.log("  GET    /api/customers/overdue");
      console.log("  GET    /api/customers/warnings");
      console.log("  GET    /api/customers/:id/check-credit");
      console.log("");
      console.log("出库单管理:");
      console.log("  GET    /api/outbound-orders");
      console.log("  GET    /api/outbound-orders/:id");
      console.log("  POST   /api/outbound-orders");
      console.log("  PUT    /api/outbound-orders/:id/sales-confirm");
      console.log("  PUT    /api/outbound-orders/:id/warehouse-outbound");
      console.log("  GET    /api/outbound-orders/warnings");
      console.log("  GET    /api/outbound-orders/not-invoiced");
      console.log("  GET    /api/outbound-orders/partial-payment");
      console.log("");
      console.log("应收明细:");
      console.log("  GET    /api/receivables");
      console.log("  GET    /api/receivables/overdue");
      console.log("  GET    /api/receivables/aging-report");
      console.log("  PUT    /api/receivables/update-aging");
      console.log("");
      console.log("收款记录:");
      console.log("  GET    /api/payments");
      console.log("  POST   /api/payments");
      console.log("  GET    /api/payments/unreconciled");
      console.log("  GET    /api/payments/summary");
      console.log("  PUT    /api/payments/:id/reconcile");
      console.log("");
      console.log("预警看板:");
      console.log("  GET    /api/alerts/dashboard");
      console.log("===================");
    });
  })
  .catch((error) => {
    console.error("数据库连接失败:", error);
    process.exit(1);
  });
