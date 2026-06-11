import { v4 as uuidv4 } from 'uuid';
import db from './database.js';

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString().replace('T', ' ').slice(0, 19);

function seed() {
  const count = db.prepare('SELECT COUNT(*) as c FROM completion_documents').get() as { c: number };
  if (count.c > 0) return;

  const insertDoc = db.prepare(`
    INSERT INTO completion_documents (id, project_name, doc_type, status, assignee_name, assignee_role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRemark = db.prepare(`
    INSERT INTO remarks (id, document_id, content, author, author_role, stage, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertException = db.prepare(`
    INSERT INTO exceptions (id, document_id, category, description, status, handler, handler_role, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertExceptionRecord = db.prepare(`
    INSERT INTO exception_records (id, exception_id, action, operator, operator_role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertSignOff = db.prepare(`
    INSERT INTO sign_offs (id, document_id, client_name, result, comment, signed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const seedData = db.transaction(() => {
    const doc1Id = uuidv4();
    const doc2Id = uuidv4();
    const doc3Id = uuidv4();
    const doc4Id = uuidv4();
    const doc5Id = uuidv4();
    const doc6Id = uuidv4();
    const doc7Id = uuidv4();
    const doc8Id = uuidv4();
    const doc9Id = uuidv4();

    insertDoc.run(doc1Id, '华润大厦弱电工程', '布线图', '待整理', '陈雪', '资料员', daysAgo(1), daysAgo(1));
    insertDoc.run(doc2Id, '碧桂园智慧园区项目', '材料领用单', '待整理', '陈雪', '资料员', daysAgo(2), daysAgo(2));
    insertDoc.run(doc3Id, '中海国际综合布线', '现场照片', '待整理', '陈雪', '资料员', daysAgo(1), daysAgo(1));

    insertDoc.run(doc4Id, '万科城市花园监控工程', '测试报告', '待审核', '王建国', '项目负责人', daysAgo(3), daysAgo(2));
    insertDoc.run(doc5Id, '融创天朗网络工程', '验收记录', '待审核', '王建国', '项目负责人', daysAgo(4), daysAgo(3));

    insertDoc.run(doc6Id, '保利天悦智能楼宇项目', '验收记录', '待签认', '李明辉', '项目负责人', daysAgo(5), daysAgo(3));

    insertDoc.run(doc7Id, '绿城翡翠城弱电施工', '布线图', '已驳回', '张伟', '项目负责人', daysAgo(10), daysAgo(8));
    insertDoc.run(doc8Id, '恒大御景湾安防系统', '现场照片', '已驳回', '王建国', '项目负责人', daysAgo(12), daysAgo(9));

    insertDoc.run(doc9Id, '龙湖春江郦城综合布线', '测试报告', '已签认', '王建国', '项目负责人', daysAgo(7), daysAgo(2));

    insertRemark.run(uuidv4(), doc1Id, '布线图纸已收到，正在整理归档', '陈雪', '资料员', '整理', daysAgo(1));
    insertRemark.run(uuidv4(), doc1Id, '需核对3楼弱电井走线与现场是否一致', '陈雪', '资料员', '整理', daysAgo(1));

    insertRemark.run(uuidv4(), doc2Id, '材料清单与领用记录初步核对中', '陈雪', '资料员', '整理', daysAgo(2));

    insertRemark.run(uuidv4(), doc3Id, '现场照片已上传，需补充B区照片', '陈雪', '资料员', '整理', daysAgo(1));

    insertRemark.run(uuidv4(), doc4Id, '测试报告整理完毕，提交审核', '陈雪', '资料员', '整理', daysAgo(3));
    insertRemark.run(uuidv4(), doc4Id, '正在审核测试数据完整性', '王建国', '项目负责人', '审核', daysAgo(2));

    insertRemark.run(uuidv4(), doc5Id, '验收记录已整理，部分内容需项目负责人确认', '陈雪', '资料员', '整理', daysAgo(4));
    insertRemark.run(uuidv4(), doc5Id, '验收标准需与合同条款核对', '王建国', '项目负责人', '审核', daysAgo(3));

    insertRemark.run(uuidv4(), doc6Id, '验收记录整理完成，等待客户签认', '陈雪', '资料员', '整理', daysAgo(5));
    insertRemark.run(uuidv4(), doc6Id, '审核通过，已提交客户签认', '王建国', '项目负责人', '审核', daysAgo(3));
    insertRemark.run(uuidv4(), doc6Id, '已通知客户方张总安排签认时间', '李明辉', '项目负责人', '签认', daysAgo(3));

    insertRemark.run(uuidv4(), doc7Id, '布线图整理完毕，提交审核', '陈雪', '资料员', '整理', daysAgo(10));
    insertRemark.run(uuidv4(), doc7Id, '2楼与4楼布线标注有误，需修正', '王建国', '项目负责人', '审核', daysAgo(9));
    insertRemark.run(uuidv4(), doc7Id, '客户签认时发现与实际施工不符，已驳回', '张伟', '项目负责人', '签认', daysAgo(8));
    insertRemark.run(uuidv4(), doc7Id, '布线图与现场不一致，需重新核实', '张伟', '项目负责人', '异常处理', daysAgo(8));

    insertRemark.run(uuidv4(), doc8Id, '现场照片整理完毕', '陈雪', '资料员', '整理', daysAgo(12));
    insertRemark.run(uuidv4(), doc8Id, '审核发现部分照片模糊不清', '王建国', '项目负责人', '审核', daysAgo(10));
    insertRemark.run(uuidv4(), doc8Id, '客户认为照片不能反映实际施工情况，拒绝签认', '王建国', '项目负责人', '签认', daysAgo(9));
    insertRemark.run(uuidv4(), doc8Id, '需要补拍清晰照片并重新整理', '王建国', '项目负责人', '异常处理', daysAgo(9));

    insertRemark.run(uuidv4(), doc9Id, '测试报告整理完毕', '陈雪', '资料员', '整理', daysAgo(7));
    insertRemark.run(uuidv4(), doc9Id, '审核通过，所有测试指标达标', '王建国', '项目负责人', '审核', daysAgo(4));
    insertRemark.run(uuidv4(), doc9Id, '客户确认签认', '李明辉', '项目负责人', '签认', daysAgo(2));

    const exc7Id = uuidv4();
    insertException.run(exc7Id, doc7Id, '布线图错误', '2楼与4楼布线图标注与实际施工不符，客户签认时发现并驳回', '处理中', '张伟', '项目负责人', daysAgo(8), null);
    insertExceptionRecord.run(uuidv4(), exc7Id, '创建异常记录，标注布线图错误详情', '张伟', '项目负责人', daysAgo(8));
    insertExceptionRecord.run(uuidv4(), exc7Id, '已通知施工班组现场核实', '张伟', '项目负责人', daysAgo(7));

    const exc8Id = uuidv4();
    insertException.run(exc8Id, doc8Id, '照片不符', '现场照片模糊不清，客户认为无法反映实际施工情况，拒绝签认', '待处理', null, null, daysAgo(9), null);
    insertExceptionRecord.run(uuidv4(), exc8Id, '创建异常记录，照片质量问题', '王建国', '项目负责人', daysAgo(9));

    insertSignOff.run(uuidv4(), doc9Id, '刘总', '已签认', '所有测试指标均达标，同意签认', daysAgo(2));

    insertSignOff.run(uuidv4(), doc7Id, '赵总', '已驳回', '布线图与实际施工不符，要求重新整理', daysAgo(8));

    insertSignOff.run(uuidv4(), doc8Id, '孙总', '已驳回', '照片质量不达标，无法确认施工质量', daysAgo(9));
  });

  seedData();
  console.log('Database seeded successfully');
}

seed();
