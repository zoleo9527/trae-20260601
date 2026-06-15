import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { requireRole } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { Role, WorkOrderStatus } from "~/utils/constants";
import { generateOrderNo } from "~/utils/misc";
import { Button, Card, Input, Label, Textarea } from "~/components/ui";
import { z } from "zod";

export const meta: MetaFunction = () => [
  { title: "新建工单 - 手机维修店管理系统" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireRole(request, [Role.RECEPTIONIST, Role.MANAGER]);
  return json({});
};

const NewOrderSchema = z.object({
  customerName: z.string().min(1, "客户姓名必填"),
  customerPhone: z.string().min(1, "联系电话必填"),
  deviceBrand: z.string().min(1, "品牌必填"),
  deviceModel: z.string().min(1, "型号必填"),
  deviceImei: z.string().optional(),
  deviceColor: z.string().optional(),
  faultDescription: z.string().min(1, "故障描述必填"),
  appearanceNotes: z.string().optional(),
  accessoryItems: z.string().optional(),
});

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireRole(request, [Role.RECEPTIONIST, Role.MANAGER]);
  const form = await request.formData();
  const validated = NewOrderSchema.safeParse({
    customerName: form.get("customerName"),
    customerPhone: form.get("customerPhone"),
    deviceBrand: form.get("deviceBrand"),
    deviceModel: form.get("deviceModel"),
    deviceImei: form.get("deviceImei") || undefined,
    deviceColor: form.get("deviceColor") || undefined,
    faultDescription: form.get("faultDescription"),
    appearanceNotes: form.get("appearanceNotes") || undefined,
    accessoryItems: form.get("accessoryItems") || undefined,
  });

  if (!validated.success) {
    return json(
      { errors: validated.error.flatten().fieldErrors, ok: false },
      { status: 400 }
    );
  }

  const order = await prisma.workOrder.create({
    data: {
      ...validated.data,
      orderNo: generateOrderNo(),
      status: WorkOrderStatus.PENDING_INSPECTION,
      receivedById: user.id,
      timelineEvents: {
        create: {
          fromStatus: null,
          toStatus: WorkOrderStatus.PENDING_INSPECTION,
          eventType: "CREATED",
          description: "前台创建接机工单，等待分配维修师检测。",
          responsibleId: user.id,
        },
      },
    },
  });

  return redirect(`/orders/${order.id}`);
};

export default function NewOrderPage() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">新建接机工单</h1>
        <p className="text-sm text-slate-500 mt-1">
          前台录入客户和设备信息后，工单状态为「待分配检测」，需分配维修师后进入检测流程
        </p>
      </div>

      <Form method="post">
        <div className="grid gap-5 md:grid-cols-2">
          <Card title="客户信息">
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName" required>客户姓名</Label>
                <Input id="customerName" name="customerName" placeholder="请输入客户姓名" />
                {actionData?.errors?.customerName && (
                  <p className="mt-1 text-xs text-red-600">{actionData.errors.customerName[0]}</p>
                )}
              </div>
              <div>
                <Label htmlFor="customerPhone" required>联系电话</Label>
                <Input id="customerPhone" name="customerPhone" placeholder="请输入手机号" />
                {actionData?.errors?.customerPhone && (
                  <p className="mt-1 text-xs text-red-600">{actionData.errors.customerPhone[0]}</p>
                )}
              </div>
            </div>
          </Card>

          <Card title="设备信息">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="deviceBrand" required>品牌</Label>
                  <Input id="deviceBrand" name="deviceBrand" placeholder="苹果/华为/小米..." />
                </div>
                <div>
                  <Label htmlFor="deviceModel" required>型号</Label>
                  <Input id="deviceModel" name="deviceModel" placeholder="iPhone 14 Pro..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="deviceColor">颜色</Label>
                  <Input id="deviceColor" name="deviceColor" placeholder="深空黑..." />
                </div>
                <div>
                  <Label htmlFor="deviceImei">IMEI/序列号</Label>
                  <Input id="deviceImei" name="deviceImei" placeholder="可选" />
                </div>
              </div>
            </div>
          </Card>

          <Card title="故障与外观" className="md:col-span-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="faultDescription" required>故障描述</Label>
                <Textarea
                  id="faultDescription"
                  name="faultDescription"
                  rows={3}
                  placeholder="详细描述客户反映的故障现象..."
                />
                {actionData?.errors?.faultDescription && (
                  <p className="mt-1 text-xs text-red-600">{actionData.errors.faultDescription[0]}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="appearanceNotes">外观备注</Label>
                  <Textarea
                    id="appearanceNotes"
                    name="appearanceNotes"
                    rows={2}
                    placeholder="划痕、磕碰、进水痕迹等外观情况..."
                  />
                </div>
                <div>
                  <Label htmlFor="accessoryItems">附件清单</Label>
                  <Textarea
                    id="accessoryItems"
                    name="accessoryItems"
                    rows={2}
                    placeholder="充电器、手机盒、SIM卡针等..."
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-3 mt-5">
          <Button type="submit" size="lg">
            创建工单并分配
          </Button>
        </div>
      </Form>
    </div>
  );
}
