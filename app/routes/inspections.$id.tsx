import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { Layout } from "~/components/Layout";
import { requireUser } from "~/utils/session.server";
import {
  getInspectionById,
  getStudentsWithLateReturns,
  submitRectification,
  approveRectification,
  rejectRectification,
  assignMaintenance,
  completeMaintenance,
  closeInspection,
  getMaintenanceUsers,
  submitInspection,
  getKeyRecordsByDormId,
} from "~/utils/dataService";
import { STATUS_LABELS, STATUS_COLORS, GRADE_LABELS } from "~/utils/types";
import clsx from "clsx";
import invariant from "tiny-invariant";
import type { InspectionGrade, InspectionItem, Rectification, TimelineEvent, Dorm, User, KeyRecord, LateReturnRecord, Student } from "@prisma/client";

type InspectionWithRelations = {
  id: string;
  dormId: string;
  inspectorId: string | null;
  maintenanceId: string | null;
  status: string;
  overallGrade: InspectionGrade | null;
  inspectionDate: Date | null;
  deadline: Date | null;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
  dorm: Dorm;
  inspector: User | null;
  maintenanceAssignee: User | null;
  items: InspectionItem[];
  rectifications: Rectification[];
  timelineEvents: (TimelineEvent & { user: User | null })[];
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  invariant(params.id, "缺少检查单ID");

  const inspection = await getInspectionById(params.id);
  if (!inspection) {
    throw new Response("检查单不存在", { status: 404 });
  }

  const studentsWithLateReturns = await getStudentsWithLateReturns(inspection.dormId);
  const maintenanceUsers = await getMaintenanceUsers();
  const keyRecords = await getKeyRecordsByDormId(inspection.dormId);

  return json({ user, inspection, studentsWithLateReturns, maintenanceUsers, keyRecords });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  invariant(params.id, "缺少检查单ID");

  const formData = await request.formData();
  const _action = formData.get("_action")?.toString();

  if (_action === "submit_inspection") {
    const items = [];
    const itemIds = formData.getAll("itemId") as string[];
    
    for (const itemId of itemIds) {
      const isPassed = formData.get(`isPassed_${itemId}`) === "true";
      const score = parseInt(formData.get(`score_${itemId}`)?.toString() || "0");
      const issue = formData.get(`issue_${itemId}`)?.toString() || "";
      const needRepair = formData.get(`needRepair_${itemId}`) === "true";
      
      items.push({ id: itemId, isPassed, score, issue, needRepair });
    }

    const overallGrade = formData.get("overallGrade")?.toString() as InspectionGrade;
    const deadlineStr = formData.get("deadline")?.toString();
    const remarks = formData.get("remarks")?.toString() || "";
    
    const deadline = deadlineStr ? new Date(deadlineStr) : undefined;

    await submitInspection(params.id, {
      items,
      overallGrade,
      deadline,
      remarks,
      currentUser: user,
    });

    return redirect(`/inspections/${params.id}`);
  }

  if (_action === "submit_rectification") {
    const description = formData.get("description")?.toString() || "";
    const submittedBy = formData.get("submittedBy")?.toString() || "";
    await submitRectification(params.id, description, submittedBy, user);
    return redirect(`/inspections/${params.id}`);
  }

  if (_action === "approve_rectification") {
    const reviewComments = formData.get("reviewComments")?.toString() || "";
    const rectificationId = formData.get("rectificationId")?.toString() || "";
    await approveRectification(params.id, rectificationId, reviewComments, user);
    return redirect(`/inspections/${params.id}`);
  }

  if (_action === "reject_rectification") {
    const reviewComments = formData.get("reviewComments")?.toString() || "";
    const rectificationId = formData.get("rectificationId")?.toString() || "";
    await rejectRectification(params.id, rectificationId, reviewComments, user);
    return redirect(`/inspections/${params.id}`);
  }

  if (_action === "assign_maintenance") {
    const maintenanceId = formData.get("maintenanceId")?.toString() || "";
    await assignMaintenance(params.id, maintenanceId, user);
    return redirect(`/inspections/${params.id}`);
  }

  if (_action === "complete_maintenance") {
    await completeMaintenance(params.id, user);
    return redirect(`/inspections/${params.id}`);
  }

  if (_action === "close_inspection") {
    await closeInspection(params.id, user);
    return redirect(`/inspections/${params.id}`);
  }

  return json({ error: "未知操作" }, { status: 400 });
}

export default function InspectionDetailPage() {
  const loaderData = useLoaderData<typeof loader>();
  const { user, studentsWithLateReturns, maintenanceUsers, keyRecords } = loaderData;
  const inspection = loaderData.inspection as unknown as InspectionWithRelations;
  const navigation = useNavigation();
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  const isOverdue = inspection.deadline && new Date(inspection.deadline) < new Date();
  const latestRectification = inspection.rectifications[inspection.rectifications.length - 1];

  const toggleStudentExpand = (studentId: string) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const groupedItems = inspection.items.reduce((acc: Record<string, typeof inspection.items>, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const gradeOptions = [
    { value: "EXCELLENT", label: "优秀" },
    { value: "GOOD", label: "良好" },
    { value: "FAIR", label: "一般" },
    { value: "POOR", label: "差" },
  ];

  return (
    <Layout user={user}>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {inspection.dorm.building} {inspection.dorm.roomNumber}室 卫生检查详情
            </h1>
            <p className="text-gray-500 mt-1">
              创建于 {new Date(inspection.createdAt).toLocaleString("zh-CN")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={clsx(
                "px-3 py-1.5 rounded-full text-sm font-medium",
                STATUS_COLORS[inspection.status as keyof typeof STATUS_COLORS]
              )}
            >
              {STATUS_LABELS[inspection.status as keyof typeof STATUS_LABELS]}
            </span>
            {isOverdue && (
              <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium animate-pulse">
                ⚠️ 已超时
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {inspection.status === "PENDING_INSPECTION" && user.role === "DORM_MANAGER" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">执行卫生检查</h2>
                <Form method="post" className="space-y-6">
                  <input type="hidden" name="_action" value="submit_inspection" />
                  
                  {Object.entries(groupedItems).map(([category, items]: any) => (
                    <div key={category} className="mb-6 last:mb-0">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">{category}</h3>
                      <div className="space-y-4">
                        {items.map((item: any) => (
                          <div key={item.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <input type="hidden" name="itemId" value={item.id} />
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 mb-3">{item.name}</p>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm text-gray-600 mb-1">检查结果</label>
                                    <div className="flex gap-3">
                                      <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`isPassed_${item.id}`}
                                          value="true"
                                          defaultChecked={item.isPassed === true}
                                          className="w-4 h-4 text-green-600"
                                        />
                                        <span className="text-sm text-green-700">通过</span>
                                      </label>
                                      <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`isPassed_${item.id}`}
                                          value="false"
                                          defaultChecked={item.isPassed === false}
                                          className="w-4 h-4 text-red-600"
                                        />
                                        <span className="text-sm text-red-700">不通过</span>
                                      </label>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm text-gray-600 mb-1">评分 (0-100)</label>
                                    <input
                                      type="number"
                                      name={`score_${item.id}`}
                                      min="0"
                                      max="100"
                                      defaultValue={item.score || 80}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <label className="block text-sm text-gray-600 mb-1">问题描述（如不通过）</label>
                                  <input
                                    type="text"
                                    name={`issue_${item.id}`}
                                    defaultValue={item.issue || ""}
                                    placeholder="请描述存在的问题..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  />
                                </div>
                                <div className="mt-3">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      name={`needRepair_${item.id}`}
                                      value="true"
                                      defaultChecked={item.needRepair}
                                      className="w-4 h-4 text-yellow-600"
                                    />
                                    <span className="text-sm text-yellow-700">需要维修</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        总体评级
                      </label>
                      <select
                        name="overallGrade"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {gradeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        整改期限（如需整改）
                      </label>
                      <input
                        type="date"
                        name="deadline"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      检查备注
                    </label>
                    <textarea
                      name="remarks"
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="请填写检查备注..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={navigation.state === "submitting"}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {navigation.state === "submitting" ? "提交中..." : "✓ 提交检查结果"}
                  </button>
                </Form>
              </div>
            )}

            {inspection.status !== "PENDING_INSPECTION" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">检查项目明细</h2>
                {Object.entries(groupedItems).map(([category, items]: any) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">{category}</h3>
                    <div className="space-y-3">
                      {items.map((item: any) => (
                        <div
                          key={item.id}
                          className={clsx(
                            "p-4 rounded-lg border",
                            item.isPassed === false
                              ? "bg-red-50 border-red-200"
                              : item.isPassed === true
                              ? "bg-green-50 border-green-200"
                              : "bg-gray-50 border-gray-200"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900">{item.name}</span>
                                {item.needRepair && (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                    需维修
                                  </span>
                                )}
                                {item.issue?.includes("缺材料") && (
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                    缺材料
                                  </span>
                                )}
                              </div>
                              {item.issue && (
                                <p className="text-sm text-gray-600 mt-1">问题描述：{item.issue}</p>
                              )}
                            </div>
                            <div className="text-right">
                              {item.score !== null && item.score !== undefined && (
                                <span
                                  className={clsx(
                                    "text-lg font-bold",
                                    item.score >= 80
                                      ? "text-green-600"
                                      : item.score >= 60
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                  )}
                                >
                                  {item.score}分
                                </span>
                              )}
                              {item.isPassed !== null && item.isPassed !== undefined && (
                                <div className="text-sm mt-0.5">
                                  {item.isPassed ? (
                                    <span className="text-green-600">✓ 通过</span>
                                  ) : (
                                    <span className="text-red-600">✗ 不通过</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {inspection.rectifications.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">整改记录与复查</h2>
                <div className="space-y-4">
                  {inspection.rectifications.map((rect: any, idx: number) => (
                    <div
                      key={rect.id}
                      className={clsx(
                        "p-4 rounded-lg border",
                        rect.isRejected
                          ? "bg-red-50 border-red-200"
                          : rect.reviewResult === "approved"
                          ? "bg-green-50 border-green-200"
                          : "bg-yellow-50 border-yellow-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-gray-500">
                            第 {idx + 1} 次整改
                          </span>
                          {rect.rejectionCount > 0 && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                              被驳回 {rect.rejectionCount} 次
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {rect.submittedAt && new Date(rect.submittedAt).toLocaleString("zh-CN")}
                        </span>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">整改说明：</p>
                        <p className="text-gray-900">{rect.description}</p>
                        {rect.submittedBy && (
                          <p className="text-sm text-gray-500 mt-1">提交人：{rect.submittedBy}</p>
                        )}
                      </div>
                      {rect.reviewResult && (
                        <div className="border-t pt-3 mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              复查结果：
                              <span
                                className={clsx(
                                  "ml-2 font-bold",
                                  rect.reviewResult === "approved"
                                    ? "text-green-600"
                                    : "text-red-600"
                                )}
                              >
                                {rect.reviewResult === "approved" ? "✓ 通过" : "✗ 驳回"}
                              </span>
                            </span>
                            <span className="text-sm text-gray-500">
                              复查人：{rect.reviewedBy} ·{" "}
                              {rect.reviewedAt &&
                                new Date(rect.reviewedAt).toLocaleString("zh-CN")}
                            </span>
                          </div>
                          {rect.reviewComments && (
                            <div className="bg-white/50 rounded-lg p-3">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">复查意见：</span>
                                {rect.reviewComments}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(inspection.status === "NEEDS_RECTIFICATION" ||
              inspection.status === "RECTIFICATION_REJECTED") &&
              (user.role === "DORM_MANAGER" || user.role === "COUNSELOR") && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">提交整改材料</h2>
                  <Form method="post" className="space-y-4">
                    <input type="hidden" name="_action" value="submit_rectification" />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        整改说明
                      </label>
                      <textarea
                        name="description"
                        rows={4}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="请详细描述整改情况..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        提交人
                      </label>
                      <input
                        type="text"
                        name="submittedBy"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="宿舍长姓名"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={navigation.state === "submitting"}
                      className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      {navigation.state === "submitting" ? "提交中..." : "提交整改，等待复查"}
                    </button>
                  </Form>
                </div>
              )}

            {inspection.status === "RECTIFIED" &&
              user.role === "COUNSELOR" &&
              latestRectification &&
              !latestRectification.reviewResult && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">辅导员复查</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        复查意见
                      </label>
                      <Form method="post" className="space-y-4">
                        <input type="hidden" name="_action" value="approve_rectification" />
                        <input
                          type="hidden"
                          name="rectificationId"
                          value={latestRectification.id}
                        />
                        <textarea
                          name="reviewComments"
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="请填写复查意见（可选）"
                        />
                        <div className="flex gap-3">
                          <button
                            type="submit"
                            disabled={navigation.state === "submitting"}
                            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            ✓ 复查通过
                          </button>
                        </div>
                      </Form>
                    </div>
                    <Form method="post">
                      <input type="hidden" name="_action" value="reject_rectification" />
                      <input
                        type="hidden"
                        name="rectificationId"
                        value={latestRectification.id}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          驳回原因（必填）
                        </label>
                        <textarea
                          name="reviewComments"
                          rows={3}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="请详细说明驳回原因，指导学生重新整改..."
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={navigation.state === "submitting"}
                        className="w-full mt-4 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        ✗ 驳回，要求重新整改
                      </button>
                    </Form>
                  </div>
                </div>
              )}

            {inspection.status === "MAINTENANCE_ASSIGNED" && user.role === "MAINTENANCE" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">维修处理</h2>
                <Form method="post">
                  <input type="hidden" name="_action" value="complete_maintenance" />
                  <p className="text-gray-600 mb-4">
                    请确认已完成以下维修项目：
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {inspection.items
                        .filter((i: any) => i.needRepair)
                        .map((i: any) => (
                          <li key={i.id} className="text-sm">
                            {i.name} - {i.issue}
                          </li>
                        ))}
                    </ul>
                  </p>
                  <button
                    type="submit"
                    disabled={navigation.state === "submitting"}
                    className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
                  >
                    ✓ 标记维修完成
                  </button>
                </Form>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">宿舍</span>
                  <span className="font-medium">
                    {inspection.dorm.building} {inspection.dorm.roomNumber}室
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">楼层</span>
                  <span className="font-medium">{inspection.dorm.floor}层</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">房间类型</span>
                  <span className="font-medium">{inspection.dorm.capacity}人间</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">检查员</span>
                  <span className="font-medium">
                    {inspection.inspector?.name || "待分配"}
                  </span>
                </div>
                {inspection.maintenanceAssignee && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">维修人员</span>
                    <span className="font-medium">
                      {inspection.maintenanceAssignee.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">总体评级</span>
                  <span className="font-medium">
                    {inspection.overallGrade
                      ? GRADE_LABELS[inspection.overallGrade as keyof typeof GRADE_LABELS]
                      : "待评定"}
                  </span>
                </div>
                {inspection.deadline && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">整改期限</span>
                    <span
                      className={clsx(
                        "font-medium",
                        isOverdue ? "text-red-600" : "text-gray-900"
                      )}
                    >
                      {new Date(inspection.deadline).toLocaleDateString("zh-CN")}
                      {isOverdue && " (已超时)"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">入住学生与晚归记录</h2>
              <div className="space-y-3">
                {studentsWithLateReturns.map((student: any) => {
                  const sortedLateReturns = [...student.lateReturns].sort(
                    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
                  );
                  const latestReturn = sortedLateReturns[0];
                  const isExpanded = expandedStudents.has(student.id);
                  const hasMultipleReturns = student.lateReturns.length > 1;

                  return (
                    <div
                      key={student.id}
                      className={clsx(
                        "rounded-lg border overflow-hidden",
                        student.lateReturns.length > 0
                          ? "bg-orange-50 border-orange-200"
                          : "bg-gray-50 border-gray-200"
                      )}
                    >
                      <div
                        className={clsx(
                          "p-3 cursor-pointer",
                          hasMultipleReturns && "hover:bg-black/[0.02] transition-colors"
                        )}
                        onClick={() => hasMultipleReturns && toggleStudentExpand(student.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-gray-900">{student.name}</p>
                              {student.lateReturns.length > 0 && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                  晚归 {student.lateReturns.length} 次
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {student.studentId} · {student.major}
                            </p>
                          </div>
                          {hasMultipleReturns && (
                            <span className="text-gray-400 text-sm shrink-0 mt-1">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          )}
                        </div>

                        {latestReturn && (
                          <div className="mt-3 p-2.5 bg-white rounded-md border border-orange-100">
                            <p className="text-xs font-medium text-orange-800 mb-1.5">
                              最近一次晚归
                            </p>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-700">
                                <span className="text-gray-500">日期：</span>
                                {new Date(latestReturn.date).toLocaleDateString("zh-CN")}
                                <span className="text-gray-400 mx-1.5">|</span>
                                <span className="text-gray-500">时间：</span>
                                {latestReturn.time}
                              </p>
                              {latestReturn.reason && (
                                <p className="text-xs text-gray-700">
                                  <span className="text-gray-500">原因：</span>
                                  {latestReturn.reason}
                                </p>
                              )}
                              {latestReturn.recordedBy && (
                                <p className="text-xs text-gray-500">
                                  记录人：{latestReturn.recordedBy}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {hasMultipleReturns && isExpanded && (
                        <div className="border-t border-orange-200 bg-white">
                          <div className="p-3">
                            <p className="text-xs font-medium text-gray-700 mb-2.5">
                              全部晚归记录 ({sortedLateReturns.length}次)
                            </p>
                            <div className="space-y-2">
                              {sortedLateReturns.map((record: any, idx: number) => (
                                <div
                                  key={record.id}
                                  className={clsx(
                                    "p-2 rounded-md text-xs",
                                    idx === 0
                                      ? "bg-orange-50 border border-orange-100"
                                      : "bg-gray-50 border border-gray-100"
                                  )}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-800">
                                      {new Date(record.date).toLocaleDateString("zh-CN")}
                                    </span>
                                    <span className="text-gray-500">{record.time}</span>
                                    {idx === 0 && (
                                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[10px] font-medium">
                                        最近
                                      </span>
                                    )}
                                  </div>
                                  {record.reason && (
                                    <p className="text-gray-600">
                                      <span className="text-gray-400">原因：</span>
                                      {record.reason}
                                    </p>
                                  )}
                                  {record.recordedBy && (
                                    <p className="text-gray-400 mt-0.5">
                                      记录人：{record.recordedBy}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {studentsWithLateReturns.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">暂无入住学生</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">钥匙台账</h2>
              <div className="space-y-3">
                {keyRecords.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400">暂无钥匙记录</p>
                  </div>
                ) : (
                  keyRecords.map((key) => (
                    <div key={key.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {key.keyNumber}
                        </span>
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            key.status === "borrowed"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          )}
                        >
                          {key.status === "borrowed" ? "已借出" : "在库"}
                        </span>
                      </div>
                      {key.borrower && (
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">借用人：</span>
                          {key.borrower}
                        </p>
                      )}
                      {key.borrowedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">借出时间：</span>
                          {new Date(key.borrowedAt).toLocaleString("zh-CN")}
                        </p>
                      )}
                      {key.returnedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">归还时间：</span>
                          {new Date(key.returnedAt).toLocaleString("zh-CN")}
                        </p>
                      )}
                      {key.remarks && (
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">备注：</span>
                          {key.remarks}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {(inspection.status === "NEEDS_RECTIFICATION" ||
              inspection.status === "RECTIFICATION_REJECTED") &&
              user.role === "COUNSELOR" &&
              inspection.items.some((i: any) => i.needRepair) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">指派维修</h2>
                  <Form method="post">
                    <input type="hidden" name="_action" value="assign_maintenance" />
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        选择维修人员
                      </label>
                      <select
                        name="maintenanceId"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {maintenanceUsers.map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={navigation.state === "submitting"}
                      className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      🛠 指派维修
                    </button>
                  </Form>
                </div>
              )}

            {(inspection.status === "RECTIFICATION_PASSED" ||
              inspection.status === "MAINTENANCE_COMPLETED" ||
              inspection.status === "PASSED") &&
              (user.role === "DORM_MANAGER" || user.role === "COUNSELOR") && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <Form method="post">
                    <input type="hidden" name="_action" value="close_inspection" />
                    <button
                      type="submit"
                      disabled={navigation.state === "submitting"}
                      className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      关闭检查单
                    </button>
                  </Form>
                </div>
              )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">处理时间线</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-6">
              {inspection.timelineEvents.map((event: any, idx: number) => (
                <div key={event.id} className="relative pl-10">
                  <div
                    className={clsx(
                      "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                      event.eventType.includes("REJECTED") ||
                      event.eventType.includes("OVERDUE")
                        ? "bg-red-500"
                        : event.eventType.includes("APPROVED") ||
                          event.eventType.includes("PASSED") ||
                          event.eventType.includes("COMPLETED")
                        ? "bg-green-500"
                        : event.eventType.includes("MAINTENANCE")
                        ? "bg-purple-500"
                        : event.eventType.includes("RECTIFICATION")
                        ? "bg-yellow-500"
                        : "bg-primary-500"
                    )}
                  >
                    {idx + 1}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <span className="font-medium text-gray-900">{event.description}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(event.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    {event.user && (
                      <p className="text-sm text-gray-500">操作人：{event.user.name}</p>
                    )}
                    {event.metadata &&
                      typeof event.metadata === "object" &&
                      "comments" in event.metadata && (
                        <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">备注：</span>
                            {event.metadata.comments}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
