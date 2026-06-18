import { useState } from 'react';
import { Package, AlertTriangle, Search, ClipboardList, Clock, User } from 'lucide-react';
import { useCourseStore } from '@/store/courseStore';

const users = [
  { id: 'u1', name: '张教员', role: 'educator' as const },
  { id: 'u2', name: '李工程师', role: 'engineer' as const },
  { id: 'u3', name: '王老师', role: 'teacher' as const },
  { id: 'u4', name: '刘教员', role: 'educator' as const },
  { id: 'u5', name: '陈工程师', role: 'engineer' as const },
  { id: 'u6', name: '赵老师', role: 'teacher' as const },
];

const getRoleLabel = (name: string) => {
  const user = users.find((u) => u.name === name);
  if (user?.role === 'educator') return '展教员';
  if (user?.role === 'engineer') return '设备工程师';
  if (user?.role === 'teacher') return '活动老师';
  return name;
};

const getResponsibilityReminder = (course: { status: string; creator: string; assignee: string; engineer?: string; teacher?: string }) => {
  switch (course.status) {
    case 'pending':
      return {
        level: 'warning' as const,
        title: '待审核',
        message: `${course.creator}（展教员）已提交课程，等待${course.assignee}（设备工程师）审核确认材料需求。`,
      };
    case 'approved': {
      const eng = course.engineer || course.assignee;
      const tea = course.teacher || course.assignee;
      return {
        level: 'info' as const,
        title: '已通过',
        message: `${eng}（设备工程师）已审核通过，请${tea}（活动老师）确认材料并领用。`,
      };
    }
    case 'urgent':
      return {
        level: 'danger' as const,
        title: '催办中',
        message: `⚠️ ${course.creator}（展教员）已催促，请${course.assignee}（设备工程师）尽快处理！`,
      };
    case 'supplement': {
      const eng = course.engineer || course.assignee;
      const tea = course.teacher || course.assignee;
      return {
        level: 'warning' as const,
        title: '补材料',
        message: `${tea}（活动老师）反馈材料不足，请${eng}（设备工程师）补充材料后继续。`,
      };
    }
    case 'rejected':
      return {
        level: 'danger' as const,
        title: '已退回',
        message: `${course.assignee}（设备工程师）已退回课程，请${course.creator}（展教员）修改后重新提交。`,
      };
    case 'completed': {
      const eng = course.engineer || course.assignee;
      const tea = course.teacher || course.assignee;
      return {
        level: 'success' as const,
        title: '已完成',
        message: `${tea}（活动老师）已完成课程，材料已全部归还入库。审核工程师：${eng}（设备工程师）`,
      };
    }
    default:
      return null;
  }
};

export default function Materials() {
  const { courses, materials } = useCourseStore();
  const [searchTerm, setSearchTerm] = useState('');

  const coursesWithMaterials = courses;

  const lowStockMaterials = materials.filter((m) => m.quantity <= m.minStock);

  const filteredCourses = coursesWithMaterials.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    const statusOrder = { urgent: 0, supplement: 1, pending: 2, approved: 3, rejected: 4, completed: 5 };
    return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索课程名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {lowStockMaterials.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">库存预警</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {lowStockMaterials.map((material) => (
              <div
                key={material.id}
                className="bg-white border border-red-200 rounded-lg p-3"
              >
                <p className="font-medium text-gray-800">{material.name}</p>
                <p className="text-sm text-red-600">
                  当前库存：{material.quantity} {material.unit}
                </p>
                <p className="text-xs text-gray-500">最低库存：{material.minStock}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {sortedCourses.map((course) => {
            const unallocatedMaterials = course.materials.filter(
              (m) => m.allocatedQty < m.requiredQty
            );
            const isPendingAllocation = unallocatedMaterials.length > 0;
            const responsibilityReminder = getResponsibilityReminder(course);
            const lastComment = course.comments[course.comments.length - 1];

            return (
              <div
                key={course.id}
                className={`bg-white rounded-xl border shadow-sm transition-all ${
                  isPendingAllocation
                    ? 'border-amber-200'
                    : course.status === 'urgent'
                    ? 'border-red-200'
                    : course.status === 'supplement'
                    ? 'border-orange-200'
                    : 'border-gray-200'
                }`}
              >
                {responsibilityReminder && (
                  <div
                    className={`p-3 ${
                      responsibilityReminder.level === 'danger'
                        ? 'bg-red-50'
                        : responsibilityReminder.level === 'warning'
                        ? 'bg-amber-50'
                        : responsibilityReminder.level === 'success'
                        ? 'bg-green-50'
                        : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          responsibilityReminder.level === 'danger'
                            ? 'text-red-600'
                            : responsibilityReminder.level === 'warning'
                            ? 'text-amber-600'
                            : responsibilityReminder.level === 'success'
                            ? 'text-green-600'
                            : 'text-blue-600'
                        }`}
                      />
                      <div className="flex-1">
                        <span
                          className={`text-xs font-medium ${
                            responsibilityReminder.level === 'danger'
                              ? 'text-red-800'
                              : responsibilityReminder.level === 'warning'
                              ? 'text-amber-800'
                              : responsibilityReminder.level === 'success'
                              ? 'text-green-800'
                              : 'text-blue-800'
                          }`}
                        >
                          {responsibilityReminder.title} - 责任提醒
                        </span>
                        <p
                          className={`text-sm mt-1 ${
                            responsibilityReminder.level === 'danger'
                              ? 'text-red-700'
                              : responsibilityReminder.level === 'warning'
                              ? 'text-amber-700'
                              : responsibilityReminder.level === 'success'
                              ? 'text-green-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {responsibilityReminder.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">{course.name}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        course.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : course.status === 'supplement'
                          ? 'bg-orange-100 text-orange-700'
                          : course.status === 'pending'
                          ? 'bg-gray-100 text-gray-700'
                          : course.status === 'urgent'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {course.status === 'approved'
                        ? '已通过'
                        : course.status === 'supplement'
                        ? '补材料'
                        : course.status === 'pending'
                        ? '待审核'
                        : course.status === 'urgent'
                        ? '催办中'
                        : '已完成'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>创建人：{course.creator}（{getRoleLabel(course.creator)}）</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>处理人：{course.assignee}（{getRoleLabel(course.assignee)}）</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>更新：{course.updatedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {course.status === 'completed' ? '材料归还记录' : '材料领用记录'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {course.materials.map((material) => {
                      const progress = course.status === 'completed'
                        ? Math.min(
                            ((material.returnedQty || 0) / material.requiredQty) * 100,
                            100
                          )
                        : Math.min(
                            (material.allocatedQty / material.requiredQty) * 100,
                            100
                          );
                      const isFullyProcessed = course.status === 'completed'
                        ? (material.returnedQty || 0) >= material.requiredQty
                        : material.allocatedQty >= material.requiredQty;
                      const stock = materials.find((m) => m.id === material.materialId);

                      return (
                        <div
                          key={material.materialId}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            course.status === 'completed' ? 'bg-blue-50' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-800">
                                {material.materialName}
                              </span>
                              <span className="text-sm text-gray-500">
                                {course.status === 'completed'
                                  ? `${material.returnedQty || 0}/${material.requiredQty} ${material.unit}`
                                  : `${material.allocatedQty}/${material.requiredQty} ${material.unit}`}
                              </span>
                            </div>
                            {course.status !== 'completed' && (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      isFullyProcessed ? 'bg-green-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                {stock && stock.quantity <= stock.minStock && (
                                  <span className="text-xs text-red-500 ml-2">库存不足</span>
                                )}
                              </div>
                            )}
                          </div>
                          <span
                            className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                              course.status === 'completed'
                                ? 'bg-blue-100 text-blue-700'
                                : isFullyProcessed
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {course.status === 'completed' ? '已归还' : isFullyProcessed ? '已领用' : '待领用'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {lastComment && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">上一环节结论</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">
                          {lastComment.author}（{getRoleLabel(lastComment.author)}）：
                        </span>
                        {lastComment.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{lastComment.createdAt}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sortedCourses.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无材料领用记录</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-800 mb-4">材料库存总览</h3>
            <div className="space-y-3">
              {materials.map((material) => {
                const isLowStock = material.quantity <= material.minStock;
                return (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{
                      backgroundColor: isLowStock ? '#fef2f2' : '#f9fafb',
                    }}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{material.name}</p>
                      <p className="text-xs text-gray-500">单位：{material.unit}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          isLowStock ? 'text-red-600' : 'text-gray-800'
                        }`}
                      >
                        {material.quantity}
                      </p>
                      <p className="text-xs text-gray-500">最低库存: {material.minStock}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">责任提示</h4>
                <p className="text-sm text-amber-700 mt-1">
                  材料领用环节需确认上一环节结论，如有疑问请及时与设备工程师沟通。课程状态变更会实时同步到材料领用页面。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-medium text-blue-800 mb-2">处理流程</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li className="flex items-start gap-2">
                <span className="font-medium">1.</span>
                <span>展教员创建课程并提交材料需求</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">2.</span>
                <span>设备工程师审核并确认材料</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">3.</span>
                <span>活动老师领用材料并反馈使用情况</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium">4.</span>
                <span>课程完成后材料归还入库</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
