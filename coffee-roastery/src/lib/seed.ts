import { getDb, initSchema, createGreenBean, createRoastingPlan, createException, addTimelineEvent } from './db.js';

export function seedData(): void {
	const db = getDb();
	const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
	if (userCount > 0) return;

	const insertUser = db.prepare(
		'INSERT INTO users (username, password, role, display_name) VALUES (?, ?, ?, ?)'
	);

	insertUser.run('roaster_zhang', '123456', 'roaster', '张烘焙');
	insertUser.run('cupper_li', '123456', 'cupper', '李杯测');
	insertUser.run('cs_wang', '123456', 'cs', '王客服');

	const gb1 = createGreenBean({
		batch_no: 'GB-20260601-001',
		name: '埃塞俄比亚 耶加雪菲',
		origin: '埃塞俄比亚',
		variety: 'Heirloom',
		process: '水洗',
		weight_kg: 60,
		remaining_kg: 60,
		bag_count: 1,
		supplier: 'ECX出口商A',
		contract_no: 'CT-2026-001',
		arrival_date: '2026-05-28',
		warehouse_location: 'A区-01',
		moisture_content: 11.2,
		density: 780,
		screen_size: '14+',
		notes: '本季新豆，风味明亮',
		status: 'stored',
		created_by: 1
	});

	addTimelineEvent('green_bean', gb1, 'created', '生豆入库登记完成', 1);
	addTimelineEvent('green_bean', gb1, 'inspection', '水分/密度检测完成，合格', 1);
	addTimelineEvent('green_bean', gb1, 'status_change', '状态变更为: stored', 1);

	const gb2 = createGreenBean({
		batch_no: 'GB-20260602-001',
		name: '哥伦比亚 慧兰',
		origin: '哥伦比亚',
		variety: 'Caturra',
		process: '蜜处理',
		weight_kg: 30,
		remaining_kg: 30,
		bag_count: 1,
		supplier: 'FNC合作商B',
		contract_no: 'CT-2026-002',
		arrival_date: '2026-06-02',
		warehouse_location: 'A区-03',
		moisture_content: 10.8,
		density: 760,
		screen_size: '15+',
		notes: '',
		status: 'pending_inspection',
		created_by: 1
	});

	addTimelineEvent('green_bean', gb2, 'created', '生豆入库登记完成，等待检验', 1);

	const gb3 = createGreenBean({
		batch_no: 'GB-20260603-001',
		name: '巴拿马 翡翠庄园',
		origin: '巴拿马',
		variety: 'Geisha',
		process: '日晒',
		weight_kg: 15,
		remaining_kg: 15,
		bag_count: 1,
		supplier: '翡翠庄园直采',
		contract_no: 'CT-2026-003',
		arrival_date: '2026-06-03',
		warehouse_location: 'B区-冷藏',
		moisture_content: 11.5,
		density: 720,
		screen_size: '16+',
		notes: '高端限量批次，需单独烘焙排期',
		status: 'stored',
		created_by: 1
	});

	addTimelineEvent('green_bean', gb3, 'created', '生豆入库登记完成', 1);
	addTimelineEvent('green_bean', gb3, 'inspection', '水分/密度检测完成，合格', 1);
	addTimelineEvent('green_bean', gb3, 'status_change', '状态变更为: stored', 1);

	createRoastingPlan({
		green_bean_id: gb1,
		plan_date: '2026-06-05',
		target_roast_level: '浅烘焙',
		batch_size_kg: 12,
		expected_output_kg: 10.2,
		priority: 'high',
		assigned_roaster: 1,
		notes: '渠道加急，需6月7日前交付',
		created_by: 1
	});

	createRoastingPlan({
		green_bean_id: gb1,
		plan_date: '2026-06-06',
		target_roast_level: '中烘焙',
		batch_size_kg: 15,
		expected_output_kg: 12.75,
		priority: 'normal',
		assigned_roaster: 1,
		notes: '常规订单补货',
		created_by: 1
	});

	createRoastingPlan({
		green_bean_id: gb3,
		plan_date: '2026-06-07',
		target_roast_level: '极浅烘焙',
		batch_size_kg: 5,
		expected_output_kg: 4.25,
		priority: 'urgent',
		assigned_roaster: 1,
		notes: '精品批次，杯测后再决定是否批量生产',
		created_by: 1
	});

	createException({
		entity_type: 'green_bean',
		entity_id: gb2,
		severity: 'medium',
		title: '入库检测水分偏高',
		description: '哥伦比亚慧兰批次水分含量10.8%，接近上限11%，需关注存储条件',
		created_by: 1
	});
}
