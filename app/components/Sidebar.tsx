import { Link, useLocation } from "@remix-run/react";
import {
    ClipboardList,
    Image,
    LayoutDashboard,
    MessageSquare,
    Users
} from "lucide-react";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function NavItem({ to, icon, label, active }: NavItemProps) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
        active
          ? "bg-primary-100 text-primary-700 font-medium"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      to: "/",
      icon: <LayoutDashboard size={20} />,
      label: "工作台",
    },
    {
      to: "/reviews",
      icon: <Image size={20} />,
      label: "作品点评",
    },
    {
      to: "/feedbacks",
      icon: <MessageSquare size={20} />,
      label: "家长反馈",
    },
    {
      to: "/todos",
      icon: <ClipboardList size={20} />,
      label: "待办事项",
    },
    {
      to: "/students",
      icon: <Users size={20} />,
      label: "学生管理",
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col sticky top-0">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl">
            🎨
          </div>
          <div>
            <h1 className="font-bold text-gray-900">艺培云</h1>
            <p className="text-xs text-gray-500">艺术培训管理系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            active={
              item.to === "/"
                ? currentPath === "/"
                : currentPath.startsWith(item.to)
            }
          />
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-lg">
            👩‍🎨
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">李老师</p>
            <p className="text-xs text-gray-500 truncate">任课老师</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
