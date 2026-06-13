import React from 'react';
import { Row, Col } from 'antd';
import StatisticsCard from '../../../components/business/StatisticsCard';
import { useStore } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/helpers';

const HrDashboard: React.FC = () => {
  const { settlements, appeals, positions, candidates, user } = useStore();

  const mySettlements = settlements.filter((s) => s.hrId === user?.id);
  const myAppeals = appeals.filter((a) => a.hrId === user?.id);
  const myPositions = positions.filter((p) => p.company.includes('XX'));
  const myCandidates = candidates.filter((c) => c.positionId);

  const pendingSettlements = mySettlements.filter(
    (s) => s.status === 'pending_hr_confirm'
  ).length;
  const pendingAppeals = myAppeals.filter(
    (a) => a.status === 'pending_recruiter_response' || a.status === 'pending_operator_arbitration'
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
        <p className="text-gray-600 mt-1">查看企业HR工作台的整体数据统计</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticsCard
            title="待确认结算"
            value={pendingSettlements}
            icon="file"
            color="blue"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticsCard
            title="处理中申诉"
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
            title="本月返费"
            value={formatCurrency(totalAmount)}
            icon="dollar"
            color="blue"
          />
        </Col>
      </Row>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">待处理任务</h3>
          <div className="space-y-4">
            {pendingSettlements > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">返费结算确认</p>
                  <p className="text-sm text-gray-600">
                    有 {pendingSettlements} 条结算单待确认
                  </p>
                </div>
                <div className="text-blue-600 font-bold text-xl">
                  {pendingSettlements}
                </div>
              </div>
            )}
            {pendingAppeals > 0 && (
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">异常申诉</p>
                  <p className="text-sm text-gray-600">
                    有 {pendingAppeals} 条申诉处理中
                  </p>
                </div>
                <div className="text-orange-600 font-bold text-xl">
                  {pendingAppeals}
                </div>
              </div>
            )}
            {pendingSettlements === 0 && pendingAppeals === 0 && (
              <div className="text-center py-8 text-gray-500">
                暂无待处理任务
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">近期动态</h3>
          <div className="space-y-3">
            {mySettlements.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3 border-b border-gray-100">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{s.position}</p>
                  <p className="text-xs text-gray-500">{s.recruiterName}</p>
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

export default HrDashboard;