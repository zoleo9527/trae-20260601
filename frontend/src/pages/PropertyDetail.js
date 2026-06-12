import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Descriptions, Tag, Tabs, Timeline, Button, Space, Modal, Form, Input, Spin, Alert, Table, Empty, } from 'antd';
import { ArrowLeftOutlined, EyeOutlined, FileTextOutlined, ContractOutlined, CarOutlined, DollarOutlined, } from '@ant-design/icons';
import { propertyAPI, logsAPI } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { decorationNames, viewingStatusNames, interestLevelNames, depositTypeNames, } from '../types';
const { TextArea } = Input;
const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [property, setProperty] = useState(null);
    const [viewings, setViewings] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [handovers, setHandovers] = useState([]);
    const [deposits, setDeposits] = useState([]);
    const [timeline, setTimeline] = useState([]);
    const [transitions, setTransitions] = useState([]);
    const [error, setError] = useState(null);
    const [transitionModalVisible, setTransitionModalVisible] = useState(false);
    const [selectedTransition, setSelectedTransition] = useState(null);
    const [transitionLoading, setTransitionLoading] = useState(false);
    useEffect(() => {
        if (!id)
            return;
        fetchData(id);
    }, [id]);
    const fetchData = async (propertyId) => {
        setLoading(true);
        setError(null);
        try {
            const [propertyRes, relatedRes, timelineRes, transitionsRes] = await Promise.all([
                propertyAPI.get(propertyId),
                propertyAPI.getRelated(propertyId),
                logsAPI.getTimeline('property', propertyId),
                propertyAPI.getAvailableTransitions(propertyId),
            ]);
            setProperty(propertyRes.data);
            setViewings(relatedRes.data.viewings);
            setQuotations(relatedRes.data.quotations);
            setContracts(relatedRes.data.contracts);
            setHandovers(relatedRes.data.handovers);
            setDeposits(relatedRes.data.deposits);
            setTimeline(timelineRes.data);
            setTransitions(transitionsRes.data);
        }
        catch (err) {
            setError(err.response?.data?.error || '加载房源详情失败');
        }
        finally {
            setLoading(false);
        }
    };
    const handleTransitionClick = (transition) => {
        setSelectedTransition(transition);
        form.resetFields();
        setTransitionModalVisible(true);
    };
    const handleTransitionConfirm = async () => {
        if (!id || !selectedTransition)
            return;
        try {
            const values = await form.validateFields();
            setTransitionLoading(true);
            await propertyAPI.transition(id, selectedTransition.to, values.remark);
            setTransitionModalVisible(false);
            fetchData(id);
        }
        catch (err) {
            setError(err.response?.data?.error || '状态转换失败');
        }
        finally {
            setTransitionLoading(false);
        }
    };
    const canPerformTransition = (transition) => {
        if (!user)
            return false;
        return transition.allowedRoles.includes(user.role);
    };
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('zh-CN');
    };
    const viewingColumns = [
        {
            title: '客户姓名',
            dataIndex: 'customerName',
            key: 'customerName',
        },
        {
            title: '联系电话',
            dataIndex: 'customerPhone',
            key: 'customerPhone',
        },
        {
            title: '预约时间',
            dataIndex: 'scheduledAt',
            key: 'scheduledAt',
            render: (text) => formatDate(text),
        },
        {
            title: '顾问',
            dataIndex: 'consultantName',
            key: 'consultantName',
        },
        {
            title: '兴趣程度',
            dataIndex: 'interestLevel',
            key: 'interestLevel',
            render: (level) => interestLevelNames[level] || level,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (_jsx(Tag, { color: status === 'completed' ? 'green' : status === 'cancelled' ? 'red' : 'blue', children: viewingStatusNames[status] || status })),
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (_jsx(Button, { type: "link", icon: _jsx(EyeOutlined, {}), onClick: () => navigate(`/viewings/${record.id}`), children: "\u67E5\u770B" })),
        },
    ];
    const quotationColumns = [
        {
            title: '报价单号',
            dataIndex: 'quotationNo',
            key: 'quotationNo',
        },
        {
            title: '客户姓名',
            dataIndex: 'customerName',
            key: 'customerName',
        },
        {
            title: '总金额',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount) => `¥${amount.toLocaleString()}`,
        },
        {
            title: '有效期至',
            dataIndex: 'validUntil',
            key: 'validUntil',
            render: (text) => formatDate(text),
        },
        {
            title: '状态',
            dataIndex: 'statusDisplay',
            key: 'status',
            render: (display) => (_jsx(Tag, { color: display?.color, children: display?.label })),
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (_jsx(Button, { type: "link", icon: _jsx(EyeOutlined, {}), onClick: () => navigate(`/quotations/${record.id}`), children: "\u67E5\u770B" })),
        },
    ];
    const contractColumns = [
        {
            title: '合同编号',
            dataIndex: 'contractNo',
            key: 'contractNo',
        },
        {
            title: '客户姓名',
            dataIndex: 'customerName',
            key: 'customerName',
        },
        {
            title: '租期',
            key: 'leaseTerm',
            render: (_, record) => `${record.leaseTerm}个月`,
        },
        {
            title: '月租金',
            dataIndex: 'monthlyRent',
            key: 'monthlyRent',
            render: (amount) => `¥${amount.toLocaleString()}`,
        },
        {
            title: '状态',
            dataIndex: 'statusDisplay',
            key: 'status',
            render: (display) => (_jsx(Tag, { color: display?.color, children: display?.label })),
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (_jsx(Button, { type: "link", icon: _jsx(EyeOutlined, {}), onClick: () => navigate(`/contracts/${record.id}`), children: "\u67E5\u770B" })),
        },
    ];
    const handoverColumns = [
        {
            title: '交接单号',
            dataIndex: 'handoverNo',
            key: 'handoverNo',
        },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            render: (type) => (type === 'move_in' ? '入住交接' : '退租交接'),
        },
        {
            title: '交接日期',
            dataIndex: 'handoverDate',
            key: 'handoverDate',
            render: (text) => formatDate(text),
        },
        {
            title: '状态',
            dataIndex: 'statusDisplay',
            key: 'status',
            render: (display) => (_jsx(Tag, { color: display?.color, children: display?.label })),
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (_jsx(Button, { type: "link", icon: _jsx(EyeOutlined, {}), onClick: () => navigate(`/handover/${record.id}`), children: "\u67E5\u770B" })),
        },
    ];
    const depositColumns = [
        {
            title: '押金单号',
            dataIndex: 'depositNo',
            key: 'depositNo',
        },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            render: (type) => depositTypeNames[type] || type,
        },
        {
            title: '金额',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => `¥${amount.toLocaleString()}`,
        },
        {
            title: '客户姓名',
            dataIndex: 'customerName',
            key: 'customerName',
        },
        {
            title: '状态',
            dataIndex: 'statusDisplay',
            key: 'status',
            render: (display) => (_jsx(Tag, { color: display?.color, children: display?.label })),
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (_jsx(Button, { type: "link", icon: _jsx(EyeOutlined, {}), onClick: () => navigate(`/deposits/${record.id}`), children: "\u67E5\u770B" })),
        },
    ];
    if (loading) {
        return (_jsx("div", { style: { textAlign: 'center', padding: '60px' }, children: _jsx(Spin, { size: "large" }) }));
    }
    if (error) {
        return _jsx(Alert, { message: "\u9519\u8BEF", description: error, type: "error", showIcon: true });
    }
    if (!property) {
        return _jsx(Empty, { description: "\u672A\u627E\u5230\u623F\u6E90\u4FE1\u606F" });
    }
    const tabItems = [
        {
            key: 'viewings',
            label: (_jsxs("span", { children: [_jsx(EyeOutlined, {}), "\u770B\u623F\u8BB0\u5F55 (", viewings.length, ")"] })),
            children: (_jsx(Table, { columns: viewingColumns, dataSource: viewings, rowKey: "id", locale: { emptyText: '暂无看房记录' } })),
        },
        {
            key: 'quotations',
            label: (_jsxs("span", { children: [_jsx(FileTextOutlined, {}), "\u62A5\u4EF7\u5355 (", quotations.length, ")"] })),
            children: (_jsx(Table, { columns: quotationColumns, dataSource: quotations, rowKey: "id", locale: { emptyText: '暂无报价单' } })),
        },
        {
            key: 'contracts',
            label: (_jsxs("span", { children: [_jsx(ContractOutlined, {}), "\u5408\u540C (", contracts.length, ")"] })),
            children: (_jsx(Table, { columns: contractColumns, dataSource: contracts, rowKey: "id", locale: { emptyText: '暂无合同' } })),
        },
        {
            key: 'handovers',
            label: (_jsxs("span", { children: [_jsx(CarOutlined, {}), "\u4EA4\u63A5\u5355 (", handovers.length, ")"] })),
            children: (_jsx(Table, { columns: handoverColumns, dataSource: handovers, rowKey: "id", locale: { emptyText: '暂无交接单' } })),
        },
        {
            key: 'deposits',
            label: (_jsxs("span", { children: [_jsx(DollarOutlined, {}), "\u62BC\u91D1\u8BB0\u5F55 (", deposits.length, ")"] })),
            children: (_jsx(Table, { columns: depositColumns, dataSource: deposits, rowKey: "id", locale: { emptyText: '暂无押金记录' } })),
        },
    ];
    const availableTransitions = transitions.filter(canPerformTransition);
    return (_jsxs("div", { children: [_jsxs("div", { className: "page-header", children: [_jsxs(Space, { children: [_jsx(Button, { icon: _jsx(ArrowLeftOutlined, {}), onClick: () => navigate('/properties'), children: "\u8FD4\u56DE\u5217\u8868" }), _jsxs("h1", { className: "page-title", children: [property.building, " ", property.floor, "\u5C42 ", property.roomNumber] }), property.statusDisplay && (_jsx(Tag, { color: property.statusDisplay.color, style: { fontSize: 14, padding: '4px 12px' }, children: property.statusDisplay.label }))] }), availableTransitions.length > 0 && (_jsx("div", { className: "action-bar", children: availableTransitions.map((transition) => (_jsx(Button, { type: "primary", onClick: () => handleTransitionClick(transition), children: transition.action }, transition.to))) }))] }), _jsxs("div", { className: "detail-section", children: [_jsx("h2", { className: "detail-section-title", children: "\u57FA\u672C\u4FE1\u606F" }), _jsxs(Descriptions, { bordered: true, column: 2, children: [_jsxs(Descriptions.Item, { label: "\u4F4D\u7F6E", children: [property.building, " ", property.floor, "\u5C42 ", property.roomNumber] }), _jsxs(Descriptions.Item, { label: "\u9762\u79EF", children: [property.area, " \u33A1"] }), _jsxs(Descriptions.Item, { label: "\u5355\u4EF7", children: ["\u00A5", property.unitPrice.toLocaleString(), " / \u33A1/\u6708"] }), _jsx(Descriptions.Item, { label: "\u88C5\u4FEE", children: decorationNames[property.decoration] || property.decoration }), _jsx(Descriptions.Item, { label: "\u671D\u5411", children: property.orientation }), _jsx(Descriptions.Item, { label: "\u72B6\u6001", children: property.statusDisplay?.label || property.status }), _jsx(Descriptions.Item, { label: "\u914D\u5957\u8BBE\u65BD", span: 2, children: _jsx(Space, { wrap: true, children: property.facilities.map((facility, index) => (_jsx(Tag, { className: "facility-tag", children: facility }, index))) }) }), property.description && (_jsx(Descriptions.Item, { label: "\u63CF\u8FF0", span: 2, children: property.description }))] })] }), _jsxs("div", { className: "detail-section", children: [_jsx("h2", { className: "detail-section-title", children: "\u5173\u8054\u6570\u636E" }), _jsx(Tabs, { items: tabItems, defaultActiveKey: "viewings" })] }), _jsxs("div", { className: "detail-section", children: [_jsx("h2", { className: "detail-section-title", children: "\u72B6\u6001\u6D41\u8F6C\u65F6\u95F4\u7EBF" }), _jsx("div", { className: "timeline-container", children: timeline.length > 0 ? (_jsx(Timeline, { items: timeline.map((event) => ({
                                color: event.newStatus ? 'blue' : 'gray',
                                children: (_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 500 }, children: event.title }), _jsx("div", { style: { color: '#666', margin: '4px 0' }, children: event.description }), _jsxs("div", { style: { fontSize: 12, color: '#999' }, children: [event.operator, " (", event.operatorRole, ") \u00B7 ", formatDate(event.timestamp)] })] })),
                            })) })) : (_jsx(Empty, { description: "\u6682\u65E0\u72B6\u6001\u6D41\u8F6C\u8BB0\u5F55" })) })] }), _jsxs(Modal, { title: selectedTransition?.action, open: transitionModalVisible, onOk: handleTransitionConfirm, onCancel: () => setTransitionModalVisible(false), confirmLoading: transitionLoading, okText: "\u786E\u8BA4", cancelText: "\u53D6\u6D88", children: [_jsxs("p", { style: { marginBottom: 16 }, children: ["\u786E\u5B9A\u8981\u5C06\u72B6\u6001\u4ECE ", _jsx("strong", { children: property.statusDisplay?.label }), " \u53D8\u66F4\u4E3A", ' ', _jsx("strong", { children: selectedTransition?.description }), " \u5417\uFF1F"] }), _jsx(Form, { form: form, layout: "vertical", children: _jsx(Form.Item, { name: "remark", label: "\u5907\u6CE8", rules: [{ required: true, message: '请输入备注信息' }], children: _jsx(TextArea, { rows: 4, placeholder: "\u8BF7\u8F93\u5165\u72B6\u6001\u53D8\u66F4\u7684\u5907\u6CE8\u4FE1\u606F..." }) }) })] })] }));
};
export default PropertyDetail;
