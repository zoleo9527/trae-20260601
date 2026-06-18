import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Package, MessageSquare, CheckCircle, XCircle, AlertTriangle, Send } from 'lucide-react';
import { useCourseStore } from '@/store/courseStore';
import { Course } from '@/types';

const statusConfig = {
  pending: { label: '待审核', className: 'bg-gray-100 text-gray-700' },
  approved: { label: '已通过', className: 'bg-green-100 text-green-700' },
  rejected: { label: '已退回', className: 'bg-red-100 text-red-700' },
  urgent: { label: '催办中', className: 'bg-amber-100 text-amber-700' },
  supplement: { label: '补材料', className: 'bg-orange-100 text-orange-700' },
  completed: { label: '已完成', className: 'bg-blue-100 text-blue-700' },
};

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

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { courses, materials, updateCourseStatus, addComment, updateMaterialAllocation, returnStock } = useCourseStore();
  const [activeTab, setActiveTab] = useState<'materials' | 'comments'>('materials');
  const [newComment, setNewComment] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('张教员');

  const course = courses.find((c) => c.id === id);

  if (!course) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">课程不存在</p>
      </div>
    );
  }

  const status = statusConfig[course.status];

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(course.id, selectedAuthor, newComment.trim());
      setNewComment('');
    }
  };

  const handleApprove = () => {
    updateCourseStatus(course.id, 'approved');
    addComment(course.id, selectedAuthor, '审核通过，请活动老师领用材料。');
  };

  const handleReject = () => {
    updateCourseStatus(course.id, 'rejected');
    addComment(course.id, selectedAuthor, '审核未通过，请修改后重新提交。');
  };

  const handleUrgent = () => {
    updateCourseStatus(course.id, 'urgent');
    addComment(course.id, selectedAuthor, '此课程时间紧迫，请尽快处理！');
  };

  const handleComplete = () => {
    course.materials.forEach((mat) => {
      if (mat.allocatedQty > 0) {
        returnStock(mat.materialId, mat.allocatedQty);
      }
    });
    updateCourseStatus(course.id, 'completed');
    addComment(course.id, selectedAuthor, '课程已完成，材料已归还入库。');
  };

  const handleSupplement = () => {
    updateCourseStatus(course.id, 'supplement');
    addComment(course.id, selectedAuthor, '材料不足，需要补充。');
  };

  const getLastConclusion = () => {
    if (course.comments.length === 0) return null;
    return course.comments[course.comments.length - 1];
  };

  const lastConclusion = getLastConclusion();

  const canComplete = course.materials.every((mat) => mat.allocatedQty >= mat.requiredQty);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回列表</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">{course.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-gray-600">{course.description}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>创建人：{course.creator}（{getRoleLabel(course.creator)}）</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>处理人：{course.assignee}（{getRoleLabel(course.assignee)}）</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>创建时间：{course.createdAt}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>更新时间：{course.updatedAt}</span>
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'materials'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>材料清单</span>
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'comments'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>历史备注</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'materials' && (
            <div className="space-y-4">
              {lastConclusion && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">上一环节结论</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    <span className="font-medium">{lastConclusion.author}（{getRoleLabel(lastConclusion.author)}）：</span>
                    {lastConclusion.content}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">{lastConclusion.createdAt}</p>
                </div>
              )}

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">材料名称</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">需求数量</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">已分配</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">当前库存</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">单位</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">状态</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {course.materials.map((material) => {
                      const isFullyAllocated = material.allocatedQty >= material.requiredQty;
                      const progress = Math.min((material.allocatedQty / material.requiredQty) * 100, 100);
                      const stock = materials.find((m) => m.id === material.materialId);
                      const isLowStock = stock && stock.quantity <= stock.minStock;
                      
                      return (
                        <tr key={material.materialId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{material.materialName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{material.requiredQty}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">{material.allocatedQty}</span>
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isFullyAllocated ? 'bg-green-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-sm ${isLowStock ? 'text-red-600' : 'text-gray-600'}`}>
                            {stock?.quantity || 0}
                            {isLowStock && <span className="ml-1 text-xs">(库存不足)</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{material.unit}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                isFullyAllocated
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {isFullyAllocated ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  已完成
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3" />
                                  待补充
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {course.status === 'approved' && (
                              <button
                                onClick={() =>
                                  updateMaterialAllocation(
                                    course.id,
                                    material.materialId,
                                    material.requiredQty
                                  )
                                }
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                确认领用
                              </button>
                            )}
                            {course.status === 'supplement' && (
                              <button
                                onClick={() =>
                                  updateMaterialAllocation(
                                    course.id,
                                    material.materialId,
                                    material.requiredQty
                                  )
                                }
                                className="px-3 py-1 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                              >
                                补充材料
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">添加备注</span>
                </div>
                <div className="flex gap-3">
                  <select
                    value={selectedAuthor}
                    onChange={(e) => setSelectedAuthor(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.name}>
                        {user.name}（{getRoleLabel(user.name)}）
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="输入备注内容..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {course.comments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">暂无备注</p>
                ) : (
                  course.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">
                          {comment.author}（{getRoleLabel(comment.author)}）
                        </span>
                        <span className="text-sm text-gray-400">{comment.createdAt}</span>
                      </div>
                      <p className="text-gray-600">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-medium text-gray-800 mb-4">处理操作</h3>
        <div className="flex flex-wrap gap-3">
          {course.status === 'pending' && (
            <>
              <button
                onClick={handleApprove}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>审核通过</span>
              </button>
              <button
                onClick={handleReject}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>退回修改</span>
              </button>
              <button
                onClick={handleUrgent}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>标记催办</span>
              </button>
            </>
          )}
          {course.status === 'urgent' && (
            <>
              <button
                onClick={handleApprove}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>审核通过</span>
              </button>
              <button
                onClick={handleReject}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>退回修改</span>
              </button>
            </>
          )}
          {course.status === 'approved' && (
            <>
              <button
                onClick={handleSupplement}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>申请补材料</span>
              </button>
              <button
                onClick={handleComplete}
                disabled={!canComplete}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  canComplete
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>完成课程</span>
                {!canComplete && <span className="text-xs ml-1">(材料未领完)</span>}
              </button>
            </>
          )}
          {course.status === 'rejected' && (
            <button
              onClick={() => updateCourseStatus(course.id, 'pending')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>重新提交</span>
            </button>
          )}
          {course.status === 'supplement' && (
            <>
              <button
                onClick={handleComplete}
                disabled={!canComplete}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  canComplete
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>完成课程</span>
                {!canComplete && <span className="text-xs ml-1">(材料未补完)</span>}
              </button>
            </>
          )}
          {course.status === 'completed' && (
            <p className="text-gray-500">课程已完成，材料已归还入库。</p>
          )}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">责任划分提示</h4>
            <p className="text-sm text-amber-700 mt-1">
              实验课程与材料领用之间的责任划分需明确标注。展教员负责课程设计与提交，设备工程师负责审核与材料确认，活动老师负责材料领用与使用反馈。任何环节的修改都应及时通知相关人员。课程完成后，材料会自动归还入库。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
