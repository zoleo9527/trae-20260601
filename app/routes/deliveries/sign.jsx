import { useState } from 'react';
import { Link, useNavigate, useLoaderData, redirect } from '@remix-run/react';
import { getDeliveriesInTransit, updateDeliveryStatus } from '~/models/delivery.server';
import { createDamageRecord } from '~/models/damage.server';
import { createOperationLog } from '~/models/log.server';
import { deliveryStatusMap } from '~/data/mockData';

export async function loader() {
  const deliveries = await getDeliveriesInTransit();
  return { deliveries };
}

export async function action({ request }) {
  const formData = await request.formData();
  const actionType = formData.get('action');
  
  if (actionType === 'sign') {
    const deliveryId = formData.get('deliveryId');
    const signerName = formData.get('signerName');
    const signerPhone = formData.get('signerPhone');
    const hasDamage = formData.get('hasDamage') === 'true';
    
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    await updateDeliveryStatus(deliveryId, hasDamage ? 'damaged' : 'signed', {
      signerName,
      signerPhone,
      signedAt: now,
    });
    
    await createOperationLog({
      userId: '2',
      action: 'sign',
      targetType: 'delivery',
      targetId: deliveryId,
      remark: `客户签收: ${signerName}`,
    });
    
    return redirect('/dashboard/driver');
  }
  
  if (actionType === 'report_damage') {
    const deliveryId = formData.get('deliveryId');
    const salesOrderId = formData.get('salesOrderId');
    const damageType = formData.get('damageType');
    const damageDescription = formData.get('damageDescription');
    const damageQuantity = parseInt(formData.get('damageQuantity'));
    const signerName = formData.get('signerName');
    const signerPhone = formData.get('signerPhone');
    
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    
    await updateDeliveryStatus(deliveryId, 'damaged', {
      signerName,
      signerPhone,
      signedAt: now,
    });
    
    const newDamage = await createDamageRecord({
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
        time: now,
        remark: damageDescription,
      }],
    });
    
    await createOperationLog({
      userId: '2',
      action: 'report_damage',
      targetType: 'damage',
      targetId: newDamage.id,
      remark: `上报破损: ${damageType}`,
    });
    
    return redirect('/dashboard/driver');
  }
  
  return redirect('/deliveries/sign');
}

export default function DeliverySignPage() {
  const { deliveries } = useLoaderData();
  const navigate = useNavigate();
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDamageForm, setShowDamageForm] = useState(false);
  const [formData, setFormData] = useState({
    signerName: '',
    signerPhone: '',
    hasDamage: false,
    damageType: 'package_damage',
    damageDescription: '',
    damageQuantity: 1,
  });
  
  const handleSignClick = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDamageForm(false);
    setFormData({
      signerName: '',
      signerPhone: '',
      hasDamage: false,
      damageType: 'package_damage',
      damageDescription: '',
      damageQuantity: 1,
    });
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const handleSubmitSign = (e) => {
    e.preventDefault();
    if (!formData.signerName || !formData.signerPhone) {
      alert('请填写签收人信息');
      return;
    }
    
    if (formData.hasDamage) {
      setShowDamageForm(true);
      return;
    }
    
    e.target.submit();
  };
  
  const handleSubmitDamage = (e) => {
    e.preventDefault();
    if (!formData.damageDescription || !formData.damageQuantity) {
      alert('请填写完整破损信息');
      return;
    }
    
    e.target.submit();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Link to="/dashboard/driver" style={styles.backLink}>← 返回</Link>
        <h1 style={styles.title}>📦 送货签收</h1>
        <div style={styles.headerRight}></div>
      </header>

      <main style={styles.main}>
        {!selectedDelivery && !showDamageForm && (
          <div>
            <h2 style={styles.subtitle}>待签收订单</h2>
            {deliveries.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>✅</div>
                <p>暂无待签收订单</p>
              </div>
            ) : (
              <div style={styles.deliveryList}>
                {deliveries.map((delivery) => (
                  <div key={delivery.id} style={styles.deliveryCard}>
                    <div style={styles.cardHeader}>
                      <span style={styles.deliveryId}>{delivery.id}</span>
                      <span style={{ ...styles.statusBadge, backgroundColor: '#2196F3' }}>
                        {deliveryStatusMap[delivery.status]}
                      </span>
                    </div>
                    <div style={styles.cardContent}>
                      <div style={styles.customerInfo}>
                        <div style={styles.customerName}>{delivery.order?.customerName}</div>
                        <div style={styles.productInfo}>
                          {delivery.order?.productName} x {delivery.order?.quantity}{delivery.order?.unit}
                        </div>
                      </div>
                      <div style={styles.deliveryInfo}>
                        <div>📍 {delivery.deliveryAddress}</div>
                        <div>⏰ 计划时间: {delivery.plannedTime?.toLocaleString()}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSignClick(delivery)}
                      style={styles.signBtn}
                    >
                      确认签收
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedDelivery && !showDamageForm && (
          <div style={styles.formContainer}>
            <h2 style={styles.subtitle}>签收确认 - {selectedDelivery.id}</h2>
            <div style={styles.orderSummary}>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>客户</span>
                <span>{selectedDelivery.order?.customerName}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>商品</span>
                <span>{selectedDelivery.order?.productName} x {selectedDelivery.order?.quantity}{selectedDelivery.order?.unit}</span>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>地址</span>
                <span>{selectedDelivery.deliveryAddress}</span>
              </div>
            </div>
            
            <form method="post" style={styles.form} onSubmit={handleSubmitSign}>
              <input type="hidden" name="action" value="sign" />
              <input type="hidden" name="deliveryId" value={selectedDelivery.id} />
              <input type="hidden" name="salesOrderId" value={selectedDelivery.order?.id} />
              
              <div style={styles.formGroup}>
                <label style={styles.label}>签收人姓名 *</label>
                <input
                  type="text"
                  name="signerName"
                  value={formData.signerName}
                  onChange={handleInputChange}
                  placeholder="请输入签收人姓名"
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>联系电话 *</label>
                <input
                  type="tel"
                  name="signerPhone"
                  value={formData.signerPhone}
                  onChange={handleInputChange}
                  placeholder="请输入联系电话"
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="hasDamage"
                    checked={formData.hasDamage}
                    onChange={handleInputChange}
                    style={styles.checkbox}
                  />
                  <span>货物有破损/短缺</span>
                </label>
              </div>
              
              <div style={styles.formActions}>
                <button type="button" onClick={() => setSelectedDelivery(null)} style={styles.cancelBtn}>
                  取消
                </button>
                <button type="submit" style={styles.submitBtn}>
                  {formData.hasDamage ? '确认签收并登记破损' : '确认签收'}
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedDelivery && showDamageForm && (
          <div style={styles.formContainer}>
            <h2 style={styles.subtitle}>破损登记 - {selectedDelivery.id}</h2>
            <div style={styles.damageNotice}>
              ⚠️ 请详细填写破损信息，以便后续责任认定和处理
            </div>
            
            <form method="post" style={styles.form} onSubmit={handleSubmitDamage}>
              <input type="hidden" name="action" value="report_damage" />
              <input type="hidden" name="deliveryId" value={selectedDelivery.id} />
              <input type="hidden" name="salesOrderId" value={selectedDelivery.order?.id} />
              <input type="hidden" name="signerName" value={formData.signerName} />
              <input type="hidden" name="signerPhone" value={formData.signerPhone} />
              
              <div style={styles.formGroup}>
                <label style={styles.label}>破损类型 *</label>
                <select
                  name="damageType"
                  value={formData.damageType}
                  onChange={handleInputChange}
                  style={styles.select}
                  required
                >
                  <option value="package_damage">包装破损</option>
                  <option value="product_damage">产品损坏</option>
                  <option value="quantity_shortage">数量短缺</option>
                  <option value="other">其他</option>
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
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>破损描述 *</label>
                <textarea
                  name="damageDescription"
                  value={formData.damageDescription}
                  onChange={handleInputChange}
                  placeholder="请详细描述破损情况..."
                  rows={4}
                  style={styles.textarea}
                  required
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
                <button type="button" onClick={() => setShowDamageForm(false)} style={styles.cancelBtn}>
                  返回签收
                </button>
                <button type="submit" style={styles.submitBtn}>
                  提交破损登记
                </button>
              </div>
            </form>
          </div>
        )}
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
    maxWidth: '800px',
    margin: '0 auto',
  },
  subtitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: '0 0 20px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  deliveryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  deliveryCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  deliveryId: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a2e',
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#fff',
  },
  cardContent: {
    marginBottom: '16px',
  },
  customerInfo: {
    marginBottom: '12px',
  },
  customerName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: '4px',
  },
  productInfo: {
    fontSize: '14px',
    color: '#666',
  },
  deliveryInfo: {
    fontSize: '13px',
    color: '#999',
    lineHeight: '1.6',
  },
  signBtn: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  formContainer: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  orderSummary: {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #eee',
  },
  summaryLabel: {
    fontWeight: '500',
    color: '#666',
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
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#333',
  },
  checkbox: {
    width: '18px',
    height: '18px',
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  select: {
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  },
  textarea: {
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical',
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
  damageNotice: {
    background: '#fff3e0',
    borderLeft: '4px solid #ff9800',
    padding: '12px 16px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#e65100',
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