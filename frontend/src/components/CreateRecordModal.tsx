import { useState } from 'react';
import { X } from 'lucide-react';

interface CreateRecordModalProps {
  onClose: () => void;
  onCreate: (data: any) => void;
}

export const CreateRecordModal = ({ onClose, onCreate }: CreateRecordModalProps) => {
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    instrument: '',
    examLevel: '',
    trackName: '',
    trackType: 'required' as const,
    practicePlan: {
      weeklyFocus: '',
      durationWeeks: 4,
      startDate: '',
      endDate: '',
      dailyGoals: [
        { dayOfWeek: 1, durationMinutes: 30, focusPoints: [], tempoRange: '' },
        { dayOfWeek: 2, durationMinutes: 30, focusPoints: [], tempoRange: '' },
        { dayOfWeek: 3, durationMinutes: 30, focusPoints: [], tempoRange: '' },
        { dayOfWeek: 4, durationMinutes: 30, focusPoints: [], tempoRange: '' },
        { dayOfWeek: 5, durationMinutes: 30, focusPoints: [], tempoRange: '' },
        { dayOfWeek: 6, durationMinutes: 60, focusPoints: [], tempoRange: '' },
        { dayOfWeek: 7, durationMinutes: 60, focusPoints: [], tempoRange: '' },
      ],
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDate = new Date(formData.practicePlan.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (formData.practicePlan.durationWeeks * 7));
    
    const data = {
      ...formData,
      practicePlan: {
        ...formData.practicePlan,
        endDate: endDate.toISOString(),
        id: '',
        recordId: '',
        progress: 0,
      },
    };
    
    onCreate(data);
  };

  const handleDailyGoalChange = (dayIndex: number, field: string, value: number | string | string[]) => {
    const updatedGoals = [...formData.practicePlan.dailyGoals];
    updatedGoals[dayIndex] = { ...updatedGoals[dayIndex], [field]: value };
    setFormData({
      ...formData,
      practicePlan: { ...formData.practicePlan, dailyGoals: updatedGoals },
    });
  };

  const daysOfWeek = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">新建考级曲目记录</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学员姓名 *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入学员姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学员ID</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="可选"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">乐器 *</label>
                  <select
                    required
                    value={formData.instrument}
                    onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择乐器</option>
                    <option value="钢琴">钢琴</option>
                    <option value="小提琴">小提琴</option>
                    <option value="吉他">吉他</option>
                    <option value="古筝">古筝</option>
                    <option value="架子鼓">架子鼓</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">考级级别 *</label>
                  <input
                    type="text"
                    required
                    value={formData.examLevel}
                    onChange={(e) => setFormData({ ...formData, examLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：钢琴5级"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">曲目名称 *</label>
                  <input
                    type="text"
                    required
                    value={formData.trackName}
                    onChange={(e) => setFormData({ ...formData, trackName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入曲目名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">曲目类型</label>
                  <select
                    value={formData.trackType}
                    onChange={(e) => setFormData({ ...formData, trackType: e.target.value as 'required' | 'optional' })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="required">必考</option>
                    <option value="optional">选考</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">练习计划</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">计划周期（周）</label>
                    <input
                      type="number"
                      min="1"
                      max="52"
                      value={formData.practicePlan.durationWeeks}
                      onChange={(e) => setFormData({
                        ...formData,
                        practicePlan: { ...formData.practicePlan, durationWeeks: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                    <input
                      type="date"
                      value={formData.practicePlan.startDate}
                      onChange={(e) => setFormData({
                        ...formData,
                        practicePlan: { ...formData.practicePlan, startDate: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">本周重点</label>
                    <input
                      type="text"
                      value={formData.practicePlan.weeklyFocus}
                      onChange={(e) => setFormData({
                        ...formData,
                        practicePlan: { ...formData.practicePlan, weeklyFocus: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="如：练习琶音技巧"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">每日练习目标</label>
                  <div className="grid grid-cols-7 gap-2">
                    {formData.practicePlan.dailyGoals.map((goal, index) => (
                      <div key={goal.dayOfWeek} className="bg-gray-50 rounded-lg p-3">
                        <div className="text-center text-sm font-medium text-gray-700 mb-2">{daysOfWeek[index]}</div>
                        <div className="space-y-2">
                          <input
                            type="number"
                            min="10"
                            max="180"
                            value={goal.durationMinutes}
                            onChange={(e) => handleDailyGoalChange(index, 'durationMinutes', Number(e.target.value))}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="分钟"
                          />
                          <input
                            type="text"
                            value={goal.tempoRange}
                            onChange={(e) => handleDailyGoalChange(index, 'tempoRange', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="速度范围"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
                >
                  创建记录
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
