CREATE TABLE IF NOT EXISTS `sys_user` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    `password` VARCHAR(100) NOT NULL COMMENT '密码',
    `real_name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
    `role` VARCHAR(20) NOT NULL COMMENT '角色：SALESMAN（导购）、DESIGNER（设计师）、WAREHOUSE（仓库员）、ADMIN（管理员）',
    `phone` VARCHAR(20) COMMENT '联系电话',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0禁用，1启用',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE IF NOT EXISTS `customer` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '客户ID',
    `name` VARCHAR(50) NOT NULL COMMENT '客户姓名',
    `phone` VARCHAR(20) NOT NULL COMMENT '联系电话',
    `address` VARCHAR(200) COMMENT '地址',
    `remark` VARCHAR(500) COMMENT '备注',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户表';

CREATE TABLE IF NOT EXISTS `measurement_record` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '量房记录ID',
    `customer_id` BIGINT NOT NULL COMMENT '客户ID',
    `salesman_id` BIGINT NOT NULL COMMENT '导购ID',
    `designer_id` BIGINT COMMENT '设计师ID',
    `room_type` VARCHAR(50) NOT NULL COMMENT '房型：客厅、卧室、厨房、卫生间、阳台',
    `length` DECIMAL(10,2) NOT NULL COMMENT '长度(米)',
    `width` DECIMAL(10,2) NOT NULL COMMENT '宽度(米)',
    `height` DECIMAL(10,2) COMMENT '高度(米)',
    `area` DECIMAL(10,2) NOT NULL COMMENT '面积(平方米)',
    `windows_info` VARCHAR(500) COMMENT '窗户信息',
    `doors_info` VARCHAR(500) COMMENT '门信息',
    `wall_info` VARCHAR(500) COMMENT '墙面情况',
    `floor_info` VARCHAR(500) COMMENT '地面情况',
    `photos` TEXT COMMENT '照片路径，JSON数组',
    `remark` VARCHAR(1000) COMMENT '备注',
    `status` VARCHAR(20) DEFAULT 'PENDING' COMMENT '状态：PENDING(待处理)、MEASURED(已量房)、IN_DESIGN(设计中)、COMPLETED(已完成)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`),
    FOREIGN KEY (`salesman_id`) REFERENCES `sys_user`(`id`),
    FOREIGN KEY (`designer_id`) REFERENCES `sys_user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='量房记录表';

CREATE TABLE IF NOT EXISTS `measurement_history` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '历史记录ID',
    `measurement_id` BIGINT NOT NULL COMMENT '量房记录ID',
    `operator_id` BIGINT NOT NULL COMMENT '操作人ID',
    `operator_role` VARCHAR(20) NOT NULL COMMENT '操作人角色',
    `action` VARCHAR(50) NOT NULL COMMENT '操作类型：CREATE、UPDATE、ASSIGN、COMPLETE',
    `before_data` TEXT COMMENT '操作前数据(JSON)',
    `after_data` TEXT COMMENT '操作后数据(JSON)',
    `remark` VARCHAR(500) COMMENT '操作备注',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    FOREIGN KEY (`measurement_id`) REFERENCES `measurement_record`(`id`),
    FOREIGN KEY (`operator_id`) REFERENCES `sys_user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='量房历史记录表';

CREATE TABLE IF NOT EXISTS `product` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '产品ID',
    `code` VARCHAR(50) NOT NULL UNIQUE COMMENT '产品编号',
    `name` VARCHAR(100) NOT NULL COMMENT '产品名称',
    `category` VARCHAR(50) COMMENT '类别：抛光砖、抛釉砖、仿古砖、大理石瓷砖、马赛克',
    `specification` VARCHAR(50) COMMENT '规格(mm)：如800*800',
    `color` VARCHAR(50) COMMENT '颜色',
    `price` DECIMAL(10,2) NOT NULL COMMENT '单价(元/平方米)',
    `stock` INT DEFAULT 0 COMMENT '库存数量',
    `status` TINYINT DEFAULT 1 COMMENT '状态：0禁用，1启用',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品表';

CREATE TABLE IF NOT EXISTS `quotation` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '报价单ID',
    `measurement_id` BIGINT NOT NULL COMMENT '量房记录ID',
    `customer_id` BIGINT NOT NULL COMMENT '客户ID',
    `designer_id` BIGINT NOT NULL COMMENT '设计师ID',
    `total_amount` DECIMAL(12,2) NOT NULL COMMENT '总金额',
    `discount` DECIMAL(5,2) DEFAULT 1.00 COMMENT '折扣',
    `final_amount` DECIMAL(12,2) NOT NULL COMMENT '最终金额',
    `valid_until` DATE COMMENT '报价有效期',
    `status` VARCHAR(20) DEFAULT 'DRAFT' COMMENT '状态：DRAFT(草稿)、SUBMITTED(已提交)、APPROVED(已审核)、REJECTED(已拒绝)、SIGNED(已签约)',
    `remark` VARCHAR(1000) COMMENT '备注',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (`measurement_id`) REFERENCES `measurement_record`(`id`),
    FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`),
    FOREIGN KEY (`designer_id`) REFERENCES `sys_user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价单表';

CREATE TABLE IF NOT EXISTS `quotation_item` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '报价明细ID',
    `quotation_id` BIGINT NOT NULL COMMENT '报价单ID',
    `product_id` BIGINT NOT NULL COMMENT '产品ID',
    `product_name` VARCHAR(100) NOT NULL COMMENT '产品名称',
    `specification` VARCHAR(50) COMMENT '规格',
    `color` VARCHAR(50) COMMENT '颜色',
    `unit_price` DECIMAL(10,2) NOT NULL COMMENT '单价',
    `quantity` DECIMAL(10,2) NOT NULL COMMENT '数量(平方米)',
    `amount` DECIMAL(12,2) NOT NULL COMMENT '金额',
    `remark` VARCHAR(200) COMMENT '备注',
    FOREIGN KEY (`quotation_id`) REFERENCES `quotation`(`id`),
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价明细表';

CREATE TABLE IF NOT EXISTS `quotation_history` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '报价历史ID',
    `quotation_id` BIGINT NOT NULL COMMENT '报价单ID',
    `operator_id` BIGINT NOT NULL COMMENT '操作人ID',
    `operator_role` VARCHAR(20) NOT NULL COMMENT '操作人角色',
    `action` VARCHAR(50) NOT NULL COMMENT '操作类型：CREATE、UPDATE、SUBMIT、APPROVE、REJECT、SIGN',
    `before_data` TEXT COMMENT '操作前数据(JSON)',
    `after_data` TEXT COMMENT '操作后数据(JSON)',
    `remark` VARCHAR(500) COMMENT '操作备注',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    FOREIGN KEY (`quotation_id`) REFERENCES `quotation`(`id`),
    FOREIGN KEY (`operator_id`) REFERENCES `sys_user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报价历史记录表';

INSERT INTO `sys_user` (`username`, `password`, `real_name`, `role`, `phone`, `status`) VALUES
('admin', 'admin123', '管理员', 'ADMIN', '13800138000', 1),
('salesman001', '123456', '导购张三', 'SALESMAN', '13800138001', 1),
('designer001', '123456', '设计师李四', 'DESIGNER', '13800138002', 1),
('warehouse001', '123456', '仓库员王五', 'WAREHOUSE', '13800138003', 1);

INSERT INTO `product` (`code`, `name`, `category`, `specification`, `color`, `price`, `stock`) VALUES
('PZ001', '抛光砖-皓月白', '抛光砖', '800*800', '白色', 88.00, 1000),
('PZ002', '抛光砖-雅士灰', '抛光砖', '800*800', '灰色', 95.00, 800),
('PY001', '抛釉砖-金玉满堂', '抛釉砖', '600*600', '金色', 128.00, 500),
('PY002', '抛釉砖-水墨江南', '抛釉砖', '800*800', '黑色', 138.00, 600),
('FG001', '仿古砖-复古情怀', '仿古砖', '600*600', '棕色', 118.00, 400),
('DL001', '大理石瓷砖-雅士白', '大理石瓷砖', '800*800', '白色', 198.00, 300),
('DL002', '大理石瓷砖-爵士白', '大理石瓷砖', '1200*600', '白色', 268.00, 200),
('MSK001', '马赛克-七彩斑斓', '马赛克', '300*300', '彩色', 68.00, 1200);