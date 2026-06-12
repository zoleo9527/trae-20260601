import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Timeline, Spin, Empty } from 'antd';
import { HomeOutlined, KeyOutlined, PercentageOutlined, FileTextOutlined, FileSearchOutlined, DollarOutlined, CheckCircleOutlined, } from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import { propertyAPI, depositAPI, quotationAPI, contractAPI, handoverAPI, logsAPI } from '../services/api';
import { roleNames } from '../types';
const Dashboard = () => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [propertyStats, setPropertyStats] = useState(null);
    const [depositStats, setDepositStats] = useState(null);
    const [pendingQuotations, setPendingQuotations] = useState([]);
    const [pendingContracts, setPendingContracts] = useState([]);
    const [pendingHandovers, setPendingHandovers] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [propertyRes, depositRes, quotationRes, contractRes, handoverRes, logsRes,] = await Promise.all([
                    propertyAPI.getStatistics(),
                    depositAPI.getStatistics(),
                    quotationAPI.list({ status: 'submitted' }),
                    contractAPI.list({ status: 'under_review' }),
                    handoverAPI.list({ status: 'pending' }),
                    logsAPI.list({ pageSize: 10 }),
                ]);
                setPropertyStats(propertyRes.data);
                setDepositStats(depositRes.data);
                setPendingQuotations(quotationRes.data);
                setPendingContracts(contractRes.data);
                setPendingHandovers(handoverRes.data);
                setRecentLogs(logsRes.data.list);
            }
            catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    const getTodoItems = () => {
        const items = [];
        if (user?.role === 'operation_manager' || user?.role === 'finance') {
            items.push({
                key: 'quotations',
                title: '待我审批的报价',
                count: pendingQuotations.length,
                icon: _jsx(FileTextOutlined, {}),
                status: 'processing',
            });
        }
        if (user?.role === 'operation_manager') {
            items.push({
                key: 'contracts',
                title: '待我审核的合同',
                count: pendingContracts.length,
                icon: _jsx(FileSearchOutlined, {}),
                status: 'processing',
            });
        }
        if (user?.role === 'rental_consultant' || user?.role === 'operation_manager') {
            items.push({
                key: 'handovers',
                title: '待交接的房源',
                count: pendingHandovers.length,
                icon: _jsx(KeyOutlined, {}),
                status: 'warning',
            });
        }
        return items;
    };
    const logColumns = [
        {
            title: '操作时间',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 180,
            render: (text) => new Date(text).toLocaleString('zh-CN'),
        },
        {
            title: '操作人',
            dataIndex: 'operatorName',
            key: 'operatorName',
            width: 100,
            render: (text, record) => (_jsxs("span", { children: [text, _jsx(Tag, { color: "blue", style: { marginLeft: 8 }, children: roleNames[record.operatorRole] })] })),
        },
        {
            title: '操作类型',
            dataIndex: 'action',
            key: 'action',
            width: 120,
            render: (text) => _jsx(Tag, { children: text }),
        },
        {
            title: '操作描述',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
    ];
    if (loading) {
        return (_jsx("div", { style: { textAlign: 'center', padding: '100px' }, children: _jsx(Spin, { size: "large" }) }));
    }
    const occupancyRate = propertyStats?.occupancyRate ?? 0;
    const vacantRate = (100 - occupancyRate).toFixed(1);
    const occupiedCount = propertyStats?.statusCounts?.occupied ?? 0;
    return (_jsxs("div", { children: [_jsxs("div", { className: "page-header", children: [_jsx("h2", { className: "page-title", children: "\u5DE5\u4F5C\u53F0" }), _jsxs("div", { style: { color: '#666' }, children: ["\u6B22\u8FCE\u56DE\u6765\uFF0C", user?.name, "\uFF01", _jsx(Tag, { color: "green", style: { marginLeft: 8 }, children: user ? roleNames[user.role] : '' })] })] }), _jsxs(Row, { gutter: [16, 16], style: { marginBottom: 24 }, children: [_jsx(Col, { xs: 24, sm: 12, md: 8, lg: 4, children: _jsx("div", { className: "stats-card", children: _jsx(Statistic, { title: _jsx("span", { className: "label", children: "\u603B\u623F\u6E90\u6570" }), value: propertyStats?.total ?? 0, prefix: _jsx(HomeOutlined, { style: { color: '#1890ff' } }), valueStyle: { fontSize: 28, fontWeight: 600 } }) }) }), _jsx(Col, { xs: 24, sm: 12, md: 8, lg: 4, children: _jsx("div", { className: "stats-card", children: _jsx(Statistic, { title: _jsx("span", { className: "label", children: "\u5728\u79DF\u623F\u6E90\u6570" }), value: occupiedCount, prefix: _jsx(CheckCircleOutlined, { style: { color: '#52c41a' } }), valueStyle: { fontSize: 28, fontWeight: 600, color: '#52c41a' } }) }) }), _jsx(Col, { xs: 24, sm: 12, md: 8, lg: 4, children: _jsx("div", { className: "stats-card", children: _jsx(Statistic, { title: _jsx("span", { className: "label", children: "\u7A7A\u7F6E\u7387" }), value: vacantRate, suffix: "%", prefix: _jsx(PercentageOutlined, { style: { color: '#faad14' } }), valueStyle: { fontSize: 28, fontWeight: 600, color: '#faad14' } }) }) }), _jsx(Col, { xs: 24, sm: 12, md: 8, lg: 4, children: _jsx("div", { className: "stats-card", children: _jsx(Statistic, { title: _jsx("span", { className: "label", children: "\u5F85\u5904\u7406\u62A5\u4EF7\u6570" }), value: pendingQuotations.length, prefix: _jsx(FileTextOutlined, { style: { color: '#1890ff' } }), valueStyle: { fontSize: 28, fontWeight: 600 } }) }) }), _jsx(Col, { xs: 24, sm: 12, md: 8, lg: 4, children: _jsx("div", { className: "stats-card", children: _jsx(Statistic, { title: _jsx("span", { className: "label", children: "\u5F85\u5BA1\u6838\u5408\u540C\u6570" }), value: pendingContracts.length, prefix: _jsx(FileSearchOutlined, { style: { color: '#722ed1' } }), valueStyle: { fontSize: 28, fontWeight: 600 } }) }) }), _jsx(Col, { xs: 24, sm: 12, md: 8, lg: 4, children: _jsx("div", { className: "stats-card", children: _jsx(Statistic, { title: _jsx("span", { className: "label", children: "\u62BC\u91D1\u603B\u989D" }), value: depositStats?.totalPaid ?? 0, precision: 2, prefix: _jsx(DollarOutlined, { style: { color: '#f5222d' } }), valueStyle: { fontSize: 28, fontWeight: 600, color: '#f5222d' } }) }) })] }), _jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, lg: 8, children: _jsx(Card, { title: "\u5F85\u529E\u4E8B\u9879", className: "table-container", children: getTodoItems().length > 0 ? (_jsx(Timeline, { items: getTodoItems().map((item) => ({
                                    color: item.status === 'processing' ? 'blue' : 'orange',
                                    dot: item.icon,
                                    children: (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("span", { children: item.title }), _jsxs(Tag, { color: item.status === 'processing' ? 'blue' : 'orange', children: [item.count, " \u6761"] })] })),
                                })) })) : (_jsx(Empty, { description: "\u6682\u65E0\u5F85\u529E\u4E8B\u9879" })) }) }), _jsx(Col, { xs: 24, lg: 16, children: _jsx(Card, { title: "\u6700\u8FD1\u64CD\u4F5C\u65E5\u5FD7", className: "table-container", children: recentLogs.length > 0 ? (_jsx(Table, { columns: logColumns, dataSource: recentLogs, rowKey: "id", pagination: false, size: "small" })) : (_jsx(Empty, { description: "\u6682\u65E0\u64CD\u4F5C\u65E5\u5FD7" })) }) })] })] }));
};
export default Dashboard;
