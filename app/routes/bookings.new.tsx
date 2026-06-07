import type { ActionFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { requireUser, requireRole } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { generateBookingNumber, logAction } from "~/utils/booking.server";
import { useState } from "react";
import { z } from "zod";

export const meta: MetaFunction = () => {
  return [{ title: "新开台 - 洗浴中心管理系统" }];
};

const CreateBookingSchema = z.object({
  customerName: z.string().min(1, "请输入客户姓名"),
  customerPhone: z.string().optional(),
  customerIdCard: z.string().optional(),
  serviceType: z.string().min(1, "请选择服务类型"),
  handTagId: z.string().min(1, "请选择手牌"),
  lockerId: z.string().min(1, "请选择储物柜"),
  technicianId: z.string().optional(),
  depositAmount: z.coerce.number().min(0, "押金金额不能为负数"),
  paymentMethod: z.string().min(1, "请选择支付方式"),
  scheduledTime: z.string().min(1, "请选择预约时间"),
  notes: z.string().optional(),
});

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireRole(request, ["RECEPTIONIST", "FLOOR_SUPERVISOR", "ADMIN"], "/");

  const [availableHandTags, availableLockers, technicians] = await Promise.all([
    prisma.handTag.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { tagNumber: "asc" },
    }),
    prisma.locker.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { lockerNumber: "asc" },
    }),
    prisma.technician.findMany({
      where: { status: { in: ["AVAILABLE", "ON_DUTY"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  return json({ availableHandTags, availableLockers, technicians, user });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireRole(request, ["RECEPTIONIST", "ADMIN", "FLOOR_SUPERVISOR"]);
  const formData = await request.formData();

  const result = CreateBookingSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const data = result.data;

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const existingTag = await tx.handTag.findUnique({
        where: { id: data.handTagId },
      });
      if (!existingTag || existingTag.status !== "AVAILABLE") {
        throw new Error("该手牌已被使用，请重新选择");
      }

      const existingLocker = await tx.locker.findUnique({
        where: { id: data.lockerId },
      });
      if (!existingLocker || existingLocker.status !== "AVAILABLE") {
        throw new Error("该储物柜已被使用，请重新选择");
      }

      if (data.technicianId) {
        const conflictBooking = await tx.booking.findFirst({
          where: {
            technicianId: data.technicianId,
            scheduledTime: new Date(data.scheduledTime),
            status: { in: ["CONFIRMED", "CHECKED_IN", "IN_SERVICE"] },
          },
        });
        if (conflictBooking) {
          throw new Error("该技师在此时间段已有排班，请重新选择技师或时间");
        }
      }

      const bookingNumber = await generateBookingNumber(tx);

      const customer = await tx.customer.create({
        data: {
          name: data.customerName,
          phone: data.customerPhone,
          idCard: data.customerIdCard,
        },
      });

      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          customerId: customer.id,
          handTagId: data.handTagId,
          lockerId: data.lockerId,
          technicianId: data.technicianId || null,
          serviceType: data.serviceType,
          scheduledTime: new Date(data.scheduledTime),
          depositAmount: data.depositAmount,
          notes: data.notes,
          createdById: user.id,
          status: "CONFIRMED",
        },
      });

      await tx.handTag.update({
        where: { id: data.handTagId },
        data: { status: "IN_USE" },
      });

      await tx.locker.update({
        where: { id: data.lockerId },
        data: { status: "OCCUPIED" },
      });

      if (data.depositAmount > 0) {
        await tx.deposit.create({
          data: {
            bookingId: booking.id,
            amount: data.depositAmount,
            paymentMethod: data.paymentMethod,
            receivedById: user.id,
          },
        });
      }

      await logAction(
        booking.id,
        user.id,
        "CREATE",
        `创建订单 ${bookingNumber}，客户：${data.customerName}`,
        null,
        { bookingNumber, ...data },
        tx
      );

      return booking;
    });

    return redirect(`/bookings/${booking.id}`);
  } catch (error: any) {
    return json({ errors: { _form: error.message } }, { status: 400 });
  }
};

const serviceTypes = [
  "标准洗浴",
  "豪华洗浴",
  "足疗按摩",
  "SPA养生",
  "推拿理疗",
  "贵宾套餐",
];

const paymentMethods = [
  { value: "CASH", label: "现金" },
  { value: "WECHAT", label: "微信支付" },
  { value: "ALIPAY", label: "支付宝" },
  { value: "CARD", label: "刷卡" },
];

export default function NewBooking() {
  const { availableHandTags, availableLockers, technicians } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [selectedHandTag, setSelectedHandTag] = useState("");
  const [selectedLocker, setSelectedLocker] = useState("");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">新开台登记</h1>
        <p className="text-gray-500 mt-1">请填写客户信息并分配手牌、储物柜和技师</p>
      </div>

      <Form method="post" className="space-y-8">
        {actionData?.errors?._form && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.errors._form}
          </div>
        )}

        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">客户信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                className="input"
                placeholder="请输入客户姓名"
              />
              {actionData?.errors?.customerName && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.customerName[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系电话
              </label>
              <input
                type="tel"
                name="customerPhone"
                className="input"
                placeholder="请输入联系电话"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                身份证号
              </label>
              <input
                type="text"
                name="customerIdCard"
                className="input"
                placeholder="请输入身份证号"
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">服务信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                服务类型 <span className="text-red-500">*</span>
              </label>
              <select name="serviceType" className="input">
                <option value="">请选择服务类型</option>
                {serviceTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {actionData?.errors?.serviceType && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.serviceType[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                预约时间 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="scheduledTime"
                className="input"
                defaultValue={new Date().toISOString().slice(0, 16)}
              />
              {actionData?.errors?.scheduledTime && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.scheduledTime[0]}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">资源分配</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                手牌 <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">
                  可用: {availableHandTags.length}个
                </span>
              </label>
              <select
                name="handTagId"
                className="input"
                value={selectedHandTag}
                onChange={(e) => setSelectedHandTag(e.target.value)}
              >
                <option value="">请选择手牌</option>
                {availableHandTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.tagNumber}
                  </option>
                ))}
              </select>
              {actionData?.errors?.handTagId && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.handTagId[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                储物柜 <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">
                  可用: {availableLockers.length}个
                </span>
              </label>
              <select
                name="lockerId"
                className="input"
                value={selectedLocker}
                onChange={(e) => setSelectedLocker(e.target.value)}
              >
                <option value="">请选择储物柜</option>
                {availableLockers.map((locker) => (
                  <option key={locker.id} value={locker.id}>
                    {locker.lockerNumber} ({locker.area})
                  </option>
                ))}
              </select>
              {actionData?.errors?.lockerId && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.lockerId[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                技师
              </label>
              <select name="technicianId" className="input">
                <option value="">暂不分配</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} - {tech.skills.join("/")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">押金信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                押金金额 (元)
              </label>
              <input
                type="number"
                name="depositAmount"
                className="input"
                defaultValue="200"
                min="0"
                step="10"
              />
              {actionData?.errors?.depositAmount && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.depositAmount[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                支付方式
              </label>
              <select name="paymentMethod" className="input">
                <option value="">请选择支付方式</option>
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              {actionData?.errors?.paymentMethod && (
                <p className="mt-1 text-sm text-red-600">{actionData.errors.paymentMethod[0]}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">备注</h2>
          <textarea
            name="notes"
            rows={3}
            className="input"
            placeholder="请输入备注信息（可选）"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "提交中..." : "确认开台"}
          </button>
        </div>
      </Form>
    </div>
  );
}
