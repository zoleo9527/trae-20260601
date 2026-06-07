import { useLoaderData, useNavigate } from "@remix-run/react";
import { RoleProvider, useRole, ROLE_LABELS } from "~/context/RoleContext";
import { api } from "~/utils/api";

export async function loader() {
  const ponds = await api.getPonds();
  return { ponds };
}

function RoleSwitcher() {
  const { currentRole, setCurrentRole } = useRole();
  const roles: Array<'TECHNICIAN' | 'WAREHOUSE_KEEPER' | 'FIELD_MANAGER'> = ['TECHNICIAN', 'WAREHOUSE_KEEPER', 'FIELD_MANAGER'];
  return (
    <div className="role-switcher">
      {roles.map(role => (
        <button key={role} className={`role-btn ${currentRole === role ? 'active' : ''}`} onClick={() => setCurrentRole(role)}>
          {ROLE_LABELS[role]}
        </button>
      ))}
    </div>
  );
}

function PondsContent() {
  const { ponds } = useLoaderData<typeof loader>();
  const { currentUser } = useRole();
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="link-btn" style={{ color: 'white', fontSize: '16px' }} onClick={() => navigate('/')}>← 返回首页</button>
          <h1>🏊 塘口管理</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px' }}>当前用户: {currentUser?.name}</span>
          <RoleSwitcher />
        </div>
      </div>
      
      <div className="main">
        <div className="card">
          <div className="card-title">塘口列表（点击查看详情和用药追溯）</div>
          <table>
            <thead>
              <tr>
                <th>塘口名称</th>
                <th>养殖品种</th>
                <th>面积(亩)</th>
                <th>存量(尾)</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {ponds.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: '500' }}>{p.name}</td>
                  <td>{p.breed_type}</td>
                  <td>{p.area}</td>
                  <td>{p.stock_quantity.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${p.status === 'NORMAL' ? 'status-APPROVED' : 'status-REJECTED'}`}>
                      {p.status === 'NORMAL' ? '正常' : '发病'}
                    </span>
                  </td>
                  <td>
                    <button className="link-btn" onClick={() => navigate(`/ponds/${p.id}`)}>
                      查看详情 / 用药追溯
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

export default function PondsIndex() {
  return (
    <RoleProvider>
      <PondsContent />
    </RoleProvider>
  );
}
