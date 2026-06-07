import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { useRole, ROLE_LABELS } from "~/context/RoleContext";
import { STATUS_LABELS } from "~/utils/api";
import { serverApi } from "~/utils/serverApi";

export async function loader() {
  try {
    const diseaseCases = await serverApi.getDiseaseCases();
    return { diseaseCases };
  } catch (e) {
    return { diseaseCases: [] };
  }
}

function RoleSwitcher() {
  const { currentRole, setCurrentRole } = useRole();
  const roles: Array<'TECHNICIAN' | 'WAREHOUSE_KEEPER' | 'FIELD_MANAGER'> = ['TECHNICIAN', 'WAREHOUSE_KEEPER', 'FIELD_MANAGER'];

  return (
    <div className="role-switcher">
      {roles.map(role => (
        <button
          key={role}
          className={`role-btn ${currentRole === role ? 'active' : ''}`}
          onClick={() => setCurrentRole(role)}
        >
          {ROLE_LABELS[role]}
        </button>
      ))}
    </div>
  );
}

function DiseaseCasesContent() {
  const { currentRole, currentUser } = useRole();
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredCases = statusFilter === 'ALL'
    ? data.diseaseCases
    : data.diseaseCases.filter((c: any) => c.status === statusFilter);

  return (
    <div className="app-container">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="link-btn" style={{ color: 'white', fontSize: '16px' }} onClick={() => navigate('/')}>← 返回首页</button>
          <h1>📋 病害处理单列表</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px' }}>当前用户: {currentUser?.name}</span>
          <RoleSwitcher />
        </div>
      </div>
      
      <div className="main">
        <div className="card">
          <div className="card-title">
            <span>全部病害单</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="ALL">全部状态</option>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              {currentRole === 'TECHNICIAN' && (
                <button className="btn btn-primary" onClick={() => navigate('/disease-cases/new')}>+ 申报病害</button>
              )}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>病害单号</th>
                <th>塘口</th>
                <th>病害名称</th>
                <th>严重程度</th>
                <th>状态</th>
                <th>当前处理人角色</th>
                <th>申报人</th>
                <th>申报时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c: any) => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace' }}>{c.case_no}</td>
                  <td>{c.pond_name}</td>
                  <td>{c.disease_name}</td>
                  <td>
                    <span className={`status-badge severity-${c.severity}`}>
                      {c.severity === 'MILD' ? '轻度' : c.severity === 'MODERATE' ? '中度' : '重度'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${c.status}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td>{ROLE_LABELS[c.current_handler_role as keyof typeof ROLE_LABELS] || c.current_handler_role}</td>
                  <td>{c.reporter_name}</td>
                  <td>{c.report_date}</td>
                  <td>
                    <button className="link-btn" onClick={() => navigate(`/disease-cases/${c.id}`)}>
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function DiseaseCasesIndex() {
  return <DiseaseCasesContent />;
}
