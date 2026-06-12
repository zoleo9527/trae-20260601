import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Card, Row, Col, Tag, Button, Spin, Empty } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { propertyAPI } from '../services/api';
import { decorationNames } from '../types';
const getStatusDisplay = (status) => {
    const statusMap = {
        vacant: { label: '空置', color: '#52c41a' },
        viewing_scheduled: { label: '预约看房', color: '#1890ff' },
        viewing_completed: { label: '看房完成', color: '#13c2c2' },
        quotation_pending: { label: '待报价', color: '#faad14' },
        quotation_submitted: { label: '已报价待确认', color: '#fa8c16' },
        quotation_approved: { label: '报价已确认', color: '#722ed1' },
        contract_drafting: { label: '合同起草中', color: '#1890ff' },
        contract_reviewing: { label: '合同审核中', color: '#722ed1' },
        contract_signed: { label: '合同已签署', color: '#52c41a' },
        handover_pending: { label: '待交接', color: '#faad14' },
        handover_completed: { label: '交接完成', color: '#52c41a' },
        occupied: { label: '已入住', color: '#52c41a' },
        checkout_pending: { label: '待退租', color: '#fa8c16' },
        checkout_completed: { label: '已退租', color: '#8c8c8c' },
    };
    return statusMap[status] || { label: status, color: '#d9d9d9' };
};
const statusOptions = Object.entries({
    vacant: '空置',
    viewing_scheduled: '预约看房',
    viewing_completed: '看房完成',
    quotation_pending: '待报价',
    quotation_submitted: '已报价待确认',
    quotation_approved: '报价已确认',
    contract_drafting: '合同起草中',
    contract_reviewing: '合同审核中',
    contract_signed: '合同已签署',
    handover_pending: '待交接',
    handover_completed: '交接完成',
    occupied: '已入住',
    checkout_pending: '待退租',
    checkout_completed: '已退租',
}).map(([value, label]) => ({ value, label }));
const floorOptions = ['1F', '2F', '3F', '4F', '5F', '6F', '7F', '8F', '9F', '10F'].map((floor) => ({
    value: floor,
    label: floor,
}));
const buildingOptions = ['A座', 'B座', 'C座'].map((building) => ({
    value: building,
    label: building,
}));
const PropertyList = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [building, setBuilding] = useState('');
    const [floor, setFloor] = useState('');
    const [status, setStatus] = useState('');
    const [keyword, setKeyword] = useState('');
    const fetchProperties = async () => {
        setLoading(true);
        try {
            const params = {};
            if (building)
                params.building = building;
            if (floor)
                params.floor = floor;
            if (status)
                params.status = status;
            const response = await propertyAPI.list(params);
            let data = response.data;
            if (keyword) {
                data = data.filter((p) => p.roomNumber.includes(keyword) ||
                    p.building.includes(keyword) ||
                    p.floor.includes(keyword));
            }
            setProperties(data);
        }
        catch (error) {
            console.error('Failed to fetch properties:', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchProperties();
    }, [building, floor, status]);
    const handleSearch = () => {
        fetchProperties();
    };
    const handleReset = () => {
        setBuilding('');
        setFloor('');
        setStatus('');
        setKeyword('');
    };
    const handleCardClick = (id) => {
        navigate(`/properties/${id}`);
    };
    const renderPropertyCard = (property) => {
        const statusDisplay = property.statusDisplay || getStatusDisplay(property.status);
        const location = `${property.building} ${property.floor} ${property.roomNumber}`;
        return (_jsx(Col, { xs: 24, sm: 12, lg: 8, xl: 6, children: _jsxs(Card, { className: "property-card", hoverable: true, onClick: () => handleCardClick(property.id), children: [_jsxs("div", { className: "property-card-header", children: [_jsxs("div", { children: [_jsx("h3", { className: "property-title", children: location }), _jsx("div", { style: { marginTop: 4 }, children: _jsx(Tag, { color: statusDisplay.color, children: statusDisplay.label }) })] }), _jsxs("div", { className: "property-price", children: ["\u00A5", property.unitPrice, "/\u33A1"] })] }), _jsxs("div", { className: "property-info", children: [_jsxs("span", { children: ["\u9762\u79EF\uFF1A", property.area, "\u33A1"] }), _jsxs("span", { children: ["\u88C5\u4FEE\uFF1A", decorationNames[property.decoration]] }), _jsxs("span", { children: ["\u671D\u5411\uFF1A", property.orientation] })] }), property.facilities && property.facilities.length > 0 && (_jsx("div", { className: "property-facilities", children: property.facilities.map((facility, index) => (_jsx("span", { className: "facility-tag", children: facility }, index))) }))] }) }, property.id));
    };
    return (_jsxs("div", { children: [_jsx("div", { className: "page-header", children: _jsx("h1", { className: "page-title", children: "\u623F\u6E90\u7BA1\u7406" }) }), _jsxs("div", { className: "filter-bar", children: [_jsx(Input, { placeholder: "\u641C\u7D22\u623F\u6E90\u4F4D\u7F6E", prefix: _jsx(SearchOutlined, {}), value: keyword, onChange: (e) => setKeyword(e.target.value), onPressEnter: handleSearch, style: { width: 200 } }), _jsx(Select, { placeholder: "\u9009\u62E9\u697C\u5B87", value: building || undefined, onChange: setBuilding, allowClear: true, style: { width: 150 }, options: buildingOptions }), _jsx(Select, { placeholder: "\u9009\u62E9\u697C\u5C42", value: floor || undefined, onChange: setFloor, allowClear: true, style: { width: 150 }, options: floorOptions }), _jsx(Select, { placeholder: "\u9009\u62E9\u72B6\u6001", value: status || undefined, onChange: setStatus, allowClear: true, style: { width: 180 }, options: statusOptions }), _jsx(Button, { type: "primary", icon: _jsx(SearchOutlined, {}), onClick: handleSearch, children: "\u641C\u7D22" }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: handleReset, children: "\u91CD\u7F6E" })] }), loading ? (_jsx("div", { style: { textAlign: 'center', padding: '60px 0' }, children: _jsx(Spin, { size: "large" }) })) : properties.length > 0 ? (_jsx(Row, { gutter: [16, 16], children: properties.map(renderPropertyCard) })) : (_jsx(Empty, { description: "\u6682\u65E0\u623F\u6E90\u6570\u636E" }))] }));
};
export default PropertyList;
