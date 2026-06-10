import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClockCircleOutlined, WarningOutlined, AppstoreOutlined as EggOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

function formatElapsed(ms) {
  if (!ms || ms < 0) return '--:--';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getElapsedMs(startedAt) {
  if (!startedAt) return 0;
  const start = new Date(startedAt.replace(' ', 'T')).getTime();
  return Date.now() - start;
}

export default function PressureBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pressure, setPressure] = useState({ stuckCount: 0, incompleteEggCount: 0, openExceptionCount: 0, criticalCount: 0 });
  const [now, setNow] = useState(Date.now());
  const [longestStuckMs, setLongestStuckMs] = useState(0);
  const timerRef = useRef(null);

  const fetchPressure = useCallback(async () => {
    try {
      const d = await api.dashboard.pressure();
      const stuckCount = (d.stuckCards || []).length;
      const incompleteEggCount = (d.incompleteEggRecords || []).length;
      const openExceptionCount = (d.openExceptions || []).length;
      const criticalCount = (d.openExceptions || []).filter(e => e.severity === 'critical').length;

      let maxMs = 0;
      (d.stuckCards || []).forEach(c => {
        const ms = getElapsedMs(c.started_at);
        if (ms > maxMs) maxMs = ms;
      });

      setPressure({ stuckCount, incompleteEggCount, openExceptionCount, criticalCount });
      setLongestStuckMs(maxMs);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPressure();
    const interval = setInterval(fetchPressure, 30000);
    return () => clearInterval(interval);
  }, [fetchPressure]);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const { stuckCount, incompleteEggCount, openExceptionCount, criticalCount } = pressure;
  const total = stuckCount + incompleteEggCount + openExceptionCount;
  const isHigh = criticalCount > 0 || stuckCount > 2;
  const isWarn = total > 2 && !isHigh;

  const elapsed = longestStuckMs > 0 ? formatElapsed(longestStuckMs + (now - now)) : null;
  const elapsedHours = longestStuckMs > 0 ? Math.floor(longestStuckMs / 3600000) : 0;

  return (
    <div className="pressure-top-bar">
      <div className="bar-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/inspections')}>
        <SearchOutlined style={{ color: '#e63946' }} />
        <span className="bar-count" style={{ color: stuckCount > 0 ? '#e63946' : '#2ec4b6' }}>{stuckCount}</span>
        <span className="bar-label">巡检卡住</span>
      </div>
      <div className="bar-divider" />
      <div className="bar-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/egg-records')}>
        <EggOutlined style={{ color: '#f4a261' }} />
        <span className="bar-count" style={{ color: incompleteEggCount > 0 ? '#f4a261' : '#2ec4b6' }}>{incompleteEggCount}</span>
        <span className="bar-label">产蛋未完成</span>
      </div>
      <div className="bar-divider" />
      <div className="bar-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/exceptions')}>
        <WarningOutlined style={{ color: criticalCount > 0 ? '#e63946' : '#f4a261' }} />
        <span className="bar-count" style={{ color: criticalCount > 0 ? '#e63946' : '#f4a261' }}>{openExceptionCount}</span>
        <span className="bar-label">待处理异常</span>
      </div>

      {longestStuckMs > 0 && (
        <>
          <div className="bar-divider" />
          <div className="bar-item">
            <ClockCircleOutlined style={{ color: elapsedHours >= 4 ? '#e63946' : elapsedHours >= 2 ? '#f4a261' : '#00b4d8' }} />
            <span className="timer-elapsed" style={{ color: elapsedHours >= 4 ? '#e63946' : elapsedHours >= 2 ? '#f4a261' : '#00b4d8', textShadow: elapsedHours >= 2 ? '0 0 8px rgba(230,57,70,0.4)' : 'none' }}>
              {formatElapsed(longestStuckMs + (now - now))}
            </span>
            <span className="bar-label">最长卡住</span>
          </div>
        </>
      )}

      {isHigh && (
        <div className="bar-alert">
          <ThunderboltOutlined /> {criticalCount > 0 ? `${criticalCount}项紧急` : `${stuckCount}张卡住`}
        </div>
      )}
      {isWarn && !isHigh && (
        <div className="bar-alert" style={{ color: '#f4a261' }}>
          <WarningOutlined /> {total}项待关注
        </div>
      )}
      {total === 0 && (
        <div className="bar-alert" style={{ color: '#2ec4b6', animation: 'none' }}>
          运行正常
        </div>
      )}
    </div>
  );
}
