import { useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";
import { ROLE_LABELS, useRole } from "~/context/RoleContext";
import { api, STATUS_LABELS } from "~/utils/api";
import { serverApi } from "~/utils/serverApi";

export async function loader() {
  try {
    const [ponds, diseaseCases, medicines] = await Promise.all([
      serverApi.getPonds(),
      serverApi.getDiseaseCases(),
      serverApi.getMedicines(),
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
  const [resetting, setResetting] = useState(false);
  const [showBoundary, setShowBoundary] = useState(false);

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

  const handleReset = async () => {
    if (!confirm('确定要重置所有演示数据吗？这将恢复病害单、药品库存和追溯样例到初始状态。')) {
      return;
    }
    try {
      setResetting(true);
      await api.resetDemoData();
      alert('演示数据已重置！页面将刷新。');
      window.location.reload();
    } catch (e: any) {
      alert('重置失败：' + e.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>🐟 水产养殖场 - 病害处理与用药追溯</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn btn-default"
            onClick={() => setShowBoundary(true)}
            style={{ fontSize: '12px', padding: '4px 12px' }}
          >
            ℹ️ 系统说明
          </button>
          <button
            className="btn btn-default"
            onClick={handleReset}
            disabled={resetting}
            style={{ fontSize: '12px', padding: '4px 12px' }}
          >
            🔄 重置演示数据
          </button>
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

      {showBoundary && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowBoundary(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '16px', color: '#2c5530' }}>📋 系统说明与边界</h2>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', color: '#333', marginBottom: '8px' }}>🎯 演示系统用途</h3>
              <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', margin: 0 }}>
                本系统用于演示水产养殖场病害处理与用药追溯的全流程闭环，
                重点展示<strong>驳回补录实体化、角色接力流转、用药追溯穿透</strong>三个核心特性。
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', color: '#333', marginBottom: '8px' }}>🔄 预置演示数据</h3>
              <ul style={{ fontSize: '14px', color: '#666', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
                <li><strong>3条病害单：</strong>已结案（完整流程）、已驳回（待补录）、已提交（待配药）</li>
                <li><strong>5个塘口：</strong>含正常和发病状态，养殖南美白对虾、草鱼、鲫鱼</li>
                <li><strong>5种水产药品：</strong>聚维酮碘、二氧化氯、恩诺沙星、肝胆利康散、EM益生菌</li>
                <li><strong>15天巡检记录、10天投喂记录：</strong>本地模拟样例数据</li>
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', color: '#e65100', marginBottom: '8px' }}>⚠️ 系统边界说明</h3>
              <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8', background: '#fff3e0', padding: '12px', borderRadius: '4px' }}>
                <p style={{ margin: '0 0 8px 0' }}><strong>当前系统未接入真实外部系统：</strong></p>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>用户/组织架构：<strong>本地模拟数据</strong>，未对接企业微信/钉钉/HR系统</li>
                  <li>巡检数据：<strong>本地样例数据</strong>，未对接物联网水质传感器</li>
                  <li>投喂记录：<strong>本地样例数据</strong>，未对接智能投喂设备</li>
                  <li>药品台账：<strong>本地模拟库存</strong>，未对接WMS仓储系统</li>
                  <li>消息通知：无通知推送，仅通过页面待办展示</li>
                  <li>监管上报：未对接农业农村部养殖用药直报系统</li>
                </ul>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => setShowBoundary(false)}>
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Index() {
  return <DashboardContent />;
}
