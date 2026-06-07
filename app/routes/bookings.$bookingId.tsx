import type { ActionFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { requireUser } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { getBookingWithDetails, logAction } from "~/utils/booking.server";
import { statusLabels, depositStatusLabels, roleLabels } from "~/utils/booking";
import { format } from "date-fns";
import { useState } from "react";
import { z } from "zod";

export const meta: MetaFunction = () => {
  return [{ title: "订单详情 - 洗浴中心管理系统" }];
};

const RescheduleSchema = z.object({
  scheduledTime: z.string().min(1, "请选择新的预约时间"),
  reason: z.string().min(1, "请填写改期原因"),
});

const RejectSchema = z.object({
  reason: z.string().min(1, "请填写驳回原因"),
});

const SupplementSchema = z.object({
  notes: z.string().min(1, "请填写补录内容"),
});

const ExceptionSchema = z.object({
  type: z.string().min(1, "请选择异常类型"),
  title: z.string().min(1, "请填写异常标题"),
  description: z.string().min(1, "请填写异常描述"),
});

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireUser(request);
  const bookingId = params.bookingId;

  if (!bookingId) {
    throw redirect("/bookings");
  }

  const booking = await getBookingWithDetails(bookingId);
  if (!booking) {
    throw redirect("/bookings");
  }

  const [availableHandTags, availableLockers, technicians] = await Promise.all([
    prisma.handTag.findMany({
      where: { status: "AVAILABLE" },
    }),
    prisma.locker.findMany({
      where: { status: "AVAILABLE" },
    }),
    prisma.technician.findMany({
      where: { status: { in: ["AVAILABLE", "ON_DUTY"] } },
    }),
  ]);

  return json({ booking, user, availableHandTags, availableLockers, technicians });
};

export const action: ActionFunction = async ({ request, params }) => {
  const user = await requireUser(request);
  const bookingId = params.bookingId!;
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return json({ error: "订单不存在" }, { status: 404 });
  }

  switch (actionType) {
    case "reschedule": {
      const result = RescheduleSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return json({ errors: result.error.flatten().fieldErrors, actionType: "reschedule" }, { status: 400 });
      }

      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          scheduledTime: new Date(result.data.scheduledTime),
          status: "RESCHEDULED",
          notes: booking.notes ? `${booking.notes}\n改期原因：${result.data.reason}` : `改期原因：${result.data.reason}`,
        },
      });

      await logAction(
        bookingId,
        user.id,
        "RESCHEDULE",
        `改期订单，新时间：${result.data.scheduledTime}，原因：${result.data.reason}`,
        { scheduledTime: booking.scheduledTime },
        { scheduledTime: result.data.scheduledTime, reason: result.data.reason }
      );

      return redirect(`/bookings/${bookingId}`);
    }

    case "reject": {
      const result = RejectSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return json({ errors: result.error.flatten().fieldErrors, actionType: "reject" }, { status: 400 });
      }

      if (booking.handTagId) {
        await prisma.handTag.update({
          where: { id: booking.handTagId },
          data: { status: "AVAILABLE" },
        });
      }
      if (booking.lockerId) {
        await prisma.locker.update({
          where: { id: booking.lockerId },
          data: { status: "AVAILABLE" },
        });
      }

      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "REJECTED",
          notes: booking.notes ? `${booking.notes}\n驳回原因：${result.data.reason}` : `驳回原因：${result.data.reason}`,
        },
      });

      await logAction(
        bookingId,
        user.id,
        "REJECT",
        `驳回订单，原因：${result.data.reason}`,
        { status: booking.status },
        { status: "REJECTED", reason: result.data.reason }
      );

      return redirect(`/bookings/${bookingId}`);
    }

    case "supplement": {
      const result = SupplementSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return json({ errors: result.error.flatten().fieldErrors, actionType: "supplement" }, { status: 400 });
      }

      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          notes: booking.notes ? `${booking.notes}\n补录：${result.data.notes}` : `补录：${result.data.notes}`,
        },
      });

      await logAction(
        bookingId,
        user.id,
        "SUPPLEMENT",
        `补录信息：${result.data.notes}`,
        null,
        { notes: result.data.notes }
      );

      return redirect(`/bookings/${bookingId}`);
    }

    case "reportException": {
      const result = ExceptionSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return json({ errors: result.error.flatten().fieldErrors, actionType: "reportException" }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.exception.create({
          data: {
            bookingId,
            type: result.data.type as any,
            title: result.data.title,
            description: result.data.description,
            reportedById: user.id,
            status: "OPEN",
          },
        });

        await tx.booking.update({
          where: { id: bookingId },
          data: { isException: true },
        });
      });

      await logAction(
        bookingId,
        user.id,
        "UPDATE",
        `上报异常：${result.data.title}`,
        null,
        { exceptionType: result.data.type, title: result.data.title }
      );

      return redirect(`/bookings/${bookingId}`);
    }

    case "verifyDeposit": {
      const depositId = formData.get("depositId") as string;
      if (!depositId) {
        return json({ error: "缺少押金ID" }, { status: 400 });
      }

      await prisma.deposit.update({
        where: { id: depositId },
        data: {
          status: "VERIFIED",
          verifiedById: user.id,
          verifiedAt: new Date(),
        },
      });

      await prisma.booking.update({
        where: { id: bookingId },
        data: { depositStatus: "VERIFIED" },
      });

      await logAction(
        bookingId,
        user.id,
        "VERIFY",
        "核验押金通过",
        { depositStatus: "PENDING" },
        { depositStatus: "VERIFIED" }
      );

      return redirect(`/bookings/${bookingId}`);
    }

    case "complete": {
      if (booking.handTagId) {
        await prisma.handTag.update({
          where: { id: booking.handTagId },
          data: { status: "AVAILABLE" },
        });
      }
      if (booking.lockerId) {
        await prisma.locker.update({
          where: { id: booking.lockerId },
          data: { status: "AVAILABLE" },
        });
      }

      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: "COMPLETED",
          checkOutTime: new Date(),
        },
      });

      if (booking.depositStatus === "VERIFIED") {
        await prisma.deposit.updateMany({
          where: { bookingId, status: "VERIFIED" },
          data: { status: "REFUNDED" },
        });
      }

      await logAction(
        bookingId,
        user.id,
        "COMPLETE",
        "订单完成，退还押金",
        { status: booking.status },
        { status: "COMPLETED" }
      );

      return redirect(`/bookings/${bookingId}`);
    }

    default:
      return json({ error: "未知操作" }, { status: 400 });
  }
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    CHECKED_IN: "bg-green-100 text-green-800",
    IN_SERVICE: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
    RESCHEDULED: "bg-orange-100 text-orange-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  
  return (
    <span className={`badge ${colors[status] || "bg-gray-100 text-gray-800"}`}>
      {statusLabels[status as keyof typeof statusLabels] || status}
    </span>
  );
}

function DepositStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    VERIFIED: "bg-green-100 text-green-800",
    REFUNDED: "bg-gray-100 text-gray-800",
    CONFISCATED: "bg-red-100 text-red-800",
  };
  
  return (
    <span className={`badge ${colors[status] || "bg-gray-100 text-gray-800"}`}>
      {depositStatusLabels[status as keyof typeof depositStatusLabels] || status}
    </span>
  );
}

const exceptionTypes = [
  { value: "HANDTAG_LOST", label: "手牌丢失" },
  { value: "SCHEDULE_CONFLICT", label: "排班冲突" },
  { value: "LOCKER_COMPLAINT", label: "储物柜投诉" },
  { value: "DEPOSIT_DISPUTE", label: "押金争议" },
  { value: "OTHER", label: "其他" },
];

export default function BookingDetail() {
  const { booking, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSupplementModal, setShowSupplementModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);

  const canEdit = ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_SERVICE"].includes(booking.status);
  const canVerifyDeposit = user.role === "FINANCE" || user.role === "ADMIN";
  const canComplete = ["CHECKED_IN", "IN_SERVICE"].includes(booking.status);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{booking.bookingNumber}</h1>
            <StatusBadge status={booking.status} />
            {booking.isException && (
              <span className="badge bg-red-100 text-red-800">有异常</span>
            )}
          </div>
          <p className="text-gray-500 mt-1">
            创建于 {format(new Date(booking.createdAt), "yyyy年MM月dd日 HH:mm")}
          </p>
        </div>
        <div className="flex space-x-3">
          {canEdit && (
            <>
              <button
                onClick={() => setShowRescheduleModal(true)}
                className="btn-secondary"
              >
                改期
              </button>
              <button
                onClick={() => setShowSupplementModal(true)}
                className="btn-secondary"
              >
                补录
              </button>
              <button
                onClick={() => setShowExceptionModal(true)}
                className="btn-danger"
              >
                上报异常
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="btn-secondary"
              >
                驳回
              </button>
            </>
          )}
          {canComplete && (
            <Form method="post">
              <input type="hidden" name="actionType" value="complete" />
              <button type="submit" className="btn-success">
                完成订单
              </button>
            </Form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">客户信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">姓名</span>
                <p className="font-medium">{booking.customer.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">电话</span>
                <p className="font-medium">{booking.customer.phone || "未填写"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">身份证号</span>
                <p className="font-medium">{booking.customer.idCard || "未填写"}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">服务信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">服务类型</span>
                <p className="font-medium">{booking.serviceType}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">预约时间</span>
                <p className="font-medium">{format(new Date(booking.scheduledTime), "yyyy-MM-dd HH:mm")}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">手牌</span>
                <p className="font-medium">{booking.handTag?.tagNumber || "未分配"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">储物柜</span>
                <p className="font-medium">
                  {booking.locker ? `${booking.locker.lockerNumber} (${booking.locker.area})` : "未分配"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">技师</span>
                <p className="font-medium">{booking.technician?.name || "未分配"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">消费金额</span>
                <p className="font-medium">¥{Number(booking.amount).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">押金记录</h2>
            {booking.deposits.length === 0 ? (
              <p className="text-gray-500">暂无押金记录</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase">支付方式</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase">收款人</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase">核验人</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {booking.deposits.map((deposit) => (
                      <tr key={deposit.id}>
                        <td className="py-2">¥{Number(deposit.amount).toFixed(2)}</td>
                        <td className="py-2">{deposit.paymentMethod}</td>
                        <td className="py-2"><DepositStatusBadge status={deposit.status} /></td>
                        <td className="py-2 text-sm">
                          {deposit.receivedBy.name}
                          <span className="text-gray-400 ml-1">({roleLabels[deposit.receivedBy.role]})</span>
                        </td>
                        <td className="py-2 text-sm">
                          {deposit.verifiedBy ? (
                            <>
                              {deposit.verifiedBy.name}
                              <span className="text-gray-400 ml-1">({roleLabels[deposit.verifiedBy.role]})</span>
                              <div className="text-xs text-gray-400">
                                {deposit.verifiedAt && format(new Date(deposit.verifiedAt), "MM-dd HH:mm")}
                              </div>
                            </>
                          ) : "未核验"}
                        </td>
                        <td className="py-2">
                          {canVerifyDeposit && deposit.status === "PENDING" && (
                            <Form method="post">
                              <input type="hidden" name="actionType" value="verifyDeposit" />
                              <input type="hidden" name="depositId" value={deposit.id} />
                              <button type="submit" className="text-sm text-primary-600 hover:text-primary-900">
                                核验通过
                              </button>
                            </Form>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">异常记录</h2>
            {booking.exceptions.length === 0 ? (
              <p className="text-gray-500">暂无异常记录</p>
            ) : (
              <div className="space-y-4">
                {booking.exceptions.map((ex) => (
                  <div key={ex.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{ex.title}</h4>
                        <span className="text-xs text-gray-500">
                          {exceptionTypes.find(t => t.value === ex.type)?.label || ex.type}
                        </span>
                      </div>
                      <span className={`badge ${
                        ex.status === "OPEN" ? "bg-red-100 text-red-800" :
                        ex.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {ex.status === "OPEN" ? "待处理" : ex.status === "IN_PROGRESS" ? "处理中" : "已解决"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{ex.description}</p>
                    <div className="mt-2 text-xs text-gray-400">
                      上报人：{ex.reportedBy.name} · {format(new Date(ex.createdAt), "MM-dd HH:mm")}
                    </div>
                    {ex.resolution && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-800">
                        处理结果：{ex.resolution}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {booking.notes && (
            <div className="card p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">备注</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">交接记录</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">创建订单</p>
                  <p className="text-xs text-gray-500">
                    {booking.createdBy.name} ({roleLabels[booking.createdBy.role]})
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(booking.createdAt), "yyyy-MM-dd HH:mm")}
                  </p>
                </div>
              </div>
              {booking.verifiedBy && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">押金核验</p>
                    <p className="text-xs text-gray-500">
                      {booking.verifiedBy.name} ({roleLabels[booking.verifiedBy.role]})
                    </p>
                    <p className="text-xs text-gray-400">
                      {booking.verifiedAt && format(new Date(booking.verifiedAt), "yyyy-MM-dd HH:mm")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">操作日志</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {booking.actionLogs.map((log) => (
                <div key={log.id} className="border-l-2 border-gray-200 pl-3 py-1">
                  <p className="text-sm text-gray-900">{log.description}</p>
                  <div className="text-xs text-gray-400 mt-1">
                    {log.actor.name} · {format(new Date(log.createdAt), "MM-dd HH:mm")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">改期</h3>
            <Form method="post">
              <input type="hidden" name="actionType" value="reschedule" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    新预约时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledTime"
                    className="input"
                    defaultValue={new Date(booking.scheduledTime).toISOString().slice(0, 16)}
                  />
                  {actionData?.actionType === "reschedule" && actionData.errors?.scheduledTime && (
                    <p className="mt-1 text-sm text-red-600">{actionData.errors.scheduledTime[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    改期原因 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="reason"
                    rows={3}
                    className="input"
                    placeholder="请填写改期原因"
                  />
                  {actionData?.actionType === "reschedule" && actionData.errors?.reason && (
                    <p className="mt-1 text-sm text-red-600">{actionData.errors.reason[0]}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  确认改期
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">驳回订单</h3>
            <Form method="post">
              <input type="hidden" name="actionType" value="reject" />
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                  驳回后将释放手牌和储物柜，请谨慎操作。
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    驳回原因 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="reason"
                    rows={3}
                    className="input"
                    placeholder="请填写驳回原因"
                  />
                  {actionData?.actionType === "reject" && actionData.errors?.reason && (
                    <p className="mt-1 text-sm text-red-600">{actionData.errors.reason[0]}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-danger" disabled={isSubmitting}>
                  确认驳回
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {showSupplementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">补录信息</h3>
            <Form method="post">
              <input type="hidden" name="actionType" value="supplement" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    补录内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="notes"
                    rows={4}
                    className="input"
                    placeholder="请填写需要补录的信息"
                  />
                  {actionData?.actionType === "supplement" && actionData.errors?.notes && (
                    <p className="mt-1 text-sm text-red-600">{actionData.errors.notes[0]}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSupplementModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  确认补录
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {showExceptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">上报异常</h3>
            <Form method="post">
              <input type="hidden" name="actionType" value="reportException" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    异常类型 <span className="text-red-500">*</span>
                  </label>
                  <select name="type" className="input">
                    <option value="">请选择异常类型</option>
                    {exceptionTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {actionData?.actionType === "reportException" && actionData.errors?.type && (
                    <p className="mt-1 text-sm text-red-600">{actionData.errors.type[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    异常标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    className="input"
                    placeholder="请简要描述异常"
                  />
                  {actionData?.actionType === "reportException" && actionData.errors?.title && (
                    <p className="mt-1 text-sm text-red-600">{actionData.errors.title[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    详细描述 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    className="input"
                    placeholder="请详细描述异常情况"
                  />
                  {actionData?.actionType === "reportException" && actionData.errors?.description && (
                    <p className="mt-1 text-sm text-red-600">{actionData.errors.description[0]}</p>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowExceptionModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-danger" disabled={isSubmitting}>
                  提交异常
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </div>
  );
}
