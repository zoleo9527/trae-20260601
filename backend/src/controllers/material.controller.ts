import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../utils/dataStore.js';
import { MaterialStatusMachine, actionToMaterialStatus } from '../utils/statusMachine.js';
import type { MaterialStatus } from '../utils/statusMachine.js';
import { workflowService } from '../services/workflow.service.js';

const mockMaterials = [
  {
    id: 'mat_001',
    scheduleId: 'sch_001',
    scheduleSnapshot: {
      lecturerName: '张明',
      scheduledAt: '2026-06-20 14:00',
      location: '一楼多功能厅',
      expectedParticipants: 30,
    },
    status: 'IN_PROGRESS',
    statusHistory: [],
    materials: [
      {
        id: 'mi_001',
        name: '青铜器复制品套装',
        category: 'DEMO',
        quantity: 5,
        unit: '套',
        status: 'PREPARED',
      },
      {
        id: 'mi_002',
        name: '高清投影设备',
        category: 'DEMO',
        quantity: 1,
        unit: '套',
        status: 'PREPARED',
      },
      {
        id: 'mi_003',
        name: '讲解麦克风',
        category: 'DEMO',
        quantity: 2,
        unit: '个',
        status: 'PENDING',
      },
    ],
    preparedBy: 'user_006',
    preparedByName: '赵军',
    startedAt: '2026-06-15 12:00',
    isAcknowledged: false,
    attachments: [],
    createdAt: '2026-06-15 11:00',
    updatedAt: '2026-06-17 16:00',
  },
  {
    id: 'mat_002',
    scheduleId: 'sch_004',
    scheduleSnapshot: {
      lecturerName: '张明',
      scheduledAt: '2026-06-21 10:00',
      location: '一楼展厅',
      expectedParticipants: 25,
    },
    status: 'BLOCKED',
    statusHistory: [],
    materials: [
      {
        id: 'mi_004',
        name: '古钱币展示盒',
        category: 'DISPLAY',
        quantity: 10,
        unit: '个',
        status: 'PREPARED',
      },
      {
        id: 'mi_005',
        name: '放大镜',
        category: 'OPERATION',
        quantity: 25,
        unit: '个',
        status: 'PREPARED',
      },
    ],
    preparedBy: 'user_007',
    preparedByName: '孙丽',
    startedAt: '2026-06-16 09:00',
    isAcknowledged: false,
    attachments: [],
    createdAt: '2026-06-14 10:00',
    updatedAt: '2026-06-17 16:00',
  },
];

export async function getMaterialList(req: Request, res: Response) {
  try {
    const { status, scheduleId, page = 1, pageSize = 20 } = req.query;

    let materials = await dataStore.findAll('materials.json');
    if (materials.length === 0) {
      materials = mockMaterials;
      await dataStore.write('materials.json', materials);
    }

    if (status) {
      materials = materials.filter((m: any) => m.status === status);
    }

    if (scheduleId) {
      materials = materials.filter((m: any) => m.scheduleId === scheduleId);
    }

    const start = (Number(page) - 1) * Number(pageSize);
    const end = start + Number(pageSize);
    const paginatedMaterials = materials.slice(start, end);

    res.json({
      success: true,
      data: {
        items: paginatedMaterials,
        total: materials.length,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    });
  } catch (error) {
    console.error('获取物料清单失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '获取物料清单失败' },
    });
  }
}

export async function getMaterialById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    let materials = await dataStore.findAll('materials.json');
    if (materials.length === 0) {
      materials = mockMaterials;
    }

    const material = materials.find((m: any) => m.id === id);

    if (!material) {
      return res.status(404).json({
        success: false,
        error: { code: 'MATERIAL_NOT_FOUND', message: '物料清单不存在' },
      });
    }

    res.json({ success: true, data: material });
  } catch (error) {
    console.error('获取物料清单详情失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '获取物料清单详情失败' },
    });
  }
}

export async function getMaterialByScheduleId(req: Request, res: Response) {
  try {
    const { scheduleId } = req.params;

    let materials = await dataStore.findAll('materials.json');
    if (materials.length === 0) {
      materials = mockMaterials;
    }

    const material = materials.find((m: any) => m.scheduleId === scheduleId);

    if (!material) {
      return res.status(404).json({
        success: false,
        error: { code: 'MATERIAL_NOT_FOUND', message: '物料清单不存在' },
      });
    }

    res.json({ success: true, data: material });
  } catch (error) {
    console.error('获取物料清单失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '获取物料清单失败' },
    });
  }
}

export async function createMaterial(req: Request, res: Response) {
  try {
    const { scheduleId, materials: items } = req.body;

    let schedules = await dataStore.findAll('schedules.json');
    if (schedules.length === 0) {
      schedules = [
        {
          id: 'sch_001',
          courseName: '青铜器鉴赏入门',
          lecturerName: '张明',
          scheduledAt: '2026-06-20 14:00',
          location: '一楼多功能厅',
          expectedParticipants: 30,
        },
      ];
    }

    const schedule = schedules.find((s: any) => s.id === scheduleId);

    const materialData = {
      id: `mat_${uuidv4()}`,
      scheduleId,
      scheduleSnapshot: {
        lecturerName: schedule?.lecturerName || '未知',
        scheduledAt: schedule?.scheduledAt || '',
        location: schedule?.location || '',
        expectedParticipants: schedule?.expectedParticipants || 0,
      },
      status: 'NOT_STARTED',
      statusHistory: [],
      materials: items || [],
      preparedBy: '',
      preparedByName: '',
      isAcknowledged: false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let materials = await dataStore.findAll('materials.json');
    if (materials.length === 0) {
      materials = mockMaterials;
    }

    materials.push(materialData);
    await dataStore.write('materials.json', materials);

    res.json({
      success: true,
      data: materialData,
      message: '物料清单创建成功',
    });
  } catch (error) {
    console.error('创建物料清单失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '创建物料清单失败' },
    });
  }
}

export async function transitionMaterial(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { action, reason, remarks, materialId } = req.body;

    const targetStatus = actionToMaterialStatus[action as keyof typeof actionToMaterialStatus];
    if (!targetStatus) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ACTION', message: '无效的操作' },
      });
    }

    let materials = await dataStore.findAll('materials.json');
    if (materials.length === 0) {
      materials = mockMaterials;
    }

    const index = materials.findIndex((m: any) => m.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'MATERIAL_NOT_FOUND', message: '物料清单不存在' },
      });
    }

    const material = materials[index];
    const currentStatus = material.status as MaterialStatus;
    const statusConfig = MaterialStatusMachine[currentStatus];

    if (!statusConfig.allowedTransitions.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `不能从 ${statusConfig.label} 转换到 ${MaterialStatusMachine[targetStatus].label}`,
        },
      });
    }

    const statusTransition = {
      id: `mst_${uuidv4()}`,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      operator: req.body.userId || 'user_001',
      operatorName: req.body.userName || '未知',
      reason,
      remarks,
      createdAt: new Date().toISOString(),
    };

    const oldStatus = material.status;
    material.status = targetStatus;
    material.statusHistory = [...(material.statusHistory || []), statusTransition];
    material.updatedAt = new Date().toISOString();

    if (targetStatus === 'IN_PROGRESS') {
      material.startedAt = new Date().toISOString();
    }

    if (targetStatus === 'READY') {
      material.preparedAt = new Date().toISOString();
    }

    if (targetStatus === 'RETURNED') {
      material.materials.forEach((m: any) => {
        if (m.status !== 'DAMAGED' && m.status !== 'MISSING') {
          m.status = 'PREPARED';
        }
      });
    }

    materials[index] = material;
    await dataStore.write('materials.json', materials);

    await workflowService.onMaterialTransitioned(material, oldStatus, targetStatus);

    res.json({
      success: true,
      data: material,
      message: '状态流转成功',
    });
  } catch (error) {
    console.error('状态流转失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '状态流转失败' },
    });
  }
}

export async function acknowledgeMaterial(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { acknowledged, remarks } = req.body;

    let materials = await dataStore.findAll('materials.json');
    if (materials.length === 0) {
      materials = mockMaterials;
    }

    const index = materials.findIndex((m: any) => m.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'MATERIAL_NOT_FOUND', message: '物料清单不存在' },
      });
    }

    materials[index].isAcknowledged = acknowledged;
    materials[index].acknowledgedAt = new Date().toISOString();
    materials[index].acknowledgedBy = req.body.userId || 'user_001';
    materials[index].updatedAt = new Date().toISOString();

    await dataStore.write('materials.json', materials);

    res.json({
      success: true,
      data: materials[index],
      message: acknowledged ? '物料已确认' : '物料需要调整',
    });
  } catch (error) {
    console.error('确认物料失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '确认物料失败' },
    });
  }
}

export async function claimMaterial(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { preparedBy, preparedByName } = req.body;

    let materials = await dataStore.findAll('materials.json');
    if (materials.length === 0) {
      materials = mockMaterials;
    }

    const index = materials.findIndex((m: any) => m.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: { code: 'MATERIAL_NOT_FOUND', message: '物料清单不存在' },
      });
    }

    const oldStatus = materials[index].status;
    
    materials[index].preparedBy = preparedBy;
    materials[index].preparedByName = preparedByName;
    materials[index].status = 'IN_PROGRESS';
    materials[index].startedAt = new Date().toISOString();
    materials[index].updatedAt = new Date().toISOString();

    const statusTransition = {
      id: `mst_${uuidv4()}`,
      fromStatus: oldStatus,
      toStatus: 'IN_PROGRESS',
      operator: preparedBy,
      operatorName: preparedByName,
      reason: '认领任务',
      createdAt: new Date().toISOString(),
    };
    materials[index].statusHistory = [...(materials[index].statusHistory || []), statusTransition];

    await dataStore.write('materials.json', materials);

    await workflowService.onMaterialClaimed(materials[index], preparedBy, preparedByName);

    res.json({
      success: true,
      data: materials[index],
      message: '已认领物料准备任务',
    });
  } catch (error) {
    console.error('认领物料失败:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '认领物料失败' },
    });
  }
}