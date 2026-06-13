import React from 'react';
import { Row, Col } from 'antd';
import StatisticsCard from '../../../components/business/StatisticsCard';
import { useStore } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/helpers';

const RecruiterDashboard: React.FC = () => {
  const { settlements, appeals, positions, candidates, user } = useStore();

  const mySettlements = settlements.filter((s) => s.recruiterId === user?.id);
  const myAppeals = appeals.filter((a) => a.recruiterId === user?.id);
  const myPositions = positions.filter((p) => p.recruiterId === user?.id);
  const myCandidates = candidates.filter((c) => c.recruiterId === user?.id);

  const pendingSettlements = mySettlements.filter(
    (s) => s.status === 'pending_hr_confirm' || s.status === 'pending_operator_review'
  ).length;
  const pendingAppeals = myAppeals.filter(
    (a) => a.status === 'pending_recruiter_response'
  ).length;
  const completedSettlements = mySettlements.filter(
    (s) => s.status === 'completed'
  ).length;
  const totalAmount = mySettlements
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + s.settlementAmount, 0);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">任务概览</h2>
        <p className="text-gray-600 mt-1">查看招聘顾问工作台的整体数据统计</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticsCard
            title="待处理结算"
            value={pendingSettlements}
            icon="file"
            color="blue"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticsCard
            title="待补充申诉"
            value={pendingAppeals}
            icon="alert"
            color="orange"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticsCard
            title="已完成结算"
            value={completedSettlements}
            icon="trending-up"
            color="green"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticsCard
            title="本月业绩"
            value={formatCurrency(totalAmount)}
            icon="dollar"
            color="blue"
          />
        </Col>
      </Row>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">岗位统计</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">发布岗位</p>
                <p className="text-sm text-gray-600">{myPositions.length}个岗位</p>
              </div>
              <div className="text-blue-600 font-bold text-xl">
                {myPositions.length}
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">候选人</p>
                <p className="text-sm text-gray-600">{myCandidates.length}人</p>
              </div>
              <div className="text-green-600 font-bold text-xl">
                {myCandidates.length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">返费结算进度</h3>
          <div className="space-y-3">
            {mySettlements.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 border-b border-gray-100">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{s.position}</p>
                  <p className="text-xs text-gray-500">{s.company}</p>
                </div>
                <div className="text-xs text-gray-500">{s.updatedAt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;