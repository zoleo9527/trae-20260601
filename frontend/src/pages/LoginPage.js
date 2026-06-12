import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import { authAPI } from '../services/api';
const LoginPage = () => {
    const navigate = useNavigate();
    const { login, loading, error, isAuthenticated, clearError } = useAuthStore();
    const [demoAccounts, setDemoAccounts] = useState([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);
    useEffect(() => {
        const fetchDemoAccounts = async () => {
            try {
                const response = await authAPI.getDemoAccounts();
                setDemoAccounts(response.data);
            }
            catch (error) {
                console.error('Failed to fetch demo accounts:', error);
            }
            finally {
                setLoadingAccounts(false);
            }
        };
        fetchDemoAccounts();
    }, []);
    const onFinish = async (values) => {
        try {
            await login(values.username, values.password);
            navigate('/dashboard');
        }
        catch (error) {
            console.error('Login failed:', error);
        }
    };
    const handleDemoLogin = async (account) => {
        try {
            await login(account.username, account.password);
            navigate('/dashboard');
        }
        catch (error) {
            console.error('Demo login failed:', error);
        }
    };
    return (_jsx("div", { className: "login-container", children: _jsxs("div", { className: "login-card", children: [_jsxs("div", { className: "login-header", children: [_jsx("h1", { children: "\u5199\u5B57\u697C\u79DF\u8D41\u7BA1\u7406\u7CFB\u7EDF" }), _jsx("p", { children: "\u79DF\u8D41\u62A5\u4EF7\u4E0E\u5408\u540C\u6D41\u8F6C\u5E73\u53F0" })] }), _jsxs("div", { className: "login-form", children: [error && (_jsx(Alert, { message: error, type: "error", showIcon: true, closable: true, onClose: clearError, style: { marginBottom: 20 } })), _jsxs(Form, { name: "login", onFinish: onFinish, autoComplete: "off", size: "large", children: [_jsx(Form.Item, { name: "username", rules: [{ required: true, message: '请输入用户名' }], children: _jsx(Input, { prefix: _jsx(UserOutlined, {}), placeholder: "\u7528\u6237\u540D" }) }), _jsx(Form.Item, { name: "password", rules: [{ required: true, message: '请输入密码' }], children: _jsx(Input.Password, { prefix: _jsx(LockOutlined, {}), placeholder: "\u5BC6\u7801" }) }), _jsx(Form.Item, { children: _jsx(Button, { type: "primary", htmlType: "submit", loading: loading, block: true, icon: _jsx(LoginOutlined, {}), children: "\u767B \u5F55" }) })] }), loadingAccounts ? (_jsxs("div", { style: { textAlign: 'center', padding: '20px' }, children: [_jsx(Spin, { size: "small" }), " \u52A0\u8F7D\u6F14\u793A\u8D26\u53F7..."] })) : (_jsxs("div", { className: "demo-accounts", children: [_jsx("h4", { children: "\u5FEB\u901F\u767B\u5F55 - \u6F14\u793A\u8D26\u53F7" }), demoAccounts.map((account) => (_jsxs("div", { className: "demo-account-item", onClick: () => handleDemoLogin(account), children: [_jsx("span", { className: "role", children: account.roleName }), _jsxs("span", { className: "account", children: [account.username, " / 123456"] })] }, account.username)))] }))] })] }) }));
};
export default LoginPage;
