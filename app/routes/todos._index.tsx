import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Calendar, Check, ClipboardList, Filter, Plus, Users } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "~/components/DashboardLayout";
import { StatusBadge } from "~/components/StatusBadge";
import { formatDate } from "~/data/mockData";
import { getAllTodos, getReviewById, updateReviewStatus, updateTodoStatus } from "~/data/store";

export const loader = async () => {
  return json({ todos: getAllTodos() });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "updateStatus") {
    const todoId = formData.get("todoId") as string;
    const status = formData.get("status") as "pending" | "in_progress" | "completed";

    const updatedTodo = updateTodoStatus(todoId, status);

    if (updatedTodo && status === "completed") {
      const review = getReviewById(updatedTodo.reviewId);
      if (review && review.feedbackStatus !== "resolved") {
        updateReviewStatus(updatedTodo.reviewId, "resolved");
      }
    }

    return json({ success: true, todo: updatedTodo });
  }

  return json({ error: "无效操作" }, { status: 400 });
};

export default function TodosIndex() {
  const { todos } = useLoaderData<typeof loader>();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const statusOptions = [
    { value: "all", label: "全部状态" },
    { value: "pending", label: "待处理" },
    { value: "in_progress", label: "处理中" },
    { value: "completed", label: "已完成" },
  ];

  const typeOptions = [
    { value: "all", label: "全部类型" },
    { value: "class_change", label: "换班" },
    { value: "suspension", label: "停课" },
    { value: "complaint", label: "投诉" },
    { value: "makeup", label: "补交" },
    { value: "other", label: "其他" },
  ];

  const filteredTodos = todos.filter((todo) => {
    const matchesStatus = statusFilter === "all" || todo.status === statusFilter;
    const matchesType = typeFilter === "all" || todo.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const stats = [
    { label: "总待办", value: todos.length, color: "text-blue-600" },
    {
      label: "待处理",
      value: todos.filter((t) => t.status === "pending").length,
      color: "text-gray-600",
    },
    {
      label: "处理中",
      value: todos.filter((t) => t.status === "in_progress").length,
      color: "text-orange-600",
    },
    {
      label: "已完成",
      value: todos.filter((t) => t.status === "completed").length,
      color: "text-green-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">待办事项</h1>
            <p className="text-gray-500 mt-1">管理家长反馈转化的待办事项</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            新建待办
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="card p-4">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <span className="text-sm text-gray-500">状态：</span>
              <select
                className="input-field w-32"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">类型：</span>
              <select
                className="input-field w-32"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTodos.length === 0 ? (
            <div className="card p-12 text-center">
              <ClipboardList size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">暂无匹配的待办事项</p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div key={todo.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={todo.type} type="todoType" />
                    <StatusBadge status={todo.status} type="todo" />
                  </div>
                  {todo.dueDate && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar size={14} />
                      <span>截止：{formatDate(todo.dueDate)}</span>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 text-lg mb-2">{todo.title}</h3>
                <p className="text-gray-600 mb-4">{todo.description}</p>

                <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users size={14} />
                    <span>
                      {todo.studentName} · {todo.parentName}
                    </span>
                  </div>
                  {todo.assigneeName && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-xs">
                        👤
                      </div>
                      <span>负责人：{todo.assigneeName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>创建于 {formatDate(todo.createdAt)}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  {todo.status !== "completed" && (
                    <Form method="post" className="flex-1">
                      <input type="hidden" name="intent" value="updateStatus" />
                      <input type="hidden" name="todoId" value={todo.id} />
                      <input type="hidden" name="status" value="completed" />
                      <button
                        type="submit"
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        <Check size={16} />
                        标记完成
                      </button>
                    </Form>
                  )}
                  {todo.status === "pending" && (
                    <Form method="post" className="flex-1">
                      <input type="hidden" name="intent" value="updateStatus" />
                      <input type="hidden" name="todoId" value={todo.id} />
                      <input type="hidden" name="status" value="in_progress" />
                      <button
                        type="submit"
                        className="btn-secondary w-full"
                      >
                        开始处理
                      </button>
                    </Form>
                  )}
                  {todo.status === "in_progress" && (
                    <Form method="post" className="flex-1">
                      <input type="hidden" name="intent" value="updateStatus" />
                      <input type="hidden" name="todoId" value={todo.id} />
                      <input type="hidden" name="status" value="pending" />
                      <button
                        type="submit"
                        className="btn-secondary w-full"
                      >
                        暂停处理
                      </button>
                    </Form>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
