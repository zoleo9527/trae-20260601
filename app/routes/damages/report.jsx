import { useState } from 'react';
import { Link, useNavigate } from '@remix-run/react';
import { getDeliveriesInTransit } from '~/models/delivery.server';
import { createDamageRecord } from '~/models/damage.server';
import { createOperationLog } from '~/models/log.server';
import { damageTypes } from '~/data/mockData';

export async function loader() {
  const deliveries = await getDeliveriesInTransit();
  return { deliveries };
}

export async function action({ request }) {
  const formData = await request.formData();
  const deliveryId = formData.get('deliveryId');
  const salesOrderId = formData.get('salesOrderId');
  const damageType = formData.get('damageType');
  const damageDescription = formData.get('damageDescription');
  const damageQuantity = parseInt(formData.get('damageQuantity'));
  
  await createDamageRecord({
    deliveryRecordId: deliveryId,
    salesOrderId,
    reporterId: '2',
    damageType,
    damageDescription,
    damageQuantity,
    photos: [],
    history: [{
      action: 'reported',
      user: '司机张师傅',
      time: new Date().toISOString().replace('T', ' ').slice(0, 19),
      remark: damageDescription,
    }],
  });
  
  await createOperationLog({
    userId: '2',
    action: 'report_damage',
    targetType: 'damage',
    targetId: `DM${Date.now()}`,
    remark: `上报破损: ${damageType}`,
  });
  
  return { success: true, message: '破损登记成功' };
}

export default function DamageReportPage({ deliveries }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    deliveryId: '',
    damageType: 'package_damage',
    damageQuantity: 1,
    damageDescription: '',
  });
  
  const selectedDelivery = deliveries.find(d => d.id === formData.deliveryId);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.deliveryId || !formData.damageDescription || !formData.damageQuantity) {
      alert('请填写完整信息');
      return;
    }
    
    const response = await fetch('/damages/report', {
      method: 'POST',
      body: new FormData(Object.entries({
        ...formData,
        salesOrderId: selectedDelivery?.order.id,
      })),
    });
    const result = await response.json();
    if (result.success) {
      alert(result.message);
      navigate('/damages');
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Link to="/damages" style={styles.backLink}>← 返回</Link>
        <h1 style={styles.title}>⚠️ 新建破损登记</h1>
        <div style={styles.headerRight}></div>
      </header>

      <main style={styles.main}>
        <div style={styles.formContainer}>
          <div style={styles.warningBanner}>
            ⚠️ 请详细填写破损信息，以便后续责任认定和处理
          </div>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>选择配送单 *</label>
              <select
                name="deliveryId"
                value={formData.deliveryId}
                onChange={handleInputChange}
                style={styles.select}
              >
                <option value="">请选择配送单</option>
                {deliveries.map((delivery) => (
                  <option key={delivery.id} value={delivery.id}>
                    {delivery.id} - {delivery.order?.customerName} - {delivery.order?.productName}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedDelivery && (
              <div style={styles.orderPreview}>
                <div style={styles.previewTitle}>订单信息预览</div>
                <div style={styles.previewGrid}>
                  <div style={styles.previewItem}>
                    <span style={styles.previewLabel}>客户</span>
                    <span>{selectedDelivery.order?.customerName}</span>
                  </div>
                  <div style={styles.previewItem}>
                    <span style={styles.previewLabel}>商品</span>
                    <span>{selectedDelivery.order?.productName} x {selectedDelivery.order?.quantity}{selectedDelivery.order?.unit}</span>
                  </div>
                  <div style={styles.previewItem}>
                    <span style={styles.previewLabel}>地址</span>
                    <span>{selectedDelivery.deliveryAddress}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div style={styles.formGroup}>
              <label style={styles.label}>破损类型 *</label>
              <select
                name="damageType"
                value={formData.damageType}
                onChange={handleInputChange}
                style={styles.select}
              >
                {damageTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>破损数量 *</label>
              <input
                type="number"
                name="damageQuantity"
                value={formData.damageQuantity}
                onChange={handleInputChange}
                min="1"
                style={styles.input}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>破损描述 *</label>
              <textarea
                name="damageDescription"
                value={formData.damageDescription}
                onChange={handleInputChange}
                placeholder="请详细描述破损情况，包括位置、程度等..."
                rows={4}
                style={styles.textarea}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>现场照片</label>
              <div style={styles.uploadArea}>
                <div style={styles.uploadPlaceholder}>
                  <div style={styles.uploadIcon}>📷</div>
                  <span>点击或拖拽上传照片</span>
                </div>
                <div style={styles.uploadHint}>支持 JPG、PNG 格式，最多上传5张</div>
              </div>
            </div>
            
            <div style={styles.formActions}>
              <button type="button" onClick={() => navigate('/damages')} style={styles.cancelBtn}>
                取消
              </button>
              <button type="submit" style={styles.submitBtn}>
                提交破损登记
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    background: '#fff',
    padding: '16px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backLink: {
    fontSize: '14px',
    color: '#667eea',
    textDecoration: 'none',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: 0,
  },
  headerRight: {
    width: '100px',
  },
  main: {
    padding: '24px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  formContainer: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  warningBanner: {
    background: '#fff3e0',
    borderLeft: '4px solid #ff9800',
    padding: '12px 16px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#e65100',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '6px',
  },
  select: {
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  textarea: {
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  orderPreview: {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '16px',
  },
  previewTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    marginBottom: '12px',
  },
  previewGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  previewItem: {
    display: 'flex',
    gap: '12px',
    fontSize: '14px',
  },
  previewLabel: {
    color: '#999',
    minWidth: '40px',
  },
  uploadArea: {
    border: '2px dashed #e0e0e0',
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center',
  },
  uploadPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: '#999',
  },
  uploadIcon: {
    fontSize: '32px',
  },
  uploadHint: {
    fontSize: '12px',
    color: '#999',
    marginTop: '8px',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    background: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  submitBtn: {
    flex: 2,
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
