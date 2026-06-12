import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import PropertyList from './pages/PropertyList';
import PropertyDetail from './pages/PropertyDetail';
import ViewingList from './pages/ViewingList';
import ViewingDetail from './pages/ViewingDetail';
import QuotationList from './pages/QuotationList';
import QuotationDetail from './pages/QuotationDetail';
import ContractList from './pages/ContractList';
import ContractDetail from './pages/ContractDetail';
import HandoverList from './pages/HandoverList';
import HandoverDetail from './pages/HandoverDetail';
import DepositList from './pages/DepositList';
import DepositDetail from './pages/DepositDetail';
import OperationLogs from './pages/OperationLogs';
function App() {
    const { checkAuth, isAuthenticated } = useAuthStore();
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsxs(Route, { path: "/", element: isAuthenticated ? _jsx(MainLayout, {}) : _jsx(Navigate, { to: "/login", replace: true }), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "properties", element: _jsx(PropertyList, {}) }), _jsx(Route, { path: "properties/:id", element: _jsx(PropertyDetail, {}) }), _jsx(Route, { path: "viewings", element: _jsx(ViewingList, {}) }), _jsx(Route, { path: "viewings/:id", element: _jsx(ViewingDetail, {}) }), _jsx(Route, { path: "quotations", element: _jsx(QuotationList, {}) }), _jsx(Route, { path: "quotations/:id", element: _jsx(QuotationDetail, {}) }), _jsx(Route, { path: "contracts", element: _jsx(ContractList, {}) }), _jsx(Route, { path: "contracts/:id", element: _jsx(ContractDetail, {}) }), _jsx(Route, { path: "handover", element: _jsx(HandoverList, {}) }), _jsx(Route, { path: "handover/:id", element: _jsx(HandoverDetail, {}) }), _jsx(Route, { path: "deposits", element: _jsx(DepositList, {}) }), _jsx(Route, { path: "deposits/:id", element: _jsx(DepositDetail, {}) }), _jsx(Route, { path: "logs", element: _jsx(OperationLogs, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
export default App;
