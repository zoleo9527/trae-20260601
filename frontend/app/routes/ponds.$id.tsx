import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { useRole, ROLE_LABELS } from "~/context/RoleContext";
import { STATUS_LABELS } from "~/utils/api";
import { serverApi } from "~/utils/serverApi";

export async function loader({ params }: { params: { id: string } }) {
  const [pond, inspections, feedRecords, medications, summary, diseaseCases] = await Promise.all([
    serverApi.getPond(params.id),
    serverApi.getInspections(params.id),
    serverApi.getFeedRecords(params.id),
    serverApi.getTraceByPond(params.id),
    serverApi.getPondMedicationSummary(params.id),
    serverApi.getDiseaseCases({ pondId: params.id }),
  ]);
  return { pond, inspections, feedRecords, medications, summary, diseaseCases };
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

function PondDetail() {
  const { pond, inspections, feedRecords, medications, summary, diseaseCases } = useLoaderData<typeof loader>();
  const { currentUser } = useRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'medication' | 'inspection' | 'feed' | 'cases'>('medication');

  return (
    <div className="app-container">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="link-btn" style={{ color: 'white', fontSize: '16px' }} onClick={() => navigate('/')}>← 返回首页</button>
          <h1>🏊 {pond.name} - 详情与用药追溯</h1>
          <span className={`status-badge ${pond.status === 'NORMAL' ? 'status-APPROVED' : 'status-REJECTED'}`} style={{ fontSize: '14px' }}>
            {pond.status === 'NORMAL' ? '正常' : '发病'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px' }}>当前用户: {currentUser?.name}</span>
          <RoleSwitcher />
        </div>
      </div>

      <div className="main">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
          <div className="stat-card">
            <h3>养殖品种</h3>
            <div className="number" style={{ fontSize: '20px' }}>{pond.breed_type}</div>
          </div>
          <div className="stat-card">
            <h3>塘口面积</h3>
            <div className="number" style={{ fontSize: '20px' }}>{pond.area} 亩</div>
          </div>
          <div className="stat-card">
            <h3>存塘量</h3>
            <div className="number" style={{ fontSize: '20px' }}>{pond.stock_quantity.toLocaleString()} 尾</div>
          </div>
          <div className="stat-card">
            <h3>病害处理单数</h3>
            <div className="number" style={{ fontSize: '20px', color: '#e65100' }}>{diseaseCases.length}</div>
          </div>
        </div>

        <div className="card">
          <div className="tabs" style={{ marginBottom: 0 }}>
            <div className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              用药汇总统计
            </div>
            <div className={`tab ${activeTab === 'medication' ? 'active' : ''}`} onClick={() => setActiveTab('medication')}>
              🔍 用药追溯记录
            </div>
            <div className={`tab ${activeTab === 'cases' ? 'active' : ''}`} onClick={() => setActiveTab('cases')}>
              病害处理单历史
            </div>
            <div className={`tab ${activeTab === 'inspection' ? 'active' : ''}`} onClick={() => setActiveTab('inspection')}>
              巡检记录
            </div>
            <div className={`tab ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
              投喂记录
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="card">
            <div className="card-title">用药汇总统计</div>
            {summary.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无用药记录
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>药品名称</th>
                    <th>单位</th>
                    <th>累计用量</th>
                    <th>涉及病害单数</th>
                    <th>首次使用</th>
                    <th>最近使用</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s: any) => (
                    <tr key={s.medicine_id}>
                      <td style={{ fontWeight: '500' }}>{s.medicine_name}</td>
                      <td>{s.unit}</td>
                      <td style={{ color: '#e65100', fontWeight: '600' }}>{s.total_used_quantity}</td>
                      <td>{s.case_count}</td>
                      <td>{s.first_used_date}</td>
                      <td>{s.last_used_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'medication' && (
          <div className="card">
            <div className="card-title">
              <span>🔍 用药追溯记录（从塘口穿透查看，不做独立菜单）</span>
            </div>
            {medications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                该塘口暂无用药记录
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>用药日期</th>
                    <th>病害单号</th>
                    <th>病害名称</th>
                    <th>药品名称</th>
                    <th>规格</th>
                    <th>用量</th>
                    <th>使用方法</th>
                    <th>操作人</th>
                    <th>备注</th>
                    <th>追溯</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map((m: any) => (
                    <tr key={m.id}>
                      <td>{m.medication_date}</td>
                      <td style={{ fontFamily: 'monospace' }}>{m.case_no}</td>
                      <td>{m.disease_name}</td>
                      <td style={{ fontWeight: '500' }}>{m.medicine_name}</td>
                      <td>{m.specification}</td>
                      <td>{m.quantity} {m.unit}</td>
                      <td>{m.usage_method || '-'}</td>
                      <td>{m.operator_name}</td>
                      <td>{m.notes || '-'}</td>
                      <td>
                        <button className="link-btn" onClick={() => navigate(`/disease-cases/${m.disease_case_id}`)}>
                          查看病害单详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'cases' && (
          <div className="card">
            <div className="card-title">病害处理单历史</div>
            {diseaseCases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                该塘口暂无病害处理记录
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>病害单号</th>
                    <th>病害名称</th>
                    <th>严重程度</th>
                    <th>状态</th>
                    <th>申报日期</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {diseaseCases.map((c: any) => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'monospace' }}>{c.case_no}</td>
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
                          查看详情 / 追溯
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'inspection' && (
          <div className="card">
            <div className="card-title">巡检记录</div>
            {inspections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无巡检记录
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>巡检日期</th>
                    <th>水温(℃)</th>
                    <th>pH值</th>
                    <th>溶氧(mg/L)</th>
                    <th>是否异常</th>
                    <th>巡检人</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map((i: any) => (
                    <tr key={i.id}>
                      <td>{i.inspect_date}</td>
                      <td>{i.water_temperature?.toFixed(1)}</td>
                      <td>{i.ph_value?.toFixed(1)}</td>
                      <td>{i.dissolved_oxygen?.toFixed(1)}</td>
                      <td>
                        {i.abnormal_found ? (
                          <span className="status-badge status-REJECTED">有异常</span>
                        ) : (
                          <span className="status-badge status-APPROVED">正常</span>
                        )}
                      </td>
                      <td>{i.inspector_name}</td>
                      <td>{i.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="card">
            <div className="card-title">投喂记录</div>
            {feedRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无投喂记录
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>投喂日期</th>
                    <th>饲料类型</th>
                    <th>投喂量</th>
                    <th>投喂人</th>
                  </tr>
                </thead>
                <tbody>
                  {feedRecords.map((f: any) => (
                    <tr key={f.id}>
                      <td>{f.feed_date}</td>
                      <td>{f.feed_type}</td>
                      <td>{f.feed_quantity?.toFixed(1)} kg</td>
                      <td>{f.feeder_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PondDetailPage() {
  return <PondDetail />;
}
