import { SidebarItem } from '../types';

export const ROLE_CONFIG = {
  dispatcher: {
    name: '接车员',
    color: 'dispatcher',
    description: '负责车辆接收和信息登记',
  },
  inspector: {
    name: '检测员',
    color: 'inspector',
    description: '负责车辆检测和报告编制',
  },
  auditor: {
    name: '审核员',
    color: 'auditor',
    description: '负责报告审核和发放',
  },
  admin: {
    name: '管理员',
    color: 'admin',
    description: '负责全局管理和统计分析',
  },
};

export const DISPATCHER_SIDEBAR: SidebarItem[] = [
  { id: 'dashboard', label: '工作台', path: '/dispatcher/dashboard', icon: 'LayoutDashboard' },
  { id: 'register', label: '车辆登记', path: '/dispatcher/register', icon: 'FilePlus' },
  { id: 'tasks', label: '任务列表', path: '/dispatcher/tasks', icon: 'ListTodo' },
];

export const INSPECTOR_SIDEBAR: SidebarItem[] = [
  { id: 'dashboard', label: '工作台', path: '/inspector/dashboard', icon: 'LayoutDashboard' },
  { id: 'tasks', label: '检测任务', path: '/inspector/tasks', icon: 'ClipboardCheck' },
  { id: 'reports', label: '我的报告', path: '/inspector/reports', icon: 'FileText' },
];

export const AUDITOR_SIDEBAR: SidebarItem[] = [
  { id: 'dashboard', label: '工作台', path: '/auditor/dashboard', icon: 'LayoutDashboard' },
  { id: 'reports', label: '待审核', path: '/auditor/reports', icon: 'ClipboardList' },
  { id: 'distribution', label: '报告发放', path: '/auditor/distribution', icon: 'Send' },
];

export const ADMIN_SIDEBAR: SidebarItem[] = [
  { id: 'dashboard', label: '全局概览', path: '/admin/dashboard', icon: 'LayoutDashboard' },
  { id: 'followup', label: '回访管理', path: '/admin/followup', icon: 'PhoneCall' },
  { id: 'history', label: '回访历史', path: '/admin/history', icon: 'History' },
  { id: 'reports', label: '统计报表', path: '/admin/reports', icon: 'BarChart3' },
];

export const INSPECTION_ITEMS = [
  { id: '1', name: '外观检查', description: '车身外观、标识、灯具等' },
  { id: '2', name: '灯光检查', description: '前照灯、转向灯、刹车灯等' },
  { id: '3', name: '制动检查', description: '行车制动、驻车制动' },
  { id: '4', name: '尾气检查', description: '排放污染物检测' },
  { id: '5', name: '底盘检查', description: '底盘部件、传动系统' },
  { id: '6', name: '安全装置', description: '安全带、灭火器、三角牌' },
];

export const CAR_BRANDS = [
  '宝马', '奔驰', '奥迪', '大众', '丰田', '本田', '日产',
  '比亚迪', '吉利', '长安', '长城', '奇瑞', '其他'
];
