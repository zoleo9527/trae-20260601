import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, User, CATEGORY_OPTIONS, SEVERITY_OPTIONS } from '../types';

const NewRectification: React.FC = () => {
  const navigate = useNavigate();
  const { userName } = useAuth();

  const [stores, setStores] = useState<Store[]>([]);
  const [storeManagers, setStoreManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleStoreChange = (storeId: string) => {
    const store = stores.find(s => s.id === Number(storeId));
    setSelectedStore(store || null);
    setFormData(prev => ({
      ...prev,
      store_id: storeId,
      handler_name: store?.manager || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.store_id || !formData.title || !formData.description || !formData.requirement || !formData.deadline) {
      alert('请填写必填项');
      return;
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
                    {store.name}（{store.brand}）
                  </option>
                ))}
              </select>
              {selectedStore && (
                <div className="form-hint">
                  楼层：{selectedStore.floor} · 面积：{selectedStore.area}㎡ · 店长：{selectedStore.manager}
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
                <select
                  className="select"
                  style={{ width: '100%' }}
                  value={formData.handler_name}
                  onChange={e => setFormData(prev => ({ ...prev, handler_name: e.target.value }))}
                >
                  <option value="">请选择负责人</option>
                  {storeManagers.map(user => (
                    <option key={user.id} value={user.name}>{user.name}</option>
                  ))}
                </select>
                <div className="form-hint">选择店铺后会自动填入店长</div>
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
