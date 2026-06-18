import { useState } from 'react';
import { Package, AlertTriangle, Search, ClipboardList } from 'lucide-react';
import { useCourseStore } from '@/store/courseStore';

export default function Materials() {
  const { courses, materials } = useCourseStore();
  const [searchTerm, setSearchTerm] = useState('');

  const coursesWithMaterials = courses.filter((c) => c.status !== 'completed');

  const lowStockMaterials = materials.filter((m) => m.quantity <= m.minStock);

  const filteredCourses = coursesWithMaterials.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          {filteredCourses.map((course) => {
            const unallocatedMaterials = course.materials.filter(
              (m) => m.allocatedQty < m.requiredQty
            );
            const isPendingAllocation = unallocatedMaterials.length > 0;

            return (
              <div
                key={course.id}
                className={`bg-white rounded-xl border shadow-sm transition-all ${
                  isPendingAllocation
                    ? 'border-amber-200'
                    : 'border-gray-200'
                }`}
              >
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
                    <span>创建人：{course.creator}</span>
                    <span>处理人：{course.assignee}</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">材料领用记录</span>
                  </div>

                  <div className="space-y-2">
                    {course.materials.map((material) => {
                      const progress = Math.min(
                        (material.allocatedQty / material.requiredQty) * 100,
                        100
                      );
                      const isFullyAllocated = material.allocatedQty >= material.requiredQty;

                      return (
                        <div
                          key={material.materialId}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-800">
                                {material.materialName}
                              </span>
                              <span className="text-sm text-gray-500">
                                {material.allocatedQty}/{material.requiredQty} {material.unit}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isFullyAllocated ? 'bg-green-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          <span
                            className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                              isFullyAllocated
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {isFullyAllocated ? '已领用' : '待领用'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {course.comments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">上一环节结论</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">
                          {course.comments[course.comments.length - 1].author}：
                        </span>
                        {course.comments[course.comments.length - 1].content}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredCourses.length === 0 && (
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
                  材料领用环节需确认上一环节结论，如有疑问请及时与设备工程师沟通。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
