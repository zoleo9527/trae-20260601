const roleMap = {
    business: { name: '商务', color: '#1890ff' },
    director: { name: '编导', color: '#52c41a' },
    agent: { name: '达人经纪', color: '#eb2f96' }
};

const userMap = {
    business_1: { name: '李明', role: 'business', avatar: '👨‍💼' },
    business_2: { name: '王芳', role: 'business', avatar: '👩‍💼' },
    director_1: { name: '张伟', role: 'director', avatar: '👨‍🎬' },
    director_2: { name: '刘洋', role: 'director', avatar: '👩‍🎬' },
    agent_1: { name: '陈静', role: 'agent', avatar: '👩‍💻' },
    agent_2: { name: '赵磊', role: 'agent', avatar: '👨‍💻' }
};

const statusMap = {
    pending: { name: '待处理', color: '#faad14' },
    processing: { name: '处理中', color: '#1890ff' },
    blocked: { name: '已卡点', color: '#f5222d' },
    approved: { name: '已通过', color: '#52c41a' },
    rejected: { name: '已驳回', color: '#ff4d4f' }
};

let projects = [
    {
        id: 'P001',
        brand: '雅诗兰黛',
        name: '小棕瓶精华618推广',
        assignee: 'business_1',
        status: 'blocked',
        priority: 'high',
        deadline: '2026-06-10',
        createdAt: '2026-06-01',
        updatedAt: '2026-06-05 14:30',
        updatedBy: 'director_1',
        briefStatus: 'blocked',
        scriptStatus: 'pending',
        blockedReason: '品牌方修改了核心卖点，需重新确认Brief',
        blockDays: 2,
        budget: '20-30万',
        talentType: '美妆、护肤',
        description: '618大促期间推广小棕瓶精华，主打修护抗老功效，目标受众25-35岁女性',
        history: [
            { time: '2026-06-01 10:00', user: 'business_1', action: '创建Brief', note: '初始需求录入' },
            { time: '2026-06-02 15:30', user: 'director_1', action: 'Brief评估', note: '需求清晰，可执行' },
            { time: '2026-06-03 09:00', user: 'agent_1', action: '达人匹配', note: '初步筛选5位达人' },
            { time: '2026-06-05 14:30', user: 'director_1', action: '卡点上报', note: '品牌方修改核心卖点' }
        ]
    },
    {
        id: 'P002',
        brand: '海尔',
        name: '冰箱新品开箱测评',
        assignee: 'director_2',
        status: 'pending',
        priority: 'urgent',
        deadline: '2026-06-08',
        createdAt: '2026-06-03',
        updatedAt: '2026-06-06 09:15',
        updatedBy: 'business_2',
        briefStatus: 'approved',
        scriptStatus: 'pending',
        blockedReason: '',
        blockDays: 0,
        budget: '8-12万',
        talentType: '家居、科技',
        description: '海尔新款零嵌冰箱上市，需要达人做开箱测评和场景化展示',
        history: [
            { time: '2026-06-03 14:00', user: 'business_2', action: '创建Brief', note: '新品推广需求' },
            { time: '2026-06-04 11:00', user: 'director_2', action: 'Brief通过', note: '需求确认完毕' },
            { time: '2026-06-06 09:15', user: 'business_2', action: '催办', note: '请尽快启动脚本创作' }
        ]
    },
    {
        id: 'P003',
        brand: '三只松鼠',
        name: '坚果礼盒节日营销',
        assignee: 'agent_1',
        status: 'processing',
        priority: 'medium',
        deadline: '2026-06-15',
        createdAt: '2026-06-02',
        updatedAt: '2026-06-05 16:45',
        updatedBy: 'agent_1',
        briefStatus: 'approved',
        scriptStatus: 'processing',
        blockedReason: '',
        blockDays: 0,
        budget: '15-20万',
        talentType: '美食、生活',
        description: '端午节坚果礼盒营销，主打送礼场景和性价比',
        scripts: [
            { id: 'S003-1', version: 'v1.0', status: 'approved', createdAt: '2026-06-04', content: '场景化开箱脚本...' },
            { id: 'S003-2', version: 'v2.0', status: 'processing', createdAt: '2026-06-05', content: '增加吃播互动环节...' }
        ],
        history: [
            { time: '2026-06-02 10:00', user: 'business_1', action: '创建Brief' },
            { time: '2026-06-03 14:00', user: 'director_1', action: 'Brief通过' },
            { time: '2026-06-04 09:00', user: 'director_1', action: '脚本v1.0提交' },
            { time: '2026-06-04 16:00', user: 'business_1', action: '脚本v1.0通过' },
            { time: '2026-06-05 16:45', user: 'agent_1', action: '脚本v2.0修改中', note: '优化达人推荐话术' }
        ]
    },
    {
        id: 'P004',
        brand: '小米',
        name: '手环8功能展示',
        assignee: 'director_1',
        status: 'blocked',
        priority: 'high',
        deadline: '2026-06-12',
        createdAt: '2026-06-01',
        updatedAt: '2026-06-04 11:20',
        updatedBy: 'director_1',
        briefStatus: 'approved',
        scriptStatus: 'blocked',
        blockedReason: '脚本v2被品牌方驳回，需大改创意方向',
        blockDays: 3,
        budget: '10-15万',
        talentType: '科技、运动',
        description: '小米手环8新品推广，主打健康监测和运动功能',
        scripts: [
            { id: 'S004-1', version: 'v1.0', status: 'rejected', createdAt: '2026-06-02', content: '功能参数展示脚本...', feedback: '太像说明书，不够生动' },
            { id: 'S004-2', version: 'v2.0', status: 'rejected', createdAt: '2026-06-03', content: '24小时场景化脚本...', feedback: '品牌方认为创意方向偏离' }
        ],
        history: [
            { time: '2026-06-01 09:00', user: 'business_2', action: '创建Brief' },
            { time: '2026-06-01 15:00', user: 'director_1', action: 'Brief通过' },
            { time: '2026-06-02 10:00', user: 'director_1', action: '脚本v1.0提交' },
            { time: '2026-06-02 17:00', user: 'business_2', action: '脚本v1.0驳回', note: '太像说明书' },
            { time: '2026-06-03 14:00', user: 'director_1', action: '脚本v2.0提交' },
            { time: '2026-06-04 11:20', user: 'business_2', action: '脚本v2.0驳回', note: '创意方向偏离，需要重新脑暴' }
        ]
    },
    {
        id: 'P005',
        brand: '优衣库',
        name: '夏季UT系列穿搭',
        assignee: 'agent_2',
        status: 'processing',
        priority: 'medium',
        deadline: '2026-06-18',
        createdAt: '2026-06-04',
        updatedAt: '2026-06-05 10:30',
        updatedBy: 'agent_2',
        briefStatus: 'approved',
        scriptStatus: 'processing',
        blockedReason: '',
        blockDays: 0,
        budget: '25-35万',
        talentType: '时尚、穿搭',
        description: '优衣库夏季UT联名系列穿搭展示',
        scripts: [
            { id: 'S005-1', version: 'v1.0', status: 'processing', createdAt: '2026-06-05', content: '多场景穿搭脚本...' }
        ],
        history: [
            { time: '2026-06-04 11:00', user: 'business_1', action: '创建Brief' },
            { time: '2026-06-04 16:00', user: 'director_2', action: 'Brief通过' },
            { time: '2026-06-05 10:30', user: 'agent_2', action: '脚本创作中', note: '已确定3位穿搭达人' }
        ]
    },
    {
        id: 'P006',
        brand: '美团外卖',
        name: '夜宵节促销短视频',
        assignee: 'business_2',
        status: 'pending',
        priority: 'urgent',
        deadline: '2026-06-07',
        createdAt: '2026-06-05',
        updatedAt: '2026-06-05 18:00',
        updatedBy: 'business_2',
        briefStatus: 'pending',
        scriptStatus: 'pending',
        blockedReason: '',
        blockDays: 0,
        budget: '5-8万',
        talentType: '美食、搞笑',
        description: '美团外卖夜宵节促销，需要3条15秒短视频',
        history: [
            { time: '2026-06-05 18:00', user: 'business_2', action: '创建Brief', note: '紧急项目，需尽快启动' }
        ]
    },
    {
        id: 'P007',
        brand: '戴森',
        name: '吹风机专业测评',
        assignee: 'director_1',
        status: 'processing',
        priority: 'high',
        deadline: '2026-06-20',
        createdAt: '2026-05-28',
        updatedAt: '2026-06-06 08:45',
        updatedBy: 'director_1',
        briefStatus: 'approved',
        scriptStatus: 'approved',
        blockedReason: '',
        blockDays: 0,
        budget: '30-40万',
        talentType: '美妆、科技',
        description: '戴森Supersonic吹风机专业测评，对比竞品',
        scripts: [
            { id: 'S007-1', version: 'v1.0', status: 'approved', createdAt: '2026-06-02', content: '完整测评脚本...' }
        ],
        history: [
            { time: '2026-05-28 10:00', user: 'business_1', action: '创建Brief' },
            { time: '2026-05-29 15:00', user: 'director_1', action: 'Brief通过' },
            { time: '2026-06-02 14:00', user: 'director_1', action: '脚本提交' },
            { time: '2026-06-03 10:00', user: 'business_1', action: '脚本通过' },
            { time: '2026-06-06 08:45', user: 'director_1', action: '拍摄准备中', note: '已确认达人档期' }
        ]
    },
    {
        id: 'P008',
        brand: '元气森林',
        name: '气泡水夏日营销',
        assignee: 'agent_1',
        status: 'blocked',
        priority: 'medium',
        deadline: '2026-06-22',
        createdAt: '2026-06-02',
        updatedAt: '2026-06-04 15:00',
        updatedBy: 'agent_1',
        briefStatus: 'approved',
        scriptStatus: 'pending',
        blockedReason: '达人档期冲突，需重新匹配达人',
        blockDays: 2,
        budget: '18-25万',
        talentType: '生活、美食',
        description: '元气森林气泡水夏日营销，主打0糖0脂',
        history: [
            { time: '2026-06-02 09:00', user: 'business_2', action: '创建Brief' },
            { time: '2026-06-02 16:00', user: 'director_2', action: 'Brief通过' },
            { time: '2026-06-04 15:00', user: 'agent_1', action: '卡点上报', note: '原定达人档期冲突，需重新匹配' }
        ]
    },
    {
        id: 'P009',
        brand: '苹果',
        name: 'iPhone 15拍摄技巧',
        assignee: 'director_2',
        status: 'approved',
        priority: 'low',
        deadline: '2026-06-30',
        createdAt: '2026-05-20',
        updatedAt: '2026-06-03 12:00',
        updatedBy: 'business_1',
        briefStatus: 'approved',
        scriptStatus: 'approved',
        blockedReason: '',
        blockDays: 0,
        budget: '40-50万',
        talentType: '科技、摄影',
        description: 'iPhone 15摄影功能教学系列视频',
        scripts: [
            { id: 'S009-1', version: 'v1.0', status: 'approved', createdAt: '2026-05-25', content: '人像模式拍摄技巧...' },
            { id: 'S009-2', version: 'v1.0', status: 'approved', createdAt: '2026-05-28', content: '夜景模式拍摄技巧...' },
            { id: 'S009-3', version: 'v1.0', status: 'approved', createdAt: '2026-06-01', content: '电影模式拍摄技巧...' }
        ],
        history: [
            { time: '2026-05-20 10:00', user: 'business_1', action: '创建Brief' },
            { time: '2026-05-21 15:00', user: 'director_2', action: 'Brief通过' },
            { time: '2026-05-25 10:00', user: 'director_2', action: '脚本1提交' },
            { time: '2026-05-26 14:00', user: 'business_1', action: '脚本1通过' },
            { time: '2026-06-03 12:00', user: 'business_1', action: '全部脚本通过', note: '进入拍摄阶段' }
        ]
    },
    {
        id: 'P010',
        brand: '李宁',
        name: '运动鞋跑步测评',
        assignee: 'agent_2',
        status: 'pending',
        priority: 'urgent',
        deadline: '2026-06-09',
        createdAt: '2026-06-04',
        updatedAt: '2026-06-05 14:00',
        updatedBy: 'agent_2',
        briefStatus: 'pending',
        scriptStatus: 'pending',
        blockedReason: '',
        blockDays: 0,
        budget: '12-18万',
        talentType: '运动、健身',
        description: '李宁新款䨻科技跑步鞋测评',
        history: [
            { time: '2026-06-04 15:00', user: 'business_2', action: '创建Brief' },
            { time: '2026-06-05 14:00', user: 'agent_2', action: 'Brief评估中', note: '正在匹配运动达人' }
        ]
    }
];

let flowRecords = [
    {
        id: 'F001',
        projectId: 'P001',
        fromUser: 'business_1',
        toUser: 'director_1',
        time: '2026-06-02 15:30',
        action: 'Brief评估',
        note: '需求清晰，已转交编导评估可行性'
    },
    {
        id: 'F002',
        projectId: 'P001',
        fromUser: 'director_1',
        toUser: 'agent_1',
        time: '2026-06-03 09:00',
        action: '达人匹配',
        note: 'Brief通过，开始匹配达人'
    },
    {
        id: 'F003',
        projectId: 'P003',
        fromUser: 'director_1',
        toUser: 'business_1',
        time: '2026-06-04 09:00',
        action: '脚本审批',
        note: '脚本v1.0完成，请审批'
    },
    {
        id: 'F004',
        projectId: 'P004',
        fromUser: 'business_2',
        toUser: 'director_1',
        time: '2026-06-04 11:20',
        action: '脚本驳回',
        note: 'v2脚本创意方向偏离，请重新脑暴后再提交'
    },
    {
        id: 'F005',
        projectId: 'P007',
        fromUser: 'director_1',
        toUser: 'agent_2',
        time: '2026-06-06 08:45',
        action: '拍摄执行',
        note: '脚本已通过，确认达人档期'
    }
];

function getUserName(userId) {
    return userMap[userId] ? userMap[userId].name : '未知';
}

function getUserRole(userId) {
    return userMap[userId] ? userMap[userId].role : 'unknown';
}

function getUserAvatar(userId) {
    return userMap[userId] ? userMap[userId].avatar : '👤';
}

function getRoleName(role) {
    return roleMap[role] ? roleMap[role].name : '未知';
}

function getStatusName(status) {
    return statusMap[status] ? statusMap[status].name : '未知';
}

function getStatusColor(status) {
    return statusMap[status] ? statusMap[status].color : '#999';
}

function getRoleColor(role) {
    return roleMap[role] ? roleMap[role].color : '#999';
}

function getProjectById(id) {
    return projects.find(p => p.id === id);
}

function getUrgentProjects() {
    return projects.filter(p => p.priority === 'urgent' && p.status !== 'approved');
}

function getBlockedProjects() {
    return projects.filter(p => p.status === 'blocked');
}

function getRecentUpdated(limit = 8) {
    return [...projects]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, limit);
}

function getPendingMyRole(role) {
    return projects.filter(p => {
        const userRole = getUserRole(p.assignee);
        return userRole === role && p.status !== 'approved';
    });
}