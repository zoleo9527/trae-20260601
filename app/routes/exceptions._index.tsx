import type { ActionFunction, LoaderFunction, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import { requireUser } from "~/utils/session.server";
import { prisma } from "~/utils/db.server";
import { logAction } from "~/utils/booking.server";
import { roleLabels } from "~/utils/booking";
import { format } from "date-fns";
import { useState } from "react";
import { z } from "zod";

export const meta: MetaFunction = () => {
  return [{ title: "异常处理 - 洗浴中心管理系统" }];
};

const ResolveSchema = z.object({
  exceptionId: z.string(),
  resolution: z.string().min(1, "请填写处理结果"),
});

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request);

  const exceptions = await prisma.exception.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        select: {
          id: true,
          bookingNumber: true,
          customer: { select: { name: true } },
        },
      },
      reportedBy: { select: { name: true, role: true } },
      assignedTo: { select: { name: true, role: true } },
    },
    take: 100,
  });

  const stats = {
    open: exceptions.filter(e => e.status === "OPEN").length,
    inProgress: exceptions.filter(e => e.status === "IN_PROGRESS").length,
    resolved: exceptions.filter(e => e.status === "RESOLVED").length,
  };

  return json({ exceptions, user, stats });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireUser(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  switch (actionType) {
    case "resolve": {
      const result = ResolveSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }

      const exception = await prisma.exception.findUnique({
        where: { id: result.data.exceptionId },
      });
      if (!exception) {
        return json({ error: "异常记录不存在" }, { status: 404 });
      }

      await prisma.exception.update({
        where: { id: result.data.exceptionId },
        data: {
          status: "RESOLVED",
          resolution: result.data.resolution,
          resolvedAt: new Date(),
          assignedToId: user.id,
        },
      });

      await logAction(
        exception.bookingId,
        user.id,
        "UPDATE",
        `处理异常：${result.data.resolution}`,
        null,
        { resolution: result.data.resolution }
      );

      return redirect("/exceptions");
    }

    case "startProgress": {
      const exceptionId = formData.get("exceptionId") as string;
      if (!exceptionId) {
        return json({ error: "缺少异常ID" }, { status: 400 });
      }

      const exception = await prisma.exception.findUnique({
        where: { id: exceptionId },
      });
      if (!exception) {
        return json({ error: "异常记录不存在" }, { status: 404 });
      }

      await prisma.exception.update({
        where: { id: exceptionId },
        data: {
          status: "IN_PROGRESS",
          assignedToId: user.id,
        },
      });

      await logAction(
        exception.bookingId,
        user.id,
        "UPDATE",
        "开始处理异常",
        null,
        null
      );

      return redirect("/exceptions");
    }

    default:
      return json({ error: "未知操作" }, { status: 400 });
  }
};

const exceptionTypeLabels: Record<string, string> = {
  HANDTAG_LOST: "手牌丢失",
  SCHEDULE_CONFLICT: "排班冲突",
  LOCKER_COMPLAINT: "储物柜投诉",
  DEPOSIT_DISPUTE: "押金争议",
  OTHER: "其他",
};

function ExceptionDrawer({ exception, onClose }: { exception: any; onClose: () => void }) {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="h-full flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">异常详情</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <span className="text-sm text-gray-500">异常类型</span>
              <p className="font-medium">{exceptionTypeLabels[exception.type] || exception.type}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">标题</span>
              <p className="font-medium">{exception.title}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">详细描述</span>
              <p className="text-gray-700 mt-1">{exception.description}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">关联订单</span>
              <p className="font-medium text-primary-600">{exception.booking.bookingNumber}</p>
              <p className="text-sm text-gray-500">{exception.booking.customer.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">上报人</span>
              <p className="font-medium">
                {exception.reportedBy.name} ({roleLabels[exception.reportedBy.role]})
              </p>
              <p className="text-sm text-gray-500">
                {format(new Date(exception.createdAt), "yyyy-MM-dd HH:mm")}
              </p>
            </div>
            {exception.resolution && (
              <div className="p-4 bg-green-50 rounded-lg">
                <span className="text-sm text-green-700">处理结果</span>
                <p className="text-green-800 mt-1">{exception.resolution}</p>
                <p className="text-xs text-green-600 mt-2">
                  处理人：{exception.assignedTo?.name || "未知"}
                </p>
                <p className="text-xs text-green-600">
                  处理时间：{exception.resolvedAt ? format(new Date(exception.resolvedAt), "yyyy-MM-dd HH:mm") : ""}
                </p>
              </div>
            )}
            {exception.status !== "RESOLVED" && (
              <Form method="post">
                <input type="hidden" name="actionType" value="resolve" />
                <input type="hidden" name="exceptionId" value={exception.id} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    处理结果 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="resolution"
                    rows={4}
                    className="input"
                    placeholder="请填写处理结果"
                  />
                  {actionData?.errors?.resolution && (
                    <p className="mt-1 text-sm text-red-600">{actionData.errors.resolution[0]}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn-success w-full mt-4"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "提交中..." : "标记为已解决"}
                </button>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExceptionsIndex() {
  const { exceptions, stats, user } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [selectedException, setSelectedException] = useState<any>(null);
  const [filter, setFilter] = useState("ALL");

  const filteredExceptions = filter === "ALL" 
    ? exceptions 
    : exceptions.filter(e => e.status === filter);

  const canHandle = ["ADMIN", "FLOOR_SUPERVISOR"].includes(user.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">异常处理</h1>
        <p className="text-gray-500 mt-1">手牌丢失、排班冲突、储物柜投诉等异常处理</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-sm text-gray-500">待处理</div>
          <div className="text-2xl font-bold text-red-600">{stats.open}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">处理中</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500">已解决</div>
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
        </div>
      </div>

      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-2">
            {[
              { value: "ALL", label: "全部" },
              { value: "OPEN", label: "待处理" },
              { value: "IN_PROGRESS", label: "处理中" },
              { value: "RESOLVED", label: "已解决" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  filter === f.value
                    ? "bg-primary-100 text-primary-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredExceptions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">暂无异常记录</div>
          ) : (
            filteredExceptions.map((ex) => (
              <div key={ex.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{ex.title}</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {exceptionTypeLabels[ex.type] || ex.type}
                      </span>
                      <span className={`badge ${
                        ex.status === "OPEN" ? "bg-red-100 text-red-800" :
                        ex.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {ex.status === "OPEN" ? "待处理" : ex.status === "IN_PROGRESS" ? "处理中" : "已解决"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{ex.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                      <span>订单：{ex.booking.bookingNumber}</span>
                      <span>客户：{ex.booking.customer.name}</span>
                      <span>上报：{ex.reportedBy.name}</span>
                      <span>{format(new Date(ex.createdAt), "MM-dd HH:mm")}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {canHandle && ex.status === "OPEN" && (
                      <Form method="post">
                        <input type="hidden" name="actionType" value="startProgress" />
                        <input type="hidden" name="exceptionId" value={ex.id} />
                        <button
                          type="submit"
                          className="text-sm text-primary-600 hover:text-primary-900"
                          disabled={navigation.state === "submitting"}
                        >
                          开始处理
                        </button>
                      </Form>
                    )}
                    <button
                      onClick={() => setSelectedException(ex)}
                      className="text-sm text-primary-600 hover:text-primary-900"
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedException && (
        <ExceptionDrawer
          exception={selectedException}
          onClose={() => setSelectedException(null)}
        />
      )}
    </div>
  );
}
