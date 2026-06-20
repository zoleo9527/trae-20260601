import db from '../config/database';
import * as userService from '../services/user.service';
import * as batchService from '../services/batch.service';
import * as sortingService from '../services/sorting.service';
import * as gradeService from '../services/grade.service';
import * as inventoryService from '../services/inventory.service';
import * as priceService from '../services/price.service';
import { getMaterialTypeName, getRoleName, getStatusName } from '../utils/helpers';

const seedData = () => {
  console.log('========================================');
  console.log('  再生资源分拣中心品级确认系统 - 演示数据');
  console.log('========================================\n');

  console.log('📋 第一步：创建系统用户');
  console.log('----------------------------------------');
  
  const weigher = userService.createUser('weigher01', '张过磅', 'weigher');
  console.log(`✓ 过磅员: ${weigher.name} (${weigher.username})`);

  const foreman = userService.createUser('foreman01', '李班长', 'sorting_foreman');
  console.log(`✓ 分拣班长: ${foreman.name} (${foreman.username})`);

  const salesClerk = userService.createUser('sales01', '王销售', 'sales_clerk');
  console.log(`✓ 销售内勤: ${salesClerk.name} (${salesClerk.username})`);

  const reviewer = userService.createUser('reviewer01', '赵复核', 'reviewer');
  console.log(`✓ 复核员: ${reviewer.name} (${reviewer.username})`);

  console.log('\n💰 第二步：设置价格体系');
  console.log('----------------------------------------');
  
  const priceMatrix: Record<string, Record<string, number>> = {
    PET: { A: 3.50, B: 2.80, C: 2.20, D: 1.50, E: 0.80 },
    HDPE: { A: 3.20, B: 2.60, C: 2.00, D: 1.30, E: 0.70 },
    PVC: { A: 2.80, B: 2.30, C: 1.80, D: 1.10, E: 0.60 },
    PP: { A: 3.80, B: 3.10, C: 2.50, D: 1.70, E: 0.90 },
    paper: { A: 1.80, B: 1.50, C: 1.20, D: 0.80, E: 0.40 },
    metal: { A: 12.00, B: 10.00, C: 8.00, D: 5.00, E: 3.00 },
    glass: { A: 0.60, B: 0.50, C: 0.40, D: 0.25, E: 0.10 }
  };

  Object.entries(priceMatrix).forEach(([material, grades]) => {
    Object.entries(grades).forEach(([grade, price]) => {
      priceService.addPrice(material as any, grade as any, price);
    });
  });
  console.log(`✓ 价格体系已设置 (7种材料 × 5个品级)`);

  console.log('\n🚛 场景一：混装进厂 → 正常流程');
  console.log('----------------------------------------');
  console.log('过磅员登记混装货物进厂');
  
  const batch1 = batchService.createInboundBatch({
    source: '北京市海淀区回收点',
    supplier: '绿色回收有限公司',
    vehicle_plate: '京A·12345',
    material_type: 'mixed_plastic',
    gross_weight: 12500,
    tare_weight: 3500,
    weigher_id: weigher.id,
    weigher_name: weigher.name,
    remark: '混合塑料，包含PET、HDPE、PVC等'
  });
  console.log(`✓ 批次 ${batch1.batch_no} 已创建`);
  console.log(`  来源: ${batch1.source}`);
  console.log(`  毛重: ${batch1.gross_weight}kg | 皮重: ${batch1.tare_weight}kg | 净重: ${batch1.net_weight}kg`);
  console.log(`  状态: ${getStatusName(batch1.status)}`);

  console.log('\n分拣班长进行分选');
  const sorting1 = sortingService.createSortingRecord({
    batch_id: batch1.id,
    team_id: 'team-001',
    team_name: '第一分选班组',
    foreman_id: foreman.id,
    foreman_name: foreman.name,
    sorted_materials: [
      {
        material_type: 'PET',
        weight: 4200,
        photo_urls: ['/photos/PET_batch1_1.jpg', '/photos/PET_batch1_2.jpg']
      },
      {
        material_type: 'HDPE',
        weight: 2800,
        photo_urls: ['/photos/HDPE_batch1_1.jpg']
      },
      {
        material_type: 'PVC',
        weight: 1500,
        photo_urls: ['/photos/PVC_batch1_1.jpg']
      },
      {
        material_type: 'other',
        weight: 300,
        photo_urls: []
      }
    ],
    remark: '分选正常，损耗约8%'
  });
  console.log(`✓ 分选记录已创建`);
  console.log(`  分选班组: ${sorting1.team_name}`);
  console.log(`  总分选重量: ${sorting1.total_sorted_weight}kg | 损耗: ${sorting1.loss_weight}kg`);
  sorting1.sorted_materials.forEach(m => {
    console.log(`  - ${getMaterialTypeName(m.material_type)}: ${m.weight}kg`);
  });

  console.log('\n销售内勤进行品级判定和报价');
  const petMaterial1 = sorting1.sorted_materials.find(m => m.material_type === 'PET')!;
  const hdpeMaterial1 = sorting1.sorted_materials.find(m => m.material_type === 'HDPE')!;
  const pvcMaterial1 = sorting1.sorted_materials.find(m => m.material_type === 'PVC')!;
  const otherMaterial1 = sorting1.sorted_materials.find(m => m.material_type === 'other')!;

  const judgmentPET1 = gradeService.createGradeJudgment({
    batch_id: batch1.id,
    sorted_material_id: petMaterial1.id,
    original_grade: 'B',
    judged_grade: 'A',
    unit_price: 3.50,
    judge_id: salesClerk.id,
    judge_name: salesClerk.name,
    photo_urls: ['/photos/grade_PET_A_1.jpg'],
    remark: 'PET瓶成色好，无污渍，判定为A级'
  });
  console.log(`✓ PET品级判定: ${judgmentPET1.original_grade}→${judgmentPET1.judged_grade}级 | ${judgmentPET1.unit_price}元/kg | 金额: ${judgmentPET1.amount.toFixed(2)}元`);

  const judgmentHDPE1 = gradeService.createGradeJudgment({
    batch_id: batch1.id,
    sorted_material_id: hdpeMaterial1.id,
    original_grade: 'B',
    judged_grade: 'B',
    unit_price: 2.60,
    judge_id: salesClerk.id,
    judge_name: salesClerk.name,
    photo_urls: ['/photos/grade_HDPE_B_1.jpg'],
    remark: 'HDPE桶有轻微使用痕迹，判定为B级'
  });
  console.log(`✓ HDPE品级判定: ${judgmentHDPE1.original_grade}→${judgmentHDPE1.judged_grade}级 | ${judgmentHDPE1.unit_price}元/kg | 金额: ${judgmentHDPE1.amount.toFixed(2)}元`);

  const judgmentPVC1 = gradeService.createGradeJudgment({
    batch_id: batch1.id,
    sorted_material_id: pvcMaterial1.id,
    original_grade: 'C',
    judged_grade: 'C',
    unit_price: 1.80,
    judge_id: salesClerk.id,
    judge_name: salesClerk.name,
    photo_urls: ['/photos/grade_PVC_C_1.jpg'],
    remark: 'PVC管材有磨损，判定为C级'
  });
  console.log(`✓ PVC品级判定: ${judgmentPVC1.original_grade}→${judgmentPVC1.judged_grade}级 | ${judgmentPVC1.unit_price}元/kg | 金额: ${judgmentPVC1.amount.toFixed(2)}元`);

  const scrapOther1 = inventoryService.createScrapRecord({
    batch_id: batch1.id,
    sorted_material_id: otherMaterial1.id,
    handler_id: salesClerk.id,
    handler_name: salesClerk.name,
    reason: 'other尾料：混杂塑料碎片、标签纸、灰尘等无回收价值物质'
  });
  console.log(`🗑️ other尾料报废处理: ${scrapOther1.weight}kg, 入账至${scrapOther1.warehouse}-${scrapOther1.location}`);

  console.log('\n库存入账');
  const invPET1 = inventoryService.createInventoryRecord({
    batch_id: batch1.id,
    sorted_material_id: petMaterial1.id,
    warehouse: 'A仓库',
    location: 'A-01-01',
    stocker_id: weigher.id,
    stocker_name: weigher.name,
    remark: '正常入库'
  });
  console.log(`✓ ${getMaterialTypeName(invPET1.material_type)} ${invPET1.grade_level}级入库: ${invPET1.weight}kg @ ${invPET1.warehouse} ${invPET1.location}`);

  const invHDPE1 = inventoryService.createInventoryRecord({
    batch_id: batch1.id,
    sorted_material_id: hdpeMaterial1.id,
    warehouse: 'A仓库',
    location: 'A-02-01',
    stocker_id: weigher.id,
    stocker_name: weigher.name,
    remark: '正常入库'
  });
  console.log(`✓ ${getMaterialTypeName(invHDPE1.material_type)} ${invHDPE1.grade_level}级入库: ${invHDPE1.weight}kg @ ${invHDPE1.warehouse} ${invHDPE1.location}`);

  const invPVC1 = inventoryService.createInventoryRecord({
    batch_id: batch1.id,
    sorted_material_id: pvcMaterial1.id,
    warehouse: 'B仓库',
    location: 'B-01-01',
    stocker_id: weigher.id,
    stocker_name: weigher.name,
    remark: '正常入库'
  });
  console.log(`✓ ${getMaterialTypeName(invPVC1.material_type)} ${invPVC1.grade_level}级入库: ${invPVC1.weight}kg @ ${invPVC1.warehouse} ${invPVC1.location}`);

  const batch1Final = batchService.getInboundBatchById(batch1.id)!;
  console.log(`  批次最终状态: ${getStatusName(batch1Final.status)}`);

  console.log('\n📉 场景二：降级处理');
  console.log('----------------------------------------');
  console.log('过磅员登记第二批货物进厂');
  
  const batch2 = batchService.createInboundBatch({
    source: '北京市朝阳区回收站',
    supplier: '废品收购联盟',
    vehicle_plate: '京B·67890',
    material_type: 'mixed_plastic',
    gross_weight: 9800,
    tare_weight: 3200,
    weigher_id: weigher.id,
    weigher_name: weigher.name,
    remark: '混合塑料，目测质量较差'
  });
  console.log(`✓ 批次 ${batch2.batch_no} 已创建`);
  console.log(`  净重: ${batch2.net_weight}kg`);

  console.log('\n分拣班长进行分选');
  const sorting2 = sortingService.createSortingRecord({
    batch_id: batch2.id,
    team_id: 'team-002',
    team_name: '第二分选班组',
    foreman_id: foreman.id,
    foreman_name: foreman.name,
    sorted_materials: [
      {
        material_type: 'PP',
        weight: 3500,
        photo_urls: ['/photos/PP_batch2_1.jpg']
      },
      {
        material_type: 'paper',
        weight: 2200,
        photo_urls: ['/photos/paper_batch2_1.jpg']
      },
      {
        material_type: 'other',
        weight: 400,
        photo_urls: []
      }
    ],
    remark: '货物质量较差，含较多杂质'
  });
  console.log(`✓ 分选完成: PP ${sorting2.sorted_materials[0].weight}kg, 废纸 ${sorting2.sorted_materials[1].weight}kg`);

  console.log('\n销售内勤进行品级判定（降级处理）');
  const ppMaterial2 = sorting2.sorted_materials.find(m => m.material_type === 'PP')!;
  const paperMaterial2 = sorting2.sorted_materials.find(m => m.material_type === 'paper')!;
  const otherMaterial2 = sorting2.sorted_materials.find(m => m.material_type === 'other')!;

  const judgmentPP2 = gradeService.createGradeJudgment({
    batch_id: batch2.id,
    sorted_material_id: ppMaterial2.id,
    original_grade: 'B',
    judged_grade: 'C',
    unit_price: 2.50,
    judge_id: salesClerk.id,
    judge_name: salesClerk.name,
    photo_urls: ['/photos/grade_PP_C_1.jpg', '/photos/grade_PP_C_2.jpg'],
    remark: '【降级】PP材料有明显污渍和老化，由预估B级降为C级'
  });
  console.log(`✓ PP品级判定: ⚠️ 降级 ${judgmentPP2.original_grade}→${judgmentPP2.judged_grade}级`);
  console.log(`  原单价: 3.10元/kg → 现单价: ${judgmentPP2.unit_price}元/kg`);
  console.log(`  金额: ${judgmentPP2.amount.toFixed(2)}元 (若为B级应为: ${(3500 * 3.10).toFixed(2)}元)`);
  console.log(`  损失: ${(3500 * 3.10 - judgmentPP2.amount).toFixed(2)}元`);

  const judgmentPaper2 = gradeService.createGradeJudgment({
    batch_id: batch2.id,
    sorted_material_id: paperMaterial2.id,
    original_grade: 'B',
    judged_grade: 'D',
    unit_price: 0.80,
    judge_id: salesClerk.id,
    judge_name: salesClerk.name,
    photo_urls: ['/photos/grade_paper_D_1.jpg'],
    remark: '【降级】废纸潮湿有霉斑，由预估B级降为D级'
  });
  console.log(`✓ 废纸品级判定: ⚠️ 降级 ${judgmentPaper2.original_grade}→${judgmentPaper2.judged_grade}级`);
  console.log(`  原单价: 1.50元/kg → 现单价: ${judgmentPaper2.unit_price}元/kg`);
  console.log(`  金额: ${judgmentPaper2.amount.toFixed(2)}元 (若为B级应为: ${(2200 * 1.50).toFixed(2)}元)`);
  console.log(`  损失: ${(2200 * 1.50 - judgmentPaper2.amount).toFixed(2)}元`);

  const scrapOther2 = inventoryService.createScrapRecord({
    batch_id: batch2.id,
    sorted_material_id: otherMaterial2.id,
    handler_id: salesClerk.id,
    handler_name: salesClerk.name,
    reason: 'other尾料：泥沙石块、腐烂杂物，质量极差无法回收'
  });
  console.log(`🗑️ other尾料报废处理: ${scrapOther2.weight}kg`);

  console.log('\n库存入账');
  const invPP2 = inventoryService.createInventoryRecord({
    batch_id: batch2.id,
    sorted_material_id: ppMaterial2.id,
    warehouse: 'C仓库',
    location: 'C-01-01',
    stocker_id: weigher.id,
    stocker_name: weigher.name,
    remark: '降级品入库'
  });
  console.log(`✓ PP ${invPP2.grade_level}级入库: ${invPP2.weight}kg`);

  const invPaper2 = inventoryService.createInventoryRecord({
    batch_id: batch2.id,
    sorted_material_id: paperMaterial2.id,
    warehouse: 'C仓库',
    location: 'C-02-01',
    stocker_id: weigher.id,
    stocker_name: weigher.name,
    remark: '降级品入库'
  });
  console.log(`✓ 废纸 ${invPaper2.grade_level}级入库: ${invPaper2.weight}kg`);

  console.log('\n🔄 场景三：复核改判');
  console.log('----------------------------------------');
  console.log('过磅员登记第三批货物进厂');
  
  const batch3 = batchService.createInboundBatch({
    source: '北京市丰台区工业园',
    supplier: '工业废料处理中心',
    vehicle_plate: '京C·11111',
    material_type: 'mixed_plastic',
    gross_weight: 15000,
    tare_weight: 4000,
    weigher_id: weigher.id,
    weigher_name: weigher.name,
    remark: '工业边角料，待检验'
  });
  console.log(`✓ 批次 ${batch3.batch_no} 已创建, 净重: ${batch3.net_weight}kg`);

  console.log('\n分拣班长进行分选');
  const sorting3 = sortingService.createSortingRecord({
    batch_id: batch3.id,
    team_id: 'team-001',
    team_name: '第一分选班组',
    foreman_id: foreman.id,
    foreman_name: foreman.name,
    sorted_materials: [
      {
        material_type: 'PET',
        weight: 5500,
        photo_urls: ['/photos/PET_batch3_1.jpg']
      },
      {
        material_type: 'metal',
        weight: 3800,
        photo_urls: ['/photos/metal_batch3_1.jpg']
      },
      {
        material_type: 'HDPE',
        weight: 1200,
        photo_urls: ['/photos/HDPE_batch3_1.jpg']
      },
      {
        material_type: 'other',
        weight: 500,
        photo_urls: []
      }
    ],
    remark: '工业边角料，质量较好'
  });
  console.log(`✓ 分选完成: PET 5500kg, 金属 3800kg, HDPE 1200kg, other 500kg`);

  console.log('\n销售内勤进行品级判定');
  const petMaterial3 = sorting3.sorted_materials.find(m => m.material_type === 'PET')!;
  const metalMaterial3 = sorting3.sorted_materials.find(m => m.material_type === 'metal')!;
  const hdpeMaterial3 = sorting3.sorted_materials.find(m => m.material_type === 'HDPE')!;
  const otherMaterial3 = sorting3.sorted_materials.find(m => m.material_type === 'other')!;

  const judgmentPET3 = gradeService.createGradeJudgment({
    batch_id: batch3.id,
    sorted_material_id: petMaterial3.id,
    original_grade: 'A',
    judged_grade: 'B',
    unit_price: 2.80,
    judge_id: salesClerk.id,
    judge_name: salesClerk.name,
    photo_urls: ['/photos/grade_PET_B_3.jpg'],
    remark: 'PET有轻微划痕，判定为B级'
  });
  console.log(`✓ PET品级判定: ${judgmentPET3.original_grade}→${judgmentPET3.judged_grade}级 | ${judgmentPET3.unit_price}元/kg | ${judgmentPET3.amount.toFixed(2)}元`);

  const judgmentMetal3 = gradeService.createGradeJudgment({
    batch_id: batch3.id,
    sorted_material_id: metalMaterial3.id,
    original_grade: 'B',
    judged_grade: 'C',
    unit_price: 8.00,
    judge_id: salesClerk.id,
    judge_name: salesClerk.name,
    photo_urls: ['/photos/grade_metal_C_3.jpg'],
    remark: '金属有锈蚀，判定为C级'
  });
  console.log(`✓ 金属品级判定: ${judgmentMetal3.original_grade}→${judgmentMetal3.judged_grade}级 | ${judgmentMetal3.unit_price}元/kg | ${judgmentMetal3.amount.toFixed(2)}元`);

  const judgmentHDPE3 = gradeService.createGradeJudgment({
    batch_id: batch3.id,
    sorted_material_id: hdpeMaterial3.id,
    original_grade: 'A',
    judged_grade: 'A',
    unit_price: 3.20,
    judge_id: salesClerk.id,
    judge_name: salesClerk.name,
    photo_urls: ['/photos/grade_HDPE_A_3.jpg'],
    remark: 'HDPE质量很好，判定为A级'
  });
  console.log(`✓ HDPE品级判定: ${judgmentHDPE3.original_grade}→${judgmentHDPE3.judged_grade}级 | ${judgmentHDPE3.unit_price}元/kg | ${judgmentHDPE3.amount.toFixed(2)}元`);

  const scrapOther3 = inventoryService.createScrapRecord({
    batch_id: batch3.id,
    sorted_material_id: otherMaterial3.id,
    handler_id: salesClerk.id,
    handler_name: salesClerk.name,
    reason: 'other尾料：工业生产边角料中的混杂垃圾、包装碎片等'
  });
  console.log(`🗑️ other尾料报废处理: ${scrapOther3.weight}kg`);

  console.log('\n📝 复核员进行复核改判');
  console.log('  发现PET实际质量很好，应该是A级而非B级');
  
  const reviewResultPET = gradeService.updateGradeJudgment(
    judgmentPET3.id,
    'A',
    3.50,
    reviewer.id,
    reviewer.name,
    '复核确认：PET为工业边角料，无划痕，原判定有误，改判为A级'
  );
  const reviewRecordPET = inventoryService.getReviewRecordsByJudgmentId(judgmentPET3.id)[0];
  
  console.log(`✓ PET品级复核: 🔄 改判`);
  console.log(`  原判定: ${reviewRecordPET.original_grade}级 | ${reviewRecordPET.original_unit_price}元/kg | ${reviewRecordPET.original_amount.toFixed(2)}元`);
  console.log(`  新判定: ${reviewRecordPET.new_grade}级 | ${reviewRecordPET.new_unit_price}元/kg | ${reviewRecordPET.new_amount.toFixed(2)}元`);
  console.log(`  差异: ${reviewRecordPET.grade_difference}`);
  console.log(`  金额调整: +${reviewRecordPET.amount_difference.toFixed(2)}元`);
  console.log(`  复核原因: ${reviewRecordPET.reason}`);

  console.log('\n  发现金属锈蚀轻微，应该是B级而非C级');
  
  const reviewResultMetal = gradeService.updateGradeJudgment(
    judgmentMetal3.id,
    'B',
    10.00,
    reviewer.id,
    reviewer.name,
    '复核确认：金属表面轻微氧化，内部完好，原判定偏严，改判为B级'
  );
  const reviewRecordMetal = inventoryService.getReviewRecordsByJudgmentId(judgmentMetal3.id)[0];
  
  console.log(`✓ 金属品级复核: 🔄 改判`);
  console.log(`  原判定: ${reviewRecordMetal.original_grade}级 | ${reviewRecordMetal.original_unit_price}元/kg | ${reviewRecordMetal.original_amount.toFixed(2)}元`);
  console.log(`  新判定: ${reviewRecordMetal.new_grade}级 | ${reviewRecordMetal.new_unit_price}元/kg | ${reviewRecordMetal.new_amount.toFixed(2)}元`);
  console.log(`  差异: ${reviewRecordMetal.grade_difference}`);
  console.log(`  金额调整: +${reviewRecordMetal.amount_difference.toFixed(2)}元`);
  console.log(`  复核原因: ${reviewRecordMetal.reason}`);

  const totalAdjustment = reviewRecordPET.amount_difference + reviewRecordMetal.amount_difference;
  console.log(`\n  本批次复核总调整金额: +${totalAdjustment.toFixed(2)}元`);

  console.log('\n库存入账');
  const invPET3 = inventoryService.createInventoryRecord({
    batch_id: batch3.id,
    sorted_material_id: petMaterial3.id,
    warehouse: 'A仓库',
    location: 'A-01-02',
    stocker_id: weigher.id,
    stocker_name: weigher.name,
    remark: '复核改判后入库'
  });
  console.log(`✓ PET ${invPET3.grade_level}级入库: ${invPET3.weight}kg, 单价: ${invPET3.unit_price}元/kg`);

  const invMetal3 = inventoryService.createInventoryRecord({
    batch_id: batch3.id,
    sorted_material_id: metalMaterial3.id,
    warehouse: 'D仓库',
    location: 'D-01-01',
    stocker_id: weigher.id,
    stocker_name: weigher.name,
    remark: '复核改判后入库'
  });
  console.log(`✓ 金属 ${invMetal3.grade_level}级入库: ${invMetal3.weight}kg, 单价: ${invMetal3.unit_price}元/kg`);

  const invHDPE3 = inventoryService.createInventoryRecord({
    batch_id: batch3.id,
    sorted_material_id: hdpeMaterial3.id,
    warehouse: 'A仓库',
    location: 'A-02-02',
    stocker_id: weigher.id,
    stocker_name: weigher.name,
    remark: '正常入库'
  });
  console.log(`✓ HDPE ${invHDPE3.grade_level}级入库: ${invHDPE3.weight}kg`);

  const batch3Final = batchService.getInboundBatchById(batch3.id)!;
  console.log(`  批次最终状态: ${getStatusName(batch3Final.status)}`);

  console.log('\n========================================');
  console.log('  📊 数据汇总');
  console.log('========================================');
  
  const allBatches = batchService.getAllInboundBatches();
  console.log(`\n进厂批次总数: ${allBatches.length}`);
  allBatches.forEach(b => {
    console.log(`  ${b.batch_no} | ${getMaterialTypeName(b.material_type)} | ${b.net_weight}kg | ${getStatusName(b.status)}`);
  });

  const allInventory = inventoryService.getAllInventoryRecords();
  const totalWeight = allInventory.reduce((sum, i) => sum + i.weight, 0);
  const totalAmount = allInventory.reduce((sum, i) => sum + i.amount, 0);
  console.log(`\n库存记录总数: ${allInventory.length}`);
  console.log(`库存总重量: ${totalWeight.toFixed(2)}kg`);
  console.log(`库存总金额: ${totalAmount.toFixed(2)}元`);

  const allReviews = inventoryService.getAllReviewRecords();
  console.log(`\n复核记录总数: ${allReviews.length}`);
  allReviews.forEach(r => {
    console.log(`  ${r.grade_difference} | 金额调整: ${r.amount_difference > 0 ? '+' : ''}${r.amount_difference.toFixed(2)}元`);
  });

  console.log('\n========================================');
  console.log('  ✅ 演示数据创建完成！');
  console.log('========================================');
  console.log('\n📋 可用账号:');
  console.log(`  过磅员: weigher01 / ${weigher.name}`);
  console.log(`  分拣班长: foreman01 / ${foreman.name}`);
  console.log(`  销售内勤: sales01 / ${salesClerk.name}`);
  console.log(`  复核员: reviewer01 / ${reviewer.name}`);
  console.log('\n🔧 API地址: http://localhost:3000/api');
};

seedData();
