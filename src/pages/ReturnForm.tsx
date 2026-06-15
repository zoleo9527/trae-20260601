import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Space,
  Progress,
  Divider,
  Row,
  Col,
  Modal,
  Checkbox,
  App as AntdApp,
  Descriptions,
  Tag,
  Empty,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SafetyOutlined,
  DashboardOutlined,
  ToolOutlined,
  FileTextOutlined,
  BankOutlined,
  CarOutlined,
  FieldTimeOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import {
  Contract,
  DamageItem,
  DispatchRecord,
  Photo,
  RETURN_STATUS_LABELS,
  DAMAGE_CATEGORY_LABELS,
  DAMAGE_SEVERITY_LABELS,
  CLEANING_STATUS_LABELS,
  DamageCategory,
  DamageSeverity,
  CleaningStatus,
} from '@shared/types';
import dayjs from 'dayjs';
import PhotoUploader from '../components/PhotoUploader';

const { Option } = Select;
const { TextArea } = Input;

interface CalcState {
  rentDays: number;
  totalRent: number;
  extraDays: number;
  extraDaysCost: number;
  fuelDifference: number;
  fuelCompensation: number;
  workingHoursUsed: number;
  workingHoursOverLimit: number;
  overHoursCost: number;
  cleaningCost: number;
  totalDamageDeductible: number;
  totalDeductions: number;
  depositRefund: number;
  additionalPayment: number;
}

const ReturnForm: React.FC = () => {
  const { message: msg } = AntdApp.useApp();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form] = Form.useForm();
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [dispatchRecord, setDispatchRecord] = useState<DispatchRecord | null>(null);
  const [damageItems, setDamageItems] = useState<DamageItem[]>([]);
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [editingDamage, setEditingDamage] = useState<DamageItem | null>(null);
  const [damageForm] = Form.useForm();

  const [dispatchPhotoIds, setDispatchPhotoIds] = useState<number[]>([]);
  const [dispatchPhotos, setDispatchPhotos] = useState<Photo[]>([]);
  const [returnPhotoIds, setReturnPhotoIds] = useState<number[]>([]);
  const [returnPhotos, setReturnPhotos] = useState<Photo[]>([]);

  const [calc, setCalc] = useState<CalcState>({
    rentDays: 0, totalRent: 0, extraDays: 0, extraDaysCost: 0,
    fuelDifference: 0, fuelCompensation: 0, workingHoursUsed: 0,
    workingHoursOverLimit: 0, overHoursCost: 0, cleaningCost: 0,
    totalDamageDeductible: 0, totalDeductions: 0, depositRefund: 0, additionalPayment: 0,
  });

  useEffect(() => {
    api.getContracts({ status: 'active' }).then((list) => {
      setActiveContracts(list);
      if (isEdit) loadEditData();
    });
  }, []);

  useEffect(() => {
    if (!selectedContract) return;
    recalculate();
  }, [
    form, selectedContract, dispatchRecord, damageItems,
    form.getFieldValue('actualReturnDate'),
    form.getFieldValue('endFuelLevel'),
    form.getFieldValue('fuelCostPerUnit'),
    form.getFieldValue('endWorkingHours'),
    form.getFieldValue('overHoursRate'),
    form.getFieldValue('dailyHoursLimit'),
    form.getFieldValue('cleaningStatus'),
  ]);

  const loadEditData = async () => {
    const record = await api.getReturnRecordById(Number(id));
    if (!record) return;
    const contract = await api.getContractById(record.contractId);
    setSelectedContract(contract);
    const dispatches = await api.getDispatchRecords(record.contractId);
    if (dispatches.length > 0) setDispatchRecord(dispatches[0]);

    form.setFieldsValue({
      contractId: record.contractId,
      actualReturnDate: dayjs(record.actualReturnDate),
      dispatcher: record.dispatcher,
      contractManager: record.contractManager,
      endFuelLevel: record.endFuelLevel,
      fuelCostPerUnit: record.fuelCostPerUnit,
      endWorkingHours: record.endWorkingHours,
      overHoursRate: record.overHoursRate,
      cleaningStatus: record.cleaningStatus,
      status: record.status,
      customerRemark: record.customerRemark,
      settlementRemark: record.settlementRemark,
    });
    setDamageItems(record.damageItems || []);
    setDispatchPhotoIds(record.dispatchPhotoIds || []);
    setReturnPhotoIds(record.returnPhotoIds || []);
    const dp = await api.getPhotos();
    setDispatchPhotos(dp.filter((p) => record.dispatchPhotoIds?.includes(p.id)));
    setReturnPhotos(dp.filter((p) => record.returnPhotoIds?.includes(p.id)));
  };

  const handleContractChange = async (contractId: number) => {
    const contract = activeContracts.find((c) => c.id === contractId) || await api.getContractById(contractId);
    setSelectedContract(contract || null);
    form.setFieldsValue({
      contractManager: contract?.contractManager,
    });
    if (contract) {
      const dispatches = await api.getDispatchRecords(contract.id);
      setDispatchRecord(dispatches.length > 0 ? dispatches[0] : null);
    }
  };

  const recalculate = () => {
    if (!selectedContract) return;
    const vals = form.getFieldsValue(true);
    const start = dayjs(selectedContract.rentStartDate);
    const end = vals.actualReturnDate ? dayjs(vals.actualReturnDate) : dayjs();
    const planned = dayjs(selectedContract.plannedReturnDate);

    const rentDays = Math.max(1, end.diff(start, 'day') + 1);
    const extraDays = Math.max(0, end.diff(planned, 'day'));
    const totalRent = rentDays * (selectedContract.dailyRate || 0);
    const extraDaysCost = extraDays * (selectedContract.dailyRate || 0) * 1.2;

    const startFuel = dispatchRecord?.startFuelLevel || 0;
    const endFuel = vals.endFuelLevel || 0;
    const fuelDifference = Math.max(0, startFuel - endFuel);
    const fuelUnit = vals.fuelCostPerUnit || 7.5;
    const tankCapacity = 300;
    const fuelCompensation = (fuelDifference / 100) * tankCapacity * fuelUnit;

    const startHours = dispatchRecord?.startWorkingHours || 0;
    const endHours = vals.endWorkingHours || 0;
    const workingHoursUsed = Math.max(0, endHours - startHours);
    const dailyLimit = vals.dailyHoursLimit || 8;
    const allowedHours = rentDays * dailyLimit;
    const workingHoursOverLimit = Math.max(0, workingHoursUsed - allowedHours);
    const overHoursRate = vals.overHoursRate || 100;
    const overHoursCost = workingHoursOverLimit * overHoursRate;

    const cleaningMap: Record<CleaningStatus, number> = {
      clean: 0, slightly_dirty: 100, dirty: 300, needs_wash: 500,
    };
    const cleaningCost = cleaningMap[vals.cleaningStatus as CleaningStatus] || 0;

    const totalDamageDeductible = damageItems.reduce((sum, d) => sum + (d.deductible || 0), 0);
    const totalDeductions = fuelCompensation + overHoursCost + cleaningCost + totalDamageDeductible;

    const deposit = selectedContract.deposit || 0;
    const netPayable = totalRent + extraDaysCost + totalDeductions;
    const depositRefund = Math.max(0, deposit - netPayable);
    const additionalPayment = Math.max(0, netPayable - deposit);

    setCalc({
      rentDays, totalRent, extraDays, extraDaysCost,
      fuelDifference, fuelCompensation, workingHoursUsed,
      workingHoursOverLimit, overHoursCost, cleaningCost,
      totalDamageDeductible, totalDeductions, depositRefund, additionalPayment,
    });
  };

  const handleAddDamage = () => {
    setEditingDamage(null);
    damageForm.resetFields();
    damageForm.setFieldsValue({ severity: 'minor', needRepair: false, repairCost: 0, deductible: 0 });
    setDamageModalOpen(true);
  };

  const handleEditDamage = (d: DamageItem) => {
    setEditingDamage(d);
    damageForm.setFieldsValue(d);
    setDamageModalOpen(true);
  };

  const handleSaveDamage = async () => {
    try {
      const values = await damageForm.validateFields();
      if (editingDamage) {
        const idx = damageItems.findIndex((d) => d.id === editingDamage.id);
        const newItems = [...damageItems];
        newItems[idx] = { ...editingDamage, ...values };
        if (editingDamage.id > 0) {
          await api.updateDamageItem(editingDamage.id, values);
        }
        setDamageItems(newItems);
      } else {
        const tempId = Date.now();
        setDamageItems([...damageItems, { ...values, id: tempId, returnRecordId: 0 } as DamageItem]);
      }
      setDamageModalOpen(false);
      setTimeout(recalculate, 50);
    } catch (e) { /* noop */ }
  };

  const handleDeleteDamage = async (d: DamageItem) => {
    if (d.id > 0) await api.deleteDamageItem(d.id);
    setDamageItems(damageItems.filter((x) => x.id !== d.id));
    setTimeout(recalculate, 50);
  };

  const handleSubmit = async (asDraft: boolean) => {
    try {
      const vals = await form.validateFields(['contractId', 'actualReturnDate', 'dispatcher', 'contractManager']);
      if (!selectedContract) {
        msg.error('请先选择合同');
        return;
      }
      recalculate();
      const returnTime = vals.actualReturnDate.toDate().toISOString();
      const actualReturnDate = vals.actualReturnDate.format('YYYY-MM-DD');

      const data = {
        contractId: selectedContract.id,
        equipmentId: selectedContract.equipmentId,
        returnTime,
        actualReturnDate,
        dispatcher: vals.dispatcher,
        contractManager: vals.contractManager,
        endFuelLevel: vals.endFuelLevel || 0,
        fuelDifference: calc.fuelDifference,
        fuelCostPerUnit: vals.fuelCostPerUnit || 7.5,
        fuelCompensation: calc.fuelCompensation,
        endWorkingHours: vals.endWorkingHours || 0,
        workingHoursUsed: calc.workingHoursUsed,
        workingHoursOverLimit: calc.workingHoursOverLimit,
        overHoursRate: vals.overHoursRate || 0,
        overHoursCost: calc.overHoursCost,
        cleaningStatus: vals.cleaningStatus || 'clean',
        cleaningCost: calc.cleaningCost,
        rentDays: calc.rentDays,
        totalRent: calc.totalRent,
        extraDays: calc.extraDays,
        extraDaysCost: calc.extraDaysCost,
        totalDamageDeductible: calc.totalDamageDeductible,
        totalDeductions: calc.totalDeductions,
        deposit: selectedContract.deposit,
        depositRefund: calc.depositRefund,
        additionalPayment: calc.additionalPayment,
        status: asDraft ? 'pending' : vals.status || 'pending',
        dispatchPhotoIds,
        returnPhotoIds,
        customerRemark: vals.customerRemark,
        settlementRemark: vals.settlementRemark,
      };

      let recordId: number;
      if (isEdit) {
        await api.updateReturnRecord(Number(id), data);
        recordId = Number(id);
        msg.success('更新成功');
      } else {
        recordId = await api.createReturnRecord(data) as number;
        msg.success('回场验收记录已创建');
      }

      for (const d of damageItems) {
        if (d.id <= 0 || !isEdit) {
          await api.createDamageItem({ ...d, returnRecordId: recordId });
        }
      }

      navigate(`/return/${recordId}`);
    } catch (e: any) {
      msg.error(e?.message || '保存失败');
    }
  };

  const statusColor = (s: string) => ({ pending: 'gold', confirmed: 'blue', customer_confirmed: 'cyan', disputed: 'red', settled: 'green' }[s] || 'default');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-card" style={{ padding: '12px 20px' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/return')}>返回列表</Button>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#1f4e79' }}>
              {isEdit ? '编辑回场验收' : '新增回场验收'}
            </span>
            {selectedContract && <Tag color="blue">{selectedContract.contractNo}</Tag>}
            {selectedContract && <span>{selectedContract.customerName} - {selectedContract.equipmentName}</span>}
          </Space>
          <Space>
            <Button onClick={() => handleSubmit(true)} icon={<SaveOutlined />}>保存草稿</Button>
            <Button type="primary" onClick={() => handleSubmit(false)} icon={<SaveOutlined />}>确认提交</Button>
          </Space>
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} xl={15}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="page-card">
              <div className="page-title"><span><FileTextOutlined /> 基础信息</span></div>
              <Form form={form} layout="vertical" initialValues={{
                endFuelLevel: 70, fuelCostPerUnit: 7.5, endWorkingHours: 0,
                overHoursRate: 100, dailyHoursLimit: 8, cleaningStatus: 'slightly_dirty', status: 'pending',
                actualReturnDate: dayjs(),
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Form.Item name="contractId" label="选择合同" rules={[{ required: true, message: '请选择合同' }]}>
                    <Select
                      placeholder="选择进行中的租赁合同"
                      showSearch
                      optionFilterProp="children"
                      onChange={handleContractChange}
                      disabled={isEdit}
                    >
                      {activeContracts.map((c) => (
                        <Option key={c.id} value={c.id}>
                          [{c.contractNo}] {c.customerName} - {c.equipmentName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="actualReturnDate" label="实际回场日期时间" rules={[{ required: true }]}>
                    <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="dispatcher" label="调度员（确认回场时间）" rules={[{ required: true }]}>
                    <Input placeholder="调度员姓名" />
                  </Form.Item>
                  <Form.Item name="contractManager" label="租赁经理（核对合同）" rules={[{ required: true }]}>
                    <Input placeholder="租赁经理姓名" />
                  </Form.Item>
                  {isEdit && (
                    <Form.Item name="status" label="结算状态">
                      <Select>
                        {Object.entries(RETURN_STATUS_LABELS).map(([k, v]) => (
                          <Option key={k} value={k}>{v}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  )}
                </div>
              </Form>

              {selectedContract && (
                <Descriptions size="small" column={2} bordered style={{ marginTop: 12 }}>
                  <Descriptions.Item label="客户名称" span={2}>{selectedContract.customerName}</Descriptions.Item>
                  <Descriptions.Item label="联系电话">{selectedContract.customerPhone}</Descriptions.Item>
                  <Descriptions.Item label="日租金">¥{selectedContract.dailyRate}</Descriptions.Item>
                  <Descriptions.Item label="起租日期">{dayjs(selectedContract.rentStartDate).format('YYYY-MM-DD')}</Descriptions.Item>
                  <Descriptions.Item label="计划归还">{dayjs(selectedContract.plannedReturnDate).format('YYYY-MM-DD')}</Descriptions.Item>
                  <Descriptions.Item label="合同押金" span={2}>¥{(selectedContract.deposit || 0).toLocaleString()}</Descriptions.Item>
                  {dispatchRecord && (
                    <>
                      <Descriptions.Item label="出场油量 (%)">{dispatchRecord.startFuelLevel}</Descriptions.Item>
                      <Descriptions.Item label="出场工时 (h)">{dispatchRecord.startWorkingHours}</Descriptions.Item>
                      <Descriptions.Item label="出场操作员">{dispatchRecord.operatorName}</Descriptions.Item>
                      <Descriptions.Item label="出场调度">{dispatchRecord.dispatcher}</Descriptions.Item>
                    </>
                  )}
                </Descriptions>
              )}
            </div>

            <div className="page-card">
              <div className="page-title"><span><DashboardOutlined /> 油量 & 工时核算</span></div>
              <Form form={form} layout="vertical">
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, background: '#fafafa' }}>
                      <h4 style={{ marginBottom: 16, color: '#2e75b6' }}><SafetyOutlined /> 油量检查</h4>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span>出场油量: {dispatchRecord?.startFuelLevel || 0}%</span>
                            <span>回场油量: {form.getFieldValue('endFuelLevel') || 0}%</span>
                          </div>
                          <Progress
                            percent={dispatchRecord?.startFuelLevel || 0}
                            showInfo={false}
                            strokeColor="#52c41a"
                            size="small"
                            style={{ marginBottom: 4 }}
                          />
                          <Form.Item name="endFuelLevel" style={{ marginBottom: 8 }}>
                            <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
                          </Form.Item>
                          <div style={{ color: calc.fuelDifference > 0 ? '#d4380d' : '#52c41a', fontWeight: 500 }}>
                            油差: {calc.fuelDifference > 0 ? '少' : '多'} {Math.abs(calc.fuelDifference).toFixed(1)}%
                            {calc.fuelCompensation > 0 && ` · 需补偿 ¥${calc.fuelCompensation.toFixed(2)}`}
                          </div>
                        </div>
                        <Form.Item name="fuelCostPerUnit" label="燃油单价 (元/L)">
                          <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Space>
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, background: '#fafafa' }}>
                      <h4 style={{ marginBottom: 16, color: '#2e75b6' }}><FieldTimeOutlined /> 工时检查</h4>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span>出场: {dispatchRecord?.startWorkingHours || 0} h</span>
                            <span>回场: {form.getFieldValue('endWorkingHours') || 0} h</span>
                          </div>
                          <Form.Item name="endWorkingHours" style={{ marginBottom: 8 }} label="回场小时表读数">
                            <InputNumber min={0} style={{ width: '100%' }} addonAfter="h" />
                          </Form.Item>
                          <div>使用工时: <b>{calc.workingHoursUsed.toFixed(1)}</b> h</div>
                          {calc.workingHoursOverLimit > 0 && (
                            <div style={{ color: '#d4380d' }}>
                              超限: {calc.workingHoursOverLimit.toFixed(1)} h · 超时费 ¥{calc.overHoursCost.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <Form.Item name="dailyHoursLimit" label="日限工时 (h)" style={{ marginBottom: 0 }}>
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item name="overHoursRate" label="超时费率 (元/h)" style={{ marginBottom: 0 }}>
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </div>
                      </Space>
                    </div>
                  </Col>
                </Row>
              </Form>
            </div>

            <div className="page-card">
              <div className="page-title"><span><CarOutlined /> 清洗检查</span></div>
              <Form form={form} layout="vertical">
                <Form.Item name="cleaningStatus" label="设备清洁状况" rules={[{ required: true }]}>
                  <Select>
                    {Object.entries(CLEANING_STATUS_LABELS).map(([k, v]) => (
                      <Option key={k} value={k}>{v}</Option>
                    ))}
                  </Select>
                </Form.Item>
                {calc.cleaningCost > 0 && (
                  <div style={{ color: '#d4380d' }}>需收取清洗费: ¥{calc.cleaningCost.toFixed(2)}</div>
                )}
              </Form>
            </div>

            <div className="page-card">
              <div className="page-title">
                <span><ToolOutlined /> 损耗明细（维修师傅判断）</span>
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddDamage}>
                  添加损耗项
                </Button>
              </div>
              {damageItems.length === 0 ? (
                <Empty description="暂无损耗记录，点击右上角添加" />
              ) : (
                damageItems.map((d, idx) => (
                  <div key={d.id} className={`damage-card damage-${d.severity}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <Space style={{ marginBottom: 8 }}>
                          <Tag color="blue">#{idx + 1}</Tag>
                          <Tag color={d.severity === 'severe' ? 'red' : d.severity === 'moderate' ? 'orange' : 'green'}>
                            {DAMAGE_SEVERITY_LABELS[d.severity]}
                          </Tag>
                          <b>{DAMAGE_CATEGORY_LABELS[d.category]}</b>
                          {d.needRepair && <Tag color="red">需维修</Tag>}
                        </Space>
                        <div style={{ marginBottom: 6, color: '#555' }}>{d.description}</div>
                        <Space size={16}>
                          <span>维修费用: <b>¥{d.repairCost?.toFixed(2)}</b></span>
                          <span style={{ color: '#d4380d' }}>客户扣费: <b>¥{d.deductible?.toFixed(2)}</b></span>
                          {d.repairer && <span>维修人: {d.repairer}</span>}
                        </Space>
                        {d.remark && <div style={{ marginTop: 6, color: '#888', fontSize: 12 }}>备注: {d.remark}</div>}
                      </div>
                      <Space>
                        <Button size="small" icon={<EditOutlined />} onClick={() => handleEditDamage(d)}>修改</Button>
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteDamage(d)}>删除</Button>
                      </Space>
                    </div>
                  </div>
                ))
              )}
              {damageItems.length > 0 && (
                <div style={{ textAlign: 'right', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                  <span style={{ fontSize: 16, color: '#d4380d', fontWeight: 600 }}>
                    损耗扣费合计: ¥{calc.totalDamageDeductible.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="page-card">
              <div className="page-title"><span><BankOutlined /> 备注与确认</span></div>
              <Form form={form} layout="vertical">
                <Form.Item name="customerRemark" label="客户异议 / 客户备注">
                  <TextArea rows={2} placeholder="客户有异议时，请在此处记录，同时请保留出场和回场照片供对比" />
                </Form.Item>
                <Form.Item name="settlementRemark" label="结算备注（内部）">
                  <TextArea rows={2} placeholder="结算说明等" />
                </Form.Item>
              </Form>
            </div>
          </div>
        </Col>

        <Col xs={24} xl={9}>
          <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="page-card">
              <div className="page-title"><span>💰 费用核算</span></div>
              {selectedContract ? (
                <>
                  <div className="settlement-section">
                    <h3>租期与租金</h3>
                    <div className="settlement-row"><span>租赁天数</span><b>{calc.rentDays} 天</b></div>
                    <div className="settlement-row"><span>日租金单价</span><span>¥{selectedContract.dailyRate?.toFixed(2)}</span></div>
                    <div className="settlement-row"><span>超期天数</span><span style={{ color: calc.extraDays > 0 ? '#faad14' : undefined }}>{calc.extraDays} 天</span></div>
                    <div className="settlement-row"><span>超期费用 (×1.2)</span><span>¥{calc.extraDaysCost.toFixed(2)}</span></div>
                    <div className="settlement-row" style={{ fontWeight: 600 }}>
                      <span>租金小计</span><span style={{ color: '#1f4e79' }}>¥{(calc.totalRent + calc.extraDaysCost).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="settlement-section">
                    <h3>加项与扣款</h3>
                    <div className="settlement-row"><span>油量补偿</span><span>¥{calc.fuelCompensation.toFixed(2)}</span></div>
                    <div className="settlement-row"><span>超时费用</span><span>¥{calc.overHoursCost.toFixed(2)}</span></div>
                    <div className="settlement-row"><span>清洗费用</span><span>¥{calc.cleaningCost.toFixed(2)}</span></div>
                    <div className="settlement-row"><span style={{ color: '#d4380d' }}>损耗扣费</span><span style={{ color: '#d4380d' }}>¥{calc.totalDamageDeductible.toFixed(2)}</span></div>
                    <div className="settlement-row" style={{ fontWeight: 600 }}>
                      <span>扣款合计</span><span style={{ color: '#d4380d' }}>¥{calc.totalDeductions.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="settlement-total">
                    <div className="total-line"><span>合同押金</span><b>¥{(selectedContract.deposit || 0).toLocaleString()}</b></div>
                    <div className="total-line"><span>应付总额 (租金+扣款)</span><b>¥{(calc.totalRent + calc.extraDaysCost + calc.totalDeductions).toFixed(2)}</b></div>
                    <Divider style={{ margin: '8px 0' }} />
                    {calc.depositRefund > 0 && (
                      <div className="total-line"><span>应退客户押金</span><b style={{ color: '#52c41a' }}>¥{calc.depositRefund.toFixed(2)}</b></div>
                    )}
                    {calc.additionalPayment > 0 && (
                      <div className="total-line"><span>客户需补交</span><b style={{ color: '#d4380d' }}>¥{calc.additionalPayment.toFixed(2)}</b></div>
                    )}
                    {calc.depositRefund === 0 && calc.additionalPayment === 0 && (
                      <div className="total-line"><span>两清</span><b style={{ color: '#52c41a' }}>¥0.00</b></div>
                    )}
                  </div>
                </>
              ) : (
                <Empty description="请先选择合同以计算费用" />
              )}
            </div>

            <div className="page-card">
              <div className="page-title"><span>📸 出场验机照片</span></div>
              <p style={{ fontSize: 12, color: '#888', marginTop: -12 }}>客户有异议时可对比出场与回场照片</p>
              <PhotoUploader
                photoIds={dispatchPhotoIds}
                photos={dispatchPhotos}
                type="dispatch"
                onChange={(ids, ps) => { setDispatchPhotoIds(ids); setDispatchPhotos(ps); }}
              />
            </div>

            <div className="page-card">
              <div className="page-title"><span>📸 回场验收照片</span></div>
              <PhotoUploader
                photoIds={returnPhotoIds}
                photos={returnPhotos}
                type="return"
                onChange={(ids, ps) => { setReturnPhotoIds(ids); setReturnPhotos(ps); }}
              />
            </div>
          </div>
        </Col>
      </Row>

      <Modal
        title={editingDamage ? '编辑损耗项' : '添加损耗项'}
        open={damageModalOpen}
        onOk={handleSaveDamage}
        onCancel={() => setDamageModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={560}
      >
        <Form form={damageForm} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="category" label="损耗类别" rules={[{ required: true }]}>
              <Select>
                {Object.entries(DAMAGE_CATEGORY_LABELS).map(([k, v]) => (
                  <Option key={k} value={k as DamageCategory}>{v}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="severity" label="严重程度" rules={[{ required: true }]}>
              <Select>
                {Object.entries(DAMAGE_SEVERITY_LABELS).map(([k, v]) => (
                  <Option key={k} value={k as DamageSeverity}>{v}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="description" label="损伤描述" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="具体描述损伤部位、情况" />
          </Form.Item>
          <Form.Item name="needRepair" valuePropName="checked">
            <Checkbox>需要维修</Checkbox>
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="repairCost" label="维修费用 (元)">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="deductible" label="客户扣费 (元)" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </div>
          <Form.Item name="repairer" label="维修人员">
            <Input placeholder="维修师傅姓名" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReturnForm;
