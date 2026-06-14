import { Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import UserSwitcher from "../common/UserSwitcher";

export default function AppHeader() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="sticky top-0 z-30 bg-cream-100/80 backdrop-blur-md border-b border-cream-200">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-wine-700 text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="font-serif text-base font-semibold text-ink-900 leading-tight">
              演出服装与尺码确认
            </div>
            <div className="text-[11px] text-ink-500 leading-tight mt-0.5">
              舞蹈培训机构·全流程追踪
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          {!isHome && (
            <Link to="/" className="btn btn-ghost text-sm">
              ← 返回工作台
            </Link>
          )}
          <div className="w-px h-6 bg-cream-300" />
          <UserSwitcher />
        </div>
      </div>
    </header>
  );
}
