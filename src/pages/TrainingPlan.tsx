import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Dumbbell, Edit2, Trash2, X, Check, Calendar } from 'lucide-react';
import Layout from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { trainingPlans as initialTrainingPlans, members } from '../data/mockData';
import type { TrainingPlan, Exercise } from '../types';

const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const defaultExercise: Exercise = {
  name: '',
  sets: 3,
  reps: '12次',
  weight: 0,
};

export default function TrainingPlan() {
  const [searchParams] = useSearchParams();
  const urlMemberId = searchParams.get('memberId');
  const [selectedMember, setSelectedMember] = useState(urlMemberId || 'm2');
  const [currentWeek, setCurrentWeek] = useState(12);
  const [plans, setPlans] = useState<TrainingPlan[]>(initialTrainingPlans);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<string>('');
  const [editingExercises, setEditingExercises] = useState<Exercise[]>([]);
  const [inlineEditPlanId, setInlineEditPlanId] = useState<string | null>(null);
  const [inlineEditIndex, setInlineEditIndex] = useState<number | null>(null);
  const [inlineEditExercise, setInlineEditExercise] = useState<Exercise | null>(null);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlanDay, setNewPlanDay] = useState('周一');
  const [newExercises, setNewExercises] = useState<Exercise[]>([{ ...defaultExercise }]);
  const [toast, setToast] = useState<string | null>(null);

  const member = members.find((m) => m.id === selectedMember);
  const memberPlans = plans.filter((p) => p.memberId === selectedMember && p.week === currentWeek);
  const usedDays = memberPlans.map((p) => p.day);
  const availableDays = days.filter((d) => !usedDays.includes(d) || (editingPlanId && memberPlans.find((p) => p.id === editingPlanId)?.day === d));

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const resetAllEditState = () => {
    setEditingPlanId(null);
    setEditingDay('');
    setEditingExercises([]);
    setInlineEditPlanId(null);
    setInlineEditIndex(null);
    setInlineEditExercise(null);
    setShowAddPlan(false);
    setNewPlanDay('周一');
    setNewExercises([{ ...defaultExercise }]);
  };

  const handlePrevWeek = () => {
    if (currentWeek > 1) {
      resetAllEditState();
      setCurrentWeek(currentWeek - 1);
      showToast(`已切换到第 ${currentWeek - 1} 周`);
    }
  };

  const handleNextWeek = () => {
    resetAllEditState();
    setCurrentWeek(currentWeek + 1);
    showToast(`已切换到第 ${currentWeek + 1} 周`);
  };

  const handleAddPlan = () => {
    if (newExercises.some(e => !e.name.trim())) {
      showToast('请填写动作名称');
      return;
    }

    const newPlan: TrainingPlan = {
      id: `tp${Date.now()}`,
      memberId: selectedMember,
      memberName: member?.name || '',
      week: currentWeek,
      day: newPlanDay,
      exercises: newExercises.filter(e => e.name.trim()),
    };

    setPlans((prev) => [...prev, newPlan]);
    setShowAddPlan(false);
    setNewPlanDay(availableDays[0] || '周一');
    setNewExercises([{ ...defaultExercise }]);
    showToast(`${newPlanDay}训练计划已创建`);
  };

  const handleDeletePlan = (planId: string, day: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    if (editingPlanId === planId) {
      setEditingPlanId(null);
      setEditingDay('');
      setEditingExercises([]);
    }
    if (inlineEditPlanId === planId) {
      setInlineEditPlanId(null);
      setInlineEditIndex(null);
      setInlineEditExercise(null);
    }
    showToast(`${day}训练计划已删除`);
  };

  const handleStartPlanEdit = (plan: TrainingPlan) => {
    setInlineEditPlanId(null);
    setInlineEditIndex(null);
    setInlineEditExercise(null);
    setEditingPlanId(plan.id);
    setEditingDay(plan.day);
    setEditingExercises(plan.exercises.map(e => ({ ...e })));
  };

  const handleSavePlanEdit = () => {
    if (!editingPlanId) return;
    if (editingExercises.some(e => !e.name.trim())) {
      showToast('请填写动作名称');
      return;
    }

    setPlans((prev) =>
      prev.map((p) =>
        p.id === editingPlanId
          ? { ...p, day: editingDay, exercises: editingExercises.filter(e => e.name.trim()) }
          : p
      )
    );
    setEditingPlanId(null);
    setEditingDay('');
    setEditingExercises([]);
    showToast('训练计划已更新');
  };

  const handleCancelPlanEdit = () => {
    setEditingPlanId(null);
    setEditingDay('');
    setEditingExercises([]);
  };

  const handleEditAddExercise = () => {
    setEditingExercises((prev) => [...prev, { ...defaultExercise }]);
  };

  const handleEditRemoveExercise = (index: number) => {
    if (editingExercises.length <= 1) return;
    setEditingExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditUpdateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    setEditingExercises((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  };

  const handleStartInlineEdit = (planId: string, exerciseIndex: number, exercise: Exercise) => {
    setEditingPlanId(null);
    setEditingDay('');
    setEditingExercises([]);
    setInlineEditPlanId(planId);
    setInlineEditIndex(exerciseIndex);
    setInlineEditExercise({ ...exercise });
  };

  const handleSaveInlineEdit = () => {
    if (!inlineEditPlanId || inlineEditIndex === null || !inlineEditExercise) return;
    if (!inlineEditExercise.name.trim()) {
      showToast('请填写动作名称');
      return;
    }

    setPlans((prev) =>
      prev.map((p) =>
        p.id === inlineEditPlanId
          ? {
              ...p,
              exercises: p.exercises.map((e, i) =>
                i === inlineEditIndex ? inlineEditExercise : e
              ),
            }
          : p
      )
    );
    setInlineEditPlanId(null);
    setInlineEditIndex(null);
    setInlineEditExercise(null);
    showToast('动作已更新');
  };

  const handleCancelInlineEdit = () => {
    setInlineEditPlanId(null);
    setInlineEditIndex(null);
    setInlineEditExercise(null);
  };

  const handleDeleteExercise = (planId: string, exerciseIndex: number, exerciseName: string) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, exercises: p.exercises.filter((_, i) => i !== exerciseIndex) }
          : p
      )
    );
    showToast(`已删除动作：${exerciseName}`);
  };

  const handleAddExercise = (planId: string) => {
    const newExercise: Exercise = { name: '新动作', sets: 3, reps: '12次', weight: 0 };
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId ? { ...p, exercises: [...p.exercises, newExercise] } : p
      )
    );
    showToast('已添加新动作，点击可编辑');
  };

  const handleAddNewExerciseField = () => {
    setNewExercises((prev) => [...prev, { ...defaultExercise }]);
  };

  const handleUpdateNewExercise = (index: number, field: keyof Exercise, value: string | number) => {
    setNewExercises((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const handleRemoveNewExercise = (index: number) => {
    if (newExercises.length > 1) {
      setNewExercises((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const getAvailableDaysForPlan = (currentPlanDay: string) => {
    return days.filter((d) => !usedDays.includes(d) || d === currentPlanDay);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {toast && (
          <div className="fixed top-4 right-4 bg-teal-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">训练计划</h1>
            <p className="text-gray-500 mt-1">管理会员训练安排</p>
          </div>
          <Button onClick={() => { setNewPlanDay(availableDays[0] || '周一'); setShowAddPlan(true); }} disabled={availableDays.length === 0}>
            <Plus className="w-4 h-4 mr-1" />
            新建计划
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-500 mb-1">选择会员</label>
            <select
              value={selectedMember}
              onChange={(e) => { setSelectedMember(e.target.value); resetAllEditState(); }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <label className="block text-sm text-gray-500 mb-1">周次</label>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handlePrevWeek} disabled={currentWeek <= 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-4 py-2 bg-navy-50 text-navy-700 rounded-lg font-medium min-w-[100px] text-center">
                第 {currentWeek} 周
              </span>
              <Button variant="secondary" size="sm" onClick={handleNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {showAddPlan && (
          <Card className="border-2 border-orange-200 bg-orange-50">
            <Card.Body>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-orange-500" />
                  新建训练计划
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddPlan(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-500 mb-1">训练日</label>
                <select
                  value={newPlanDay}
                  onChange={(e) => setNewPlanDay(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  {availableDays.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 mb-4">
                <label className="block text-sm text-gray-500">训练动作</label>
                {newExercises.map((exercise, index) => (
                  <div key={index} className="flex gap-3 items-end p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">动作名称</label>
                      <input
                        type="text"
                        value={exercise.name}
                        onChange={(e) => handleUpdateNewExercise(index, 'name', e.target.value)}
                        placeholder="如：深蹲"
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-xs text-gray-500 mb-1">组数</label>
                      <input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => handleUpdateNewExercise(index, 'sets', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-gray-500 mb-1">次数</label>
                      <input
                        type="text"
                        value={exercise.reps}
                        onChange={(e) => handleUpdateNewExercise(index, 'reps', e.target.value)}
                        placeholder="12次"
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-xs text-gray-500 mb-1">重量(kg)</label>
                      <input
                        type="number"
                        value={exercise.weight}
                        onChange={(e) => handleUpdateNewExercise(index, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveNewExercise(index)}
                      disabled={newExercises.length <= 1}
                      className="p-2 mb-0.5"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={handleAddNewExerciseField} className="w-full">
                  <Plus className="w-4 h-4 mr-1" />
                  添加动作
                </Button>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setShowAddPlan(false)}>取消</Button>
                <Button onClick={handleAddPlan}>
                  <Check className="w-4 h-4 mr-1" />
                  创建计划
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        {member && (
          <Card>
            <Card.Body>
              <div className="flex items-center gap-4 mb-6">
                <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{member.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="info">{member.coachName}</Badge>
                    <span className="text-sm text-gray-500">目标：{member.goals.join('、')}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {memberPlans.map((plan) => (
                  <Card key={plan.id} className={`bg-gray-50 ${editingPlanId === plan.id ? 'ring-2 ring-orange-300' : ''}`}>
                    <Card.Body>
                      {editingPlanId === plan.id ? (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Edit2 className="w-5 h-5 text-orange-500" />
                              编辑计划
                            </h3>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="p-1" onClick={handleCancelPlanEdit}>
                                <X className="w-4 h-4 text-gray-400" />
                              </Button>
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-xs text-gray-500 mb-1">训练日</label>
                            <select
                              value={editingDay}
                              onChange={(e) => setEditingDay(e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm"
                            >
                              {getAvailableDaysForPlan(plan.day).map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2 mb-4">
                            <label className="block text-xs text-gray-500">训练动作</label>
                            {editingExercises.map((exercise, index) => (
                              <div key={index} className="flex gap-2 items-end p-2 bg-white rounded-lg border border-gray-200">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={exercise.name}
                                    onChange={(e) => handleEditUpdateExercise(index, 'name', e.target.value)}
                                    placeholder="动作名称"
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                  />
                                </div>
                                <div className="w-16">
                                  <input
                                    type="number"
                                    value={exercise.sets}
                                    onChange={(e) => handleEditUpdateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    placeholder="组"
                                  />
                                </div>
                                <div className="w-16">
                                  <input
                                    type="text"
                                    value={exercise.reps}
                                    onChange={(e) => handleEditUpdateExercise(index, 'reps', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    placeholder="次数"
                                  />
                                </div>
                                <div className="w-16">
                                  <input
                                    type="number"
                                    value={exercise.weight}
                                    onChange={(e) => handleEditUpdateExercise(index, 'weight', parseFloat(e.target.value) || 0)}
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    placeholder="kg"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1"
                                  onClick={() => handleEditRemoveExercise(index)}
                                  disabled={editingExercises.length <= 1}
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                                </Button>
                              </div>
                            ))}
                            <Button variant="secondary" size="sm" onClick={handleEditAddExercise} className="w-full">
                              <Plus className="w-4 h-4 mr-1" />
                              添加动作
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSavePlanEdit} className="flex-1">
                              <Check className="w-3.5 h-3.5 mr-1" />
                              保存
                            </Button>
                            <Button size="sm" variant="secondary" onClick={handleCancelPlanEdit} className="flex-1">
                              取消
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Dumbbell className="w-5 h-5 text-orange-500" />
                              {plan.day}
                            </h3>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1"
                                onClick={() => handleStartPlanEdit(plan)}
                                title="编辑计划"
                              >
                                <Edit2 className="w-4 h-4 text-gray-400 hover:text-orange-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1"
                                onClick={() => handleDeletePlan(plan.id, plan.day)}
                                title="删除计划"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-coral-500" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {plan.exercises.map((exercise, index) => (
                              <div key={index}>
                                {inlineEditPlanId === plan.id && inlineEditIndex === index ? (
                                  <div className="p-3 bg-white rounded-lg border-2 border-orange-200 space-y-2">
                                    <input
                                      type="text"
                                      value={inlineEditExercise?.name || ''}
                                      onChange={(e) =>
                                        setInlineEditExercise((prev) =>
                                          prev ? { ...prev, name: e.target.value } : null
                                        )
                                      }
                                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                    <div className="flex gap-2">
                                      <div className="flex-1">
                                        <label className="text-xs text-gray-500">组数</label>
                                        <input
                                          type="number"
                                          value={inlineEditExercise?.sets || 0}
                                          onChange={(e) =>
                                            setInlineEditExercise((prev) =>
                                              prev ? { ...prev, sets: parseInt(e.target.value) || 0 } : null
                                            )
                                          }
                                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <label className="text-xs text-gray-500">次数</label>
                                        <input
                                          type="text"
                                          value={inlineEditExercise?.reps || ''}
                                          onChange={(e) =>
                                            setInlineEditExercise((prev) =>
                                              prev ? { ...prev, reps: e.target.value } : null
                                            )
                                          }
                                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <label className="text-xs text-gray-500">重量</label>
                                        <input
                                          type="number"
                                          value={inlineEditExercise?.weight || 0}
                                          onChange={(e) =>
                                            setInlineEditExercise((prev) =>
                                              prev ? { ...prev, weight: parseFloat(e.target.value) || 0 } : null
                                            )
                                          }
                                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={handleSaveInlineEdit} className="flex-1">
                                        <Check className="w-3 h-3 mr-1" />
                                        保存
                                      </Button>
                                      <Button size="sm" variant="secondary" onClick={handleCancelInlineEdit} className="flex-1">
                                        取消
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-white rounded-lg border border-gray-100 group hover:border-orange-200 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-gray-900">{exercise.name}</span>
                                      <div className="flex items-center gap-1">
                                        {exercise.weight && exercise.weight > 0 && (
                                          <Badge variant="warning">{exercise.weight}kg</Badge>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => handleStartInlineEdit(plan.id, index, exercise)}
                                        >
                                          <Edit2 className="w-3.5 h-3.5 text-gray-400 hover:text-orange-500" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => handleDeleteExercise(plan.id, index, exercise.name)}
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-coral-500" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                      <span>{exercise.sets} 组</span>
                                      <span>{exercise.reps}</span>
                                    </div>
                                    {exercise.notes && (
                                      <p className="text-xs text-navy-600 mt-2 bg-navy-50 px-2 py-1 rounded">
                                        💡 {exercise.notes}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => handleAddExercise(plan.id)}>
                            <Plus className="w-4 h-4 mr-1" />
                            添加动作
                          </Button>
                        </>
                      )}
                    </Card.Body>
                  </Card>
                ))}

                {availableDays.slice(0, 2).map((day) => (
                  <Card key={day} className="border-dashed border-2 bg-gray-50">
                    <Card.Body className="flex flex-col items-center justify-center py-12">
                      <Dumbbell className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 mb-4">{day}暂无训练安排</p>
                      <Button variant="secondary" size="sm" onClick={() => { setNewPlanDay(day); setShowAddPlan(true); }}>
                        <Plus className="w-4 h-4 mr-1" />
                        添加计划
                      </Button>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    </Layout>
  );
}
