import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Typography, Tag, List, Avatar, Space, Button, Empty, Spin, Progress, Divider, Tooltip } from 'antd';
import {
  ExclamationCircleOutlined, ClockCircleOutlined, UserOutlined,
  WarningOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ThunderboltOutlined, EyeOutlined, SearchOutlined, AppstoreOutlined as EggOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useAuth, ROLE_LABELS, ROLE_COLORS } from '../contexts/AuthContext';
import { api, SHIFT_LABELS, INSPECTION_STATUS, EGG_STATUS, EXCEPTION_STATUS, SEVERITY_LABELS } from '../api';
import ExceptionDrawer from '../components/ExceptionDrawer';

const { Title, Text, Paragraph } = Typography;

const COOP_STATUS_COLORS = {
  pending: '#f4a261',
  in_progress: '#00b4d8',
  pending_confirm: '#00b4d8',
  completed: '#2ec4b6',
  abnormal: '#e63946',
};

const COOP_STATUS_LABELS = {
  pending: '待巡检',
  in_progress: '巡检中',
  pending_confirm: '待确认',
  completed: '已完成',
  abnormal: '异常',
};

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = n => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function getElapsedClass(hours) {
  if (hours >= 2) return 'overdue';
  if (hours >= 1) return 'warning';
  return 'normal';
}

function getEggReason(item) {
  if (item.inspection_status === 'abnormal') {
    return { text: '关联巡检卡异常，产蛋中断', color: '#e63946' };
  }
  if (item.inspection_status === 'pending' || item.inspection_status === 'in_progress') {
    return { text: '巡检尚未完成，产蛋数据无法关联', color: '#ff6b35' };
  }
  if (item.inspection_status === 'pending_confirm') {
    return { text: '巡检待确认，产蛋数据等待关联', color: '#f4a261' };
  }
  if (item.status === 'abnormal' && item.notes) {
    return { text: item.notes, color: '#e63946' };
  }
  if (item.status === 'pending') {
    return { text: '等待分拣员录入', color: '#8c8c8c' };
  }
  return { text: '未知原因', color: '#8c8c8c' };
}

function PressureCard({ title, icon, count, suffix, color, subIcon, subText, onClick }) {
  return (
    <Card
      className={`pressure-stat-card ${color}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      hoverable={!!onClick}
      bodyStyle={{ padding: '16px 20px' }}
    >
      <Statistic
        title={<span style={{ color: '#8c8c8c', fontSize: 13 }}>{title}</span>}
        value={count}
        suffix={suffix}
        valueStyle={{
          color: color === 'danger' ? '#e63946' : color === 'warn' ? '#f4a261' : '#2ec4b6',
          fontSize: 36,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
        }}
        prefix={icon}
      />
      {subText && (
        <div style={{ marginTop: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          {subIcon}
          <span style={{ color: color === 'danger' ? 'rgba(230,57,70,0.9)' : 'rgba(244,162,97,0.9)' }}>{subText}</span>
        </div>
      )}
    </Card>
  );
}

function FlowStepBar() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 8, flexWrap: 'wrap' }}>
      <span className="flow-step done">待巡检</span>
      <span className="flow-arrow">→</span>
      <span className="flow-step stuck">巡检中</span>
      <span className="flow-arrow">→</span>
      <span className="flow-step">待确认</span>
      <span className="flow-arrow">→</span>
      <span className="flow-step">已完成</span>
    </div>
  );
}

function CoopStatusGrid({ houses, onNavigate }) {
  return (
    <Row gutter={[10, 10]}>
      {houses.map(h => {
        const status = h.latest_inspection_status || 'pending';
        const statusColor = COOP_STATUS_COLORS[status] || '#666';
        const isAbnormal = status === 'abnormal' || h.open_exceptions > 0;

        return (
          <Col xs={8} sm={6} md={4} lg={3} key={h.id}>
            <Card
              size="small"
              className={isAbnormal ? 'coop-card-abnormal' : 'coop-card'}
              style={{
                borderLeft: `3px solid ${statusColor}`,
                background: isAbnormal ? 'rgba(230,57,70,0.08)' : 'rgba(22,33,62,0.6)',
                cursor: 'pointer',
                borderRadius: 6,
              }}
              bodyStyle={{ padding: '10px 8px' }}
              onClick={() => onNavigate('/inspections')}
              hoverable
            >
              <div style={{ textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: statusColor }}>{h.code}</div>
                <div style={{ fontSize: 10, color: '#8c8c8c', marginBottom: 4 }}>{h.breed} {h.age_weeks}周</div>
                <Tag
                  color={isAbnormal ? 'error' : status === 'completed' ? 'success' : 'processing'}
                  style={{ fontSize: 10, margin: 0, padding: '0 4px' }}
                >
                  {COOP_STATUS_LABELS[status] || '未知'}
                </Tag>
                <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                  {h.pending_inspections > 0 && <span className="pressure-badge urgent" style={{ fontSize: 9, padding: '1px 5px' }}>巡检{h.pending_inspections}</span>}
                  {h.pending_confirm_inspections > 0 && <span className="pressure-badge info" style={{ fontSize: 9, padding: '1px 5px' }}>待确{h.pending_confirm_inspections}</span>}
                  {h.pending_egg_records > 0 && <span className="pressure-badge warning" style={{ fontSize: 9, padding: '1px 5px' }}>产蛋{h.pending_egg_records}</span>}
                  {h.open_exceptions > 0 && <span className="pressure-badge critical" style={{ fontSize: 9, padding: '1px 5px' }}>异常{h.open_exceptions}</span>}
                  {!isAbnormal && h.pending_inspections === 0 && h.pending_confirm_inspections === 0 && h.pending_egg_records === 0 && (
                    <span className="pressure-badge normal" style={{ fontSize: 9, padding: '1px 5px' }}>正常</span>
                  )}
                </div>
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exceptionDrawer, setExceptionDrawer] = useState({ open: false, exceptionId: null });
  const [now, setNow] = useState(Date.now());
  const timerRef = useRef(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const d = await api.dashboard.pressure();
      setData(d);
      const h = await api.dashboard.houses();
      setHouses(h.houses || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const {
    pendingInspections = [],
    stuckCards = [],
    incompleteEggRecords = [],
    openExceptions = [],
    todayInspectionStats,
    todayEggStats,
    responsibilityMap = [],
  } = data || {};

  const criticalExceptions = openExceptions.filter(e => e.severity === 'critical');
  const abnormalEggs = incompleteEggRecords.filter(r => r.status === 'abnormal');

  const totalPressure = stuckCards.length + abnormalEggs.length + criticalExceptions.length;
  const pressureLevel = totalPressure > 5 ? 'danger' : totalPressure > 2 ? 'warn' : 'ok';
  const pressureLabel = pressureLevel === 'danger' ? '高压' : pressureLevel === 'warn' ? '关注' : '平稳';

  const sortedResponsibility = useMemo(() => {
    return [...responsibilityMap].sort((a, b) => {
      const ta = a.pending_inspections + a.pending_egg_records + a.open_exceptions;
      const tb = b.pending_inspections + b.pending_egg_records + b.open_exceptions;
      return tb - ta;
    });
  }, [responsibilityMap]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, background: '#0f0f1e', minHeight: '60vh' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#8c8c8c' }}>加载压力数据...</div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0f0f1e', minHeight: '100vh', padding: '0 0 32px 0' }}>

      {/* ===== 1. HEADER ===== */}
      <div style={{
        background: 'linear-gradient(90deg, #0f0f1e 0%, #16213e 50%, #0f0f1e 100%)',
        borderBottom: '1px solid rgba(255,107,53,0.2)',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThunderboltOutlined style={{ color: '#ff6b35', fontSize: 20 }} />
          <Title level={4} style={{ margin: 0, color: '#e0e0e0' }}>压力看板</Title>
          <span
            className={`pressure-badge ${pressureLevel}`}
            style={{
              fontSize: 13,
              padding: '4px 14px',
              animation: pressureLevel === 'danger' ? 'pulse-red 1.5s infinite' : 'none',
            }}
          >
            {pressureLabel}
          </span>
          {totalPressure > 0 && (
            <span className="mono" style={{ color: pressureLevel === 'danger' ? '#e63946' : '#f4a261', fontSize: 13 }}>
              {totalPressure}项待处理
            </span>
          )}
        </div>
        <Button
          onClick={fetchData}
          icon={<EyeOutlined />}
          size="small"
          style={{ borderColor: 'rgba(255,107,53,0.3)', color: '#ff6b35' }}
        >
          刷新
        </Button>
      </div>

      <div style={{ padding: '16px 24px 0' }}>

        {/* ===== 2. THREE PRESSURE STAT CARDS ===== */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <PressureCard
              title="待处理巡检卡"
              icon={<SearchOutlined />}
              count={pendingInspections.length}
              suffix="张"
              color={pendingInspections.length > 0 ? 'danger' : 'ok'}
              subIcon={<ClockCircleOutlined style={{ color: '#e63946' }} />}
              subText={stuckCards.length > 0 ? `${stuckCards.length}张已超时卡住` : undefined}
              onClick={() => navigate('/inspections')}
            />
          </Col>
          <Col xs={24} sm={8}>
            <PressureCard
              title="未完成产蛋记录"
              icon={<EggOutlined />}
              count={incompleteEggRecords.length}
              suffix="条"
              color={incompleteEggRecords.length > 0 ? 'warn' : 'ok'}
              subIcon={<ExclamationCircleOutlined style={{ color: '#f4a261' }} />}
              subText={abnormalEggs.length > 0 ? `${abnormalEggs.length}条标记异常` : undefined}
              onClick={() => navigate('/egg-records')}
            />
          </Col>
          <Col xs={24} sm={8}>
            <PressureCard
              title="未关闭异常"
              icon={<WarningOutlined />}
              count={openExceptions.length}
              suffix="项"
              color={openExceptions.length > 0 ? 'danger' : 'ok'}
              subIcon={<CloseCircleOutlined style={{ color: '#e63946' }} />}
              subText={criticalExceptions.length > 0 ? `${criticalExceptions.length}项紧急！` : undefined}
              onClick={() => navigate('/exceptions')}
            />
          </Col>
        </Row>

        {/* ===== 3. TODAY'S PROGRESS (compact) ===== */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} md={12}>
            <Card
              size="small"
              style={{ background: 'rgba(22,33,62,0.6)' }}
              bodyStyle={{ padding: '10px 16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <ClockCircleOutlined style={{ color: '#e63946', fontSize: 13 }} />
                <Text style={{ color: '#e0e0e0', fontSize: 13, fontWeight: 600 }}>今日巡检进度</Text>
              </div>
              {todayInspectionStats && todayInspectionStats.total > 0 ? (
                <>
                  <Progress
                    percent={Math.round((todayInspectionStats.completed / todayInspectionStats.total) * 100)}
                    strokeColor={todayInspectionStats.abnormal > 0 ? '#e63946' : '#2ec4b6'}
                    trailColor="rgba(255,255,255,0.06)"
                    format={() => (
                      <span className="mono" style={{ color: '#e0e0e0', fontSize: 12 }}>
                        {todayInspectionStats.completed}/{todayInspectionStats.total}
                      </span>
                    )}
                    size="small"
                  />
                  <Space size={4} wrap style={{ marginTop: 4 }}>
                    {todayInspectionStats.in_progress > 0 && <Tag color="blue" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>巡检中 {todayInspectionStats.in_progress}</Tag>}
                    {todayInspectionStats.pending > 0 && <Tag color="orange" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>待巡检 {todayInspectionStats.pending}</Tag>}
                    {todayInspectionStats.pending_confirm > 0 && <Tag color="cyan" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>待确认 {todayInspectionStats.pending_confirm}</Tag>}
                    {todayInspectionStats.abnormal > 0 && <Tag color="red" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>异常 {todayInspectionStats.abnormal}</Tag>}
                    {todayInspectionStats.completed > 0 && <Tag color="green" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>已完成 {todayInspectionStats.completed}</Tag>}
                  </Space>
                </>
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>今日暂无巡检任务</Text>
              )}
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              size="small"
              style={{ background: 'rgba(22,33,62,0.6)' }}
              bodyStyle={{ padding: '10px 16px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <EggOutlined style={{ color: '#722ed1', fontSize: 13 }} />
                <Text style={{ color: '#e0e0e0', fontSize: 13, fontWeight: 600 }}>今日产蛋进度</Text>
              </div>
              {todayEggStats && todayEggStats.total > 0 ? (
                <>
                  <Progress
                    percent={Math.round(((todayEggStats.confirmed + todayEggStats.recorded) / todayEggStats.total) * 100)}
                    strokeColor={todayEggStats.abnormal > 0 ? '#e63946' : '#2ec4b6'}
                    trailColor="rgba(255,255,255,0.06)"
                    format={() => (
                      <span className="mono" style={{ color: '#e0e0e0', fontSize: 12 }}>
                        {todayEggStats.confirmed + todayEggStats.recorded}/{todayEggStats.total}
                      </span>
                    )}
                    size="small"
                  />
                  <Space size={4} wrap style={{ marginTop: 4 }}>
                    {todayEggStats.confirmed > 0 && <Tag color="green" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>已确认 {todayEggStats.confirmed}</Tag>}
                    {todayEggStats.recorded > 0 && <Tag color="blue" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>已录入 {todayEggStats.recorded}</Tag>}
                    {todayEggStats.pending > 0 && <Tag color="orange" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>待录入 {todayEggStats.pending}</Tag>}
                    {todayEggStats.abnormal > 0 && <Tag color="red" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>异常 {todayEggStats.abnormal}</Tag>}
                  </Space>
                  {todayEggStats.total_eggs > 0 && (
                    <div style={{ marginTop: 4, fontSize: 12 }}>
                      <Text type="secondary">今日总产蛋：</Text>
                      <Text strong className="mono" style={{ color: '#2ec4b6' }}>{todayEggStats.total_eggs}</Text>
                      <Text type="secondary">枚</Text>
                    </div>
                  )}
                </>
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>今日暂无产蛋记录</Text>
              )}
            </Card>
          </Col>
        </Row>

        {/* ===== 4. THREE CORE QUESTIONS (MAIN AREA) ===== */}

        {/* 4a) 谁在处理？—— 责任人一览 */}
        <div className="question-block" style={{ marginBottom: 16 }}>
          <div className="question-title">
            <span className="q-icon" style={{ background: 'rgba(0,180,216,0.2)', color: '#00b4d8' }}>
              <UserOutlined style={{ fontSize: 11 }} />
            </span>
            <span style={{ color: '#e0e0e0' }}>谁在处理？</span>
            <span style={{ color: '#8c8c8c', fontSize: 13, fontWeight: 400 }}>—— 责任人一览</span>
          </div>
          {sortedResponsibility.length > 0 ? (
            <Row gutter={[10, 10]}>
              {sortedResponsibility.map(r => {
                const total = r.pending_inspections + r.pending_egg_records + r.open_exceptions;
                return (
                  <Col xs={12} sm={8} md={6} lg={4} key={r.user_id}>
                    <div className={`responsibility-card ${total > 3 ? 'overloaded' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Avatar size="small" style={{ background: ROLE_COLORS[r.role] || '#666' }}>{r.name?.[0] || '?'}</Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#e0e0e0', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                          <Tag color={ROLE_COLORS[r.role]} style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '16px' }}>{ROLE_LABELS[r.role]}</Tag>
                        </div>
                        {total > 3 && (
                          <span className="escalation-badge" style={{ fontSize: 9, padding: '1px 5px' }}>超载</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {r.pending_inspections > 0 && <span className="pressure-badge urgent" style={{ fontSize: 10 }}>巡检 {r.pending_inspections}</span>}
                        {r.pending_egg_records > 0 && <span className="pressure-badge warning" style={{ fontSize: 10 }}>产蛋 {r.pending_egg_records}</span>}
                        {r.open_exceptions > 0 && <span className="pressure-badge critical" style={{ fontSize: 10 }}>异常 {r.open_exceptions}</span>}
                        {total === 0 && <span className="pressure-badge normal" style={{ fontSize: 10 }}>无待办</span>}
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Empty description="暂无责任人数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>

        {/* 4b) 巡检卡卡在哪里？ */}
        <div className="question-block" style={{ marginBottom: 16 }}>
          <div className="question-title">
            <span className="q-icon" style={{ background: 'rgba(230,57,70,0.2)', color: '#e63946' }}>
              <ClockCircleOutlined style={{ fontSize: 11 }} />
            </span>
            <span style={{ color: '#e0e0e0' }}>巡检卡卡在哪里？</span>
          </div>

          {stuckCards.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stuckCards.map(item => {
                const startMs = item.started_at ? new Date(item.started_at).getTime() : 0;
                const elapsed = startMs > 0 ? now - startMs : item.hours_since_start * 3600000;
                const elapsedHours = elapsed / 3600000;
                const elapsedClass = getElapsedClass(elapsedHours);

                return (
                  <div
                    key={item.id}
                    className="stuck-card"
                    style={{
                      background: 'rgba(230,57,70,0.06)',
                      border: '1px solid rgba(230,57,70,0.2)',
                      borderRadius: 6,
                      padding: '12px 14px',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate('/inspections')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <HomeOutlined style={{ color: '#e63946' }} />
                          <Text strong style={{ color: '#e0e0e0', fontSize: 14 }}>{item.house_name}</Text>
                          <Tag style={{ margin: 0 }}>{SHIFT_LABELS[item.shift]}</Tag>
                          <Tag color="error" style={{ margin: 0 }}>卡住</Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                          饲养员 <Text strong style={{ color: '#00b4d8' }}>{item.feeder_name}</Text> 已开始巡检但未提交
                        </div>
                        <FlowStepBar />
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="mono" style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>已耗时</div>
                        <div className={`timer-elapsed ${elapsedClass}`} style={{ fontSize: 22 }}>
                          {formatElapsed(elapsed)}
                        </div>
                        {elapsedHours >= 4 && (
                          <span className="escalation-badge" style={{ marginTop: 6, display: 'inline-block' }}>
                            已超4h·场长介入
                          </span>
                        )}
                        {elapsedHours >= 2 && elapsedHours < 4 && (
                          <span className="escalation-badge" style={{ marginTop: 6, display: 'inline-block', background: 'linear-gradient(135deg, #f4a261, #ff6b35)' }}>
                            已超2h·自动升级
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : pendingInspections.length > 0 ? (
            <List
              size="small"
              dataSource={pendingInspections}
              renderItem={item => (
                <List.Item
                  style={{ cursor: 'pointer', borderColor: 'rgba(255,255,255,0.04)' }}
                  onClick={() => navigate('/inspections')}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size="small"
                        style={{
                          background: item.status === 'in_progress' ? '#00b4d8' : item.status === 'pending_confirm' ? '#00b4d8' : '#f4a261',
                        }}
                        icon={<SearchOutlined />}
                      />
                    }
                    title={
                      <Space size={4}>
                        <Text style={{ color: '#e0e0e0' }}>{item.house_name}</Text>
                        <Tag style={{ margin: 0 }}>{SHIFT_LABELS[item.shift]}</Tag>
                        <Tag
                          color={item.status === 'in_progress' ? 'processing' : item.status === 'pending_confirm' ? 'cyan' : 'warning'}
                          style={{ margin: 0 }}
                        >
                          {INSPECTION_STATUS[item.status]}
                        </Tag>
                      </Space>
                    }
                    description={<span style={{ color: '#8c8c8c' }}>饲养员 <Text strong style={{ color: '#00b4d8' }}>{item.feeder_name}</Text></span>}
                  />
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <CheckCircleOutlined style={{ color: '#2ec4b6', fontSize: 24, marginBottom: 8 }} />
              <div style={{ color: '#2ec4b6' }}>所有巡检卡已处理</div>
            </div>
          )}
        </div>

        {/* 4c) 产蛋记录为什么还没完成？ */}
        <div className="question-block" style={{ marginBottom: 16 }}>
          <div className="question-title">
            <span className="q-icon" style={{ background: 'rgba(114,46,209,0.2)', color: '#722ed1' }}>
              <EggOutlined style={{ fontSize: 11 }} />
            </span>
            <span style={{ color: '#e0e0e0' }}>产蛋记录为什么还没完成？</span>
          </div>

          {incompleteEggRecords.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {incompleteEggRecords.map(item => {
                const reason = getEggReason(item);
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(22,33,62,0.6)',
                      border: `1px solid ${reason.color}33`,
                      borderLeft: `3px solid ${reason.color}`,
                      borderRadius: 6,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => navigate('/egg-records')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text strong style={{ color: '#e0e0e0', fontSize: 13 }}>{item.house_name}</Text>
                          <Tag style={{ margin: 0 }}>{SHIFT_LABELS[item.shift]}</Tag>
                          <Tag
                            color={item.status === 'abnormal' ? 'error' : 'warning'}
                            style={{ margin: 0 }}
                          >
                            {EGG_STATUS[item.status]}
                          </Tag>
                        </div>
                        <div style={{ fontSize: 12, color: reason.color, fontWeight: 600 }}>
                          <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                          {reason.text}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 10, color: '#8c8c8c', marginBottom: 2 }}>分拣员</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                          <Avatar size="small" style={{ background: '#722ed1' }}>{item.sorter_name?.[0] || '?'}</Avatar>
                          <Text strong style={{ color: '#722ed1', fontSize: 13 }}>{item.sorter_name}</Text>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <CheckCircleOutlined style={{ color: '#2ec4b6', fontSize: 24, marginBottom: 8 }} />
              <div style={{ color: '#2ec4b6' }}>所有产蛋记录已完成</div>
            </div>
          )}
        </div>

        {/* ===== 5. COOP STATUS GRID ===== */}
        <Card
          size="small"
          style={{ marginBottom: 16, background: 'rgba(22,33,62,0.4)' }}
          title={
            <span style={{ color: '#e0e0e0' }}>
              <HomeOutlined style={{ color: '#ff6b35', marginRight: 6 }} />
              鸡舍巡检卡卡位图
            </span>
          }
          extra={<Text style={{ color: '#8c8c8c', fontSize: 10 }}>颜色=当前巡检状态 · 角标=待办项数</Text>}
        >
          {houses.length > 0 ? (
            <CoopStatusGrid houses={houses} onNavigate={navigate} />
          ) : (
            <Empty description="暂无鸡舍数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>

        {/* ===== 6. URGENT EXCEPTIONS ===== */}
        {openExceptions.length > 0 && (
          <Card
            size="small"
            style={{ background: 'rgba(22,33,62,0.4)', border: openExceptions.some(e => e.severity === 'critical') ? '1px solid rgba(230,57,70,0.2)' : undefined }}
            title={
              <span style={{ color: '#e0e0e0' }}>
                <WarningOutlined style={{ color: '#e63946', marginRight: 6 }} />
                紧急异常（需立即处理）
              </span>
            }
            extra={
              <Button type="link" onClick={() => navigate('/exceptions')} style={{ color: '#ff6b35', padding: 0 }}>
                查看全部
              </Button>
            }
          >
            <List
              size="small"
              dataSource={openExceptions.slice(0, 6)}
              renderItem={item => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    background: item.severity === 'critical' ? 'rgba(230,57,70,0.08)' : item.severity === 'urgent' ? 'rgba(255,107,53,0.06)' : 'transparent',
                    padding: '8px 12px',
                    borderRadius: 4,
                    borderColor: 'rgba(255,255,255,0.04)',
                  }}
                  onClick={() => setExceptionDrawer({ open: true, exceptionId: item.id })}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size="small"
                        style={{
                          background: item.severity === 'critical' ? '#e63946' : item.severity === 'urgent' ? '#ff6b35' : '#f4a261',
                        }}
                        icon={<WarningOutlined />}
                      />
                    }
                    title={
                      <Space size={4} wrap>
                        <span className={`pressure-badge ${item.severity}`}>{SEVERITY_LABELS[item.severity]}</span>
                        <Tag style={{ margin: 0 }}>{item.house_name}</Tag>
                        <Tag color="default" style={{ margin: 0 }}>{item.category}</Tag>
                        <Text style={{ color: '#b0b0b0', fontSize: 12 }}>{item.description?.substring(0, 30)}{item.description?.length > 30 ? '...' : ''}</Text>
                      </Space>
                    }
                    description={
                      <Space split={<span style={{ color: '#555' }}>|</span>} size={4}>
                        <span style={{ color: '#8c8c8c', fontSize: 11 }}>
                          状态：<Text strong style={{ color: '#e0e0e0' }}>{EXCEPTION_STATUS[item.status]}</Text>
                        </span>
                        <span style={{ color: '#8c8c8c', fontSize: 11 }}>
                          处理人：{item.handler_name ? <Text strong style={{ color: '#00b4d8' }}>{item.handler_name}</Text> : <Text type="danger">未指派</Text>}
                        </span>
                        <span style={{ color: '#8c8c8c', fontSize: 11 }}>需{ROLE_LABELS[item.handler_role]}处理</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </div>

      <ExceptionDrawer
        open={exceptionDrawer.open}
        exceptionId={exceptionDrawer.exceptionId}
        onClose={() => setExceptionDrawer({ open: false, exceptionId: null })}
        onRefresh={fetchData}
      />
    </div>
  );
}
