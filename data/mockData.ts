import { ProductionOrder, QualityInspection, Shipment, User, Notification } from '../types'

export const mockUsers: User[] = [
  { id: 'u1', name: '王专员', role: 'project_manager', department: '项目管理部', phone: '13800138001' },
  { id: 'u2', name: '李师傅', role: 'producer', department: '制作车间', phone: '13800138002' },
  { id: 'u3', name: '张工', role: 'installer', department: '安装工程部', phone: '13800138003' },
  { id: 'u4', name: '陈总', role: 'admin', department: '管理层', phone: '13800138004' }
]

export const mockOrders: ProductionOrder[] = [
  {
    id: 'po1',
    orderNo: 'PO-2024-001',
    customer: {
      id: 'c1',
      name: '万达广场',
      contact: '刘经理',
      phone: '13900139001',
      address: '北京市朝阳区建国路93号'
    },
    designSpec: {
      fontName: '思源黑体',
      fontVersion: 'V2.000',
      colorCode: '#FF6B35',
      material: '3mm亚克力板',
      size: '1200x600mm',
      thickness: '3mm'
    },
    siteSurvey: {
      id: 'ss1',
      height: 8.5,
      installationType: 'hanging',
      accessType: 'scaffold',
      powerSupply: true,
      notes: '现场已具备安装条件，建议夜间施工',
      surveyDate: '2024-01-15',
      surveyor: '张工'
    },
    productName: '商场入口发光字',
    quantity: 6,
    deadline: '2024-01-25',
    status: 'quality_check',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-20'
  },
  {
    id: 'po2',
    orderNo: 'PO-2024-002',
    customer: {
      id: 'c2',
      name: '华为体验店',
      contact: '赵店长',
      phone: '13900139002',
      address: '上海市浦东新区陆家嘴环路1000号'
    },
    designSpec: {
      fontName: 'Helvetica Neue',
      fontVersion: 'V5.5',
      colorCode: '#CF0A2C',
      material: '2mm不锈钢烤漆',
      size: '800x400mm',
      thickness: '2mm'
    },
    siteSurvey: {
      id: 'ss2',
      height: 3.2,
      installationType: 'wall',
      accessType: 'ladder',
      powerSupply: true,
      notes: '墙面为大理石材质，需特殊固定方式',
      surveyDate: '2024-01-16',
      surveyor: '张工'
    },
    productName: '品牌形象墙字',
    quantity: 4,
    deadline: '2024-01-28',
    status: 'producing',
    createdAt: '2024-01-12',
    updatedAt: '2024-01-19'
  },
  {
    id: 'po3',
    orderNo: 'PO-2024-003',
    customer: {
      id: 'c3',
      name: '星巴克',
      contact: '孙经理',
      phone: '13900139003',
      address: '广州市天河区天河路383号'
    },
    designSpec: {
      fontName: 'Starbucks Sans',
      fontVersion: 'V3.1',
      colorCode: '#006241',
      material: '亚克力+LED背光',
      size: '1500x800mm',
      thickness: '5mm'
    },
    siteSurvey: {
      id: 'ss3',
      height: 6.8,
      installationType: 'hanging',
      accessType: 'crane',
      powerSupply: false,
      notes: '需提前协调电力接入，高空作业需报备',
      surveyDate: '2024-01-14',
      surveyor: '张工'
    },
    productName: '门店招牌',
    quantity: 1,
    deadline: '2024-01-30',
    status: 'packaging',
    createdAt: '2024-01-08',
    updatedAt: '2024-01-21'
  },
  {
    id: 'po4',
    orderNo: 'PO-2024-004',
    customer: {
      id: 'c4',
      name: '小米之家',
      contact: '周店长',
      phone: '13900139004',
      address: '深圳市南山区科技园南路'
    },
    designSpec: {
      fontName: 'MiSans',
      fontVersion: 'V2.0',
      colorCode: '#FF6900',
      material: '铝合金边框+灯箱布',
      size: '2000x1000mm',
      thickness: '8mm'
    },
    siteSurvey: {
      id: 'ss4',
      height: 4.5,
      installationType: 'wall',
      accessType: 'scaffold',
      powerSupply: true,
      notes: '安装位置有消防管道，需避让',
      surveyDate: '2024-01-17',
      surveyor: '张工'
    },
    productName: '门店灯箱',
    quantity: 2,
    deadline: '2024-02-01',
    status: 'completed',
    createdAt: '2024-01-14',
    updatedAt: '2024-01-21'
  },
  {
    id: 'po5',
    orderNo: 'PO-2024-005',
    customer: {
      id: 'c5',
      name: '阿里巴巴园区',
      contact: '马主管',
      phone: '13900139005',
      address: '杭州市余杭区文一西路969号'
    },
    designSpec: {
      fontName: '阿里普惠体',
      fontVersion: 'V2.0',
      colorCode: '#FF6A00',
      material: '不锈钢立体字',
      size: '3000x1500mm',
      thickness: '10mm'
    },
    siteSurvey: {
      id: 'ss5',
      height: 12.0,
      installationType: 'hanging',
      accessType: 'crane',
      powerSupply: true,
      notes: '高空作业，需办理作业许可证，建议分阶段安装',
      surveyDate: '2024-01-12',
      surveyor: '张工'
    },
    productName: '园区标识牌',
    quantity: 3,
    deadline: '2024-02-10',
    status: 'pending',
    createdAt: '2024-01-18',
    updatedAt: '2024-01-18'
  }
]

export const mockQualityInspections: QualityInspection[] = [
  {
    id: 'qi1',
    productionOrderId: 'po1',
    order: mockOrders[0],
    checkItems: [
      { id: 'ci1', name: '字体版本核对', standard: '思源黑体 V2.000', result: 'pass', remark: '字体正确', checkedBy: '李师傅', checkedAt: '2024-01-20 09:30' },
      { id: 'ci2', name: '材料规格检查', standard: '3mm亚克力板', result: 'pass', remark: '厚度符合要求', checkedBy: '李师傅', checkedAt: '2024-01-20 09:35' },
      { id: 'ci3', name: '颜色核对', standard: '#FF6B35', result: 'fail', remark: '颜色偏差约5%，已重新喷涂', checkedBy: '李师傅', checkedAt: '2024-01-20 09:45' },
      { id: 'ci4', name: '尺寸精度', standard: '1200x600mm ±2mm', result: 'pass', remark: '尺寸准确', checkedBy: '李师傅', checkedAt: '2024-01-20 09:50' },
      { id: 'ci5', name: 'LED亮度测试', standard: '≥3000cd/m²', result: 'pass', remark: '亮度达标', checkedBy: '李师傅', checkedAt: '2024-01-20 10:00' },
      { id: 'ci6', name: '安装孔位', standard: '符合图纸要求', result: 'pending', remark: '', checkedBy: '', checkedAt: '' }
    ],
    overallResult: 'pending',
    remarks: '颜色问题已处理，等待最终检查',
    inspector: '李师傅',
    inspectedAt: '2024-01-20 10:00',
    updatedAt: '2024-01-20 10:15',
    revisionCount: 1
  },
  {
    id: 'qi3',
    productionOrderId: 'po3',
    order: mockOrders[2],
    checkItems: [
      { id: 'ci7', name: '字体版本核对', standard: 'Starbucks Sans V3.1', result: 'pass', remark: '字体正确', checkedBy: '李师傅', checkedAt: '2024-01-21 08:30' },
      { id: 'ci8', name: '材料规格检查', standard: '亚克力+LED背光', result: 'pass', remark: '材料符合要求', checkedBy: '李师傅', checkedAt: '2024-01-21 08:45' },
      { id: 'ci9', name: '颜色核对', standard: '#006241', result: 'pass', remark: '颜色准确', checkedBy: '李师傅', checkedAt: '2024-01-21 09:00' },
      { id: 'ci10', name: '尺寸精度', standard: '1500x800mm ±2mm', result: 'pass', remark: '尺寸准确', checkedBy: '李师傅', checkedAt: '2024-01-21 09:15' },
      { id: 'ci11', name: 'LED亮度测试', standard: '≥3000cd/m²', result: 'pass', remark: '亮度达标', checkedBy: '李师傅', checkedAt: '2024-01-21 09:30' },
      { id: 'ci12', name: '安装孔位', standard: '符合图纸要求', result: 'pass', remark: '孔位正确', checkedBy: '李师傅', checkedAt: '2024-01-21 09:45' }
    ],
    overallResult: 'pass',
    remarks: '全部检查通过，可进入打包环节',
    inspector: '李师傅',
    inspectedAt: '2024-01-21 09:45',
    updatedAt: '2024-01-21 09:45',
    revisionCount: 0
  }
]

export const mockShipments: Shipment[] = [
  {
    id: 's1',
    productionOrderId: 'po3',
    order: mockOrders[2],
    qualityInspection: mockQualityInspections[1],
    packagingItems: [
      { id: 'pi1', name: '主标识牌', quantity: 1, status: 'packed' },
      { id: 'pi2', name: '安装配件包', quantity: 1, status: 'packed' },
      { id: 'pi3', name: '电源线(10m)', quantity: 2, status: 'packed' },
      { id: 'pi4', name: '安装说明书', quantity: 1, status: 'packed' },
      { id: 'pi5', name: '保修卡', quantity: 1, status: 'pending' }
    ],
    boxCount: 3,
    weight: 45.5,
    shippingMethod: '德邦物流',
    trackingNo: 'DB20240121001',
    shipper: '王专员',
    shippedAt: '',
    createdAt: '2024-01-21 10:00',
    status: 'packaging'
  }
]

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'quality_update', title: '质检更新提醒', message: '订单 PO-2024-001 质检状态已更新，颜色项需重新处理', read: false, targetRole: 'project_manager', createdAt: '2024-01-20 10:15', relatedOrderId: 'po1' },
  { id: 'n2', type: 'packaging_ready', title: '打包准备提醒', message: '订单 PO-2024-003 质检通过，请安排打包', read: false, targetRole: 'producer', createdAt: '2024-01-21 09:50', relatedOrderId: 'po3' },
  { id: 'n3', type: 'alert', title: '安装延期提醒', message: '订单 PO-2024-005 高空作业许可证审批中，可能影响工期', read: false, targetRole: 'installer', createdAt: '2024-01-21 08:00', relatedOrderId: 'po5' },
  { id: 'n4', type: 'quality_update', title: '质检通过', message: '订单 PO-2024-003 全部质检项已通过', read: true, targetRole: 'project_manager', createdAt: '2024-01-21 09:45', relatedOrderId: 'po3' }
]