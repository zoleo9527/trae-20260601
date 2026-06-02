import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Dumbbell, Edit2, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { trainingPlans, members } from '../data/mockData';

const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function TrainingPlan() {
  const [selectedMember, setSelectedMember] = useState('m2');
  const [currentWeek, setCurrentWeek] = useState(12);

  const member = members.find((m) => m.id === selectedMember);
  const memberPlans = trainingPlans.filter((p) => p.memberId === selectedMember);

  return (
    <Layout role="coach">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">训练计划</h1>
            <p className="text-gray-500 mt-1">管理会员训练安排</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            新建计划
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-500 mb-1">选择会员</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <label className="block text-sm text-gray-500 mb-1">周次</label>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-4 py-2 bg-navy-50 text-navy-700 rounded-lg font-medium min-w-[100px] text-center">
                第 {currentWeek} 周
              </span>
              <Button variant="secondary" size="sm" onClick={() => setCurrentWeek(currentWeek + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {member && (
          <Card>
            <Card.Body>
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{member.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="info">{member.coachName}</Badge>
                    <span className="text-sm text-gray-500">
                      目标：{member.goals.join('、')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {memberPlans.map((plan) => (
                  <Card key={plan.id} className="bg-gray-50">
                    <Card.Body>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Dumbbell className="w-5 h-5 text-orange-500" />
                          {plan.day}
                        </h3>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="p-1">
                            <Edit2 className="w-4 h-4 text-gray-400" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1">
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {plan.exercises.map((exercise, index) => (
                          <div
                            key={index}
                            className="p-3 bg-white rounded-lg border border-gray-100"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">
                                {exercise.name}
                              </span>
                              {exercise.weight && exercise.weight > 0 && (
                                <Badge variant="warning">{exercise.weight}kg</Badge>
                              )}
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
                        ))}
                      </div>

                      <Button variant="secondary" size="sm" className="w-full mt-4">
                        <Plus className="w-4 h-4 mr-1" />
                        添加动作
                      </Button>
                    </Card.Body>
                  </Card>
                ))}

                {days
                  .filter((d) => !memberPlans.some((p) => p.day === d))
                  .slice(0, 2)
                  .map((day) => (
                    <Card key={day} className="border-dashed border-2 bg-gray-50">
                      <Card.Body className="flex flex-col items-center justify-center py-12">
                        <Dumbbell className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 mb-4">{day}暂无训练安排</p>
                        <Button variant="secondary" size="sm">
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
