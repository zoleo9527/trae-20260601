import { useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";
import { RoleProvider, useRole, ROLE_LABELS } from "~/context/RoleContext";
import { api, STATUS_LABELS } from "~/utils/api";

export async function loader() {
  try {
    const [ponds, diseaseCases, medicines] = await Promise.all([
      api.getPonds(),
      api.getDiseaseCases(),
      api.getMedicines(),
    ]);
    return { ponds, diseaseCases, medicines };
  } catch (e) {
    return { ponds: [], diseaseCases: [], medicines: [] };
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

function DashboardContent() {
  const { currentRole, currentUser } = useRole();
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [myCases, setMyCases] = useState<any[]>([]);

  useEffect(() => {
    const filtered = data.diseaseCases.filter((c: any) => c.current_handler_role === currentRole);
    setMyCases(filtered);
  }, [currentRole, data.diseaseCases]);

  const stats = {
    total: data.diseaseCases.length,
    pending: myCases.length,
    ponds: data.ponds.length,
    medicines: data.medicines.length,
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>🐟 水产养殖场 - 病害处理与用药追溯</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px' }}>当前用户: {currentUser?.name}</span>
          <RoleSwitcher />
        </div>
      </div>
      
      <div className="main">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
          <div className="stat-card">
            <h3>病害处理单总数</h3>
            <div className="number">{stats.total}</div>
          </div>
          <div className="stat-card">
            <h3>待我处理</h3>
            <div className="number" style={{ color: '#e65100' }}>{stats.pending}</div>
          </div>
          <div className="stat-card">
            <h3>塘口数量</h3>
            <div className="number">{stats.ponds}</div>
          </div>
          <div className="stat-card">
            <h3>药品台账</h3>
            <div className="number">{stats.medicines}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>📋 待处理的病害单</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-default" onClick={() => navigate('/ponds')}>塘口管理</button>
              {currentRole === 'TECHNICIAN' && (
                <button className="btn btn-primary" onClick={() => navigate('/disease-cases/new')}>+ 申报病害</button>
              )}
              <button className="btn btn-default" onClick={() => navigate('/disease-cases')}>全部病害单</button>
            </div>
          </div>
          
          {myCases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              暂无待处理的病害单
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>病害单号</th>
                  <th>塘口</th>
                  <th>病害名称</th>
                  <th>严重程度</th>
                  <th>状态</th>
                  <th>申报时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {myCases.map((c: any) => (
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
                    <td>{c.report_date}</td>
                    <td>
                      <button className="link-btn" onClick={() => navigate(`/disease-cases/${c.id}`)}>
                        查看/处理
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <span>🏊 塘口概览（点击塘口查看历史用药追溯）</span>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {data.ponds.map((pond: any) => (
              <div
                key={pond.id}
                className="card"
                style={{ cursor: 'pointer', marginBottom: 0 }}
                onClick={() => navigate(`/ponds/${pond.id}`)}
              >
                <h3 style={{ marginBottom: '8px', color: '#2c5530' }}>{pond.name}</h3>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <div>养殖品种: {pond.breed_type}</div>
                  <div>面积: {pond.area} 亩</div>
                  <div>存量: {pond.stock_quantity} 尾</div>
                  <div style={{ marginTop: '8px' }}>
                    <span className={`status-badge ${pond.status === 'NORMAL' ? 'status-APPROVED' : 'status-REJECTED'}`}>
                      {pond.status === 'NORMAL' ? '正常' : '发病'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <RoleProvider>
      <DashboardContent />
    </RoleProvider>
  );
}
