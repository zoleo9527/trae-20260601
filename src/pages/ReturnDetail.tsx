import React, { useEffect, useState } from 'react';
import {
  Descriptions,
  Button,
  Space,
  Tag,
  Divider,
  Row,
  Col,
  Progress,
  Modal,
  Form,
  Input,
  App as AntdApp,
  Empty,
  Card,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import {
  ReturnRecord,
  Contract,
  DispatchRecord,
  Photo,
  RETURN_STATUS_LABELS,
  DAMAGE_CATEGORY_LABELS,
  DAMAGE_SEVERITY_LABELS,
  CLEANING_STATUS_LABELS,
} from '@shared/types';
import dayjs from 'dayjs';

const { TextArea } = Input;

const ReturnDetail: React.FC = () => {
  const { message: msg, modal } = AntdApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const [record, setRecord] = useState<ReturnRecord | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [dispatch, setDispatch] = useState<DispatchRecord | null>(null);
  const [dispatchPhotos, setDispatchPhotos] = useState<Photo[]>([]);
  const [returnPhotos, setReturnPhotos] = useState<Photo[]>([]);
  const [customerRemarkOpen, setCustomerRemarkOpen] = useState(false);
  const [remarkForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const r = await api.getReturnRecordById(Number(id));
    setRecord(r);
    if (r) {
      const c = await api.getContractById(r.contractId);
      setContract(c || null);
      const dispatches = await api.getDispatchRecords(r.contractId);
      setDispatch(dispatches[0] || null);
      const allPhotos = await api.getPhotos();
      setDispatchPhotos(allPhotos.filter((p) => r.dispatchPhotoIds?.includes(p.id)));
      setReturnPhotos(allPhotos.filter((p) => r.returnPhotoIds?.includes(p.id)));
    }
  };

  if (!record) {
    return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;
  }

  const statusColor = (s: string) =>
    ({ pending: 'gold', confirmed: 'blue', customer_confirmed: 'cyan', disputed: 'red', settled: 'green' }[s] || 'default');

  const imgSrc = (p: Photo) => (p.filePath.startsWith('file://') ? p.filePath : `file://${p.filePath}`);

  const confirmSettlement = () => {
    modal.confirm({
      title: '确认结算',
      icon: <CheckCircleOutlined />,
      content: '确认本次回场结算信息无误？确认后将标记为"已确认"状态。',
      onOk: async () => {
        await api.updateReturnRecord(Number(id), { status: 'confirmed' });
        msg.success('已确认');
        loadData();
      },
    });
  };

  const customerConfirm = () => {
    modal.confirm({
      title: '客户确认',
      icon: <SafetyCertificateOutlined />,
      content: '客户已核对结算单无异议？',
      onOk: async () => {
        await api.updateReturnRecord(Number(id), { status: 'customer_confirmed' });
        msg.success('客户已确认');
        loadData();
      },
    });
  };

  const markDisputed = () => {
    setCustomerRemarkOpen(true);
  };

  const saveRemark = async () => {
    try {
      const v = await remarkForm.validateFields();
      await api.updateReturnRecord(Number(id), {
        status: 'disputed',
        customerRemark: v.customerRemark,
      });
      msg.success('已记录客户异议');
      setCustomerRemarkOpen(false);
      loadData();
    } catch {
      /* noop */
    }
  };

  const handleExport = async () => {
    const dir = await api.selectDirectory();
    if (!dir) return;
    const result = await api.exportSettlement(Number(id), dir);
    if (result) {
      msg.success(`结算单已导出: ${result}`);
    } else {
      msg.error('导出失败');
    }
  };

  const markSettled = () => {
    modal.confirm({
      title: '完成结算',
      content: '确认押金已结清？',
      onOk: async () => {
        await api.updateReturnRecord(Number(id), { status: 'settled' });
        msg.success('已完成结算');
        loadData();
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-card" style={{ padding: '12px 20px' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/return')}>返回列表</Button>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#1f4e79' }}>回场结算详情</span>
            <Tag color={statusColor(record.status)} style={{ fontSize: 14, padding: '2px 12px' }}>
              {RETURN_STATUS_LABELS[record.status]}
            </Tag>
            <Tag color="blue">{record.contractNo}</Tag>
          </Space>
          <Space wrap>
            {record.status !== 'settled' && (
              <>
                <Button icon={<EditOutlined />} onClick={() => navigate(`/return/${id}/edit`)}>编辑</Button>
                {record.status === 'pending' && (
                  <Button type="primary" icon={<CheckCircleOutlined />} onClick={confirmSettlement}>
                    租赁经理确认
                  </Button>
                )}
                {record.status === 'confirmed' && (
                  <Button type="primary" icon={<UserOutlined />} onClick={customerConfirm}>
                    客户确认
                  </Button>
                )}
                {(record.status === 'confirmed' || record.status === 'pending') && (
                  <Button danger icon={<ExclamationCircleOutlined />} onClick={markDisputed}>
                    有异议
                  </Button>
                )}
                {record.status === 'customer_confirmed' && (
                  <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={markSettled}>
                    标记结算完成
                  </Button>
                )}
              </>
            )}
            <Button type="primary" ghost icon={<FileExcelOutlined />} onClick={handleExport}>
              导出结算单
            </Button>
          </Space>
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} xl={15}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="page-card">
              <div className="page-title"><span>📋 合同与设备信息</span></div>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="合同编号" span={2}>
                  <b style={{ fontSize: 16, color: '#2e75b6' }}>{record.contractNo}</b>
                </Descriptions.Item>
                <Descriptions.Item label="客户名称">{record.customerName}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{contract?.customerPhone}</Descriptions.Item>
                <Descriptions.Item label="客户地址" span={2}>{contract?.customerAddress || '-'}</Descriptions.Item>
                <Descriptions.Item label="租赁设备">{record.equipmentName}</Descriptions.Item>
                <Descriptions.Item label="租赁经理">{record.contractManager}</Descriptions.Item>
                <Descriptions.Item label="调度员">{record.dispatcher}</Descriptions.Item>
                <Descriptions.Item label="起租日期">{dayjs(contract?.rentStartDate).format('YYYY-MM-DD')}</Descriptions.Item>
                <Descriptions.Item label="计划归还">{dayjs(contract?.plannedReturnDate).format('YYYY-MM-DD')}</Descriptions.Item>
                <Descriptions.Item label="实际归还" span={2}>
                  <b style={{ color: record.extraDays > 0 ? '#d4380d' : '#52c41a' }}>
                    {dayjs(record.actualReturnDate).format('YYYY-MM-DD HH:mm')}
                    {record.extraDays > 0 && ` （超期 ${record.extraDays} 天）`}
                  </b>
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div className="page-card">
              <div className="page-title"><span>⛽ 油量与工时对比</span></div>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Card size="small" style={{ border: '1px solid #e8f4fd', borderRadius: 8, background: '#fafcff' }}>
                    <h4 style={{ color: '#2e75b6', marginBottom: 16 }}>油量对比</h4>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>出场油量</span>
                        <b>{dispatch?.startFuelLevel || 0}%</b>
                      </div>
                      <Progress percent={dispatch?.startFuelLevel || 0} strokeColor="#52c41a" showInfo={false} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>回场油量</span>
                        <b>{record.endFuelLevel}%</b>
                      </div>
                      <Progress percent={record.endFuelLevel} strokeColor="#faad14" showInfo={false} />
                    </div>
                    <Divider style={{ margin: '12px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                      <span>油差: <b style={{ color: record.fuelDifference > 0 ? '#d4380d' : '#52c41a' }}>
                        {record.fuelDifference > 0 ? '-' : '+'}{Math.abs(record.fuelDifference)}%
                      </b></span>
                      <span>油量补偿: <b style={{ color: '#d4380d' }}>¥{record.fuelCompensation.toFixed(2)}</b></span>
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                      燃油单价: ¥{record.fuelCostPerUnit}/L · 按油箱300L估算
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" style={{ border: '1px solid #e8f4fd', borderRadius: 8, background: '#fafcff' }}>
                    <h4 style={{ color: '#2e75b6', marginBottom: 16 }}>工时对比</h4>
                    <Descriptions size="small" column={1} style={{ marginBottom: 8 }}>
                      <Descriptions.Item label="出场工时">{dispatch?.startWorkingHours || 0} h</Descriptions.Item>
                      <Descriptions.Item label="回场工时">{record.endWorkingHours} h</Descriptions.Item>
                      <Descriptions.Item label="使用工时"><b>{record.workingHoursUsed.toFixed(1)} h</b></Descriptions.Item>
                      <Descriptions.Item label="超限工时" contentStyle={{ color: record.workingHoursOverLimit > 0 ? '#d4380d' : '#52c41a' }}>
                        {record.workingHoursOverLimit.toFixed(1)} h
                      </Descriptions.Item>
                      <Descriptions.Item label="超时费用">
                        {record.overHoursCost > 0 && <b style={{ color: '#d4380d' }}>¥{record.overHoursCost.toFixed(2)}</b>}
                        {record.overHoursCost === 0 && <span style={{ color: '#52c41a' }}>无</span>}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>
            </div>

            <div className="page-card">
              <div className="page-title"><span>🧹 清洗检查</span></div>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="清洁状况">
                  <Tag color={
                    record.cleaningStatus === 'clean' ? 'green' :
                    record.cleaningStatus === 'slightly_dirty' ? 'blue' :
                    record.cleaningStatus === 'dirty' ? 'orange' : 'red'
                  }>{CLEANING_STATUS_LABELS[record.cleaningStatus]}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="清洗费用">
                  <b style={{ color: record.cleaningCost > 0 ? '#d4380d' : '#52c41a' }}>
                    {record.cleaningCost > 0 ? `¥${record.cleaningCost.toFixed(2)}` : '免费'}
                  </b>
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div className="page-card">
              <div className="page-title"><span>🔧 损耗明细（维修师傅鉴定）</span></div>
              {(!record.damageItems || record.damageItems.length === 0) ? (
                <Empty description="无损耗记录，设备状态良好" />
              ) : (
                record.damageItems.map((d, idx) => (
                  <div key={d.id} className={`damage-card damage-${d.severity}`}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <Space style={{ marginBottom: 8 }}>
                          <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>#{idx + 1}</Tag>
                          <Tag color={d.severity === 'severe' ? 'red' : d.severity === 'moderate' ? 'orange' : 'green'}>
                            {DAMAGE_SEVERITY_LABELS[d.severity]}
                          </Tag>
                          <b style={{ fontSize: 15 }}>{DAMAGE_CATEGORY_LABELS[d.category]}</b>
                          {d.needRepair && <Tag color="red">需要维修</Tag>}
                        </Space>
                        <div style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>{d.description}</div>
                        <Row gutter={16}>
                          <Col span={8}>
                            <div style={{ color: '#888', fontSize: 12 }}>维修费用</div>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>¥{d.repairCost?.toFixed(2)}</div>
                          </Col>
                          <Col span={8}>
                            <div style={{ color: '#888', fontSize: 12 }}>客户扣费</div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: '#d4380d' }}>¥{d.deductible?.toFixed(2)}</div>
                          </Col>
                          <Col span={8}>
                            <div style={{ color: '#888', fontSize: 12 }}>维修人员</div>
                            <div>{d.repairer || '-'}</div>
                          </Col>
                        </Row>
                        {d.remark && (
                          <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>备注: {d.remark}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {record.damageItems && record.damageItems.length > 0 && (
                <div style={{ textAlign: 'right', marginTop: 16, padding: '12px 16px', background: '#fff7e6', borderRadius: 6 }}>
                  <span style={{ fontSize: 18, color: '#d4380d', fontWeight: 700 }}>
                    🔴 损耗扣费合计: ¥{record.totalDamageDeductible.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {(record.customerRemark || record.settlementRemark) && (
              <div className="page-card">
                <div className="page-title"><span>📝 备注信息</span></div>
                {record.customerRemark && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>客户备注 / 异议：</div>
                    <div style={{
                      padding: 12,
                      background: record.status === 'disputed' ? '#fff2f0' : '#f6ffed',
                      borderRadius: 6,
                      border: `1px solid ${record.status === 'disputed' ? '#ffa39e' : '#b7eb8f'}`
                    }}>
                      {record.customerRemark}
                    </div>
                  </div>
                )}
                {record.settlementRemark && (
                  <div>
                    <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>内部结算备注：</div>
                    <div style={{ padding: 12, background: '#f0f7ff', borderRadius: 6, border: '1px solid #91caff' }}>
                      {record.settlementRemark}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Col>

        <Col xs={24} xl={9}>
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="page-card">
              <div className="page-title"><span>💰 结算汇总</span></div>
              <div className="settlement-section">
                <h3>租期与租金</h3>
                <div className="settlement-row"><span>租赁天数</span><b>{record.rentDays} 天</b></div>
                <div className="settlement-row"><span>日租金单价</span><span>¥{contract?.dailyRate?.toFixed(2)}</span></div>
                {record.extraDays > 0 && (
                  <div className="settlement-row" style={{ color: '#faad14' }}>
                    <span>超期 {record.extraDays} 天 (×1.2)</span>
                    <span>¥{record.extraDaysCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="settlement-row" style={{ fontWeight: 600 }}>
                  <span>租金小计</span><span style={{ color: '#1f4e79' }}>¥{(record.totalRent + record.extraDaysCost).toFixed(2)}</span>
                </div>
              </div>
              <div className="settlement-section">
                <h3>费用加项</h3>
                <div className="settlement-row"><span>油量补偿</span><span>¥{record.fuelCompensation.toFixed(2)}</span></div>
                <div className="settlement-row"><span>超时费用</span><span>¥{record.overHoursCost.toFixed(2)}</span></div>
                <div className="settlement-row"><span>清洗费用</span><span>¥{record.cleaningCost.toFixed(2)}</span></div>
                <div className="settlement-row" style={{ color: '#d4380d' }}>
                  <span>损耗扣费</span><span>¥{record.totalDamageDeductible.toFixed(2)}</span>
                </div>
                <div className="settlement-row" style={{ fontWeight: 600 }}>
                  <span>扣款合计</span><span style={{ color: '#d4380d' }}>¥{record.totalDeductions.toFixed(2)}</span>
                </div>
              </div>
              <div className="settlement-total">
                <div className="total-line"><span>合同押金</span><b>¥{record.deposit.toLocaleString()}</b></div>
                <div className="total-line"><span>应付总额</span><b>¥{(record.totalRent + record.extraDaysCost + record.totalDeductions).toFixed(2)}</b></div>
                <Divider style={{ margin: '8px 0' }} />
                {record.depositRefund > 0 && (
                  <div className="grand-total" style={{ color: '#52c41a' }}>
                    ✅ 应退客户押金 ¥{record.depositRefund.toFixed(2)}
                  </div>
                )}
                {record.additionalPayment > 0 && (
                  <div className="grand-total" style={{ color: '#d4380d' }}>
                    ⚠️ 客户需补交 ¥{record.additionalPayment.toFixed(2)}
                  </div>
                )}
                {record.depositRefund === 0 && record.additionalPayment === 0 && (
                  <div className="grand-total" style={{ color: '#52c41a' }}>
                    ✅ 押金抵扣完毕，两清
                  </div>
                )}
              </div>
            </div>

            <div className="page-card">
              <div className="page-title"><span>📸 出场 / 回场照片对比</span></div>
              <p style={{ fontSize: 12, color: '#888', marginTop: -12, marginBottom: 12 }}>
                客户有异议时，可对比两组照片
              </p>
              <div className="photo-compare">
                <div className="photo-compare-section">
                  <h4>出场验机照片 ({dispatchPhotos.length})</h4>
                  {dispatchPhotos.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无照片" style={{ margin: 0 }} />
                  ) : (
                    <div className="photo-grid" style={{ gridTemplateColumns: '1fr' }}>
                      {dispatchPhotos.map((p) => (
                        <div key={p.id} className="photo-item">
                          <img src={imgSrc(p)} alt={p.fileName} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="photo-compare-section">
                  <h4>回场验收照片 ({returnPhotos.length})</h4>
                  {returnPhotos.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无照片" style={{ margin: 0 }} />
                  ) : (
                    <div className="photo-grid" style={{ gridTemplateColumns: '1fr' }}>
                      {returnPhotos.map((p) => (
                        <div key={p.id} className="photo-item">
                          <img src={imgSrc(p)} alt={p.fileName} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="page-card">
              <div className="page-title"><span>📌 状态流转</span></div>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {[
                  { step: 1, label: '调度确认回场时间', done: ['pending', 'confirmed', 'customer_confirmed', 'settled', 'disputed'].includes(record.status) },
                  { step: 2, label: '租赁经理核对合同确认', done: ['confirmed', 'customer_confirmed', 'settled'].includes(record.status) },
                  { step: 3, label: '客户核对确认 / 异议', done: ['customer_confirmed', 'settled', 'disputed'].includes(record.status) },
                  { step: 4, label: '押金结算完成', done: record.status === 'settled' },
                ].map((s) => (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag
                      color={s.done ? (s.step === 4 ? 'green' : s.step === 3 ? 'cyan' : 'blue') : 'default'}
                      style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: 0 }}
                    >{s.step}</Tag>
                    <span style={{ color: s.done ? undefined : '#bbb' }}>{s.label}</span>
                  </div>
                ))}
              </Space>
              <Divider style={{ margin: '12px 0' }} />
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="创建时间">{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                {record.confirmedAt && (
                  <Descriptions.Item label="确认时间">{dayjs(record.confirmedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                )}
                {record.customerConfirmedAt && (
                  <Descriptions.Item label="客户确认时间">{dayjs(record.customerConfirmedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                )}
              </Descriptions>
            </div>
          </div>
        </Col>
      </Row>

      <Modal
        title="记录客户异议"
        open={customerRemarkOpen}
        onOk={saveRemark}
        onCancel={() => setCustomerRemarkOpen(false)}
        okText="保存并标记有异议"
        cancelText="取消"
        width={520}
      >
        <Form form={remarkForm} layout="vertical">
          <Form.Item name="customerRemark" label="客户异议说明" rules={[{ required: true, message: '请说明' }]}>
            <TextArea rows={4} placeholder="请详细记录客户的异议内容，例如：不认可某损耗项、油量计算等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReturnDetail;
