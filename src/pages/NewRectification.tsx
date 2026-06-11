import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, User, CATEGORY_OPTIONS, SEVERITY_OPTIONS } from '../types';

const NewRectification: React.FC = () => {
  const navigate = useNavigate();
  const { userName } = useAuth();

  const [stores, setStores] = useState<Store[]>([]);
  const [storeManagers, setStoreManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [customHandlerMode, setCustomHandlerMode] = useState(false);
  const [customHandlerName, setCustomHandlerName] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  const [formData, setFormData] = useState({
    store_id: '',
    title: '',
    category: '卫生',
    severity: '一般',
    description: '',
    requirement: '',
    deadline: '',
    handler_name: '',
    inspection_date: new Date().toISOString().split('T')[0],
  });

  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    fetchStores();
    fetchStoreManagers();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      setStores(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStoreManagers = async () => {
    try {
      const res = await fetch('/api/users?role=store_manager');
      const data = await res.json();
      setStoreManagers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const managerOptions = useMemo(() => {
    const names = new Set<string>();
    stores.forEach(s => {
      if (s.manager) names.add(s.manager);
    });
    storeManagers.forEach(u => {
      if (u.name) names.add(u.name);
    });
    return Array.from(names).sort();
  }, [stores, storeManagers]);

  const storeHasManager = !!selectedStore?.manager;
  const managerInOptions = selectedStore?.manager
    ? managerOptions.includes(selectedStore.manager)
    : false;

  const handleStoreChange = (storeId: string) => {
    const store = stores.find(s => s.id === Number(storeId));
    setSelectedStore(store || null);
    setCustomHandlerMode(false);
    setCustomHandlerName('');

    const managerName = store?.manager || '';
    setFormData(prev => ({
      ...prev,
      store_id: storeId,
      handler_name: managerName,
    }));
  };

  const handleHandlerChange = (value: string) => {
    if (value === '__custom__') {
      setCustomHandlerMode(true);
      setFormData(prev => ({ ...prev, handler_name: '' }));
    } else {
      setCustomHandlerMode(false);
      setCustomHandlerName('');
      setFormData(prev => ({ ...prev, handler_name: value }));
    }
  };

  const handleCustomHandlerNameChange = (value: string) => {
    setCustomHandlerName(value);
    setFormData(prev => ({ ...prev, handler_name: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.store_id || !formData.title || !formData.description || !formData.requirement || !formData.deadline) {
      alert('请填写必填项');
      return;
    }

    if (!formData.handler_name.trim()) {
      const ok = confirm('当前未设置负责人，是否确认继续创建？');
      if (!ok) return;
    }

    setLoading(true);
    try {
      const store = stores.find(s => s.id === Number(formData.store_id));
      const res = await fetch('/api/rectifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          store_id: Number(formData.store_id),
          store_name: store?.name || '',
          brand: store?.brand || '',
          inspector_name: userName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert('创建成功');
        navigate(`/rectifications/${data.id}`);
      } else {
        alert('创建失败');
      }
    } catch (e) {
      console.error(e);
      alert('创建失败');
    } finally {
      setLoading(false);
    }
  };

  const effectiveHandler = customHandlerMode ? customHandlerName : formData.handler_name;

  return (
    <div>
      <div className="breadcrumb">
        <span onClick={() => navigate('/rectifications')}>巡店整改</span>
        <span className="separator">/</span>
        <span>新建整改单</span>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">新建巡店整改单</div>
          <div className="page-subtitle">
            巡店人：{userName} · 日期：{formData.inspection_date}
          </div>
        </div>
        <button className="btn" onClick={() => navigate('/rectifications')}>
          返回列表
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
            <div className="form-group">
              <label className="form-label required">店铺</label>
              <select
                className="select"
                style={{ width: '100%' }}
                value={formData.store_id}
                onChange={e => handleStoreChange(e.target.value)}
              >
                <option value="">请选择店铺</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}（{store.brand}）{store.manager ? `· ${store.manager}` : ''}
                  </option>
                ))}
              </select>
              {selectedStore && (
                <div className="form-hint">
                  楼层：{selectedStore.floor || '-'} · 面积：{selectedStore.area || '-'}㎡
                  {selectedStore.manager ? ` · 店长：${selectedStore.manager}` : ''}
                  {selectedStore.phone ? ` · 联系电话：${selectedStore.phone}` : ''}
                </div>
              )}
              {selectedStore && !storeHasManager && (
                <div style={{
                  marginTop: 8, padding: '8px 12px',
                  background: '#fffbe6', border: '1px solid #ffe58f',
                  borderRadius: 4, fontSize: 13, color: '#ad6800'
                }}>
                  ⚠️ 该店铺暂未登记店长信息，请手动选择或输入负责人
                </div>
              )}
              {selectedStore && storeHasManager && !managerInOptions && (
                <div style={{
                  marginTop: 8, padding: '8px 12px',
                  background: '#e6f4ff', border: '1px solid #91caff',
                  borderRadius: 4, fontSize: 13, color: '#0958d9'
                }}>
                  ℹ️ 已自动带出店长「{selectedStore.manager}」，可在下方调整
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label required">问题标题</label>
              <input
                className="input"
                style={{ width: '100%' }}
                placeholder="简要描述问题，例如：试衣间清洁不达标"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label required">问题分类</label>
                <select
                  className="select"
                  style={{ width: '100%' }}
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {CATEGORY_OPTIONS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">严重程度</label>
                <select
                  className="select"
                  style={{ width: '100%' }}
                  value={formData.severity}
                  onChange={e => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                >
                  {SEVERITY_OPTIONS.map(sev => (
                    <option key={sev} value={sev}>{sev}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">问题描述</label>
              <textarea
                className="textarea"
                placeholder="详细描述发现的问题..."
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">整改要求</label>
              <textarea
                className="textarea"
                placeholder="明确整改标准和期望达成的效果..."
                value={formData.requirement}
                onChange={e => setFormData(prev => ({ ...prev, requirement: e.target.value }))}
                rows={3}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label required">整改截止日期</label>
                <input
                  type="date"
                  className="input"
                  style={{ width: '100%' }}
                  value={formData.deadline}
                  onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">负责人</label>
                {!customHandlerMode ? (
                  <select
                    className="select"
                    style={{ width: '100%' }}
                    value={formData.handler_name}
                    onChange={e => handleHandlerChange(e.target.value)}
                  >
                    <option value="">请选择负责人</option>
                    {managerOptions.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    <option value="__custom__">✏️ 手动输入...</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      style={{ flex: 1 }}
                      placeholder="请输入负责人姓名"
                      value={customHandlerName}
                      onChange={e => handleCustomHandlerNameChange(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => { setCustomHandlerMode(false); setCustomHandlerName(''); }}
                    >
                      返回选择
                    </button>
                  </div>
                )}
                <div className="form-hint">
                  选择店铺后会自动带出该店店长，也可手动选择其他负责人
                </div>
                {!effectiveHandler.trim() && formData.store_id && (
                  <div style={{
                    marginTop: 8, padding: '6px 10px',
                    background: '#fff7e6', border: '1px solid #ffd591',
                    borderRadius: 4, fontSize: 12, color: '#d46b08'
                  }}>
                    💡 未设置负责人将创建为「待指派」状态，后续可在详情页中补充
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">附件</label>
              <div style={{ padding: 20, border: '2px dashed var(--border)', borderRadius: 8, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                📎 点击或拖拽上传附件（占位示意）
                <div style={{ fontSize: 12, marginTop: 4 }}>支持图片、PDF 等格式</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button type="button" className="btn" onClick={() => navigate('/rectifications')}>
                取消
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '创建中...' : '创建整改单'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewRectification;
