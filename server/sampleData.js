const now = new Date();
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();
const daysAgo = (d) => new Date(now.getTime() - d * 86400000).toISOString();
const hoursLater = (h) => new Date(now.getTime() + h * 3600000).toISOString();
const daysLater = (d) => new Date(now.getTime() + d * 86400000).toISOString();

export const users = {
  receptionist: { id: 'R001', name: '张接单', role: 'receptionist', avatar: '👩' },
  designer: { id: 'D001', name: '李设计', role: 'designer', avatar: '👨‍🎨' },
  installer: { id: 'I001', name: '王队长', role: 'installer', avatar: '👷' },
  production: { id: 'P001', name: '赵喷绘', role: 'production', avatar: '👨‍🔧' },
  quality: { id: 'Q001', name: '质检刘', role: 'quality', avatar: '🔍' }
};

export const sampleOrders = [
  {
    id: 'AD260615-1001',
    orderNo: 'AD260615-1001',
    customerName: '美味连锁餐饮',
    customerPhone: '13800138001',
    businessType: '门店招牌',
    title: '美味餐饮新店开业招牌',
    description: '客户提供的logo文件，要求做发光字招牌，安装在门店门头。客户强调要与总店颜色完全一致。',
    width: 500,
    height: 120,
    unit: 'cm',
    quantity: 1,
    material: '不锈钢包边发光字',
    colorMode: 'CMYK',
    status: 'revision_needed',
    urgent: true,
    expectedDelivery: hoursLater(2),
    installAddress: '朝阳区建国路88号SOHO现代城底商',
    installTime: daysLater(1),
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(1.5),
    currentHandler: 'designer',
    history: [
      { status: 'created', operator: '张接单', remark: '客户到店下单，急单，明天必须安装完成', timestamp: hoursAgo(5) },
      { status: 'pending_review', operator: '张接单', remark: '已录入系统，转设计师处理', timestamp: hoursAgo(4.8) },
      { status: 'designing', operator: '李设计', remark: '开始设计，根据客户提供的logo制作效果图', timestamp: hoursAgo(4.5) },
      { status: 'pending_approval', operator: '李设计', remark: '第一稿完成，发送客户确认', timestamp: hoursAgo(3) },
      { status: 'customer_confirm', operator: '王总(客户)', remark: '客户要求改稿：logo颜色偏蓝，门头实际宽度4.8米不是5米', timestamp: hoursAgo(2.5) },
      { status: 'revision_needed', operator: '系统', remark: '客户拒绝确认，等待设计师改稿。客户一直在打电话催！', timestamp: hoursAgo(1.5) }
    ],
    revisions: [],
    installation: null,
    customerConfirmation: {
      customerName: '王总',
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANS',
      confirmType: 'revise',
      feedback: 'logo颜色不对，总店是PANTONE 286C，你们做的偏蓝了。还有尺寸再确认一下，门头实际是4.8米，不是5米。',
      confirmedAt: hoursAgo(2.5)
    },
    issues: [
      {
        id: 'I001',
        type: 'customer_revision',
        description: '客户确认页要求改稿：颜色偏差（PANTONE 286C）、尺寸疑问（500→480cm）',
        status: 'pending',
        reportedAt: hoursAgo(2.5)
      },
      {
        id: 'I002',
        type: 'dimension',
        description: '尺寸疑问：客户提到门头实际4.8米，系统录入5米，需要复核',
        status: 'pending',
        reportedAt: hoursAgo(2.5)
      }
    ]
  },
  {
    id: 'AD260615-1002',
    orderNo: 'AD260615-1002',
    customerName: '健身工作室',
    customerPhone: '13900139002',
    businessType: '背景墙',
    title: '力量健身工作室前台背景墙',
    description: '前台形象墙，需要做亚克力水晶字，内容为"力量健身"四个字加logo。',
    width: 300,
    height: 80,
    unit: 'cm',
    quantity: 1,
    material: '3cm厚亚克力水晶字',
    colorMode: 'CMYK',
    status: 'pending_approval',
    urgent: false,
    expectedDelivery: daysLater(2),
    installAddress: '海淀区中关村大街1号科技园B座2层',
    installTime: daysLater(3),
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(30/60),
    currentHandler: 'customer',
    history: [
      { status: 'created', operator: '张接单', remark: '电话接单，客户发了参考图', timestamp: hoursAgo(8) },
      { status: 'designing', operator: '李设计', remark: '字体设计中，客户要粗体、有力量感', timestamp: hoursAgo(7) },
      { status: 'revision', operator: '李设计', remark: '字体从"黑体"改为"超粗黑"，字间距调整', timestamp: hoursAgo(5) },
      { status: 'pending_approval', operator: '李设计', remark: '第三稿完成，等待客户确认。客户对字体效果很满意', timestamp: hoursAgo(0.5) }
    ],
    revisions: [
      {
        id: 'R002',
        type: 'typography',
        description: '字体不够粗，改为超粗黑体，增大字间距',
        operator: '李设计',
        fileUrl: null,
        beforeData: { fontFamily: '黑体', fontWeight: 'bold', letterSpacing: '10px' },
        afterData: { fontFamily: '超粗黑体', fontWeight: '900', letterSpacing: '20px' },
        timestamp: hoursAgo(5)
      },
      {
        id: 'R003',
        type: 'layout',
        description: 'logo位置从左侧移到上方，整体居中',
        operator: '李设计',
        fileUrl: null,
        beforeData: { logoPosition: 'left', alignment: 'left' },
        afterData: { logoPosition: 'top', alignment: 'center' },
        timestamp: hoursAgo(2)
      }
    ],
    installation: null,
    customerConfirmation: null,
    issues: []
  },
  {
    id: 'AD260615-1003',
    orderNo: 'AD260615-1003',
    customerName: '阳光地产',
    customerPhone: '13700137003',
    businessType: '户外广告',
    title: '阳光花园楼盘围挡广告',
    description: '工地围挡喷绘，共8块，每块3x6米。需要安装在工地外围，工期紧。',
    width: 600,
    height: 300,
    unit: 'cm',
    quantity: 8,
    material: '550加厚灯箱布喷绘',
    colorMode: 'CMYK',
    status: 'ready_for_install',
    urgent: true,
    expectedDelivery: hoursLater(1),
    installAddress: '通州区新华大街阳光花园项目工地',
    installTime: hoursLater(6),
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(2),
    currentHandler: 'installer',
    history: [
      { status: 'created', operator: '张接单', remark: '大客户订单，8块围挡，要求明天全部安装完成', timestamp: daysAgo(2) },
      { status: 'designing', operator: '李设计', remark: '设计中，注意拼接处图案对齐', timestamp: daysAgo(2) },
      { status: 'pending_approval', operator: '李设计', remark: '效果图完成，发送客户', timestamp: daysAgo(1.5) },
      { status: 'approved', operator: '刘经理(客户)', remark: '客户确认通过，可以喷绘', timestamp: daysAgo(1) },
      { status: 'printing', operator: '赵喷绘', remark: '开始喷绘，注意色彩饱和度，地产品牌色要正', timestamp: daysAgo(1) },
      { status: 'quality_check', operator: '质检刘', remark: '第3块发现轻微色差，已重喷。其余合格', timestamp: hoursAgo(5) },
      { status: 'ready_for_install', operator: '质检刘', remark: '全部合格，已通知安装队长王队长安排', timestamp: hoursAgo(2) }
    ],
    revisions: [],
    installation: null,
    customerConfirmation: {
      customerName: '刘经理',
      signature: 'data:image/png;base64,xxx',
      confirmType: 'approve',
      feedback: '设计效果很好，就按这个来。注意喷绘颜色要和效果图一致。',
      confirmedAt: daysAgo(1)
    },
    issues: [
      {
        id: 'I003',
        type: 'color',
        description: '质检发现第3块喷绘有轻微色差，已安排重喷',
        status: 'resolved',
        reportedAt: hoursAgo(5),
        resolvedAt: hoursAgo(3)
      }
    ]
  },
  {
    id: 'AD260615-1004',
    orderNo: 'AD260615-1004',
    customerName: '快乐超市',
    customerPhone: '13600136004',
    businessType: '促销海报',
    title: '618促销活动海报',
    description: '超市618大促海报，共3款，每款打印50张。需要覆膜防水。',
    width: 60,
    height: 90,
    unit: 'cm',
    quantity: 150,
    material: 'PP背胶+冷裱膜',
    colorMode: 'CMYK',
    status: 'installing',
    urgent: false,
    expectedDelivery: today(),
    installAddress: '丰台区方庄路10号快乐超市各门店',
    installTime: hoursAgo(1),
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(1),
    currentHandler: 'installer',
    history: [
      { status: 'created', operator: '张接单', remark: '老客户，每年618都做，直接按去年模板改日期和价格', timestamp: daysAgo(3) },
      { status: 'designing', operator: '李设计', remark: '修改价格和活动信息', timestamp: daysAgo(3) },
      { status: 'approved', operator: '李店长(客户)', remark: '客户确认，没问题', timestamp: daysAgo(2.5) },
      { status: 'printing', operator: '赵喷绘', remark: '打印中，注意价格数字要清晰', timestamp: daysAgo(2) },
      { status: 'ready_for_install', operator: '质检刘', remark: '质检通过，等待安装', timestamp: daysAgo(1) },
      { status: 'installing', operator: '王队长', remark: '王队长出发，现场安装。客户说3号店的海报位置变了', timestamp: hoursAgo(1) }
    ],
    revisions: [
      {
        id: 'R004',
        type: 'content',
        description: '客户要求增加"满200减50"的活动信息',
        operator: '李设计',
        fileUrl: null,
        beforeData: { promotion: '全场8折' },
        afterData: { promotion: '全场8折 + 满200减50' },
        timestamp: daysAgo(2.8)
      }
    ],
    installation: null,
    customerConfirmation: {
      customerName: '李店长',
      signature: 'data:image/png;base64,xxx',
      confirmType: 'approve',
      feedback: '没问题，记得覆膜，超市里容易沾油。',
      confirmedAt: daysAgo(2.5)
    },
    issues: [
      {
        id: 'I004',
        type: 'installation',
        description: '3号店海报位置变更，原定入口处改到收银台后方',
        status: 'pending',
        reportedAt: hoursAgo(0.5)
      }
    ]
  },
  {
    id: 'AD260615-1005',
    orderNo: 'AD260615-1005',
    customerName: '星美KTV',
    customerPhone: '13500135005',
    businessType: '室内装修',
    title: 'KTV包厢墙面装饰画',
    description: '10个包厢的墙面装饰画，每幅不同主题。要求高清打印，框装。',
    width: 80,
    height: 120,
    unit: 'cm',
    quantity: 10,
    material: '相纸打印+铝合金框',
    colorMode: 'CMYK',
    status: 'completed',
    urgent: false,
    expectedDelivery: daysAgo(1),
    installAddress: '东城区王府井大街100号星美KTV',
    installTime: daysAgo(1),
    createdAt: daysAgo(7),
    updatedAt: hoursAgo(20),
    currentHandler: null,
    history: [
      { status: 'created', operator: '张接单', remark: '装修公司介绍的客户，10幅装饰画', timestamp: daysAgo(7) },
      { status: 'designing', operator: '李设计', remark: '根据10个不同主题设计画面', timestamp: daysAgo(6) },
      { status: 'revision', operator: '李设计', remark: '第5幅太空主题，客户要求增加更多星云效果', timestamp: daysAgo(5) },
      { status: 'revision', operator: '李设计', remark: '第8幅复古主题，颜色太暗，调亮增加对比度', timestamp: daysAgo(4) },
      { status: 'approved', operator: '陈总(客户)', remark: '客户全部确认通过', timestamp: daysAgo(3) },
      { status: 'printing', operator: '赵喷绘', remark: '高清相纸打印中', timestamp: daysAgo(2.5) },
      { status: 'ready_for_install', operator: '质检刘', remark: '装框完成，等待安装', timestamp: daysAgo(2) },
      { status: 'installing', operator: '王队长', remark: '现场安装', timestamp: daysAgo(1.5) },
      { status: 'completed', operator: '王队长', remark: '安装完成，客户非常满意，说要介绍朋友', timestamp: hoursAgo(20) }
    ],
    revisions: [
      {
        id: 'R005',
        type: 'content',
        description: '第5幅太空主题增加星云效果',
        operator: '李设计',
        fileUrl: null,
        beforeData: { theme: 'space', effects: 'stars only' },
        afterData: { theme: 'space', effects: 'stars + nebula + galaxy' },
        timestamp: daysAgo(5)
      },
      {
        id: 'R006',
        type: 'color',
        description: '第8幅复古主题调亮，增加对比度',
        operator: '李设计',
        fileUrl: null,
        beforeData: { brightness: 80, contrast: 90 },
        afterData: { brightness: 110, contrast: 120 },
        timestamp: daysAgo(4)
      }
    ],
    installation: {
      installTime: daysAgo(1.5),
      operator: '王队长',
      remark: '安装顺利，客户对效果非常满意。所有画面位置都按客户要求调整过。',
      photos: [],
      issueReported: false,
      completedAt: hoursAgo(20)
    },
    customerConfirmation: {
      customerName: '陈总',
      signature: 'data:image/png;base64,xxx',
      confirmType: 'approve',
      feedback: '设计很有品味，每幅都很喜欢。安装师傅也很专业。',
      confirmedAt: daysAgo(3)
    },
    issues: []
  },
  {
    id: 'AD260615-1006',
    orderNo: 'AD260615-1006',
    customerName: '科技创业公司',
    customerPhone: '13400134006',
    businessType: '文化墙',
    title: '公司发展历程文化墙',
    description: '办公室墙面展示公司发展历程，需要设计时间轴风格，包含里程碑事件和照片。',
    width: 800,
    height: 200,
    unit: 'cm',
    quantity: 1,
    material: '亚克力UV打印',
    colorMode: 'CMYK',
    status: 'designing',
    urgent: false,
    expectedDelivery: daysLater(5),
    installAddress: '西城区金融街20号科技大厦15层',
    installTime: daysLater(7),
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(1),
    currentHandler: 'designer',
    history: [
      { status: 'created', operator: '张接单', remark: '新客户，需要设计文化墙。提供了一些老照片', timestamp: hoursAgo(3) },
      { status: 'designing', operator: '李设计', remark: '正在整理照片，设计时间轴布局。照片质量参差不齐，需要修复', timestamp: hoursAgo(1) }
    ],
    revisions: [],
    installation: null,
    customerConfirmation: null,
    issues: [
      {
        id: 'I005',
        type: 'design',
        description: '客户提供的老照片分辨率低，部分需要重新绘制或找替代图',
        status: 'pending',
        reportedAt: hoursAgo(1)
      }
    ]
  },
  {
    id: 'AD260615-1007',
    orderNo: 'AD260615-1007',
    customerName: '咖啡连锁店',
    customerPhone: '13300133007',
    businessType: '菜单灯箱',
    title: '新品上市菜单灯箱',
    description: '5个门店的菜单灯箱更新，需要设计新的饮品菜单。注意食物照片要诱人。',
    width: 120,
    height: 80,
    unit: 'cm',
    quantity: 5,
    material: '灯箱片打印',
    colorMode: 'CMYK',
    status: 'pending_review',
    urgent: true,
    expectedDelivery: hoursLater(12),
    installAddress: '全市5家门店',
    installTime: hoursLater(24),
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(2),
    currentHandler: 'receptionist',
    history: [
      { status: 'created', operator: '张接单', remark: '老客户急单！新品明天上市，今天必须做好', timestamp: hoursAgo(2) }
    ],
    revisions: [],
    installation: null,
    customerConfirmation: null,
    issues: []
  },
  {
    id: 'AD260615-1008',
    orderNo: 'AD260615-1008',
    customerName: '教育培训中心',
    customerPhone: '13200132008',
    businessType: '宣传物料',
    title: '暑期招生宣传物料全套',
    description: '暑期班招生，需要海报、宣传单、易拉宝、条幅全套设计印刷。',
    width: null,
    height: null,
    unit: 'cm',
    quantity: 1,
    material: '多种材质',
    colorMode: 'CMYK',
    status: 'approved',
    urgent: false,
    expectedDelivery: daysLater(3),
    installAddress: '昌平区回龙观大街50号教育培训中心',
    installTime: null,
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(6),
    currentHandler: 'production',
    history: [
      { status: 'created', operator: '张接单', remark: '全套招生物料，量比较大', timestamp: daysAgo(4) },
      { status: 'designing', operator: '李设计', remark: '设计中，突出优惠力度和师资力量', timestamp: daysAgo(3.5) },
      { status: 'revision', operator: '李设计', remark: '客户要求增加"前50名报名立减500"字样', timestamp: daysAgo(2) },
      { status: 'approved', operator: '王老师(客户)', remark: '确认通过，可以印刷', timestamp: hoursAgo(6) }
    ],
    revisions: [
      {
        id: 'R007',
        type: 'content',
        description: '增加早鸟优惠信息',
        operator: '李设计',
        fileUrl: null,
        beforeData: { promotion: '原价2999，现价1999' },
        afterData: { promotion: '原价2999，现价1999，前50名再减500！' },
        timestamp: daysAgo(2)
      }
    ],
    installation: null,
    customerConfirmation: {
      customerName: '王老师',
      signature: 'data:image/png;base64,xxx',
      confirmType: 'approve',
      feedback: '设计很吸引人，优惠信息突出。印刷质量要好，这是给家长看的。',
      confirmedAt: hoursAgo(6)
    },
    issues: []
  },
  {
    id: 'AD260615-1009',
    orderNo: 'AD260615-1009',
    customerName: '汽车4S店',
    customerPhone: '13100131009',
    businessType: '展厅布置',
    title: '新车型上市展厅背景板',
    description: '新车发布会展厅背景板，需要大气、有科技感。还要做地贴和指示牌。',
    width: 1200,
    height: 400,
    unit: 'cm',
    quantity: 1,
    material: '桁架+喷绘背景板',
    colorMode: 'CMYK',
    status: 'quality_check',
    urgent: true,
    expectedDelivery: hoursLater(4),
    installAddress: '顺义区天竺镇汽车城A区1号',
    installTime: hoursLater(8),
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(2.5),
    currentHandler: 'quality',
    history: [
      { status: 'created', operator: '张接单', remark: '重要客户！新车发布会，下周三举行', timestamp: daysAgo(3) },
      { status: 'designing', operator: '李设计', remark: '科技感设计，深色背景配霓虹灯效果', timestamp: daysAgo(2.5) },
      { status: 'revision', operator: '李设计', remark: 'logo放大，车型图更突出', timestamp: daysAgo(2) },
      { status: 'approved', operator: '张经理(客户)', remark: '通过，效果很棒', timestamp: daysAgo(1) },
      { status: 'printing', operator: '赵喷绘', remark: '大面积喷绘中，注意拼接处对齐', timestamp: hoursAgo(8) },
      { status: 'quality_check', operator: '质检刘', remark: '正在质检。发现右下角有一处轻微划痕，正在评估是否重喷', timestamp: hoursAgo(2.5) }
    ],
    revisions: [
      {
        id: 'R008',
        type: 'layout',
        description: 'logo放大30%，车型图移到更显眼位置',
        operator: '李设计',
        fileUrl: null,
        beforeData: { logoSize: '200px', carImagePosition: 'bottom-right' },
        afterData: { logoSize: '260px', carImagePosition: 'center' },
        timestamp: daysAgo(2)
      }
    ],
    installation: null,
    customerConfirmation: {
      customerName: '张经理',
      signature: 'data:image/png;base64,xxx',
      confirmType: 'approve',
      feedback: '设计非常有科技感，符合我们品牌调性。喷绘一定要保证质量！',
      confirmedAt: daysAgo(1)
    },
    issues: [
      {
        id: 'I006',
        type: 'quality',
        description: '喷绘右下角有轻微划痕，位置在车标附近，需评估是否重喷',
        status: 'pending',
        reportedAt: hoursAgo(2.5)
      }
    ]
  },
  {
    id: 'AD260615-1010',
    orderNo: 'AD260615-1010',
    customerName: '婚礼策划公司',
    customerPhone: '13000130010',
    businessType: '婚礼背景',
    title: '紫色浪漫主题婚礼背景',
    description: '客户周六婚礼，需要设计制作婚礼舞台背景板和迎宾区背景。浪漫紫色主题。',
    width: 600,
    height: 350,
    unit: 'cm',
    quantity: 2,
    material: '喷绘+KT板',
    colorMode: 'CMYK',
    status: 'printing',
    urgent: true,
    expectedDelivery: hoursLater(8),
    installAddress: '朝阳区朝阳公园路8号婚礼会所',
    installTime: hoursLater(36),
    createdAt: daysAgo(5),
    updatedAt: hoursAgo(3),
    currentHandler: 'production',
    history: [
      { status: 'created', operator: '张接单', remark: '婚礼订单，周六要用，时间紧', timestamp: daysAgo(5) },
      { status: 'designing', operator: '李设计', remark: '紫色浪漫主题，配合新人婚纱照', timestamp: daysAgo(4) },
      { status: 'revision', operator: '李设计', remark: '新娘要求紫色再浅一点，不要太深', timestamp: daysAgo(3) },
      { status: 'revision', operator: '李设计', remark: '增加花艺装饰元素，字体改为花体', timestamp: daysAgo(2) },
      { status: 'approved', operator: '李小姐(客户)', remark: '新娘非常满意，说就是她想要的感觉', timestamp: daysAgo(1) },
      { status: 'printing', operator: '赵喷绘', remark: '正在喷绘，注意紫色一定要正，不能偏色', timestamp: hoursAgo(3) }
    ],
    revisions: [
      {
        id: 'R009',
        type: 'color',
        description: '紫色调浅，从深紫改为薰衣草紫',
        operator: '李设计',
        fileUrl: null,
        beforeData: { primaryColor: '#6B21A8', secondaryColor: '#7C3AED' },
        afterData: { primaryColor: '#A855F7', secondaryColor: '#C084FC' },
        timestamp: daysAgo(3)
      },
      {
        id: 'R010',
        type: 'content',
        description: '增加花艺装饰，字体改为花体',
        operator: '李设计',
        fileUrl: null,
        beforeData: { fontFamily: '宋体', decorations: 'none' },
        afterData: { fontFamily: '花体', decorations: 'floral borders' },
        timestamp: daysAgo(2)
      }
    ],
    installation: null,
    customerConfirmation: {
      customerName: '李小姐',
      signature: 'data:image/png;base64,xxx',
      confirmType: 'approve',
      feedback: '太漂亮了！就是我梦想中的婚礼风格。你们设计太棒了！',
      confirmedAt: daysAgo(1)
    },
    issues: []
  },
  {
    id: 'AD260615-1011',
    orderNo: 'AD260615-1011',
    customerName: '美食街管委会',
    customerPhone: '12900129011',
    businessType: '导视系统',
    title: '美食街导视牌设计制作',
    description: '新开业美食街需要整套导视系统，包括入口大导视牌、各楼层导视、卫生间指示等。',
    width: null,
    height: null,
    unit: 'cm',
    quantity: 15,
    material: '亚克力+不锈钢',
    colorMode: 'CMYK',
    status: 'pending_review',
    urgent: false,
    expectedDelivery: daysLater(10),
    installAddress: '东城区簋街美食街',
    installTime: daysLater(12),
    createdAt: hoursAgo(30/60),
    updatedAt: hoursAgo(30/60),
    currentHandler: 'receptionist',
    history: [
      { status: 'created', operator: '张接单', remark: '大项目，整套导视系统，需要现场测量尺寸', timestamp: hoursAgo(0.5) }
    ],
    revisions: [],
    installation: null,
    customerConfirmation: null,
    issues: [
      {
        id: 'I007',
        type: 'dimension',
        description: '需要安排设计师现场测量各安装位置的精确尺寸',
        status: 'pending',
        reportedAt: hoursAgo(0.5)
      }
    ]
  }
];

function today() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
