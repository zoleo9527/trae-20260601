-- 修复历史分级数据：将 REJECTED 等非法值统一归一为 SCRAP
-- 执行时间: 数据库初始化或发现脏数据时
-- 影响表: gradings

BEGIN;

-- 1. 将所有非法分级值更新为 SCRAP
UPDATE gradings
SET level = 'SCRAP'
WHERE level NOT IN ('A', 'B', 'C', 'SCRAP')
   OR level = 'REJECTED'
   OR level = 'rejected';

-- 2. 输出更新统计
SELECT '更新记录数: ' || COUNT(*)::text
FROM gradings
WHERE level NOT IN ('A', 'B', 'C', 'SCRAP');

COMMIT;

-- 验证结果
SELECT level, COUNT(*) as count
FROM gradings
GROUP BY level
ORDER BY count DESC;
