import type { CustomerOrder, Shelter, OperationLog, RoleInfo, SpecChangeRecord, OrderItemSnapshot } from '@/types';

export const roleInfoList: RoleInfo[] = [
  {
    key: 'SALES',
    name: '销售内勤',
    description: '客户订单录入、确认、改规格处理',
    iconName: 'FileText',
    todoCount: 0,
    onlineCount: 2,
  },
  {
    key: 'GROWER',
    name: '种植员',
    description: '棚区巡检、采切执行、花期异常上报',
    iconName: 'Scissors',
    todoCount: 0,
    onlineCount: 3,
  },
  {
    key: 'PACKER',
    name: '包装主管',
    description: '规格核对、包装作业、物流单生成',
    iconName: 'Package',
    todoCount: 0,
    onlineCount: 1,
  },
];

export const shelterList: Shelter[] = [
  { id: 'SH-A01', name: 'A区01棚', flowerType: '玫瑰', color: '红色系', maturity: 95, status: 'READY', availableQty: 80, forecastDate: '2026-06-08', actualDate: '2026-06-08' },
  { id: 'SH-A02', name: 'A区02棚', flowerType: '玫瑰', color: '粉色系', maturity: 72, status: 'IMMATURE', availableQty: 60, forecastDate: '2026-06-12' },
  { id: 'SH-A03', name: 'A区03棚', flowerType: '玫瑰', color: '白色系', maturity: 88, status: 'READY', availableQty: 45, forecastDate: '2026-06-09' },
  { id: 'SH-B01', name: 'B区01棚', flowerType: '洋牡丹', color: '橙色系', maturity: 68, status: 'IMMATURE', availableQty: 120, forecastDate: '2026-06-13' },
  { id: 'SH-B02', name: 'B区02棚', flowerType: '洋牡丹', color: '粉色系', maturity: 55, status: 'ABNORMAL', availableQty: 0, forecastDate: '2026-06-08', note: '成熟度不足，需延后2天' },
  { id: 'SH-C01', name: 'C区01棚', flowerType: '绣球', color: '蓝色系', maturity: 100, status: 'HARVESTED', availableQty: 0, forecastDate: '2026-06-06', actualDate: '2026-06-06' },
  { id: 'SH-C02', name: 'C区02棚', flowerType: '绣球', color: '粉色系', maturity: 92, status: 'READY', availableQty: 30, forecastDate: '2026-06-10' },
  { id: 'SH-D01', name: 'D区01棚', flowerType: '满天星', color: '白色系', maturity: 80, status: 'READY', availableQty: 200, forecastDate: '2026-06-09' },
];

function dateStr(offsetDays = 0, hour = 9, min = 0) {
  const d = new Date(2026, 5, 10 + offsetDays);
  d.setHours(hour, min, 0, 0);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function deliveryStr(offsetDays: number) {
  const d = new Date(2026, 5, 10 + offsetDays);
  return d.toISOString().slice(0, 10);
}

export const mockOrders: CustomerOrder[] = [
  // ---------- 10条 正常关闭 COMPLETED ----------
  {
    id: 'DD20260601001', customerName: '花语时光花店', phone: '138****2341',
    deliveryDate: deliveryStr(2), address: '上海市静安区南京西路1234号',
    status: 'COMPLETED', totalAmount: 8400, specNote: '牛皮纸包装+绿色丝带,每束附保鲜卡片',
    createdAt: dateStr(-9, 10, 15), updatedAt: dateStr(-4, 16, 20),
    operator: 'PACKER', logisticsNo: 'SF1234567890001',
    items: [
      { id: 'OI1', orderId: 'DD20260601001', flowerType: '玫瑰', color: '红色系', quantity: 30, stemsPerBunch: 20, shelterId: 'SH-A01', remark: '' },
      { id: 'OI2', orderId: 'DD20260601001', flowerType: '满天星', color: '白色系', quantity: 10, stemsPerBunch: 100, shelterId: 'SH-D01', remark: '' },
    ],
    harvestPlan: { id: 'HP1', orderId: 'DD20260601001', shelterId: 'SH-A01', planDate: deliveryStr(1), planQty: 40, actualQty: 40, status: 'DONE', operator: '李师傅' },
  },
  {
    id: 'DD20260602005', customerName: '浪漫满屋婚庆', phone: '139****5678',
    deliveryDate: deliveryStr(3), address: '北京市朝阳区建国路88号',
    status: 'COMPLETED', totalAmount: 18000, specNote: '白色+浅粉婚礼主题包装,防水纸外层',
    createdAt: dateStr(-8, 14, 30), updatedAt: dateStr(-3, 17, 10),
    operator: 'PACKER', logisticsNo: 'JD9876543210002',
    items: [
      { id: 'OI3', orderId: 'DD20260602005', flowerType: '玫瑰', color: '粉色系', quantity: 50, stemsPerBunch: 20, shelterId: 'SH-A02', remark: '' },
      { id: 'OI4', orderId: 'DD20260602005', flowerType: '绣球', color: '粉色系', quantity: 20, stemsPerBunch: 5, shelterId: 'SH-C02', remark: '花头饱满' },
    ],
    specChangeHistory: [
      {
        id: 'SCH002', changedAt: dateStr(-7, 10, 20), changedBy: '销售-小林',
        beforeSpecNote: '白蓝配色婚礼包装',
        afterSpecNote: '白色+浅粉婚礼主题包装,防水纸外层',
        beforeItems: [
          { flowerType: '玫瑰', color: '白色系', quantity: 40, stemsPerBunch: 20, shelterId: 'SH-A03', remark: '' },
          { flowerType: '绣球', color: '蓝色系', quantity: 25, stemsPerBunch: 5, shelterId: 'SH-C01', remark: '' },
        ],
        afterItems: [
          { flowerType: '玫瑰', color: '粉色系', quantity: 50, stemsPerBunch: 20, shelterId: 'SH-A02', remark: '' },
          { flowerType: '绣球', color: '粉色系', quantity: 20, stemsPerBunch: 5, shelterId: 'SH-C02', remark: '花头饱满' },
        ],
        beforeAmount: 17550,
        afterAmount: 18000,
        beforeHarvestPlan: { shelterId: 'SH-A03', planQty: 65 },
        afterHarvestPlan: { shelterId: 'SH-A02', planQty: 70 },
      },
    ],
    harvestPlan: { id: 'HP2', orderId: 'DD20260602005', shelterId: 'SH-A02', planDate: deliveryStr(2), planQty: 70, actualQty: 70, status: 'DONE', operator: '王师傅' },
  },
  {
    id: 'DD20260603003', customerName: '倾城花艺工作室', phone: '137****9012',
    deliveryDate: deliveryStr(4), address: '杭州市西湖区文三路200号',
    status: 'COMPLETED', totalAmount: 7000, specNote: '透明玻璃纸+香槟色缎带',
    createdAt: dateStr(-7, 9, 45), updatedAt: dateStr(-2, 15, 30),
    operator: 'PACKER', logisticsNo: 'YT1122334455001',
    items: [
      { id: 'OI5', orderId: 'DD20260603003', flowerType: '洋牡丹', color: '橙色系', quantity: 25, stemsPerBunch: 15, shelterId: 'SH-B01', remark: '' },
    ],
    harvestPlan: { id: 'HP3', orderId: 'DD20260603003', shelterId: 'SH-B01', planDate: deliveryStr(3), planQty: 25, actualQty: 25, status: 'DONE', operator: '张师傅' },
  },
  {
    id: 'DD20260603007', customerName: '城市花园咖啡', phone: '136****3456',
    deliveryDate: deliveryStr(4), address: '深圳市南山区科技园南区',
    status: 'COMPLETED', totalAmount: 3300, specNote: '简约牛皮纸,附养护说明卡',
    createdAt: dateStr(-7, 16, 20), updatedAt: dateStr(-2, 11, 45),
    operator: 'PACKER', logisticsNo: 'SF9988776655003',
    items: [
      { id: 'OI6', orderId: 'DD20260603007', flowerType: '玫瑰', color: '白色系', quantity: 15, stemsPerBunch: 20, shelterId: 'SH-A03', remark: '' },
    ],
    harvestPlan: { id: 'HP4', orderId: 'DD20260603007', shelterId: 'SH-A03', planDate: deliveryStr(3), planQty: 15, actualQty: 15, status: 'DONE', operator: '李师傅' },
  },
  {
    id: 'DD20260604002', customerName: '梦田婚礼策划', phone: '135****7890',
    deliveryDate: deliveryStr(5), address: '成都市锦江区春熙路IFS',
    status: 'COMPLETED', totalAmount: 27200, specNote: '森系主题:麻绳+绿叶点缀,原木标签',
    createdAt: dateStr(-6, 11, 10), updatedAt: dateStr(-1, 18, 0),
    operator: 'PACKER', logisticsNo: 'JD5566778899004',
    items: [
      { id: 'OI7', orderId: 'DD20260604002', flowerType: '绣球', color: '蓝色系', quantity: 40, stemsPerBunch: 5, shelterId: 'SH-C01', remark: '' },
      { id: 'OI8', orderId: 'DD20260604002', flowerType: '玫瑰', color: '白色系', quantity: 60, stemsPerBunch: 20, shelterId: 'SH-A03', remark: '' },
    ],
    harvestPlan: { id: 'HP5', orderId: 'DD20260604002', shelterId: 'SH-C01', planDate: deliveryStr(4), planQty: 100, actualQty: 100, status: 'DONE', operator: '王师傅' },
  },
  {
    id: 'DD20260604009', customerName: '时光慢递生活馆', phone: '134****2345',
    deliveryDate: deliveryStr(5), address: '武汉市江汉区解放大道128号',
    status: 'COMPLETED', totalAmount: 4400, specNote: '韩式花束包装,米白色进口棉纸',
    createdAt: dateStr(-6, 15, 40), updatedAt: dateStr(-1, 14, 20),
    operator: 'PACKER', logisticsNo: 'YT6677889900005',
    items: [
      { id: 'OI9', orderId: 'DD20260604009', flowerType: '玫瑰', color: '粉色系', quantity: 20, stemsPerBunch: 20, shelterId: 'SH-A02', remark: '' },
    ],
    harvestPlan: { id: 'HP6', orderId: 'DD20260604009', shelterId: 'SH-A02', planDate: deliveryStr(4), planQty: 20, actualQty: 20, status: 'DONE', operator: '张师傅' },
  },
  {
    id: 'DD20260605001', customerName: '森屿花社', phone: '133****6789',
    deliveryDate: deliveryStr(6), address: '南京市鼓楼区中山路100号',
    status: 'COMPLETED', totalAmount: 13900, specNote: '复古报纸+麻质蝴蝶结',
    createdAt: dateStr(-5, 9, 0), updatedAt: dateStr(0, 10, 30),
    operator: 'PACKER', logisticsNo: 'SF1212121212006',
    items: [
      { id: 'OI10', orderId: 'DD20260605001', flowerType: '洋牡丹', color: '橙色系', quantity: 40, stemsPerBunch: 15, shelterId: 'SH-B01', remark: '' },
      { id: 'OI11', orderId: 'DD20260605001', flowerType: '满天星', color: '白色系', quantity: 15, stemsPerBunch: 100, shelterId: 'SH-D01', remark: '' },
    ],
    harvestPlan: { id: 'HP7', orderId: 'DD20260605001', shelterId: 'SH-B01', planDate: deliveryStr(5), planQty: 55, actualQty: 55, status: 'DONE', operator: '李师傅' },
  },
  {
    id: 'DD20260605004', customerName: '花开半夏酒店', phone: '132****0123',
    deliveryDate: deliveryStr(6), address: '苏州市工业园区金鸡湖大道',
    status: 'COMPLETED', totalAmount: 16250, specNote: '大堂摆花专用,大型花篮包装',
    createdAt: dateStr(-5, 14, 25), updatedAt: dateStr(0, 16, 50),
    operator: 'PACKER', logisticsNo: 'JD3434343434007',
    items: [
      { id: 'OI12', orderId: 'DD20260605004', flowerType: '玫瑰', color: '红色系', quantity: 50, stemsPerBunch: 20, shelterId: 'SH-A01', remark: '' },
      { id: 'OI13', orderId: 'DD20260605004', flowerType: '绣球', color: '蓝色系', quantity: 15, stemsPerBunch: 5, shelterId: 'SH-C01', remark: '' },
    ],
    harvestPlan: { id: 'HP8', orderId: 'DD20260605004', shelterId: 'SH-A01', planDate: deliveryStr(5), planQty: 65, actualQty: 65, status: 'DONE', operator: '王师傅' },
  },
  {
    id: 'DD20260606002', customerName: '小鹿森林摄影', phone: '131****4567',
    deliveryDate: deliveryStr(7), address: '广州市天河区珠江新城',
    status: 'COMPLETED', totalAmount: 5500, specNote: '拍摄道具用,简易保鲜袋封装',
    createdAt: dateStr(-4, 10, 50), updatedAt: dateStr(1, 9, 30),
    operator: 'PACKER', logisticsNo: 'YT5656565656008',
    items: [
      { id: 'OI14', orderId: 'DD20260606002', flowerType: '玫瑰', color: '粉色系', quantity: 25, stemsPerBunch: 20, shelterId: 'SH-A02', remark: '' },
    ],
    harvestPlan: { id: 'HP9', orderId: 'DD20260606002', shelterId: 'SH-A02', planDate: deliveryStr(6), planQty: 25, actualQty: 25, status: 'DONE', operator: '张师傅' },
  },
  {
    id: 'DD20260606008', customerName: '悦己生活美学', phone: '130****8901',
    deliveryDate: deliveryStr(7), address: '重庆市渝中区解放碑步行街',
    status: 'COMPLETED', totalAmount: 12500, specNote: '法式花束:层层雾面纸+丝绒缎带',
    createdAt: dateStr(-4, 16, 15), updatedAt: dateStr(1, 15, 40),
    operator: 'PACKER', logisticsNo: 'SF7878787878009',
    items: [
      { id: 'OI15', orderId: 'DD20260606008', flowerType: '绣球', color: '粉色系', quantity: 20, stemsPerBunch: 5, shelterId: 'SH-C02', remark: '' },
      { id: 'OI16', orderId: 'DD20260606008', flowerType: '玫瑰', color: '白色系', quantity: 25, stemsPerBunch: 20, shelterId: 'SH-A03', remark: '' },
    ],
    harvestPlan: { id: 'HP10', orderId: 'DD20260606008', shelterId: 'SH-C02', planDate: deliveryStr(6), planQty: 45, actualQty: 45, status: 'DONE', operator: '李师傅' },
  },

  // ---------- 5条 已采切 包装中 PACKING ----------
  {
    id: 'DD20260607005', customerName: '星河婚礼中心', phone: '159****1111',
    deliveryDate: deliveryStr(8), address: '西安市雁塔区高新路25号',
    status: 'PACKING', totalAmount: 23700, specNote: '星空婚礼主题:深蓝色包装+银丝带',
    createdAt: dateStr(-3, 11, 30), updatedAt: dateStr(1, 17, 10),
    operator: 'PACKER',
    items: [
      { id: 'OI17', orderId: 'DD20260607005', flowerType: '玫瑰', color: '红色系', quantity: 60, stemsPerBunch: 20, shelterId: 'SH-A01', remark: '' },
      { id: 'OI18', orderId: 'DD20260607005', flowerType: '绣球', color: '蓝色系', quantity: 30, stemsPerBunch: 5, shelterId: 'SH-C01', remark: '' },
    ],
    harvestPlan: { id: 'HP11', orderId: 'DD20260607005', shelterId: 'SH-A01', planDate: deliveryStr(7), planQty: 90, actualQty: 90, status: 'DONE', operator: '王师傅' },
  },
  {
    id: 'DD20260608001', customerName: '草木之间茶空间', phone: '158****2222',
    deliveryDate: deliveryStr(9), address: '长沙市岳麓区橘子洲头',
    status: 'PACKING', totalAmount: 8700, specNote: '禅意风格:素色宣纸+竹编筐外装',
    createdAt: dateStr(-2, 9, 15), updatedAt: dateStr(2, 10, 50),
    operator: 'PACKER',
    items: [
      { id: 'OI19', orderId: 'DD20260608001', flowerType: '满天星', color: '白色系', quantity: 30, stemsPerBunch: 100, shelterId: 'SH-D01', remark: '' },
      { id: 'OI20', orderId: 'DD20260608001', flowerType: '玫瑰', color: '白色系', quantity: 15, stemsPerBunch: 20, shelterId: 'SH-A03', remark: '' },
    ],
    harvestPlan: { id: 'HP12', orderId: 'DD20260608001', shelterId: 'SH-D01', planDate: deliveryStr(8), planQty: 45, actualQty: 45, status: 'DONE', operator: '张师傅' },
  },
  {
    id: 'DD20260608005', customerName: '遇见花田生活馆', phone: '157****3333',
    deliveryDate: deliveryStr(9), address: '天津市和平区五大道',
    status: 'PACKING', totalAmount: 9800, specNote: '田园风:方格花布包裹+干花点缀',
    createdAt: dateStr(-2, 13, 40), updatedAt: dateStr(2, 14, 20),
    operator: 'PACKER',
    items: [
      { id: 'OI21', orderId: 'DD20260608005', flowerType: '洋牡丹', color: '橙色系', quantity: 35, stemsPerBunch: 15, shelterId: 'SH-B01', remark: '' },
    ],
    harvestPlan: { id: 'HP13', orderId: 'DD20260608005', shelterId: 'SH-B01', planDate: deliveryStr(8), planQty: 35, actualQty: 35, status: 'DONE', operator: '李师傅' },
  },
  {
    id: 'DD20260609002', customerName: '晨曦瑜伽会所', phone: '156****4444',
    deliveryDate: deliveryStr(10), address: '青岛市市南区五四广场',
    status: 'PACKING', totalAmount: 9650, specNote: '极简风格:白色包装+绿色尤加利叶',
    createdAt: dateStr(-1, 10, 5), updatedAt: dateStr(3, 9, 40),
    operator: 'PACKER',
    items: [
      { id: 'OI22', orderId: 'DD20260609002', flowerType: '玫瑰', color: '粉色系', quantity: 20, stemsPerBunch: 20, shelterId: 'SH-A02', remark: '' },
      { id: 'OI23', orderId: 'DD20260609002', flowerType: '绣球', color: '粉色系', quantity: 15, stemsPerBunch: 5, shelterId: 'SH-C02', remark: '' },
    ],
    harvestPlan: { id: 'HP14', orderId: 'DD20260609002', shelterId: 'SH-A02', planDate: deliveryStr(9), planQty: 35, actualQty: 35, status: 'DONE', operator: '王师傅' },
  },
  {
    id: 'DD20260609005', customerName: '蔚蓝海岸度假酒店', phone: '155****5555',
    deliveryDate: deliveryStr(10), address: '厦门市思明区环岛路',
    status: 'PACKING', totalAmount: 17550, specNote: '海滨主题:蓝白条纹包装+海星装饰卡',
    createdAt: dateStr(-1, 15, 25), updatedAt: dateStr(3, 16, 10),
    operator: 'PACKER',
    items: [
      { id: 'OI24', orderId: 'DD20260609005', flowerType: '玫瑰', color: '白色系', quantity: 40, stemsPerBunch: 20, shelterId: 'SH-A03', remark: '' },
      { id: 'OI25', orderId: 'DD20260609005', flowerType: '绣球', color: '蓝色系', quantity: 25, stemsPerBunch: 5, shelterId: 'SH-C01', remark: '' },
    ],
    harvestPlan: { id: 'HP15', orderId: 'DD20260609005', shelterId: 'SH-A03', planDate: deliveryStr(9), planQty: 65, actualQty: 65, status: 'DONE', operator: '张师傅' },
  },

  // ---------- 3条 采切中 HARVESTING ----------
  {
    id: 'DD20260609009', customerName: '半山书院民宿', phone: '188****6666',
    deliveryDate: deliveryStr(11), address: '杭州市临安区天目山景区',
    status: 'HARVESTING', totalAmount: 4500, specNote: '山野风:藤蔓缠绕+牛皮纸+松果标签',
    createdAt: dateStr(-1, 17, 50), updatedAt: dateStr(3, 18, 30),
    operator: 'GROWER',
    items: [
      { id: 'OI26', orderId: 'DD20260609009', flowerType: '满天星', color: '白色系', quantity: 25, stemsPerBunch: 100, shelterId: 'SH-D01', remark: '' },
    ],
    harvestPlan: { id: 'HP16', orderId: 'DD20260609009', shelterId: 'SH-D01', planDate: deliveryStr(10), planQty: 25, status: 'HARVESTING', operator: '李师傅' },
  },
  {
    id: 'DD20260610001', customerName: '花间一壶酒餐厅', phone: '187****7777',
    deliveryDate: deliveryStr(12), address: '南京市秦淮区夫子庙',
    status: 'HARVESTING', totalAmount: 11200, specNote: '中式风格:红色宣纸+金边+手写贺卡',
    createdAt: dateStr(0, 8, 30), updatedAt: dateStr(4, 11, 10),
    operator: 'GROWER',
    items: [
      { id: 'OI27', orderId: 'DD20260610001', flowerType: '玫瑰', color: '红色系', quantity: 35, stemsPerBunch: 20, shelterId: 'SH-A01', remark: '' },
      { id: 'OI28', orderId: 'DD20260610001', flowerType: '绣球', color: '粉色系', quantity: 10, stemsPerBunch: 5, shelterId: 'SH-C02', remark: '' },
    ],
    harvestPlan: { id: 'HP17', orderId: 'DD20260610001', shelterId: 'SH-A01', planDate: deliveryStr(11), planQty: 45, status: 'PENDING', operator: '王师傅' },
  },
  {
    id: 'DD20260610004', customerName: '云朵亲子烘焙坊', phone: '186****8888',
    deliveryDate: deliveryStr(12), address: '成都市武侯区玉林西路',
    status: 'HARVESTING', totalAmount: 4200, specNote: '可爱风:粉色棉纸+卡通贴纸',
    createdAt: dateStr(0, 12, 15), updatedAt: dateStr(4, 14, 50),
    operator: 'GROWER',
    items: [
      { id: 'OI29', orderId: 'DD20260610004', flowerType: '洋牡丹', color: '橙色系', quantity: 15, stemsPerBunch: 15, shelterId: 'SH-B01', remark: '' },
    ],
    harvestPlan: { id: 'HP18', orderId: 'DD20260610004', shelterId: 'SH-B01', planDate: deliveryStr(11), planQty: 15, status: 'PENDING', operator: '张师傅' },
  },

  // ---------- 4条 待确认 PENDING_CONFIRM ----------
  {
    id: 'DD20260610007', customerName: '春风十里花坊', phone: '151****1010',
    deliveryDate: deliveryStr(13), address: '苏州市姑苏区观前街188号',
    status: 'PENDING_CONFIRM', totalAmount: 14050, specNote: '简约牛皮纸包装,每束附养护卡',
    createdAt: dateStr(0, 14, 20), updatedAt: dateStr(0, 14, 20),
    operator: 'SALES',
    items: [
      { id: 'OI34', orderId: 'DD20260610007', flowerType: '玫瑰', color: '红色系', quantity: 40, stemsPerBunch: 20, shelterId: 'SH-A01', remark: '' },
      { id: 'OI35', orderId: 'DD20260610007', flowerType: '绣球', color: '蓝色系', quantity: 15, stemsPerBunch: 5, shelterId: 'SH-C01', remark: '' },
    ],
    harvestPlan: { id: 'HP22', orderId: 'DD20260610007', shelterId: 'SH-A01', planDate: deliveryStr(12), planQty: 55, status: 'PENDING', operator: '李师傅' },
  },
  {
    id: 'DD20260610009', customerName: '四季花景园艺', phone: '152****2020',
    deliveryDate: deliveryStr(14), address: '无锡市滨湖区鼋头渚景区',
    status: 'PENDING_CONFIRM', totalAmount: 12000, specNote: '景区摆花,大型花篮+防水包装',
    createdAt: dateStr(0, 16, 45), updatedAt: dateStr(0, 16, 45),
    operator: 'SALES',
    items: [
      { id: 'OI36', orderId: 'DD20260610009', flowerType: '洋牡丹', color: '橙色系', quantity: 30, stemsPerBunch: 15, shelterId: 'SH-B01', remark: '' },
      { id: 'OI37', orderId: 'DD20260610009', flowerType: '满天星', color: '白色系', quantity: 20, stemsPerBunch: 100, shelterId: 'SH-D01', remark: '' },
    ],
    harvestPlan: { id: 'HP23', orderId: 'DD20260610009', shelterId: 'SH-B01', planDate: deliveryStr(13), planQty: 50, status: 'PENDING', operator: '王师傅' },
  },
  {
    id: 'DD20260610011', customerName: '花时间咖啡书店', phone: '153****3030',
    deliveryDate: deliveryStr(13), address: '常州市天宁区南大街步行街',
    status: 'PENDING_CONFIRM', totalAmount: 3300, specNote: '店内周花,简洁包装+玻璃纸外套',
    createdAt: dateStr(0, 18, 30), updatedAt: dateStr(0, 18, 30),
    operator: 'SALES',
    items: [
      { id: 'OI38', orderId: 'DD20260610011', flowerType: '玫瑰', color: '粉色系', quantity: 15, stemsPerBunch: 20, shelterId: 'SH-A02', remark: '' },
    ],
    harvestPlan: { id: 'HP24', orderId: 'DD20260610011', shelterId: 'SH-A02', planDate: deliveryStr(12), planQty: 15, status: 'PENDING', operator: '张师傅' },
  },
  {
    id: 'DD20260610013', customerName: '一米阳光婚礼策划', phone: '154****4040',
    deliveryDate: deliveryStr(15), address: '南通市崇川区濠河风景区',
    status: 'PENDING_CONFIRM', totalAmount: 21950, specNote: '户外草坪婚礼:白绿主题,原木标签+麻绳缠绕',
    createdAt: dateStr(0, 19, 15), updatedAt: dateStr(0, 19, 15),
    operator: 'SALES',
    items: [
      { id: 'OI39', orderId: 'DD20260610013', flowerType: '玫瑰', color: '白色系', quantity: 60, stemsPerBunch: 20, shelterId: 'SH-A03', remark: '' },
      { id: 'OI40', orderId: 'DD20260610013', flowerType: '绣球', color: '粉色系', quantity: 25, stemsPerBunch: 5, shelterId: 'SH-C02', remark: '花头要求饱满' },
    ],
    harvestPlan: { id: 'HP25', orderId: 'DD20260610013', shelterId: 'SH-A03', planDate: deliveryStr(14), planQty: 85, status: 'PENDING', operator: '李师傅' },
  },

  // ---------- 3条 卡住 STUCK ----------
  {
    id: 'DD20260608003', customerName: '幸福里花艺课堂', phone: '189****9999',
    deliveryDate: deliveryStr(9), address: '上海市徐汇区衡山路880号',
    status: 'STUCK', previousStatus: 'HARVESTING', totalAmount: 8400, specNote: '学员练习用,普通塑料袋装',
    createdAt: dateStr(-2, 10, 20), updatedAt: dateStr(2, 9, 0),
    operator: 'GROWER',
    items: [
      { id: 'OI30', orderId: 'DD20260608003', flowerType: '洋牡丹', color: '粉色系', quantity: 30, stemsPerBunch: 15, shelterId: 'SH-B02', remark: '' },
    ],
    harvestPlan: { id: 'HP19', orderId: 'DD20260608003', shelterId: 'SH-B02', planDate: deliveryStr(8), planQty: 30, status: 'ABNORMAL', operator: '李师傅', note: '成熟度不足' },
    stuckRecord: {
      id: 'STUCK001', orderId: 'DD20260608003', stuckType: 'FORECAST_DEVIATION',
      reason: '玫瑰A棚成熟度不足，需延后2天',
      stuckAt: dateStr(2, 9, 0),
    },
  },
  {
    id: 'DD20260607012', customerName: '蜜糖婚礼定制', phone: '178****1212',
    deliveryDate: deliveryStr(8), address: '北京市朝阳区三里屯SOHO',
    status: 'STUCK', previousStatus: 'PACKING', totalAmount: 28800, specNote: '婚礼主花+桌花,豪华包装',
    createdAt: dateStr(-3, 16, 5), updatedAt: dateStr(3, 8, 30),
    operator: 'PACKER',
    items: [
      { id: 'OI31', orderId: 'DD20260607012', flowerType: '玫瑰', color: '红色系', quantity: 80, stemsPerBunch: 20, shelterId: 'SH-A01', remark: '' },
      { id: 'OI32', orderId: 'DD20260607012', flowerType: '洋牡丹', color: '粉色系', quantity: 40, stemsPerBunch: 15, shelterId: 'SH-B02', remark: '' },
    ],
    harvestPlan: { id: 'HP20', orderId: 'DD20260607012', shelterId: 'SH-A01', planDate: deliveryStr(7), planQty: 120, actualQty: 120, status: 'DONE', operator: '王师傅' },
    packDamageNote: '3扎洋牡丹包装压损',
    stuckRecord: {
      id: 'STUCK002', orderId: 'DD20260607012', stuckType: 'PACKAGE_DAMAGE',
      reason: '3扎洋牡丹包装压损，需补采',
      stuckAt: dateStr(3, 8, 30),
    },
  },
  {
    id: 'DD20260609007', customerName: '夏日和风日料', phone: '177****3434',
    deliveryDate: deliveryStr(10), address: '苏州市姑苏区平江路',
    status: 'STUCK', previousStatus: 'PENDING_CONFIRM', totalAmount: 7700, specNote: '日式餐厅摆花,淡雅风格,红色系为主',
    createdAt: dateStr(-1, 9, 20), updatedAt: dateStr(3, 20, 15),
    operator: 'SALES',
    items: [
      { id: 'OI33_2', orderId: 'DD20260609007', flowerType: '玫瑰', color: '红色系', quantity: 35, stemsPerBunch: 20, shelterId: 'SH-A01', remark: '' },
    ],
    specChangeHistory: [
      {
        id: 'SCH001', changedAt: dateStr(3, 20, 15), changedBy: '销售-小林',
        beforeSpecNote: '日式餐厅摆花,淡雅风格',
        afterSpecNote: '日式餐厅摆花,淡雅风格,红色系为主',
        beforeItems: [
          { flowerType: '玫瑰', color: '白色系', quantity: 20, stemsPerBunch: 20, shelterId: 'SH-A03', remark: '' },
        ],
        afterItems: [
          { flowerType: '玫瑰', color: '红色系', quantity: 35, stemsPerBunch: 20, shelterId: 'SH-A01', remark: '' },
        ],
        beforeAmount: 4400,
        afterAmount: 7700,
        beforeHarvestPlan: { shelterId: 'SH-A03', planQty: 20 },
        afterHarvestPlan: { shelterId: 'SH-A01', planQty: 35 },
      },
    ],
    harvestPlan: { id: 'HP21', orderId: 'DD20260609007', shelterId: 'SH-A01', planDate: deliveryStr(9), planQty: 35, status: 'PENDING', operator: '张师傅' },
    stuckRecord: {
      id: 'STUCK003', orderId: 'DD20260609007', stuckType: 'CUSTOMER_CHANGE',
      reason: '客户临时改规格:白玫瑰20扎→红玫瑰35扎,待销售确认后重建采切排期',
      stuckAt: dateStr(3, 20, 15),
    },
  },
];

export const mockLogs: OperationLog[] = mockOrders.flatMap((order): OperationLog[] => {
  const base: OperationLog[] = [
    { id: `${order.id}-L1`, orderId: order.id, role: 'SALES', operatorName: '销售-小林', action: '创建订单', detail: `创建订单,客户:${order.customerName}`, timestamp: order.createdAt },
  ];
  if (order.status !== 'PENDING_CONFIRM' && order.status !== 'STUCK') {
    base.push({ id: `${order.id}-L2`, orderId: order.id, role: 'SALES', operatorName: '销售-小林', action: '确认订单', detail: '客户确认,订单进入待采切排期', timestamp: order.createdAt.slice(0, 10) + ' 15:00:00' });
    base.push({ id: `${order.id}-L3`, orderId: order.id, role: 'SYSTEM', operatorName: '系统', action: '生成采切排期', detail: `自动分配至${order.items[0].shelterId},计划日期${order.harvestPlan?.planDate}`, timestamp: order.createdAt.slice(0, 10) + ' 15:00:05' });
  }
  if (order.harvestPlan?.status === 'DONE' || order.status === 'PACKING' || order.status === 'COMPLETED') {
    base.push({ id: `${order.id}-L4`, orderId: order.id, role: 'GROWER', operatorName: order.harvestPlan?.operator || '种植员', action: '完成采切', detail: `实际采切${order.harvestPlan?.actualQty ?? order.harvestPlan?.planQty}扎,已推送至包装队列`, timestamp: (order.harvestPlan?.planDate || '2026-06-08') + ' 08:30:00' });
  }
  if (order.status === 'PACKING' || order.status === 'COMPLETED') {
    base.push({ id: `${order.id}-L5`, orderId: order.id, role: 'PACKER', operatorName: '包装-老赵', action: '开始包装', detail: '已核对规格,开始包装作业', timestamp: (order.harvestPlan?.planDate || '2026-06-08') + ' 10:15:00' });
  }
  if (order.status === 'COMPLETED') {
    base.push({ id: `${order.id}-L6`, orderId: order.id, role: 'PACKER', operatorName: '包装-老赵', action: '确认发货', detail: `物流单号:${order.logisticsNo}`, timestamp: order.updatedAt });
  }
  if (order.status === 'STUCK' && order.stuckRecord) {
    const typeText = order.stuckRecord.stuckType === 'FORECAST_DEVIATION' ? '花期预测偏差' :
      order.stuckRecord.stuckType === 'PACKAGE_DAMAGE' ? '包装破损' :
        order.stuckRecord.stuckType === 'CUSTOMER_CHANGE' ? '客户改规格' : '其他异常';
    base.push({
      id: `${order.id}-LSTUCK`, orderId: order.id,
      role: order.stuckRecord.stuckType === 'PACKAGE_DAMAGE' ? 'PACKER' :
        order.stuckRecord.stuckType === 'FORECAST_DEVIATION' ? 'GROWER' : 'SALES',
      operatorName: order.stuckRecord.stuckType === 'PACKAGE_DAMAGE' ? '包装-老赵' :
        order.stuckRecord.stuckType === 'FORECAST_DEVIATION' ? '种植-李师傅' : '销售-小林',
      action: `卡住:${typeText}`,
      detail: order.stuckRecord.reason,
      timestamp: order.stuckRecord.stuckAt,
      isStuck: true,
    });
  }
  return base;
});

// 为有改规格历史的订单手动追加改规格操作日志
const specChangeLogs: OperationLog[] = [];
mockOrders.forEach((order) => {
  if (order.specChangeHistory) {
    order.specChangeHistory.forEach((sch) => {
      const itemDesc = sch.afterItems.map((i) => `${i.flowerType}${i.color}×${i.quantity}扎`).join('、');
      const amountDesc = sch.beforeAmount !== sch.afterAmount
        ? `,金额 ¥${sch.beforeAmount.toLocaleString()} → ¥${sch.afterAmount.toLocaleString()}`
        : '';
      const specDesc = sch.beforeSpecNote !== sch.afterSpecNote
        ? `,包装:${sch.beforeSpecNote.length > 15 ? sch.beforeSpecNote.slice(0, 15) + '...' : sch.beforeSpecNote} → ${sch.afterSpecNote.length > 15 ? sch.afterSpecNote.slice(0, 15) + '...' : sch.afterSpecNote}`
        : '';
      specChangeLogs.push({
        id: `${order.id}-LSCH${sch.id}`,
        orderId: order.id,
        role: 'SALES',
        operatorName: sch.changedBy,
        action: '修改规格',
        detail: `明细:${itemDesc}${amountDesc}${specDesc}`,
        timestamp: sch.changedAt,
      });
    });
  }
});
mockLogs.push(...specChangeLogs);
