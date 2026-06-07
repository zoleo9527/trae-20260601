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
  const { availableHandTags, availableLockers, technicians, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const isReceptionist = user.role === "RECEPTIONIST";
  const isSupervisor = user.role === "FLOOR_SUPERVISOR";
  const isAdmin = user.role === "ADMIN";

  const [selectedHandTag, setSelectedHandTag] = useState("");
  const [selectedLocker, setSelectedLocker] = useState("");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isReceptionist ? "前台开台登记" : isSupervisor ? "主管代开台" : "新开台登记"}
            </h1>
            <p className="text-gray-500 mt-1">
              {isReceptionist && "请仔细核对客户信息，准确分配手牌、储物柜并收取押金"}
              {isSupervisor && "前台忙碌时代为开台，确保信息完整后转交前台跟进"}
              {isAdmin && "系统管理员开台，请注意记录操作原因"}
            </p>
          </div>
        </div>
      </div>

      {isReceptionist && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium">前台职责说明</p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-blue-700">
                <li>核对客户有效身份证件，如实登记姓名和联系方式</li>
                <li>确保手牌和储物柜编号准确，避免重复分配</li>
                <li>押金收取后当面点清，选择正确的支付方式</li>
                <li>特殊需求或备注信息务必详细记录</li>
                <li>开台完成后引导客户入场，通知楼层主管</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {isSupervisor && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div className="text-sm text-purple-800">
              <p className="font-medium">主管代开台职责说明</p>
              <ul className="mt-2 space-y-1 list-disc list-inside text-purple-700">
                <li>前台忙碌时协助开台，确保信息录入完整准确</li>
                <li>开台后及时通知对应前台跟进后续服务</li>
                <li>关注高价值客户和VIP订单，优先安排资源</li>
                <li>如涉及技师排班，请确认无冲突后再提交</li>
                <li>异常情况请在备注中说明，便于后续跟进</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-sm text-gray-800">
              <p className="font-medium">管理员模式</p>
              <p className="mt-1 text-gray-600">系统管理员开台，所有操作将被记录审计日志。非必要情况下请让前台或主管执行开台操作。</p>
            </div>
          </div>
        </div>
      )}

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
