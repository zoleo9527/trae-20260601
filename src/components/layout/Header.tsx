import { Bell, Search, User } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-14 bg-[#1a1a2e] border-b border-[#16213e] flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]"
          />
          <input
            type="text"
            placeholder="搜索工单号、车牌号、技师..."
            className="w-full pl-10 pr-4 py-2 bg-[#16213e] border border-[#16213e] rounded-lg text-sm text-[#eaeaea] placeholder-[#a0a0a0] focus:outline-none focus:border-[#e94560] transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-[#16213e] rounded-lg transition-colors group">
          <Bell size={20} className="text-[#a0a0a0] group-hover:text-[#eaeaea]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#e94560] rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-[#16213e]">
          <div className="text-right">
            <p className="text-sm font-medium text-[#eaeaea]">店长王明</p>
            <p className="text-xs text-[#a0a0a0]">管理员</p>
          </div>
          <div className="w-10 h-10 bg-[#0f3460] rounded-full flex items-center justify-center">
            <User size={20} className="text-[#eaeaea]" />
          </div>
        </div>
      </div>
    </header>
  );
}
