import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Layout, Menu } from 'antd';
import { DashboardOutlined, HomeOutlined, EyeOutlined, FileTextOutlined, FileSearchOutlined, SwapOutlined, DollarOutlined, HistoryOutlined, UserOutlined, LogoutOutlined, BuildingOutlined, } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { roleNames } from '../types';
const { Header, Sider, Content } = Layout;
const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [collapsed, setCollapsed] = useState(false);
    const menuItems = [
        {
            key: '/dashboard',
            icon: _jsx(DashboardOutlined, {}),
            label: '工作台',
        },
        {
            key: '/properties',
            icon: _jsx(BuildingOutlined, {}),
            label: '房源台账',
        },
        {
            key: '/viewings',
            icon: _jsx(EyeOutlined, {}),
            label: '看房记录',
        },
        {
            key: '/quotations',
            icon: _jsx(FileTextOutlined, {}),
            label: '租赁报价',
        },
        {
            key: '/contracts',
            icon: _jsx(FileSearchOutlined, {}),
            label: '合同管理',
        },
        {
            key: '/handover',
            icon: _jsx(SwapOutlined, {}),
            label: '物业交接',
        },
        {
            key: '/deposits',
            icon: _jsx(DollarOutlined, {}),
            label: '押金结算',
        },
        {
            key: '/logs',
            icon: _jsx(HistoryOutlined, {}),
            label: '操作日志',
        },
    ];
    const handleMenuClick = ({ key }) => {
        navigate(key);
    };
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    const userMenuItems = [
        {
            key: 'info',
            icon: _jsx(UserOutlined, {}),
            label: (_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 500 }, children: user?.name }), _jsx("div", { style: { fontSize: 12, color: '#666' }, children: user ? roleNames[user.role] : '' })] })),
            disabled: true,
        },
        { type: 'divider' },
        {
            key: 'logout',
            icon: _jsx(LogoutOutlined, {}),
            label: '退出登录',
            onClick: handleLogout,
        },
    ];
    return (_jsxs(Layout, { className: "app-layout", children: [_jsxs(Sider, { collapsible: true, collapsed: collapsed, onCollapse: setCollapsed, theme: "dark", width: 220, children: [_jsxs("div", { style: {
                            height: 64,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            color: '#fff',
                            fontSize: collapsed ? 12 : 16,
                            fontWeight: 600,
                            borderBottom: '1px solid #1f1f1f',
                        }, children: [_jsx(HomeOutlined, { style: { fontSize: 20 } }), !collapsed && _jsx("span", { children: "\u79DF\u8D41\u7BA1\u7406\u7CFB\u7EDF" })] }), _jsx(Menu, { theme: "dark", mode: "inline", selectedKeys: [location.pathname], items: menuItems, onClick: handleMenuClick, style: { borderRight: 0 } })] }), _jsx(Layout, { children: _jsx(Header, { className: "app-header", children: _jsxs("div", { className: "app-logo", children: [_jsx(BuildingOutlined, {}), _jsx("span", { children: "\u5199\u5B57\u697C\u79DF\u8D41-" })] }) }) })] }));
};
