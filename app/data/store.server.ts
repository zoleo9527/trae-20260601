import type {
  MaintenanceContract,
  Contract,
  RenewalRecord,
  InspectionReport,
  HiddenDanger,
  FollowUpNote,
  RenewalStatus,
  Role,
} from "~/types";

const uid = () => Math.random().toString(36).slice(2, 10);

function seed(): MaintenanceContract[] {
  const now = new Date();
  const addDays = (d: number) => {
    const t = new Date(now);
    t.setDate(t.getDate() + d);
    return t.toISOString().slice(0, 10);
  };
  const pastDays = (d: number) => {
    const t = new Date(now);
    t.setDate(t.getDate() - d);
    return t.toISOString().slice(0, 10);
  };

  const contracts: MaintenanceContract[] = [];

  // ============ 样例1：即将到期（华润万象城购物中心） ============
  {
    const contractId = "FM-2024-001";
    const contract: Contract = {
      id: contractId,
      contractNo: "XF-WB-2024-001",
      projectName: "华润万象城购物中心",
      propertyCompany: "华润置地（北京）物业服务有限公司",
      propertyContact: "孙丽娟",
      propertyPhone: "138****5621",
      buildingType: "商业综合体",
      buildingArea: 128000,
      fireSystemTypes: ["自动喷淋", "火灾报警", "消火栓", "防排烟", "防火卷帘"],
      contractAmount: 286000,
      serviceFrequency: "月度巡检 + 季度测试",
      startDate: "2024-01-01",
      endDate: addDays(28),
      signedAt: "2023-12-18",
      supervisorName: "赵建国",
      engineerPhone: "139****8832",
    };

    const renewal: RenewalRecord = {
      id: "rn-" + uid(),
      contractId,
      status: "expiring_soon",
      nextContactAt: addDays(3),
      assignedTo: "赵建国",
      assignedRole: "supervisor",
      renewalOffer: 298000,
      discountApplied: 0,
    };

    const inspection: InspectionReport = {
      id: "insp-" + uid(),
      contractId,
      reportNo: "XC-2026-0542",
      inspectionDate: pastDays(12),
      inspectorName: "钱卫东",
      inspectorRole: "engineer",
      systemChecked: ["自动喷淋", "火灾报警", "消火栓", "防排烟"],
      itemsChecked: 286,
      itemsPassed: 279,
      itemsFailed: 7,
      rating: "good",
      summary:
        "整体系统运行良好。B2 层车库 3 个喷淋头锈蚀需更换，F3 西侧 2 个烟感误报率偏高，防火卷帘门手动按钮接触不良。已现场处理 2 项，其余下达整改通知。",
      customerFeedback: "巡检及时，报告详细。希望整改项能加快处理进度。",
      customerRating: "good",
    };

    const dangers: HiddenDanger[] = [
      {
        id: "hd-" + uid(),
        contractId,
        title: "B2 车库喷淋头锈蚀",
        description: "B2 层西区车库 12 个喷淋头表面严重锈蚀，存在喷淋失效风险",
        location: "B2 西区车库 3-5 号车位上方",
        riskLevel: "high",
        foundAt: pastDays(12),
        foundBy: "钱卫东",
        foundByRole: "engineer",
        deadline: addDays(5),
        status: "in_progress",
        rectificationPlan: "已申请材料，预计 3 日内完成更换",
      },
      {
        id: "hd-" + uid(),
        contractId,
        title: "F3 烟感误报率偏高",
        description: "F3 层餐饮区西侧烟感近一月误报 3 次，疑似油烟积累",
        location: "F3 西侧海底捞门口上方",
        riskLevel: "medium",
        foundAt: pastDays(12),
        foundBy: "钱卫东",
        foundByRole: "engineer",
        deadline: addDays(10),
        status: "open",
        rectificationPlan: "与餐饮区协调，进行深度清洁并加装防油烟罩",
      },
    ];

    const followUps: FollowUpNote[] = [
      {
        id: "fu-" + uid(),
        contractId,
        content: "已与孙经理通话，对方表示对一年来的服务基本满意，会在本周内讨论续约事宜。报价已通过邮件发送。",
        author: "赵建国",
        authorRole: "supervisor",
        createdAt: pastDays(2) + " 14:30",
        isInternal: false,
      },
      {
        id: "fu-" + uid(),
        contractId,
        content: "今年市场上有另一家公司报价低约 12%，客户有些犹豫。提醒下一次联系时重点说明我们的 24 小时响应和工程师持证上岗的优势。",
        author: "赵建国",
        authorRole: "supervisor",
        createdAt: pastDays(1) + " 09:15",
        isInternal: true,
      },
    ];

    contracts.push({
      contract,
      renewal,
      latestInspection: inspection,
      hiddenDangers: dangers,
      followUps,
      inspections: [inspection],
    });
  }

  // ============ 样例2：客户犹豫（阳光花园住宅小区） ============
  {
    const contractId = "FM-2024-002";
    const contract: Contract = {
      id: contractId,
      contractNo: "XF-WB-2024-002",
      projectName: "阳光花园住宅小区",
      propertyCompany: "宜居物业服务有限公司",
      propertyContact: "李志强",
      propertyPhone: "136****2210",
      buildingType: "高层住宅（12 栋）",
      buildingArea: 86000,
      fireSystemTypes: ["火灾报警", "消火栓", "应急广播"],
      contractAmount: 98000,
      serviceFrequency: "双月巡检",
      startDate: "2024-03-01",
      endDate: addDays(85),
      signedAt: "2024-02-15",
      supervisorName: "赵建国",
      engineerPhone: "135****6644",
    };

    const renewal: RenewalRecord = {
      id: "rn-" + uid(),
      contractId,
      status: "hesitating",
      nextContactAt: addDays(1),
      assignedTo: "赵建国",
      assignedRole: "supervisor",
      renewalOffer: 105000,
      discountApplied: 3,
      notes: "客户因业委会预算压缩，对涨价有抵触。",
    };

    const inspection: InspectionReport = {
      id: "insp-" + uid(),
      contractId,
      reportNo: "XC-2026-0518",
      inspectionDate: pastDays(40),
      inspectorName: "周立新",
      inspectorRole: "engineer",
      systemChecked: ["火灾报警", "消火栓", "应急广播"],
      itemsChecked: 158,
      itemsPassed: 150,
      itemsFailed: 8,
      rating: "fair",
      summary:
        "部分楼栋消火栓箱内配件缺失，6 号楼 2 单元报警线路老化导致偶发通讯故障。业主委员会对维修响应速度表示不满。",
      customerFeedback: "上次报修 3 天才来人，希望你们能提高响应速度。",
      customerRating: "fair",
    };

    const dangers: HiddenDanger[] = [
      {
        id: "hd-" + uid(),
        contractId,
        title: "6 号楼报警线路老化",
        description: "6 号楼 2 单元火灾报警线路绝缘层老化，通讯偶发中断",
        location: "6 号楼 2 单元弱电井",
        riskLevel: "high",
        foundAt: pastDays(40),
        foundBy: "周立新",
        foundByRole: "engineer",
        deadline: pastDays(5),
        status: "in_progress",
        rectificationPlan: "已申请更换线缆，计划本周六施工",
      },
    ];

    const followUps: FollowUpNote[] = [
      {
        id: "fu-" + uid(),
        contractId,
        content: "与李经理会面，业委会反馈两点：1）6 号楼线路故障多次才修好，信任度下降；2）预算比去年紧，希望原价续约。已承诺本周解决线路问题，并请示公司能否优惠。",
        author: "赵建国",
        authorRole: "supervisor",
        createdAt: pastDays(4) + " 16:20",
        isInternal: false,
      },
      {
        id: "fu-" + uid(),
        contractId,
        content: "公司最多给 3% 折扣。客户仍在对比其他两家报价。重点攻坚：周六优先完成 6 号楼换线，现场拍视频发李经理，用实际行动赢回信任。",
        author: "赵建国",
        authorRole: "supervisor",
        createdAt: pastDays(1) + " 11:00",
        isInternal: true,
      },
    ];

    contracts.push({
      contract,
      renewal,
      latestInspection: inspection,
      hiddenDangers: dangers,
      followUps,
      inspections: [inspection],
    });
  }

  // ============ 样例3：存在未闭环隐患（金融港科技园 A 座） ============
  {
    const contractId = "FM-2024-003";
    const contract: Contract = {
      id: contractId,
      contractNo: "XF-WB-2024-003",
      projectName: "金融港科技园 A 座",
      propertyCompany: "金融港园区运营管理有限公司",
      propertyContact: "王海涛",
      propertyPhone: "137****9988",
      buildingType: "甲级写字楼",
      buildingArea: 65000,
      fireSystemTypes: ["气体灭火", "自动喷淋", "火灾报警", "防火门监控"],
      contractAmount: 185000,
      serviceFrequency: "月度巡检",
      startDate: "2024-02-01",
      endDate: addDays(52),
      signedAt: "2024-01-20",
      supervisorName: "赵建国",
      engineerPhone: "138****3377",
    };

    const renewal: RenewalRecord = {
      id: "rn-" + uid(),
      contractId,
      status: "open_risks",
      nextContactAt: addDays(7),
      assignedTo: "王海涛",
      assignedRole: "property",
      renewalOffer: 192000,
      notes: "必须先解决消防主机兼容性问题，否则客户明确不续约。",
    };

    const inspection: InspectionReport = {
      id: "insp-" + uid(),
      contractId,
      reportNo: "XC-2026-0535",
      inspectionDate: pastDays(20),
      inspectorName: "钱卫东",
      inspectorRole: "engineer",
      systemChecked: ["气体灭火", "自动喷淋", "火灾报警", "防火门监控"],
      itemsChecked: 210,
      itemsPassed: 195,
      itemsFailed: 15,
      rating: "poor",
      summary:
        "消防主机与部分新增气体灭火设备存在通讯兼容性问题，B 区数据机房气体灭火系统联动测试失败。另有 5 樘防火门闭门器损坏。客户方安全负责人高度关注。",
      customerFeedback: "上次测试失败已经一个多月了，还没解决。再这样消防检查不过我们要担责任的！",
      customerRating: "poor",
    };

    const dangers: HiddenDanger[] = [
      {
        id: "hd-" + uid(),
        contractId,
        title: "气体灭火联动测试失败",
        description: "B 区数据机房新更换的气体灭火钢瓶电磁阀与老款主机通讯协议不兼容，联动测试无法触发释放",
        location: "B 区数据机房 B-03",
        riskLevel: "critical",
        foundAt: pastDays(38),
        foundBy: "钱卫东",
        foundByRole: "engineer",
        deadline: pastDays(8),
        status: "in_progress",
        rectificationPlan: "已联系原厂提供协议转换器，预计 5 天内到货并安装调试",
      },
      {
        id: "hd-" + uid(),
        contractId,
        title: "防火门闭门器损坏",
        description: "F12-F16 共 5 樘常闭防火门闭门器损坏，无法自动闭合",
        location: "F12、F14、F15、F16 疏散通道",
        riskLevel: "medium",
        foundAt: pastDays(20),
        foundBy: "钱卫东",
        foundByRole: "engineer",
        deadline: pastDays(2),
        status: "in_progress",
        rectificationPlan: "已采购配件，随气体灭火调试一并处理",
      },
    ];

    const followUps: FollowUpNote[] = [
      {
        id: "fu-" + uid(),
        contractId,
        content: "已收到协议转换器物流信息，预计后天到货。届时请安排工程师现场配合调试，安全办王主任也会到场。",
        author: "王海涛",
        authorRole: "property",
        createdAt: pastDays(3) + " 10:05",
        isInternal: false,
      },
      {
        id: "fu-" + uid(),
        contractId,
        content: "重点提醒：若本次调试仍不成功，合同到期 100% 不续约。必须派经验最丰富的工程师到场，必要时请厂家技术支持。",
        author: "赵建国",
        authorRole: "supervisor",
        createdAt: pastDays(2) + " 17:40",
        isInternal: true,
      },
    ];

    contracts.push({
      contract,
      renewal,
      latestInspection: inspection,
      hiddenDangers: dangers,
      followUps,
      inspections: [inspection],
    });
  }

  // ============ 样例4：已续约（翠湖天地商务公寓） ============
  {
    const contractId = "FM-2024-004";
    const contract: Contract = {
      id: contractId,
      contractNo: "XF-WB-2024-004",
      projectName: "翠湖天地商务公寓",
      propertyCompany: "翠湖天地物业管理有限公司",
      propertyContact: "陈美琳",
      propertyPhone: "139****1122",
      buildingType: "酒店式公寓",
      buildingArea: 42000,
      fireSystemTypes: ["自动喷淋", "火灾报警", "消火栓"],
      contractAmount: 72000,
      serviceFrequency: "双月巡检",
      startDate: "2024-01-15",
      endDate: addDays(12),
      signedAt: "2024-01-08",
      supervisorName: "赵建国",
      engineerPhone: "136****5566",
    };

    const renewal: RenewalRecord = {
      id: "rn-" + uid(),
      contractId,
      status: "renewed",
      nextContactAt: addDays(200),
      assignedTo: "赵建国",
      assignedRole: "supervisor",
      renewalOffer: 75600,
      discountApplied: 0,
      signedContractNo: "XF-WB-2025-007",
      renewedAt: pastDays(5),
      notes: "客户对服务非常满意，连续第三年续约，本次还推荐了隔壁小区。",
    };

    const inspection: InspectionReport = {
      id: "insp-" + uid(),
      contractId,
      reportNo: "XC-2026-0528",
      inspectionDate: pastDays(25),
      inspectorName: "钱卫东",
      inspectorRole: "engineer",
      systemChecked: ["自动喷淋", "火灾报警", "消火栓"],
      itemsChecked: 96,
      itemsPassed: 96,
      itemsFailed: 0,
      rating: "excellent",
      summary: "所有系统运行正常，消防泵、喷淋泵联动测试一次通过。无整改项。",
      customerFeedback: "钱师傅每次都很认真，问题都能及时解决。明年继续合作！",
      customerRating: "excellent",
    };

    const dangers: HiddenDanger[] = [];

    const followUps: FollowUpNote[] = [
      {
        id: "fu-" + uid(),
        contractId,
        content: "陈经理确认续约，已签署新合同，金额 75,600 元（涨幅 5%）。客户表示对钱卫东工程师的专业服务非常认可，已将隔壁的翠湖名苑项目介绍给我们。",
        author: "赵建国",
        authorRole: "supervisor",
        createdAt: pastDays(5) + " 15:30",
        isInternal: false,
      },
      {
        id: "fu-" + uid(),
        contractId,
        content: "典型成功续约案例：巡检质量稳定 + 工程师长期配合默契 = 客户信任。下月把钱师傅安排到翠湖名苑首次巡检，保持服务标准延续性。",
        author: "赵建国",
        authorRole: "supervisor",
        createdAt: pastDays(4) + " 10:00",
        isInternal: true,
      },
    ];

    contracts.push({
      contract,
      renewal,
      latestInspection: inspection,
      hiddenDangers: dangers,
      followUps,
      inspections: [inspection],
    });
  }

  return contracts;
}

class DataStore {
  private _data: MaintenanceContract[];

  constructor() {
    this._data = seed();
  }

  all(): MaintenanceContract[] {
    return JSON.parse(JSON.stringify(this._data));
  }

  getById(id: string): MaintenanceContract | undefined {
    const c = this._data.find((x) => x.contract.id === id);
    return c ? JSON.parse(JSON.stringify(c)) : undefined;
  }

  updateRenewal(
    contractId: string,
    patch: Partial<RenewalRecord> & { status?: RenewalStatus }
  ): MaintenanceContract | undefined {
    const idx = this._data.findIndex((x) => x.contract.id === contractId);
    if (idx === -1) return undefined;
    this._data[idx].renewal = { ...this._data[idx].renewal, ...patch };
    return JSON.parse(JSON.stringify(this._data[idx]));
  }

  addFollowUp(
    contractId: string,
    note: Omit<FollowUpNote, "id" | "contractId" | "createdAt"> & { createdAt?: string }
  ): MaintenanceContract | undefined {
    const idx = this._data.findIndex((x) => x.contract.id === contractId);
    if (idx === -1) return undefined;
    const fu: FollowUpNote = {
      id: "fu-" + uid(),
      contractId,
      content: note.content,
      author: note.author,
      authorRole: note.authorRole,
      createdAt: note.createdAt ?? new Date().toISOString().slice(0, 16).replace("T", " "),
      isInternal: note.isInternal,
    };
    this._data[idx].followUps = [...this._data[idx].followUps, fu];
    return JSON.parse(JSON.stringify(this._data[idx]));
  }

  updateDanger(
    contractId: string,
    dangerId: string,
    patch: Partial<HiddenDanger>
  ): MaintenanceContract | undefined {
    const idx = this._data.findIndex((x) => x.contract.id === contractId);
    if (idx === -1) return undefined;
    const dIdx = this._data[idx].hiddenDangers.findIndex((d) => d.id === dangerId);
    if (dIdx === -1) return undefined;
    this._data[idx].hiddenDangers[dIdx] = { ...this._data[idx].hiddenDangers[dIdx], ...patch };
    return JSON.parse(JSON.stringify(this._data[idx]));
  }
}

export const db = new DataStore();
