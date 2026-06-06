import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CaseDetailResponse, STATUS_COLORS, STATUS_LABELS, StatusLog, UserRole } from '../types';

interface CaseDetailPageProps {
  caseId: string;
  role: UserRole;
  onBack: () => void;
}

const CaseDetailPage: React.FC<CaseDetailPageProps> = ({ caseId, role, onBack }) => {
  const [detail, setDetail] = useState<CaseDetailResponse | null>(null);
  const [logs, setLogs] = useState<StatusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'data' | 'settlement' | 'logs'>('overview');

  useEffect(() => {
    loadDetail();
    loadLogs();
  }, [caseId, role]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await api.getCaseDetail(caseId, role);
      setDetail(data);
    } catch (error) {
      console.error('Failed to load case detail:', error);
    }
    setLoading(false);
  };

  const loadLogs = async () => {
    try {
      const data = await api.getCaseLogs(caseId, role);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!detail) {
    return <div className="error">加载失败</div>;
  }

  const { case: caseRecord, demand, talent, script, relatedUsers } = detail;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn-back" onClick={onBack}>← 返回</button>
          <h2>结案详情</h2>
        </div>
        <div className="case-status-header">
          <span
            className="status-badge large"
            style={{ backgroundColor: STATUS_COLORS[caseRecord.status] }}
          >
            {STATUS_LABELS[caseRecord.status]}
          </span>
          {caseRecord.delayedDays ? (
            <span className="delayed-badge large">已延期 {caseRecord.delayedDays} 天</span>
          ) : null}
        </div>
      </div>

      <div className="tabs">
        <button
          className={activeTab === 'overview' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('overview')}
        >
          基本信息
        </button>
        <button
          className={activeTab === 'data' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('data')}
        >
          结案数据
        </button>
        <button
          className={activeTab === 'settlement' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('settlement')}
        >
          费用结算
        </button>
        <button
          className={activeTab === 'logs' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('logs')}
        >
          状态变更日志
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="section-grid">
            <div className="info-card">
              <h3>品牌需求</h3>
              <div className="info-row">
                <span className="label">品牌名称</span>
                <span className="value">{demand?.brandName}</span>
              </div>
              <div className="info-row">
                <span className="label">产品名称</span>
                <span className="value">{demand?.productName}</span>
              </div>
              <div className="info-row">
                <span className="label">预算</span>
                <span className="value">¥{demand?.budget?.toLocaleString()}</span>
              </div>
              <div className="info-row">
                <span className="label">需求描述</span>
                <span className="value">{demand?.demandDescription}</span>
              </div>
              <div className="info-row">
                <span className="label">商务对接人</span>
                <span className="value">{relatedUsers.business?.name}</span>
              </div>
            </div>

            <div className="info-card">
              <h3>达人信息</h3>
              <div className="info-row">
                <span className="label">达人名称</span>
                <span className="value">{talent?.name}</span>
              </div>
              <div className="info-row">
                <span className="label">平台</span>
                <span className="value">{talent?.platform}</span>
              </div>
              <div className="info-row">
                <span className="label">粉丝数</span>
                <span className="value">{talent?.followers?.toLocaleString()}</span>
              </div>
              <div className="info-row">
                <span className="label">分类</span>
                <span className="value">{talent?.category}</span>
              </div>
              <div className="info-row">
                <span className="label">达人经纪</span>
                <span className="value">{relatedUsers.agent?.name}</span>
              </div>
            </div>

            <div className="info-card">
              <h3>脚本信息</h3>
              <div className="info-row">
                <span className="label">版本</span>
                <span className="value">v{script?.version}</span>
              </div>
              <div className="info-row">
                <span className="label">状态</span>
                <span className="value">{script?.status}</span>
              </div>
              <div className="info-row">
                <span className="label">内容摘要</span>
                <span className="value">{script?.content}</span>
              </div>
              {script?.remark && (
                <div className="info-row">
                  <span className="label">修改备注</span>
                  <span className="value">{script.remark}</span>
                </div>
              )}
            </div>

            {(caseRecord.rejectReason || caseRecord.supplementaryRemark) && (
              <div className="info-card warning">
                <h3>特殊记录</h3>
                {caseRecord.rejectReason && (
                  <div className="info-row">
                    <span className="label">驳回原因</span>
                    <span className="value reject">{caseRecord.rejectReason}</span>
                  </div>
                )}
                {caseRecord.supplementaryRemark && (
                  <div className="info-row">
                    <span className="label">补充备注</span>
                    <span className="value">{caseRecord.supplementaryRemark}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'data' && (
          <div className="info-card">
            <h3>结案数据</h3>
            {caseRecord.settlementData ? (
              <>
                <div className="data-grid">
                  <div className="data-item">
                    <span className="data-label">播放量</span>
                    <span className="data-value">{caseRecord.settlementData.views.toLocaleString()}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">点赞数</span>
                    <span className="data-value">{caseRecord.settlementData.likes.toLocaleString()}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">评论数</span>
                    <span className="data-value">{caseRecord.settlementData.comments.toLocaleString()}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">转发数</span>
                    <span className="data-value">{caseRecord.settlementData.shares.toLocaleString()}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">点击率</span>
                    <span className="data-value">{caseRecord.settlementData.clickRate}%</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">转化率</span>
                    <span className="data-value">{caseRecord.settlementData.conversionRate}%</span>
                  </div>
                </div>
                <div className="info-row">
                  <span className="label">数据提交时间</span>
                  <span className="value">{caseRecord.dataSubmittedAt ? new Date(caseRecord.dataSubmittedAt).toLocaleString() : '-'}</span>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>暂无结案数据</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settlement' && (
          <div className="info-card">
            <h3>费用结算</h3>
            {caseRecord.settlementData ? (
              <>
                <div className="data-grid">
                  <div className="data-item">
                    <span className="data-label">实际费用</span>
                    <span className="data-value money">¥{caseRecord.settlementData.actualFee.toLocaleString()}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">平台服务费</span>
                    <span className="data-value money">¥{caseRecord.settlementData.platformFee.toLocaleString()}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">达人费用</span>
                    <span className="data-value money">¥{caseRecord.settlementData.talentFee.toLocaleString()}</span>
                  </div>
                </div>
                <div className="info-row">
                  <span className="label">结算复核时间</span>
                  <span className="value">{caseRecord.settlementReviewedAt ? new Date(caseRecord.settlementReviewedAt).toLocaleString() : '-'}</span>
                </div>
                {caseRecord.settlementRemark && (
                  <div className="info-row">
                    <span className="label">结算备注</span>
                    <span className="value">{caseRecord.settlementRemark}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="label">付款状态</span>
                  <span className="value">
                    {caseRecord.paidAt
                      ? `已付款 ¥${caseRecord.paidAmount?.toLocaleString()} (${new Date(caseRecord.paidAt).toLocaleDateString()})`
                      : '待付款'}
                  </span>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>暂无结算数据</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="info-card">
            <h3>状态变更日志</h3>
            <div className="timeline">
              {logs.map((log, index) => (
                <div key={log.id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span
                        className="status-badge small"
                        style={{ backgroundColor: STATUS_COLORS[log.toStatus] }}
                      >
                        {log.toStatusLabel}
                      </span>
                      <span className="timeline-operator">
                        {log.operatorRoleLabel} 操作
                      </span>
                      <span className="timeline-time">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {log.remark && (
                      <p className="timeline-remark">{log.remark}</p>
                    )}
                    {log.fromStatus && (
                      <p className="timeline-from">
                        从「{log.fromStatusLabel}」变更为「{log.toStatusLabel}」
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseDetailPage;
