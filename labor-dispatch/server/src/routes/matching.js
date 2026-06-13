import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未授权' });
    }
    const decoded = jwt.verify(token, 'labor-dispatch-secret-key');
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: '未授权' });
  }
};

router.post('/', authenticate, async (req, res) => {
  try {
    const { laborDemandId, candidateId, matchType = '首次推荐', matchReason, interviewDate, entryDate } = req.body;

    const [laborDemand, candidate] = await Promise.all([
      req.prisma.laborDemand.findUnique({ where: { id: laborDemandId } }),
      req.prisma.candidate.findUnique({ where: { id: candidateId } })
    ]);

    if (!laborDemand || !candidate) {
      return res.status(400).json({ error: '用工需求或候选人不存在' });
    }

    const matching = await req.prisma.matchingRecord.create({
      data: {
        laborDemandId,
        candidateId,
        matchType,
        matchReason,
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        entryDate: entryDate ? new Date(entryDate) : null,
        createdById: req.userId
      },
      include: {
        laborDemand: {
          select: { id: true, demandNumber: true, companyName: true, position: true }
        },
        candidate: {
          select: { id: true, name: true, phone: true, skills: true }
        },
        createdBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    await Promise.all([
      req.prisma.laborDemand.update({
        where: { id: laborDemandId },
        data: { status: '匹配中' }
      }),
      req.prisma.candidate.update({
        where: { id: candidateId },
        data: { status: '匹配中' }
      })
    ]);

    await Promise.all([
      req.prisma.statusHistory.create({
        data: {
          entityType: 'MatchingRecord',
          entityId: matching.id,
          previousStatus: null,
          newStatus: '待确认',
          actionType: '创建',
          operatorId: req.userId,
          remark: `${matchType}：推荐${candidate.name}至${laborDemand.companyName}的${laborDemand.position}岗位`
        }
      }),
      req.prisma.statusHistory.create({
        data: {
          entityType: 'LaborDemand',
          entityId: laborDemandId,
          previousStatus: laborDemand.status,
          newStatus: '匹配中',
          actionType: '状态更新',
          operatorId: req.userId,
          remark: `因匹配推荐候选人${candidate.name}，状态更新为匹配中`
        }
      }),
      req.prisma.statusHistory.create({
        data: {
          entityType: 'Candidate',
          entityId: candidateId,
          previousStatus: candidate.status,
          newStatus: '匹配中',
          actionType: '状态更新',
          operatorId: req.userId,
          remark: `被推荐至${laborDemand.companyName}的${laborDemand.position}岗位`
        }
      })
    ]);

    res.json(matching);
  } catch (error) {
    console.error('创建匹配记录错误:', error);
    res.status(500).json({ error: '创建失败' });
  }
});

router.post('/batch/confirm', authenticate, async (req, res) => {
  try {
    const { ids, matchResult, remark, interviewDate, entryDate } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请选择要处理的记录' });
    }

    const results = [];

    for (const id of ids) {
      try {
        const existing = await req.prisma.matchingRecord.findUnique({
          where: { id },
          include: { laborDemand: true, candidate: true }
        });

        if (!existing || existing.status !== '待确认') {
          continue;
        }

        let newStatus = existing.status;
        let laborDemandNewStatus = existing.laborDemand.status;
        let candidateNewStatus = existing.candidate.status;

        if (matchResult === '同意') {
          if (entryDate) {
            newStatus = '已入职';
            laborDemandNewStatus = '已完成';
            candidateNewStatus = '已入职';
          } else if (interviewDate) {
            newStatus = '面试中';
          }
        } else if (matchResult === '拒绝') {
          newStatus = '已拒绝';
          laborDemandNewStatus = '处理中';
          candidateNewStatus = '待匹配';
        }

        const matching = await req.prisma.matchingRecord.update({
          where: { id },
          data: {
            matchResult,
            status: newStatus,
            interviewDate: interviewDate ? new Date(interviewDate) : undefined,
            entryDate: entryDate ? new Date(entryDate) : undefined
          },
          include: {
            laborDemand: {
              select: { id: true, demandNumber: true, companyName: true, position: true }
            },
            candidate: {
              select: { id: true, name: true, phone: true, skills: true }
            },
            createdBy: {
              select: { id: true, name: true, role: true }
            }
          }
        });

        await Promise.all([
          req.prisma.laborDemand.update({
            where: { id: existing.laborDemandId },
            data: { status: laborDemandNewStatus }
          }),
          req.prisma.candidate.update({
            where: { id: existing.candidateId },
            data: { status: candidateNewStatus }
          })
        ]);

        await Promise.all([
          req.prisma.statusHistory.create({
            data: {
              entityType: 'MatchingRecord',
              entityId: matching.id,
              previousStatus: existing.status,
              newStatus,
              actionType: '批量确认',
              operatorId: req.userId,
              remark: remark || `批量确认：${matchResult}`
            }
          }),
          req.prisma.statusHistory.create({
            data: {
              entityType: 'LaborDemand',
              entityId: existing.laborDemandId,
              previousStatus: existing.laborDemand.status,
              newStatus: laborDemandNewStatus,
              actionType: '批量确认',
              operatorId: req.userId,
              remark: `批量确认匹配${matchResult}`
            }
          }),
          req.prisma.statusHistory.create({
            data: {
              entityType: 'Candidate',
              entityId: existing.candidateId,
              previousStatus: existing.candidate.status,
              newStatus: candidateNewStatus,
              actionType: '批量确认',
              operatorId: req.userId,
              remark: `批量确认匹配${matchResult}`
            }
          })
        ]);

        results.push(matching);
      } catch (err) {
        console.error(`处理记录 ${id} 失败:`, err);
      }
    }

    res.json({
      message: `成功处理 ${results.length} 条记录`,
      data: results
    });
  } catch (error) {
    console.error('批量确认错误:', error);
    res.status(500).json({ error: '批量确认失败' });
  }
});

router.post('/batch/return', authenticate, async (req, res) => {
  try {
    const { ids, returnReason, remark } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请选择要退回的记录' });
    }

    if (!returnReason) {
      return res.status(400).json({ error: '请输入退回原因' });
    }

    const results = [];

    for (const id of ids) {
      try {
        const existing = await req.prisma.matchingRecord.findUnique({
          where: { id },
          include: { laborDemand: true, candidate: true }
        });

        if (!existing) {
          continue;
        }

        const returnRecord = await req.prisma.returnRecord.create({
          data: {
            entityType: 'MatchingRecord',
            entityId: existing.id,
            matchingRecordId: existing.id,
            laborDemandId: existing.laborDemandId,
            candidateId: existing.candidateId,
            returnType: '退回',
            returnReason,
            operatorId: req.userId,
            status: '待处理'
          }
        });

        await req.prisma.matchingRecord.update({
          where: { id },
          data: { status: '待处理' }
        });

        await Promise.all([
          req.prisma.statusHistory.create({
            data: {
              entityType: 'MatchingRecord',
              entityId: existing.id,
              previousStatus: existing.status,
              newStatus: '待处理',
              actionType: '批量退回',
              operatorId: req.userId,
              remark: remark || `批量退回：${returnReason}`
            }
          }),
          req.prisma.statusHistory.create({
            data: {
              entityType: 'LaborDemand',
              entityId: existing.laborDemandId,
              previousStatus: existing.laborDemand.status,
              newStatus: existing.laborDemand.status,
              actionType: '批量退回',
              operatorId: req.userId,
              remark: `批量退回匹配：${returnReason}`
            }
          }),
          req.prisma.statusHistory.create({
            data: {
              entityType: 'Candidate',
              entityId: existing.candidateId,
              previousStatus: existing.candidate.status,
              newStatus: existing.candidate.status,
              actionType: '批量退回',
              operatorId: req.userId,
              remark: `批量退回匹配：${returnReason}`
            }
          })
        ]);

        results.push({ matchingId: existing.id, returnRecordId: returnRecord.id });
      } catch (err) {
        console.error(`处理记录 ${id} 失败:`, err);
      }
    }

    res.json({
      message: `成功退回 ${results.length} 条记录`,
      data: results
    });
  } catch (error) {
    console.error('批量退回错误:', error);
    res.status(500).json({ error: '批量退回失败' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { status, matchType, laborDemandId, candidateId, startDate, endDate, page = 1, pageSize = 20 } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (matchType) {
      where.matchType = matchType;
    }

    if (laborDemandId) {
      where.laborDemandId = laborDemandId;
    }

    if (candidateId) {
      where.candidateId = candidateId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59');
      }
    }

    const [total, matchings] = await Promise.all([
      req.prisma.matchingRecord.count({ where }),
      req.prisma.matchingRecord.findMany({
        where,
        include: {
          laborDemand: {
            select: { id: true, demandNumber: true, companyName: true, position: true, status: true }
          },
          candidate: {
            select: { id: true, name: true, phone: true, skills: true, status: true }
          },
          createdBy: {
            select: { id: true, name: true, role: true }
          },
          _count: {
            select: { returnRecords: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize)
      })
    ]);

    res.json({
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      data: matchings
    });
  } catch (error) {
    console.error('获取匹配记录列表错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const matching = await req.prisma.matchingRecord.findUnique({
      where: { id },
      include: {
        laborDemand: {
          include: {
            createdBy: {
              select: { id: true, name: true, role: true }
            },
            statusHistories: {
              include: {
                operator: {
                  select: { id: true, name: true, role: true }
                }
              },
              take: 5,
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        candidate: {
          include: {
            createdBy: {
              select: { id: true, name: true, role: true }
            },
            statusHistories: {
              include: {
                operator: {
                  select: { id: true, name: true, role: true }
                }
              },
              take: 5,
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        createdBy: {
          select: { id: true, name: true, role: true }
        },
        statusHistories: {
          include: {
            operator: {
              select: { id: true, name: true, role: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        returnRecords: {
          include: {
            operator: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        attachments: {
          include: {
            uploadedBy: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!matching) {
      return res.status(404).json({ error: '未找到' });
    }

    res.json(matching);
  } catch (error) {
    console.error('获取匹配记录详情错误:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

router.put('/:id/confirm', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { matchResult, remark, interviewDate, entryDate } = req.body;

    const existing = await req.prisma.matchingRecord.findUnique({
      where: { id },
      include: { laborDemand: true, candidate: true }
    });

    if (!existing) {
      return res.status(404).json({ error: '未找到' });
    }

    let newStatus = existing.status;
    let laborDemandNewStatus = existing.laborDemand.status;
    let candidateNewStatus = existing.candidate.status;

    if (matchResult === '同意') {
      if (interviewDate) {
        newStatus = '面试中';
      } else if (entryDate) {
        newStatus = '已入职';
        laborDemandNewStatus = '已完成';
        candidateNewStatus = '已入职';
      }
    } else if (matchResult === '拒绝') {
      newStatus = '已拒绝';
      laborDemandNewStatus = '处理中';
      candidateNewStatus = '待匹配';
    }

    const matching = await req.prisma.matchingRecord.update({
      where: { id },
      data: {
        matchResult,
        status: newStatus,
        interviewDate: interviewDate ? new Date(interviewDate) : undefined,
        entryDate: entryDate ? new Date(entryDate) : undefined
      },
      include: {
        laborDemand: {
          select: { id: true, demandNumber: true, companyName: true, position: true }
        },
        candidate: {
          select: { id: true, name: true, phone: true, skills: true }
        },
        createdBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    await Promise.all([
      req.prisma.laborDemand.update({
        where: { id: existing.laborDemandId },
        data: { status: laborDemandNewStatus }
      }),
      req.prisma.candidate.update({
        where: { id: existing.candidateId },
        data: { status: candidateNewStatus }
      })
    ]);

    await Promise.all([
      req.prisma.statusHistory.create({
        data: {
          entityType: 'MatchingRecord',
          entityId: matching.id,
          previousStatus: existing.status,
          newStatus,
          actionType: '确认',
          operatorId: req.userId,
          remark: remark || `匹配结果：${matchResult}${interviewDate ? '，面试日期：' + interviewDate : ''}${entryDate ? '，入职日期：' + entryDate : ''}`
        }
      }),
      req.prisma.statusHistory.create({
        data: {
          entityType: 'LaborDemand',
          entityId: existing.laborDemandId,
          previousStatus: existing.laborDemand.status,
          newStatus: laborDemandNewStatus,
          actionType: '状态更新',
          operatorId: req.userId,
          remark: `因匹配${matchResult}${matchResult === '同意' && entryDate ? '候选人入职' : ''}，状态更新为${laborDemandNewStatus}`
        }
      }),
      req.prisma.statusHistory.create({
        data: {
          entityType: 'Candidate',
          entityId: existing.candidateId,
          previousStatus: existing.candidate.status,
          newStatus: candidateNewStatus,
          actionType: '状态更新',
          operatorId: req.userId,
          remark: `匹配结果：${matchResult}${matchResult === '同意' && entryDate ? '，已入职' : ''}`
        }
      })
    ]);

    res.json(matching);
  } catch (error) {
    console.error('确认匹配结果错误:', error);
    res.status(500).json({ error: '确认失败' });
  }
});

router.post('/:id/return', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { returnReason, remark } = req.body;

    const existing = await req.prisma.matchingRecord.findUnique({
      where: { id },
      include: { laborDemand: true, candidate: true }
    });

    if (!existing) {
      return res.status(404).json({ error: '未找到' });
    }

    const returnRecord = await req.prisma.returnRecord.create({
      data: {
        entityType: 'MatchingRecord',
        entityId: existing.id,
        matchingRecordId: existing.id,
        laborDemandId: existing.laborDemandId,
        candidateId: existing.candidateId,
        returnType: '退回',
        returnReason,
        operatorId: req.userId,
        status: '待处理'
      }
    });

    await req.prisma.matchingRecord.update({
      where: { id },
      data: { status: '待处理' }
    });

    await Promise.all([
      req.prisma.statusHistory.create({
        data: {
          entityType: 'MatchingRecord',
          entityId: existing.id,
          previousStatus: existing.status,
          newStatus: '待处理',
          actionType: '退回',
          operatorId: req.userId,
          remark: remark || `退回原因：${returnReason}`
        }
      }),
      req.prisma.statusHistory.create({
        data: {
          entityType: 'LaborDemand',
          entityId: existing.laborDemandId,
          previousStatus: existing.laborDemand.status,
          newStatus: existing.laborDemand.status,
          actionType: '退回',
          operatorId: req.userId,
          remark: `退回匹配记录：${returnReason}`
        }
      }),
      req.prisma.statusHistory.create({
        data: {
          entityType: 'Candidate',
          entityId: existing.candidateId,
          previousStatus: existing.candidate.status,
          newStatus: existing.candidate.status,
          actionType: '退回',
          operatorId: req.userId,
          remark: `退回匹配记录：${returnReason}`
        }
      })
    ]);

    res.json({
      matchingId: existing.id,
      returnRecordId: returnRecord.id,
      message: '退回成功，等待一线处理'
    });
  } catch (error) {
    console.error('退回匹配记录错误:', error);
    res.status(500).json({ error: '退回失败' });
  }
});

router.post('/:id/supplement', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { supplementReason, remark } = req.body;

    const existing = await req.prisma.matchingRecord.findUnique({
      where: { id },
      include: { laborDemand: true, candidate: true }
    });

    if (!existing) {
      return res.status(404).json({ error: '未找到' });
    }

    const returnRecord = await req.prisma.returnRecord.create({
      data: {
        entityType: 'MatchingRecord',
        entityId: existing.id,
        matchingRecordId: existing.id,
        laborDemandId: existing.laborDemandId,
        candidateId: existing.candidateId,
        returnType: '补录',
        returnReason: supplementReason,
        operatorId: req.userId,
        status: '待处理'
      }
    });

    await req.prisma.matchingRecord.update({
      where: { id },
      data: { status: '待处理' }
    });

    await Promise.all([
      req.prisma.statusHistory.create({
        data: {
          entityType: 'MatchingRecord',
          entityId: existing.id,
          previousStatus: existing.status,
          newStatus: '待处理',
          actionType: '补录',
          operatorId: req.userId,
          remark: remark || `补录原因：${supplementReason}`
        }
      }),
      req.prisma.statusHistory.create({
        data: {
          entityType: 'LaborDemand',
          entityId: existing.laborDemandId,
          previousStatus: existing.laborDemand.status,
          newStatus: existing.laborDemand.status,
          actionType: '补录',
          operatorId: req.userId,
          remark: `补录匹配记录：${supplementReason}`
        }
      }),
      req.prisma.statusHistory.create({
        data: {
          entityType: 'Candidate',
          entityId: existing.candidateId,
          previousStatus: existing.candidate.status,
          newStatus: existing.candidate.status,
          actionType: '补录',
          operatorId: req.userId,
          remark: `补录匹配记录：${supplementReason}`
        }
      })
    ]);

    res.json({
      matchingId: existing.id,
      returnRecordId: returnRecord.id,
      message: '补录成功，等待一线处理'
    });
  } catch (error) {
    console.error('补录匹配记录错误:', error);
    res.status(500).json({ error: '补录失败' });
  }
});

router.post('/:id/review', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewResult, remark } = req.body;

    if (req.userRole !== '管理') {
      return res.status(403).json({ error: '只有管理人员可以复核' });
    }

    const existing = await req.prisma.matchingRecord.findUnique({
      where: { id },
      include: { laborDemand: true, candidate: true, returnRecords: { where: { status: '已处理' }, orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!existing) {
      return res.status(404).json({ error: '未找到' });
    }

    let newStatus = existing.status;
    let laborDemandNewStatus = existing.laborDemand.status;
    let candidateNewStatus = existing.candidate.status;

    if (reviewResult === '通过') {
      newStatus = '已确认';
      if (existing.matchResult === '同意' && existing.entryDate) {
        laborDemandNewStatus = '已完成';
        candidateNewStatus = '已入职';
      }
    } else if (reviewResult === '不通过') {
      newStatus = '待处理';
      laborDemandNewStatus = '处理中';
      candidateNewStatus = '待匹配';
    }

    const matching = await req.prisma.matchingRecord.update({
      where: { id },
      data: { status: newStatus },
      include: {
        laborDemand: {
          select: { id: true, demandNumber: true, companyName: true, position: true }
        },
        candidate: {
          select: { id: true, name: true, phone: true, skills: true }
        },
        createdBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    await Promise.all([
      req.prisma.laborDemand.update({
        where: { id: existing.laborDemandId },
        data: { status: laborDemandNewStatus }
      }),
      req.prisma.candidate.update({
        where: { id: existing.candidateId },
        data: { status: candidateNewStatus }
      })
    ]);

    if (existing.returnRecords.length > 0) {
      await req.prisma.returnRecord.update({
        where: { id: existing.returnRecords[0].id },
        data: {
          status: '已确认',
          handledById: req.userId,
          handledAt: new Date(),
          handleRemark: remark || `复核结果：${reviewResult}`
        }
      });
    } else {
      await req.prisma.returnRecord.create({
        data: {
          entityType: 'MatchingRecord',
          entityId: matching.id,
          matchingRecordId: matching.id,
          laborDemandId: existing.laborDemandId,
          candidateId: existing.candidateId,
          returnType: '复核',
          returnReason: `复核结果：${reviewResult}`,
          operatorId: req.userId,
          status: '已确认',
          handledById: req.userId,
          handledAt: new Date(),
          handleRemark: remark || `复核结果：${reviewResult}`
        }
      });
    }

    await Promise.all([
      req.prisma.statusHistory.create({
        data: {
          entityType: 'MatchingRecord',
          entityId: matching.id,
          previousStatus: existing.status,
          newStatus,
          actionType: '复核',
          operatorId: req.userId,
          remark: remark || `复核结果：${reviewResult}`
        }
      }),
      req.prisma.statusHistory.create({
        data: {
          entityType: 'LaborDemand',
          entityId: existing.laborDemandId,
          previousStatus: existing.laborDemand.status,
          newStatus: laborDemandNewStatus,
          actionType: '复核',
          operatorId: req.userId,
          remark: `复核匹配记录${reviewResult}，状态更新为${laborDemandNewStatus}`
        }
      }),
      req.prisma.statusHistory.create({
        data: {
          entityType: 'Candidate',
          entityId: existing.candidateId,
          previousStatus: existing.candidate.status,
          newStatus: candidateNewStatus,
          actionType: '复核',
          operatorId: req.userId,
          remark: `复核匹配记录${reviewResult}`
        }
      })
    ]);

    res.json(matching);
  } catch (error) {
    console.error('复核匹配记录错误:', error);
    res.status(500).json({ error: '复核失败' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.matchingRecord.delete({ where: { id } });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除匹配记录错误:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

export default router;